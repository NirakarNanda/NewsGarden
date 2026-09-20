import {
  randomUUID,
} from "crypto";

import {
  BaseAgent,
  type AgentResult,
} from "../BaseAgent.js";

import type {
  AgentTask,
} from "../../../types/task.js";

import {
  RssReader,
  type RssStory,
} from "../../tools/web/RssReader.js";

import {
  getTitleKeywords,
  calculateSimilarity,
} from "../../tools/web/TextSimilarity.js";

import {
  AIService,
} from "../../tools/ai/AIService.js";

import {
  Article,
} from "../../../models/Article.js";

import type {
  NewsSource,
} from "../../../config/sources.js";

import {
  withRetry,
} from "../../utils/retry.js";

import {
  generateTextWithRetry,
  extractJson,
  aiProviderName,
  type AiCallMeta,
} from "../../utils/ai.js";

import {
  sourceMemory,
} from "../../memory/SourceMemory.js";

interface NewsJudgment {

  index: number;

  score: number;

  keep: boolean;

  reason?: string;
}

interface DiscoveryInput {

  // Max stories sent to the AI judge.
  limit?: number;

  // Minimum AI score to keep a story.
  minScore?: number;
}

const DEFAULT_LIMIT = 40;

const DEFAULT_MIN_SCORE = 0.35;

// Titles this similar are the same story.
const DUPLICATE_SIMILARITY = 0.8;

/*
 * Shared discovery pipeline used by every
 * category agent:
 *
 *   RSS fetch (with backoff)
 *     -> URL + near-duplicate title dedupe
 *     -> AI newsworthiness judging
 *     -> save new Articles
 *
 * Subclasses only declare their feeds and
 * desk persona.
 */
