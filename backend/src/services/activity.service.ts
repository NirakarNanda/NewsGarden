import {
  recordActivityEvent,
  findRecentActivityEvents,
} from "../repositories/activity.repository.js";

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

  return {

    eventId: event.eventId,

    name: event.name,

    agentId: event.agentId,

    payload: event.payload,

    emittedAt: event.emittedAt.toISOString(),
  };
}
