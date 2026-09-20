/**
 * Contract the UI expects from GET /api/editions (newest first).
 * currentStage indexes EDITION_STAGES: every stage before it renders as done.
 */
export interface EditionSummary {
  editionId: string;
  pagesCompleted: number;
  pagesTotal: number;
  currentStage: number;
}