export abstract class DiscoveryAgentBase
  extends BaseAgent {

  abstract category: string;

  abstract feeds: NewsSource[];

  // e.g. "science desk"
  abstract desk: string;

  private rssReader =
    new RssReader();

  private ai =
    new AIService();

  async execute(
    task: AgentTask
  ): Promise<AgentResult> {

    this.log(
      `Starting ${this.category} news discovery...`
    );

    const aiMeta: AiCallMeta = {

      model: aiProviderName(),

      aiFallback: false,
    };

    try {

      const input =
        (task.input ?? {}) as DiscoveryInput;

      const limit =
        input.limit ??
        DEFAULT_LIMIT;

      const minScore =
        input.minScore ??
        DEFAULT_MIN_SCORE;

      // 1. Fetch every feed, retrying
      // transient failures per feed.
      const stories =
        await this.fetchAllFeeds();

      this.log(
        `Collected ${stories.length} RSS stories.`
      );

      // 2. Dedupe: URL (DB + memory) and
      // near-duplicate titles in this run.
      const fresh =
        await this.dedupe(stories);

      this.log(
        `${fresh.length} stories survived dedupe.`
      );

      // 3. AI judges newsworthiness in one
      // batched call.
      const candidates = fresh.slice(
        0,
        limit
      );

      let judgments: NewsJudgment[];

      try {

        judgments =
          await this.judgeNewsworthiness(
            candidates
          );

      } catch (error) {

        this.log(
          `AI judging failed (${error instanceof Error ? error.message : "unknown"}). Falling back to heuristic.`
        );

        aiMeta.aiFallback = true;

        judgments =
          this.heuristicJudgments(
            candidates
          );
      }

      // 4. Save the keepers.
      const kept = candidates.filter(
        (_, i) => {

          const judgment =
            judgments[i];

          return (
            judgment?.keep === true &&
            judgment.score >=
              minScore
          );
        }
      );

      // Never return empty-handed when the
      // AI rejected everything: take the
      // top few by score instead.
      let finalKept = kept;

      if (
        finalKept.length === 0 &&
        candidates.length > 0
      ) {

        const ranked = [
          ...candidates,
        ].sort((a, b) => {

          const sa =
            judgments[
              candidates.indexOf(a)
            ]?.score ?? 0;

          const sb =
            judgments[
              candidates.indexOf(b)
            ]?.score ?? 0;

          return sb - sa;
        });

        finalKept = ranked.slice(
          0,
          3
        );

        this.log(
          "AI kept nothing; rescuing top 3 by score."
        );
      }

      const articleIds: string[] =
        [];

      for (const story of finalKept) {

        const articleId =
          randomUUID();

        await Article.create({

          articleId,

          title: story.title,

          url: story.url,

          source: story.source,

          summary: story.summary,

          publishedAt:
            story.publishedAt,

          discoveredAt:
            new Date(),

          category: this.category,

          status: "discovered",
        });

        sourceMemory.add(
          story.url,
          articleId
        );

        articleIds.push(articleId);
      }

      this.log(
        `Saved ${articleIds.length} new stories.`
      );

      return {

        success: true,

        output: {

          category: this.category,

          discovered:
            stories.length,

          afterDedupe:
            fresh.length,

          judged:
            candidates.length,

          newStories:
            articleIds.length,

          articleIds,

          aiFallback:
            aiMeta.aiFallback,

          model: aiMeta.model,

          taskId: task.id,
        },
      };

    } catch (error) {

      this.log(
        `${this.category} news discovery failed.`
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

  private async fetchAllFeeds(): Promise<
    RssStory[]
  > {

    const results: RssStory[] =
      [];

    for (const feed of this
      .feeds) {

      try {

        const stories =
          await withRetry(
            () =>
              this.rssReader.readFeed(
                feed.url,
                feed.source
              ),

            {
              retries: 2,

              baseDelayMs: 800,

              maxDelayMs: 6000,
            }
          );

        results.push(...stories);

        this.log(
          `${feed.source}: ${stories.length} stories`
        );

      } catch (error) {

        console.error(
          `Discovery: giving up on ${feed.source} after retries:`,

          error instanceof Error
            ? error.message
            : error
        );
      }
    }

    return results;
  }

  private async dedupe(
    stories: RssStory[]
  ): Promise<RssStory[]> {

    const fresh: RssStory[] =
      [];

    const seenTitles: string[][] =
      [];

    for (const story of stories) {

      // URL dedupe: shared memory + DB.
      if (
        await sourceMemory.has(
          story.url
        )
      ) {

        continue;
      }

      // Near-duplicate titles in this run
      // are usually the same wire story.
      const keywords =
        getTitleKeywords(
          story.title
        );

      const isDuplicate =
        seenTitles.some(
          (other) =>
            calculateSimilarity(
              keywords,
              other
            ) >= DUPLICATE_SIMILARITY
        );

      if (isDuplicate) {

        continue;
      }

      seenTitles.push(keywords);

      fresh.push(story);
    }

    return fresh;
  }

  /*
   * One batched AI call: score every
   * story for newsworthiness.
   */
  private async judgeNewsworthiness(
    stories: RssStory[]
  ): Promise<NewsJudgment[]> {

    if (stories.length === 0) {

      return [];
    }

    const listing = stories
      .map(
        (story, i) =>
          `${i}. [${story.source}] ${story.title}` +
          (story.summary
            ? ` — ${story.summary.slice(0, 200)}`
            : "")
      )
      .join("\n");

    const prompt = `You are the ${this.desk} desk editor of a serious daily newspaper.

Score each story below for newsworthiness: real-world impact, timeliness, significance, and broad reader interest. Reject press releases, listicles, trivial updates, and pure opinion pieces.

Return ONLY a JSON array with one object per story, in order:
[{"index": 0, "score": 0.85, "keep": true, "reason": "short reason"}]

Rules:
- score is 0.0 to 1.0.
- keep is true when score >= 0.35.
- reason is under 12 words.
- No markdown, no prose, no code fences.

STORIES:
${listing}`;

    const response =
      await generateTextWithRetry(
        this.ai,
        prompt
      );

    const parsed =
      extractJson<NewsJudgment[]>(
        response
      );

    if (!Array.isArray(parsed)) {

      throw new Error(
        "AI did not return a JSON array"
      );
    }

    return stories.map(
      (_, i) => {

        const judgment =
          parsed.find(
            (j) => j?.index === i
          );

        if (
          !judgment ||
          typeof judgment.score !==
            "number" ||
          typeof judgment.keep !==
            "boolean"
        ) {

          throw new Error(
            `Invalid AI judgment for story ${i}`
          );
        }

        return {
          ...judgment,

          score: Math.min(
            1,
            Math.max(0, judgment.score)
          ),
        };
      }
    );
  }

  /*
   * Clearly-marked fallback when the AI
   * is unavailable: keep recent stories
   * with summaries, newest first.
   */
  private heuristicJudgments(
    stories: RssStory[]
  ): NewsJudgment[] {

    const twoDaysAgo =
      Date.now() -
      48 * 60 * 60 * 1000;

    return stories.map(
      (story, i) => {

        let score = 0.3;

        if (
          story.publishedAt &&
          story.publishedAt.getTime() >=
            twoDaysAgo
        ) {

          score += 0.25;
        }

        if (
          story.summary &&
          story.summary.length > 40
        ) {

          score += 0.2;
        }

        return {

          index: i,

          score: Math.min(
            1,
            score
          ),

          keep: score >= 0.35,

          reason:
            "heuristic fallback: recency + summary",
        };
      }
    );
  }
}
