import {
  afterEach,
  describe,
  expect,
  it,
} from "vitest";

import {
  Scheduler,
  cronMatches,
  parseCron,
} from "../../src/engine/brain/Scheduler.js";

describe("Scheduler", () => {

  const schedulers: Scheduler[] = [];

  afterEach(() => {

    for (const scheduler of schedulers.splice(0)) {

      scheduler.stopAll();
    }
  });

  function makeScheduler(): Scheduler {

    const scheduler = new Scheduler();

    schedulers.push(scheduler);

    return scheduler;
  }

  it("registers a cron job without throwing", () => {

    const scheduler = makeScheduler();

    expect(() =>
      scheduler.schedule("0 7 * * *", "daily-edition", () => {})
    ).not.toThrow();

    expect(scheduler.jobCount()).toBe(1);
  });

  it("stop() on the returned job unregisters it", () => {

    const scheduler = makeScheduler();

    const job = scheduler.schedule("* * * * *", "every-minute", () => {});

    expect(scheduler.jobCount()).toBe(1);

    job.stop();

    expect(scheduler.jobCount()).toBe(0);
  });

  it("stopAll() clears every job", () => {

    const scheduler = makeScheduler();

    scheduler.schedule("0 7 * * *", "a", () => {});

    scheduler.schedule("0 8 * * *", "b", () => {});

    expect(scheduler.jobCount()).toBe(2);

    scheduler.stopAll();

    expect(scheduler.jobCount()).toBe(0);
  });

  it("parseCron rejects non-5-field expressions", () => {

    expect(() => parseCron("0 7 * *")).toThrow();

    expect(() => parseCron("0 7 * * * *")).toThrow();

    expect(() => parseCron("0 7 * * *")).not.toThrow();
  });

  it("cronMatches detects the current minute for an every-minute schedule", () => {

    const parts = parseCron("* * * * *");

    expect(cronMatches(parts, new Date())).toBe(true);
  });

  it("cronMatches is false for a far-future schedule", () => {

    // 03:00 on Feb 29th — matches essentially never in tests.
    const parts = parseCron("0 3 29 2 *");

    const now = new Date();

    // Unless the test literally runs at 03:00 on Feb 29, this is false.
    if (!(now.getMonth() === 1 && now.getDate() === 29 && now.getHours() === 3)) {

      expect(cronMatches(parts, now)).toBe(false);
    }
  });

  it("schedule() rejects an invalid cron expression", () => {

    const scheduler = makeScheduler();

    expect(() =>
      scheduler.schedule("not-a-cron", "bad", () => {})
    ).toThrow();

    expect(scheduler.jobCount()).toBe(0);
  });
});
