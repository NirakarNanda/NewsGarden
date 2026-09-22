import { describe, expect, it, vi } from "vitest";

import { fetchWithTimeout } from "../../src/engine/utils/fetchWithTimeout.js";

describe("fetchWithTimeout", () => {

  it("resolves when fetch completes in time", async () => {

    const response = new Response("ok");

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));

    try {

      const result = await fetchWithTimeout(
        "https://example.com",
        {},
        1000
      );

      expect(result).toBe(response);

    } finally {

      vi.unstubAllGlobals();
    }
  });

  it("throws a timeout error when fetch hangs", async () => {

    // A fetch that never settles on its own but respects abort,
    // like a real hung HTTP call.
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(
        (_url: string, init?: RequestInit) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener("abort", () => {
              const error = new Error("The operation was aborted.");
              error.name = "AbortError";
              reject(error);
            });
          })
      )
    );

    try {

      await expect(
        fetchWithTimeout(
          "https://example.com",
          {},
          50
        )
      ).rejects.toThrow(
        /timed out after 50ms/
      );

    } finally {

      vi.unstubAllGlobals();
    }
  });

  it("passes through non-timeout fetch errors", async () => {

    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("connection refused"))
    );

    try {

      await expect(
        fetchWithTimeout(
          "https://example.com",
          {},
          1000
        )
      ).rejects.toThrow("connection refused");

    } finally {

      vi.unstubAllGlobals();
    }
  });
});
