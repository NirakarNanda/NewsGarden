import {
  Approval,
} from "../models/Approval.js";

import {
  Article,
} from "../models/Article.js";

import {
  Edition as EditionModel,
} from "../models/Edition.js";

import {
  findEditionById,
  setEditionStatus,
} from "../repositories/edition.repository.js";

import {
  getEditionWithPages,
} from "./edition.service.js";

import type {
  EditionWithPages,
} from "../types/edition.js";

import {
  toEditionRecord,
} from "./edition.service.js";

import {
  logEvent,
} from "./activity.service.js";

import { newId } from "../utils/ids.js";

import { AppError } from "../utils/errors.js";

import type {
  Approval as ApprovalRecord,
  ApprovalStatus,
} from "../types/edition.js";

import type {
  Edition,
} from "../types/edition.js";

export interface DecideInput {
  note?: string;

  decidedBy?: string;
}

// Lists editions waiting for a human decision, each with its pages
// and articles. This is what the approval panel renders.
export async function getPendingApprovals(): Promise<EditionWithPages[]> {

  const editions = await EditionModel.find({
    status: "in-review",
  })
    .sort({ date: -1 })
    .lean();

  const pending: EditionWithPages[] = [];

  for (const edition of editions) {

    pending.push(
      await getEditionWithPages(edition.editionId)
    );
  }

  return pending;
}

// Asks a human to approve the edition.
// Marks the edition "in-review" and opens a pending approval.
// Idempotent: if a pending approval already exists for the edition,
// it is returned instead of creating a second one.
export async function requestApproval(
  editionId: string,
  decidedBy?: string
): Promise<ApprovalRecord> {

  const edition = await findEditionById(editionId);

  if (!edition) {

    throw AppError.notFound(
      `Edition not found: ${editionId}`
    );
  }

  if (edition.status === "published") {

    throw AppError.conflict(
      "Edition is already published"
    );
  }

  const existing = await Approval.findOne({
    editionId,

    status: "pending",
  })
    .sort({ createdAt: -1 })
    .lean();

  if (existing) {

    // Self-heal: a pending approval exists but the edition never
    // reached in-review (interrupted flow). Fix the status.
    if (edition.status !== "in-review") {

      await setEditionStatus(editionId, "in-review");
    }

    return toApprovalRecord(existing);
  }

  const created =
    await createPendingApproval(editionId, decidedBy);

  await setEditionStatus(editionId, "in-review");

  await logEvent({
    name: "EDITION_READY_FOR_APPROVAL",

    payload: {
      editionId,

      approvalId: created.approvalId,
    },
  });

  return toApprovalRecord(created);
}

// Creates the pending Approval document. Single place where
// pending approvals are born.
async function createPendingApproval(
  editionId: string,
  decidedBy?: string
): Promise<{
  approvalId: string;

  editionId: string;

  status: ApprovalStatus;

  decidedBy?: string;
}> {

  const created = await Approval.create({
    approvalId: newId(),

    editionId,

    status: "pending" as ApprovalStatus,

    decidedBy,
  });

  return {
    approvalId: created.approvalId,

    editionId: created.editionId,

    status: created.status as ApprovalStatus,

    decidedBy: created.decidedBy,
  };
}

// Startup backfill: editions that reached in-review before the
// approval record existed (or whose record was lost) get a pending
// approval so the human gate keeps working. Returns how many were
// created.
export async function backfillPendingApprovals(): Promise<number> {

  const editions = await EditionModel.find({
    status: "in-review",
  })
    .select("editionId")
    .lean();

  let created = 0;

  for (const edition of editions) {

    const any = await Approval.findOne({
      editionId: edition.editionId,
    })
      .select("_id")
      .lean();

    if (!any) {

      await createPendingApproval(edition.editionId);

      created += 1;
    }
  }

  return created;
}

// Approves the edition. This does NOT publish it.
export async function approveEdition(
  editionId: string,
  input: DecideInput = {}
): Promise<ApprovalRecord> {

  const approval = await decideOnEdition(
    editionId,
    "approved",
    input
  );

  await logEvent({
    name: "EDITION_APPROVED",

    agentId: input.decidedBy,

    payload: {
      editionId,

      approvalId: approval.approvalId,
    },
  });

  return approval;
}

