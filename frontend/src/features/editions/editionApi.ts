import { apiGet, num, str, unwrapList } from "@/lib/api";
import type { EditionSummary } from "@/types/edition";

export async function fetchLatestEdition(): Promise<EditionSummary> {
  const [latest] = unwrapList(await apiGet<unknown>("/api/editions"), "editions");
  if (!latest) throw new Error("No editions yet");
  return {
    editionId: str(latest.editionId ?? latest.id),
    pagesCompleted: num(latest.pagesCompleted),
    pagesTotal: num(latest.pagesTotal),
    currentStage: num(latest.currentStage),
    aiFallback: latest.aiFallback === true,
  };
}
