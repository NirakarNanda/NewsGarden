// The pipeline stages an article moves through.
// Matches backend/src/models/Article.ts status enum (single source of truth).
export type ArticleStatus =
  | "discovered"
  | "researching"
  | "writing"
  | "drafted"
  | "edited"
  | "fact-checked"
  | "ready"
  | "published";

export interface Article {
  articleId: string;

  title: string;

  url: string;

  source: string;

  summary?: string;

  body?: string;

  category: string;

  status: ArticleStatus;

  discoveredAt: Date | string;

  publishedAt?: Date | string;

  imageUrl?: string;

  // Attribution for web-sourced images.
  imageCredit?: string;

  imageSourceUrl?: string;

  author?: string;

  // Which AI model produced this article's content.
  aiModel?: string;
}
