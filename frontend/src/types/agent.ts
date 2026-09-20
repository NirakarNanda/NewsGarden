// Mirrors backend/src/types/agent.ts
export type AgentLocation =
  | "newsroom"
  | "research-lab"
  | "editorial-room"
  | "visual-studio"
  | "design-studio"
  | "quality-room"
  | "cafe"
  | "manga-library"
  | "badminton-court";

export type AgentStatus =
  | "idle"
  | "working"
  | "walking"
  | "waiting"
  | "completed"
  | "error";

export interface AgentInfo {
  id: string;
  name: string;
  role: string;
  department: string;
  status: AgentStatus;
  location: AgentLocation;
  currentTaskId?: string;
}
