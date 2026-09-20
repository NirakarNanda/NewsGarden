import {
  BaseAgent,
  type AgentResult,
} from "../BaseAgent.js";

import type {
  AgentTask,
} from "../../../types/task.js";

import {
  AIService,
} from "../../tools/ai/AIService.js";

import {
  Article,
} from "../../../models/Article.js";

import {
  NewspaperPage,
} from "../../../models/NewspaperPage.js";

import {
  generateTextWithRetry,
  extractJson,
  aiProviderName,
} from "../../utils/ai.js";

interface LayoutPageInput {

  editionId: string;

  pageNumber: number;

  articleIds: string[];
}

export type LayoutSlot =
  | "lead"
  | "secondary"
  | "brief";

export interface PageSlot {

  slot: LayoutSlot;

  articleId: string;

  headline: string;
}

interface AiRanking {

  // Article indices in display order.
  order: number[];

  slots: {
    index: number;
    slot: LayoutSlot;
  }[];
}

/*
 * Lays out one newspaper page: ranks the
 * page's stories with AI, assigns layout
 * slots (lead / secondary / brief), and
 * persists a NewspaperPage record.
 *
 * The stored page keeps slots in ranked
 * display order (lead first); the
 * lead/secondary/brief designation is
 * returned in the task output.
 *
 * On AI failure: retries once, then falls
 * back to a documented heuristic (lead =
 * longest body, then category priority)
 * and records aiFallback: true.
 */
