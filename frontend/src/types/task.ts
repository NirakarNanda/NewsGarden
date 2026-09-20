import { str } from "@/lib/api";

/** Mirrors backend TaskStatus. */
export type TaskStatus = "pending" | "running" | "completed" | "failed";

const STATUSES: TaskStatus[] = ["pending", "running", "completed", "failed"];

function isStatus(v: unknown): v is TaskStatus {
  return typeof v === "string" && (STATUSES as string[]).includes(v);
}

/**
 * Loose mirror of the backend AgentTask. Dates are ISO strings
 * (what the API actually sends); missing fields get safe defaults.
 */
export interface AgentTask {
  id: string;
  /** Which agent handles this task (backend `agentId`). */
  agentId: string;
  /** e.g. "discover-tech-news". */
  type: string;
  status: TaskStatus;
  /** Data given to the agent. */
  input?: unknown;
  /** Result returned by the agent. */
  output?: unknown;
  error?: string;
  /** ISO timestamps. */
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  retryCount: number;
}

/** Normalize a raw API/mock row into an AgentTask. Never throws. */
export function normalizeTask(r: Record<string, unknown>): AgentTask {
  const optStr = (v: unknown): string | undefined => (typeof v === "string" && v ? v : undefined);
  return {
    id: str(r.id ?? r.taskId),
    agentId: str(r.agentId),
    type: str(r.type, "task"),
    status: isStatus(r.status) ? r.status : "pending",
    input: r.input,
    output: r.output,
    error: optStr(r.error),
    createdAt: str(r.createdAt, new Date(0).toISOString()),
    startedAt: optStr(r.startedAt),
    completedAt: optStr(r.completedAt),
    retryCount: typeof r.retryCount === "number" ? r.retryCount : 0,
  };
}
