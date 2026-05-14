/**
 * Structured error types for server actions and API routes.
 */

export class ActionError extends Error {
  constructor(
    message: string,
    public code: string = "UNKNOWN_ERROR"
  ) {
    super(message);
    this.name = "ActionError";
  }
}

export class UnauthorizedError extends ActionError {
  constructor(message = "Please sign in to continue.") {
    super(message, "UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
}

export class NotFoundError extends ActionError {
  constructor(message = "Resource not found.") {
    super(message, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export class ForbiddenError extends ActionError {
  constructor(message = "You do not have permission to perform this action.") {
    super(message, "FORBIDDEN");
    this.name = "ForbiddenError";
  }
}

export class ValidationError extends ActionError {
  constructor(message = "Invalid input.") {
    super(message, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}

export class RateLimitError extends ActionError {
  constructor(message = "Too many requests. Please slow down.") {
    super(message, "RATE_LIMITED");
    this.name = "RateLimitError";
  }
}

/**
 * Convert any error to a safe, user-friendly message.
 * Never leaks stack traces or internal details in production.
 */
export function toUserMessage(error: unknown): string {
  if (error instanceof ActionError) {
    return error.message;
  }

  if (error instanceof Error) {
    // In production, don't expose internal error messages
    if (process.env.NODE_ENV === "production") {
      return "Something went wrong. Please try again.";
    }
    return error.message;
  }

  return "An unexpected error occurred.";
}
