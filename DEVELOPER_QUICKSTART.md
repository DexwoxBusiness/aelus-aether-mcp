# Developer Quickstart Guide

Get up and running with the Aelus Aether MCP HTTP API in 5 minutes.

## Prerequisites

- Node.js 20+ installed
- A codebase to analyze
- (Optional) Voyage AI API key for semantic search

## Quick Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy the example environment file:

```bash
cp .env.http.example .env.http
```

Edit `.env.http` with your settings:

```bash
# Minimum configuration
PORT=3000
MCP_SERVER_DIR=/path/to/your/codebase

# For semantic search (Phase 3 & 4)
MCP_EMBEDDING_ENABLED=true
MCP_EMBEDDING_PROVIDER=voyage
VOYAGE_API_KEY=your-voyage-api-key-here

# For re-ranking (Phase 4)
MCP_RERANKER_ENABLED=true
MCP_RERANKER_MODEL=rerank-2
MCP_SEMANTIC_USE_RERANKER=true
```

### 3. Start the Server

```bash
npm run http
```

The server will start on `http://localhost:3000`

### 4. Verify Installation

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": 1699564800000
}
```

## 5-Minute Tutorial

### Example 1: Search Your Code

**Semantic Search (with re-ranking for best results):**

```bash
curl -X POST http://localhost:3000/api/semantic/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "error handling functions",
    "limit": 5,
    "useReranker": true,
    "rerankTopK": 15
  }'
```

**Basic Graph Query:**

```bash
curl -X POST http://localhost:3000/api/graph/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "all classes",
    "limit": 10
  }'
```

### Example 2: Get Code Statistics

```bash
curl http://localhost:3000/api/graph/stats
```

Response shows entity counts, relationships, and file statistics.

### Example 3: Find Similar Code

```bash
curl -X POST http://localhost:3000/api/semantic/similar \
  -H "Content-Type: application/json" \
  -d '{
    "code": "function validateEmail(email) { return /^[^\\s@]+@/.test(email); }",
    "threshold": 0.7,
    "limit": 5
  }'
```

### Example 4: Analyze Code Impact

```bash
curl -X POST http://localhost:3000/api/analysis/impact \
  -H "Content-Type: application/json" \
  -d '{
    "entityId": "UserService",
    "depth": 2
  }'
```

### Example 5: Multi-Repository Setup (Phase 2)

**Create a project:**

```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Microservices",
    "description": "E-commerce platform"
  }'
```

**Add repositories:**

```bash
curl -X POST http://localhost:3000/api/projects/proj_abc123/repositories \
  -H "Content-Type: application/json" \
  -d '{
    "repository_path": "/path/to/backend-api",
    "repository_name": "Backend API"
  }'
```

**Search across all repositories:**

```bash
curl -X POST http://localhost:3000/api/projects/proj_abc123/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "authentication logic",
    "limit": 10
  }'
```

## Common Use Cases

### Use Case 1: Code Review Assistant

Find all functions that might be affected by a change:

```bash
curl -X POST http://localhost:3000/api/analysis/impact \
  -H "Content-Type: application/json" \
  -d '{
    "entityId": "DatabaseConnection",
    "depth": 3
  }'
```

### Use Case 2: Find Duplicate Code

Detect code clones to identify refactoring opportunities:

```bash
curl -X POST http://localhost:3000/api/analysis/jscpd-clones \
  -H "Content-Type: application/json" \
  -d '{
    "paths": ["/src"],
    "minLines": 5,
    "formats": ["typescript", "javascript"]
  }'
```

### Use Case 3: Code Quality Monitoring

Identify complex code that needs attention:

```bash
curl -X POST http://localhost:3000/api/analysis/hotspots \
  -H "Content-Type: application/json" \
  -d '{
    "metric": "complexity",
    "limit": 10
  }'
```

### Use Case 4: Documentation Generation

Get entity details to generate documentation:

```bash
curl -X POST http://localhost:3000/api/graph/entities/list \
  -H "Content-Type: application/json" \
  -d '{
    "filePath": "/src/services/user-service.ts"
  }'
