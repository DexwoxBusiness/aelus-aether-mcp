# 🐳 Docker Quick Start

Quick guide to deploy Aelus Aether MCP with Docker on Hostinger (or any server) alongside n8n.

## ⚡ TL;DR - 3 Commands

```bash
# 1. Copy and configure environment
cp .env.docker.example .env
nano .env  # Set VOYAGE_API_KEY and REPOS_PATH

# 2. Deploy
./deploy.sh start

# 3. Verify
curl http://localhost:3000/health
```

**Done!** API is running at `http://localhost:3000`

---

## 📦 What You Get

- **HTTP REST API** on port 3000
- **Swagger UI** at `/api-docs`
- **24 endpoints** for code analysis
- **Semantic search** with Voyage AI
- **Re-ranker** for better results
- **Multi-language** support (12 languages)
- **Persistent storage** with Docker volumes
- **Health monitoring** built-in
- **Auto-restart** on failure

---

## 🚀 Deployment Options

### Option 1: Using Deploy Script (Recommended)

```bash
# Start everything
./deploy.sh start

# View logs
./deploy.sh logs

# Check status
./deploy.sh status

# Stop services
./deploy.sh stop
```

### Option 2: Using Docker Compose Directly

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

---

## ⚙️ Essential Configuration

Edit `.env` file:

```bash
# Required: Your Voyage AI API key
VOYAGE_API_KEY=pa-xyz...

# Required: Path to code to analyze
REPOS_PATH=/path/to/your/code

# Optional: Allow n8n to access API
CORS_ORIGINS=https://your-n8n.com
```

**Get Voyage AI key**: https://www.voyageai.com/

---

## 🔗 Integrate with n8n

### If n8n is Already Running

1. **Find n8n network:**

```bash
docker network ls
docker inspect n8n_container | grep NetworkMode
```

2. **Update `docker-compose.yml`:**

```yaml
networks:
  n8n-network:
    external: true
    name: your_n8n_network_name
```

3. **Deploy:**

```bash
./deploy.sh start
```

4. **Use in n8n HTTP Request node:**

```
URL: http://aelus-mcp-server:3000/api/semantic/search
Method: POST
Body: {"query": "authentication", "limit": 10}
```

### Deploy Both n8n and MCP Together

Uncomment the n8n service in `docker-compose.yml` and run:

```bash
./deploy.sh start
```

---

## 📊 Monitoring

### Check Health

```bash
# Quick health check
curl http://localhost:3000/health

# Detailed status
./deploy.sh status

# View logs
./deploy.sh logs
```

### API Endpoints

- **Health**: http://localhost:3000/health
- **Swagger UI**: http://localhost:3000/api-docs
- **Graph Stats**: http://localhost:3000/api/graph/stats
- **System Metrics**: http://localhost:3000/api/system/metrics

---

## 🛠️ Common Tasks

### Update to Latest Version

```bash
./deploy.sh update
```

### Backup Database

```bash
./deploy.sh backup
# Backup saved to: backups/mcp-backup-*.tar.gz
```

### Reset Database

```bash
# Via API
curl -X POST http://localhost:3000/api/graph/reset

# Or remove volume
docker-compose down
docker volume rm aelus-aether-mcp_aelus-mcp-data
docker-compose up -d
```

### Change Repositories

Just update the code in your `REPOS_PATH` directory. The container sees changes immediately.

To re-index:

```bash
curl -X POST http://localhost:3000/api/index \
  -H "Content-Type: application/json" \
  -d '{"directory": "/app/repos"}'
```

---

## 🔧 Troubleshooting

### Port 3000 Already in Use

Edit `docker-compose.yml`:

```yaml
ports:
  - "3001:3000"  # Use port 3001 instead
```

### Container Won't Start

```bash
# Check logs
docker-compose logs aelus-mcp

# Verify configuration
docker-compose config

# Check environment
cat .env
```

### Semantic Search Not Working

```bash
# Verify API key is set
docker-compose exec aelus-mcp env | grep VOYAGE_API_KEY

# Test endpoint
curl -X POST http://localhost:3000/api/semantic/search \
  -H "Content-Type: application/json" \
  -d '{"query": "test", "limit": 1}'
```

### Out of Memory

Increase memory in `docker-compose.yml`:

```yaml
deploy:
  resources:
    limits:
      memory: 8G  # Increase from 4G
```

---

## 📖 Full Documentation

- **Complete Deployment Guide**: [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md)
- **API Reference**: [API_REFERENCE.md](./API_REFERENCE.md)
- **n8n Integration**: [N8N_INTEGRATION_GUIDE.md](./N8N_INTEGRATION_GUIDE.md)
- **Developer Guide**: [DEVELOPER_QUICKSTART.md](./DEVELOPER_QUICKSTART.md)

---

## 🎯 Example API Calls

### Semantic Search

```bash
curl -X POST http://localhost:3000/api/semantic/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "authentication middleware",
    "limit": 5,
    "useReranker": true,
    "rerankTopK": 15
  }'
```

### Impact Analysis

```bash
curl -X POST http://localhost:3000/api/analysis/impact \
  -H "Content-Type: application/json" \
  -d '{
    "entityId": "UserService",
    "depth": 2
  }'
```

### Clone Detection

```bash
curl -X POST http://localhost:3000/api/analysis/jscpd-clones \
  -H "Content-Type: application/json" \
  -d '{
    "paths": ["/app/repos"],
    "minLines": 5
  }'
```

---

## 🔒 Security Notes

- Container runs as non-root user (mcpuser)
- Repositories mounted read-only
- Health checks enabled
- Resource limits configured
- Set `CORS_ORIGINS` for production

---

## 📞 Support

**Need Help?**

- Check logs: `./deploy.sh logs`
- View status: `./deploy.sh status`
- Full guide: [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md)

**Issues?** GitHub: https://github.com/DexwoxBusiness/aelus-aether-mcp/issues

---

**Ready to deploy?** → `./deploy.sh start` 🚀
