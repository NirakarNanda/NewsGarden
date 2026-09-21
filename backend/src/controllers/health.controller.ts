import type { Request, Response } from "express";
import mongoose from "mongoose";

import { getAIHealth } from "../services/aiHealth.service.js";

export function getHealth(
  _req: Request,
  res: Response
): void {
  const databaseConnected =
    mongoose.connection.readyState === 1;

  const ai = getAIHealth();

  res.status(200).json({
    success: true,
    service: "NewsGarden Backend",
    status: databaseConnected ? "healthy" : "degraded",
    database: databaseConnected ? "connected" : "disconnected",
    ai: ai ?? { provider: process.env.AI_PROVIDER ?? "ollama", reachable: null },
    timestamp: new Date().toISOString(),
  });
}