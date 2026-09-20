import { randomUUID } from "crypto";

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
  ResearchReport,
} from "../../../models/ResearchReport.js";

import {
  SourceVerificationAgent,
} from "./SourceVerificationAgent.js";

export class ResearchAgent
  extends BaseAgent {

  id = "research-agent";

  name = "Research Agent";

  role =
    "Research and verify clustered news events";

  department = "research";

  async execute(
    task: AgentTask
  ): Promise<AgentResult> {

    this.log(
      "Starting event research..."
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

      const representativeArticle =
        await Article.findOne({
          articleId:
            event.representativeArticleId,
        });

      if (!representativeArticle) {
        throw new Error(
          "Representative article not found"
        );
      }

      this.log(
        `Researching: "${event.title}"`
      );

      let research =
        await ResearchReport.findOne({
          eventId: event.eventId,
        });

      if (!research) {

        research =
          await ResearchReport.create({

            researchId:
              randomUUID(),

            eventId:
              event.eventId,

            headline:
              representativeArticle.title,

            sources: [
              {
                title:
                  representativeArticle.title,

                url:
                  representativeArticle.url,

                source:
                  representativeArticle.source,

                publishedAt:
                  representativeArticle.publishedAt,

                summary:
                  representativeArticle.summary,
              },
            ],

            keyFacts: [],

            context: [],

            conflictingInformation: [],

            confidence: 0,

            status:
              "researching",

            createdAt:
              new Date(),

            updatedAt:
              new Date(),
          });

        this.log(
          `Research report created: ${research.researchId}`
        );

      } else {

        // Continue an unfinished research report.
        if (
          research.status ===
          "completed"
        ) {
          this.log(
            "Research report already completed."
          );

          return {
            success: true,

            output: {
              researchId:
                research.researchId,

              eventId:
                event.eventId,

              status:
                research.status,

              taskId:
                task.id,
            },
          };
        }

        research.status =
          "researching";

        research.updatedAt =
          new Date();

        await research.save();

        this.log(
          "Continuing existing research report."
        );
      }

      /*
       * Verify the articles collected
       * during event clustering.
       */
      const verificationAgent =
        new SourceVerificationAgent();

      const verificationResult =
        await verificationAgent.execute({

          id:
            `${task.id}-source-verification`,

          agentId:
            "source-verification-agent",

          type:
            "verify-sources",

          status:
            "running",

          retryCount:
            0,

          createdAt:
            new Date(),

          input: {
            eventId:
              event.eventId,
          },
        });

      if (
        !verificationResult.success
      ) {
        throw new Error(
          verificationResult.error ??
          "Source verification failed"
        );
      }

      const output =
        verificationResult.output as {
          verifiedSources: {
            articleId: string;
            title: string;
            url: string;
            source: string;
            summary?: string;
            publishedAt?: Date;
            confidence: number;
          }[];
        };

      /*
       * Store only verified sources
       * in the research report.
       */
      research.sources =
        output.verifiedSources.map(
          (source) => ({
            title:
              source.title,

            url:
              source.url,

            source:
              source.source,

            publishedAt:
              source.publishedAt,

            summary:
              source.summary,
          })
        );

      /*
       * The research stage is complete
       * once the event sources are verified.
       *
       * Fact extraction will be added
       * in the next research step.
       */
      research.status =
        "completed";

      research.confidence =
        this.calculateConfidence(
          output.verifiedSources
        );

      research.updatedAt =
        new Date();

      await research.save();

      this.log(
        `Research completed: ${research.researchId}`
      );

      return {

        success: true,

        output: {

          researchId:
            research.researchId,

          eventId:
            event.eventId,

          verifiedSources:
            output.verifiedSources.length,

          confidence:
            research.confidence,

          status:
            research.status,

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
        `Research failed: ${message}`
      );

      return {

        success: false,

        error: message,
      };
    }
  }

  private calculateConfidence(
    sources: {
      confidence: number;
    }[]
  ): number {

    if (
      sources.length === 0
    ) {
      return 0;
    }

    const total =
      sources.reduce(
        (sum, source) =>
          sum + source.confidence,
        0
      );

    return Number(
      (
        total /
        sources.length
      ).toFixed(2)
    );
  }
}