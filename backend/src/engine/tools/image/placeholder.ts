import {
  createHash,
} from "crypto";

/*
 * Deterministic placeholder illustrations.
 *
 * No image provider is configured in V1, so
 * the ImageGenerator returns these instead
 * of file paths: a self-contained data: URI
 * that renders the same SVG for the same
 * (style, prompt) pair on every machine,
 * with zero network or disk I/O.
 *
 * The SVG is abstract editorial art (muted
 * newspaper palette, seeded gradient +
 * glyph). It carries no text and no logos.
 */

const WIDTH = 800;

const HEIGHT = 450;

// Muted newspaper palette triples:
// [gradientFrom, gradientTo, ink].
const PALETTES: Array<
  [string, string, string]
> = [

  ["#f2e7cf", "#d9c69c", "#4a3b22"],

  ["#e9e4d6", "#c3bfae", "#3a3a30"],

  ["#f4e3d3", "#d9b48f", "#5a3a22"],

  ["#e3e9e4", "#b3c4b8", "#2f4a3a"],

  ["#e8e0ec", "#c0b3cc", "#463a5a"],

  ["#f0e6da", "#d3c2ac", "#54432e"],
];

export function placeholderSeed(
  prompt: string,
  style: string
): string {

  return createHash("md5")
    .update(`${style}:${prompt}`)
    .digest("hex");
}

// Deterministic 0..max-1 int from the hex
// seed at the given byte offset.
function pick(
  seed: string,
  offset: number,
  max: number
): number {

  return (
    parseInt(
      seed.slice(
        offset,
        offset + 2
      ),
      16
    ) % max
  );
}

function glyph(
  variant: number,
  ink: string
): string {

  switch (variant) {

    // Rising sun over a horizon.
    case 0:
      return (
        `<circle cx="400" cy="190" r="90" fill="${ink}" opacity="0.55"/>` +
        `<rect x="180" y="300" width="440" height="14" fill="${ink}" opacity="0.55"/>` +
        `<rect x="260" y="332" width="280" height="10" fill="${ink}" opacity="0.35"/>`
      );

    // Bar chart.
    case 1:
      return (
        `<rect x="270" y="220" width="60" height="120" fill="${ink}" opacity="0.55"/>` +
        `<rect x="370" y="170" width="60" height="170" fill="${ink}" opacity="0.55"/>` +
        `<rect x="470" y="120" width="60" height="220" fill="${ink}" opacity="0.55"/>` +
        `<rect x="240" y="350" width="320" height="10" fill="${ink}" opacity="0.35"/>`
      );

    // Wave.
    case 2:
      return (
        `<path d="M180 260 Q 280 160 400 260 T 620 260" ` +
        `stroke="${ink}" stroke-width="26" fill="none" opacity="0.55" ` +
        `stroke-linecap="round"/>` +
        `<path d="M180 330 Q 280 250 400 330 T 620 330" ` +
        `stroke="${ink}" stroke-width="14" fill="none" opacity="0.3" ` +
        `stroke-linecap="round"/>`
      );

    // Mountains.
    default:
      return (
        `<polygon points="180,340 330,150 480,340" fill="${ink}" opacity="0.55"/>` +
        `<polygon points="380,340 500,200 620,340" fill="${ink}" opacity="0.4"/>` +
        `<rect x="180" y="350" width="440" height="10" fill="${ink}" opacity="0.3"/>`
      );
  }
}

export function buildPlaceholderSvg(
  prompt: string,
  style: string =
    "editorial-illustration"
): string {

  const seed =
    placeholderSeed(
      prompt,
      style
    );

  const [
    from,
    to,
    ink,
  ] =
    PALETTES[
      pick(
        seed,
        0,
        PALETTES.length
      )
    ] as [
      string,
      string,
      string,
    ];

  const variant =
    pick(seed, 2, 4);

  const circles =
    [4, 8, 12]
      .map(
        (offset) =>
          `<circle ` +
          `cx="${pick(seed, offset, WIDTH)}" ` +
          `cy="${pick(seed, offset + 1, HEIGHT)}" ` +
          `r="${40 + pick(seed, offset + 2, 90)}" ` +
          `fill="#ffffff" opacity="0.18"/>`
      )
      .join("");

  const bandAngle =
    pick(seed, 16, 360);

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" ` +
    `viewBox="0 0 ${WIDTH} ${HEIGHT}" ` +
    `width="${WIDTH}" height="${HEIGHT}">` +
    `<defs>` +
    `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="${from}"/>` +
    `<stop offset="1" stop-color="${to}"/>` +
    `</linearGradient>` +
    `</defs>` +
    `<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>` +
    `<g transform="rotate(${bandAngle} 400 225)" opacity="0.08">` +
    `<rect x="-200" y="160" width="1200" height="130" fill="${ink}"/>` +
    `</g>` +
    circles +
    glyph(variant, ink) +
    `<rect x="24" y="24" width="${WIDTH - 48}" height="${HEIGHT - 48}" ` +
    `fill="none" stroke="${ink}" stroke-width="3" opacity="0.25"/>` +
    `</svg>`
  );
}

/*
 * Returns the placeholder as a data: URI,
 * ready to store in article.imageUrl and
 * render in a plain <img> tag.
 */
export function buildPlaceholderImageUrl(
  prompt: string,
  style: string =
    "editorial-illustration"
): string {

  return (
    "data:image/svg+xml," +
    encodeURIComponent(
      buildPlaceholderSvg(
        prompt,
        style
      )
    )
  );
}
