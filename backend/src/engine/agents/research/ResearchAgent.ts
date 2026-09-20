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

      const existingReport =
        await ResearchReport.findOne({
          eventId: event.eventId,
        });

      if (existingReport) {

        this.log(
          "Research report already exists."
        );

        return {
          success: true,

          output: {
            researchId:
              existingReport.researchId,

            eventId:
              event.eventId,

            status:
              existingReport.status,

            taskId:
              task.id,
          },
        };
      }

      const research =
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
}