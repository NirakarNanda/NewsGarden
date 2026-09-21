import type { Request, Response } from "express";

import {
  getEditionRunState,
  startEditionRun,
} from "../services/editionRun.service.js";

import { logger } from "../utils/logger.js";

/*
 * GET /api/editions/run — current on-demand run state.
 * Read-only so the campus UI can show it without an API key.
 */
export function getRunState(
  _req: Request,
  res: Response
): void {

  res.status(200).json({
    success: true,
    data: getEditionRunState(),
  });
}

/*
 * POST /api/editions/run — start an edition build now.
 * 202 when the run starts, 409 when one is already active.
 * Authenticated (mutating route).
 */
export function runEdition(
  _req: Request,
  res: Response
): void {

  const { accepted, state } = startEditionRun();

  if (!accepted) {

    res.status(409).json({
      success: false,
      error: "An edition run is already in progress.",
      code: "RUN_IN_PROGRESS",
      data: state,
    });

    return;
  }

  logger.info("On-demand edition run started.");

  res.status(202).json({
    success: true,
    data: state,
  });
}