```

## API Documentation

### Full Documentation

- **API Reference**: See [API_REFERENCE.md](./API_REFERENCE.md) for complete endpoint documentation
- **n8n Integration**: See [N8N_INTEGRATION_GUIDE.md](./N8N_INTEGRATION_GUIDE.md) for workflow automation
- **Swagger UI**: Visit `http://localhost:3000/api-docs` when server is running

### Quick Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/semantic/search` | POST | Semantic code search with optional re-ranking |
| `/api/semantic/similar` | POST | Find similar code snippets |
| `/api/graph/query` | POST | Query code graph |
| `/api/graph/stats` | GET | Get graph statistics |
| `/api/analysis/impact` | POST | Analyze code impact |
| `/api/analysis/clones` | POST | Detect code clones |
| `/api/analysis/hotspots` | POST | Find code hotspots |
| `/api/projects` | POST | Create multi-repo project |
| `/api/projects/:id/search` | POST | Cross-repository search |

## Configuration Guide

### Environment Variables

#### Server Configuration

```bash
PORT=3000                    # Server port
HOST=0.0.0.0                # Bind address
NODE_ENV=development         # Environment
CORS_ORIGINS=*              # CORS origins
```

#### Codebase Configuration

```bash
MCP_SERVER_DIR=/path/to/code   # Directory to index
MCP_DB_PATH=./data/graph.db    # Database location
```

#### Semantic Search (Phase 3)

```bash
MCP_EMBEDDING_ENABLED=true
MCP_EMBEDDING_PROVIDER=voyage
VOYAGE_API_KEY=your-key
VOYAGE_BASE_URL=https://api.voyageai.com
VOYAGE_CONCURRENCY=4
VOYAGE_MAX_BATCH_SIZE=128
VOYAGE_INPUT_TYPE=document
```

#### Re-ranker (Phase 4)

```bash
MCP_RERANKER_ENABLED=true
MCP_RERANKER_MODEL=rerank-2           # Options: rerank-2, rerank-2-lite
MCP_RERANKER_DEFAULT_TOP_K=20
MCP_SEMANTIC_USE_RERANKER=true        # Enable globally for semantic search
```

### Model Selection

#### Embedding Models (Phase 3)

- **voyage-code-3** (default): 1024 dimensions, best for code
- **voyage-3**: General-purpose, 1024 dimensions
- **voyage-3-lite**: Faster, lower cost

#### Re-ranker Models (Phase 4)

- **rerank-2** (recommended): Latest, best quality
- **rerank-2-lite**: Faster, more cost-effective
- **rerank-1**: Legacy full model
- **rerank-lite-1**: Legacy lite model

## Performance Tuning

### For Best Quality

Enable re-ranking and use larger candidate pools:

```bash
# In .env.http
MCP_SEMANTIC_USE_RERANKER=true
MCP_RERANKER_MODEL=rerank-2
MCP_RERANKER_DEFAULT_TOP_K=30

# In API calls
{
  "query": "your query",
  "limit": 10,
  "useReranker": true,
  "rerankTopK": 30  // 3x limit
}
```

### For Best Speed

Disable re-ranking or use lite model:

```bash
# Option 1: Disable re-ranking
MCP_SEMANTIC_USE_RERANKER=false

# Option 2: Use lite model
MCP_RERANKER_MODEL=rerank-2-lite
MCP_RERANKER_DEFAULT_TOP_K=15
```

### For Balanced Performance

```bash
MCP_SEMANTIC_USE_RERANKER=true
MCP_RERANKER_MODEL=rerank-2-lite
MCP_RERANKER_DEFAULT_TOP_K=20  // 2x limit
```

**Performance Comparison:**

| Configuration | Quality | Speed | Use Case |
|--------------|---------|-------|----------|
| No reranker | Good | Fast (100-300ms) | High-frequency searches |
| rerank-2-lite | Better | Medium (300-500ms) | Balanced workloads |
| rerank-2 | Best | Slower (400-600ms) | Critical searches |

## Testing Your Setup

### Health Check

```bash
curl http://localhost:3000/health
```

### Graph Health

```bash
curl "http://localhost:3000/api/graph/health?minEntities=1"
```

### System Info

```bash
curl http://localhost:3000/api/system/version
```

