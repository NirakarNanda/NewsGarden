import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./tests/setup.ts"],

    // The mongodb-memory-server binary download and mongod boot on
    // first run can take a while; don't kill slow integration tests.
    testTimeout: 180000,

    hookTimeout: 180000,
  },
});
