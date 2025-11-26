/**
 * Project Management Routes
 * Endpoints for managing multi-repository projects
 *
 * Phase 2: Multi-Repository Support
 */

import type { Request, Response } from "express";
import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/error.js";
import { validateBody, validateQuery } from "../middleware/validation.js";
import { executeTool, parseToolResult } from "../utils/tool-executor.js";

const router = Router();

// Schemas
const CreateProjectSchema = z.object({
  name: z.string().min(1).max(255).describe("Project name"),
  description: z.string().optional().describe("Project description"),
  metadata: z
    .object({
      owner: z.string().optional(),
      tags: z.array(z.string()).optional(),
      settings: z.record(z.unknown()).optional(),
    })
    .passthrough()
    .optional()
    .describe("Project metadata"),
});

const UpdateProjectSchema = z.object({
  name: z.string().min(1).max(255).optional().describe("Project name"),
  description: z.string().optional().describe("Project description"),
  metadata: z
    .object({
      owner: z.string().optional(),
      tags: z.array(z.string()).optional(),
      settings: z.record(z.unknown()).optional(),
    })
    .passthrough()
    .optional()
    .describe("Project metadata"),
});

const AddRepositorySchema = z.object({
  repository_path: z.string().min(1).describe("Absolute path to repository"),
  repository_name: z.string().optional().describe("Repository display name"),
  metadata: z
    .object({
      branch: z.string().optional(),
      commit: z.string().optional(),
    })
    .passthrough()
    .optional()
    .describe("Repository metadata"),
});

const ListProjectsQuerySchema = z.object({
  name: z.string().optional().describe("Filter by name (partial match)"),
  tag: z.string().optional().describe("Filter by tag"),
  limit: z.coerce.number().int().positive().max(1000).optional().default(100).describe("Maximum results"),
  offset: z.coerce.number().int().min(0).optional().default(0).describe("Offset for pagination"),
});

const CrossRepoSearchSchema = z.object({
  query: z.string().min(1).describe("Search query"),
  repositories: z.array(z.string()).optional().describe("Filter to specific repository paths"),
  file_types: z.array(z.string()).optional().describe("Filter by file extensions (e.g., ts, js)"),
  min_score: z.number().min(0).max(1).optional().describe("Minimum similarity score"),
  limit: z.number().int().positive().max(100).optional().default(10).describe("Maximum results"),
});

/**
 * POST /api/projects
 * Create a new project
 *
 * @swagger
 * /api/projects:
 *   post:
 *     summary: Create a new project
 *     tags: [Projects]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Project name
 *               description:
 *                 type: string
 *                 description: Project description
 *               metadata:
 *                 type: object
 *                 description: Additional metadata
 *     responses:
 *       201:
 *         description: Project created successfully
 *       400:
 *         description: Validation error
 */
router.post(
  "/",
  validateBody(CreateProjectSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const requestId = res.locals.requestId;

    // Call create_product MCP tool
    const result = await executeTool("create_product", req.body, requestId);
    const parsed = parseToolResult(result);

    res.status(201).json({
      success: true,
      data: parsed,
      meta: { requestId },
    });
  }),
);

/**
 * GET /api/projects
 * List all projects
 */
router.get(
  "/",
  validateQuery(ListProjectsQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const requestId = res.locals.requestId;

    // Call list_products MCP tool
    const result = await executeTool("list_products", {}, requestId);
    const parsed = parseToolResult(result) as any;

    res.json({
      success: true,
      data: parsed,
      meta: { requestId },
    });
  }),
);

/**
 * GET /api/projects/:id
 * Get project by ID
 */
router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const requestId = res.locals.requestId;
    const { id } = req.params;

    // TODO: Get ProjectManager instance and get project
    const project: any = null;

    if (!project) {
      return res.status(404).json({
        success: false,
        error: {
          message: `Project not found: ${id}`,
          code: "PROJECT_NOT_FOUND",
        },
        meta: { requestId },
      });
    }

    return res.json({
      success: true,
      data: project,
      meta: { requestId },
    });
  }),
);

