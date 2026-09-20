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

interface WriteArticleInput {

  articleId: string;

  // Added by the research step of StoryWorkflow.
  researchNotes?: string;
}

/*
 * Expands a discovered article's summary
 * into a full newspaper body using AI.
 *
 * On AI failure: retries once, then falls
 * back to the original summary as the
 * body and records aiFallback: true.
 */
export class ArticleWriterAgent
  extends BaseAgent {

  id = "article-writer-agent";

  name = "Article Writer Agent";

  role =
    "Write full newspaper articles from discovered stories";

  department = "editorial";

  private ai =
    new AIService();

  async execute(
    task: AgentTask
  ): Promise<AgentResult> {

    this.log(
      "Writing article..."
    );

    const model =
      aiProviderName();

    let aiFallback = false;

    try {

      const input =
        task.input as WriteArticleInput;

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

      article.status = "writing";

      await article.save();

      let body: string;

      try {

        body =
          await this.writeBody(
            article.title,
            article.summary,
            article.source,
            input.researchNotes
          );

      } catch (error) {

        this.log(
          `AI writing failed (${error instanceof Error ? error.message : "unknown"}). Falling back to summary.`
        );

        aiFallback = true;

        body =
          article.summary ??
          article.title;
      }

      article.body =
        body.trim();

      article.status = "drafted";

      await article.save();

      this.log(
        `Article drafted: ${article.articleId} (${body.length} chars)`
      );

      return {

        success: true,

        output: {

          articleId:
            article.articleId,

          bodyLength:
            body.length,

          aiFallback,

          model,

          taskId: task.id,
        },
      };

    } catch (error) {

      this.log(
        "Article writing failed."
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

  private async writeBody(
    title: string,
    summary: string | undefined,
    source: string,
    researchNotes?: string
  ): Promise<string> {

    const prompt = `You are a staff writer for a serious daily newspaper.

Write a complete newspaper article (400-600 words) based on the story below.

TITLE: ${title}
SOURCE: ${source}
SUMMARY: ${summary ?? "No summary available."}
${researchNotes ? `RESEARCH NOTES:\n${researchNotes}\n` : ""}

Rules:
- Lead with the most important facts (inverted pyramid).
- Neutral, factual tone. No invented quotes, names, dates, or statistics beyond what is given.
- If a fact is uncertain, say so plainly.
- No headline, no byline, no dateline.
- Return ONLY the article body text.`;

    const body =
      await generateTextWithRetry(
        this.ai,
        prompt
      );

    if (
      !body ||
      body.trim().length < 50
    ) {

      throw new Error(
        "AI returned an empty article body"
      );
    }

    return body;
  }
}
