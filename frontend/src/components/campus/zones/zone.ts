/** Zone rectangles in 1536x1024 stage pixels, read off the reference art. */
export interface ZoneBounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const ZONE_BOUNDS: Record<string, ZoneBounds> = {
  newsroom: { x: 140, y: 100, w: 320, h: 250 },
  "editorial-room": { x: 620, y: 100, w: 270, h: 250 },
  "design-studio": { x: 940, y: 100, w: 300, h: 250 },
  "research-lab": { x: 430, y: 350, w: 230, h: 190 },
  "quality-room": { x: 170, y: 390, w: 230, h: 220 },
  "visual-studio": { x: 170, y: 630, w: 300, h: 230 },
  cafe: { x: 550, y: 430, w: 290, h: 200 },
  "manga-library": { x: 970, y: 410, w: 240, h: 200 },
  "badminton-court": { x: 850, y: 640, w: 330, h: 230 },
};

/** Which department works in each work zone. Leisure zones filter by location instead. */
export const DEPARTMENT_ZONE: Record<string, string> = {
  discovery: "newsroom",
  research: "research-lab",
  editorial: "editorial-room",
  visual: "visual-studio",
  design: "design-studio",
  quality: "quality-room",
};
