import {
  recordActivityEvent,
  findRecentActivityEvents,
} from "../repositories/activity.repository.js";

import {
  AGENT_DEFINITIONS,
} from "../config/agents.js";

import type {
  ActivityEventView,
} from "../types/events.js";

const MAX_LIMIT = 200;

export interface LogEventInput {
  name: string;

  agentId?: string;

  payload?: Record<string, unknown>;
}

export async function logEvent(
  input: LogEventInput
): Promise<ActivityEventView> {

  const created = await recordActivityEvent(input);

  return toActivityEventView(created);
}

export async function recordEvent(
  input: LogEventInput
): Promise<ActivityEventView> {

  return logEvent(input);
}

export async function listRecent(
  limit = 50
): Promise<ActivityEventView[]> {

  const safeLimit = Math.min(
    Math.max(limit, 1),
    MAX_LIMIT
  );

  const events =
    await findRecentActivityEvents(safeLimit);

  return events.map(toActivityEventView);
}

function toActivityEventView(
  event: {
    eventId: string;

    name: string;

    agentId?: string;

    payload: Record<string, unknown>;

    emittedAt: Date;
  }
): ActivityEventView {

  const at = event.emittedAt.toISOString();

  return {

    eventId: event.eventId,

    name: event.name,

    agentId: event.agentId,

    payload: event.payload,

    emittedAt: at,

    message: describeEvent(event.name, event.agentId, event.payload),

    at,
  };
}

/*
 * Turn a raw bus event into the one-liner
 * the frontend timeline renders.
 */
function describeEvent(
  name: string,
  agentId: string | undefined,
  payload: Record<string, unknown>
): string {

  const agent = agentId
    ? (AGENT_DEFINITIONS.find((d) => d.id === agentId)?.name ?? agentId)
    : "System";

  const str = (v: unknown): string =>
    typeof v === "string" ? v : "";

  switch (name) {

    case "TASK_CREATED":
      return `${agent} received task ${str(payload.type) || "new task"}`;

    case "TASK_STARTED":
    case "AGENT_STARTED":
      return `${agent} started working`;

    case "AGENT_TASK_COMPLETED":
      return `${agent} completed its task`;

    case "AGENT_TASK_FAILED":
      return `${agent} failed: ${str(payload.error || payload.message) || "unknown error"}`;

    case "AGENT_IDLE":
      return `${agent} is idle`;

    case "AGENT_MOVEMENT_REQUESTED":
      return `${agent} is moving`;

    case "ARTICLE_DISCOVERED":
      return `${agent} discovered a story`;

    case "EDITION_STAGE_COMPLETED":
      return `Edition stage ${str(payload.stage) || ""} completed`.trim();

    case "EDITION_READY_FOR_APPROVAL":
      return "Edition ready for approval";

    case "EDITION_APPROVED":
      return "Edition approved";

    case "EDITION_REVISION_REQUESTED":
      return "Edition revision requested";

    case "EDITION_PUBLISHED":
      return "Edition published";

    default:
      return `${agent}: ${name}`;
  }
}
