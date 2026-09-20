import type { Request, Response } from "express";
import mongoose from "mongoose";

export function getHealth(
  _req: Request,
  res: Response
): void {
  const databaseConnected =
    mongoose.connection.readyState === 1;

  res.status(200).json({
    success: true,
    service: "NewsGarden Backend",
    status: databaseConnected ? "healthy" : "degraded",
    database: databaseConnected ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
}