import { Router } from "express";

import {
  approveEdition,
  getPendingApprovals,
  reviseEdition,
  publishEdition,
} from "../controllers/approval.controller.js";

import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

// Editions waiting for a human decision (used by the approval panel).
router.get("/pending", getPendingApprovals);

// Human approval actions are guarded by the API key.
router.post("/:editionId/approve", authMiddleware, approveEdition);

router.post("/:editionId/revise", authMiddleware, reviseEdition);

// Publishing additionally requires an approved approval record;
// the service enforces this even for authenticated callers.
router.post("/:editionId/publish", authMiddleware, publishEdition);

export default router;
