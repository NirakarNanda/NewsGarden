import express from "express";
import cors from "cors";

import { env } from "./config/env.js";

import healthRoutes from "./routes/health.routes.js";

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