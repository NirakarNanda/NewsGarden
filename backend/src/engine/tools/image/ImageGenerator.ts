import {
  buildPlaceholderImageUrl,
} from "./placeholder.js";

import {
  findTopicalImage,
} from "./webImageProvider.js";

export interface GeneratedImage {

  // Image location: a public URL path when a
  // provider is configured, or a self-contained
  // data: URI placeholder when it is not.
  path: string;

  // Which provider made it ("wikimedia-commons"
  // for the free web fallback, "placeholder"
  // when none).
  provider: string;

  // True when this is a stand-in, not real art.
  placeholder: boolean;

  // Attribution for web-sourced images.
  credit?: string;

  sourcePageUrl?: string;

  licenseName?: string;
}

export interface ImageGenerationOptions {

  // Article headline used to search for a
  // topical web image. Falls back to the
  // prompt when omitted.
  topic?: string;
}

/*
 * Illustration generation pipeline.
 *
 * 1. A real AI image provider would be used
 *    when IMAGE_PROVIDER names one and
 *    IMAGE_API_KEY is set. None is
 *    implemented yet, so those names are
 *    only reserved.
 * 2. Otherwise a free topical image is
 *    fetched from Wikimedia Commons (no
 *    API key needed).
 * 3. When Commons has nothing usable, a
 *    deterministic inline SVG data: URI
 *    placeholder is returned.
 *
 * Env:
 *   IMAGE_PROVIDER  "web" (default), "placeholder",
 *                   or a reserved AI provider name
 *   IMAGE_API_KEY   provider key (reserved)
 */
export class ImageGenerator {

  private provider =
    process.env.IMAGE_PROVIDER ??
    "web";

  private apiKey =
    process.env.IMAGE_API_KEY;

  async generateIllustration(
    prompt: string,
    style:
      | string
      | ImageGenerationOptions = "editorial-illustration"
  ): Promise<GeneratedImage> {

    const resolvedStyle =
      typeof style === "string"
        ? style
        : "editorial-illustration";

    const options =
      typeof style === "string"
        ? undefined
        : style;

    return this.generate(
      prompt,
      resolvedStyle,
      options
    );
  }

  async generatePhoto(
    prompt: string,
    options?: ImageGenerationOptions
  ): Promise<GeneratedImage> {

    return this.generateIllustration(
      prompt,
      options ?? "editorial-photo"
    );
  }

  private async generate(
    prompt: string,
    style: string,
    options?: ImageGenerationOptions
  ): Promise<GeneratedImage> {

    if (
      this.provider !== "placeholder" &&
      this.provider !== "web"
    ) {

      console.warn(
        `[ImageGenerator] Provider "${this.provider}" is not implemented yet` +
          (this.apiKey
            ? ""
            : " and IMAGE_API_KEY is missing") +
          "; trying the free web fallback."
      );
    }

    if (
      this.provider !== "placeholder"
    ) {

      const topic =
        options?.topic?.trim() ||
        prompt;

      console.log(
        `[ImageGenerator] mode="${this.provider}" topic="${topic.slice(0, 80)}"`
      );

      const web =
        await findTopicalImage(topic);

      if (web) {

        return {

          path: web.url,

          provider: "wikimedia-commons",

          placeholder: false,

          credit: web.credit,

          sourcePageUrl:
            web.sourcePageUrl,

          licenseName:
            web.licenseName,
        };
      }

      console.log(
        `[ImageGenerator] No Commons image for "${topic.slice(0, 60)}"; using placeholder.`
      );
    }

    const url =
      buildPlaceholderImageUrl(
        prompt,
        style
      );

    return {

      path: url,

      provider: "placeholder",

      placeholder: true,
    };
  }
}
