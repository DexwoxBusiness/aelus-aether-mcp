# n8n Integration Guide for Code Graph RAG API

## Overview

This guide shows you how to integrate the Code Graph RAG HTTP API with n8n workflows for automated code analysis, semantic search, and multi-repository management.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Common Workflows](#common-workflows)
4. [API Endpoints Reference](#api-endpoints-reference)
5. [Example Workflows](#example-workflows)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

### 1. Start the HTTP Server

```bash
# Set required environment variables
export MCP_SERVER_DIR=/path/to/your/codebase
export PORT=3000

# Optional: Enable Voyage AI features
export MCP_EMBEDDING_ENABLED=true
export MCP_EMBEDDING_PROVIDER=voyage
export VOYAGE_API_KEY=your-api-key

# Optional: Enable Re-ranker
export MCP_RERANKER_ENABLED=true
export MCP_SEMANTIC_USE_RERANKER=true

# Start the server
npm run http
```

### 2. Verify Server is Running

```bash
curl http://localhost:3000/health

# Response:
# {
#   "success": true,
#   "status": "healthy",
#   "timestamp": "2025-11-14T...",
#   "uptime": 123.45
# }
```

### 3. Access API Documentation

Visit http://localhost:3000/api-docs for interactive Swagger documentation.

## Quick Start

### Basic n8n HTTP Request Node Configuration

1. **Add HTTP Request Node** in n8n
2. **Configure**:
   - **Method**: POST (most endpoints)
   - **URL**: `http://localhost:3000/api/...`
   - **Authentication**: None (add if you implement auth)
   - **Body Content Type**: JSON
   - **Body**: JSON payload

### Example: Simple Semantic Search

```json
{
  "n8n": {
    "nodes": [
      {
        "name": "HTTP Request",
        "type": "n8n-nodes-base.httpRequest",
        "parameters": {
          "url": "http://localhost:3000/api/semantic/search",
          "method": "POST",
          "bodyContentType": "json",
          "body": {
            "query": "{{ $json.searchQuery }}",
            "limit": 10
          }
        }
      }
    ]
  }
}
```

## Common Workflows

### 1. Code Review Automation

**Use Case**: Automatically analyze code changes and find similar patterns

```
Trigger (Webhook/Schedule)
  ↓
Index Repository
  ↓
Find Similar Code
  ↓
Detect Clones
  ↓
Send Results (Email/Slack)
```

**n8n Nodes**:

1. **Trigger**: Webhook or Schedule
2. **HTTP Request - Index Repository**:
   ```json
   {
     "method": "POST",
     "url": "http://localhost:3000/api/index",
     "body": {
       "repoPath": "/path/to/repo",
       "force": false
     }
   }
   ```

3. **HTTP Request - Find Similar Code**:
   ```json
   {
     "method": "POST",
     "url": "http://localhost:3000/api/semantic/similar",
     "body": {
       "code": "{{ $json.codeSnippet }}",
       "language": "typescript",
       "limit": 5
     }
   }
   ```

4. **HTTP Request - Detect Clones**:
   ```json
   {
     "method": "POST",
     "url": "http://localhost:3000/api/analysis/clones",
     "body": {
       "minLines": 5,
       "minTokens": 50,
       "threshold": 0.85
     }
   }
   ```

### 2. Multi-Repository Project Setup

**Use Case**: Set up and manage multiple repositories as a single project

```
Create Project
  ↓
Add Repositories
  ↓
Index All Repositories
  ↓
Cross-Repo Search
```

**n8n Nodes**:

1. **HTTP Request - Create Project**:
   ```json
   {
     "method": "POST",
     "url": "http://localhost:3000/api/projects",
     "body": {
       "name": "My Microservices Project",
       "description": "E-commerce microservices",
       "metadata": {
         "owner": "engineering-team",
         "tags": ["microservices", "e-commerce"]
       }
     }
   }
   ```

2. **HTTP Request - Add Repository** (loop for each repo):
   ```json
   {
     "method": "POST",
     "url": "http://localhost:3000/api/projects/{{ $json.projectId }}/repositories",
     "body": {
       "repository_path": "{{ $json.repoPath }}",
       "repository_name": "{{ $json.repoName }}"
     }
   }
   ```

3. **HTTP Request - Cross-Repo Search**:
   ```json
   {
     "method": "POST",
     "url": "http://localhost:3000/api/projects/{{ $json.projectId }}/search",
     "body": {
       "query": "authentication middleware",
       "limit": 20,
       "min_score": 0.7
     }
   }
   ```

### 3. Semantic Code Search with Re-ranking

**Use Case**: Find most relevant code using two-stage retrieval (Phase 3 + 4)

```
Search Query
  ↓
Semantic Search (Voyage AI Embeddings)
  ↓
Re-rank Results (Voyage AI Re-ranker)
  ↓
Return Top Results
```

**n8n Nodes**:

1. **HTTP Request - Semantic Search with Re-ranking**:
   ```json
   {
     "method": "POST",
     "url": "http://localhost:3000/api/semantic/search",
     "body": {
       "query": "calculate total price with discount",
       "limit": 10,
       "useReranker": true,
       "rerankTopK": 30,
       "minScore": 0.6
     }
   }
   ```

### 4. Impact Analysis Pipeline

**Use Case**: Analyze the impact of changing a function/class

```
Input: Entity Name
  ↓
Find Entity
  ↓
Analyze Impact
  ↓
Get Related Code
  ↓
Generate Report
```

**n8n Nodes**:

1. **HTTP Request - Analyze Impact**:
   ```json
   {
     "method": "POST",
     "url": "http://localhost:3000/api/analysis/impact",
     "body": {
       "entityId": "{{ $json.entityId }}",
       "maxDepth": 3,
       "includeTests": true
     }
   }
   ```

2. **HTTP Request - Get Related Entities**:
   ```json
   {
     "method": "POST",
     "url": "http://localhost:3000/api/semantic/related",
     "body": {
       "entityId": "{{ $json.entityId }}",
       "limit": 10
     }
   }
   ```

### 5. Continuous Code Quality Monitoring

**Use Case**: Daily/weekly code quality reports

```
Schedule Trigger (Daily)
  ↓
Detect Hotspots
  ↓
Find Refactoring Opportunities
  ↓
Check for Clones
  ↓
Aggregate Results
  ↓
Send Report (Email/Slack)
```

**n8n Nodes**:

1. **HTTP Request - Detect Hotspots**:
   ```json
   {
     "method": "POST",
     "url": "http://localhost:3000/api/analysis/hotspots",
     "body": {
       "minComplexity": 10,
       "minChanges": 5,
       "limit": 20
     }
   }
   ```

2. **HTTP Request - Find Refactoring Opportunities**:
   ```json
   {
     "method": "POST",
     "url": "http://localhost:3000/api/analysis/refactoring",
     "body": {
       "entityId": "{{ $json.entityId }}",
       "includeRelated": true
     }
   }
   ```

3. **HTTP Request - JSCPD Clone Detection**:
   ```json
   {
     "method": "POST",
     "url": "http://localhost:3000/api/analysis/jscpd-clones",
     "body": {
       "paths": ["/path/to/repo"],
       "minLines": 5,
       "minTokens": 50,
       "format": ["typescript", "javascript"]
     }
   }
   ```

## API Endpoints Reference

### Projects (Multi-Repository)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/projects` | POST | Create a new project |
| `/api/projects` | GET | List all projects |
| `/api/projects/:id` | GET | Get project details |
| `/api/projects/:id` | PATCH | Update project |
| `/api/projects/:id` | DELETE | Delete project |
| `/api/projects/:id/stats` | GET | Get project statistics |
| `/api/projects/:id/repositories` | POST | Add repository to project |
| `/api/projects/:id/repositories` | GET | List project repositories |
| `/api/projects/:projectId/repositories/:repoId` | DELETE | Remove repository |
| `/api/projects/:id/search` | POST | Cross-repository search |

### Indexing

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/index` | POST | Index a repository |
| `/api/index/clean` | POST | Clean stale index data |

### Semantic Search

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/semantic/search` | POST | Semantic code search (supports re-ranking) |
| `/api/semantic/similar` | POST | Find similar code |
| `/api/semantic/cross-language` | POST | Cross-language code search |
| `/api/semantic/related` | POST | Find related entities |

### Analysis

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analysis/impact` | POST | Analyze impact of changes |
| `/api/analysis/clones` | POST | Detect code clones |
| `/api/analysis/jscpd-clones` | POST | JSCPD clone detection |
| `/api/analysis/refactoring` | POST | Find refactoring opportunities |
| `/api/analysis/hotspots` | POST | Detect code hotspots |

### Graph

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/graph/entities/list` | POST | List entities |
| `/api/graph/relationships/list` | POST | List relationships |
| `/api/graph/query` | POST | Custom graph query |
| `/api/graph/get` | POST | Get specific entity |
| `/api/graph/stats` | GET | Get graph statistics |
| `/api/graph/health` | GET | Check graph health |
| `/api/graph/reset` | POST | Reset graph database |

### System

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/agents/metrics` | GET | Get agent metrics |
| `/api/agents/system/metrics` | GET | Get system metrics |
| `/api/agents/system/version` | GET | Get version info |
| `/api/agents/bus/stats` | GET | Get message bus stats |
| `/api/agents/bus/clear` | POST | Clear message bus |

## Example Workflows

### Example 1: GitHub Webhook → Code Analysis

**Trigger**: GitHub push webhook
**Goal**: Analyze changed files and post results as PR comment

```json
{
  "name": "GitHub Code Analysis",
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "webhookId": "github-push"
    },
    {
      "name": "Extract Changed Files",
      "type": "n8n-nodes-base.code",
      "code": "return items.map(item => ({ json: { files: item.json.commits[0].modified } }));"
    },
    {
      "name": "Analyze Each File",
      "type": "n8n-nodes-base.httpRequest",
      "url": "http://localhost:3000/api/semantic/search",
      "method": "POST",
      "body": {
        "query": "{{ $json.fileContent }}",
        "limit": 5,
        "useReranker": true
      }
    },
    {
      "name": "Post to GitHub",
      "type": "n8n-nodes-base.github",
      "operation": "create:issueComment"
    }
  ]
}
```

### Example 2: Daily Code Quality Report

**Trigger**: Cron (daily at 9 AM)
**Goal**: Generate and email code quality metrics

```json
{
  "name": "Daily Code Quality Report",
  "nodes": [
    {
      "name": "Schedule",
      "type": "n8n-nodes-base.cron",
      "expression": "0 9 * * *"
    },
    {
      "name": "Get Hotspots",
      "type": "n8n-nodes-base.httpRequest",
      "url": "http://localhost:3000/api/analysis/hotspots",
      "method": "POST",
      "body": {
        "minComplexity": 10,
        "limit": 20
      }
    },
    {
      "name": "Get Clones",
      "type": "n8n-nodes-base.httpRequest",
      "url": "http://localhost:3000/api/analysis/clones",
      "method": "POST",
      "body": {
        "threshold": 0.85,
        "minLines": 5
      }
    },
    {
      "name": "Format Report",
      "type": "n8n-nodes-base.code",
      "code": "// Aggregate results and format HTML email"
    },
    {
      "name": "Send Email",
      "type": "n8n-nodes-base.emailSend"
    }
  ]
}
```

### Example 3: Smart Documentation Generator

**Trigger**: Manual/Schedule
**Goal**: Generate documentation for code entities

```json
{
  "name": "Smart Documentation Generator",
  "nodes": [
    {
      "name": "Get All Entities",
      "type": "n8n-nodes-base.httpRequest",
      "url": "http://localhost:3000/api/graph/entities/list",
      "method": "POST",
      "body": {
        "types": ["function", "class"],
        "limit": 100
      }
    },
    {
      "name": "For Each Entity",
      "type": "n8n-nodes-base.splitInBatches",
      "batchSize": 10
    },
    {
      "name": "Find Related Code",
      "type": "n8n-nodes-base.httpRequest",
      "url": "http://localhost:3000/api/semantic/related",
      "method": "POST",
      "body": {
        "entityId": "{{ $json.id }}",
        "limit": 5
      }
    },
    {
      "name": "Find Similar Examples",
      "type": "n8n-nodes-base.httpRequest",
      "url": "http://localhost:3000/api/semantic/similar",
      "method": "POST",
      "body": {
        "code": "{{ $json.content }}",
        "limit": 3
      }
    },
    {
      "name": "Generate Documentation",
      "type": "n8n-nodes-base.openAi",
      "operation": "chat",
      "prompt": "Generate documentation for this code with examples: {{ $json }}"
    },
    {
      "name": "Save to File",
      "type": "n8n-nodes-base.writeFile"
    }
  ]
}
```

## Advanced Features

### Using Voyage AI Embeddings (Phase 3)

Ensure the server is configured with Voyage AI:

```bash
export MCP_EMBEDDING_ENABLED=true
export MCP_EMBEDDING_PROVIDER=voyage
export MCP_EMBEDDING_MODEL=voyage-code-3
export VOYAGE_API_KEY=your-key-here
```

All semantic search endpoints automatically use the configured embeddings provider.

### Using Re-ranker (Phase 4)

Enable re-ranking in semantic search:

```bash
export MCP_RERANKER_ENABLED=true
export MCP_RERANKER_MODEL=rerank-2
export MCP_SEMANTIC_USE_RERANKER=true
```

Then in your n8n HTTP request:

```json
{
  "query": "your search query",
  "limit": 10,
  "useReranker": true,
  "rerankTopK": 30
}
```

**Performance Tip**: Set `rerankTopK` to 2-3x your `limit` for best results.

### Error Handling in n8n

Add error handling to your workflows:

1. **Set Node Error Handling**:
   - Open node settings
   - Go to "Settings" tab
   - Enable "Continue On Fail"

2. **Add Error Handler Node**:
```json
{
  "name": "Error Handler",
  "type": "n8n-nodes-base.code",
  "continueOnFail": true,
  "code": "if ($input.item.error) { /* Handle error */ }"
}
```

## Troubleshooting

### Common Issues

**1. Connection Refused**

```
Error: connect ECONNREFUSED 127.0.0.1:3000
```

**Solution**: Ensure the HTTP server is running:
```bash
npm run http
```

**2. Invalid Request Body**

```
{
  "success": false,
  "error": {
    "message": "Validation error",
    "code": "VALIDATION_ERROR"
  }
}
```

**Solution**: Check the API documentation at `/api-docs` for required fields.

**3. Voyage AI API Key Not Configured**

```
{
  "error": {
    "message": "Voyage AI apiKey is required"
  }
}
```

**Solution**: Set environment variable:
```bash
export VOYAGE_API_KEY=your-key-here
```

**4. Timeout Errors**

**Solution**: Increase timeout in n8n HTTP Request node or server:
```bash
export MCP_SERVER_TIMEOUT=60000  # 60 seconds
```

### Testing Endpoints

Use curl to test endpoints before setting up n8n workflows:

```bash
# Test health
curl http://localhost:3000/health

# Test semantic search
curl -X POST http://localhost:3000/api/semantic/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "calculate total",
    "limit": 5
  }'

