// The lifecycle of a newspaper edition.
export type EditionStatus =
  | "draft"
  | "in-progress"
  | "in-review"
  | "approved"
  | "published"
  | "revision-requested";

export interface Edition {
  editionId: string;

  title: string;

  date: string;

  status: EditionStatus;

  pageIds: string[];

  articleIds: string[];
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
}

// The human approval decision. Approval is required before publishing.
export interface ApprovalDecision {
  editionId: string;

  decision: "approve" | "revise";

  note?: string;

  decidedBy?: string;

  decidedAt: Date | string;
}
