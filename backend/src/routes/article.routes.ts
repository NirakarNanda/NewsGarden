import { Router } from "express";

import {
  listArticles,
  getArticle,
} from "../controllers/article.controller.js";

const router = Router();

router.get("/", listArticles);

router.get("/:articleId", getArticle);

export default router;
