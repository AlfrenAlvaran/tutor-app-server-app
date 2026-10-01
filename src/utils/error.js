export class AppError extends Error {
  constructor(message, statusCode = 500, details = undefined) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404);
    this.name = "NotFoundError";
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad request", details = undefined) {
    super(message, 400, details);
    this.name = "BadRequestError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, 403);
    this.name = "ForbiddenError";
  }
}

export function handleError(err, req, res, next) {
  // Known application errors (AppError and its subclasses)
  if (err instanceof AppError) {
    const response = {
      error: err.name,
      message: err.message,
    };

    if (err.details !== undefined) {
      response.details = err.details;
    }

    return res.status(err.statusCode).json(response);
  }

  // Fallback for unexpected/unknown errors
  console.error("Unhandled error:", err);

  return res.status(500).json({
    error: "InternalServerError",
    message: "An unexpected error occurred",
  });
}