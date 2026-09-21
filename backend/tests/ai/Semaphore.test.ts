import {
  describe,
  expect,
  it,
} from "vitest";

import { Semaphore } from "../../src/engine/tools/ai/Semaphore.js";

describe("Semaphore", () => {
  it("caps concurrent holders at the configured max", async () => {
    const gate = new Semaphore(2);

    let active = 0;
    let peak = 0;

    const work = async () => {
      const release = await gate.acquire();
      active += 1;
      peak = Math.max(peak, active);
      // Yield so other contenders pile up behind the gate.
      await new Promise((r) => setTimeout(r, 10));
      active -= 1;
      release();
    };

    await Promise.all([
      work(),
      work(),
      work(),
      work(),
      work(),
    ]);

    expect(peak).toBe(2);
    expect(active).toBe(0);
  });

  it("treats invalid maxima as 1", async () => {
    const gate = new Semaphore(0);

    let active = 0;
    let peak = 0;

    const work = async () => {
      const release = await gate.acquire();
      active += 1;
      peak = Math.max(peak, active);
      await new Promise((r) => setTimeout(r, 5));
      active -= 1;
      release();
    };

    await Promise.all([work(), work(), work()]);

    expect(peak).toBe(1);
  });
});