// Sends the edition back for revision.
export async function requestRevision(
  editionId: string,
  input: DecideInput = {}
): Promise<ApprovalRecord> {

  const approval = await decideOnEdition(
    editionId,
    "revision-requested",
    input
  );

  await logEvent({
    name: "EDITION_REVISION_REQUESTED",

    agentId: input.decidedBy,

    payload: {
      editionId,

      approvalId: approval.approvalId,

      note: input.note,
    },
  });

  return approval;
}

// Publishes the edition. Enforces the product rule:
// publishing is only allowed after a human approval.
export async function publishEdition(
  editionId: string,
  decidedBy?: string
): Promise<Edition> {

  const approved = await Approval.findOne({
    editionId,

    status: "approved",
  })
    .sort({ decidedAt: -1 })
    .lean();

  if (!approved) {

    throw AppError.forbidden(
      "Edition must be approved before publishing"
    );
  }

  const edition = await findEditionById(editionId);

  if (!edition) {

    throw AppError.notFound(
      `Edition not found: ${editionId}`
    );
  }

  // One batched update for every article on the edition.
  await Article.updateMany(
    { articleId: { $in: edition.articleIds } },
    { status: "published" }
  );

  const published =
    await setEditionStatus(editionId, "published");

  if (!published) {

    throw AppError.notFound(
      `Edition not found: ${editionId}`
    );
  }

  await logEvent({
    name: "EDITION_PUBLISHED",

    agentId: decidedBy,

    payload: {
      editionId,

      approvalId: approved.approvalId,
    },
  });

  return toEditionRecord(published);
}

async function decideOnEdition(
  editionId: string,
  status: ApprovalStatus,
  input: DecideInput
): Promise<ApprovalRecord> {

  const edition = await findEditionById(editionId);

  if (!edition) {

    throw AppError.notFound(
      `Edition not found: ${editionId}`
    );
  }

  const pending = await Approval.findOne({
    editionId,

    status: "pending",
  })
    .sort({ createdAt: -1 })
    .lean();

  if (!pending) {

    // Self-heal for legacy data: the edition reached in-review
    // before any approval record existed (the old EditionManager
    // flow). Create the pending record on the spot and continue
    // instead of failing the human's click.
    const anyApproval = await Approval.findOne({
      editionId,
    })
      .select("_id")
      .lean();

    if (!anyApproval && edition.status === "in-review") {

      const healed =
        await createPendingApproval(editionId, input.decidedBy);

      return decideOnExistingApproval(
        healed.approvalId,
        editionId,
        status,
        input
      );
    }

    throw AppError.conflict(
      `No pending approval for edition: ${editionId}`
    );
  }

  return decideOnExistingApproval(
    pending.approvalId,
    editionId,
    status,
    input
  );
}

async function decideOnExistingApproval(
  approvalId: string,
  editionId: string,
  status: ApprovalStatus,
  input: DecideInput
): Promise<ApprovalRecord> {

  const decided = await Approval.findOneAndUpdate(
    { approvalId },
    {
      status,

      note: input.note,

      decidedBy: input.decidedBy,

      decidedAt: new Date(),
    },
    { new: true }
  ).lean();

  if (!decided) {

    throw AppError.notFound(
      `Approval not found for edition: ${editionId}`
    );
  }

  const editionStatus =
    status === "approved" ? "approved" : "revision-requested";

  await setEditionStatus(editionId, editionStatus);

  return toApprovalRecord(decided);
}

function toApprovalRecord(
  approval: {
    approvalId: string;

    editionId: string;

    status: ApprovalStatus;

    note?: string;

    decidedBy?: string;

    decidedAt?: Date;
  }
): ApprovalRecord {

  return {

    approvalId: approval.approvalId,

    editionId: approval.editionId,

    status: approval.status,

    note: approval.note,

    decidedBy: approval.decidedBy,

    decidedAt: approval.decidedAt?.toISOString(),
  };
}
