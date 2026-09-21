import { rateLimit } from "express-rate-limit";

/*
 * Rate limiters.
 *
 * - apiLimiter: generous global budget for the campus UI's
 *   polling and SSE reconnections.
 * - mutationLimiter: tighter budget for expensive or sensitive
 *   mutations (approval decisions, edition runs).
 */

function limitedMessage(error: string) {

  return {
    success: false,
    error,
    code: "RATE_LIMITED",
  };
}

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: limitedMessage(
    "Too many requests, please slow down."
  ),
});

export const mutationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: limitedMessage(
    "Too many attempts, please slow down."
  ),
});
