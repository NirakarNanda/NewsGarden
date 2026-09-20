import { apiGet, str, unwrapList } from "@/lib/api";
import type { AgentInfo, AgentLocation, AgentStatus } from "@/types/agent";

// Backend's Mongoose model uses `agentId`; the UI type uses `id`.
export function normalizeAgent(r: Record<string, unknown>): AgentInfo {
  return {
    id: str(r.agentId ?? r.id),
    name: str(r.name),
    role: str(r.role),
    department: str(r.department),
    status: str(r.status, "idle") as AgentStatus,
    location: str(r.location, "newsroom") as AgentLocation,
    currentTaskId: typeof r.currentTaskId === "string" ? r.currentTaskId : undefined,
  };
}

export async function fetchAgents(): Promise<AgentInfo[]> {
  return unwrapList(await apiGet<unknown>("/api/agents"), "agents").map(normalizeAgent);
}
