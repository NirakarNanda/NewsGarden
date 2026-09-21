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

import { mutationLimiter } from "../middleware/rateLimit.middleware.js";

import {
  editionListQuery,
  validateRequest,
} from "../middleware/validate.middleware.js";

const router = Router();

// Registered before /:editionId so "run" is not
// captured as an edition id.
router.get("/run", getRunState);

// A full edition build is expensive; keep the tighter budget here too.
router.post(
  "/run",
  authMiddleware,
  mutationLimiter,
  runEdition
);

router.get(
  "/",
  validateRequest({ query: editionListQuery }),
  listEditions
);

router.get("/:editionId", getEdition);

export default router;
