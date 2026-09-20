// Where the agent currently is in the NewsGarden world.
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

// What the agent is currently doing.
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