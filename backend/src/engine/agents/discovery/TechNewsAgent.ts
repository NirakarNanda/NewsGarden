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
  RssReader,
} from "../../tools/web/RssReader.js";

import {
  techNewsSources,
} from "../../../config/sources.js";

import {
  Article,
} from "../../../models/Article.js";

export class TechNewsAgent
  extends BaseAgent {

  id = "tech-news-agent";

  name = "Tech News Agent";

  role = "Global Technology News Discovery";

  department = "discovery";

  private rssReader =
    new RssReader();

  async execute(
    task: AgentTask
  ): Promise<AgentResult> {

    this.log(
      "Starting technology news discovery..."
    );

    try {

      // Get stories from RSS feeds.
      const stories =
        await this.rssReader.readFeeds(
          techNewsSources
        );

      this.log(
        `Collected ${stories.length} RSS stories.`
      );

      let newStories = 0;

      let duplicateStories = 0;

      // Process every discovered story.
      for (const story of stories) {

        // Check whether we already know this article.
        const existing =
          await Article.findOne({
            url: story.url,
          });

        if (existing) {

          duplicateStories++;

          continue;
        }

        // Save new article.
        await Article.create({

          articleId: randomUUID(),

          title: story.title,

          url: story.url,

          source: story.source,

          summary: story.summary,

          publishedAt:
            story.publishedAt,

          discoveredAt: new Date(),

          category: "technology",

          status: "discovered",
        });

        newStories++;
      }

      this.log(
        `Saved ${newStories} new stories.`
      );

      this.log(
        `Skipped ${duplicateStories} duplicates.`
      );

      return {

        success: true,

        output: {

          discovered:
            stories.length,

          newStories,

          duplicateStories,

          taskId: task.id,
        },
      };

    } catch (error) {

      this.log(
        "Technology news discovery failed."
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