/**
 * PATCH /api/projects/:id
 * Update project
 */
router.patch(
  "/:id",
  validateBody(UpdateProjectSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const requestId = res.locals.requestId;
    const { id } = req.params;

    // TODO: Get ProjectManager instance and update project
    const project: any = null;

    if (!project) {
      return res.status(404).json({
        success: false,
        error: {
          message: `Project not found: ${id}`,
          code: "PROJECT_NOT_FOUND",
        },
        meta: { requestId },
      });
    }

    return res.json({
      success: true,
      data: project,
      meta: { requestId },
    });
  }),
);

/**
 * DELETE /api/projects/:id
 * Delete project
 */
router.delete(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const requestId = res.locals.requestId;
    const { id } = req.params;

    // TODO: Get ProjectManager instance and delete project
    const deleted = false;

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: {
          message: `Project not found: ${id}`,
          code: "PROJECT_NOT_FOUND",
        },
        meta: { requestId },
      });
    }

    return res.json({
      success: true,
      data: { deleted: true },
      meta: { requestId },
    });
  }),
);

/**
 * GET /api/projects/:id/stats
 * Get project statistics
 */
router.get(
  "/:id/stats",
  asyncHandler(async (req: Request, res: Response) => {
    const requestId = res.locals.requestId;
    const { id } = req.params;

    // TODO: Get ProjectManager instance and get stats
    const stats: any = null;

    if (!stats) {
      return res.status(404).json({
        success: false,
        error: {
          message: `Project not found: ${id}`,
          code: "PROJECT_NOT_FOUND",
        },
        meta: { requestId },
      });
    }

    return res.json({
      success: true,
      data: stats,
      meta: { requestId },
    });
  }),
);

/**
 * POST /api/projects/:id/repositories
 * Add repository to project
 */
router.post(
  "/:id/repositories",
  validateBody(AddRepositorySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const requestId = res.locals.requestId;
    const { id } = req.params;

    // Call add_repository_to_product MCP tool
    const result = await executeTool(
      "add_repository_to_product",
      {
        product_id: id,
        repository_path: req.body.repository_path,
        repository_name: req.body.repository_name,
        metadata: req.body.metadata,
      },
      requestId,
    );
    const parsed = parseToolResult(result);

    res.status(201).json({
      success: true,
      data: parsed,
      meta: { requestId },
    });
  }),
);

/**
 * GET /api/projects/:id/repositories
 * List repositories in project
 */
router.get(
  "/:id/repositories",
  asyncHandler(async (_req: Request, res: Response) => {
    const requestId = res.locals.requestId;

    // TODO: Get ProjectManager instance and list repositories
    const repositories: any[] = [];

    res.json({
      success: true,
      data: {
        repositories,
        total: repositories.length,
      },
      meta: { requestId },
    });
  }),
);

/**
 * DELETE /api/projects/:projectId/repositories/:repositoryId
 * Remove repository from project
 */
router.delete(
  "/:projectId/repositories/:repositoryId",
  asyncHandler(async (req: Request, res: Response) => {
    const requestId = res.locals.requestId;
    const { repositoryId } = req.params;

    // TODO: Get ProjectManager instance and remove repository
    const deleted = false;

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: {
          message: `Repository not found: ${repositoryId}`,
          code: "REPOSITORY_NOT_FOUND",
        },
        meta: { requestId },
      });
    }

    return res.json({
      success: true,
      data: { deleted: true },
      meta: { requestId },
    });
  }),
);

/**
 * POST /api/projects/:id/search
 * Search across all repositories in a project
 */
router.post(
  "/:id/search",
  validateBody(CrossRepoSearchSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const requestId = res.locals.requestId;
    const { id } = req.params;

    // TODO: Get ProjectManager instance and search across repos
    const results: any[] = [];

    res.json({
      success: true,
      data: {
        results,
        total: results.length,
        project_id: id,
        query: req.body.query,
      },
      meta: { requestId },
    });
  }),
);

export default router;
