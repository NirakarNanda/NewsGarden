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

interface EditArticleInput {

  articleId: string;
}

/*
 * Polishes a drafted article: clarity,
 * flow, grammar, house style.
 *
 * On AI failure: retries once, then
 * applies a light mechanical cleanup and
 * records aiFallback: true.
 */
export class EditorAgent
  extends BaseAgent {

  id = "editor-agent";

  name = "Editor Agent";

  role =
    "Edit drafted articles for clarity and style";

  department = "editorial";

  private ai =
    new AIService();

  async execute(
    task: AgentTask
  ): Promise<AgentResult> {

    this.log(
      "Editing article..."
    );

    const model =
      aiProviderName();

    let aiFallback = false;

    try {

      const input =
        task.input as EditArticleInput;

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

      if (!article.body) {

        throw new Error(
          `Article has no body to edit: ${input.articleId}`
        );
      }

      let edited: string;

      try {

        edited =
          await this.editBody(
            article.body
          );

      } catch (error) {

        this.log(
          `AI editing failed (${error instanceof Error ? error.message : "unknown"}). Applying mechanical cleanup.`
        );

        aiFallback = true;

        edited =
          this.mechanicalCleanup(
            article.body
          );
      }

      article.body =
        edited.trim();

      article.status = "edited";

      await article.save();

      this.log(
        `Article edited: ${article.articleId}`
      );

      return {

        success: true,

        output: {

          articleId:
            article.articleId,

          bodyLength:
            edited.length,

          aiFallback,

          model,

          taskId: task.id,
        },
      };

    } catch (error) {

      this.log(
        "Article editing failed."
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

  private async editBody(
    body: string
  ): Promise<string> {

    const prompt = `You are a copy editor for a serious daily newspaper.

Edit the article below for clarity, flow, grammar, and concise house style. Do NOT change facts, add new facts, or invent quotes.

ARTICLE:
${body}

Rules:
- Keep the same structure and length (within 10%).
- Prefer short sentences and plain words.
- Fix grammar, repetition, and awkward phrasing.
- Return ONLY the edited article text.`;

    const edited =
      await generateTextWithRetry(
        this.ai,
        prompt
      );

    if (
      !edited ||
      edited.trim().length < 50
    ) {

      throw new Error(
        "AI returned an empty edited body"
      );
    }

    return edited;
  }

  private mechanicalCleanup(
    body: string
  ): string {

    return body

      .replace(/[ \t]+/g, " ")

      .replace(/\n{3,}/g, "\n\n")

      .replace(/ {2,}/g, " ")

      .trim();
  }
}
