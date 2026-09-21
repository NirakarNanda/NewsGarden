import type {
  NextFunction,
  Request,
  Response,
} from "express";

import { getRequestId } from "./requestId.middleware.js";

export function errorMiddleware(
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error(error);

  res.status(500).json({
    success: false,
    error: "Internal Server Error",
    code: "INTERNAL_ERROR",
    path: `${req.method} ${req.originalUrl}`,
    requestId: getRequestId(req),
  });
}
