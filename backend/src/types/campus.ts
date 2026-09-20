// Live agent states shared with the campus UI.
// Matches backend/src/types/agent.ts AgentStatus (single source of truth).
export type CampusAgentState =
  | "idle"
  | "working"
  | "walking"
  | "waiting"
  | "completed"
  | "error";

// What the campus UI needs to render one agent.
export interface CampusAgentView {
  agentId: string;

  name: string;

  department: string;

  state: CampusAgentState;

  // Campus zone from the departments config.
  zone: string;

  // Optional map position (set by movement events).
  x?: number;

  y?: number;
}
