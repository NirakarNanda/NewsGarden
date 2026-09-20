import { GoogleGenAI } from "@google/genai";

export class GeminiClient {

  private client?: GoogleGenAI;

  private getClient(): GoogleGenAI {

    if (!this.client) {

      // The key is read at call time, so a key added to the
      // environment after boot (or rotated) is picked up
      // without restarting the process.
      this.client = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
      });

    }

    return this.client;
  }

  async generateText(
    prompt: string
  ): Promise<string> {

    const interaction =
      await this.getClient().interactions.create({
        model: "gemini-3.6-flash",

        input: prompt,

        // We don't need conversation memory
        // for individual newsroom decisions.
        store: false,
      });

    return interaction.output_text ?? "";
  }
}
