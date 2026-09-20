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
// Field names match what the frontend expects:
// status (not state) and location (not zone).
export interface CampusAgentView {
  agentId: string;

  name: string;

  role: string;

  department: string;

  status: CampusAgentState;

  // Campus zone from the departments config.
  location: string;

  currentTaskId?: string;

  // Optional map position (set by movement events).
  x?: number;

  y?: number;
}
