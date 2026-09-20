import type { AIClient } from "./AIClient.js";
import { GeminiClient } from "./GeminiClient.js";
import { LocalModelClient } from "./LocalModelClient.js";

export class AIService {

  private client: AIClient;

  constructor() {

    const provider =
      process.env.AI_PROVIDER ?? "ollama";

    if (provider === "gemini") {

      this.client =
        new GeminiClient();

    } else {

      this.client =
        new LocalModelClient();
    }
  }

  async generateText(
    prompt: string
  ): Promise<string> {

    return this.client.generateText(
      prompt
    );
  }
}