import { apiGet, str, unwrapList } from "@/lib/api";
import type { ActivityItem } from "@/types/events";

export async function fetchActivity(): Promise<ActivityItem[]> {
  return unwrapList(await apiGet<unknown>("/api/activity"), "activity").map((r) => ({
    id: str(r.eventId ?? r.id),
    agentId: str(r.agentId),
    message: str(r.message),
    at: str(r.createdAt ?? r.at),
  }));
}
