import type { Request, Response } from "express";

import {
  listArticlesService,
  getArticle as getArticleService,
} from "../services/article.service.js";

import {
  isNonEmptyString,
  parsePositiveInt,
} from "../utils/validation.js";

import {
  AppError,
  toErrorResponse,
} from "../utils/errors.js";

import { logger } from "../utils/logger.js";

function getOptionalQueryString(
  value: unknown
): string | undefined {

  return isNonEmptyString(value)
    ? value.trim()
    : undefined;
}

export async function listArticles(
  req: Request,
  res: Response
): Promise<void> {

  try {

    const articles = await listArticlesService({
      category: getOptionalQueryString(req.query.category),

      status: getOptionalQueryString(req.query.status),

      source: getOptionalQueryString(req.query.source),

      limit: parsePositiveInt(req.query.limit, 50, 200),

      offset: parsePositiveInt(req.query.offset, 0, 100000),
    });

    res.status(200).json({
      success: true,
      data: articles,
    });

  } catch (error) {

    logger.error("listArticles failed", error);

    const { statusCode, body } = toErrorResponse(error);

    res.status(statusCode).json(body);
  }
}

export async function getArticle(
  req: Request,
  res: Response
): Promise<void> {

  try {

    const articleId = req.params.articleId;

    if (!isNonEmptyString(articleId)) {

      throw AppError.badRequest("Missing article id");
    }

    const article = await getArticleService(articleId);

    res.status(200).json({
      success: true,
      data: article,
    });

  } catch (error) {

    logger.error("getArticle failed", error);

    const { statusCode, body } = toErrorResponse(error);

    res.status(statusCode).json(body);
  }
}
