import type { NewsEvent } from "./event.js";

export type { NewsEvent };

// Envelope for realtime events on the backend bus.
export interface BusEvent {
  name: string;

  payload: Record<string, unknown>;

  // ISO datetime string.
  emittedAt: string;

  agentId?: string;
}

// A persisted activity record, as returned by the API.
export interface ActivityEventView {
  eventId: string;

  name: string;

  agentId?: string;

  payload: Record<string, unknown>;

  // ISO datetime string.
  emittedAt: string;
}
