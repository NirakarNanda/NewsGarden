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
// `message`/`at` are what the frontend timeline renders;
// the raw fields stay for anyone who needs them.
export interface ActivityEventView {
  eventId: string;

  name: string;

  agentId?: string;

  payload: Record<string, unknown>;

  // ISO datetime string.
  emittedAt: string;

  // Human-readable one-liner, e.g. "Tech News Agent started working".
  message: string;

  // ISO datetime string (alias of emittedAt).
  at: string;
}
