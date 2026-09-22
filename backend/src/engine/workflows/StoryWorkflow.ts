import type {
  AgentTask,
} from "../../types/task.js";

import type {
  AgentResult,
} from "../agents/BaseAgent.js";

import {
  BrainAgent,
} from "../brain/BrainAgent.js";

import {
  AIService,
} from "../tools/ai/AIService.js";

import {
  WebFetcher,
} from "../tools/web/WebFetcher.js";

import {
  Article,
} from "../../models/Article.js";

import {
  generateTextWithRetry,
  extractJson,
  aiProviderName,
} from "../utils/ai.js";

import { eventBus } from "../events/EventBus.js";

/** Story pipeline stages surfaced on the live build view. */
export type StoryStage = "research" | "write" | "headline" | "illustrate";

export interface StoryResult {

  articleId: string;

  taskIds: string[];

  aiFallback: boolean;

  researchNotes: string;
}

interface ResearchNotes {

  keyFacts: string[];

  entities: string[];

  context: string[];

  openQuestions: string[];
}

/*
 * Single-story pipeline:
 *
 *   research -> write -> edit
 *     -> headline -> illustrate
 *     -> fact-check
 *
 * Runs each step through the brain so
 * every step is a persisted task with
 * lifecycle events. Returns the articleId.
 */
export class StoryWorkflow {

  private ai =
    new AIService();

  private webFetcher =
    new WebFetcher();

  async run(
    brain: BrainAgent,
    articleId: string,
    editionId?: string
  ): Promise<StoryResult> {

    const taskIds: string[] =
      [];

    let aiFallback = false;

    const emitStory = (
      name: string,
      payload: Record<string, unknown>
    ) => {
      eventBus.emit(name, {
        editionId: editionId ?? null,
        articleId,
        at: new Date().toISOString(),
        ...payload,
      });
    };

    emitStory("STORY_STARTED", {});
    emitStory("STORY_STAGE", { stage: "research" as StoryStage });

    // 1. Research: fetch the source page
    // and synthesize notes with AI.
    const researchTask =
      await brain.createTask(
        "story-workflow",
        "research-story",
        { articleId }
      );

    taskIds.push(
      researchTask.taskId
    );

    const researchResult =
      await brain.runTask(
        researchTask.taskId,
        (task) =>
          this.research(task)
      );

    this.throwIfFailed(
      researchResult,
      "research-story",
      articleId
    );

    const researchOutput =
      researchResult.output as {
        notes: string;
        aiFallback: boolean;
      };

    if (
      researchOutput.aiFallback
    ) {

      aiFallback = true;
    }

    // 2-6. Editorial + visual + quality.
    const steps: {
      agentId: string;
      type: string;
    }[] = [

      {
        agentId:
          "article-writer-agent",
        type: "write-article",
      },

      {
        agentId: "editor-agent",
        type: "edit-article",
      },

      {
        agentId:
          "headline-agent",
        type: "write-headline",
      },

      {
        agentId:
          "illustration-agent",
        type: "generate-illustration",
      },

      {
        agentId:
          "fact-check-agent",
        type: "fact-check",
      },
    ];

    for (const step of steps) {

      // Surface the user-facing pipeline stages on the live build view.
      const stageForStep: Record<string, StoryStage> = {
        "write-article": "write",
        "write-headline": "headline",
        "generate-illustration": "illustrate",
      };
      const stage = stageForStep[step.type];
      if (stage) {
        emitStory("STORY_STAGE", { stage });
      }

      const input: Record<
        string,
        unknown
      > = { articleId };

      if (
        step.type ===
        "write-article"
      ) {

        input.researchNotes =
          researchOutput.notes;
      }

      const task =
        await brain.createTask(
          step.agentId,
          step.type,
          input
        );

      taskIds.push(
        task.taskId
      );

      const result =
        await brain.runTask(
          task.taskId
        );

      this.throwIfFailed(
        result,
        step.type,
        articleId
      );

      const output =
        (result.output ?? {}) as {
          aiFallback?: boolean;
        };

      if (
        output.aiFallback
      ) {

        aiFallback = true;
      }
    }

    emitStory("STORY_COMPLETED", { aiFallback });

    return {

      articleId,

      taskIds,

      aiFallback,

      researchNotes:
        researchOutput.notes,
    };
  }

