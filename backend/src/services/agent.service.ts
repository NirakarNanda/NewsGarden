import {
  getAllAgents,
  getAgentById,
  type AgentRuntimeState,
} from "../repositories/agent.repository.js";

import {
  getZoneForDepartment,
} from "../config/departments.js";

import {
  BrainAgent,
  AGENT_REGISTRY,
} from "../engine/brain/BrainAgent.js";

import {
  AppError,
} from "../utils/errors.js";

import {
  logger,
} from "../utils/logger.js";

import type {
  CampusAgentView,
} from "../types/campus.js";

/*
 * One shared brain for on-demand dispatches.
 * (The scheduled jobs build their own.)
 */
const brain = new BrainAgent();

/*
 * Canonical task types, mirroring the
 * shared package's TASK_TYPES.
 */
const VALID_TASK_TYPES = new Set([
  "discover-tech-news",
  "discover-science-news",
  "discover-culture-news",
  "discover-history-news",
  "discover-nature-news",
  "research-story",
  "write-article",
  "edit-article",
  "write-headline",
  "generate-illustration",
  "generate-image",
  "layout-page",
  "layout-edition",
  "fact-check",
  "quality-review",
]);

export interface DispatchResult {
  taskId: string;
  agentId: string;
  type: string;
  status: "pending";
}

/*
 * Create a task for a specific agent and
 * run it in the background. Lifecycle
 * events (TASK_CREATED, AGENT_STARTED,
 * AGENT_TASK_COMPLETED/FAILED, AGENT_IDLE)
 * flow through the event bus, so the
 * campus UI picks the run up on its next
 * poll — no socket needed.
 */
export async function dispatchAgentTask(
  agentId: string,
  type: string,
  input?: unknown
): Promise<DispatchResult> {

  if (!isNonEmptyString(agentId) || !AGENT_REGISTRY[agentId]) {
    throw AppError.notFound(`Unknown agent: ${agentId}`);
  }

  if (!isNonEmptyString(type) || !VALID_TASK_TYPES.has(type)) {
    throw AppError.badRequest(
      `Unknown task type: ${type}. Valid types: ${[...VALID_TASK_TYPES].join(", ")}`
    );
  }

  const task = await brain.createTask(agentId, type, input);

  // Don't await: the run reports back via events.
  void brain.runTask(task.taskId).catch((error) => {
    logger.error(`Background task ${task.taskId} threw`, error);
  });

  return {
    taskId: task.taskId,
    agentId,
    type,
    status: "pending",
  };
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export async function listAgents(): Promise<
  CampusAgentView[]
> {

  const agents = getAllAgents();

  return agents.map(toCampusAgentView);
}

export async function getAgentStatus(
  agentId: string
): Promise<CampusAgentView | null> {

  const agent = getAgentById(agentId);

  if (!agent) {

    return null;
  }

  return toCampusAgentView(agent);
}

function toCampusAgentView(
  agent: AgentRuntimeState
): CampusAgentView {

  return {

    agentId: agent.id,

    name: agent.name,

    role: agent.role,

    department: agent.department,

    status: agent.state,

    location: getZoneForDepartment(agent.department),

    currentTaskId: agent.currentTaskId,

    x: agent.x,

    y: agent.y,
  };
}
