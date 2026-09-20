import {
  describe,
  expect,
  it,
} from "vitest";

import {
  SPRITES,
  type SpriteKind,
} from "@/lib/sprites";

import {
  STAGE_HEIGHT,
  STAGE_WIDTH,
} from "@/lib/constants";

// Animation kinds handled by the switch in AgentSprite's build().
const ANIMATED_KINDS: SpriteKind[] = [
  "typist",
  "sip",
  "reader",
  "pet",
  "float",
  "sway",
  "tree",
];

describe("campus sprite layout", () => {
  it("every sprite id is unique", () => {
    const ids = SPRITES.map((s) => s.id);

    expect(new Set(ids).size).toBe(
      ids.length
    );
  });

  it("every sprite sits inside the stage", () => {
    for (const sprite of SPRITES) {
      expect(
        sprite.x,
        `${sprite.id} x`
      ).toBeGreaterThanOrEqual(0);

      expect(
        sprite.y,
        `${sprite.id} y`
      ).toBeGreaterThanOrEqual(0);

      expect(
        sprite.x + sprite.w,
        `${sprite.id} right edge`
      ).toBeLessThanOrEqual(STAGE_WIDTH);

      expect(
        sprite.y + sprite.h,
        `${sprite.id} bottom edge`
      ).toBeLessThanOrEqual(STAGE_HEIGHT);
    }
  });

  it("every sprite has positive dimensions", () => {
    for (const sprite of SPRITES) {
      expect(
        sprite.w,
        `${sprite.id} width`
      ).toBeGreaterThan(0);

      expect(
        sprite.h,
        `${sprite.id} height`
      ).toBeGreaterThan(0);
    }
  });

  it("every sprite belongs to a known group", () => {
    for (const sprite of SPRITES) {
      expect([
        "characters",
        "decorations",
      ]).toContain(sprite.group);
    }
  });

  it("covers every kind AgentSprite animates, so no switch case is dead", () => {
    const kinds = new Set(
      SPRITES.map((s) => s.kind)
    );

    for (const kind of ANIMATED_KINDS) {
      expect(
        kinds.has(kind),
        `no sprite with kind "${kind}"`
      ).toBe(true);
    }
  });

  it("character sprites use character animation kinds", () => {
    const characters = SPRITES.filter(
      (s) => s.group === "characters"
    );

    expect(characters.length).toBeGreaterThan(
      0
    );

    for (const sprite of characters) {
      expect(
        [
          ...ANIMATED_KINDS,
          "rally-left",
          "rally-right",
          "static",
        ] as SpriteKind[]
      ).toContain(sprite.kind);
    }
  });
});
