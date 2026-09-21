import type { AIClient } from "./AIClient.js";
import { GeminiClient } from "./GeminiClient.js";
import { LocalModelClient } from "./LocalModelClient.js";
import { OpenAICompatibleClient } from "./OpenAICompatibleClient.js";
import { Semaphore } from "./Semaphore.js";

import { env } from "../../../config/env.js";

/*
 * One gate for the whole process: every AIService instance shares
 * it, so concurrent agents cannot collectively hammer the provider.
 */
const aiSlots = new Semaphore(env.aiMaxConcurrency);

export class AIService {

  private client: AIClient;

  constructor() {

    const provider =
      process.env.AI_PROVIDER ?? "ollama";

    if (provider === "gemini") {

      this.client =
        new GeminiClient();

    } else if (provider === "openai") {

      // Any OpenAI-compatible HTTP API
      // (Groq, OpenRouter, Cerebras, ...).
      this.client =
        new OpenAICompatibleClient();

    } else {

      this.client =
        new LocalModelClient();
    }
  }

  async generateText(
    prompt: string
  ): Promise<string> {

    const release = await aiSlots.acquire();

    try {

      return await this.client.generateText(
        prompt
      );

    } finally {

      release();
    }
  }
}