  /*
   * Research executor: runs inside
   * brain.runTask so it gets task status
   * and events like any agent step.
   */
  private async research(
    task: AgentTask
  ): Promise<AgentResult> {

    const model =
      aiProviderName();

    let aiFallback = false;

    try {

      const input =
        task.input as {
          articleId: string;
        };

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

      article.status =
        "researching";

      await article.save();

      // Fetch the source page for depth.
      // Paywalls and dead links are
      // normal: fall back to the summary.
      let pageText = "";

      try {

        const page =
          await this.webFetcher.fetch(
            article.url
          );

        pageText = page.text.slice(
          0,
          4000
        );

      } catch (error) {

        console.warn(
          `[StoryWorkflow] Could not fetch ${article.url}:`,

          error instanceof Error
            ? error.message
            : error
        );
      }

      let notes: ResearchNotes;

      try {

        notes =
          await this.synthesizeNotes(
            article.title,
            article.source,
            article.summary,
            pageText
          );

      } catch (error) {

        console.warn(
          `[StoryWorkflow] AI research failed (${error instanceof Error ? error.message : "unknown"}). Using summary notes.`
        );

        aiFallback = true;

        notes =
          this.summaryNotes(
            article.summary
          );
      }

      const formatted =
        this.formatNotes(notes);

      return {

        success: true,

        output: {

          articleId:
            article.articleId,

          notes: formatted,

          keyFactCount:
            notes.keyFacts.length,

          aiFallback,

          model,

          taskId: task.id,
        },
      };

    } catch (error) {

      return {

        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      };
    }
  }

  private async synthesizeNotes(
    title: string,
    source: string,
    summary: string | undefined,
    pageText: string
  ): Promise<ResearchNotes> {

    const prompt = `You are a research assistant for a serious daily newspaper.

Produce research notes for the story below.

TITLE: ${title}
SOURCE: ${source}
SUMMARY: ${summary ?? "No summary."}
${pageText ? `PAGE TEXT:\n${pageText}\n` : ""}

Return ONLY valid JSON:
{"keyFacts": ["..."], "entities": ["..."], "context": ["..."], "openQuestions": ["..."]}

Rules:
- keyFacts: up to 8 verifiable facts from the text.
- entities: people, organizations, places named.
- context: background a reader needs to understand the story.
- openQuestions: claims that still need verification.
- Do NOT invent facts beyond the text provided.
- No markdown, no prose.`;

    const response =
      await generateTextWithRetry(
        this.ai,
        prompt
      );

    const parsed =
      extractJson<ResearchNotes>(
        response
      );

    for (const key of [
      "keyFacts",
      "entities",
      "context",
      "openQuestions",
    ] as const) {

      if (
        !Array.isArray(
          parsed[key]
        )
      ) {

        throw new Error(
          `Invalid research notes: ${key} is not an array`
        );
      }
    }

    return parsed;
  }

  private summaryNotes(
    summary: string | undefined
  ): ResearchNotes {

    const sentences = (
      summary ?? ""
    )
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 6);

    return {

      keyFacts: sentences,

      entities: [],

      context: [
        "AI research unavailable; notes derived from the story summary only.",
      ],

      openQuestions: [
        "Verify all claims against the original source before publication.",
      ],
    };
  }

  private formatNotes(
    notes: ResearchNotes
  ): string {

    const section = (
      title: string,
      items: string[]
    ): string =>
      items.length > 0
        ? `${title}:\n${items
            .map(
              (i) => `- ${i}`
            )
            .join("\n")}`
        : "";

    return [
      section(
        "KEY FACTS",
        notes.keyFacts
      ),

      section(
        "ENTITIES",
        notes.entities
      ),

      section(
        "CONTEXT",
        notes.context
      ),

      section(
        "OPEN QUESTIONS",
        notes.openQuestions
      ),
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  private throwIfFailed(
    result: AgentResult,
    step: string,
    articleId: string
  ): void {

    if (!result.success) {

      throw new Error(
        `StoryWorkflow failed at ${step} for article ${articleId}: ${result.error ?? "unknown error"}`
      );
    }
  }
}
