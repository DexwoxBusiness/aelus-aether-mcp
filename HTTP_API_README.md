# Aelus Aether MCP - HTTP REST API Documentation

Complete documentation for the HTTP REST API, including developer guides, API reference, and n8n integration workflows.

## 📚 Documentation Index

### Getting Started

1. **[Developer Quickstart Guide](./DEVELOPER_QUICKSTART.md)** ⚡
   - Get started in 5 minutes
   - Basic configuration
   - Quick examples
   - Common use cases
   - Troubleshooting

### API Documentation

2. **[Complete API Reference](./API_REFERENCE.md)** 📖
   - All endpoints with detailed descriptions
   - Request/response examples
   - Error codes
   - Performance guidelines
   - Best practices

3. **[Swagger UI](http://localhost:3000/api-docs)** 🔍
   - Interactive API documentation
   - Try endpoints in your browser
   - Live request/response testing
   - Available when server is running

### Integration Guides

4. **[n8n Integration Guide](./N8N_INTEGRATION_GUIDE.md)** 🔗
   - Workflow automation with n8n
   - 5 common workflow patterns
   - Example configurations
   - Troubleshooting

### Phase Documentation

5. **[Phase 4: Re-ranker](./PHASE4_RERANKER.md)** 🎯
   - Voyage AI re-ranker implementation
   - Two-stage retrieval
   - Benchmarks and performance
   - Configuration guide

6. **[Feasibility Report](./FEASIBILITY_REPORT.md)** 📊
   - All phase documentation
   - Architecture overview
   - Technology choices

---

## 🚀 Quick Start

### 1. Install & Configure

```bash
# Install dependencies
npm install

# Configure environment
cp .env.http.example .env.http
# Edit .env.http with your settings

# Start server
npm run http
```

### 2. Test Your Setup

```bash
# Health check
curl http://localhost:3000/health

# Basic search
curl -X POST http://localhost:3000/api/semantic/search \
  -H "Content-Type: application/json" \
  -d '{"query": "error handling", "limit": 5}'
```

### 3. Explore Documentation

- Visit: http://localhost:3000/api-docs (Swagger UI)
- Read: [DEVELOPER_QUICKSTART.md](./DEVELOPER_QUICKSTART.md)
- Learn: [API_REFERENCE.md](./API_REFERENCE.md)

---

## 📋 Feature Overview

### Phase 1: HTTP REST API
- RESTful endpoints for all MCP tools
- Structured error handling
- Request ID tracking
- CORS support
- Swagger/OpenAPI documentation

### Phase 2: Multi-Repository Support
- Project management
- Repository grouping
- Cross-repository search
- Project statistics

### Phase 3: Voyage AI Embeddings
- Semantic code search
- 1024-dimensional embeddings
- `voyage-code-3` model
- Cross-language search
- Find similar code

### Phase 4: Voyage AI Re-ranker (NEW! ✨)
- Two-stage retrieval
- Improved search quality
- 4 reranker models (rerank-2, rerank-2-lite, rerank-1, rerank-lite-1)
- Quality/speed tradeoff options
- Benchmarks: +26% MRR@10, +24% NDCG@10, +36% Precision@3

---

## 🔍 API Endpoints Overview

### Semantic Search (Phase 3 & 4)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/semantic/search` | POST | Semantic code search with optional re-ranking |
| `/api/semantic/similar` | POST | Find similar code snippets |
| `/api/semantic/cross-language` | POST | Search across programming languages |
| `/api/semantic/related` | POST | Find related concepts |

### Projects (Phase 2)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/projects` | GET/POST | List or create projects |
| `/api/projects/:id` | GET/PATCH/DELETE | Manage project |
| `/api/projects/:id/repositories` | GET/POST | Manage repositories |
| `/api/projects/:id/search` | POST | Cross-repository search |
| `/api/projects/:id/stats` | GET | Project statistics |

### Graph Operations

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/graph/entities/list` | POST | List entities in file |
| `/api/graph/relationships/list` | POST | List entity relationships |
| `/api/graph/query` | POST | Query code graph |
| `/api/graph/stats` | GET | Graph statistics |
| `/api/graph/health` | GET | Health check |

### Code Analysis

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analysis/impact` | POST | Analyze code impact |
| `/api/analysis/clones` | POST | Detect code clones (semantic) |
| `/api/analysis/jscpd-clones` | POST | Detect code clones (JSCPD) |
| `/api/analysis/refactoring` | POST | Get refactoring suggestions |
| `/api/analysis/hotspots` | POST | Find code hotspots |

### System & Monitoring

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/agents/metrics` | GET | Agent performance metrics |
| `/api/system/metrics` | GET | System metrics |
| `/api/system/version` | GET | Version information |
| `/api/bus/stats` | GET | Knowledge bus statistics |

---

## 🎯 Common Use Cases

### Use Case 1: Semantic Code Search

**Search with re-ranking for best quality:**

```bash
curl -X POST http://localhost:3000/api/semantic/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "authentication middleware",
    "limit": 10,
    "useReranker": true,
    "rerankTopK": 30
  }'