export class PageLayoutAgent
  extends BaseAgent {

  id = "page-layout-agent";

  name = "Page Layout Agent";

  role =
    "Lay out individual newspaper pages";

  department = "design";

  private ai =
    new AIService();

  async execute(
    task: AgentTask
  ): Promise<AgentResult> {

    this.log(
      "Laying out page..."
    );

    const model =
      aiProviderName();

    let aiFallback = false;

    try {

      const input =
        task.input as LayoutPageInput;

      const articles =
        await Article.find({
          articleId: {
            $in: input.articleIds,
          },
        });

      if (
        articles.length === 0
      ) {

        throw new Error(
          "No articles found for page layout"
        );
      }

      // Preserve the requested order for
      // anything the AI does not rank.
      const byId = new Map(
        articles.map((a) => [
          a.articleId,
          a,
        ])
      );

      const ordered = input.articleIds
        .map((id) => byId.get(id))
        .filter(
          (
            a
          ): a is (typeof articles)[number] =>
            Boolean(a)
        );

      let slots: PageSlot[];

      try {

        const ranked =
          await this.rankWithAi(
            ordered.map((a) => ({
              headline:
                a.headline ??
                a.title,
              summary:
                a.summary ?? "",
              category:
                a.category,
            }))
          );

        slots = ranked.map(
          ({ index, slot }) => ({

            slot,

            articleId:
              ordered[index]!
                .articleId,

            headline:
              ordered[index]!
                .headline ??
              ordered[index]!.title,
          })
        );

      } catch (error) {

        this.log(
          `AI ranking failed (${error instanceof Error ? error.message : "unknown"}). Using heuristic layout.`
        );

        aiFallback = true;

        slots =
          this.heuristicLayout(
            ordered.map((a) => ({
              articleId:
                a.articleId,
              headline:
                a.headline ??
                a.title,
              category:
                a.category,
              bodyLength:
                a.body?.length ?? 0,
            }))
          );
      }

      const pageId = `${input.editionId}-page-${input.pageNumber}`;

      await this.persistPage(
        pageId,
        input.editionId,
        input.pageNumber,
        ordered,
        slots
      );

      this.log(
        `Page ${input.pageNumber} laid out with ${slots.length} slots.`
      );

      return {

        success: true,

        output: {

          pageId,

          editionId:
            input.editionId,

          pageNumber:
            input.pageNumber,

          slots,

          aiFallback,

          model,

          taskId: task.id,
        },
      };

    } catch (error) {

      this.log(
        "Page layout failed."
      );

      return {

        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      };
    }
  }

  /*
   * Returns slots in display order, each
   * carrying its original story index.
   */
  private async rankWithAi(
    stories: {
      headline: string;
      summary: string;
      category: string;
    }[]
  ): Promise<
    { index: number; slot: LayoutSlot }[]
  > {

    const listing = stories
      .map(
        (s, i) =>
          `${i}. [${s.category}] ${s.headline}` +
          (s.summary
            ? ` — ${s.summary.slice(0, 160)}`
            : "")
      )
      .join("\n");

    const prompt = `You are the layout editor of a serious daily newspaper.

Rank these stories for a single newspaper page and assign each a layout slot.

STORIES:
${listing}

Return ONLY valid JSON:
{"order": [2, 0, 1], "slots": [{"index": 2, "slot": "lead"}, {"index": 0, "slot": "secondary"}, {"index": 1, "slot": "brief"}]}

Rules:
- order lists every story index exactly once, most important first.
- Exactly one story gets slot "lead".
- Up to two get "secondary"; the rest get "brief".
- slot is only "lead", "secondary", or "brief".
- No markdown, no prose.`;

    const response =
      await generateTextWithRetry(
        this.ai,
        prompt
      );

    const ranking =
      extractJson<AiRanking>(
        response
      );

    if (
      !Array.isArray(
        ranking.order
      ) ||
      !Array.isArray(
        ranking.slots
      )
    ) {

      throw new Error(
        "Invalid AI ranking shape"
      );
    }

    const validSlots = new Set<
      string
    >(["lead", "secondary", "brief"]);

    const seen = new Set<number>();

    for (const index of ranking.order) {

      if (
        typeof index !== "number" ||
        index < 0 ||
        index >= stories.length ||
        seen.has(index)
      ) {

        throw new Error(
          "Invalid AI story order"
        );
      }

      seen.add(index);
    }

    let leadCount = 0;

    const orderedSlots =
      ranking.order.map(
        (index) => {

          const slotEntry =
            ranking.slots.find(
              (s) =>
                s.index === index
            );

          let slot: LayoutSlot =
            "brief";

          if (
            slotEntry &&
            validSlots.has(
              slotEntry.slot
            )
          ) {

            slot =
              slotEntry.slot;
          }

          if (
            slot === "lead"
          ) {

            leadCount++;
          }

          return { index, slot };
        }
      );

    // Guarantee exactly one lead story.
    if (leadCount !== 1) {

      orderedSlots.forEach(
        (s, i) => {

          s.slot =
            i === 0
              ? "lead"
              : i <= 2
                ? "secondary"
                : "brief";
        }
      );
    }

    return orderedSlots;
  }

  /*
   * Documented heuristic fallback: lead
   * goes to the longest body, then
   * category priority order.
   */
  private heuristicLayout(
    stories: {
      articleId: string;
      headline: string;
      category: string;
      bodyLength: number;
    }[]
  ): PageSlot[] {

    const categoryPriority: Record<
      string,
      number
    > = {

      technology: 0,

      science: 1,

      nature: 2,

      culture: 3,

      history: 4,
    };

    const ranked = [...stories].sort(
      (a, b) => {

        if (
          b.bodyLength !==
          a.bodyLength
        ) {

          return (
            b.bodyLength -
            a.bodyLength
          );
        }

        return (
          (categoryPriority[
            a.category
          ] ?? 9) -
          (categoryPriority[
            b.category
          ] ?? 9)
        );
      }
    );

    return ranked.map(
      (story, i) => ({

        slot:
          i === 0
            ? ("lead" as const)
            : i <= 2
              ? ("secondary" as const)
              : ("brief" as const),

        articleId:
          story.articleId,

        headline:
          story.headline,
      })
    );
  }

  private async persistPage(
    pageId: string,
    editionId: string,
    pageNumber: number,
    ordered: {
      articleId: string;
      imageUrl?: string;
    }[],
    slots: PageSlot[]
  ): Promise<void> {

    // The page model stores slots without
    // a slot-type field, so ranked display
    // order (lead first) carries the
    // ranking. Image URLs ride along for
    // the frontend.
    const byArticleId = new Map(
      ordered.map((a) => [
        a.articleId,
        a,
      ])
    );

    try {

      await NewspaperPage.create({

        pageId,

        editionId,

        pageNumber,

        slots: slots.map(
          (slot) => ({

            articleId:
              slot.articleId,

            headline:
              slot.headline,

            imageUrl:
              byArticleId.get(
                slot.articleId
              )?.imageUrl,
          })
        ),
      });

    } catch (error) {

      console.warn(
        "[PageLayoutAgent] Could not persist page:",

        error instanceof Error
          ? error.message
          : error
      );
    }
  }
}
