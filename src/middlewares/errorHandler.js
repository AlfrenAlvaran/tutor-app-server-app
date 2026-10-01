import { logger } from "../utils/logger.js";

export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode ?? err.status ?? 500;
  const message = statusCode < 500 ? err.message : "Internal server error";

  logger.error({ err }, "Request failed");
  res.status(statusCode).json({ ok: false, err: message });
}