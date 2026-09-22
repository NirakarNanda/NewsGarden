import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  findTopicalImage,
} from "../../src/engine/tools/image/webImageProvider.js";

// ---------------------------------------------------------------------------
// Offline-safety: this suite must never touch the network.
// fetch is stubbed per-test; the provider under test only
// ever talks through fetch.
// ---------------------------------------------------------------------------

function commonsResponse(
  pages: unknown[]
): Response {

  return {
    ok: true,
    status: 200,
    json: async () => ({
      query: { pages },
    }),
    text: async () => "",
  } as Response;
}

function imagePage(
  overrides: Record<string, unknown> = {}
): unknown {

  return {
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
    ...overrides,
  };
}

function stubFetch(
  impl: () => Promise<Response>
): void {

  vi.stubGlobal(
    "fetch",
    vi.fn(impl)
  );
}

describe("findTopicalImage", () => {

  afterEach(() => {

    vi.unstubAllGlobals();
  });

  it("returns the first acceptable image with attribution", async () => {

    stubFetch(async () =>
      commonsResponse([imagePage()])
    );

    const image =
      await findTopicalImage(
        "robots in a factory"
      );

    expect(image).not.toBeNull();

    expect(
      image!.url
    ).toContain(
      "upload.wikimedia.org"
    );

    expect(
      image!.credit
    ).toContain("Jane Doe");

    expect(
      image!.credit
    ).toContain("Wikimedia Commons");

    expect(
      image!.credit
    ).toContain("CC BY-SA 4.0");

    expect(
      image!.sourcePageUrl
    ).toBe(
      "https://commons.wikimedia.org/wiki/File%3ARobot.jpg"
    );

    expect(
      image!.licenseName
    ).toBe("CC BY-SA 4.0");
  });

  it("skips non-free licences and picks the next free one", async () => {

    const nonFree = imagePage({
      title: "File:Locked.jpg",
      imageinfo: [
        {
          ...(imagePage() as Record<
            string,
            unknown
          >).imageinfo as unknown as Record<
            string,
            unknown
          >[],
          extmetadata: {
            Artist: {
              value: "Someone",
            },
            LicenseShortName: {
              value: "CC BY-NC-ND 4.0",
            },
          },
        },
      ],
    });

    stubFetch(async () =>
      commonsResponse([
        nonFree,
        imagePage(),
      ])
    );

    const image =
      await findTopicalImage("robots");

    expect(image).not.toBeNull();

    expect(
      image!.licenseName
    ).toBe("CC BY-SA 4.0");

    expect(
      image!.sourcePageUrl
    ).toContain("Robot.jpg");
  });

  it("accepts other known free licences", async () => {

    for (const licence of [
      "CC0",
      "Public domain",
      "CC BY 4.0",
      "GFDL",
    ]) {

      const page = imagePage({
        imageinfo: [
          {
            thumburl:
              "https://upload.wikimedia.org/wikipedia/commons/a/ab/Robot.png",
            url: "https://upload.wikimedia.org/wikipedia/commons/a/ab/Robot.png",
            width: 800,
            extmetadata: {
              Artist: {
                value: "Jane",
              },
              LicenseShortName: {
                value: licence,
              },
            },
          },
        ],
      });

      stubFetch(async () =>
        commonsResponse([page])
      );

      const image =
        await findTopicalImage(
          "robots"
        );

      expect(
        image,
        `licence ${licence}`
      ).not.toBeNull();

      vi.unstubAllGlobals();
    }
  });

  it("returns null when results are empty", async () => {

    stubFetch(async () =>
      commonsResponse([])
    );

    expect(
      await findTopicalImage(
        "definitely not a real topic xyzzy"
      )
    ).toBeNull();
  });

  it("returns null on a network failure", async () => {

    stubFetch(async () => {

      throw new Error(
        "network down"
      );
    });

    expect(
      await findTopicalImage("robots")
    ).toBeNull();
  });

  it("returns null on an HTTP error", async () => {

    stubFetch(async () => {

      return {
        ok: false,
        status: 503,
        json: async () => ({}),
        text: async () => "busy",
      } as Response;
    });

    expect(
      await findTopicalImage("robots")
    ).toBeNull();
  });

  it("returns null on a malformed response", async () => {

    stubFetch(async () => {

      return {
        ok: true,
        status: 200,
        json: async () => ({
          nonsense: true,
        }),
        text: async () => "",
      } as Response;
    });

    expect(
      await findTopicalImage("robots")
    ).toBeNull();
  });

  it("rejects non-image media", async () => {

    const video = imagePage({
      title: "File:Robot.ogv",
      imageinfo: [
        {
          thumburl:
            "https://upload.wikimedia.org/wikipedia/commons/transcoded/a/ab/Robot.ogv/Robot.ogv.720p.vp9.webm",
          url: "https://upload.wikimedia.org/wikipedia/commons/a/ab/Robot.ogv",
          width: 1280,
          extmetadata: {
            Artist: {
              value: "Jane",
            },
            LicenseShortName: {
              value: "CC BY-SA 4.0",
            },
          },
        },
      ],
    });

    stubFetch(async () =>
      commonsResponse([video])
    );

    expect(
      await findTopicalImage("robots")
    ).toBeNull();
  });

  it("rejects images with an unclear licence", async () => {

    const unclear = imagePage({
      imageinfo: [
        {
          thumburl:
            "https://upload.wikimedia.org/wikipedia/commons/a/ab/Robot.jpg",
          url: "https://upload.wikimedia.org/wikipedia/commons/a/ab/Robot.jpg",
          width: 800,
          extmetadata: {
            Artist: {
              value: "Jane",
            },
            LicenseShortName: {
              value: "",
            },
          },
        },
      ],
    });

    stubFetch(async () =>
      commonsResponse([unclear])
    );

    expect(
      await findTopicalImage("robots")
    ).toBeNull();
  });

  it("sends a descriptive user agent to Commons", async () => {

    const fetchMock = vi.fn(
      async () =>
        commonsResponse([])
    );

    vi.stubGlobal(
      "fetch",
      fetchMock
    );

    await findTopicalImage("robots");

    const [, init] = fetchMock.mock
      .calls[0] as [
      string,
      RequestInit,
    ];

    const headers =
      init.headers as Record<
        string,
        string
      >;

    expect(
      headers["User-Agent"]
    ).toContain("NewsGarden");
  });
});
