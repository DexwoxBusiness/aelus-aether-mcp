/**
 * HTTP Server Type Definitions
 * Shared types for request/response handling
 */

import type { Request } from "express";

/**
 * Extended Express Request with custom locals
 */
export interface ApiRequest extends Request {
  locals: {
    requestId: string;
    startTime: number;
  };
}

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: unknown;
  };
  meta?: {
    requestId?: string;
    duration?: number;
    [key: string]: unknown;
  };
}

/**
 * Tool execution result from MCP layer
 */
export interface ToolExecutionResult {
  content: Array<{
    type: string;
    text: string;
  }>;
}
