import {
  beforeAll,
  describe,
  expect,
  it,
} from "vitest";

import request from "supertest";

// ---------------------------------------------------------------------------
// Offline-safety: importing the app reads env but never connects to Mongo
// (server.ts does that). MONGODB_URI must be present for env.ts to load.
// ---------------------------------------------------------------------------

process.env.MONGODB_URI ??= "mongodb://localhost:27017/newsgarden-test";

// Pin the allowlist for this suite (the sandbox .env only sets
// FRONTEND_URL, which would otherwise narrow the list to one origin).
process.env.CORS_ORIGINS =
  "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001";

let app: import("express").Express;

beforeAll(async () => {
  const mod = await import("../../src/app.js");
  app = mod.default;
});

describe("CORS", () => {
  it("reflects an allowlisted origin (localhost:3000)", async () => {
    const res = await request(app)
      .get("/api/health")
      .set("Origin", "http://localhost:3000");

    expect(res.headers["access-control-allow-origin"]).toBe(
      "http://localhost:3000"
    );
  });

  it("reflects an allowlisted origin (127.0.0.1:3000)", async () => {
    const res = await request(app)
      .get("/api/health")
      .set("Origin", "http://127.0.0.1:3000");

    expect(res.headers["access-control-allow-origin"]).toBe(
      "http://127.0.0.1:3000"
    );
  });

  it("does not reflect a disallowed origin", async () => {
    const res = await request(app)
      .get("/api/health")
      .set("Origin", "https://evil.example");

    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("allows requests with no Origin (curl, server-to-server)", async () => {
    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);
  });

  it("answers preflight on the approval routes", async () => {
    const res = await request(app)
      .options("/api/approval/x/approve")
      .set("Origin", "http://localhost:3000")
      .set("Access-Control-Request-Method", "POST")
      .set("Access-Control-Request-Headers", "x-api-key");

    expect(res.status).toBe(204);
    expect(res.headers["access-control-allow-origin"]).toBe(
      "http://localhost:3000"
    );
    expect(res.headers["access-control-allow-methods"]).toContain("POST");
  });
});

describe("service index and error shape", () => {
  it("GET / returns a JSON service index", async () => {
    const res = await request(app).get("/");

    expect(res.status).toBe(200);
    expect(res.body.service).toBe("NewsGarden Backend");
    expect(Array.isArray(res.body.routes)).toBe(true);
    expect(res.body.routes).toContain("GET /api/health");
  });

  it("unknown routes return { error, code, path, requestId }", async () => {
    const res = await request(app).get("/nope");

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Not Found");
    expect(res.body.code).toBe("ROUTE_NOT_FOUND");
    expect(res.body.path).toBe("GET /nope");
    expect(typeof res.body.requestId).toBe("string");
    expect(res.headers["x-request-id"]).toBe(res.body.requestId);
  });
});
