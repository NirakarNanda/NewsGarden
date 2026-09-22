import {
  BrainAgent,
} from "../brain/BrainAgent.js";

import {
  EditionManager,
} from "../brain/EditionManager.js";

import {
  NewspaperPage,
} from "../../models/NewspaperPage.js";

import {
  StoryWorkflow,
} from "./StoryWorkflow.js";

import {
  PageWorkflow,
} from "./PageWorkflow.js";

export interface DailyEditionOptions {

  title?: string;

  // Max stories to produce fully.
  maxArticles?: number;

  articlesPerPage?: number;

  // Pre-created edition id (the run service creates the edition first so
  // the 202 response can carry the id immediately). When supplied, the
  // workflow reuses it instead of creating a new edition.
  editionId?: string;
}

export interface DailyEditionSummary {

  editionId: string;

  title: string;

  discovered: number;

  storiesCompleted: string[];

  storiesFailed: {
    articleId: string;
    error: string;
  }[];

  pageCount: number;

  qualityPassed: boolean;

  aiFallback: boolean;

  status: string;
}

const DISCOVERY_JOBS: {
  agentId: string;
  type: string;
}[] = [

  {
    agentId: "tech-news-agent",
    type: "discover-tech-news",
  },

  {
    agentId:
      "science-news-agent",
    type: "discover-science-news",
  },

  {
    agentId: "culture-agent",
    type: "discover-culture-news",
  },

  {
    agentId: "history-agent",
    type: "discover-history-news",
  },

  {
    agentId: "nature-agent",
    type: "discover-nature-news",
  },
];

/*
 * Full daily pipeline:
 *
 *   create edition
 *     -> discovery (all 5 desks)
 *     -> StoryWorkflow per top article
 *     -> PageWorkflow
 *     -> quality review
 *     -> request human approval
 *
 * Emits EDITION_STAGE_COMPLETED between
 * stages. Never publishes: publication
 * needs a human approval record.
 */
export class DailyEditionWorkflow {

  private brain: BrainAgent;

  private editionManager: EditionManager;

  private storyWorkflow: StoryWorkflow;

  private pageWorkflow: PageWorkflow;

  constructor(
    deps: {
      brain?: BrainAgent;
      editionManager?: EditionManager;
      storyWorkflow?: StoryWorkflow;
      pageWorkflow?: PageWorkflow;
    } = {}
  ) {

    this.brain =
      deps.brain ?? new BrainAgent();

    this.editionManager =
      deps.editionManager ??
      new EditionManager();

    this.storyWorkflow =
      deps.storyWorkflow ??
      new StoryWorkflow();

    this.pageWorkflow =
      deps.pageWorkflow ??
      new PageWorkflow();
  }

