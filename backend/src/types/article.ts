export interface ArticleData {
  articleId: string;

  title: string;

  url: string;

  source: string;

  summary?: string;

  publishedAt?: Date;

  discoveredAt: Date;

  category: string;

  // Added after event clustering.
  eventId?: string;

  status:
    | "discovered"
    | "researching"
    | "writing"
    | "ready"
    | "published";
}