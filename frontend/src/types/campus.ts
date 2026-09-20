import type { AgentLocation } from "./agent";

/** A speech bubble pinned to a room, in 1536x1024 stage pixels. */
export interface BubbleSpec {
  room: string;
  /** Agent locations whose state drives this bubble. */
  locations: AgentLocation[];
  /** Text shown when no agent is in the room (matches the reference art). */
  fallback: string;
  left: number;
  top: number;
  width: number;
  height: number;
  /** Tail x-offset from the bubble's left edge. */
  tailX: number;
}
