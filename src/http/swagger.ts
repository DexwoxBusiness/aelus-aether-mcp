/**
 * Swagger/OpenAPI Documentation Setup
 * Auto-generated API documentation
 */

import type { Options } from "swagger-jsdoc";
import swaggerJsdoc from "swagger-jsdoc";

/**
 * Swagger definition
 */
const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Code Graph RAG API",
    version: "1.0.0",
    description:
      "HTTP API for Code Graph RAG - Multi-agent code analysis with semantic search, graph queries, and AI-powered insights",
    license: {
      name: "MIT",
      url: "https://opensource.org/licenses/MIT",
    },
    contact: {
      name: "API Support",
      url: "https://github.com/er77/code-graph-rag-mcp",
    },
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Development server",
    },
    {
      url: "http://localhost:{port}",
      description: "Custom port",
      variables: {
        port: {
          default: "3000",
          description: "Server port",
        },
      },
    },
  ],
  tags: [
    {
      name: "Projects",
      description: "Multi-repository project management (Phase 2)",
    },
    {
      name: "Indexing",
      description: "Codebase indexing operations",
    },
    {
      name: "Semantic",
      description: "Semantic search with Voyage AI embeddings (Phase 3) and re-ranker (Phase 4)",
    },
    {
      name: "Analysis",
      description: "Code analysis (impact, clones, refactoring, hotspots)",
    },
    {
      name: "Graph",
      description: "Code graph queries and operations",
    },
    {
      name: "Agents",
      description: "Agent metrics and system information",
    },
    {
      name: "Lerna",
      description: "Lerna workspace operations",
    },
  ],
  components: {
    schemas: {
      Error: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: false,
          },
          error: {
            type: "object",
            properties: {
              message: {
                type: "string",
                example: "An error occurred",
              },
              code: {
                type: "string",
                example: "ERROR_CODE",
              },
              details: {
                type: "object",
                description: "Additional error details",
              },
              requestId: {
                type: "string",
                example: "req_123456",
              },
            },
          },
        },
      },
      Success: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: true,
          },
          data: {
            type: "object",
            description: "Response data",
          },
          meta: {
            type: "object",
            properties: {
              requestId: {
                type: "string",
                example: "req_123456",
              },
              duration: {
                type: "number",
                example: 125,
                description: "Request duration in milliseconds",
              },
            },
          },
        },
      },
    },
    responses: {
      BadRequest: {
        description: "Bad Request - Validation error",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/Error",
            },
          },
        },
      },
      NotFound: {
        description: "Not Found",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/Error",
            },
          },
        },
      },
      ServerError: {
        description: "Internal Server Error",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/Error",
            },
          },
        },
      },
    },
  },
};

/**
 * Swagger options
 */
const swaggerOptions: Options = {
  definition: swaggerDefinition,
  apis: ["./src/http/routes/*.ts", "./dist/http/routes/*.js"],
};

/**
 * Generate Swagger specification
 */
export const swaggerSpec = swaggerJsdoc(swaggerOptions);

/**
 * Swagger UI options
 */
export const swaggerUiOptions = {
  customCss: ".swagger-ui .topbar { display: none }",
  customSiteTitle: "Code Graph RAG API",
  customfavIcon: "/favicon.ico",
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: "none",
    filter: true,
    showExtensions: true,
    tryItOutEnabled: true,
  },
};
