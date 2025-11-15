# MCP Server with HTTP+SSE Transport for n8n

Complete guide for using the MCP server with Server-Sent Events (SSE) transport, compatible with n8n's MCP integration.

## 🎯 What is This?

The Aelus Aether MCP server now supports **TWO transport modes**:

1. **stdio** (default) - For Claude Desktop, Cline, and other desktop apps
2. **SSE** (HTTP+SSE) - For n8n and other HTTP-based integrations

**All 24 MCP tools** work with both transports!

## 🚀 Quick Start - n8n Integration

### 1. Start MCP Server with SSE Transport

```bash
# Option A: Using npm script
MCP_SERVER_DIR=/path/to/code npm run mcp:sse

# Option B: Using Docker
docker-compose up -d
```

### 2. Configure n8n

In n8n, use the HTTP+SSE MCP node with:

```
MCP Server URL: http://localhost:3000/sse
```

### 3. Call Tools from n8n

All 24 MCP tools are available:

- `semantic_search` - Semantic code search
- `find_similar_code` - Find similar code
- `analyze_code_impact` - Impact analysis
- `detect_code_clones` - Clone detection
- `list_file_entities` - List entities in file
- `list_entity_relationships` - List relationships
- And 18 more...

## 📡 MCP Protocol Endpoints

When running in SSE mode, the server exposes:

### GET `/sse`
Establishes the Server-Sent Events stream

**Response**: SSE stream with MCP protocol messages

### POST `/messages`
Receives MCP protocol messages from client

**Headers**:
- `Content-Type: application/json`
- `Mcp-Session-Id: <session-id>` (or in message body)

**Body**: MCP protocol JSON-RPC message

### GET `/health`
Health check endpoint

**Response**:
```json
{
  "status": "healthy",
  "transport": "sse",
  "activeSessions": 2,
  "directory": "/path/to/code",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

### GET `/`
Server information

**Response**:
```json
{
  "name": "Code Graph RAG MCP Server",
  "version": "2.7.6",
  "transport": "HTTP+SSE",
  "protocol": "Model Context Protocol",
  "endpoints": {
    "sse": "http://localhost:3000/sse",
    "messages": "http://localhost:3000/messages",
    "health": "http://localhost:3000/health"
  },
  "usage": {
    "n8n": "Configure MCP node with: http://localhost:3000/sse"
  }
}
```

## 🔧 Running the Server

### Local Development

```bash
# Build
npm run build

# Run with SSE transport
MCP_TRANSPORT=sse MCP_SERVER_DIR=/path/to/code PORT=3000 node dist/index.js

# Or use the npm script
MCP_SERVER_DIR=/path/to/code npm run mcp:sse
```

### Docker Deployment

```bash
# Using docker-compose (SSE enabled by default)
docker-compose up -d

# Or build and run manually
docker build -t aelus-mcp .
docker run -d \
  -p 3000:3000 \
  -e MCP_TRANSPORT=sse \
  -e MCP_SERVER_DIR=/app/repos \
  -e VOYAGE_API_KEY=your-key \
  -v /path/to/code:/app/repos:ro \
  aelus-mcp
```

## 🧪 Testing the SSE Connection

### 1. Test Health Endpoint

```bash
curl http://localhost:3000/health
```

Expected:
```json
{
  "status": "healthy",
  "transport": "sse",
  "activeSessions": 0
}
```

### 2. Test SSE Stream

```bash
# This will hang (expected) - the SSE stream stays open
curl -N http://localhost:3000/sse
```

You should see SSE initialization messages.

### 3. Test from n8n

1. Add "MCP" node in n8n workflow
2. Configure server URL: `http://localhost:3000/sse`
3. Select tool: `semantic_search`
4. Set parameters:
   ```json
   {
     "query": "authentication functions",
     "limit": 5
   }
   ```
5. Execute

## 📊 Available Tools (All 24)

