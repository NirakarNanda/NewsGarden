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
  generateTextWithRetry,
  aiProviderName,
} from "../../utils/ai.js";

interface WriteHeadlineInput {

  articleId: string;
}

/*
 * Generates a print headline for an
 * article using AI.
 *
 * On AI failure: retries once, then
 * reuses the original discovered title
 * and records aiFallback: true.
 */
export class HeadlineAgent
  extends BaseAgent {

  id = "headline-agent";

  name = "Headline Agent";

  role =
    "Write compelling print headlines";

  department = "editorial";

  private ai =
    new AIService();

  async execute(
    task: AgentTask
  ): Promise<AgentResult> {

    this.log(
      "Writing headline..."
    );

    const model =
      aiProviderName();

    let aiFallback = false;

    try {

      const input =
        task.input as WriteHeadlineInput;

      const article =
        await Article.findOne({
          articleId:
            input.articleId,
        });

      if (!article) {

        throw new Error(
          `Article not found: ${input.articleId}`
        );
      }

      let headline: string;

      try {

        headline =
          await this.writeHeadline(
            article.title,
            article.summary,
            article.body
          );

      } catch (error) {

        this.log(
          `AI headline failed (${error instanceof Error ? error.message : "unknown"}). Reusing original title.`
        );

        aiFallback = true;

        headline =
          article.title;
      }

      article.headline =
        headline.trim();

      await article.save();

      this.log(
        `Headline: "${article.headline}"`
      );

      return {

        success: true,

        output: {

          articleId:
            article.articleId,

          headline:
            article.headline,

          aiFallback,

          model,

          taskId: task.id,
        },
      };

    } catch (error) {

      this.log(
        "Headline writing failed."
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

  private async writeHeadline(
    title: string,
    summary: string | undefined,
    body: string | undefined
  ): Promise<string> {

    const prompt = `You are the headline writer for a serious daily newspaper.

Write ONE compelling print headline for the article below.

ORIGINAL TITLE: ${title}
SUMMARY: ${summary ?? "No summary."}
${body ? `ARTICLE EXCERPT:\n${body.slice(0, 800)}\n` : ""}

Rules:
- Under 90 characters.
- Factual and specific. No clickbait, no puns.
- Present tense, active voice where natural.
- Return ONLY the headline text, nothing else.`;

    const headline =
      await generateTextWithRetry(
        this.ai,
        prompt
      );

    const cleaned = headline
      .replace(/^["']|["']$/g, "")
      .trim();

    if (
      !cleaned ||
      cleaned.length > 140
    ) {

      throw new Error(
        "AI returned an unusable headline"
      );
    }

    return cleaned;
  }
}
