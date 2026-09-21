import type { AIClient } from "./AIClient.js";

interface ChatCompletionsResponse {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  error?: {
    message?: string;
  };
}

/*
 * Any HTTP API that speaks the OpenAI
 * chat-completions format:
 *
 *   POST {AI_BASE_URL}/chat/completions
 *
 * This one client covers Groq, OpenRouter,
 * Cerebras, Together, DeepSeek, Fireworks,
 * and any other OpenAI-compatible endpoint.
 *
 * Required env:
 *   AI_PROVIDER=openai
 *   AI_BASE_URL  e.g. https://api.groq.com/openai/v1
 *   AI_API_KEY   provider key (read at call time)
 *   AI_MODEL     e.g. llama-3.3-70b-versatile
 */
export class OpenAICompatibleClient implements AIClient {
  private baseUrl(): string {
    const raw = process.env.AI_BASE_URL?.trim();

    if (!raw) {
      throw new Error("AI_BASE_URL is not set " + "(required when AI_PROVIDER=openai)");
    }

    return raw.replace(/\/+$/, "");
  }

  private apiKey(): string {
    const key = process.env.AI_API_KEY?.trim();

    if (!key) {
      throw new Error("AI_API_KEY is not set " + "(required when AI_PROVIDER=openai)");
    }

    return key;
  }

  private model(): string {
    const model = process.env.AI_MODEL?.trim();

    if (!model) {
      throw new Error("AI_MODEL is not set " + "(required when AI_PROVIDER=openai)");
    }

    return model;
  }

  async generateText(prompt: string): Promise<string> {
    const model = this.model();

    const url = `${this.baseUrl()}/chat/completions`;

    console.log(`[OpenAI-compatible] Calling ${model}`);

    let response: Response;

    try {
      response = await fetch(url, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          Authorization: `Bearer ${this.apiKey()}`,
        },

        body: JSON.stringify({
          model,

          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],

          stream: false,
        }),
      });
    } catch (error) {
      throw new Error(
        "AI provider request failed: " + (error instanceof Error ? error.message : String(error)),
        { cause: error },
      );
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");

      if (response.status === 401) {
        throw new Error("AI provider rejected the API key " + `(401): ${errorText}`);
      }

      if (response.status === 429) {
        throw new Error("AI provider rate limit exceeded " + `(429): ${errorText}`);
      }

      throw new Error("AI provider request failed: " + `${response.status} ${errorText}`);
    }

    const data = (await response.json()) as ChatCompletionsResponse;

    if (data.error?.message) {
      throw new Error(`AI provider error: ${data.error.message}`);
    }

    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new Error("AI provider returned an empty response");
    }

    return content;
  }
}
