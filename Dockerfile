# Multi-stage Dockerfile for Aelus Aether MCP HTTP Server
# Optimized for production deployment with n8n

# Stage 1: Build
FROM node:24-alpine AS builder

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    sqlite-dev \
    git

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY tsup.config.ts ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY src ./src
COPY examples ./examples
COPY tests ./tests

# Build TypeScript
RUN npm run build

# Prune dev dependencies
RUN npm prune --production

# Stage 2: Production Runtime
FROM node:24-alpine

# Install runtime dependencies
RUN apk add --no-cache \
    sqlite \
    sqlite-dev \
    curl \
    ca-certificates

# Create non-root user for security
RUN addgroup -g 1001 -S mcpuser && \
    adduser -u 1001 -S mcpuser -G mcpuser

WORKDIR /app

# Copy built artifacts from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Copy documentation
COPY README.md ./
COPY API_REFERENCE.md ./
COPY DEVELOPER_QUICKSTART.md ./
COPY N8N_INTEGRATION_GUIDE.md ./
COPY HTTP_API_README.md ./

# Create directories for data persistence
RUN mkdir -p /app/data /app/repos && \
    chown -R mcpuser:mcpuser /app

# Switch to non-root user
USER mcpuser

# Expose HTTP port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Set default environment variables
ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0 \
    MCP_TRANSPORT=sse \
    MCP_DB_PATH=/app/data/graph.db \
    MCP_SERVER_DIR=/app/repos

# Start MCP server with SSE transport (for n8n)
CMD ["node", "dist/index.js"]
