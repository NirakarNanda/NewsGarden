import { Router } from "express";

import {
  approveEdition,
  getPendingApprovals,
  reviseEdition,
  publishEdition,
} from "../controllers/approval.controller.js";

import { authMiddleware } from "../middleware/auth.middleware.js";

import { mutationLimiter } from "../middleware/rateLimit.middleware.js";

import {
  approvalDecisionBody,
  validateRequest,
} from "../middleware/validate.middleware.js";

const router = Router();

// Editions waiting for a human decision (used by the approval panel).
router.get("/pending", getPendingApprovals);

// Human approval actions are guarded by the API key.
router.post(
  "/:editionId/approve",
  authMiddleware,
  mutationLimiter,
  validateRequest({ body: approvalDecisionBody }),
  approveEdition
);

router.post(
  "/:editionId/revise",
  authMiddleware,
  mutationLimiter,
  validateRequest({ body: approvalDecisionBody }),
  reviseEdition
);

// Publishing additionally requires an approved approval record;
// the service enforces this even for authenticated callers.
router.post(
  "/:editionId/publish",
  authMiddleware,
  mutationLimiter,
  publishEdition
);

export default router;
