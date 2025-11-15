#!/usr/bin/env node

/**
 * HTTP+SSE MCP Server - Same tools as stdio server, but over HTTP for n8n
 *
 * This is a modified version of src/index.ts that uses SSE transport instead of stdio.
 * It exposes all 24 MCP tools over HTTP+SSE for n8n integration.
 *
 * Usage:
 *   MCP_SERVER_DIR=/path/to/code npm run mcp:sse
 *   MCP_SERVER_DIR=/path/to/code PORT=3000 node dist/http-mcp-server.js
 */

// IMPORTANT: This file will import and re-export the server from index.ts
// but change the transport from stdio to SSE

// Set environment variable to trigger SSE mode
process.env.MCP_TRANSPORT = "sse";

// Import the main server which will now use SSE transport
import("./index.js");
