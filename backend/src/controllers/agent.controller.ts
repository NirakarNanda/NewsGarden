import type { Request, Response } from "express";

import {
  listAgents,
  getAgentStatus,
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
