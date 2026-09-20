import {
  Article,
  type IArticle,
} from "../models/Article.js";

export interface ArticleFilter {
  category?: string;

  status?: string;

  source?: string;

  limit?: number;

  offset?: number;
}

export interface CreateArticleInput
  extends Pick<
    IArticle,
    | "articleId"
    | "title"
    | "url"
    | "source"
    | "category"
  > {

  summary?: string;

  publishedAt?: Date;

  discoveredAt: Date;

  status?: IArticle["status"];
}

export async function findArticleById(
  articleId: string
) {

  return Article.findOne({ articleId }).lean();
}

export async function listArticles(
  filter: ArticleFilter
) {

  const query: Record<string, unknown> = {};

  if (filter.category) {

    query.category = filter.category;
  }

  if (filter.status) {

    query.status = filter.status;
  }

  if (filter.source) {

    query.source = filter.source;
  }

  return Article.find(query)
    .sort({ discoveredAt: -1 })
    .skip(filter.offset ?? 0)
    .limit(filter.limit ?? 50)
    .lean();
}

// Batch lookup: one query for many ids, never N+1.
export async function findArticlesByIds(
  articleIds: string[]
) {

  if (articleIds.length === 0) {

    return [];
  }

  return Article.find({
    articleId: { $in: articleIds },
  }).lean();
}

export async function countArticles(
  filter: Omit<ArticleFilter, "limit" | "offset">
) {

  const query: Record<string, unknown> = {};

  if (filter.category) {

    query.category = filter.category;
  }

  if (filter.status) {

    query.status = filter.status;
  }

  if (filter.source) {

    query.source = filter.source;
  }

  return Article.countDocuments(query);
}

export async function createArticle(
  input: CreateArticleInput
) {

  return Article.create(input);
}

export async function updateArticleStatus(
  articleId: string,
  status: IArticle["status"]
) {

  return Article.findOneAndUpdate(
    { articleId },
    { status },
    { new: true }
  ).lean();
}
