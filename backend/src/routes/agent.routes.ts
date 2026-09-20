import { Router } from "express";

import {
  listAgentsController,
  getAgent,
} from "../controllers/agent.controller.js";

const router = Router();

router.get("/", listAgentsController);

router.get("/:agentId", getAgent);

export default router;
