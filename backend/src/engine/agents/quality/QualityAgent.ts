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
  eventBus,
} from "../../events/EventBus.js";

import {
  generateTextWithRetry,
  extractJson,
  aiProviderName,
} from "../../utils/ai.js";

interface QualityReviewInput {

  editionId: string;

  // Preferred: the workflow passes the
  // exact articles it built. Articles do
  // not carry an editionId field.
  articleIds?: string[];
}

export interface ArticleReview {

  articleId: string;

  headline?: string;

  passed: boolean;

  score: number;

  reasons: string[];
}

interface ReviewJudgment {

  passed: boolean;

  score: number;

  reasons: string[];
}

/*
 * Reviews every article in an edition:
 * accuracy signals, completeness, tone.
 *
 * On pass: marks articles "ready" and
 * emits EDITION_READY_FOR_APPROVAL.
 * Never publishes — a human approves.
 *
 * On AI failure: retries once, then each
 * article gets a mechanical review
 * (body present, headline present,
 * minimum length) with aiFallback: true.
 */
export class QualityAgent
  extends BaseAgent {

  id = "quality-agent";

  name = "Quality Agent";

  role =
    "Final quality review before human approval";

  department = "quality";

  private ai =
    new AIService();

  async execute(
    task: AgentTask
  ): Promise<AgentResult> {

    this.log(
      "Reviewing edition quality..."
    );

    const model =
      aiProviderName();

    let aiFallback = false;

    try {

      const input =
        task.input as QualityReviewInput;

      const editionId =
        input.editionId;

      let batch;

      if (
        input.articleIds &&
        input.articleIds.length > 0
      ) {

        batch =
          await Article.find({
            articleId: {
              $in:
                input.articleIds,
            },
          });

      } else {

        // No explicit list: review the
        // latest drafted batch.
        batch =
          await Article.find({
            status: {
              $in: [
                "drafted",
                "edited",
                "fact-checked",
              ],
            },
          })
            .sort({
              updatedAt: -1,
            })
            .limit(20);
      }

      this.log(
        `Reviewing ${batch.length} articles.`
      );

      const reviews: ArticleReview[] =
        [];

      for (const article of batch) {

        let judgment: ReviewJudgment;

        try {

          judgment =
            await this.reviewArticle(
              article.headline ??
                article.title,
              article.body,
              article.summary
            );

        } catch (error) {

          this.log(
            `AI review failed for ${article.articleId} (${error instanceof Error ? error.message : "unknown"}). Using mechanical review.`
          );

          aiFallback = true;

          judgment =
            this.mechanicalReview(
              article.body,
              article.headline
            );
        }

        reviews.push({

          articleId:
            article.articleId,

          headline:
            article.headline ??
            article.title,

          passed:
            judgment.passed,

          score: judgment.score,

          reasons:
            judgment.reasons,
        });

        if (judgment.passed) {

          article.status = "ready";

          await article.save();
        }
      }

      const passed =
        reviews.filter(
          (r) => r.passed
        );

      const failed =
        reviews.filter(
          (r) => !r.passed
        );

      const editionPassed =
        reviews.length > 0 &&
        failed.length === 0;

      this.log(
        `Quality review: ${passed.length} passed, ${failed.length} failed.`
      );

      if (editionPassed) {

        eventBus.emit(
          "EDITION_READY_FOR_APPROVAL",
          {

            editionId,

            articleCount:
              reviews.length,

            source:
              "quality-agent",

            at: new Date().toISOString(),
          }
        );

        this.log(
          "Edition ready for human approval."
        );
      }

      return {

        success: true,

        output: {

          editionId,

          editionPassed,

          passed: passed.map(
            (r) => r.articleId
          ),

          failed: failed.map(
            (r) => ({
              articleId:
                r.articleId,
              reasons: r.reasons,
            })
          ),

          reviews,

          aiFallback,

          model,

          taskId: task.id,
        },
      };

    } catch (error) {

      this.log(
        "Quality review failed."
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

  private async reviewArticle(
    headline: string,
    body: string | undefined,
    summary: string | undefined
  ): Promise<ReviewJudgment> {

    if (!body) {

      return {

        passed: false,

        score: 0,

        reasons: [
          "Article has no body text.",
        ],
      };
    }

    const prompt = `You are the standards editor of a serious daily newspaper. Review the article below for publication quality.

HEADLINE: ${headline}
SUMMARY: ${summary ?? "No summary."}

ARTICLE:
${body.slice(0, 4000)}

Return ONLY valid JSON:
{"passed": true, "score": 0.9, "reasons": []}
or
{"passed": false, "score": 0.4, "reasons": ["short reason", "..."]}

Rules:
- passed is true only for publishable quality: coherent, complete, neutral tone, no obvious factual overreach.
- score is 0.0 to 1.0.
- reasons are short; empty when passed.
- No markdown, no prose.`;

    const response =
      await generateTextWithRetry(
        this.ai,
        prompt
      );

    const parsed =
      extractJson<ReviewJudgment>(
        response
      );

    if (
      typeof parsed.passed !==
        "boolean" ||
      typeof parsed.score !==
        "number" ||
      !Array.isArray(
        parsed.reasons
      )
    ) {

      throw new Error(
        "Invalid quality review judgment"
      );
    }

    return parsed;
  }

  /*
   * Honest mechanical fallback: checks
   * structural completeness only.
   */
  private mechanicalReview(
    body: string | undefined,
    headline: string | undefined
  ): ReviewJudgment {

    const reasons: string[] = [];

    if (!body) {

      reasons.push(
        "Article has no body text."
      );

    } else if (
      body.trim().length < 200
    ) {

      reasons.push(
        "Body is too short for publication."
      );
    }

    if (!headline) {

      reasons.push(
        "Article has no headline."
      );
    }

    const passed =
      reasons.length === 0;

    return {

      passed,

      score: passed ? 0.6 : 0.2,

      reasons: passed
        ? [
            "Mechanical review only: structure complete, AI review unavailable.",
          ]
        : reasons,
    };
  }
}
