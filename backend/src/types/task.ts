// A task moves through these states.
export type TaskStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed";

export interface AgentTask {
  id: string;

  // Which agent should handle this task?
  agentId: string;

  // Example: "discover-tech-news"
  type: string;

  status: TaskStatus;

  // Data given to the agent.
  input?: unknown;

  // Result returned by the agent.
  output?: unknown;

  error?: string;

  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;

  // Useful later if something fails.
  retryCount: number;
}