import { Router } from "express";
import { listActivities } from "../controllers/activity.controller.js";

const router = Router();

router.get("/", listActivities);

export default router;
