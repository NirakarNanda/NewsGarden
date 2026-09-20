import type { AgentLocation } from "@/types/agent";

// Coordinates are 1536x1024 stage pixels, read off the reference art.
export const LAMPS = [
  { x: 488, y: 175, r: 40 }, { x: 988, y: 215, r: 40 }, { x: 168, y: 672, r: 46 },
  { x: 375, y: 850, r: 40 }, { x: 528, y: 868, r: 36 }, { x: 716, y: 868, r: 36 },
  { x: 925, y: 880, r: 36 }, { x: 202, y: 418, r: 34 }, { x: 587, y: 352, r: 34 },
  { x: 625, y: 352, r: 34 },
];

export const MONITORS: { x: number; y: number; w: number; h: number; tint: string; at: AgentLocation }[] = [
  { x: 282, y: 192, w: 38, h: 42, tint: "90,170,255", at: "newsroom" },
  { x: 660, y: 208, w: 36, h: 46, tint: "90,255,150", at: "editorial-room" },
  { x: 1018, y: 205, w: 24, h: 44, tint: "150,150,255", at: "design-studio" },
  { x: 1112, y: 204, w: 28, h: 50, tint: "150,150,255", at: "design-studio" },
  { x: 258, y: 486, w: 30, h: 48, tint: "120,200,255", at: "quality-room" },
  { x: 336, y: 498, w: 30, h: 42, tint: "120,200,255", at: "quality-room" },
  { x: 230, y: 656, w: 160, h: 52, tint: "255,190,140", at: "visual-studio" },
  { x: 258, y: 716, w: 15, h: 48, tint: "255,190,140", at: "visual-studio" },
  { x: 336, y: 726, w: 30, h: 34, tint: "255,190,140", at: "visual-studio" },
];

export const STEAMS = [
  { x: 685, y: 563 }, { x: 722, y: 560 }, { x: 610, y: 432 }, { x: 650, y: 432 },
];

export const STARS = [
  { x: 395, y: 365 }, { x: 412, y: 372 }, { x: 420, y: 390 }, { x: 400, y: 398 }, { x: 407, y: 383 },
  { x: 1000, y: 108 }, { x: 1022, y: 104 }, { x: 1040, y: 113 }, { x: 1012, y: 122 }, { x: 1046, y: 128 },
];

export const LEDS = [
  { x: 806, y: 756, c: "#7cfc9a" }, { x: 812, y: 756, c: "#ff6b6b" }, { x: 806, y: 764, c: "#ffd45e" },
];

/** Which backend locations drive which sprite. */
export const SPRITE_LOCATIONS: Record<string, AgentLocation[]> = {
  "newsroom-cat": ["newsroom"],
  "editorial-cat": ["editorial-room"],
  "design-cat": ["design-studio"],
  raccoon: ["quality-room", "research-lab"],
  "visual-cat": ["visual-studio"],
  "cafe-calico": ["cafe"],
  "cafe-black": ["cafe"],
  "manga-bunny": ["manga-library"],
  "badminton-orange": ["badminton-court"],
  "badminton-grey": ["badminton-court"],
};
