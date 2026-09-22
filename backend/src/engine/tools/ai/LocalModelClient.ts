import type { AIClient } from "./AIClient.js";

import { fetchWithTimeout } from "../../utils/fetchWithTimeout.js";

interface OllamaResponse {
  response?: string;
  error?: string;
}

export class LocalModelClient
  implements AIClient {

  private baseUrl =
    process.env.OLLAMA_BASE_URL ??
    "http://127.0.0.1:11434";

  private model =
    process.env.OLLAMA_MODEL ??
    "qwen3:4b";

  async generateText(
    prompt: string
  ): Promise<string> {

    const url =
      `${this.baseUrl}/api/generate`;

    console.log(
      `[Local Model] Calling Ollama: ${this.model}`
    );

    try {

      const response =
        await fetchWithTimeout(
          url,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              model:
                this.model,

              prompt,

              stream:
                false,
            }),
          }
        );

      if (!response.ok) {

        const errorText =
          await response.text();

        throw new Error(
          `Ollama request failed: ${response.status} ${errorText}`
        );
      }

      const data =
        await response.json() as OllamaResponse;

      if (data.error) {
        throw new Error(
          `Ollama error: ${data.error}`
        );
      }

      if (
        !data.response ||
        data.response.trim() === ""
      ) {
        throw new Error(
          "Ollama returned an empty response"
        );
      }

      return data.response.trim();

    } catch (error) {

      console.error(
        "[Local Model] Ollama connection failed:",
        error instanceof Error
          ? error.message
          : error
      );

      throw error;
    }
  }
}