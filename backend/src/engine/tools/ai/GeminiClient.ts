import { GoogleGenAI } from "@google/genai";

import { env } from "../../../config/env.js";

export class GeminiClient {

  private client: GoogleGenAI;

  constructor() {
    this.client = new GoogleGenAI({
      apiKey: env.GEMINI_API_KEY,
    });
  }

  async generateText(
    prompt: string
  ): Promise<string> {

    const interaction =
      await this.client.interactions.create({
        model: "gemini-3.6-flash",

        input: prompt,

        // We don't need conversation memory
        // for individual newsroom decisions.
        store: false,
      });

    return interaction.output_text ?? "";
  }
}