```

**Result**: Top 10 most relevant code snippets with scores 0-1

### Use Case 2: Impact Analysis

**Assess impact before making changes:**

```bash
curl -X POST http://localhost:3000/api/analysis/impact \
  -H "Content-Type: application/json" \
  -d '{
    "entityId": "UserService",
    "depth": 3
  }'
```

**Result**: List of all impacted entities with relationship paths

### Use Case 3: Clone Detection

**Find duplicate code for refactoring:**

```bash
curl -X POST http://localhost:3000/api/analysis/jscpd-clones \
  -H "Content-Type: application/json" \
  -d '{
    "paths": ["/src"],
    "minLines": 5,
    "formats": ["typescript"]
  }'
```

**Result**: Groups of duplicate code with similarity scores

### Use Case 4: Multi-Repository Project

**Search across multiple repositories:**

```bash
# 1. Create project
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{"name": "My Microservices"}'

# 2. Add repositories
curl -X POST http://localhost:3000/api/projects/proj_abc/repositories \
  -H "Content-Type: application/json" \
  -d '{"repository_path": "/path/to/repo1"}'

# 3. Search across all
curl -X POST http://localhost:3000/api/projects/proj_abc/search \
  -H "Content-Type: application/json" \
  -d '{"query": "authentication", "limit": 20}'
```

---

## ⚙️ Configuration

### Minimum Configuration

```bash
# .env.http
PORT=3000
MCP_SERVER_DIR=/path/to/your/codebase
```

### With Semantic Search (Phase 3)

```bash
# Add Voyage AI embeddings
MCP_EMBEDDING_ENABLED=true
MCP_EMBEDDING_PROVIDER=voyage
VOYAGE_API_KEY=your-api-key-here
```

### With Re-ranker (Phase 4)

```bash
# Add re-ranker for best quality
MCP_RERANKER_ENABLED=true
MCP_RERANKER_MODEL=rerank-2
MCP_SEMANTIC_USE_RERANKER=true
```

See [DEVELOPER_QUICKSTART.md](./DEVELOPER_QUICKSTART.md#configuration-guide) for complete configuration options.

---

## 📊 Performance Tuning

### Quality vs Speed Tradeoffs

| Configuration | Quality | Speed | Use Case |
|--------------|---------|-------|----------|
| No reranker | Good | Fast (100-300ms) | High-frequency searches |
| rerank-2-lite | Better | Medium (300-500ms) | Balanced workloads |
| rerank-2 | Best | Slower (400-600ms) | Critical searches |

### Recommendations

**For Production (Balanced):**
```bash
MCP_RERANKER_MODEL=rerank-2-lite
MCP_RERANKER_DEFAULT_TOP_K=20
```

**For Best Quality:**
```bash
MCP_RERANKER_MODEL=rerank-2
MCP_RERANKER_DEFAULT_TOP_K=30
```

**For Best Speed:**
```bash
MCP_SEMANTIC_USE_RERANKER=false
```

---

## 🔧 Integration Examples

### GitHub Actions CI/CD

```yaml
- name: Analyze Code Changes
  run: |
    curl -X POST $MCP_API_URL/api/analysis/impact \
      -H "Content-Type: application/json" \
      -d '{"entityId": "UserService", "depth": 2}'
