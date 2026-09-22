import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { ImageGenerator } from "../../src/engine/tools/image/ImageGenerator.js";

import { buildPlaceholderSvg } from "../../src/engine/tools/image/placeholder.js";

// ---------------------------------------------------------------------------
// Offline-safety: the placeholder suite forces
// IMAGE_PROVIDER=placeholder so no test here can
// reach the network. The web-fallback suite
// stubs fetch instead.
// ---------------------------------------------------------------------------

function usePlaceholderEnv(): void {

  process.env.IMAGE_PROVIDER =
    "placeholder";
}

function useWebEnv(): void {

  process.env.IMAGE_PROVIDER =
    "web";
}

function clearImageEnv(): void {

  delete process.env.IMAGE_PROVIDER;

  delete process.env.IMAGE_API_KEY;
}

function commonsImageResponse(): Response {

  return {
    ok: true,
    status: 200,
    json: async () => ({
      query: {
        pages: [
          {
            title: "File:Robot.jpg",
            imageinfo: [
              {
                thumburl:
                  "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Robot.jpg/1200px-Robot.jpg",
                url: "https://upload.wikimedia.org/wikipedia/commons/a/ab/Robot.jpg",
                width: 2400,
                height: 1600,
                extmetadata: {
                  Artist: {
                    value:
                      '<a href="https://commons.wikimedia.org/wiki/User:Jane">Jane Doe</a>',
                  },
                  LicenseShortName: {
                    value: "CC BY-SA 4.0",
                  },
                  LicenseUrl: {
                    value:
                      "https://creativecommons.org/licenses/by-sa/4.0/",
                  },
                },
              },
            ],
          },
        ],
      },
    }),
    text: async () => "",
  } as Response;
}

describe("ImageGenerator placeholder", () => {

  afterEach(() => {

    clearImageEnv();

    vi.unstubAllGlobals();
  });

  it("returns a data: URI, never a file path", async () => {

    usePlaceholderEnv();

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

    usePlaceholderEnv();

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

    usePlaceholderEnv();

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

    usePlaceholderEnv();

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

  it("never calls fetch when the provider is placeholder", async () => {

    usePlaceholderEnv();

    const fetchMock = vi.fn(
      async () => commonsImageResponse()
    );

    vi.stubGlobal("fetch", fetchMock);

    const generator =
      new ImageGenerator();

    await generator.generateIllustration(
      "Test headline about robots"
    );

    expect(
      fetchMock
    ).not.toHaveBeenCalled();
  });
});

describe("ImageGenerator web fallback", () => {

  afterEach(() => {

    clearImageEnv();

    vi.unstubAllGlobals();
  });

  it("returns a Wikimedia Commons image with attribution when available", async () => {

    useWebEnv();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        commonsImageResponse()
      )
    );

    const generator =
      new ImageGenerator();

    const image =
      await generator.generateIllustration(
        "Some editorial brief",
        {
          topic: "robots in a factory",
        }
      );

    expect(image.placeholder).toBe(false);

    expect(image.provider).toBe(
      "wikimedia-commons"
    );

    expect(image.path).toContain(
      "upload.wikimedia.org"
    );

    expect(image.credit).toContain(
      "Jane Doe"
    );

    expect(
      image.sourcePageUrl
    ).toContain(
      "commons.wikimedia.org"
    );

    expect(image.licenseName).toBe(
      "CC BY-SA 4.0"
    );
  });

  it("falls back to the placeholder when the network fails", async () => {

    useWebEnv();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {

        throw new Error(
          "network down"
        );
      })
    );

    const generator =
      new ImageGenerator();

    const image =
      await generator.generateIllustration(
        "Some editorial brief"
      );

    expect(image.placeholder).toBe(true);

    expect(image.provider).toBe(
      "placeholder"
    );

    expect(
      image.path.startsWith(
        "data:image/svg+xml,"
      )
    ).toBe(true);

    expect(image.credit).toBeUndefined();
  });

  it("falls back to the placeholder when Commons has no usable image", async () => {

    useWebEnv();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          query: { pages: [] },
        }),
        text: async () => "",
      }) as Response)
    );

    const generator =
      new ImageGenerator();

    const image =
      await generator.generatePhoto(
        "Some photo brief"
      );

    expect(image.placeholder).toBe(true);

    expect(image.provider).toBe(
      "placeholder"
    );
  });

  it("tries the web fallback for unimplemented reserved providers", async () => {

    process.env.IMAGE_PROVIDER =
      "dalle";

    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        commonsImageResponse()
      )
    );

    const generator =
      new ImageGenerator();

    const image =
      await generator.generateIllustration(
        "Some editorial brief"
      );

    expect(image.provider).toBe(
      "wikimedia-commons"
    );

    expect(image.placeholder).toBe(false);
  });
});
