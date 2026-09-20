import { GoogleGenAI } from "@google/genai";

import { env } from "../../../config/env.js";

export interface SearchResult {
  title: string;
  url: string;
  source: string;
  snippet?: string;
}

export class WebSearch {

  private client: GoogleGenAI;

  constructor() {
    this.client = new GoogleGenAI({
      apiKey: env.GEMINI_API_KEY,
    });
  }

  async search(
    query: string
  ): Promise<SearchResult[]> {

    console.log(
      `🔎 Searching web for: "${query}"`
    );

    const response =
      await this.client.models.generateContent({
        model: "gemini-3.6-flash",

        contents: `
Find reliable web sources about this news event:

${query}

Return ONLY valid JSON in this format:

{
  "sources": [
    {
      "title": "Source article title",
      "url": "https://example.com/article",
      "source": "Website name",
      "snippet": "Short description of what this source reports"
    }
  ]
}

Rules:

- Find multiple relevant sources when available.
- Prefer reputable journalism, official organizations,
  research institutions, and primary sources.
- Do not invent URLs.
- Do not return the same URL twice.
- Only return sources directly relevant to the event.
- Return an empty array if reliable sources cannot be found.
`,

        config: {
          tools: [
            {
              googleSearch: {},
            },
          ],
        },
      });

    const text =
      response.text?.trim() ?? "";

    if (!text) {
      return [];
    }

    return this.parseResults(text);
  }

  private parseResults(
    text: string
  ): SearchResult[] {

    const cleaned =
      text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

    try {

      const parsed =
        JSON.parse(cleaned) as {
          sources?: SearchResult[];
        };

      if (!Array.isArray(parsed.sources)) {
        return [];
      }

      return parsed.sources.filter(
        (source) =>
          typeof source.title === "string" &&
          typeof source.url === "string" &&
          typeof source.source === "string"
      );

    } catch {

      console.error(
        "❌ Failed to parse web search response."
      );

      console.error(text);

      return [];
    }
  }
}