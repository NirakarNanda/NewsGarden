import type {
  NextFunction,
  Request,
  Response,
} from "express";

import { env } from "../config/env.js";

/*
 * Simple API-key guard.
 *
 * When API_KEY is set in the environment, the request must carry
 * a matching `x-api-key` header. When it is not set (local dev),
 * every request passes through.
 *
 * Applied to the mutating approval routes only; read-only GET
 * routes stay open so the campus UI works without a key.
 */
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {

  if (!env.apiKey) {

    next();

    return;
  }

  const provided = req.header("x-api-key");

  if (provided && provided === env.apiKey) {

    next();

    return;
  }

  res.status(401).json({
    success: false,
    message: "Unauthorized: missing or invalid API key",
  });
}
