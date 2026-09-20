import type { AgentState } from "../constants/agentStates.js";

import type { Department } from "../constants/departments.js";

// What the frontend renders as a campus character.
export interface AgentInfo {
  id: string;

  name: string;

  role: string;

  department: Department;

  state: AgentState;

  currentTaskId?: string;

  zone?: string;

  lastHeartbeat: Date | string;
}

// A lightweight ping the backend uses to track liveness and state.
export interface AgentHeartbeat {
  agentId: string;

  state: AgentState;

  taskId?: string;

  timestamp: Date | string;
}
