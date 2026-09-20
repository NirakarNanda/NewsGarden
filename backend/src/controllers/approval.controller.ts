import type { Request, Response } from "express";

import {
  approveEdition as approveEditionService,
  getPendingApprovals as getPendingApprovalsService,
  requestRevision as requestRevisionService,
  publishEdition as publishEditionService,
} from "../services/approval.service.js";

import { isNonEmptyString } from "../utils/validation.js";

import {
  AppError,
  toErrorResponse,
} from "../utils/errors.js";

import { logger } from "../utils/logger.js";

function getEditionId(
  req: Request
): string {

  const editionId = req.params.editionId;

  if (!isNonEmptyString(editionId)) {

    throw AppError.badRequest("Missing edition id");
  }

  return editionId;
}

function getDecisionInput(
  req: Request
): { note?: string; decidedBy?: string } {

  const body = (req.body ?? {}) as {
    note?: unknown;

    decidedBy?: unknown;
  };

  const note = isNonEmptyString(body.note)
    ? body.note.trim()
    : undefined;

  const decidedBy = isNonEmptyString(body.decidedBy)
    ? body.decidedBy.trim()
    : undefined;

  return { note, decidedBy };
}

export async function getPendingApprovals(
  req: Request,
  res: Response
): Promise<void> {

  try {

    const approvals = await getPendingApprovalsService();

    res.status(200).json({
      success: true,
      data: approvals,
    });

  } catch (error) {

    logger.error("getPendingApprovals failed", error);

    const { statusCode, body } = toErrorResponse(error);

    res.status(statusCode).json(body);
  }
}

export async function approveEdition(
  req: Request,
  res: Response
): Promise<void> {

  try {

    const editionId = getEditionId(req);

    const input = getDecisionInput(req);

    const approval = await approveEditionService(
      editionId,
      input
    );

    res.status(200).json({
      success: true,
      data: approval,
    });

  } catch (error) {

    logger.error("approveEdition failed", error);

    const { statusCode, body } = toErrorResponse(error);

    res.status(statusCode).json(body);
  }
}

export async function reviseEdition(
  req: Request,
  res: Response
): Promise<void> {

  try {

    const editionId = getEditionId(req);

    const input = getDecisionInput(req);

    const approval = await requestRevisionService(
      editionId,
      input
    );

    res.status(200).json({
      success: true,
      data: approval,
    });

  } catch (error) {

    logger.error("reviseEdition failed", error);

    const { statusCode, body } = toErrorResponse(error);

    res.status(statusCode).json(body);
  }
}

export async function publishEdition(
  req: Request,
  res: Response
): Promise<void> {

  try {

    const editionId = getEditionId(req);

    const { decidedBy } = getDecisionInput(req);

    const edition = await publishEditionService(
      editionId,
      decidedBy
    );

    res.status(200).json({
      success: true,
      data: edition,
    });

  } catch (error) {

    logger.error("publishEdition failed", error);

    const { statusCode, body } = toErrorResponse(error);

    res.status(statusCode).json(body);
  }
}