| Tool | Description |
|------|-------------|
| `index` | Index a codebase |
| `semantic_search` | Search code semantically |
| `find_similar_code` | Find similar code snippets |
| `analyze_code_impact` | Analyze impact of changes |
| `detect_code_clones` | Find duplicate code |
| `jscpd_detect_clones` | Token-based clone detection |
| `suggest_refactoring` | Get refactoring suggestions |
| `cross_language_search` | Search across languages |
| `analyze_hotspots` | Find code hotspots |
| `find_related_concepts` | Find related code |
| `list_file_entities` | List entities in file |
| `list_entity_relationships` | List relationships |
| `query` | Natural language graph query |
| `get_graph` | Get code graph |
| `get_graph_stats` | Get graph statistics |
| `get_graph_health` | Health check |
| `reset_graph` | Clear graph data |
| `clean_index` | Reset and reindex |
| `lerna_project_graph` | Lerna workspace graph |
| `get_metrics` | System metrics |
| `get_version` | Version info |
| `get_agent_metrics` | Agent metrics |
| `get_bus_stats` | Knowledge bus stats |
| `clear_bus_topic` | Clear bus topic |

## 🔀 Switching Between Transports

### stdio Transport (Claude Desktop)

```bash
# Default mode - no environment variable needed
MCP_SERVER_DIR=/path/to/code npm start

# Or explicitly
MCP_TRANSPORT=stdio MCP_SERVER_DIR=/path/to/code node dist/index.js
```

### SSE Transport (n8n)

```bash
# Set MCP_TRANSPORT=sse
MCP_TRANSPORT=sse MCP_SERVER_DIR=/path/to/code npm run mcp:sse
```

## 🐛 Troubleshooting

### SSE Connection Not Established

**Check server logs:**
```bash
# Docker
docker-compose logs -f aelus-mcp

# Local
# Look for "MCP SSE Server Ready" message
```

**Verify endpoint:**
```bash
curl http://localhost:3000/
```

### n8n Can't Connect

1. **Check CORS settings** - Ensure your n8n URL is allowed:
   ```bash
   # In .env or docker-compose.yml
   CORS_ORIGINS=https://your-n8n.com
   ```

2. **Check network** - If n8n is in Docker, ensure same network:
   ```yaml
   networks:
     - n8n-network
   ```

3. **Check firewall** - Port 3000 must be accessible

### Tools Not Working

**Verify indexing:**
```bash
# Check graph stats
curl http://localhost:3000/health
```

**Trigger indexing:**
Use n8n to call the `index` tool first:
```json
{
  "directory": "/app/repos"
}
```

## 🔒 Security Considerations

1. **CORS**: Configure `CORS_ORIGINS` for production
2. **Network**: Use Docker networks for isolation
3. **Authentication**: Consider adding auth middleware
4. **API Keys**: Protect Voyage AI key in environment

## 📚 More Resources

- **Docker Deployment**: See `DOCKER_DEPLOYMENT.md`
- **n8n Workflows**: See `N8N_INTEGRATION_GUIDE.md`
- **API Reference**: See `API_REFERENCE.md`
- **Developer Guide**: See `DEVELOPER_QUICKSTART.md`

## 💡 Examples

### n8n Workflow: Semantic Search

```json
{
  "nodes": [
    {
      "name": "MCP - Semantic Search",
      "type": "@n8n/n8n-nodes-mcp.mcp",
      "parameters": {
        "server": "http://localhost:3000/sse",
        "tool": "semantic_search",
        "parameters": {
          "query": "{{ $json.searchQuery }}",
          "limit": 10,
          "useReranker": true,
          "rerankTopK": 30
        }
      }
    }
  ]
}
```

### n8n Workflow: Impact Analysis

```json
{
  "tool": "analyze_code_impact",
  "parameters": {
    "entityId": "UserService",
    "depth": 2
  }
}
```

---

**Ready to use with n8n!** 🚀

For Docker deployment, see `./deploy.sh start`
