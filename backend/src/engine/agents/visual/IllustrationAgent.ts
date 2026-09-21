import {
  BaseAgent,
  type AgentResult,
} from "../BaseAgent.js";

import type {
  AgentTask,
} from "../../../types/task.js";

import {
  Article,
} from "../../../models/Article.js";

import {
  ImageGenerator,
} from "../../tools/image/ImageGenerator.js";

import {
  aiProviderName,
} from "../../utils/ai.js";

interface GenerateIllustrationInput {

  articleId: string;

  // Optional override for the art brief.
  prompt?: string;
}

/*
 * Generates an editorial illustration
 * for an article and stores its URL.
 *
 * ImageGenerator is a placeholder stub
 * until an image provider is configured,
 * so the stored URL is always marked as
 * a placeholder in the task output.
 */
export class IllustrationAgent
  extends BaseAgent {

  id = "illustration-agent";

  name = "Illustration Agent";

  role =
    "Create editorial illustrations for articles";

  department = "visual";

  private imageGenerator =
    new ImageGenerator();

  async execute(
    task: AgentTask
  ): Promise<AgentResult> {

    this.log(
      "Generating illustration..."
    );

    try {

      const input =
        task.input as GenerateIllustrationInput;

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

      const brief =
        input.prompt ??
        this.buildBrief(
          article.headline ??
            article.title,
          article.summary,
          article.category
        );

      const image =
        await this.imageGenerator.generateIllustration(
          brief
        );

      article.imageUrl =
        image.path;

      await article.save();

      this.log(
        `Illustration ready (provider: ${image.provider}, placeholder: ${image.placeholder})`
      );

      return {

        success: true,

        output: {

          articleId:
            article.articleId,

          imageUrl:
            image.path,

          provider:
            image.provider,

          placeholder:
            image.placeholder,

          model:
            aiProviderName(),

          taskId: task.id,
        },
      };

    } catch (error) {

      this.log(
        "Illustration generation failed."
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

  private buildBrief(
    headline: string,
    summary: string | undefined,
    category: string
  ): string {

    const parts = [
      `Editorial illustration for a ${category} news article.`,
      `Headline: ${headline}.`,
    ];

    if (summary) {

      parts.push(
        `Subject: ${summary.slice(0, 200)}.`
      );
    }

    parts.push(
      "Flat vector style, muted newspaper palette, no text, no logos."
    );

    return parts.join(" ");
  }
}
