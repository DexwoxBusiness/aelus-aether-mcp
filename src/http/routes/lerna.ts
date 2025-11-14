/**
 * Lerna Routes
 * Endpoints for Lerna workspace operations
 */

import type { Request, Response } from "express";
import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/error.js";
import { validateBody } from "../middleware/validation.js";
import { executeTool, parseToolResult } from "../utils/tool-executor.js";

const router = Router();

// Schemas
const LernaProjectGraphSchema = z.object({
  directory: z.string().optional().describe("Workspace directory"),
  ingest: z.boolean().optional().default(false).describe("Store in graph storage"),
  force: z.boolean().optional().default(false).describe("Bypass caches"),
});

/**
 * POST /api/lerna/graph
 * Generate Lerna project graph
 */
router.post(
  "/graph",
  validateBody(LernaProjectGraphSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const requestId = res.locals.requestId;
    const result = await executeTool("lerna_project_graph", req.body, requestId);
    const parsed = parseToolResult(result);

    res.json({
      success: true,
      data: parsed,
      meta: { requestId },
    });
  }),
);

export default router;
