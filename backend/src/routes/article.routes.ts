import { Router } from "express";

import {
  listArticles,
  getArticle,
} from "../controllers/article.controller.js";

import {
  articleListQuery,
  validateRequest,
} from "../middleware/validate.middleware.js";

const router = Router();

router.get(
  "/",
  validateRequest({ query: articleListQuery }),
  listArticles
);

router.get("/:articleId", getArticle);

export default router;
