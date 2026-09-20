import {
  describe,
  expect,
  it,
} from "vitest";

import {
  bubbleFor,
  pickAgent,
} from "@/lib/campus";

import {
  motionOK,
  rand,
} from "@/lib/motion";

import type { AgentInfo } from "@/types/agent";

function agent(
  overrides: Partial<AgentInfo>
): AgentInfo {
  return {
    id: "agent-1",
    name: "Test Agent",
    role: "Testing",
    department: "discovery",
    status: "idle",
    location: "newsroom",
    ...overrides,
  };
}

describe("bubbleFor", () => {
  it("shows per-room working text for department rooms", () => {
    expect(
      bubbleFor(
        agent({
          status: "working",
          location: "newsroom",
        })
      )
    ).toBe("Researching...");

    expect(
      bubbleFor(
        agent({
          status: "working",
          location: "editorial-room",
        })
      )
    ).toBe("Writing...");

    expect(
      bubbleFor(
        agent({
          status: "working",
          location: "visual-studio",
        })
      )
    ).toBe("Generating image...");

    expect(
      bubbleFor(
        agent({
          status: "working",
          location: "design-studio",
        })
      )
    ).toBe("Designing...");

    expect(
      bubbleFor(
        agent({
          status: "working",
          location: "quality-room",
        })
      )
    ).toBe("Fact checking...");
  });

  it("shows leisure text for idle agents in leisure rooms", () => {
    expect(
      bubbleFor(
        agent({
          status: "idle",
          location: "cafe",
        })
      )
    ).toBe("Coffee break!");

    expect(
      bubbleFor(
        agent({
          status: "idle",
          location: "manga-library",
        })
      )
    ).toBe("Reading...");

    expect(
      bubbleFor(
        agent({
          status: "idle",
          location: "badminton-court",
        })
      )
    ).toBe("Playing...");
  });

  it("falls back to generic text for unmapped room/state combos", () => {
    expect(
      bubbleFor(
        agent({
          status: "working",
          location: "cafe",
        })
      )
    ).toBe("Working...");

    expect(
      bubbleFor(
        agent({
          status: "idle",
          location: "newsroom",
        })
      )
    ).toBe("Idle...");
  });

  it("covers movement and terminal states", () => {
    expect(
      bubbleFor(
        agent({ status: "walking" })
      )
    ).toBe("On my way...");

    expect(
      bubbleFor(
        agent({ status: "waiting" })
      )
    ).toBe("Waiting...");

    expect(
      bubbleFor(
        agent({ status: "completed" })
      )
    ).toBe("Done!");

    expect(
      bubbleFor(
        agent({ status: "error" })
      )
    ).toBe("Something broke!");
  });
});

describe("pickAgent", () => {
  it("prefers the working agent in the room", () => {
    const idleAgent = agent({
      id: "idle",
      status: "idle",
      location: "cafe",
    });

    const workingAgent = agent({
      id: "working",
      status: "working",
      location: "cafe",
    });

    expect(
      pickAgent(
        [idleAgent, workingAgent],
        ["cafe"]
      )?.id
    ).toBe("working");
  });

  it("also prefers an errored agent — busy wins the bubble", () => {
    const idleAgent = agent({
      id: "idle",
      status: "idle",
      location: "cafe",
    });

    const errorAgent = agent({
      id: "error",
      status: "error",
      location: "cafe",
    });

    expect(
      pickAgent(
        [idleAgent, errorAgent],
        ["cafe"]
      )?.id
    ).toBe("error");
  });

  it("falls back to the first agent present when nobody is busy", () => {
    const first = agent({
      id: "first",
      status: "idle",
      location: "cafe",
    });

    const second = agent({
      id: "second",
      status: "idle",
      location: "cafe",
    });

    expect(
      pickAgent([first, second], ["cafe"])?.id
    ).toBe("first");
  });

  it("ignores agents in other rooms", () => {
    const elsewhere = agent({
      id: "elsewhere",
      status: "working",
      location: "newsroom",
    });

    expect(
      pickAgent([elsewhere], ["cafe"])
    ).toBeUndefined();
  });
});

describe("motion helpers", () => {
  it("motionOK is false with no browser window", () => {
    expect(motionOK()).toBe(false);
  });

  it("rand stays within the given bounds", () => {
    for (let i = 0; i < 100; i++) {
      const value = rand(2.2, 3.4);

      expect(value).toBeGreaterThanOrEqual(
        2.2
      );

      expect(value).toBeLessThan(3.4);
    }
  });
});
