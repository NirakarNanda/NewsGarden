import { withRetry } from "../../utils/retry.js";

export interface FetchedPage {
  url: string;

  title: string;

  text: string;
}

const FETCH_TIMEOUT_MS = 15000;

const MAX_TEXT_LENGTH = 20000;

/*
 * Fetch a URL and return its title and
 * plain text. Naive HTML -> text, no new
 * dependencies.
 */
export class WebFetcher {
  async fetch(url: string): Promise<FetchedPage> {
    return withRetry(
      () => this.fetchOnce(url),

      {
        retries: 2,

        baseDelayMs: 800,

        maxDelayMs: 6000,
      },
    );
  }

  private async fetchOnce(url: string): Promise<FetchedPage> {
    const controller = new AbortController();

    const timeout = setTimeout(
      () => controller.abort(),

      FETCH_TIMEOUT_MS,
    );

    try {
      const response = await fetch(url, {
        signal: controller.signal,

        headers: {
          "User-Agent": "NewsGardenBot/1.0 (+https://newsgarden.local)",

          Accept: "text/html,application/xhtml+xml",
        },
      });

      if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
      }

      const html = await response.text();

      const title = this.extractTitle(html);

      const text = this.htmlToText(html);

      return {
        url,

        title,

        text,
      };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`Fetch timed out after ${FETCH_TIMEOUT_MS}ms: ${url}`, { cause: error });
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  private extractTitle(html: string): string {
    const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);

    if (!match || !match[1]) {
      return "";
    }

    return this.cleanWhitespace(this.decodeEntities(match[1]));
  }

  private htmlToText(html: string): string {
    let text = html;

    // Drop scripts, styles, nav, footers.
    text = text.replace(/<script[\s\S]*?<\/script>/gi, " ");

    text = text.replace(/<style[\s\S]*?<\/style>/gi, " ");

    text = text.replace(/<nav[\s\S]*?<\/nav>/gi, " ");

    text = text.replace(/<footer[\s\S]*?<\/footer>/gi, " ");

    text = text.replace(/<!--[\s\S]*?-->/g, " ");

    // Prefer article/main content when present.
    const articleMatch = text.match(/<article[\s\S]*?<\/article>/i);

    const mainMatch = text.match(/<main[\s\S]*?<\/main>/i);

    if (articleMatch?.[0]) {
      text = articleMatch[0];
    } else if (mainMatch?.[0]) {
      text = mainMatch[0];
    }

    // Paragraphs and headings become line breaks.
    text = text.replace(/<\/(p|h1|h2|h3|h4|li|div|section|br)>/gi, "\n");

    // Strip remaining tags.
    text = text.replace(/<[^>]+>/g, " ");

    text = this.decodeEntities(text);

    text = this.cleanWhitespace(text);

    if (text.length > MAX_TEXT_LENGTH) {
      text = text.slice(0, MAX_TEXT_LENGTH);
    }

    return text;
  }

  private decodeEntities(text: string): string {
    return text

      .replace(/&nbsp;/g, " ")

      .replace(/&amp;/g, "&")

      .replace(/&lt;/g, "<")

      .replace(/&gt;/g, ">")

      .replace(/&quot;/g, '"')

      .replace(/&#39;/g, "'")

      .replace(/&#(\d+);/g, (_m, code) => String.fromCharCode(Number(code)));
  }

  private cleanWhitespace(text: string): string {
    return text

      .replace(/[ \t\r]+/g, " ")

      .replace(/\n{3,}/g, "\n\n")

      .trim();
  }
}
