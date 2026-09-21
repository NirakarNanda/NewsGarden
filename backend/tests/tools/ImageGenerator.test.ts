import {
  describe,
  expect,
  it,
} from "vitest";

import { ImageGenerator } from "../../src/engine/tools/image/ImageGenerator.js";

import { buildPlaceholderSvg } from "../../src/engine/tools/image/placeholder.js";

describe("ImageGenerator placeholder", () => {

  it("returns a data: URI, never a file path", async () => {

    const generator =
      new ImageGenerator();

    const image =
      await generator.generateIllustration(
        "Test headline about robots"
      );

    expect(image.placeholder).toBe(true);

    expect(image.provider).toBe("placeholder");

    expect(
      image.path.startsWith(
        "data:image/svg+xml,"
      )
    ).toBe(true);

    expect(
      image.path
    ).not.toContain("/illustrations/");
  });

  it("decodes to a valid SVG document", async () => {

    const generator =
      new ImageGenerator();

    const image =
      await generator.generateIllustration(
        "Test headline about robots"
      );

    const svg =
      decodeURIComponent(
        image.path.replace(
          "data:image/svg+xml,",
          ""
        )
      );

    expect(svg).toContain("<svg");

    expect(svg).toContain("</svg>");

    expect(svg).toContain(
      'viewBox="0 0 800 450"'
    );
  });

  it("is deterministic per prompt and varies across prompts", async () => {

    const generator =
      new ImageGenerator();

    const first =
      await generator.generateIllustration(
        "Same prompt"
      );

    const second =
      await generator.generateIllustration(
        "Same prompt"
      );

    const other =
      await generator.generateIllustration(
        "Different prompt"
      );

    expect(first.path).toBe(
      second.path
    );

    expect(first.path).not.toBe(
      other.path
    );
  });

  it("generatePhoto uses the same placeholder pipeline", async () => {

    const generator =
      new ImageGenerator();

    const image =
      await generator.generatePhoto(
        "Some photo brief"
      );

    expect(
      image.path.startsWith(
        "data:image/svg+xml,"
      )
    ).toBe(true);

    expect(image.placeholder).toBe(true);
  });

  it("buildPlaceholderSvg carries no text content", () => {

    const svg =
      buildPlaceholderSvg(
        "Prompt with <script> & quotes",
        "editorial-illustration"
      );

    // All injected values are numeric; user
    // text never reaches the markup.
    expect(svg).not.toContain("<script>");

    expect(svg).not.toContain("<text");
  });
});
