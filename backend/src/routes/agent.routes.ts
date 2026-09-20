import { Router } from "express";

import {
  listAgentsController,
  getAgent,
  runAgent,
} from "../controllers/agent.controller.js";

const router = Router();

router.get("/", listAgentsController);

router.post("/:agentId/run", runAgent);

router.get("/:agentId", getAgent);

export default router;
