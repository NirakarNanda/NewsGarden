import type {
  NextFunction,
  Request,
  Response,
} from "express";

import { z } from "zod";

import { AppError } from "../utils/errors.js";

/*
 * Zod request validation middleware.
 *
 * Pure gate: each supplied schema is parsed against the request
 * part. On failure the request is rejected with a structured 400
 * (via AppError -> errorMiddleware). On success the controllers
 * keep their existing parsing; this layer only rejects input that
 * is malformed or out of range.
 */

export interface RequestSchemas {
  query?: z.ZodTypeAny;

  body?: z.ZodTypeAny;

  params?: z.ZodTypeAny;
}

function paginationQuery(
  maxLimit: number
) {

  return z.object({

    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(maxLimit)
      .optional(),

    offset: z.coerce
      .number()
      .int()
      .min(0)
      .max(100000)
      .optional(),
  });
}

export const articleListQuery = paginationQuery(200).extend({

  category: z.string().max(100).optional(),

  status: z.string().max(50).optional(),

  source: z.string().max(200).optional(),
});

export const editionListQuery = paginationQuery(100);

export const activityListQuery = paginationQuery(200);

export const approvalDecisionBody = z
  .object({

    note: z
      .string()
      .trim()
      .max(2000)
      .optional(),

    decidedBy: z
      .string()
      .trim()
      .max(200)
      .optional(),
  })
  .optional();

export const agentRunBody = z
  .object({

    type: z.string().max(200).optional(),

    input: z.unknown().optional(),
  })
  .optional();

export function validateRequest(
  schemas: RequestSchemas
) {

  return (
    req: Request,
    _res: Response,
    next: NextFunction
  ): void => {

    try {

      if (schemas.query) {

        schemas.query.parse(req.query);
      }

      if (schemas.body) {

        schemas.body.parse(req.body);
      }

      if (schemas.params) {

        schemas.params.parse(req.params);
      }

      next();

    } catch (error) {

      if (error instanceof z.ZodError) {

        const details = error.issues
          .map(
            (issue) =>
              `${issue.path.join(".") || "value"}: ${issue.message}`
          )
          .join("; ");

        next(
          AppError.badRequest(
            `Invalid request: ${details}`
          )
        );

        return;
      }

      next(error);
    }
  };
}
