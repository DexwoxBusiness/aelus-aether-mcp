/**
 * Indexing Routes
 * Endpoints for codebase indexing operations
 */

import type { Request, Response } from "express";
import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/error.js";
import { validateBody } from "../middleware/validation.js";
import { executeTool, parseToolResult } from "../utils/tool-executor.js";

const router = Router();

// Schemas
const IndexSchema = z.object({
  directory: z.string().optional().describe("Directory to index"),
  incremental: z.boolean().optional().default(false).describe("Perform incremental indexing"),
  reset: z.boolean().optional().default(false).describe("Clear existing graph before indexing"),
  excludePatterns: z.array(z.string()).optional().default([]),
  fullScan: z.boolean().optional().default(false),
});

const CleanIndexSchema = z.object({
  directory: z.string().optional().describe("Directory to index after reset"),
  excludePatterns: z.array(z.string()).optional().default([]),
  fullScan: z.boolean().optional().default(false),
});

/**
 * POST /api/index
 * Index a codebase
 *
 * @swagger
 * /api/index:
 *   post:
 *     summary: Index a codebase
 *     tags: [Indexing]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               directory:
 *                 type: string
 *                 description: Directory to index
 *               incremental:
 *                 type: boolean
 *                 default: false
 *               reset:
 *                 type: boolean
 *                 default: false
 *               excludePatterns:
 *                 type: array
 *                 items:
 *                   type: string
 *               fullScan:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       200:
 *         description: Indexing completed
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post(
  "/",
  validateBody(IndexSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const requestId = res.locals.requestId;
    const result = await executeTool("index", req.body, requestId);
    const parsed = parseToolResult(result);

    res.json({
      success: true,
      data: parsed,
      meta: { requestId },
    });
  }),
);

/**
 * POST /api/index/clean
 * Reset graph and reindex
 *
 * @swagger
 * /api/index/clean:
 *   post:
 *     summary: Reset graph and reindex
 *     tags: [Indexing]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               directory:
 *                 type: string
 *               excludePatterns:
 *                 type: array
 *                 items:
 *                   type: string
 *               fullScan:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Clean indexing completed
 */
router.post(
  "/clean",
  validateBody(CleanIndexSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const requestId = res.locals.requestId;
    const result = await executeTool("clean_index", req.body, requestId);
    const parsed = parseToolResult(result);

    res.json({
      success: true,
      data: parsed,
      meta: { requestId },
    });
  }),
);

export default router;
