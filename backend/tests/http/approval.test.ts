import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import request from "supertest";

// ---------------------------------------------------------------------------
// API-level tests for the approval gate (product rule: nothing
// auto-publishes; publishing requires an approved Approval record).
//
// The Mongoose models and the edition repository are mocked so the
// suite runs without a database. Auth is exercised for real by
// setting API_KEY before the app module loads.
// ---------------------------------------------------------------------------

process.env.MONGODB_URI ??= "mongodb://localhost:27017/newsgarden-test";
process.env.API_KEY = "test-key";

const findOneMock = vi.fn();
const findOneAndUpdateMock = vi.fn();
const createMock = vi.fn();
const updateManyMock = vi.fn();
const findEditionByIdMock = vi.fn();
const setEditionStatusMock = vi.fn();
const logEventMock = vi.fn();

vi.mock("../../src/models/Approval.js", () => ({
  Approval: {
    findOne: (...args: unknown[]) => findOneMock(...args),
    findOneAndUpdate: (...args: unknown[]) => findOneAndUpdateMock(...args),
    create: (...args: unknown[]) => createMock(...args),
  },
}));

vi.mock("../../src/models/Article.js", () => ({
  Article: {
    updateMany: (...args: unknown[]) => updateManyMock(...args),
  },
}));

vi.mock("../../src/repositories/edition.repository.js", () => ({
  findEditionById: (...args: unknown[]) => findEditionByIdMock(...args),
  setEditionStatus: (...args: unknown[]) => setEditionStatusMock(...args),
  listEditions: vi.fn(),
  findPagesByEditionId: vi.fn(),
}));

vi.mock("../../src/services/activity.service.js", () => ({
  logEvent: (...args: unknown[]) => logEventMock(...args),
}));

// Query-aware findOne: the service looks up pending approvals
// (decide) and approved approvals (publish) through the same model.
let pendingDoc: Record<string, unknown> | null = null;
let approvedDoc: Record<string, unknown> | null = null;

const editionDoc = {
  editionId: "ed-1",
  title: "Test Edition",
  date: new Date("2026-09-21T00:00:00Z"),
  status: "in-review",
  pageIds: ["p1"],
  articleIds: ["a1", "a2"],
  stagesCompleted: ["discovery", "editorial", "visual", "design", "quality", "approval"],
  aiFallback: false,
};

function chainable(doc: unknown) {
  return {
    sort: () => ({
      lean: () => Promise.resolve(doc),
    }),
    select: () => ({
      lean: () => Promise.resolve(doc),
    }),
    lean: () => Promise.resolve(doc),
  };
}

let app: import("express").Express;

beforeAll(async () => {
  const mod = await import("../../src/app.js");
  app = mod.default;
});

beforeEach(() => {
  vi.clearAllMocks();
  pendingDoc = null;
  approvedDoc = null;

  findOneMock.mockImplementation((query: { status?: string }) =>
    chainable(query?.status === "approved" ? approvedDoc : pendingDoc)
  );
  findOneAndUpdateMock.mockImplementation(() => chainable(pendingDoc));
  createMock.mockImplementation(async (doc: Record<string, unknown>) => ({
    approvalId: "ap-healed",
    ...doc,
  }));
  updateManyMock.mockResolvedValue({ modifiedCount: 2 });
  findEditionByIdMock.mockResolvedValue({ ...editionDoc });
  setEditionStatusMock.mockImplementation(
    async (_id: string, status: string) => ({
      ...editionDoc,
      status,
    })
  );
  logEventMock.mockResolvedValue(undefined);
});

describe("approval auth", () => {
  it("rejects approve without the API key (401)", async () => {
    const res = await request(app).post("/api/approval/ed-1/approve");
    expect(res.status).toBe(401);
  });

  it("rejects publish without the API key (401)", async () => {
    const res = await request(app).post("/api/approval/ed-1/publish");
    expect(res.status).toBe(401);
  });
});

describe("approval gate", () => {
  it("approve self-heals a missing approval record for an in-review edition (200)", async () => {
    // Legacy data shape: in-review but no Approval document at all.
    // The service creates the pending record on the spot and continues.
    findOneAndUpdateMock.mockImplementation(() =>
      chainable({
        approvalId: "ap-healed",
        editionId: "ed-1",
        status: "approved",
        decidedAt: new Date(),
      })
    );
    const res = await request(app)
      .post("/api/approval/ed-1/approve")
      .set("x-api-key", "test-key");
    expect(res.status).toBe(200);
    expect(createMock).toHaveBeenCalled();
  });

  it("approve still 409s when the edition was never sent for review", async () => {
    findEditionByIdMock.mockResolvedValue({ ...editionDoc, status: "draft" });
    const res = await request(app)
      .post("/api/approval/ed-1/approve")
      .set("x-api-key", "test-key");
    expect(res.status).toBe(409);
  });

  it("approve succeeds with a pending approval (200)", async () => {
    pendingDoc = {
      approvalId: "ap-1",
      editionId: "ed-1",
      status: "approved",
      decidedAt: new Date(),
    };
    const res = await request(app)
      .post("/api/approval/ed-1/approve")
      .set("x-api-key", "test-key");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(setEditionStatusMock).toHaveBeenCalledWith("ed-1", "approved");
  });

  it("revise succeeds with a pending approval and a note (200)", async () => {
    pendingDoc = {
      approvalId: "ap-1",
      editionId: "ed-1",
      status: "revision-requested",
      note: "Fix the headline.",
      decidedAt: new Date(),
    };
    const res = await request(app)
      .post("/api/approval/ed-1/revise")
      .set("x-api-key", "test-key")
      .send({ note: "Fix the headline." });
    expect(res.status).toBe(200);
    expect(setEditionStatusMock).toHaveBeenCalledWith(
      "ed-1",
      "revision-requested"
    );
  });

  it("publish without an approved approval is forbidden (403)", async () => {
    // No approvedDoc -> the product rule must hold.
    const res = await request(app)
      .post("/api/approval/ed-1/publish")
      .set("x-api-key", "test-key");
    expect(res.status).toBe(403);
    expect(setEditionStatusMock).not.toHaveBeenCalled();
  });

  it("publish succeeds after approval (200) and marks articles published", async () => {
    approvedDoc = {
      approvalId: "ap-1",
      editionId: "ed-1",
      status: "approved",
      decidedAt: new Date(),
    };
    const res = await request(app)
      .post("/api/approval/ed-1/publish")
      .set("x-api-key", "test-key");
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("published");
    expect(updateManyMock).toHaveBeenCalledWith(
      { articleId: { $in: ["a1", "a2"] } },
      { status: "published" }
    );
    expect(setEditionStatusMock).toHaveBeenCalledWith("ed-1", "published");
  });
});

describe("edition run endpoint", () => {
  it("GET /api/editions/run reports idle state without a key", async () => {
    const res = await request(app).get("/api/editions/run");
    expect(res.status).toBe(200);
    expect(res.body.data.running).toBe(false);
  });

  it("POST /api/editions/run requires the API key (401)", async () => {
    const res = await request(app).post("/api/editions/run");
    expect(res.status).toBe(401);
  });
});
