import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The connection store is module-level state, so each test imports a fresh
// copy after vi.resetModules() to keep channel reports isolated.

describe("connection state derivation", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_USE_MOCK", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  async function fresh() {
    return await import("@/lib/connection");
  }

  it("is live when every reporting channel succeeds", async () => {
    const { reportChannel, getConnectionState } = await fresh();
    reportChannel("agents", true);
    reportChannel("activity", true);
    reportChannel("edition", true);
    expect(getConnectionState()).toBe("live");
  });

  it("is degraded when some channels fail and some succeed", async () => {
    const { reportChannel, getConnectionState } = await fresh();
    reportChannel("agents", true);
    reportChannel("activity", false);
    expect(getConnectionState()).toBe("degraded");
  });

  it("is offline when every reporting channel fails", async () => {
    const { reportChannel, getConnectionState } = await fresh();
    reportChannel("agents", false);
    reportChannel("activity", false);
    expect(getConnectionState()).toBe("offline");
  });

  it("ignores reports older than the staleness window", async () => {
    vi.useFakeTimers();
    const { reportChannel, getConnectionState } = await fresh();
    reportChannel("agents", false);
    vi.advanceTimersByTime(60_000);
    reportChannel("activity", true);
    // The stale failure no longer counts, so this is live, not degraded.
    expect(getConnectionState()).toBe("live");
  });

  it("a later success recovers the state back to live", async () => {
    const { reportChannel, getConnectionState } = await fresh();
    reportChannel("agents", false);
    expect(getConnectionState()).toBe("offline");
    reportChannel("agents", true);
    expect(getConnectionState()).toBe("live");
  });

  it("is demo when NEXT_PUBLIC_USE_MOCK=true, regardless of reports", async () => {
    vi.stubEnv("NEXT_PUBLIC_USE_MOCK", "true");
    const { reportChannel, getConnectionState } = await fresh();
    reportChannel("agents", false);
    expect(getConnectionState()).toBe("demo");
  });
});
