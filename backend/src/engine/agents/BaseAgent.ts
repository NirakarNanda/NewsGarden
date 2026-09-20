import type { AgentTask } from "../../types/task.js";

export interface AgentResult {
  success: boolean;

  // Whatever the agent produces.
  output?: unknown;

  error?: string;
}

export abstract class BaseAgent {
  abstract id: string;

  abstract name: string;

  abstract role: string;

  abstract department: string;

  // Every agent must implement this.
  abstract execute(
    task: AgentTask
  ): Promise<AgentResult>;

  // Small helper to show when an agent starts.
  protected log(message: string): void {
    console.log(
      `[${this.name}] ${message}`
    );
  }
}