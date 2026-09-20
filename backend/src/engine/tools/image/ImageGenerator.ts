import {
  createHash,
} from "crypto";

export interface GeneratedImage {

  // Public URL path served by the frontend.
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
 * placeholder path under
 * frontend/public/illustrations when no
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

    const hash = createHash("md5")
      .update(
        `${style}:${prompt}`
      )
      .digest("hex")
      .slice(0, 8);

    return {

      path: `/illustrations/placeholder-${hash}.svg`,

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
