import type { Request, Response } from "express";

import {
  listAgents,
  getAgentStatus,
  dispatchAgentTask,
} from "../services/agent.service.js";

import { isNonEmptyString } from "../utils/validation.js";

import {
  AppError,
  toErrorResponse,
} from "../utils/errors.js";

import { logger } from "../utils/logger.js";

export async function listAgentsController(
  _req: Request,
  res: Response
): Promise<void> {

  try {

    const agents = await listAgents();

    res.status(200).json({
      success: true,
      data: agents,
    });

  } catch (error) {

    logger.error("listAgents failed", error);

    const { statusCode, body } = toErrorResponse(error);

    res.status(statusCode).json(body);
  }
}

export async function getAgent(
  req: Request,
  res: Response
): Promise<void> {

  try {

    const agentId = req.params.agentId;

    if (!isNonEmptyString(agentId)) {

      throw AppError.badRequest("Missing agent id");
    }

    const agent = await getAgentStatus(agentId);

    if (!agent) {

      throw AppError.notFound(
        `Agent not found: ${agentId}`
      );
    }

    res.status(200).json({
      success: true,
      data: agent,
    });

  } catch (error) {

    logger.error("getAgent failed", error);

    const { statusCode, body } = toErrorResponse(error);

    res.status(statusCode).json(body);
  }
}

/*
 * POST /api/agents/:agentId/run
 * Body: { type: string, input?: unknown }
 *
 * Assigns a specific task to a specific agent and
 * runs it in the background (202). Watch the run
 * via GET /api/activity and GET /api/agents —
 * the agent flips to "working" with the task id,
 * then back to idle when it finishes.
 */
export async function runAgent(
  req: Request,
  res: Response
): Promise<void> {

  try {

    const agentId = req.params.agentId;

    if (!isNonEmptyString(agentId)) {

      throw AppError.badRequest("Missing agent id");
    }

    const type =
      typeof req.body?.type === "string"
        ? req.body.type
        : "";

    const dispatched = await dispatchAgentTask(
      agentId,
      type,
      req.body?.input
    );

    res.status(202).json({
      success: true,
      data: dispatched,
    });

  } catch (error) {

    logger.error("runAgent failed", error);

    const { statusCode, body } = toErrorResponse(error);

    res.status(statusCode).json(body);
  }
}
