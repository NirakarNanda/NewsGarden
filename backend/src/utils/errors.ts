export const ERROR_CODES = {

  BAD_REQUEST: "BAD_REQUEST",

  UNAUTHORIZED: "UNAUTHORIZED",

  FORBIDDEN: "FORBIDDEN",

  NOT_FOUND: "NOT_FOUND",

  CONFLICT: "CONFLICT",

  INTERNAL: "INTERNAL",
} as const;

export type ErrorCode =
  (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export class AppError extends Error {

  readonly statusCode: number;

  readonly code: ErrorCode;

  constructor(
    statusCode: number,
    code: ErrorCode,
    message: string
  ) {

    super(message);

    this.name = "AppError";

    this.statusCode = statusCode;

    this.code = code;
  }

  static badRequest(
    message: string
  ): AppError {

    return new AppError(
      400,
      ERROR_CODES.BAD_REQUEST,
      message
    );
  }

  static unauthorized(
    message = "Unauthorized"
  ): AppError {

    return new AppError(
      401,
      ERROR_CODES.UNAUTHORIZED,
      message
    );
  }

  static forbidden(
    message: string
  ): AppError {

    return new AppError(
      403,
      ERROR_CODES.FORBIDDEN,
      message
    );
  }

  static notFound(
    message: string
  ): AppError {

    return new AppError(
      404,
      ERROR_CODES.NOT_FOUND,
      message
    );
  }

  static conflict(
    message: string
  ): AppError {

    return new AppError(
      409,
      ERROR_CODES.CONFLICT,
      message
    );
  }
}

export interface ErrorResponseBody {
  success: false;

  error: string;
}

// Maps any thrown error to an HTTP status and a JSON body.
export function toErrorResponse(
  error: unknown
): {
  statusCode: number;

  body: ErrorResponseBody;
} {

  if (error instanceof AppError) {

    return {

      statusCode: error.statusCode,

      body: {

        success: false,

        error: error.message,
      },
    };
  }

  return {

    statusCode: 500,

    body: {

      success: false,

      error: "Internal server error",
    },
  };
}
