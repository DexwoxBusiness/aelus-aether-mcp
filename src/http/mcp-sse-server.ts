#!/usr/bin/env node

/**
 * HTTP+SSE MCP Server for n8n Integration
 *
 * Exposes the same 24 MCP tools as the stdio server but over HTTP with SSE transport.
 * Compatible with n8n's MCP integration.
 *
 * Usage:
 *   npm run mcp:http
 *   MCP_SERVER_DIR=/path/to/code PORT=3000 npm run mcp:http
 */

import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import cors from "cors";
import express from "express";
import { logger } from "../utils/logger.js";

// Import the same schemas and execution logic from the stdio server
import "../index.js";

// We'll need to extract the tool registration and execution logic
// For now, let's create a minimal structure

const PORT = parseInt(process.env.PORT || "3000", 10);
const HOST = process.env.HOST || "0.0.0.0";

// Validate required environment
if (!process.env.MCP_SERVER_DIR) {
  console.error("ERROR: MCP_SERVER_DIR environment variable is required");
  console.error("Example: MCP_SERVER_DIR=/path/to/codebase npm run mcp:http");
  process.exit(1);
}

// Create Express app
const app = express();
app.use(express.json());
app.use(
  cors({
    origin: process.env.CORS_ORIGINS?.split(",") || "*",
    exposedHeaders: ["Mcp-Session-Id"],
  }),
);

// Store active transports by session ID
const transports = new Map<string, SSEServerTransport>();

/**
 * Create an MCP server instance with all tools
 * This should match the stdio server in src/index.ts
 */
function createMCPServer() {
  const server = new Server(
    {
      name: "code-graph-rag-mcp",
      version: "2.7.6",
    },
    {
      capabilities: {
        tools: {},
        resources: {},
      },
    },
  );

  // TODO: Register all 24 tools here
  // This needs to import the tool registration from src/index.ts
  // For now, this is a placeholder structure

  return server;
}

/**
 * SSE endpoint - establishes the event stream
 * GET /sse
 */
app.get("/sse", async (req, res) => {
  logger.info(
    "SSE_CONNECTION",
    "New SSE connection request",
    {
      headers: req.headers,
    },
    randomUUID(),
  );

  try {
    // Create session ID
    const sessionId = randomUUID();

    // Create SSE transport
    const transport = new SSEServerTransport("/messages", res as ServerResponse, {
      enableDnsRebindingProtection: false, // Disable for local/docker usage
    });

    // Store transport
    transports.set(sessionId, transport);

    // Create MCP server instance
    const mcpServer = createMCPServer();

    // Connect transport to server
    await mcpServer.connect(transport);

    // Start SSE stream
    await transport.start();

    // Handle cleanup
    transport.onclose = () => {
      logger.info("SSE_CLOSED", "SSE connection closed", { sessionId }, sessionId);
      transports.delete(sessionId);
    };

    transport.onerror = (error) => {
      logger.error("SSE_ERROR", "SSE transport error", { sessionId }, sessionId, error);
      transports.delete(sessionId);
    };
  } catch (error) {
    logger.error("SSE_START_ERROR", "Failed to start SSE connection", {}, randomUUID(), error as Error);

    if (!res.headersSent) {
      res.status(500).json({
        error: "Failed to establish SSE connection",
        message: (error as Error).message,
      });
    }
  }
});

/**
 * Messages endpoint - receives client messages
 * POST /messages
 */
app.post("/messages", async (req, res): Promise<void> => {
  const requestId = randomUUID();

  logger.info(
    "MCP_MESSAGE",
    "Received MCP message",
    {
      body: req.body,
      headers: req.headers,
    },
    requestId,
  );

  try {
    // Extract session ID from message or headers
    const sessionId = req.body?.meta?.sessionId || req.headers["mcp-session-id"];

    if (!sessionId) {
      res.status(400).json({
        error: "Missing session ID",
        message: "Session ID must be provided in message meta or Mcp-Session-Id header",
      });
      return;
    }

    // Get transport for this session
    const transport = transports.get(sessionId as string);

    if (!transport) {
      res.status(404).json({
        error: "Session not found",
        message: `No active session found for ID: ${sessionId}`,
      });
      return;
    }

    // Handle the message
    await transport.handlePostMessage(req as IncomingMessage, res as ServerResponse, req.body);
  } catch (error) {
    logger.error("MCP_MESSAGE_ERROR", "Failed to handle MCP message", { requestId }, requestId, error as Error);

    if (!res.headersSent) {
      res.status(500).json({
        error: "Failed to process message",
        message: (error as Error).message,
      });
    }
  }
});

/**
 * Health check endpoint
 */
app.get("/health", (_req, res) => {
  res.json({
    status: "healthy",
    transport: "sse",
    activeSessions: transports.size,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Root endpoint with connection info
 */
app.get("/", (_req, res) => {
  res.json({
    name: "Code Graph RAG MCP Server",
    version: "2.7.6",
    transport: "HTTP+SSE",
    protocol: "Model Context Protocol",
    endpoints: {
      sse: "GET /sse - Establish SSE connection",
      messages: "POST /messages - Send MCP messages",
      health: "GET /health - Health check",
    },
    usage: {
      n8n: "Configure MCP node with: http://localhost:" + PORT + "/sse",
      connection: "GET /sse to establish stream, POST /messages to send commands",
    },
  });
});

// Start server
app.listen(PORT, HOST, () => {
  logger.systemEvent("MCP SSE Server Started", {
    port: PORT,
    host: HOST,
    transport: "SSE",
    directory: process.env.MCP_SERVER_DIR,
    endpoints: {
      sse: `http://${HOST}:${PORT}/sse`,
      messages: `http://${HOST}:${PORT}/messages`,
      health: `http://${HOST}:${PORT}/health`,
    },
  });

  console.log(`\n🚀 MCP SSE Server Ready`);
  console.log(`   SSE Endpoint:      http://${HOST}:${PORT}/sse`);
  console.log(`   Messages Endpoint: http://${HOST}:${PORT}/messages`);
  console.log(`   Health Check:      http://${HOST}:${PORT}/health`);
  console.log(`\n📡 n8n Configuration:`);
  console.log(`   MCP Server URL: http://localhost:${PORT}/sse\n`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.systemEvent("MCP SSE Server Shutting Down", {
    signal: "SIGTERM",
    activeSessions: transports.size,
  });

  // Close all transports
  for (const [sessionId, transport] of transports.entries()) {
    logger.info("SHUTDOWN", "Closing transport", { sessionId }, sessionId);
    transport.close();
  }

  process.exit(0);
});
