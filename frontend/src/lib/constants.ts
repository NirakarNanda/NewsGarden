import type { BubbleSpec } from "@/types/campus";

export const STAGE_WIDTH = 1536;
export const STAGE_HEIGHT = 1024;

export const EDITION_STAGES = [
  "Collecting",
  "Researching",
  "Writing",
  "Designing",
  "Reviewing",
  "Waiting for Approval",
] as const;

// Positions measured from the reference image (stage pixels).
export const BUBBLES: BubbleSpec[] = [
  { room: "newsroom", locations: ["newsroom"], fallback: "Researching...", left: 289, top: 148, width: 119, height: 35, tailX: 12 },
  { room: "editorial", locations: ["editorial-room"], fallback: "Writing...", left: 699, top: 175, width: 90, height: 35, tailX: 12 },
  { room: "design-studio", locations: ["design-studio"], fallback: "Designing...", left: 1032, top: 166, width: 98, height: 33, tailX: 17 },
  { room: "research-lab", locations: ["quality-room", "research-lab"], fallback: "Fact checking...", left: 269, top: 443, width: 128, height: 34, tailX: 13 },
  { room: "cafe", locations: ["cafe"], fallback: "Coffee break!", left: 637, top: 479, width: 117, height: 35, tailX: 94 },
  { room: "manga-library", locations: ["manga-library"], fallback: "Reading...", left: 1065, top: 462, width: 90, height: 30, tailX: 49 },
  { room: "visual-studio", locations: ["visual-studio"], fallback: "Generating image...", left: 294, top: 659, width: 141, height: 35, tailX: 12 },
  { room: "badminton", locations: ["badminton-court"], fallback: "Playing...", left: 993, top: 669, width: 81, height: 33, tailX: 11 },
];
