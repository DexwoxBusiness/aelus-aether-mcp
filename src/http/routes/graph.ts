/**
 * Graph Query Routes
 * Endpoints for code graph operations
 */

import type { Request, Response } from "express";
import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/error.js";
import { validateBody, validateQuery } from "../middleware/validation.js";
import { executeTool, parseToolResult } from "../utils/tool-executor.js";

const router = Router();

// Schemas
const ListEntitiesSchema = z.object({
  filePath: z.string().describe("Path to the file to list entities from"),
  entityTypes: z.array(z.string()).optional().describe("Types of entities to list"),
});

const ListRelationshipsSchema = z.object({
  entityId: z.string().optional().describe("Exact entity ID to find relationships for"),
  entityName: z.string().optional().describe("Name of the entity to find relationships for"),
  filePath: z.string().optional().describe("Optional file path hint to disambiguate entity"),
  depth: z.number().optional().default(1).describe("Depth of relationship traversal"),
  relationshipTypes: z.array(z.string()).optional().describe("Types of relationships to include"),
});

const QuerySchema = z.object({
  query: z.string().describe("Natural language or structured query"),
  limit: z.number().optional().default(10).describe("Maximum number of results"),
});

const GetGraphSchema = z.object({
  query: z.string().optional().describe("Optional search query"),
  limit: z.number().optional().default(100).describe("Maximum entities to return"),
});

const GetGraphHealthSchema = z.object({
  minEntities: z.number().optional().default(1).describe("Minimum entity count for healthy status"),
  minRelationships: z.number().optional().default(0).describe("Minimum relationship count"),
  sample: z.number().optional().default(1).describe("Sample size to fetch for verification"),
});

/**
 * POST /api/graph/entities/list
 * List entities in a file
 */
router.post(
  "/entities/list",
  validateBody(ListEntitiesSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const requestId = res.locals.requestId;
    const result = await executeTool("list_file_entities", req.body, requestId);
    const parsed = parseToolResult(result);

    res.json({
      success: true,
      data: parsed,
      meta: { requestId },
    });
  }),
);

/**
 * POST /api/graph/relationships/list
 * List entity relationships
 */
router.post(
  "/relationships/list",
  validateBody(ListRelationshipsSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const requestId = res.locals.requestId;
    const result = await executeTool("list_entity_relationships", req.body, requestId);
    const parsed = parseToolResult(result);

    res.json({
      success: true,
      data: parsed,
      meta: { requestId },
    });
  }),
);

/**
 * POST /api/graph/query
 * Query the code graph
 */
router.post(
  "/query",
  validateBody(QuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const requestId = res.locals.requestId;
    const result = await executeTool("query", req.body, requestId);
    const parsed = parseToolResult(result);

    res.json({
      success: true,
      data: parsed,
      meta: { requestId },
    });
  }),
);

/**
 * POST /api/graph/get
 * Get the code graph
 */
router.post(
  "/get",
  validateBody(GetGraphSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const requestId = res.locals.requestId;
    const result = await executeTool("get_graph", req.body, requestId);
    const parsed = parseToolResult(result);

    res.json({
      success: true,
      data: parsed,
      meta: { requestId },
    });
  }),
);

/**
 * GET /api/graph/stats
 * Get graph statistics
 */
router.get(
  "/stats",
  asyncHandler(async (_req: Request, res: Response) => {
    const requestId = res.locals.requestId;
    const result = await executeTool("get_graph_stats", {}, requestId);
    const parsed = parseToolResult(result);

    res.json({
      success: true,
      data: parsed,
      meta: { requestId },
    });
  }),
);

/**
 * GET /api/graph/health
 * Graph health check
 */
router.get(
  "/health",
  validateQuery(GetGraphHealthSchema.partial()),
  asyncHandler(async (req: Request, res: Response) => {
    const requestId = res.locals.requestId;
    const result = await executeTool("get_graph_health", req.query, requestId);
    const parsed = parseToolResult(result);

    res.json({
      success: true,
      data: parsed,
      meta: { requestId },
    });
  }),
);

/**
 * POST /api/graph/reset
 * Clear graph data
 */
router.post(
  "/reset",
  asyncHandler(async (_req: Request, res: Response) => {
    const requestId = res.locals.requestId;
    const result = await executeTool("reset_graph", {}, requestId);
    const parsed = parseToolResult(result);

    res.json({
      success: true,
      data: parsed,
      meta: { requestId },
    });
  }),
);

export default router;
