import {
  Article,
} from "../../models/Article.js";

/*
 * Normalize a URL so trivial variants
 * (trailing slash, tracking params,
 * fragment) dedupe to one key.
 */
export function normalizeUrl(
  url: string
): string {

  try {

    const parsed =
      new URL(url.trim());

    parsed.hash = "";

    const params =
      new URLSearchParams();

    for (const [
      key,
      value,
    ] of parsed.searchParams) {

      const lowerKey =
        key.toLowerCase();

      if (
        lowerKey.startsWith(
          "utm_"
        ) ||
        lowerKey === "fbclid" ||
        lowerKey === "gclid" ||
        lowerKey === "ref" ||
        lowerKey === "source"
      ) {

        continue;
      }

      params.append(key, value);
    }

    parsed.search =
      params.toString();

    let normalized =
      parsed.toString().toLowerCase();

    if (
      normalized.endsWith("/") &&
      !parsed.pathname.endsWith(
        "//"
      )
    ) {

      normalized =
        normalized.slice(0, -1);
    }

    return normalized;

  } catch {

    return url
      .trim()
      .toLowerCase();
  }
}

/*
 * Remembers article URLs seen by the
 * discovery agents so the same story is
 * never saved twice, even across runs.
 *
 * In-memory Set for speed plus a MongoDB
 * lookup (Article model) as the durable
 * source of truth, same pattern as
 * TechNewsAgent.
 */
export class SourceMemory {

  private seen: Set<string> =
    new Set();

  async has(
    url: string
  ): Promise<boolean> {

    const key =
      normalizeUrl(url);

    if (this.seen.has(key)) {

      return true;
    }

    try {

      const existing =
        await Article.findOne({
          url,
        }).select("_id");

      if (existing) {

        this.seen.add(key);

        return true;
      }

    } catch (error) {

      console.warn(
        "[SourceMemory] DB dedupe check failed:",

        error instanceof Error
          ? error.message
          : error
      );
    }

    return false;
  }

  add(
    url: string,
    _articleId?: string
  ): void {

    this.seen.add(
      normalizeUrl(url)
    );
  }

  size(): number {

    return this.seen.size;
  }

  clear(): void {

    this.seen.clear();
  }
}

/*
 * Shared across discovery agents in one
 * process so feeds that overlap do not
 * re-check the database for the same URL.
 */
export const sourceMemory =
  new SourceMemory();
