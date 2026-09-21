/**
 * Contract the UI expects from GET /api/editions (newest first).
 * Canonical shape lives in @newsgarden/shared; this re-export keeps
 * existing imports working until the duplicates are removed.
 */
export type {
  EditionProgress as EditionSummary,
  EditionStage,
} from "@newsgarden/shared";

export {
  EDITION_STAGES,
  ARTICLES_PER_PAGE,
} from "@newsgarden/shared";
