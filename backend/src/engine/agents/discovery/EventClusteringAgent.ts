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
  Article,
} from "../../../models/Article.js";

import {
  Event,
} from "../../../models/Event.js";

import {
  getKeywords,
  getTitleKeywords,
  getSharedKeywords,
  calculateSimilarity,
} from "../../tools/web/TextSimilarity.js";

import {
  EventJudgeAgent,
} from "./EventJudgeAgent.js";

export class EventClusteringAgent
  extends BaseAgent {

  id = "event-clustering-agent";

  name = "Event Clustering Agent";

  role =
    "Find and group articles covering the same real-world event";

  department = "discovery";

  private eventJudge =
    new EventJudgeAgent();

  async execute(
    task: AgentTask
  ): Promise<AgentResult> {

    this.log(
      "Starting event clustering..."
    );

    try {

      const articles =
        await Article.find({
          status: "discovered",

          eventId: {
            $exists: false,
          },
        });

      this.log(
        `Found ${articles.length} articles to cluster.`
      );

      let createdEvents = 0;

      let groupedArticles = 0;

      let aiJudgments = 0;

      for (const article of articles) {

        const articleKeywords =
          getKeywords(
            article.title,
            article.summary
          );

        const articleTitleKeywords =
          getTitleKeywords(
            article.title
          );

        const recentEvents =
          await Event.find({
            category:
              article.category,
          })
            .sort({
              updatedAt: -1,
            })
            .limit(100);

        let matchedEvent = null;

        /*
         * First find a few plausible candidates.
         *
         * We don't call Gemini for completely
         * unrelated stories.
         */
        const candidates: {
          event: typeof recentEvents[number];

          score: number;
        }[] = [];

        for (const event of recentEvents) {

          const sharedKeywords =
            getSharedKeywords(
              articleTitleKeywords,
              event.keywords
            );

          const meaningfulSharedWords =
            sharedKeywords.filter(
              (word) =>
                word.length >= 5
            );

          if (
            meaningfulSharedWords.length <
            2
          ) {
            continue;
          }

          const similarity =
            calculateSimilarity(
              articleTitleKeywords,
              event.keywords
            );

          if (
            similarity >= 0.35
          ) {

            candidates.push({
              event,

              score:
                similarity,
            });
          }
        }

        // Stronger candidates are checked first.
        candidates.sort(
          (a, b) =>
            b.score - a.score
        );

        /*
         * Only ask Gemini about the best
         * few candidates.
         */
        const candidatesToJudge =
          candidates.slice(0, 3);

        for (
          const candidate
          of candidatesToJudge
        ) {

          const representativeArticle =
            await Article.findOne({
              articleId:
                candidate.event
                  .representativeArticleId,
            });

          if (!representativeArticle) {
            continue;
          }

          aiJudgments++;

          const judgeResult =
            await this.eventJudge.execute({

              id:
                `${task.id}-${article.articleId}-${candidate.event.eventId}`,

              agentId:
                "event-judge-agent",

              type:
                "judge-event",

              status:
                "running",

              retryCount: 0,

              createdAt:
                new Date(),

              input: {

                existingArticle: {

                  title:
                    representativeArticle.title,

                  summary:
                    representativeArticle.summary,

                  source:
                    representativeArticle.source,
                },

                candidateArticle: {

                  title:
                    article.title,

                  summary:
                    article.summary,

                  source:
                    article.source,
                },
              },
            });

          if (
            !judgeResult.success
          ) {

            this.log(
              "AI event judgment failed. Skipping candidate."
            );

            continue;
          }

          const decision =
            judgeResult.output as {
              sameEvent: boolean;

              confidence: number;

              reason: string;
            };

          if (
            decision.sameEvent &&
            decision.confidence >= 0.80
          ) {

            matchedEvent =
              candidate.event;

            this.log(
              `AI confirmed same event (${decision.confidence}): ${decision.reason}`
            );

            break;
          }

          this.log(
            `AI rejected candidate (${decision.confidence}): ${decision.reason}`
          );
        }

        /*
         * Existing event found.
         */
        if (matchedEvent) {

          matchedEvent.articleIds.push(
            article.articleId
          );

          matchedEvent.keywords = [
            ...new Set([
              ...matchedEvent.keywords,
              ...articleKeywords,
            ]),
          ];

          matchedEvent.updatedAt =
            new Date();

          await matchedEvent.save();

          await Article.updateOne(
            {
              articleId:
                article.articleId,
            },

            {
              eventId:
                matchedEvent.eventId,
            }
          );

          groupedArticles++;

          this.log(
            `Grouped article: "${article.title}"`
          );

        }

        /*
         * No existing event matched.
         */
        else {

          const eventId =
            randomUUID();

          await Event.create({

            eventId,

            representativeArticleId:
              article.articleId,

            title:
              article.title,

            category:
              article.category,

            articleIds: [
              article.articleId,
            ],

            keywords:
              articleKeywords,

            createdAt:
              new Date(),

            updatedAt:
              new Date(),
          });

          await Article.updateOne(
            {
              articleId:
                article.articleId,
            },

            {
              eventId,
            }
          );

          createdEvents++;

          this.log(
            `Created new event: "${article.title}"`
          );
        }
      }

      return {

        success: true,

        output: {

          articlesProcessed:
            articles.length,

          createdEvents,

          groupedArticles,

          aiJudgments,

          taskId:
            task.id,
        },
      };

    } catch (error) {

      this.log(
        "Event clustering failed."
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
}