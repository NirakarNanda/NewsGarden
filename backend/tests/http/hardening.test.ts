import {
  beforeAll,
  describe,
  expect,
  it,
} from "vitest";

import request from "supertest";

// ---------------------------------------------------------------------------
// Phase 4 hardening: zod validation (400s), security headers (helmet),
// rate-limit headers. Happy paths that need Mongo are not exercised
// here; validation runs before controllers, so 400s need no database.
// ---------------------------------------------------------------------------

process.env.MONGODB_URI ??= "mongodb://localhost:27017/newsgarden-test";
process.env.API_KEY = "test-key";

let app: import("express").Express;

beforeAll(async () => {
  const mod = await import("../../src/app.js");
  app = mod.default;
});

describe("zod query validation", () => {
  it("rejects a non-numeric limit with 400", async () => {
    const res = await request(app).get("/api/articles?limit=abc");
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("BAD_REQUEST");
  });

  it("rejects an out-of-range limit with 400", async () => {
    const res = await request(app).get("/api/articles?limit=999");
    expect(res.status).toBe(400);
  });

  it("rejects a negative offset with 400", async () => {
    const res = await request(app).get("/api/editions?offset=-5");
    expect(res.status).toBe(400);
  });

  it("rejects an out-of-range edition limit with 400", async () => {
    const res = await request(app).get("/api/editions?limit=500");
    expect(res.status).toBe(400);
  });
});

describe("zod body validation", () => {
  it("rejects a non-string approval note with 400", async () => {
    const res = await request(app)
      .post("/api/approval/ed-1/approve")
      .set("x-api-key", "test-key")
      .send({ note: 12345 });
    expect(res.status).toBe(400);
  });

  it("rejects a non-string agent run type with 400", async () => {
    const res = await request(app)
      .post("/api/agents/tech-news/run")
      .send({ type: ["not", "a", "string"] });
    expect(res.status).toBe(400);
  });
});

describe("security headers and rate limiting", () => {
  it("sets helmet security headers", async () => {
    const res = await request(app).get("/api/health");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-frame-options"]).toBeDefined();
  });

  it("emits rate-limit headers", async () => {
    const res = await request(app).get("/api/health");
    // standardHeaders: "draft-8" sends one combined RateLimit header.
    expect(res.headers["ratelimit"]).toMatch(/300/);
  });
});
