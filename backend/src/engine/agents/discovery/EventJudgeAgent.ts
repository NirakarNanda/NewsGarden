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

interface EventJudgeResult {
  sameEvent: boolean;

  confidence: number;

  reason: string;
}

export class EventJudgeAgent
  extends BaseAgent {

  id = "event-judge-agent";

  name = "Event Judge Agent";

  role = "Determine whether two articles cover the same event";

  department = "discovery";

  private ai =
    new AIService();

  async execute(
    task: AgentTask
  ): Promise<AgentResult> {

    this.log(
      "Judging whether articles describe the same event..."
    );

    try {

      const input =
        task.input as {
          existingArticle: {
            title: string;
            summary?: string;
            source: string;
          };

          candidateArticle: {
            title: string;
            summary?: string;
            source: string;
          };
        };

      const prompt = `
You are the event verification agent for an autonomous technology newspaper.

Your ONLY job is to determine whether two news articles describe the SAME REAL-WORLD EVENT.

Do NOT decide whether they are:
- about the same topic
- about the same company
- about the same technology
- generally related

They must describe the same underlying event or occurrence.

ARTICLE A
Source: ${input.existingArticle.source}
Title: ${input.existingArticle.title}
Summary: ${input.existingArticle.summary ?? "No summary"}

ARTICLE B
Source: ${input.candidateArticle.source}
Title: ${input.candidateArticle.title}
Summary: ${input.candidateArticle.summary ?? "No summary"}

Return ONLY valid JSON:

{
  "sameEvent": true,
  "confidence": 0.95,
  "reason": "Both articles describe the same specific event."
}

Rules:
- sameEvent must be true or false.
- confidence must be between 0 and 1.
- reason must be short.
- If they only share a topic, company, technology, or person but describe different events, return false.
`;

      const response =
        await this.ai.generateText(
          prompt
        );

      const result =
        this.parseResponse(response);

      this.log(
        `Decision: ${result.sameEvent ? "SAME EVENT" : "DIFFERENT EVENT"} (${result.confidence})`
      );

      return {
        success: true,

        output: result,
      };

    } catch (error) {

      this.log(
        "Event judgment failed."
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

  private parseResponse(
    response: string
  ): EventJudgeResult {

    const cleaned =
      response
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

    const parsed =
      JSON.parse(cleaned) as EventJudgeResult;

    if (
      typeof parsed.sameEvent !==
      "boolean"
    ) {
      throw new Error(
        "Invalid sameEvent value"
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