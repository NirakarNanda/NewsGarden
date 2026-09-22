import {
  withRetry,
} from "../../utils/retry.js";

/*
 * Free image lookup against Wikimedia
 * Commons. No API key is needed: the
 * MediaWiki API is public and returns
 * only freely reusable media.
 *
 * The search takes an article topic
 * (ideally the headline), requests image
 * metadata, and returns the first result
 * that is an actual photograph/bitmap in
 * a clearly free licence. Anything
 * ambiguous (no metadata, non-image
 * media, unclear or non-free licence)
 * is skipped so the caller can fall back
 * to the deterministic SVG placeholder.
 */

export interface WebImage {

  // Direct URL of a display-sized thumbnail.
  url: string;

  // Human-readable attribution line.
  credit: string;

  // Commons file page the image came from.
  sourcePageUrl: string;

  // Short licence name, e.g. "CC BY-SA 4.0".
  licenseName: string;
}

const COMMONS_API =
  "https://commons.wikimedia.org/w/api.php";

const USER_AGENT =
  "NewsGarden/1.0 (https://github.com/NirakarNanda/NewsGarden)";

const REQUEST_TIMEOUT_MS =
  12_000;

const MAX_RESULTS =
  10;

// Licences we treat as clearly reusable.
// Anything else (fair use, missing,
// "Copyrighted" without a free grant) is
// rejected.
const FREE_LICENSE =
  /cc0|public domain|cc[\s-]?by|gfdl/i;

// CC BY-NC / BY-ND style licences are not
// free enough for republication.
const NON_FREE_QUALIFIER =
  /nc|nd/i;

const IMAGE_EXTENSION =
  /\.(jpe?g|png|webp|gif)$/i;

const MIN_WIDTH =
  400;

interface CommonsExtMeta {

  value?: string;
}

interface CommonsImageInfo {

  url?: string;

  thumburl?: string;

  width?: number;

  extmetadata?: Record<
    string,
    CommonsExtMeta
  >;
}

interface CommonsPage {

  title?: string;

  imageinfo?: CommonsImageInfo[];
}

interface CommonsResponse {

  query?: {

    pages?: CommonsPage[];
  };
}

// Strips HTML tags from the Artist value
// and decodes the few entities Commons
// emits.
function cleanArtist(
  raw: string | undefined
): string {

  if (!raw) {

    return "Unknown author";
  }

  const withoutTags =
    raw.replace(
      /<[^>]*>/g,
      " "
    );

  return withoutTags
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#0?39;/g, "'")
    .replace(/\s+/g, " ")
    .trim() ||
    "Unknown author";
}

function isFreeLicense(
  shortName: string | undefined
): boolean {

  if (!shortName) {

    return false;
  }

  if (
    NON_FREE_QUALIFIER.test(
      shortName
    )
  ) {

    return false;
  }

  return FREE_LICENSE.test(
    shortName
  );
}

function buildSearchUrl(
  query: string
): string {

  // filetype:bitmap keeps videos, audio
  // and vector files out of the results.
  const search =
    `${query} filetype:bitmap`;

  const params =
    new URLSearchParams({
      action: "query",
      format: "json",
      formatversion: "2",
      generator: "search",
      gsrsearch: search,
      gsrnamespace: "6",
      gsrlimit: String(MAX_RESULTS),
      prop: "imageinfo",
      iiprop: "url|size|extmetadata",
      iiurlwidth: "1200",
    });

  return `${COMMONS_API}?${params.toString()}`;
}

function toWebImage(
  page: CommonsPage
): WebImage | null {

  const info =
    page.imageinfo?.[0];

  if (!info) {

    return null;
  }

  const meta =
    info.extmetadata ?? {};

  const licenseName =
    meta.LicenseShortName?.value?.trim();

  if (
    !isFreeLicense(licenseName)
  ) {

    return null;
  }

  const url =
    info.thumburl ?? info.url;

  if (
    !url ||
    !IMAGE_EXTENSION.test(
      url.split("?")[0] ?? ""
    )
  ) {

    return null;
  }

  if (
    typeof info.width === "number" &&
    info.width < MIN_WIDTH
  ) {

    return null;
  }

  const title =
    page.title ?? "";

  const sourcePageUrl =
    `https://commons.wikimedia.org/wiki/` +
    encodeURIComponent(
      title.replace(/ /g, "_")
    );

  const artist =
    cleanArtist(
      meta.Artist?.value
    );

  return {

    url,

    credit:
      `Photo: ${artist} via Wikimedia Commons (${licenseName})`,

    sourcePageUrl,

    licenseName: licenseName ?? "",
  };
}

// Returns the first acceptable freely
// reusable image for the topic, or null
// when Commons has nothing usable. Never
// throws: every failure mode (timeout,
// HTTP error, malformed payload, empty
// results) resolves to null so the
// caller can fall back to the placeholder.
export async function findTopicalImage(
  topic: string
): Promise<WebImage | null> {

  const query =
    topic
      .replace(/["“”]/g, "")
      .trim()
      .slice(0, 120);

  if (!query) {

    return null;
  }

  try {

    const response =
      await withRetry(
        async () => {

          const controller =
            new AbortController();

          const timer =
            setTimeout(
              () =>
                controller.abort(),
              REQUEST_TIMEOUT_MS
            );

          try {

            const res =
              await fetch(
                buildSearchUrl(query),
                {
                  signal:
                    controller.signal,
                  headers: {
                    "User-Agent":
                      USER_AGENT,
                    Accept:
                      "application/json",
                  },
                }
              );

            if (!res.ok) {

              throw new Error(
                `Commons HTTP ${res.status}`
              );
            }

            return res;

          } finally {

            clearTimeout(timer);
          }
        },
        {
          retries: 1,
        }
      );

    const data =
      (await response.json()) as
        CommonsResponse;

    const pages =
      data?.query?.pages;

    if (!Array.isArray(pages)) {

      return null;
    }

    for (const page of pages) {

      const image =
        toWebImage(page);

      if (image) {

        return image;
      }
    }

    return null;

  } catch {

    return null;
  }
}
