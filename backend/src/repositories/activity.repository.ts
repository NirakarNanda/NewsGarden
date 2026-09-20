import {
  ActivityEvent,
} from "../models/ActivityEvent.js";

import { newId } from "../utils/ids.js";

export interface RecordActivityInput {
  name: string;

  agentId?: string;

  payload?: Record<string, unknown>;
}

export async function recordActivityEvent(
  input: RecordActivityInput
) {

  return ActivityEvent.create({
    eventId: newId(),

    name: input.name,

    agentId: input.agentId,

    payload: input.payload ?? {},

    emittedAt: new Date(),
  });
}

export async function findRecentActivityEvents(
  limit: number
) {

  return ActivityEvent.find()
    .sort({ emittedAt: -1 })
    .limit(limit)
    .lean();
}

export async function findActivityEventsByAgent(
  agentId: string,
  limit: number
) {

  return ActivityEvent.find({ agentId })
    .sort({ emittedAt: -1 })
    .limit(limit)
    .lean();
}
