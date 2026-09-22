"use client";

import { useLive } from "@/lib/useLive";
import { apiGet, str, unwrapList } from "@/lib/api";

export interface InReviewEdition {
  editionId: string;
  title: string;
  date: string;
  status: string;
}

function normalize(r: Record<string, unknown>): InReviewEdition | null {
  const editionId = str(r.editionId ?? r.id);
  if (!editionId) return null;
  return {
    editionId,
    title: str(r.title, "Untitled edition"),
    date: str(r.date),
    status: str(r.status, "draft"),
  };
}

async function fetchInReview(): Promise<InReviewEdition[]> {
  const rows = unwrapList(await apiGet<unknown>("/api/editions?limit=50"), "editions");
  return rows
    .map((r) => normalize(r as Record<string, unknown>))
    .filter((e): e is InReviewEdition => e !== null && e.status === "in-review");
}

/**
 * Editions currently waiting for human approval.
 * Refreshes on edition realtime events, with a 30s safety poll.
 * In demo mode returns an empty list (no backend to approve against).
 */
export const useInReviewEditions = () =>
  useLive<InReviewEdition[]>("in-review-editions", fetchInReview, [], {
    refreshOnEvent: (e) => e.type.startsWith("EDITION_") || e.type.startsWith("APPROVAL_"),
  });
