import { defineConfig, devices } from "@playwright/test";

/**
 * Task 2 layout regression tests.
 *
 * The campus scene is a fixed 1536x1024 stage that is uniformly scaled to
 * the viewport. These tests render the live page at several viewports and
 * assert that the right-edge panels (EditionProgress, ActivityTimeline,
 * Dispatch) and the view controls never intersect each other or the footer —
 * the overlap fixed in Task 2.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: true,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3100",
    // Skip the GSAP intro animation so bounding boxes are stable.
    reducedMotion: "reduce",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npx next dev --port 3100",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    cwd: ".",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
