import type {
  ArticleView,
} from "./article.js";

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

  // ISO date string.
  date: string;

  status: EditionStatus;

  pageIds: string[];

  articleIds: string[];
}

// One slot in a page layout: text, image, or both.
// Note: the backend page model stores slots directly on the
// page; the shared contract nests them under `layout.slots`.
// Keep this in mind when syncing the shared types.
export interface PageSlot {
  articleId?: string;

  imageUrl?: string;

  headline?: string;
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

export type ApprovalStatus =
  | "pending"
  | "approved"
  | "revision-requested";

// A stored approval record.
export interface Approval {
  approvalId: string;

  editionId: string;

  status: ApprovalStatus;

  note?: string;

  decidedBy?: string;

  // ISO datetime string.
  decidedAt?: string;
}

// An edition with its pages and articles attached.
export interface EditionWithPages extends Edition {
  pages: NewspaperPage[];

  articles: ArticleView[];
}
