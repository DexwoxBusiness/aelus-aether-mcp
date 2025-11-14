/**
 * Error Handling Middleware
 * Centralized error handling for HTTP server
 */

import type { NextFunction, Request, Response } from "express";
import { AgentBusyError } from "../../types/errors.js";
import { logger } from "../../utils/logger.js";

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
}

/**
 * HTTP Error class with status code
 */
export class HttpError extends Error implements ApiError {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

/**
 * Error response formatter
 */
function formatErrorResponse(error: ApiError, requestId?: string) {
  const errorResponse: Record<string, any> = {
    success: false,
    error: {
      message: error.message,
      code: error.code || error.name,
    },
  };

  if (error.details !== undefined) {
    errorResponse.error.details = error.details;
  }

  if (requestId) {
    errorResponse.error.requestId = requestId;
  }

  return errorResponse;
}

/**
 * Error handling middleware
 */
export function errorHandler(err: ApiError, req: Request, res: Response, _next: NextFunction) {
  const requestId = res.locals.requestId || (req.headers["x-request-id"] as string);

  // Log error
  logger.error(
    "HTTP_ERROR",
    err.message,
    {
      path: req.path,
      method: req.method,
      statusCode: err.statusCode,
      code: err.code,
    },
    requestId,
    err,
  );

  // Handle specific error types
  if (err instanceof AgentBusyError) {
    const agentError: ApiError = Object.assign(new Error(err.message), {
      statusCode: 503,
      code: "AGENT_BUSY",
      details: err.details,
    });
    return res.status(503).json(formatErrorResponse(agentError, requestId));
  }

  if (err instanceof HttpError) {
    return res.status(err.statusCode).json(formatErrorResponse(err, requestId));
  }

  // Validation errors
  if (err.name === "ValidationError") {
    const validationError: ApiError = Object.assign(new Error(err.message), {
      statusCode: 400,
      code: "VALIDATION_ERROR",
      details: err.details,
    });
    return res.status(400).json(formatErrorResponse(validationError, requestId));
  }

  // Zod validation errors
  if (err.name === "ZodError") {
    return res.status(400).json({
      success: false,
      error: {
        message: "Validation failed",
        code: "VALIDATION_ERROR",
        details: (err as any).errors,
        requestId,
      },
    });
  }

  // Default to 500 for unknown errors
  const statusCode = err.statusCode || 500;
  const defaultError: ApiError = Object.assign(new Error(statusCode === 500 ? "Internal server error" : err.message), {
    statusCode,
    code: err.code,
    details: err.details,
  });
  return res.status(statusCode).json(formatErrorResponse(defaultError, requestId));
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: {
      message: `Route not found: ${req.method} ${req.path}`,
      code: "NOT_FOUND",
    },
  });
}

/**
 * Async handler wrapper to catch promise rejections
 */
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
