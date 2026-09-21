"use client";

import { useLive } from "@/lib/useLive";
import { USE_MOCK } from "@/lib/api";
import { MOCK_EDITION } from "@/features/mock";
import type { EditionSummary } from "@/types/edition";
import { fetchLatestEdition } from "./editionApi";

/**
 * Latest edition, or null when the backend is reachable but no edition
 * exists yet (a real empty state — not an error, so the connection pill
 * stays LIVE). In demo mode (NEXT_PUBLIC_USE_MOCK=true) this returns the
 * mock edition, labelled as demo data wherever it is shown.
 *
 * Refreshes on edition realtime events, with a 30s safety poll.
 */
async function fetchLatestEditionOrNull(): Promise<EditionSummary | null> {
  try {
    return await fetchLatestEdition();
  } catch (e) {
    if (e instanceof Error && e.message === "No editions yet") return null;
    throw e;
  }
}

export const useEdition = () =>
  useLive<EditionSummary | null>(
    "edition",
    fetchLatestEditionOrNull,
    USE_MOCK ? MOCK_EDITION : null,
    {
      refreshOnEvent: (e) => e.type.startsWith("EDITION_"),
    }
  );
