import { str } from "@/lib/api";

/** Mirrors backend ArticleData.status. */
export type ArticleStatus = "discovered" | "researching" | "writing" | "ready" | "published";

const STATUSES: ArticleStatus[] = ["discovered", "researching", "writing", "ready", "published"];

function isStatus(v: unknown): v is ArticleStatus {
  return typeof v === "string" && (STATUSES as string[]).includes(v);
}

/**
 * Loose mirror of the backend ArticleData. Dates are ISO strings
 * (what the API actually sends); everything has a safe default so
 * mock-mode rows with missing fields never crash a component.
 */
export interface Article {
  articleId: string;
  title: string;
  url: string;
  source: string;
  summary?: string;
  /** Full written body, present once editorial is done. */
  body?: string;
  category: string;
  status: ArticleStatus;
  imageUrl?: string;
  /** Attribution line for web-sourced images. */
  imageCredit?: string;
  /** Source page the web-sourced image came from. */
  imageSourceUrl?: string;
  /** ISO timestamp. */
  publishedAt?: string;
}

/** Normalize a raw API/mock row into an Article. Never throws. */
export function normalizeArticle(r: Record<string, unknown>): Article {
  const opt = (v: unknown): string | undefined => (typeof v === "string" && v ? v : undefined);
  return {
    articleId: str(r.articleId ?? r.id),
    title: str(r.title, "Untitled"),
    url: str(r.url),
    source: str(r.source, "NewsGarden"),
    summary: opt(r.summary),
    body: opt(r.body),
    category: str(r.category, "General"),
    status: isStatus(r.status) ? r.status : "discovered",
    imageUrl: opt(r.imageUrl ?? r.image),
    imageCredit: opt(r.imageCredit),
    imageSourceUrl: opt(r.imageSourceUrl),
    publishedAt: opt(r.publishedAt),
  };
}
