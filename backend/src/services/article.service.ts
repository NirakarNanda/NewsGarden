import {
  findArticleById,
  listArticles,
} from "../repositories/article.repository.js";

import { AppError } from "../utils/errors.js";

import type {
  ArticleView,
} from "../types/article.js";

export interface ListArticlesInput {
  category?: string;

  status?: string;

  source?: string;

  limit?: number;

  offset?: number;
}

export async function listArticlesService(
  input: ListArticlesInput
): Promise<ArticleView[]> {

  const articles = await listArticles({
    category: input.category,

    status: input.status,

    source: input.source,

    limit: input.limit,

    offset: input.offset,
  });

  return articles.map(toArticleView);
}

export async function getArticle(
  articleId: string
): Promise<ArticleView> {

  const article = await findArticleById(articleId);

  if (!article) {

    throw AppError.notFound(
      `Article not found: ${articleId}`
    );
  }

  return toArticleView(article);
}

function toArticleView(
  article: {
    articleId: string;

    title: string;

    url: string;

    source: string;

    summary?: string;

    headline?: string;

    body?: string;

    imageUrl?: string;

    // Attribution for web-sourced images.
    imageCredit?: string;

    imageSourceUrl?: string;

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

    headline: article.headline,

    body: article.body,

    imageUrl: article.imageUrl,

    imageCredit: article.imageCredit,

    imageSourceUrl: article.imageSourceUrl,

    publishedAt: article.publishedAt?.toISOString(),

    discoveredAt: article.discoveredAt.toISOString(),

    category: article.category,

    status: article.status,
  };
}
