import type {
  NextFunction,
  Request,
  Response,
} from "express";

import { randomUUID } from "node:crypto";

export interface RequestWithId extends Request {
  requestId: string;
}

/*
 * Assigns a request id, exposes it as the x-request-id response
 * header, and logs one line per request when it finishes:
 * method, path, status, duration.
 */
export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const requestId = randomUUID();

  (req as RequestWithId).requestId = requestId;

  res.setHeader("x-request-id", requestId);

  const startedAt = Date.now();

  res.on("finish", () => {
    const ms = Date.now() - startedAt;

    console.log(
      `[${req.method}] ${req.originalUrl} -> ${res.statusCode} (${ms}ms) [${requestId}]`
    );
  });

  next();
}

export function getRequestId(req: Request): string {
  return (req as RequestWithId).requestId ?? "unknown";
}