### Test Semantic Search

```bash
# Should return results if semantic search is enabled
curl -X POST http://localhost:3000/api/semantic/search \
  -H "Content-Type: application/json" \
  -d '{"query": "main function", "limit": 1}'
```

## Troubleshooting

### Server Won't Start

**Check port availability:**
```bash
lsof -i :3000
```

**Solution:** Change `PORT` in `.env.http` or kill the process using port 3000.

### "Semantic search is not enabled"

**Cause:** Missing Voyage AI configuration.

**Solution:** Add to `.env.http`:
```bash
MCP_EMBEDDING_ENABLED=true
MCP_EMBEDDING_PROVIDER=voyage
VOYAGE_API_KEY=your-key-here
```

### "Re-ranker not enabled"

**Cause:** Re-ranker configuration missing.

**Solution:** Add to `.env.http`:
```bash
MCP_RERANKER_ENABLED=true
VOYAGE_API_KEY=your-key-here
```

### Empty Search Results

**Possible causes:**
1. Codebase not indexed yet (wait 30-60 seconds after startup)
2. Query too specific
3. Semantic search not enabled

**Solution:** Check graph stats:
```bash
curl http://localhost:3000/api/graph/stats
```

If `totalEntities` is 0, the codebase hasn't been indexed yet.

### Slow Performance

**Common causes:**
1. Large codebase (>10k entities)
2. Re-ranker enabled with high `rerankTopK`
3. Deep relationship traversal

**Solutions:**
- Reduce `limit` parameter
- Use `rerank-2-lite` instead of `rerank-2`
- Lower `rerankTopK` to 2x limit
- Reduce `depth` in impact analysis

### Authentication Errors with Voyage AI

**Error:** `401 Unauthorized`

**Solution:** Verify API key:
```bash
echo $VOYAGE_API_KEY
```

Get a key at: https://www.voyageai.com/

## Next Steps

1. **Explore the API**: Try different endpoints with the examples above
2. **Read Full Docs**: Check [API_REFERENCE.md](./API_REFERENCE.md) for all endpoints
3. **Automate with n8n**: See [N8N_INTEGRATION_GUIDE.md](./N8N_INTEGRATION_GUIDE.md)
4. **Build Integrations**: Use the HTTP API from your tools (CI/CD, IDEs, etc.)
5. **Monitor Performance**: Use `/api/agents/metrics` and `/api/system/metrics`

## Example Integrations

### GitHub Actions

```yaml
name: Code Analysis
on: [pull_request]
jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Analyze Impact
        run: |
          curl -X POST ${{ secrets.MCP_API_URL }}/api/analysis/impact \
            -H "Content-Type: application/json" \
            -d '{"entityId": "${{ github.event.pull_request.title }}", "depth": 2}'
```

### VS Code Extension

```typescript
import axios from 'axios';

async function searchCode(query: string) {
  const response = await axios.post('http://localhost:3000/api/semantic/search', {
    query,
    limit: 10,
    useReranker: true,
    rerankTopK: 30
  });
  return response.data.data.results;
}
```

### CLI Tool

```bash
#!/bin/bash
# search-code.sh

QUERY="$1"
LIMIT="${2:-10}"

curl -X POST http://localhost:3000/api/semantic/search \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"$QUERY\", \"limit\": $LIMIT, \"useReranker\": true}" \
  | jq '.data.results[] | {name: .metadata.name, file: .metadata.filePath, score: .score}'
```

Usage:
```bash
./search-code.sh "authentication" 5
```

## Resources

- **Repository**: https://github.com/your-org/aelus-aether-mcp
- **Issues**: Report bugs and request features
- **Voyage AI Docs**: https://docs.voyageai.com/
- **API Reference**: [API_REFERENCE.md](./API_REFERENCE.md)
- **n8n Workflows**: [N8N_INTEGRATION_GUIDE.md](./N8N_INTEGRATION_GUIDE.md)

## Support

Having issues? Check:

1. Server logs: Look for errors in console output
2. Health endpoint: `GET /health`
3. Graph health: `GET /api/graph/health`
4. System metrics: `GET /api/system/metrics`

## License

See LICENSE file for details.
