import { logger } from "../utils/logger.js";

export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;

      // Logs the exact failing field(s) + received keys to the server
      // console/pino stream, so the cause is visible without needing
      // DevTools or curl — just check the terminal running the server.
      logger.warn(
        {
          path: req.originalUrl,
          receivedKeys: Object.keys(req.body ?? {}),
          fieldErrors,
        },
        "Request body failed validation",
      );

      return res.status(400).json({
        ok: false,
        error: "Validation failed",
        details: fieldErrors,
      });
    }

    req.body = result.data;
    next();
  };
}