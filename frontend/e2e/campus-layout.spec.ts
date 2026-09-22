import { test, expect, type Page, type Locator } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Task 2 — campus layout regression test.
 *
 * The campus renders a fixed 1536x1024 design stage that is uniformly scaled
 * to the viewport. This spec renders the live campus page at the five
 * requested desktop viewports plus compact and tall variants, and asserts
 * that the right-edge panels, the view controls, and the footer never
 * overlap each other.
 *
 * Forbidden intersections (desktop stage):
 *   - EditionProgress ∩ ActivityTimeline
 *   - ActivityTimeline ∩ Dispatch bar
 *   - Dispatch bar ∩ view controls
 *   - any right-column element ∩ footer bar
 *   - sidebar ∩ right-column panels (sanity)
 *
 * Desktop right-column design geometry (post-Task 2):
 *   progress:    y 12–404
 *   activity:    y 418–748
 *   dispatch:    y 758–802
 *   controls:    y 812+
 *   footer art:  y ≈ 925+ (translated down by extraY in tall windows)
 */

type Box = { x: number; y: number; width: number; height: number };

const SCREENSHOT_DIR = join(__dirname, "..", "docs", "screenshots");

async function box(locator: Locator): Promise<Box> {
  const b = await locator.boundingBox();
  if (!b) throw new Error(`No bounding box for ${locator}`);
  return b;
}

function intersects(a: Box, b: Box): boolean {
  return (
    a.x < b.x + b.width &&
    b.x < a.x + a.width &&
    a.y < b.y + b.height &&
    b.y < a.y + a.height
  );
}

function describeBox(b: Box): string {
  const r = (n: number) => Math.round(n);
  return `x ${r(b.x)}–${r(b.x + b.width)}, y ${r(b.y)}–${r(b.y + b.height)}`;
}

async function assertNoOverlap(
  page: Page,
  first: Locator,
  second: Locator,
  firstName: string,
  secondName: string,
) {
  const a = await box(first);
  const b = await box(second);
  expect(
    intersects(a, b),
    `${firstName} (${describeBox(a)}) overlaps ${secondName} (${describeBox(b)})`,
  ).toBe(false);
}

async function openCampus(page: Page, width: number, height: number, shotName: string) {
  await page.setViewportSize({ width, height });
  await page.goto("/");
  // Panels render client-side; wait for the whole right column to settle.
  await page.getByTestId("panel-edition-progress").waitFor({ state: "visible" });
  await page.getByTestId("panel-activity-timeline").waitFor({ state: "visible" });
  await page.getByTestId("panel-dispatch").waitFor({ state: "visible" });
  await page.getByTestId("view-controls").waitFor({ state: "visible" });
  await page.waitForTimeout(400);
  mkdirSync(SCREENSHOT_DIR, { recursive: true });
  await page.screenshot({ path: join(SCREENSHOT_DIR, shotName) });
}

const DESKTOP_VIEWPORTS = [
  { width: 1366, height: 768, name: "1366x768" },
  { width: 1440, height: 900, name: "1440x900" },
  { width: 1920, height: 1080, name: "1920x1080" },
  { width: 2560, height: 1440, name: "2560x1440" },
  { width: 1024, height: 768, name: "1024x768" },
];

for (const vp of DESKTOP_VIEWPORTS) {
  test(`desktop ${vp.name}: right column never overlaps the footer or itself`, async ({
    page,
  }) => {
    await openCampus(page, vp.width, vp.height, `campus-${vp.name}.png`);

    const progress = page.getByTestId("panel-edition-progress");
    const activity = page.getByTestId("panel-activity-timeline");
    const dispatch = page.getByTestId("panel-dispatch");
    const controls = page.getByTestId("view-controls");
    // In wide windows the footer is stitched from two clipped copies of the
    // same art; either copy has the same box, so test against the first.
    const footer = page.getByTestId("footer-bar").first();
    const sidebar = page.getByTestId("sidebar");

    // The Task 2 regression: the view controls used to sit in a fixed
    // bottom-right corner, colliding with the footer.
    const position = await controls.evaluate((el) => getComputedStyle(el).position);
    expect(position, "view controls must not be position:fixed").not.toBe("fixed");

    // Right-column stacking order must hold at every viewport.
    await assertNoOverlap(page, progress, activity, "EditionProgress", "ActivityTimeline");
    await assertNoOverlap(page, activity, dispatch, "ActivityTimeline", "Dispatch bar");
    await assertNoOverlap(page, dispatch, controls, "Dispatch bar", "view controls");

    // Nothing in the right column may touch the footer bar.
    await assertNoOverlap(page, progress, footer, "EditionProgress", "footer");
    await assertNoOverlap(page, activity, footer, "ActivityTimeline", "footer");
    await assertNoOverlap(page, dispatch, footer, "Dispatch bar", "footer");
    await assertNoOverlap(page, controls, footer, "view controls", "footer");

    // Sanity: the left sidebar stays clear of the right column.
    await assertNoOverlap(page, sidebar, progress, "sidebar", "EditionProgress");
    await assertNoOverlap(page, sidebar, dispatch, "sidebar", "Dispatch bar");

    // Right-column panels stay inside the viewport horizontally.
    for (const [loc, label] of [
      [progress, "EditionProgress"],
      [activity, "ActivityTimeline"],
      [dispatch, "Dispatch bar"],
    ] as const) {
      const b = await box(loc);
      expect(b.x + b.width, `${label} must fit inside the viewport`).toBeLessThanOrEqual(
        vp.width + 1,
      );
    }
  });
}

