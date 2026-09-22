import {
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import request from "supertest";

// ---------------------------------------------------------------------------
// POST /api/editions/run: 202 accepts, 409 when a run is already active.
// The workflow is mocked with a never-resolving run() so the 409 case
// is deterministic without a database.
// ---------------------------------------------------------------------------

process.env.MONGODB_URI ??= "mongodb://localhost:27017/newsgarden-test";
process.env.API_KEY = "test-key";

vi.mock("../../src/engine/workflows/DailyEditionWorkflow.js", () => ({
  DailyEditionWorkflow: class {
    run(): Promise<never> {
      return new Promise(() => {
        // Never resolves: the run stays "running" for the suite.
      });
    }
  },
}));

// The run service creates the edition first (so the 202 carries the
// editionId). Mock EditionManager to avoid needing a database here.
vi.mock("../../src/engine/brain/EditionManager.js", () => ({
  EditionManager: class {
    async createEdition(title: string) {
      return {
        editionId: "ed-test-123",
        title,
        date: new Date(),
        status: "draft",
        articleIds: [],
        pageIds: [],
        stagesCompleted: [],
        aiFallback: false,
      };
    }
  },
}));

let app: import("express").Express;

beforeAll(async () => {
  const mod = await import("../../src/app.js");
  app = mod.default;
});

describe("POST /api/editions/run", () => {
  it("returns 202 and starts a run", async () => {
    const res = await request(app)
      .post("/api/editions/run")
      .set("x-api-key", "test-key");
    expect(res.status).toBe(202);
    expect(res.body.success).toBe(true);
    expect(res.body.data.running).toBe(true);
  });

  it("returns 409 while a run is already in progress", async () => {
    const res = await request(app)
      .post("/api/editions/run")
      .set("x-api-key", "test-key");
    expect(res.status).toBe(409);
    expect(res.body.code).toBe("RUN_IN_PROGRESS");
  });

  it("GET /api/editions/run reflects the running state", async () => {
    const res = await request(app).get("/api/editions/run");
    expect(res.status).toBe(200);
    expect(res.body.data.running).toBe(true);
    expect(res.body.data.status).toBe("running");
  });
});
