import { Router } from "express";

import {
  listAgentsController,
  getAgent,
  runAgent,
} from "../controllers/agent.controller.js";

import {
  agentRunBody,
  validateRequest,
} from "../middleware/validate.middleware.js";

const router = Router();

router.get("/", listAgentsController);

router.post(
  "/:agentId/run",
  validateRequest({ body: agentRunBody }),
  runAgent
);

router.get("/:agentId", getAgent);

export default router;
