import { Router } from "express";

import {
  listEditions,
  getEdition,
  deleteEdition,
} from "../controllers/edition.controller.js";

import {
  getRunState,
  runEdition,
} from "../controllers/editionRun.controller.js";

import {
  approvePage,
  compileNewspaper,
} from "../controllers/newspaper.controller.js";

import { authMiddleware } from "../middleware/auth.middleware.js";

import { mutationLimiter } from "../middleware/rateLimit.middleware.js";

import {
  editionListQuery,
  editionRunBody,
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
  validateRequest({ body: editionRunBody }),
  runEdition
);

router.get(
  "/",
  validateRequest({ query: editionListQuery }),
  listEditions
);

router.get("/:editionId", getEdition);

router.delete(
  "/:editionId",
  authMiddleware,
  mutationLimiter,
  deleteEdition
);

// Per-page human approval: the user approves each page on the
// edition view; the compiler only assembles fully-approved editions.
router.post(
  "/:editionId/pages/:pageNumber/approve",
  authMiddleware,
  mutationLimiter,
  approvePage
);

// Assemble the whole newspaper from the approved pages.
router.post(
  "/:editionId/compile",
  authMiddleware,
  mutationLimiter,
  compileNewspaper
);

export default router;
