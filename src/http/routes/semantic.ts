/**
 * Semantic Search Routes
 * Endpoints for semantic code search operations
 */

import type { Request, Response } from "express";
import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/error.js";
import { validateBody } from "../middleware/validation.js";
import { executeTool, parseToolResult } from "../utils/tool-executor.js";

const router = Router();

// Schemas
const SemanticSearchSchema = z.object({
  query: z.string().describe("Natural language search query"),
  limit: z.number().optional().default(10).describe("Maximum results to return"),
});

const FindSimilarCodeSchema = z.object({
  code: z.string().describe("Code snippet to find similar code for"),
  threshold: z.number().optional().default(0.5).describe("Similarity threshold (0-1)"),
  limit: z.number().optional().default(10).describe("Maximum results to return"),
});

const CrossLanguageSearchSchema = z.object({
  query: z.string().describe("Search query"),
  languages: z.array(z.string()).optional().describe("Languages to search in"),
});

const FindRelatedConceptsSchema = z.object({
  entityId: z.string().describe("Entity to find related concepts for"),
  limit: z.number().optional().default(10).describe("Maximum results to return"),
});

/**
 * POST /api/semantic/search
 * Semantic code search
 */
router.post(
  "/search",
  validateBody(SemanticSearchSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const requestId = res.locals.requestId;
    const result = await executeTool("semantic_search", req.body, requestId);
    const parsed = parseToolResult(result);

    res.json({
      success: true,
      data: parsed,
      meta: { requestId },
    });
  }),
);

/**
 * POST /api/semantic/similar
 * Find similar code
 */
router.post(
  "/similar",
  validateBody(FindSimilarCodeSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const requestId = res.locals.requestId;
    const result = await executeTool("find_similar_code", req.body, requestId);
    const parsed = parseToolResult(result);

    res.json({
      success: true,
      data: parsed,
      meta: { requestId },
    });
  }),
);

/**
 * POST /api/semantic/cross-language
 * Cross-language search
 */
router.post(
  "/cross-language",
  validateBody(CrossLanguageSearchSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const requestId = res.locals.requestId;
    const result = await executeTool("cross_language_search", req.body, requestId);
    const parsed = parseToolResult(result);

    res.json({
      success: true,
      data: parsed,
      meta: { requestId },
    });
  }),
);

/**
 * POST /api/semantic/related
 * Find related concepts
 */
router.post(
  "/related",
  validateBody(FindRelatedConceptsSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const requestId = res.locals.requestId;
    const result = await executeTool("find_related_concepts", req.body, requestId);
    const parsed = parseToolResult(result);

    res.json({
      success: true,
      data: parsed,
      meta: { requestId },
    });
  }),
);

export default router;
