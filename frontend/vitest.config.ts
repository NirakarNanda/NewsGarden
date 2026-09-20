import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(
        new URL("./src", import.meta.url)
      ),
    },
  },
  test: {
    // No jsdom: these suites test pure campus logic (bubble text,
    // sprite layout, scene asset contracts), not DOM rendering.
    environment: "node",
    include: ["tests/**/*.test.{ts,tsx}"],
  },
});
