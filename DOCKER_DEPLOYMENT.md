# Docker Deployment Guide

Complete guide for deploying Aelus Aether MCP HTTP Server with Docker, optimized for Hostinger integration with n8n.

## 📋 Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Voyage AI API key (for semantic search)
- At least 2GB RAM available
- Port 3000 available (or configure different port)

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/DexwoxBusiness/aelus-aether-mcp.git
cd aelus-aether-mcp
```

### 2. Configure Environment

```bash
# Copy example environment file
cp .env.docker.example .env

# Edit configuration
nano .env
```

**Required Configuration:**

```bash
# Set your Voyage AI API key
VOYAGE_API_KEY=your-api-key-here

# Set path to your code repositories
REPOS_PATH=/path/to/your/code/repositories

# Optional: Set CORS for n8n
CORS_ORIGINS=https://your-n8n-domain.com
```

### 3. Build and Start

```bash
# Build the Docker image
docker-compose build

# Start the service
docker-compose up -d

# Check logs
docker-compose logs -f aelus-mcp
```

### 4. Verify Installation

```bash
# Health check
curl http://localhost:3000/health

# API documentation
open http://localhost:3000/api-docs
```

---

## 🔧 Configuration Options

### Environment Variables

#### Server Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | production | Environment mode |
| `PORT` | 3000 | HTTP server port |
| `HOST` | 0.0.0.0 | Bind address |
| `LOG_LEVEL` | info | Logging level (error, warn, info, debug) |
| `CORS_ORIGINS` | * | Allowed CORS origins (comma-separated) |

#### Repository Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `REPOS_PATH` | Yes | Path to code repositories on host |
| `CONFIG_PATH` | No | Custom YAML config file path |

#### Voyage AI Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `VOYAGE_API_KEY` | - | **Required** for semantic search |
| `MCP_EMBEDDING_ENABLED` | true | Enable semantic search |
| `MCP_EMBEDDING_PROVIDER` | voyage | Embedding provider |
| `VOYAGE_CONCURRENCY` | 4 | Concurrent requests to Voyage API |

#### Re-ranker Configuration (Phase 4)

| Variable | Default | Description |
|----------|---------|-------------|
| `MCP_RERANKER_ENABLED` | true | Enable two-stage retrieval |
| `MCP_RERANKER_MODEL` | rerank-2 | Model: rerank-2, rerank-2-lite |
| `MCP_SEMANTIC_USE_RERANKER` | true | Use reranker for semantic search |

---

## 🌐 Hostinger Deployment

### Option A: With Existing n8n

If you already have n8n running on Hostinger:

1. **Update docker-compose.yml:**

```yaml
networks:
  n8n-network:
    external: true
    name: your_existing_n8n_network_name
```

2. **Find your n8n network:**

```bash
docker network ls
docker inspect <n8n-container-name> | grep NetworkMode
```

3. **Deploy MCP:**

```bash
docker-compose up -d
```

4. **Configure n8n HTTP Request Node:**

```
URL: http://aelus-mcp-server:3000/api/semantic/search
Method: POST
```

### Option B: Deploy Both Services

If you want to deploy both n8n and MCP:

1. **Uncomment n8n service** in `docker-compose.yml`

2. **Start both services:**

```bash
docker-compose up -d
```

3. **Access:**
   - n8n: http://your-server:5678
   - MCP API: http://your-server:3000
   - Swagger UI: http://your-server:3000/api-docs

---

## 📂 Volume Management

### Data Persistence

The following directories are persisted in Docker volumes:

```bash
# Database storage
aelus-mcp-data:/app/data

# Code repositories (mounted read-only)
${REPOS_PATH}:/app/repos:ro
```

### Backup Database

```bash
# Backup
docker run --rm \
  -v aelus-mcp-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/mcp-backup-$(date +%Y%m%d).tar.gz /data

# Restore
docker run --rm \
  -v aelus-mcp-data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/mcp-backup-20250115.tar.gz -C /
```

### Update Code Repositories

```bash
# Just update the code in your REPOS_PATH
# The container will see changes immediately (mounted as volume)

# Optionally, trigger re-indexing via API
curl -X POST http://localhost:3000/api/graph/reset
curl -X POST http://localhost:3000/api/index \
  -H "Content-Type: application/json" \
  -d '{"directory": "/app/repos"}'
```

---

## 🔍 Monitoring & Logs

### View Logs

```bash
# Follow logs
docker-compose logs -f aelus-mcp

# Last 100 lines
docker-compose logs --tail=100 aelus-mcp

# Logs from specific time
docker-compose logs --since 30m aelus-mcp
```

### Health Monitoring

```bash
# Container health
docker-compose ps

# Health endpoint
curl http://localhost:3000/health

# Graph health
curl http://localhost:3000/api/graph/health

