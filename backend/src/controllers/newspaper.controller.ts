import type { Request, Response } from "express";

import {
  approvePageService,
  compileEditionService,
} from "../services/newspaper.service.js";

import {
  isNonEmptyString,
  parsePositiveInt,
} from "../utils/validation.js";

import {
  AppError,
  toErrorResponse,
} from "../utils/errors.js";

import { logger } from "../utils/logger.js";

export async function approvePage(
  req: Request,
  res: Response
): Promise<void> {

  try {

    const editionId = req.params.editionId;
    const pageNumber = parsePositiveInt(req.params.pageNumber, 0, 1000);

    if (!isNonEmptyString(editionId)) {
      throw AppError.badRequest("Missing edition id");
    }

    if (!pageNumber) {
      throw AppError.badRequest("Invalid page number");
    }

    const result = await approvePageService(editionId, pageNumber);

    res.status(200).json({
      success: true,
      data: result,
    });

  } catch (error) {

    logger.error("approvePage failed", error);

    const { statusCode, body } = toErrorResponse(error);

    res.status(statusCode).json(body);
  }
}

export async function compileNewspaper(
  req: Request,
  res: Response
): Promise<void> {

  try {

    const editionId = req.params.editionId;

    if (!isNonEmptyString(editionId)) {
      throw AppError.badRequest("Missing edition id");
    }

    const result = await compileEditionService(editionId);

    res.status(200).json({
      success: true,
      data: result,
    });

  } catch (error) {

    logger.error("compileNewspaper failed", error);

    const { statusCode, body } = toErrorResponse(error);

    res.status(statusCode).json(body);
  }
}
