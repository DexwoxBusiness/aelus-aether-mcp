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
 * Semantic code search with optional re-ranking (Phase 3 & 4)
 *
 * @swagger
 * /api/semantic/search:
 *   post:
 *     summary: Semantic code search
 *     description: Search code semantically using Voyage AI embeddings with optional two-stage retrieval using re-ranker
 *     tags: [Semantic]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *                 description: Natural language search query
 *                 example: "authentication middleware with JWT"
 *               limit:
 *                 type: integer
 *                 default: 10
 *                 description: Maximum results to return
 *                 example: 10
 *               useReranker:
 *                 type: boolean
 *                 default: false
 *                 description: Enable two-stage retrieval with re-ranking (Phase 4)
 *                 example: true
 *               rerankTopK:
 *                 type: integer
 *                 description: Number of candidates to re-rank (should be 2-3x limit)
 *                 example: 30
 *           examples:
 *             basic:
 *               summary: Basic semantic search
 *               value:
 *                 query: "error handling functions"
 *                 limit: 5
 *             with_reranking:
 *               summary: Search with re-ranking for best quality
 *               value:
 *                 query: "database connection pooling"
 *                 limit: 10
 *                 useReranker: true
 *                 rerankTopK: 30
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     results:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           score:
 *                             type: number
 *                           source:
 *                             type: string
 *                           content:
 *                             type: string
 *                           metadata:
 *                             type: object
 *                 meta:
 *                   type: object
 *       400:
 *         description: Validation error
 *       503:
 *         description: Semantic search not enabled
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
 * Find code similar to a given snippet
 *
 * @swagger
 * /api/semantic/similar:
 *   post:
 *     summary: Find similar code
 *     description: Find code similar to a given code snippet using embedding similarity
 *     tags: [Semantic]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 description: Code snippet to find similar code for
 *                 example: "function validateEmail(email) { return /^[^\\s@]+@/.test(email); }"
 *               threshold:
 *                 type: number
 *                 default: 0.5
 *                 minimum: 0
 *                 maximum: 1
 *                 description: Minimum similarity score (0-1)
 *                 example: 0.7
 *               limit:
 *                 type: integer
 *                 default: 10
 *                 description: Maximum results to return
 *                 example: 10
 *           examples:
 *             email_validation:
 *               summary: Find similar email validation code
 *               value:
 *                 code: "function validateEmail(email) { return /^[^\\s@]+@/.test(email); }"
 *                 threshold: 0.7
 *                 limit: 5
 *     responses:
 *       200:
 *         description: Similar code results
 *       400:
 *         description: Validation error
 *       503:
 *         description: Semantic search not enabled
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