# System metrics
curl http://localhost:3000/api/system/metrics
```

### Resource Usage

```bash
# Container stats
docker stats aelus-mcp-server

# Disk usage
docker system df
```

---

## 🛠️ Maintenance

### Update to Latest Version

```bash
# Pull latest code
git pull origin master

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Reset Database

```bash
# Clear all indexed data
curl -X POST http://localhost:3000/api/graph/reset

# Or stop container and remove volume
docker-compose down
docker volume rm aelus-mcp-data
docker-compose up -d
```

### Restart Service

```bash
# Graceful restart
docker-compose restart aelus-mcp

# Force restart
docker-compose down
docker-compose up -d
```

---

## 🐛 Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs aelus-mcp

# Common issues:
# 1. Port 3000 already in use
# 2. Missing VOYAGE_API_KEY
# 3. Invalid REPOS_PATH
```

**Solution:**

```bash
# Change port in docker-compose.yml
ports:
  - "3001:3000"  # Use port 3001 instead

# Check environment
docker-compose config

# Verify volumes
docker volume ls
```

### Semantic Search Not Working

```bash
# Check Voyage AI configuration
docker-compose exec aelus-mcp env | grep VOYAGE

# Test API key
curl -X POST http://localhost:3000/api/semantic/search \
  -H "Content-Type: application/json" \
  -d '{"query": "test", "limit": 1}'
```

### Out of Memory

**Increase memory limit** in `docker-compose.yml`:

```yaml
deploy:
  resources:
    limits:
      memory: 8G  # Increase from 4G
```

### Permission Issues

```bash
# Fix volume permissions
docker-compose exec aelus-mcp chown -R mcpuser:mcpuser /app/data
```

---

## 🔒 Security Best Practices

### 1. Restrict CORS

```bash
# In .env
CORS_ORIGINS=https://your-n8n-domain.com
```

### 2. Use Non-Root User

The Dockerfile already runs as `mcpuser` (UID 1001).

### 3. Read-Only Repository Mount

Repositories are mounted read-only by default:

```yaml
volumes:
  - ${REPOS_PATH}:/app/repos:ro
```

### 4. Secure API Key

```bash
# Never commit .env to git
echo ".env" >> .gitignore

# Use Docker secrets in production
docker secret create voyage_api_key voyage_key.txt
```

### 5. Network Isolation

```bash
# Only expose necessary ports
# Remove public port mapping if only accessed via n8n
ports:
  - "127.0.0.1:3000:3000"  # Only localhost
```

---

## 📊 Performance Tuning

### Resource Allocation

**For small codebases (<1000 files):**

```yaml
deploy:
  resources:
    limits:
      cpus: '1.0'
      memory: 2G
```

**For large codebases (>10000 files):**

```yaml
deploy:
  resources:
    limits:
      cpus: '4.0'
      memory: 8G
```

### Optimize Indexing

```bash
# Use exclude patterns to skip unnecessary files
curl -X POST http://localhost:3000/api/index \
  -H "Content-Type: application/json" \
  -d '{
    "directory": "/app/repos",
    "excludePatterns": [
      "node_modules/**",
      "dist/**",
      "build/**",
      "**/*.test.*"
    ]
  }'
```

---

## 🔗 Integration Examples

### n8n HTTP Request Node Configuration

**Semantic Search:**

```json
{
  "url": "http://aelus-mcp-server:3000/api/semantic/search",
  "method": "POST",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "query": "{{ $json.searchQuery }}",
    "limit": 10,
    "useReranker": true,
    "rerankTopK": 30
  }
}
```

**Impact Analysis:**

```json
{
  "url": "http://aelus-mcp-server:3000/api/analysis/impact",
  "method": "POST",
  "body": {
    "entityId": "{{ $json.entityId }}",
    "depth": 2
  }
}
```

See [N8N_INTEGRATION_GUIDE.md](./N8N_INTEGRATION_GUIDE.md) for complete workflows.

---

## 📚 Additional Resources

- **API Reference**: [API_REFERENCE.md](./API_REFERENCE.md)
- **Developer Quickstart**: [DEVELOPER_QUICKSTART.md](./DEVELOPER_QUICKSTART.md)
- **n8n Integration**: [N8N_INTEGRATION_GUIDE.md](./N8N_INTEGRATION_GUIDE.md)
- **Swagger UI**: http://localhost:3000/api-docs

---

## 🆘 Support

**Issues?**
- Check logs: `docker-compose logs -f`
- Health check: `curl http://localhost:3000/health`
- GitHub Issues: https://github.com/DexwoxBusiness/aelus-aether-mcp/issues

**Performance Issues?**
- Monitor resources: `docker stats aelus-mcp-server`
- Check metrics: `curl http://localhost:3000/api/system/metrics`
- Adjust limits in docker-compose.yml

---

## 📝 License

See LICENSE file for details.
