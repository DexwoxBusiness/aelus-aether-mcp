/**
 * CORS Middleware Configuration
 * Enables cross-origin requests for n8n and other clients
 */

import type { CorsOptions } from "cors";
import cors from "cors";

/**
 * Get CORS configuration based on environment
 */
export function getCorsOptions(): CorsOptions {
  const allowedOrigins = process.env.CORS_ORIGINS?.split(",") || ["*"];

  return {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin) {
        return callback(null, true);
      }

      // Allow all origins in development
      if (process.env.NODE_ENV === "development" || allowedOrigins.includes("*")) {
        return callback(null, true);
      }

      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
    exposedHeaders: ["X-Request-ID", "X-Response-Time"],
    maxAge: 86400, // 24 hours
  };
}

/**
 * Create CORS middleware
 */
export const corsMiddleware = cors(getCorsOptions());
