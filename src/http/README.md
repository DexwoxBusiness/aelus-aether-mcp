# Code Graph RAG HTTP API

HTTP REST API server for Code Graph RAG, exposing all MCP tools as RESTful endpoints.

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.http.example .env.http
# Edit .env.http and set MCP_SERVER_DIR to your codebase path
```

### 3. Build and Start

```bash
# Build the project
npm run build

# Start HTTP server
MCP_SERVER_DIR=/path/to/codebase npm run http

# Or with environment file
export $(cat .env.http | xargs) && npm run http
```

### 4. Access API Documentation

Open your browser to:
- **API Docs**: http://localhost:3000/api-docs
- **Health Check**: http://localhost:3000/health
- **API Root**: http://localhost:3000/

## Architecture

```
src/http/
├── server.ts              # Main Express server
├── routes/
│   ├── index.ts           # Indexing endpoints
│   ├── semantic.ts        # Semantic search
│   ├── analysis.ts        # Code analysis
│   ├── graph.ts           # Graph queries
│   ├── agents.ts          # Agent metrics
│   └── lerna.ts           # Lerna workspace
├── middleware/
│   ├── cors.ts            # CORS configuration
│   ├── error.ts           # Error handling
│   ├── validation.ts      # Request validation
│   └── request-logger.ts  # Logging
├── utils/
│   └── tool-executor.ts   # Tool execution wrapper
├── types.ts               # TypeScript definitions
└── swagger.ts             # OpenAPI documentation
```

## API Endpoints

### Indexing

- `POST /api/index` - Index a codebase
- `POST /api/index/clean` - Reset and reindex

### Semantic Search

- `POST /api/semantic/search` - Semantic code search
- `POST /api/semantic/similar` - Find similar code
- `POST /api/semantic/cross-language` - Cross-language search
- `POST /api/semantic/related` - Find related concepts

### Code Analysis

- `POST /api/analysis/impact` - Analyze code impact
- `POST /api/analysis/clones` - Detect code clones
- `POST /api/analysis/jscpd-clones` - JSCPD clone detection
- `POST /api/analysis/refactoring` - Refactoring suggestions
- `POST /api/analysis/hotspots` - Find code hotspots

### Graph Operations

- `POST /api/graph/entities/list` - List file entities
- `POST /api/graph/relationships/list` - List relationships
- `POST /api/graph/query` - Query the graph
- `POST /api/graph/get` - Get graph data
- `GET /api/graph/stats` - Graph statistics
- `GET /api/graph/health` - Health check
- `POST /api/graph/reset` - Reset graph

### System

- `GET /api/agents/metrics` - Agent performance
- `GET /api/agents/system/metrics` - System metrics
- `GET /api/agents/system/version` - Version info
- `GET /api/agents/bus/stats` - Knowledge bus stats
- `POST /api/agents/bus/clear` - Clear bus topic

### Lerna

- `POST /api/lerna/graph` - Lerna project graph

## Usage Examples

### Index a Codebase

```bash
curl -X POST http://localhost:3000/api/index \
  -H "Content-Type: application/json" \
  -d '{
    "directory": "/path/to/codebase",
    "incremental": false
  }'
```

### Semantic Search

```bash
curl -X POST http://localhost:3000/api/semantic/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "authentication functions",
    "limit": 10
  }'
```

### Get Graph Stats

```bash
curl http://localhost:3000/api/graph/stats
```

### Analyze Code Impact

```bash
curl -X POST http://localhost:3000/api/analysis/impact \
  -H "Content-Type: application/json" \
  -d '{
    "entityId": "function:authenticateUser",
    "depth": 2
  }'
```

## Integration with n8n

The API is designed to work seamlessly with n8n workflows:

1. **HTTP Request Node**: Use the HTTP Request node to call any endpoint
2. **Authentication**: Currently no auth required (add if needed)
3. **Response Handling**: All responses follow the format:

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "requestId": "req_123",
    "duration": 125
  }
}
```

### Example n8n Workflow

```json
{
  "nodes": [
    {
      "name": "Index Codebase",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "http://localhost:3000/api/index",
        "method": "POST",
        "jsonParameters": true,
        "bodyParameters": {
          "directory": "/path/to/codebase"
        }
      }
    },
    {
      "name": "Search Code",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "http://localhost:3000/api/semantic/search",
        "method": "POST",
        "jsonParameters": true,
        "bodyParameters": {
          "query": "{{ $json.searchTerm }}",
          "limit": 5
        }
      }
    }
  ]
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `HOST` | Server host | 0.0.0.0 |
| `NODE_ENV` | Environment | development |
| `MCP_SERVER_DIR` | **Required**: Codebase directory | - |
| `CORS_ORIGINS` | Allowed CORS origins | * |

## Error Handling

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": {},
    "requestId": "req_123"
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR` - Invalid request parameters
- `NOT_FOUND` - Resource not found
- `AGENT_BUSY` - Agent unavailable
- `TOOL_EXECUTION_ERROR` - Tool execution failed

## Development

### Run in Development Mode

```bash
npm run http:dev
```

This enables:
- Auto-reload on file changes
- Detailed error messages
- Request/response logging

### Testing

```bash
# Test health endpoint
curl http://localhost:3000/health

# Test version endpoint
curl http://localhost:3000/api/agents/system/version

# View API documentation
open http://localhost:3000/api-docs
```

## Next Steps (Phase 2-4)

The current implementation (Phase 1) provides the HTTP layer. Future phases will add:

- **Phase 2**: Multi-repository support with `project_id`
- **Phase 3**: Voyage AI integration for better embeddings
- **Phase 4**: Re-ranker for improved search results

## Support

For issues or questions:
- GitHub: https://github.com/er77/code-graph-rag-mcp/issues
- Documentation: See `FEASIBILITY_REPORT.md`
