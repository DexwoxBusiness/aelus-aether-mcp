/**
 * Request Validation Middleware
 * Validates request payloads using Zod schemas
 */

import type { NextFunction, Request, Response } from "express";
import { ZodError, type ZodSchema } from "zod";
import { HttpError } from "./error.js";

/**
 * Validate request body against Zod schema
 */
export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(
          new HttpError(400, "Validation failed", "VALIDATION_ERROR", {
            errors: error.errors,
          }),
        );
      } else {
        next(error);
      }
    }
  };
}

/**
 * Validate request query parameters against Zod schema
 */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(
          new HttpError(400, "Query validation failed", "VALIDATION_ERROR", {
            errors: error.errors,
          }),
        );
      } else {
        next(error);
      }
    }
  };
}

/**
 * Validate request params against Zod schema
 */
export function validateParams(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(
          new HttpError(400, "Params validation failed", "VALIDATION_ERROR", {
            errors: error.errors,
          }),
        );
      } else {
        next(error);
      }
    }
  };
}