  async run(
    options: DailyEditionOptions = {}
  ): Promise<DailyEditionSummary> {

    const maxArticles =
      options.maxArticles ?? 8;

    const articlesPerPage =
      options.articlesPerPage ??
      4;

    const today = new Date();

    const title =
      options.title ??
      `NewsGarden — ${today.toISOString().slice(0, 10)}`;

    let aiFallback = false;

    // 1. Create the edition (or reuse the pre-created one from the run
    // service, which creates it first so the 202 can carry the id).
    let editionId: string;
    if (options.editionId) {
      editionId = options.editionId;
      console.log(
        `[DailyEditionWorkflow] Reusing pre-created edition ${editionId}`
      );
    } else {
      const edition =
        await this.editionManager.createEdition(
          title,
          today
        );
      editionId = edition.editionId;
    }

    console.log(
      `[DailyEditionWorkflow] Building edition ${editionId}`
    );

    // 2. Discovery across all desks.
    const discoveredByDesk: string[][] =
      [];

    for (const job of DISCOVERY_JOBS) {

      try {

        const task =
          await this.brain.createTask(
            job.agentId,
            job.type
          );

        const result =
          await this.brain.runTask(
            task.taskId
          );

        if (!result.success) {

          console.warn(
            `[DailyEditionWorkflow] Discovery failed for ${job.agentId}: ${result.error}`
          );

          discoveredByDesk.push(
            []
          );

          continue;
        }

        const output =
          result.output as {
            articleIds?: string[];
            aiFallback?: boolean;
          };

        discoveredByDesk.push(
          output.articleIds ?? []
        );

        if (
          output.aiFallback
        ) {

          aiFallback = true;
        }

      } catch (error) {

        console.warn(
          `[DailyEditionWorkflow] Discovery error for ${job.agentId}:`,

          error instanceof Error
            ? error.message
            : error
        );

        discoveredByDesk.push([]);
      }
    }

    const discovered =
      discoveredByDesk.flat();

    console.log(
      `[DailyEditionWorkflow] Discovered ${discovered.length} articles.`
    );

    await this.editionManager.markStageComplete(
      editionId,
      "discovery"
    );

    // 3. Produce the top stories,
    // round-robin across desks.
    const topArticles =
      this.pickTopArticles(
        discoveredByDesk,
        maxArticles
      );

    const storiesCompleted: string[] =
      [];

    const storiesFailed: {
      articleId: string;
      error: string;
    }[] = [];

    for (const articleId of topArticles) {

      try {

        const story =
          await this.storyWorkflow.run(
            this.brain,
            articleId,
            editionId
          );

        storiesCompleted.push(
          articleId
        );

        await this.editionManager.addArticleToEdition(
          editionId,
          articleId
        );

        if (
          story.aiFallback
        ) {

          aiFallback = true;
        }

      } catch (error) {

        const message =
          error instanceof Error
            ? error.message
            : "Unknown error";

        console.warn(
          `[DailyEditionWorkflow] Story failed for ${articleId}: ${message}`
        );

        storiesFailed.push({
          articleId,
          error: message,
        });
      }
    }

    await this.editionManager.markStageComplete(
      editionId,
      "editorial"
    );

    await this.editionManager.markStageComplete(
      editionId,
      "visual"
    );

    // 4. Lay out pages.
    const pages = this.chunk(
      storiesCompleted,
      articlesPerPage
    ).map(
      (
        articleIds,
        i
      ) => ({

        pageNumber: i + 1,

        articleIds,
      })
    );

    const pageResult =
      await this.pageWorkflow.run(
        this.brain,
        editionId,
        pages
      );

    if (
      pageResult.aiFallback
    ) {

      aiFallback = true;
    }

    await this.editionManager.markStageComplete(
      editionId,
      "design"
    );

    // 5. Quality gate. Articles that fail review are EXCLUDED from
    // the edition instead of killing the whole run — one strict AI
    // judgment (or one short body) must not waste 7 good stories.
    // The edition fails only when zero articles pass.
    const qualityTask =
      await this.brain.createTask(
        "quality-agent",
        "quality-review",
        {

          editionId,

          articleIds:
            storiesCompleted,
        }
      );

    const qualityResult =
      await this.brain.runTask(
        qualityTask.taskId
      );

    if (
      !qualityResult.success
    ) {

      throw new Error(
        `Quality review task failed: ${qualityResult.error ?? "unknown error"}`
      );
    }

    const qualityOutput =
      qualityResult.output as {
        editionPassed: boolean;
        passed?: string[];
        failed?: {
          articleId: string;
          reasons: string[];
        }[];
        aiFallback?: boolean;
      };

    if (
      qualityOutput.aiFallback
    ) {

      aiFallback = true;
    }

    const passedArticleIds =
      qualityOutput.passed ??
      storiesCompleted.filter(
        (id) =>
          !(qualityOutput.failed ?? []).some(
            (f) => f.articleId === id
          )
      );

    const failedArticleIds = (
      qualityOutput.failed ?? []
    ).map((f) => f.articleId);

    if (
      passedArticleIds.length === 0
    ) {

      const reason =
        `Quality review failed for ${failedArticleIds.length} article(s): ${(qualityOutput.failed ?? [])
          .map(
            (f) =>
              `${f.articleId} (${f.reasons.join("; ")})`
          )
          .join(" | ")}`;

      // Don't leave the edition permanently in-progress: mark it failed,
      // persist the failure event, and surface the reason for Retry.
      await this.editionManager.markEditionFailed(editionId, reason);

      throw new Error(reason);
    }

    let finalArticleIds = storiesCompleted;
    let finalPageCount = pageResult.pageCount;

    if (
      failedArticleIds.length > 0
    ) {

      console.log(
        `[DailyEditionWorkflow] Excluding ${failedArticleIds.length} failed article(s) from edition ${editionId}: ${failedArticleIds.join(", ")}`
      );

      // Rebuild the pages from the passing articles only. Pages were
      // laid out before review, so drop them and lay out again.
      await NewspaperPage.deleteMany({
        editionId,
      });

      const passedPages = this.chunk(
        passedArticleIds,
        articlesPerPage
      ).map(
        (
          articleIds,
          i
        ) => ({

          pageNumber: i + 1,

          articleIds,
        })
      );

      const relayout =
        await this.pageWorkflow.run(
          this.brain,
          editionId,
          passedPages
        );

      if (
        relayout.aiFallback
      ) {

        aiFallback = true;
      }

      finalArticleIds = passedArticleIds;
      finalPageCount = relayout.pageCount;

      await this.editionManager.replaceEditionPages(
        editionId,
        passedArticleIds,
        relayout.pageIds
      );
    }

    await this.editionManager.markStageComplete(
      editionId,
      "quality"
    );

    // 6. Human approval. The edition
    // waits here; nothing auto-publishes.
    const inReview =
      await this.editionManager.requestApproval(
        editionId
      );

    await this.editionManager.markStageComplete(
      editionId,
      "approval"
    );

    if (aiFallback) {

      await this.editionManager.setAiFallback(
        editionId
      );
    }

    console.log(
      `[DailyEditionWorkflow] Edition ${editionId} ready for human approval.`
    );

    return {

      editionId,

      title,

      discovered:
        discovered.length,

      storiesCompleted:
        finalArticleIds,

      storiesFailed,

      pageCount:
        finalPageCount,

      qualityPassed: true,

      aiFallback,

      status:
        inReview?.status ??
        "in-review",
    };
  }

  /*
   * Round-robin across desks so the
   * front page is not one category.
   */
  private pickTopArticles(
    byDesk: string[][],
    max: number
  ): string[] {

    const picked: string[] =
      [];

    const queues = byDesk.map(
      (list) => [...list]
    );

    let progress = true;

    while (
      picked.length < max &&
      progress
    ) {

      progress = false;

      for (const queue of queues) {

        if (
          picked.length >=
            max
        ) {

          break;
        }

        const next =
          queue.shift();

        if (next) {

          picked.push(next);

          progress = true;
        }
      }
    }

    return picked;
  }

  private chunk<T>(
    items: T[],
    size: number
  ): T[][] {

    const chunks: T[][] =
      [];

    for (
      let i = 0;
      i < items.length;
      i += size
    ) {

      chunks.push(
        items.slice(i, i + size)
      );
    }

    return chunks;
  }
}