```

### n8n Automation

See [N8N_INTEGRATION_GUIDE.md](./N8N_INTEGRATION_GUIDE.md) for:
- Code review automation
- Impact analysis pipelines
- Code quality monitoring
- Multi-repository workflows

### Custom CLI

```bash
#!/bin/bash
search() {
  curl -X POST http://localhost:3000/api/semantic/search \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"$1\", \"limit\": ${2:-10}, \"useReranker\": true}" \
    | jq '.data.results'
}

search "authentication" 5
```

---

## 🐛 Troubleshooting

### Common Issues

**1. "Semantic search is not enabled"**
- Add Voyage AI configuration to `.env.http`
- Ensure `MCP_EMBEDDING_ENABLED=true`

**2. "Re-ranker not enabled"**
- Add `MCP_RERANKER_ENABLED=true` to `.env.http`
- Ensure `VOYAGE_API_KEY` is set

**3. Empty search results**
- Wait 30-60s after startup for indexing
- Check `/api/graph/stats` for entity count

**4. Slow performance**
- Reduce `rerankTopK` parameter
- Use `rerank-2-lite` instead of `rerank-2`
- Lower `limit` parameter

See [DEVELOPER_QUICKSTART.md](./DEVELOPER_QUICKSTART.md#troubleshooting) for complete troubleshooting guide.

---

## 📖 Documentation Structure

```
docs/
├── HTTP_API_README.md           # This file - Documentation index
├── DEVELOPER_QUICKSTART.md      # 5-minute quickstart guide
├── API_REFERENCE.md             # Complete API reference
├── N8N_INTEGRATION_GUIDE.md     # n8n workflow automation
├── PHASE4_RERANKER.md          # Phase 4 documentation
└── FEASIBILITY_REPORT.md        # All phases overview
```

---

## 🎓 Learning Path

**For New Developers:**
1. Read [DEVELOPER_QUICKSTART.md](./DEVELOPER_QUICKSTART.md)
2. Try the 5-minute tutorial
3. Explore [Swagger UI](http://localhost:3000/api-docs)

**For API Integration:**
1. Review [API_REFERENCE.md](./API_REFERENCE.md)
2. Study endpoint examples
3. Check error codes and responses

**For Workflow Automation:**
1. Read [N8N_INTEGRATION_GUIDE.md](./N8N_INTEGRATION_GUIDE.md)
2. Try example workflows
3. Customize for your needs

**For Advanced Features:**
1. Read [PHASE4_RERANKER.md](./PHASE4_RERANKER.md)
2. Review benchmarks
3. Tune performance parameters

---

## 🌟 Key Features

### ✅ Complete REST API
- All MCP tools available via HTTP
- Structured JSON responses
- Comprehensive error handling

### ✅ Semantic Search (Phase 3)
- Voyage AI embeddings (1024-d)
- Cross-language code search
- Find similar code snippets

### ✅ Two-Stage Retrieval (Phase 4)
- Optional re-ranking for better quality
- 4 model choices
- Configurable quality/speed tradeoff

### ✅ Multi-Repository (Phase 2)
- Manage multiple codebases
- Cross-repository search
- Project statistics

### ✅ Developer-Friendly
- OpenAPI/Swagger documentation
- Interactive API testing
- Clear examples and guides

---

## 📞 Support & Resources

- **API Docs**: [API_REFERENCE.md](./API_REFERENCE.md)
- **Quick Start**: [DEVELOPER_QUICKSTART.md](./DEVELOPER_QUICKSTART.md)
- **n8n Workflows**: [N8N_INTEGRATION_GUIDE.md](./N8N_INTEGRATION_GUIDE.md)
- **Swagger UI**: http://localhost:3000/api-docs
- **Voyage AI**: https://docs.voyageai.com/

---

## 📝 Version History

### Current Version

- **Phase 4**: Voyage AI re-ranker ✨ NEW
- **Phase 3**: Voyage AI embeddings (1024-d)
- **Phase 2**: Multi-repository support
- **Phase 1**: HTTP REST API

See [FEASIBILITY_REPORT.md](./FEASIBILITY_REPORT.md) for detailed version history.

---

## 📄 License

See LICENSE file for details.

---

**Ready to get started?** → [DEVELOPER_QUICKSTART.md](./DEVELOPER_QUICKSTART.md) ⚡
