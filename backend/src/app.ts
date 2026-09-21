import express from "express";
import cors from "cors";

import { env } from "./config/env.js";

import healthRoutes from "./routes/health.routes.js";
import agentRoutes from "./routes/agent.routes.js";
import articleRoutes from "./routes/article.routes.js";
import editionRoutes from "./routes/edition.routes.js";
import approvalRoutes from "./routes/approval.routes.js";
import activityRoutes from "./routes/activity.routes.js";
import eventsRoutes from "./routes/events.routes.js";

import { requestIdMiddleware } from "./middleware/requestId.middleware.js";
import { notFoundMiddleware } from "./middleware/notFound.middleware.js";
import { errorMiddleware } from "./middleware/error.middleware.js";

const app = express();

/*
 * --------------------------------------------------
 * GLOBAL MIDDLEWARE
 * --------------------------------------------------
 */

app.use(requestIdMiddleware);

const allowedOrigins = new Set(env.corsOrigins);

app.use(
  cors({
    // Reflect the request origin only when it is allowlisted.
    // Requests with no Origin (curl, server-to-server) pass through.
    // Never combine a wildcard origin with credentials.
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, origin ?? true);
      } else {
        callback(null, false);
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "x-api-key"],
    maxAge: 86400,
  })
);

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

/*
 * --------------------------------------------------
 * API ROUTES
 * --------------------------------------------------
 */

app.get("/", (_req, res) => {
  res.json({
    service: "NewsGarden Backend",
    version: "1.0.0",
    routes: [
      "GET /api/health",
      "GET /api/agents",
      "POST /api/agents/:agentId/run",
      "GET /api/agents/:agentId",
      "GET /api/articles",
      "GET /api/articles/:articleId",
      "GET /api/editions",
      "GET /api/editions/:editionId",
      "GET /api/editions/run",
      "POST /api/editions/run",
      "GET /api/events",
      "GET /api/activity",
      "GET /api/approval/pending",
      "POST /api/approval/:editionId/approve",
      "POST /api/approval/:editionId/revise",
      "POST /api/approval/:editionId/publish",
    ],
  });
});

app.use("/api/health", healthRoutes);

app.use("/api/agents", agentRoutes);

app.use("/api/articles", articleRoutes);

app.use("/api/editions", editionRoutes);

app.use("/api/approval", approvalRoutes);

app.use("/api/activity", activityRoutes);

app.use("/api/events", eventsRoutes);

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
