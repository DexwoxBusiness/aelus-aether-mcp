/**
 * Request Logging Middleware
 * Logs HTTP requests and responses
 */

import type { NextFunction, Request, Response } from "express";
import { createRequestId, logger } from "../../utils/logger.js";

/**
 * Request logging middleware
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const requestId = (req.headers["x-request-id"] as string) || createRequestId();
  const startTime = Date.now();

  // Store request ID for later use
  res.locals.requestId = requestId;

  // Set response headers
  res.setHeader("X-Request-ID", requestId);

  // Log request
  logger.info(
    "HTTP_REQUEST",
    `${req.method} ${req.path}`,
    {
      method: req.method,
      path: req.path,
      query: req.query,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    },
    requestId,
  );

  // Log response when finished
  res.on("finish", () => {
    const duration = Date.now() - startTime;

    logger.info(
      "HTTP_RESPONSE",
      `${req.method} ${req.path} - ${res.statusCode}`,
      {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
      },
      requestId,
    );
  });

  next();
}
