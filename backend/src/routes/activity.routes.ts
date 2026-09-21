import { Router } from "express";
import { listActivities } from "../controllers/activity.controller.js";

import {
  activityListQuery,
  validateRequest,
} from "../middleware/validate.middleware.js";

const router = Router();

router.get(
  "/",
  validateRequest({ query: activityListQuery }),
  listActivities
);

export default router;
