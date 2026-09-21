import type { Request, Response } from "express";

import { getRequestId } from "./requestId.middleware.js";

export function notFoundMiddleware(
  req: Request,
  res: Response
): void {
  res.status(404).json({
    success: false,
    error: "Not Found",
    code: "ROUTE_NOT_FOUND",
    path: `${req.method} ${req.originalUrl}`,
    requestId: getRequestId(req),
  });
}
