import {
  findEditionById,
  listEditions,
  findPagesByEditionId,
} from "../repositories/edition.repository.js";

import { findArticlesByIds } from "../repositories/article.repository.js";

import { AppError } from "../utils/errors.js";

import type { Edition, EditionWithPages, NewspaperPage, PageSlot } from "../types/edition.js";

import type { ArticleView } from "../types/article.js";

import { ARTICLES_PER_PAGE, EDITION_STAGES } from "@newsgarden/shared";

export async function listEditionsService(limit = 20): Promise<Edition[]> {
  const editions = await listEditions(limit);

  return editions.map(toEditionRecord);
}

export async function getEditionById(editionId: string): Promise<Edition> {
  const edition = await findEditionById(editionId);

  if (!edition) {
    throw AppError.notFound(`Edition not found: ${editionId}`);
  }

  return toEditionRecord(edition);
}

// Three batched queries (edition, pages, articles): no N+1.
export async function getEditionWithPages(editionId: string): Promise<EditionWithPages> {
  const edition = await getEditionById(editionId);

  const pages = await findPagesByEditionId(editionId);

  const articles = await findArticlesByIds(edition.articleIds);

  return {
    ...edition,

    pages: pages.map(toNewspaperPageRecord),

    articles: articles.map(toArticleView),
  };
}

export function toEditionRecord(edition: {
  editionId: string;

  title: string;

  date: Date;

  status: Edition["status"];

  pageIds: string[];

  articleIds: string[];

  stagesCompleted?: string[];

  aiFallback?: boolean;
}): Edition {
  const stagesCompleted = edition.stagesCompleted ?? [];

  const pagesCompleted = edition.pageIds.length;

  // Planned page count: laid-out pages, or an estimate from the
  // article count until layout runs.
  const pagesTotal = Math.max(
    pagesCompleted,
    Math.ceil(edition.articleIds.length / ARTICLES_PER_PAGE),
  );

  return {
    editionId: edition.editionId,

    title: edition.title,

    date: edition.date.toISOString().slice(0, 10),

    status: edition.status,

    pageIds: edition.pageIds,

    articleIds: edition.articleIds,

    stagesCompleted,

    aiFallback: edition.aiFallback ?? false,

    pagesCompleted,

    pagesTotal,

    currentStage: deriveCurrentStage(edition.status, stagesCompleted),
  };
}

/*
 * Index into EDITION_STAGES. Late statuses imply the full pipeline
 * ran, even for editions created before stage tracking existed.
 */
function deriveCurrentStage(status: Edition["status"], stagesCompleted: string[]): number {
  if (
    status === "in-review" ||
    status === "approved" ||
    status === "published" ||
    status === "revision-requested"
  ) {
    return EDITION_STAGES.length;
  }

  return Math.min(stagesCompleted.length, EDITION_STAGES.length);
}

function toNewspaperPageRecord(page: {
  pageId: string;

  editionId: string;

  pageNumber: number;

  slots: PageSlot[];
}): NewspaperPage {
  return {
    pageId: page.pageId,

    editionId: page.editionId,

    pageNumber: page.pageNumber,

    slots: page.slots,
  };
}

function toArticleView(article: {
  articleId: string;

  title: string;

  url: string;

  source: string;

  summary?: string;

  publishedAt?: Date;

  discoveredAt: Date;

  category: string;

  status: ArticleView["status"];
}): ArticleView {
  return {
    articleId: article.articleId,

    title: article.title,

    url: article.url,

    source: article.source,

    summary: article.summary,

    publishedAt: article.publishedAt?.toISOString(),

    discoveredAt: article.discoveredAt.toISOString(),

    category: article.category,

    status: article.status,
  };
}
