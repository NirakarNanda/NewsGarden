/** Contract the UI expects from GET /api/activity (newest first). */
export interface ActivityItem {
  id: string;
  agentId: string;
  message: string;
  /** ISO timestamp */
  at: string;
}
