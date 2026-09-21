import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import mongoose from "mongoose";

import { MongoMemoryServer } from "mongodb-memory-server";

// ---------------------------------------------------------------------------
// Integration test for the human approval gate. Unlike the mocked
// unit tests, this runs the REAL Mongoose models against an in-memory
// MongoDB — no model is mocked.
//
// Regression coverage for the bug where EditionManager.requestApproval()
// moved the edition to in-review but never created the pending Approval
// document, so every approve click failed with 409.
// ---------------------------------------------------------------------------

import { Edition as EditionModel } from "../../src/models/Edition.js";

import { Approval as ApprovalModel } from "../../src/models/Approval.js";

import { EditionManager } from "../../src/engine/brain/EditionManager.js";

import {
  approveEdition,
  publishEdition,
  requestApproval,
} from "../../src/services/approval.service.js";

import { AppError } from "../../src/utils/errors.js";

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  await Promise.all([
    EditionModel.deleteMany({}),
    ApprovalModel.deleteMany({}),
  ]);
});

async function createDraftEdition(editionId: string) {
  return EditionModel.create({
    editionId,
    title: `Test edition ${editionId}`,
    date: new Date(),
    status: "in-progress",
    articleIds: [],
    pageIds: [],
    stagesCompleted: [],
    aiFallback: false,
  });
}

describe("approval gate integration (real models, in-memory Mongo)", () => {
  it("EditionManager.requestApproval creates the pending approval record", async () => {
    const manager = new EditionManager();

    await createDraftEdition("ed-1");

    // This is the exact call DailyEditionWorkflow makes.
    await manager.requestApproval("ed-1");

    const pending = await ApprovalModel.findOne({
      editionId: "ed-1",
      status: "pending",
    }).lean();

    expect(pending).not.toBeNull();

    const edition = await EditionModel.findOne({
      editionId: "ed-1",
    }).lean();

    expect(edition?.status).toBe("in-review");
  });

  it("requestApproval is idempotent: no duplicate pending records", async () => {
    await createDraftEdition("ed-2");

    await requestApproval("ed-2");
    await requestApproval("ed-2");

    const count = await ApprovalModel.countDocuments({
      editionId: "ed-2",
      status: "pending",
    });

    expect(count).toBe(1);
  });

  it("full human gate: approve then publish ends with a published edition", async () => {
    const manager = new EditionManager();

    await createDraftEdition("ed-3");
    await manager.requestApproval("ed-3");

    // Publishing before approval is forbidden — the product rule.
    let forbidden: unknown = null;
    try {
      await publishEdition("ed-3");
    } catch (error) {
      forbidden = error;
    }
    expect(forbidden).toBeInstanceOf(AppError);
    expect((forbidden as AppError).statusCode).toBe(403);

    const approved = await approveEdition("ed-3", {
      decidedBy: "integration-test",
    });
    expect(approved.status).toBe("approved");

    const published = await publishEdition("ed-3", "integration-test");
    expect(published.status).toBe("published");

    const edition = await EditionModel.findOne({
      editionId: "ed-3",
    }).lean();
    expect(edition?.status).toBe("published");
  });

  it("self-heals: an in-review edition with no approval record can be approved", async () => {
    // Legacy data shape from before the fix: in-review, but no
    // Approval document at all.
    await EditionModel.create({
      editionId: "ed-4",
      title: "Legacy in-review edition",
      date: new Date(),
      status: "in-review",
      articleIds: [],
      pageIds: [],
      stagesCompleted: [],
      aiFallback: false,
    });

    const decided = await approveEdition("ed-4", {
      decidedBy: "integration-test",
    });

    expect(decided.status).toBe("approved");

    const record = await ApprovalModel.findOne({
      editionId: "ed-4",
      status: "approved",
    }).lean();

    expect(record).not.toBeNull();
  });
});
