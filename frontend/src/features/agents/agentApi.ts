import { apiGet, apiPost, str, unwrapList } from "@/lib/api";
import type { AgentInfo, AgentLocation, AgentStatus } from "@/types/agent";

// Backend's Mongoose model uses `agentId`; the UI type uses `id`.
// Tolerates both the new API shape (status/location) and the
// legacy one (state/zone) so neither renders blank.
export function normalizeAgent(r: Record<string, unknown>): AgentInfo {
  return {
    id: str(r.agentId ?? r.id),
    name: str(r.name),
    role: str(r.role),
    department: str(r.department),
    status: str(r.status ?? r.state, "idle") as AgentStatus,
    location: str(r.location ?? r.zone, "newsroom") as AgentLocation,
    currentTaskId: typeof r.currentTaskId === "string" ? r.currentTaskId : undefined,
  };
}

export async function fetchAgents(): Promise<AgentInfo[]> {
  return unwrapList(await apiGet<unknown>("/api/agents"), "agents").map(normalizeAgent);
}

export interface DispatchResponse {
  taskId: string;
  agentId: string;
  type: string;
  status: string;
}

/** Assign a specific task to a specific agent; it runs in the background. */
export async function runAgentTask(
  agentId: string,
  type: string,
  input?: unknown
): Promise<DispatchResponse> {
  const raw = await apiPost<{ data: DispatchResponse }>(`/api/agents/${agentId}/run`, { type, input });
  return raw.data;
}

/** Task types the backend accepts, with labels for the dispatch UI. */
export const TASK_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "discover-tech-news", label: "Discover tech news" },
  { value: "discover-science-news", label: "Discover science news" },
  { value: "discover-culture-news", label: "Discover culture news" },
  { value: "discover-history-news", label: "Discover history news" },
  { value: "discover-nature-news", label: "Discover nature news" },
  { value: "research-story", label: "Research a story" },
  { value: "write-article", label: "Write article" },
  { value: "edit-article", label: "Edit article" },
  { value: "write-headline", label: "Write headline" },
  { value: "generate-illustration", label: "Generate illustration" },
  { value: "generate-image", label: "Generate image" },
  { value: "layout-page", label: "Lay out page" },
  { value: "layout-edition", label: "Lay out edition" },
  { value: "fact-check", label: "Fact check" },
  { value: "quality-review", label: "Quality review" },
];
