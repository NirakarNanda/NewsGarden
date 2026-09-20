import { Router } from "express";

import {
  listEditions,
  getEdition,
} from "../controllers/edition.controller.js";

const router = Router();

router.get("/", listEditions);

router.get("/:editionId", getEdition);

export default router;
