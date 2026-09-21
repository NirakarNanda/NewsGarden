import type {
  NextFunction,
  Request,
  Response,
} from "express";

import { getRequestId } from "./requestId.middleware.js";

import {
  AppError,
  toErrorResponse,
} from "../utils/errors.js";

export function errorMiddleware(
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {

  const { statusCode, body } =
    toErrorResponse(error);

  // Client errors are routine; only server errors get logged.
  if (statusCode >= 500) {

    console.error(error);
  }

  res.status(statusCode).json({
    ...body,
    code:
      error instanceof AppError
        ? error.code
        : "INTERNAL_ERROR",
    path: `${req.method} ${req.originalUrl}`,
    requestId: getRequestId(req),
  });
}
