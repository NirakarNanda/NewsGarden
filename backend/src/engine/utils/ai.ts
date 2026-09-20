import type {
  AIService,
} from "../tools/ai/AIService.js";

import {
  withRetry,
} from "./retry.js";

/*
 * Which AI backend is answering right now.
 *
 * Mirrors the AIService constructor logic
 * so task output can record it cheaply.
 */
export function aiProviderName(): string {

  return (
    process.env.AI_PROVIDER ??
    "ollama"
  );
}

/*
 * Call AIService with one retry on
 * transient failures.
 *
 * Callers catch the final error and fall
 * back to a clearly-marked heuristic.
 */
export async function generateTextWithRetry(
  ai: AIService,
  prompt: string
): Promise<string> {

  return withRetry(
    () => ai.generateText(prompt),

    {
      retries: 1,

      baseDelayMs: 1000,

      maxDelayMs: 5000,
    }
  );
}

export interface AiCallMeta {

  // "ollama" | "gemini" | ...
  model: string;

  // True when we fell back to a heuristic.
  aiFallback: boolean;
}

export function aiMeta(
  aiFallback: boolean
): AiCallMeta {

  return {

    model:
      aiProviderName(),

    aiFallback,
  };
}

/*
 * Pull a JSON value out of a chatty
 * model response. Strips code fences
 * and leading/trailing prose.
 */
export function extractJson<T>(
  text: string
): T {

  let cleaned =
    text.trim();

  cleaned = cleaned
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/, "")
    .replace(/\s*```$/, "");

  const start =
    cleaned.indexOf("{");

  const arrayStart =
    cleaned.indexOf("[");

  let jsonText = cleaned;

  if (
    arrayStart !== -1 &&
    (start === -1 ||
      arrayStart < start)
  ) {

    const end =
      cleaned.lastIndexOf("]");

    if (end !== -1) {

      jsonText = cleaned.slice(
        arrayStart,
        end + 1
      );
    }

  } else if (start !== -1) {

    const end =
      cleaned.lastIndexOf("}");

    if (end !== -1) {

      jsonText = cleaned.slice(
        start,
        end + 1
      );
    }
  }

  return JSON.parse(
    jsonText
  ) as T;
}
