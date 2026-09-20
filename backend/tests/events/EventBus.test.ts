import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  eventBus,
} from "../../src/engine/events/EventBus.js";

/*
 * Tests run against the shared singleton, so every test uses a
 * unique event name and unsubscribes its handlers afterwards —
 * no cross-test pollution.
 */

describe("EventBus", () => {

  it("delivers an emitted payload to a subscribed handler", () => {

    const handler = vi.fn();

    const name = "TEST_DELIVERY";

    eventBus.on(name, handler);

    try {

      const payload = { agentId: "tech-news-agent" };

      eventBus.emit(name, payload);

      expect(handler).toHaveBeenCalledTimes(1);

      // The bus enriches payloads with _eventName/_emittedAt metadata.
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining(payload)
      );

    } finally {

      eventBus.off(name, handler);
    }
  });

  it("does not call handlers subscribed to other events", () => {

    const handler = vi.fn();

    eventBus.on("TEST_OTHER_A", handler);

    try {

      eventBus.emit("TEST_OTHER_B", {});

      expect(handler).not.toHaveBeenCalled();

    } finally {

      eventBus.off("TEST_OTHER_A", handler);
    }
  });

  it("off() removes the handler", () => {

    const handler = vi.fn();

    const name = "TEST_OFF";

    eventBus.on(name, handler);

    eventBus.off(name, handler);

    eventBus.emit(name, {});

    expect(handler).not.toHaveBeenCalled();
  });

  it("supports multiple handlers on the same event", () => {

    const first = vi.fn();

    const second = vi.fn();

    const name = "TEST_MULTI";

    eventBus.on(name, first);

    eventBus.on(name, second);

    try {

      eventBus.emit(name, { n: 1 });

      expect(first).toHaveBeenCalledTimes(1);

      expect(second).toHaveBeenCalledTimes(1);

    } finally {

      eventBus.off(name, first);

      eventBus.off(name, second);
    }
  });

  it("onAny() sees every emitted event", () => {

    const seen: string[] = [];

    const name = "TEST_ANY";

    const anyHandler = (eventName: string) => {

      seen.push(eventName);
    };

    eventBus.onAny(anyHandler);

    try {

      eventBus.emit(name, {});

      expect(seen).toContain(name);

    } finally {

      eventBus.offAny(anyHandler);
    }
  });
});
