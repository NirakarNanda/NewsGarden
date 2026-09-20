import {
  BaseAgent,
  type AgentResult,
} from "../BaseAgent.js";

import type {
  AgentTask,
} from "../../../types/task.js";

import {
  Event,
} from "../../../models/Event.js";

import {
  Article,
} from "../../../models/Article.js";

import {
  AIService,
} from "../../tools/ai/AIService.js";

interface SourceDecision {
  relevant: boolean;
  confidence: number;
  reason: string;
}

interface VerifiedSource {
  articleId: string;
  title: string;
  url: string;
  source: string;
  summary?: string;
  publishedAt?: Date;
  confidence: number;
}

export class SourceVerificationAgent
  extends BaseAgent {

  id = "source-verification-agent";

  name = "Source Verification Agent";

  role =
    "Verify whether sources support a news event";

  department = "research";

private ai =
  new AIService();

  async execute(
    task: AgentTask
  ): Promise<AgentResult> {

    this.log(
      "Starting source verification..."
    );

    try {
      const input =
        task.input as {
          eventId: string;
        };

      const event =
        await Event.findOne({
          eventId: input.eventId,
        });

      if (!event) {
        throw new Error(
          `Event not found: ${input.eventId}`
        );
      }

      // The clustering stage already collected
      // candidate articles for this event.
      const articles =
        await Article.find({
          articleId: {
            $in: event.articleIds,
          },
        });

      if (articles.length === 0) {
        throw new Error(
          "No articles found for event"
        );
      }

      const verifiedSources:
        VerifiedSource[] = [];

      const rejectedSources: {
        articleId: string;
        reason: string;
      }[] = [];

      for (const article of articles) {

        // The representative article created
        // the event, so keep it as the base source.
        if (
          article.articleId ===
          event.representativeArticleId
        ) {
          verifiedSources.push({
            articleId:
              article.articleId,

            title:
              article.title,

            url:
              article.url,

            source:
              article.source,

            summary:
              article.summary,

            publishedAt:
              article.publishedAt,

            confidence: 1,
          });

          continue;
        }

        const decision =
          await this.verifySource(
            event.title,
            article.title,
            article.summary,
            article.source
          );

        if (
          decision.relevant &&
          decision.confidence >= 0.8
        ) {
          verifiedSources.push({
            articleId:
              article.articleId,

            title:
              article.title,

            url:
              article.url,

            source:
              article.source,

            summary:
              article.summary,

            publishedAt:
              article.publishedAt,

            confidence:
              decision.confidence,
          });

          this.log(
            `Verified: "${article.title}"`
          );
        } else {
          rejectedSources.push({
            articleId:
              article.articleId,

            reason:
              decision.reason,
          });

          this.log(
            `Rejected: "${article.title}"`
          );
        }
      }

      this.log(
        `Verified ${verifiedSources.length}/${articles.length} sources.`
      );

      return {
        success: true,

        output: {
          eventId:
            event.eventId,

          verifiedSources,

          rejectedSources,

          taskId:
            task.id,
        },
      };

    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error";

      this.log(
        `Source verification failed: ${message}`
      );

      return {
        success: false,
        error: message,
      };
    }
  }

  private async verifySource(
    eventTitle: string,
    articleTitle: string,
    summary: string | undefined,
    source: string
  ): Promise<SourceDecision> {

    const prompt = `
You are a source verification agent for NewsGarden.

Determine whether this source actually provides information
about the SAME real-world event.

EVENT
${eventTitle}

SOURCE
Publisher: ${source}
Title: ${articleTitle}
Summary: ${summary ?? "No summary available"}

Do not approve a source merely because it discusses:
- the same company
- the same person
- the same technology
- the same general topic

It must provide information about the same underlying event.

Return ONLY valid JSON:

{
  "relevant": true,
  "confidence": 0.95,
  "reason": "Short explanation"
}
`;

    const response =
  await this.ai.generateText(
    prompt
  );

    return this.parseResponse(
      response
    );
  }

  private parseResponse(
    response: string
  ): SourceDecision {

    const cleaned =
      response
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

    const parsed =
      JSON.parse(
        cleaned
      ) as SourceDecision;

    if (
      typeof parsed.relevant !==
      "boolean"
    ) {
      throw new Error(
        "Invalid relevant value"
      );
    }

    if (
      typeof parsed.confidence !==
      "number"
    ) {
      throw new Error(
        "Invalid confidence value"
      );
    }

    if (
      typeof parsed.reason !==
      "string"
    ) {
      throw new Error(
        "Invalid reason value"
      );
    }

    return parsed;
  }
}