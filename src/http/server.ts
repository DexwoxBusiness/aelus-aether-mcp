#!/usr/bin/env node

/**
 * HTTP Server for Code Graph RAG
 * Exposes all MCP tools as REST API endpoints
 *
 * Usage:
 *   npm run http              # Start HTTP server
 *   npm run http:dev          # Start with auto-reload
 *
 * Environment Variables:
 *   PORT              - Server port (default: 3000)
 *   CORS_ORIGINS      - Allowed CORS origins, comma-separated (default: *)
 *   NODE_ENV          - Environment: development, production, test
 *   MCP_SERVER_DIR    - Directory to index (required)
 */

import type { Express } from "express";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { logger } from "../utils/logger.js";
import { corsMiddleware } from "./middleware/cors.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import { requestLogger } from "./middleware/request-logger.js";
import agentsRoutes from "./routes/agents.js";
import analysisRoutes from "./routes/analysis.js";
import graphRoutes from "./routes/graph.js";
// Import route modules
import indexRoutes from "./routes/index.js";
import lernaRoutes from "./routes/lerna.js";
import projectsRoutes from "./routes/projects.js";
import semanticRoutes from "./routes/semantic.js";
import { swaggerSpec, swaggerUiOptions } from "./swagger.js";

/**
 * Create and configure Express application
 */
function createApp(): Express {
  const app = express();

  // ===== Middleware =====
  // Request parsing
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // CORS
  app.use(corsMiddleware);

  // Request logging
  app.use(requestLogger);

  // ===== API Documentation =====
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

  // Swagger JSON endpoint
  app.get("/api-docs.json", (_req, res) => {
    res.json(swaggerSpec);
  });

  // ===== Health Check =====
  app.get("/health", (_req, res) => {
    res.json({
      success: true,
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // Root endpoint
  app.get("/", (_req, res) => {
    res.json({
      name: "Code Graph RAG API",
      version: "1.0.0",
      description: "HTTP API for code analysis with semantic search and graph queries",
      documentation: "/api-docs",
      health: "/health",
      endpoints: {
        projects: [
          "POST   /api/projects",
          "GET    /api/projects",
          "GET    /api/projects/:id",
          "PATCH  /api/projects/:id",
          "DELETE /api/projects/:id",
          "GET    /api/projects/:id/stats",
          "POST   /api/projects/:id/repositories",
          "GET    /api/projects/:id/repositories",
          "DELETE /api/projects/:projectId/repositories/:repositoryId",
          "POST   /api/projects/:id/search",
        ],
        indexing: ["POST /api/index", "POST /api/index/clean"],
        semantic: [
          "POST /api/semantic/search",
          "POST /api/semantic/similar",
          "POST /api/semantic/cross-language",
          "POST /api/semantic/related",
        ],
        analysis: [
          "POST /api/analysis/impact",
          "POST /api/analysis/clones",
          "POST /api/analysis/jscpd-clones",
          "POST /api/analysis/refactoring",
          "POST /api/analysis/hotspots",
        ],
        graph: [
          "POST /api/graph/entities/list",
          "POST /api/graph/relationships/list",
          "POST /api/graph/query",
          "POST /api/graph/get",
          "GET  /api/graph/stats",
          "GET  /api/graph/health",
          "POST /api/graph/reset",
        ],
        system: [
          "GET  /api/agents/metrics",
          "GET  /api/agents/system/metrics",
          "GET  /api/agents/system/version",
          "GET  /api/agents/bus/stats",
          "POST /api/agents/bus/clear",
        ],
        lerna: ["POST /api/lerna/graph"],
      },
    });
  });

  // ===== API Routes =====
  app.use("/api/index", indexRoutes);
  app.use("/api/semantic", semanticRoutes);
  app.use("/api/analysis", analysisRoutes);
  app.use("/api/graph", graphRoutes);
  app.use("/api/agents", agentsRoutes);
  app.use("/api/lerna", lernaRoutes);
  app.use("/api/projects", projectsRoutes);

  // ===== Error Handling =====
  // 404 handler
  app.use(notFoundHandler);

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
}

/**
 * Start HTTP server
 */
async function startServer() {
  const port = parseInt(process.env.PORT || "3000", 10);
  const host = process.env.HOST || "0.0.0.0";

  // Validate required environment variables
  if (!process.env.MCP_SERVER_DIR) {
    console.error("ERROR: MCP_SERVER_DIR environment variable is required");
    console.error("Example: MCP_SERVER_DIR=/path/to/codebase npm run http");
    process.exit(1);
  }

  // Create Express app
  const app = createApp();

  // Start server
  const server = app.listen(port, host, () => {
    logger.systemEvent("HTTP Server Started", {
      port,
      host,
      environment: process.env.NODE_ENV || "development",
      directory: process.env.MCP_SERVER_DIR,
    });

    console.log("\n" + "=".repeat(60));
    console.log("🚀 Code Graph RAG HTTP Server");
    console.log("=".repeat(60));
    console.log(`📍 Server:        http://${host}:${port}`);
    console.log(`📚 API Docs:      http://${host}:${port}/api-docs`);
    console.log(`❤️  Health Check:  http://${host}:${port}/health`);
    console.log(`📂 Directory:     ${process.env.MCP_SERVER_DIR}`);
    console.log(`🌍 Environment:   ${process.env.NODE_ENV || "development"}`);
    console.log("=".repeat(60) + "\n");

    if (process.env.NODE_ENV === "development") {
      console.log("💡 Quick Start:");
      console.log(`   curl http://localhost:${port}/health`);
      console.log(`   curl http://localhost:${port}/api/graph/stats\n`);
    }
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log("\n📴 Shutting down HTTP server...");
    logger.systemEvent("HTTP Server Shutdown Initiated");

    server.close(() => {
      logger.systemEvent("HTTP Server Shutdown Complete");
      console.log("✅ Server closed gracefully");
      process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
      console.error("⚠️  Forced shutdown after timeout");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  // Error handlers
  process.on("uncaughtException", (error) => {
    logger.critical("Uncaught Exception", error.message, undefined, undefined, error);
    console.error("💥 Uncaught Exception:", error);
    process.exit(1);
  });

  process.on("unhandledRejection", (reason, promise) => {
    logger.critical("Unhandled Rejection", String(reason));
    console.error("💥 Unhandled Rejection at:", promise, "reason:", reason);
    process.exit(1);
  });
}

// Start server if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer().catch((error) => {
    console.error("Failed to start server:", error);
    process.exit(1);
  });
}

export { createApp, startServer };
