import express from "express";
import cors from "cors";

import { env } from "./config/env.js";

import healthRoutes from "./routes/health.routes.js";
import agentRoutes from "./routes/agent.routes.js";
import articleRoutes from "./routes/article.routes.js";
import editionRoutes from "./routes/edition.routes.js";
import approvalRoutes from "./routes/approval.routes.js";
import activityRoutes from "./routes/activity.routes.js";

import { notFoundMiddleware } from "./middleware/notFound.middleware.js";
import { errorMiddleware } from "./middleware/error.middleware.js";

const app = express();

/*
 * --------------------------------------------------
 * GLOBAL MIDDLEWARE
 * --------------------------------------------------
 */

app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
  })
);

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

/*
 * --------------------------------------------------
 * API ROUTES
 * --------------------------------------------------
 */

app.use("/api/health", healthRoutes);

app.use("/api/agents", agentRoutes);

app.use("/api/articles", articleRoutes);

app.use("/api/editions", editionRoutes);

app.use("/api/approval", approvalRoutes);

app.use("/api/activity", activityRoutes);

/*
 * --------------------------------------------------
 * 404
 * --------------------------------------------------
 */

app.use(notFoundMiddleware);

/*
 * --------------------------------------------------
 * ERROR HANDLER
 * --------------------------------------------------
 */

app.use(errorMiddleware);

export default app;