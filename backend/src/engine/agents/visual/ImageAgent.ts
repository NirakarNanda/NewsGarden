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

interface GenerateImageInput {

  articleId: string;

  // Optional override for the photo brief.
  prompt?: string;
}

/*
 * Generates a photographic image for an
 * article and stores its URL.
 *
 * ImageGenerator is a placeholder stub
 * until an image provider is configured,
 * so the stored URL is always marked as
 * a placeholder in the task output.
 */
export class ImageAgent
  extends BaseAgent {

  id = "image-agent";

  name = "Image Agent";

  role =
    "Create photographic images for articles";

  department = "visual";

  private imageGenerator =
    new ImageGenerator();

  async execute(
    task: AgentTask
  ): Promise<AgentResult> {

    this.log(
      "Generating image..."
    );

    try {

      const input =
        task.input as GenerateImageInput;

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
        await this.imageGenerator.generatePhoto(
          brief
        );

      article.imageUrl =
        image.path;

      await article.save();

      this.log(
        `Image ready: ${image.path} (placeholder: ${image.placeholder})`
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
        "Image generation failed."
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
      `Editorial photograph for a ${category} news article.`,
      `Subject: ${headline}.`,
    ];

    if (summary) {

      parts.push(
        `Context: ${summary.slice(0, 200)}.`
      );
    }

    parts.push(
      "Documentary style, natural light, no text overlays, no watermarks."
    );

    return parts.join(" ");
  }
}