test("tall window 1024x1200: footer drops with extraY, still no overlap", async ({
  page,
}) => {
  await openCampus(page, 1024, 1200, "campus-1024x1200-tall.png");

  const activity = page.getByTestId("panel-activity-timeline");
  const dispatch = page.getByTestId("panel-dispatch");
  const controls = page.getByTestId("view-controls");
  const footer = page.getByTestId("footer-bar").first();

  await assertNoOverlap(page, activity, dispatch, "ActivityTimeline", "Dispatch bar");
  await assertNoOverlap(page, dispatch, controls, "Dispatch bar", "view controls");
  await assertNoOverlap(page, controls, footer, "view controls", "footer");
  await assertNoOverlap(page, dispatch, footer, "Dispatch bar", "footer");
});

test("dispatch overlay opens upward from the bar and closes cleanly", async ({
  page,
}) => {
  await openCampus(page, 1440, 900, "campus-dispatch-closed.png");

  const bar = page.getByTestId("panel-dispatch");
  const controls = page.getByTestId("view-controls");
  const overlay = page.getByTestId("panel-dispatch-overlay");

  await expect(overlay).toHaveCount(0);
  await bar.getByRole("button", { expanded: false }).click();
  await expect(overlay).toBeVisible();
  await page.screenshot({ path: join(SCREENSHOT_DIR, "campus-dispatch-open.png") });

  // The overlay floats above the bar: its bottom edge meets the bar's top,
  // and it never covers the view controls below the bar.
  const barBox = await box(bar);
  const overlayBox = await box(overlay);
  expect(
    Math.abs(overlayBox.y + overlayBox.height - barBox.y),
    `overlay bottom (${Math.round(overlayBox.y + overlayBox.height)}) should meet bar top (${Math.round(barBox.y)})`,
  ).toBeLessThanOrEqual(2);
  await assertNoOverlap(page, overlay, controls, "dispatch overlay", "view controls");

  // Close it again — the activity panel underneath must be intact.
  await overlay.getByRole("button", { name: /close/i }).click();
  await expect(overlay).toHaveCount(0);
  await expect(page.getByTestId("panel-activity-timeline")).toBeVisible();
});

test("compact <768px: panels stack in flow, controls are not fixed", async ({ page }) => {
  await openCampus(page, 390, 844, "campus-compact-390x844.png");

  const controls = page.getByTestId("view-controls");
  const position = await controls.evaluate((el) => getComputedStyle(el).position);
  expect(position, "compact view controls must not be fixed").not.toBe("fixed");

  // In flow layout all panels share one scroll container, so plain
  // viewport-relative boxes are directly comparable — do NOT scroll between
  // measurements (the scroll container is a nested div, not the window).
  const viewBox = (loc: Locator) =>
    loc.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom };
    });

  const panels = [
    page.getByTestId("panel-edition-progress"),
    page.getByTestId("panel-activity-timeline"),
    page.getByTestId("panel-dispatch"),
  ];
  let prevBottom = -Infinity;
  for (const [i, panel] of panels.entries()) {
    const b = await viewBox(panel);
    expect(
      b.top,
      `compact panel ${i} must stack below the previous one (top ${Math.round(b.top)} < prev bottom ${Math.round(prevBottom)})`,
    ).toBeGreaterThanOrEqual(prevBottom - 1);
    prevBottom = b.bottom;
  }

  // Opening dispatch in compact mode keeps it in the flow, below the bar.
  const bar = page.getByTestId("panel-dispatch");
  await bar.getByRole("button", { expanded: false }).click();
  const overlay = page.getByTestId("panel-dispatch-overlay");
  await expect(overlay).toBeVisible();
  await page.screenshot({ path: join(SCREENSHOT_DIR, "campus-compact-dispatch-open.png") });
  const overlayPos = await overlay.evaluate((el) => getComputedStyle(el).position);
  expect(overlayPos, "compact dispatch overlay must flow in place").not.toBe("absolute");
});
