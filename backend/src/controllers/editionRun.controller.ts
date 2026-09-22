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
 *
 * Optional body (zod-validated): maxArticles (1-8), articlesPerPage (1-8),
 * mode ("quick" = 4 stories on a single page). The edition is created
 * first so the 202 response carries the editionId immediately.
 */
export async function runEdition(
  req: Request,
  res: Response
): Promise<void> {

  const body = (req.body ?? {}) as {
    maxArticles?: number;
    articlesPerPage?: number;
    mode?: "quick";
  };

  const { accepted, state } = await startEditionRun({
    maxArticles: body.maxArticles,
    articlesPerPage: body.articlesPerPage,
    mode: body.mode,
  });

  if (!accepted) {

    res.status(409).json({
      success: false,
      error: "An edition run is already in progress.",
      code: "RUN_IN_PROGRESS",
      data: state,
    });

    return;
  }

  logger.info("On-demand edition run started.", { editionId: state.editionId });

  res.status(202).json({
    success: true,
    data: state,
  });
}
