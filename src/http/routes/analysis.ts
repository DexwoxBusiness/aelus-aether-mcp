/**
 * Code Analysis Routes
 * Endpoints for code analysis operations (impact, clones, refactoring, hotspots)
 */

import type { Request, Response } from "express";
import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/error.js";
import { validateBody } from "../middleware/validation.js";
import { executeTool, parseToolResult } from "../utils/tool-executor.js";

const router = Router();

// Schemas
const AnalyzeCodeImpactSchema = z.object({
  entityId: z.string().describe("Entity ID or name to analyze impact for"),
  filePath: z.string().optional().describe("Optional file path hint to disambiguate entity"),
  depth: z.number().optional().default(2).describe("Depth of impact analysis"),
});

const DetectCodeClonesSchema = z.object({
  minSimilarity: z.number().optional().default(0.8).describe("Minimum similarity for clones"),
  scope: z.string().optional().default("all").describe("Scope: all, file, or module"),
});

const JscpdCloneDetectionSchema = z.object({
  paths: z.array(z.string()).optional().describe("Directories or files to scan"),
  pattern: z.string().optional().describe("Glob pattern to apply"),
  ignore: z.array(z.string()).optional().describe("Glob patterns to exclude"),
  formats: z.array(z.string()).optional().describe("File extensions to include"),
  minLines: z.number().int().min(1).optional().describe("Minimum lines per clone block"),
  maxLines: z.number().int().min(1).optional().describe("Maximum lines per clone block"),
  minTokens: z.number().int().min(1).optional().describe("Minimum tokens per clone"),
  ignoreCase: z.boolean().optional().describe("Lowercase tokens before comparison"),
});

const SuggestRefactoringSchema = z.object({
  filePath: z.string().describe("File to analyze for refactoring"),
  focusArea: z.string().optional().describe("Specific entity name to focus on"),
  entityId: z.string().optional().describe("Exact entity ID to analyze"),
  startLine: z.number().int().min(1).optional().describe("1-based start line"),
  endLine: z.number().int().min(1).optional().describe("1-based end line (exclusive)"),
});

const AnalyzeHotspotsSchema = z.object({
  metric: z.string().optional().default("complexity").describe("Metric: complexity, changes, or coupling"),
  limit: z.number().optional().default(10).describe("Maximum hotspots to return"),
});

/**
 * POST /api/analysis/impact
 * Analyze code impact
 */
router.post(
  "/impact",
  validateBody(AnalyzeCodeImpactSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const requestId = res.locals.requestId;
    const result = await executeTool("analyze_code_impact", req.body, requestId);
    const parsed = parseToolResult(result);

    res.json({
      success: true,
      data: parsed,
      meta: { requestId },
    });
  }),
);

/**
 * POST /api/analysis/clones
 * Detect code clones
 */
router.post(
  "/clones",
  validateBody(DetectCodeClonesSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const requestId = res.locals.requestId;
    const result = await executeTool("detect_code_clones", req.body, requestId);
    const parsed = parseToolResult(result);

    res.json({
      success: true,
      data: parsed,
      meta: { requestId },
    });
  }),
);

/**
 * POST /api/analysis/jscpd-clones
 * JSCPD clone detection
 */
router.post(
  "/jscpd-clones",
  validateBody(JscpdCloneDetectionSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const requestId = res.locals.requestId;
    const result = await executeTool("jscpd_detect_clones", req.body, requestId);
    const parsed = parseToolResult(result);

    res.json({
      success: true,
      data: parsed,
      meta: { requestId },
    });
  }),
);

/**
 * POST /api/analysis/refactoring
 * Get refactoring suggestions
 */
router.post(
  "/refactoring",
  validateBody(SuggestRefactoringSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const requestId = res.locals.requestId;
    const result = await executeTool("suggest_refactoring", req.body, requestId);
    const parsed = parseToolResult(result);

    res.json({
      success: true,
      data: parsed,
      meta: { requestId },
    });
  }),
);

/**
 * POST /api/analysis/hotspots
 * Find code hotspots
 */
router.post(
  "/hotspots",
  validateBody(AnalyzeHotspotsSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const requestId = res.locals.requestId;
    const result = await executeTool("analyze_hotspots", req.body, requestId);
    const parsed = parseToolResult(result);

    res.json({
      success: true,
      data: parsed,
      meta: { requestId },
    });
  }),
);

export default router;
