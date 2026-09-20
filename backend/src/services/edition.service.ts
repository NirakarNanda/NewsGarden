import {
  findEditionById,
  listEditions,
  findPagesByEditionId,
} from "../repositories/edition.repository.js";

import {
  findArticlesByIds,
} from "../repositories/article.repository.js";

import { AppError } from "../utils/errors.js";

import type {
  Edition,
  EditionWithPages,
  NewspaperPage,
  PageSlot,
} from "../types/edition.js";

import type {
  ArticleView,
} from "../types/article.js";

export async function listEditionsService(
  limit = 20
): Promise<Edition[]> {

  const editions = await listEditions(limit);

  return editions.map(toEditionRecord);
}

export async function getEditionById(
  editionId: string
): Promise<Edition> {

  const edition = await findEditionById(editionId);

  if (!edition) {

    throw AppError.notFound(
      `Edition not found: ${editionId}`
    );
  }

  return toEditionRecord(edition);
}

// Three batched queries (edition, pages, articles): no N+1.
export async function getEditionWithPages(
  editionId: string
): Promise<EditionWithPages> {

  const edition = await getEditionById(editionId);

  const pages = await findPagesByEditionId(editionId);

  const articles =
    await findArticlesByIds(edition.articleIds);

  return {

    ...edition,

    pages: pages.map(toNewspaperPageRecord),

    articles: articles.map(toArticleView),
  };
}

function toEditionRecord(
  edition: {
    editionId: string;

    title: string;

    date: Date;

    status: Edition["status"];

    pageIds: string[];

    articleIds: string[];
  }
): Edition {

  return {

    editionId: edition.editionId,

    title: edition.title,

    date: edition.date.toISOString().slice(0, 10),

    status: edition.status,

    pageIds: edition.pageIds,

    articleIds: edition.articleIds,
  };
}

function toNewspaperPageRecord(
  page: {
    pageId: string;

    editionId: string;

    pageNumber: number;

    slots: PageSlot[];
  }
): NewspaperPage {

  return {

    pageId: page.pageId,

    editionId: page.editionId,

    pageNumber: page.pageNumber,

    slots: page.slots,
  };
}

function toArticleView(
  article: {
    articleId: string;

    title: string;

    url: string;

    source: string;

    summary?: string;

    publishedAt?: Date;

    discoveredAt: Date;

    category: string;

    status: ArticleView["status"];
  }
): ArticleView {

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
