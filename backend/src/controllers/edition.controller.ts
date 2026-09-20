import type { Request, Response } from "express";

import {
  listEditionsService,
  getEditionWithPages,
} from "../services/edition.service.js";

import {
  isNonEmptyString,
  parsePositiveInt,
} from "../utils/validation.js";

import {
  AppError,
  toErrorResponse,
} from "../utils/errors.js";

import { logger } from "../utils/logger.js";

export async function listEditions(
  req: Request,
  res: Response
): Promise<void> {

  try {

    const limit = parsePositiveInt(req.query.limit, 20, 100);

    const editions = await listEditionsService(limit);

    res.status(200).json({
      success: true,
      data: editions,
    });

  } catch (error) {

    logger.error("listEditions failed", error);

    const { statusCode, body } = toErrorResponse(error);

    res.status(statusCode).json(body);
  }
}

export async function getEdition(
  req: Request,
  res: Response
): Promise<void> {

  try {

    const editionId = req.params.editionId;

    if (!isNonEmptyString(editionId)) {

      throw AppError.badRequest("Missing edition id");
    }

    const edition = await getEditionWithPages(editionId);

    res.status(200).json({
      success: true,
      data: edition,
    });

  } catch (error) {

    logger.error("getEdition failed", error);

    const { statusCode, body } = toErrorResponse(error);

    res.status(statusCode).json(body);
  }
}
