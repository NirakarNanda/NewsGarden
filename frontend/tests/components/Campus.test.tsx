import { existsSync } from "node:fs";

import {
  describe,
  expect,
  it,
} from "vitest";

import { SPRITES } from "@/lib/sprites";

import {
  BUBBLES,
  EDITION_STAGES,
  STAGE_HEIGHT,
  STAGE_WIDTH,
} from "@/lib/constants";

import type { AgentLocation } from "@/types/agent";

// NOTE: these suites deliberately avoid jsdom / DOM rendering. They verify
// the data contracts the Campus scene depends on: sprite assets on disk,
// bubble geometry, and location wiring.

const PUBLIC_DIR = new URL(
  "../../public/",
  import.meta.url
);

const KNOWN_LOCATIONS: AgentLocation[] = [
  "newsroom",
  "research-lab",
  "editorial-room",
  "visual-studio",
  "design-studio",
  "quality-room",
  "cafe",
  "manga-library",
  "badminton-court",
];

describe("Campus scene assets", () => {
  it("every sprite has its PNG on disk where AgentSprite loads it", () => {
    const missing = SPRITES.filter(
      (sprite) =>
        !existsSync(
          new URL(
            `campus/${sprite.group}/${sprite.id}.png`,
            PUBLIC_DIR
          )
        )
    );

    expect(
      missing.map((s) => s.id)
    ).toEqual([]);
  });

  it("the scene renders at least one sprite", () => {
    expect(SPRITES.length).toBeGreaterThan(
      0
    );
  });
});

describe("Campus bubble layout", () => {
  it("every bubble box sits inside the stage", () => {
    for (const bubble of BUBBLES) {
      expect(
        bubble.left,
        `${bubble.room} left`
      ).toBeGreaterThanOrEqual(0);

      expect(
        bubble.top,
        `${bubble.room} top`
      ).toBeGreaterThanOrEqual(0);

      expect(
        bubble.left + bubble.width,
        `${bubble.room} right edge`
      ).toBeLessThanOrEqual(STAGE_WIDTH);

      expect(
        bubble.top + bubble.height,
        `${bubble.room} bottom edge`
      ).toBeLessThanOrEqual(STAGE_HEIGHT);

      expect(
        bubble.tailX,
        `${bubble.room} tail`
      ).toBeLessThanOrEqual(bubble.width);
    }
  });

  it("every bubble watches known agent locations", () => {
    for (const bubble of BUBBLES) {
      expect(
        bubble.locations.length,
        `${bubble.room} locations`
      ).toBeGreaterThan(0);

      for (const location of bubble.locations) {
        expect(KNOWN_LOCATIONS).toContain(
          location
        );
      }
    }
  });

  it("every bubble has fallback text", () => {
    for (const bubble of BUBBLES) {
      expect(
        bubble.fallback.length,
        `${bubble.room} fallback`
      ).toBeGreaterThan(0);
    }
  });
});

describe("Campus edition progress", () => {
  it("edition stages are defined in pipeline order", () => {
    expect(
      EDITION_STAGES.length
    ).toBeGreaterThan(0);

    expect(EDITION_STAGES[0]).toBe(
      "Collecting"
    );
  });
});
