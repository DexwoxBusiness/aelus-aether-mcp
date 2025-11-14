/**
 * Agent & System Routes
 * Endpoints for agent metrics, bus stats, and version info
 */

import type { Request, Response } from "express";
import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/error.js";
import { validateBody } from "../middleware/validation.js";
import { executeTool, parseToolResult } from "../utils/tool-executor.js";

const router = Router();

// Schemas
const ClearBusTopicSchema = z.object({
  topic: z.string().min(1).describe("Exact knowledge bus topic to clear"),
});

/**
 * GET /api/agents/metrics
 * Get agent performance metrics
 */
router.get(
  "/metrics",
  asyncHandler(async (_req: Request, res: Response) => {
    const requestId = res.locals.requestId;
    const result = await executeTool("get_agent_metrics", {}, requestId);
    const parsed = parseToolResult(result);

    res.json({
      success: true,
      data: parsed,
      meta: { requestId },
    });
  }),
);

/**
 * GET /api/system/metrics
 * Get system metrics
 */
router.get(
  "/system/metrics",
  asyncHandler(async (_req: Request, res: Response) => {
    const requestId = res.locals.requestId;
    const result = await executeTool("get_metrics", {}, requestId);
    const parsed = parseToolResult(result);

    res.json({
      success: true,
      data: parsed,
      meta: { requestId },
    });
  }),
);

/**
 * GET /api/system/version
 * Get version information
 */
router.get(
  "/system/version",
  asyncHandler(async (_req: Request, res: Response) => {
    const requestId = res.locals.requestId;
    const result = await executeTool("get_version", {}, requestId);
    const parsed = parseToolResult(result);

    res.json({
      success: true,
      data: parsed,
      meta: { requestId },
    });
  }),
);

/**
 * GET /api/bus/stats
 * Get knowledge bus statistics
 */
router.get(
  "/bus/stats",
  asyncHandler(async (_req: Request, res: Response) => {
    const requestId = res.locals.requestId;
    const result = await executeTool("get_bus_stats", {}, requestId);
    const parsed = parseToolResult(result);

    res.json({
      success: true,
      data: parsed,
      meta: { requestId },
    });
  }),
);

/**
 * POST /api/bus/clear
 * Clear a knowledge bus topic
 */
router.post(
  "/bus/clear",
  validateBody(ClearBusTopicSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const requestId = res.locals.requestId;
    const result = await executeTool("clear_bus_topic", req.body, requestId);
    const parsed = parseToolResult(result);

    res.json({
      success: true,
      data: parsed,
      meta: { requestId },
    });
  }),
);

export default router;
