// The lifecycle states of an agent visualized on the campus.
// Matches backend/src/types/agent.ts AgentStatus (single source of truth).
export type AgentState =
  | "idle"
  | "working"
  | "walking"
  | "waiting"
  | "completed"
  | "error";

export const AGENT_STATES: AgentState[] = [
  "idle",
  "working",
  "walking",
  "waiting",
  "completed",
  "error",
];
