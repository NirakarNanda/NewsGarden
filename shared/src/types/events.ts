import type { EventName } from "../constants/events.js";

// The wire format for realtime events between backend and frontend.
export interface NewsGardenEvent {
  name: EventName;

  payload: Record<string, unknown>;

  emittedAt: string;

  agentId?: string;
}
