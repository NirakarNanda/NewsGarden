// The lifecycle of a newspaper edition.
export type EditionStatus =
  | "draft"
  | "in-progress"
  | "in-review"
  | "approved"
  | "compiled"
  | "published"
  | "revision-requested";

// Pipeline stages an edition moves through, in order.
// Shared by the backend (stage tracking) and the frontend (progress UI).
export const EDITION_STAGES = [
  "discovery",
  "editorial",
  "visual",
  "design",
  "quality",
  "approval",
] as const;

export type EditionStage = (typeof EDITION_STAGES)[number];

// Default articles laid out per newspaper page.
export const ARTICLES_PER_PAGE = 4;

export interface Edition {
  editionId: string;

  title: string;

  date: string;

  status: EditionStatus;

  pageIds: string[];

  articleIds: string[];

  // Workflow stages completed so far, in EDITION_STAGES order.
  stagesCompleted: EditionStage[];

  // True when the edition was built while the AI provider
  // was unreachable (offline fallback content). The UI
  // must label such editions visibly.
  aiFallback: boolean;
}

// Progress summary the campus UI renders. currentStage indexes
// EDITION_STAGES: every stage before it renders as done.
export interface EditionProgress {
  editionId: string;

  pagesCompleted: number;

  pagesTotal: number;

  currentStage: number;

  // True when the edition was built while the AI provider
  // was unreachable (offline fallback content).
  aiFallback: boolean;
}

// One slot in a page layout: text, image, or both.
// Slots are stored in ranked display order (lead first).
// Matches backend/src/models/NewspaperPage.ts PageSlot.
export type PageSlotKind =
  | "lead"
  | "secondary"
  | "brief";

export interface PageSlot {
  articleId?: string;

  imageUrl?: string;

  headline?: string;

  // Layout designation assigned by the layout agent.
  slot?: PageSlotKind;
}

export interface NewspaperPage {
  pageId: string;

  editionId: string;

  pageNumber: number;

  slots: PageSlot[];

  /** Per-page human approval; the compiler only assembles approved pages. */
  status?: "draft" | "approved";

  approvedAt?: Date | string;
}

// The human approval decision. Approval is required before publishing.
export interface ApprovalDecision {
  editionId: string;

  decision: "approve" | "revise";

  note?: string;

  decidedBy?: string;

  decidedAt: Date | string;
}
