import { Router } from "express";

import {
  listEditions,
  getEdition,
} from "../controllers/edition.controller.js";

import {
  getRunState,
  runEdition,
} from "../controllers/editionRun.controller.js";

import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

// Registered before /:editionId so "run" is not
// captured as an edition id.
router.get("/run", getRunState);

router.post("/run", authMiddleware, runEdition);

router.get("/", listEditions);

router.get("/:editionId", getEdition);

export default router;