# Test with re-ranking
curl -X POST http://localhost:3000/api/semantic/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "authentication middleware",
    "limit": 10,
    "useReranker": true,
    "rerankTopK": 20
  }'
```

## Best Practices

1. **Use Projects for Multi-Repo**: Always use the Projects API when working with multiple repositories

2. **Enable Re-ranking for Better Results**: For critical searches, enable re-ranking:
   ```json
   { "useReranker": true, "rerankTopK": 30 }
   ```

3. **Batch Operations**: Use n8n's SplitInBatches node for processing large datasets

4. **Cache Results**: Use n8n's built-in caching or store results in databases

5. **Monitor Performance**: Check `/api/agents/metrics` regularly

6. **Error Handling**: Always implement error handling in workflows

7. **Rate Limiting**: Be mindful of Voyage AI rate limits (300 req/min)

## Resources

- **API Documentation**: http://localhost:3000/api-docs
- **Health Check**: http://localhost:3000/health
- **OpenAPI Spec**: http://localhost:3000/api-docs.json
- **Phase 2 Docs**: PHASE2_MULTI_REPO.md
- **Phase 3 Docs**: PHASE3_VOYAGE_AI.md
- **Phase 4 Docs**: PHASE4_RERANKER.md

## Support

For issues or questions:
1. Check the API documentation at `/api-docs`
2. Review the phase-specific documentation
3. Check server logs for detailed error messages
4. Test endpoints with curl before using in n8n

Happy automating! 🚀
