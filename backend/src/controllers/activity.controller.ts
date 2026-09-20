import type { Request, Response } from "express";

import { listRecent } from "../services/activity.service.js";

import { parsePositiveInt } from "../utils/validation.js";

import { toErrorResponse } from "../utils/errors.js";

import { logger } from "../utils/logger.js";

export async function listActivities(
  req: Request,
  res: Response
): Promise<void> {

  try {

    const limit = parsePositiveInt(req.query.limit, 50, 200);

    const activities = await listRecent(limit);

    res.status(200).json({
      success: true,
      data: activities,
    });

  } catch (error) {

    logger.error("listActivities failed", error);

    const { statusCode, body } = toErrorResponse(error);

    res.status(statusCode).json(body);
  }
}
