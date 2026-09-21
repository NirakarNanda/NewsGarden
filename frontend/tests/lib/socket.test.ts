import { describe, expect, it, vi, beforeEach } from "vitest";

// Pure mapping functions — no network, no timers. socket.ts gates all
// side effects behind typeof window / USE_MOCK, but importing the module
// still runs top-level code, so stub the env first.

describe("toNewsEvent (SSE frame mapping)", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_USE_MOCK", "true");
  });

  async function mapping() {
    const mod = await import("@/lib/socket");
    return { toNewsEvent: mod.toNewsEvent, rowToNewsEvent: mod.rowToNewsEvent };
  }

  it("maps an AGENT_MOVEMENT_REQUESTED frame with toZone as location", async () => {
    const { toNewsEvent } = await mapping();
    const e = toNewsEvent("evt-1", {
      name: "AGENT_MOVEMENT_REQUESTED",
      agentId: "research",
      payload: { agentId: "research", fromZone: "newsroom", toZone: "cafe", at: "2026-09-21T10:00:00Z" },
      emittedAt: "2026-09-21T10:00:01Z",
    });
    expect(e).toMatchObject({
      id: "evt-1",
      type: "AGENT_MOVEMENT_REQUESTED",
      agentId: "research",
      location: "cafe",
      at: "2026-09-21T10:00:01Z",
    });
  });

  it("maps EDITION_STAGE_COMPLETED with the stage as the message", async () => {
    const { toNewsEvent } = await mapping();
    const e = toNewsEvent("evt-2", {
      name: "EDITION_STAGE_COMPLETED",
      payload: { editionId: "ed-1", stage: "discovery" },
      emittedAt: "2026-09-21T10:05:00Z",
    });
    expect(e).toMatchObject({
      id: "evt-2",
      type: "EDITION_STAGE_COMPLETED",
      message: "discovery",
    });
  });

  it("maps AGENT_TASK_FAILED with the error as the message", async () => {
    const { toNewsEvent } = await mapping();
    const e = toNewsEvent("evt-3", {
      name: "AGENT_TASK_FAILED",
      agentId: "writer",
      payload: { error: "timeout" },
      emittedAt: "2026-09-21T10:06:00Z",
    });
    expect(e).toMatchObject({ type: "AGENT_TASK_FAILED", message: "timeout" });
  });

  it("returns null for frames without an id or name", async () => {
    const { toNewsEvent } = await mapping();
    expect(toNewsEvent("", { name: "AGENT_IDLE", payload: {} })).toBeNull();
    expect(toNewsEvent("x", { payload: {} })).toBeNull();
  });
});

describe("rowToNewsEvent (fallback poll mapping)", () => {
  async function mapping() {
    vi.stubEnv("NEXT_PUBLIC_USE_MOCK", "true");
    const mod = await import("@/lib/socket");
    return mod.rowToNewsEvent;
  }

  it("maps a persisted activity row", async () => {
    const rowToNewsEvent = await mapping();
    const e = rowToNewsEvent({
      eventId: "row-9",
      type: "ARTICLE_DISCOVERED",
      agentId: "discovery",
      message: "discovered a story",
      createdAt: "2026-09-21T11:00:00Z",
    });
    expect(e).toMatchObject({
      id: "row-9",
      type: "ARTICLE_DISCOVERED",
      agentId: "discovery",
      message: "discovered a story",
      at: "2026-09-21T11:00:00Z",
    });
  });

  it("returns null for rows without an id or type", async () => {
    const rowToNewsEvent = await mapping();
    expect(rowToNewsEvent({ message: "hi" })).toBeNull();
  });
});
