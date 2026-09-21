import {
  buildPlaceholderImageUrl,
} from "./placeholder.js";

export interface GeneratedImage {

  // Image location: a public URL path when a
  // provider is configured, or a self-contained
  // data: URI placeholder when it is not.
  path: string;

  // Which provider made it ("placeholder" when none).
  provider: string;

  // True when this is a stand-in, not real art.
  placeholder: boolean;
}

/*
 * Illustration generation.
 *
 * Interface-compatible stub: returns a
 * deterministic inline SVG data: URI when no
 * image provider is configured. Reads env
 * for an optional provider key but never
 * requires one.
 *
 * Env:
 *   IMAGE_PROVIDER  e.g. "dalle" (reserved)
 *   IMAGE_API_KEY   provider key (reserved)
 */
export class ImageGenerator {

  private provider =
    process.env.IMAGE_PROVIDER ??
    "placeholder";

  private apiKey =
    process.env.IMAGE_API_KEY;

  async generateIllustration(
    prompt: string,
    style: string = "editorial-illustration"
  ): Promise<GeneratedImage> {

    if (
      this.provider !==
        "placeholder" &&
      this.apiKey
    ) {

      console.warn(
        `[ImageGenerator] Provider "${this.provider}" is not implemented yet; returning a placeholder.`
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

  async generatePhoto(
    prompt: string
  ): Promise<GeneratedImage> {

    return this.generateIllustration(
      prompt,
      "editorial-photo"
    );
  }
}
