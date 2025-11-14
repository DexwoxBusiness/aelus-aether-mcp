# Aelus Aether MCP - API Reference

Complete REST API reference for the Aelus Aether MCP HTTP server. This API provides programmatic access to code graph analysis, semantic search, multi-repository management, and advanced code analysis features.

## Base URL

```
http://localhost:3000/api
```

## Authentication

Currently no authentication is required. Configure CORS in `.env.http` to restrict access.

## Response Format

All endpoints return responses in the following format:

```json
{
  "success": true,
  "data": { /* endpoint-specific data */ },
  "meta": {
    "requestId": "req_abc123xyz"
  }
}
```

### Error Response Format

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": { /* optional additional context */ }
  },
  "meta": {
    "requestId": "req_abc123xyz"
  }
}
```

## Table of Contents

1. [Semantic Search](#semantic-search) (Phase 3 & 4)
2. [Projects & Multi-Repository](#projects--multi-repository) (Phase 2)
3. [Graph Operations](#graph-operations)
4. [Code Analysis](#code-analysis)
5. [System & Agents](#system--agents)
6. [Lerna Workspace](#lerna-workspace)

---

## Semantic Search

Semantic code search using Voyage AI embeddings (Phase 3) with optional re-ranking (Phase 4).

### POST /api/semantic/search

Search code semantically using natural language queries with optional two-stage retrieval.

**Request Body:**

```json
{
  "query": "authentication middleware with JWT",
  "limit": 10,
  "useReranker": true,
  "rerankTopK": 30
}
```

**Parameters:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `query` | string | Yes | - | Natural language search query |
| `limit` | number | No | 10 | Maximum results to return |
| `useReranker` | boolean | No | false | Enable two-stage retrieval with re-ranking (Phase 4) |
| `rerankTopK` | number | No | limit*2 | Number of candidates to re-rank (should be 2-3x limit) |

**Response:**

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "entity_123",
        "score": 0.92,
        "source": "semantic",
        "content": "export function authenticate(req: Request) { ... }",
        "metadata": {
          "name": "authenticate",
          "type": "function",
          "filePath": "/src/middleware/auth.ts",
          "lineNumber": 15,
          "rerankScore": 0.92,
          "originalScore": 0.78
        }
      }
    ],
    "total": 1,
    "query": "authentication middleware with JWT"
  },
  "meta": {
    "requestId": "req_abc123"
  }
}
```

**Usage Examples:**

```bash
# Basic semantic search
curl -X POST http://localhost:3000/api/semantic/search \
  -H "Content-Type: application/json" \
  -d '{"query": "error handling functions", "limit": 5}'

# With re-ranking for improved relevance
curl -X POST http://localhost:3000/api/semantic/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "database connection pooling",
    "limit": 10,
    "useReranker": true,
    "rerankTopK": 30
  }'
```

**Performance Tips:**

- Enable `useReranker` for better result quality (Phase 4)
- Set `rerankTopK` to 2-3x your `limit` for optimal quality/speed tradeoff
- Typical response time: 100-300ms without reranker, 300-600ms with reranker

---

### POST /api/semantic/similar

Find code similar to a given code snippet using embedding similarity.

**Request Body:**

```json
{
  "code": "function validateEmail(email: string) { return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email); }",
  "threshold": 0.7,
  "limit": 10
}
```

**Parameters:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `code` | string | Yes | - | Code snippet to find similar code for |
| `threshold` | number | No | 0.5 | Minimum similarity score (0-1) |
| `limit` | number | No | 10 | Maximum results to return |

**Response:**

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "entity_456",
        "score": 0.85,
        "source": "semantic",
        "content": "export const isValidEmail = (email) => /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email);",
        "metadata": {
          "name": "isValidEmail",
          "type": "function",
          "filePath": "/src/utils/validators.ts"
        }
      }
    ]
  },
  "meta": {
    "requestId": "req_def456"
  }
}
```

**Use Cases:**

- Find duplicate or similar code across the codebase
- Identify potential refactoring opportunities
- Locate alternative implementations

---

### POST /api/semantic/cross-language

Search across multiple programming languages using semantic understanding.

**Request Body:**

```json
{
  "query": "HTTP request handler",
  "languages": ["typescript", "javascript", "python"]
}
```

**Parameters:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `query` | string | Yes | - | Search query |
| `languages` | string[] | No | all | Programming languages to search in |

**Response:**

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "entity_789",
        "score": 0.88,
        "language": "typescript",
        "content": "async function handleRequest(req: Request, res: Response) { ... }",
        "metadata": {
          "name": "handleRequest",
          "filePath": "/src/handlers/api.ts"
        }
      }
    ]
  },
  "meta": {
    "requestId": "req_ghi789"
  }
}
```

---

### POST /api/semantic/related

Find concepts related to a specific entity using semantic relationships.

**Request Body:**

```json
{
  "entityId": "entity_123",
  "limit": 10
}
```

**Parameters:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `entityId` | string | Yes | - | Entity ID to find related concepts for |
| `limit` | number | No | 10 | Maximum results to return |

**Response:**

```json
{
  "success": true,
  "data": {
    "entity": {
      "id": "entity_123",
      "name": "UserService"
    },
    "relatedConcepts": [
      {
        "id": "entity_456",
        "name": "AuthService",
        "relationshipType": "semantic_similar",
        "score": 0.82
      }
    ]
  },
  "meta": {
    "requestId": "req_jkl012"
  }
}
```

---

## Projects & Multi-Repository

Multi-repository project management introduced in Phase 2.

### POST /api/projects

Create a new project to group multiple repositories.

**Request Body:**

```json
{
  "name": "E-Commerce Platform",
  "description": "Main e-commerce application with microservices",
  "metadata": {
    "owner": "engineering-team",
    "tags": ["production", "critical"],
    "settings": {
      "autoIndex": true
    }
  }
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Project name (1-255 chars) |
| `description` | string | No | Project description |
| `metadata` | object | No | Additional metadata (owner, tags, settings) |

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "proj_abc123",
    "name": "E-Commerce Platform",
    "description": "Main e-commerce application with microservices",
    "created_at": 1699564800000,
    "updated_at": 1699564800000,
    "metadata": {
      "owner": "engineering-team",
      "tags": ["production", "critical"]
    }
  },
  "meta": {
    "requestId": "req_mno345"
  }
}
```

---

### GET /api/projects

List all projects with optional filtering and pagination.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `name` | string | - | Filter by name (partial match) |
| `tag` | string | - | Filter by tag |
| `limit` | number | 100 | Maximum results (1-1000) |
| `offset` | number | 0 | Pagination offset |

**Example Request:**

```bash
curl "http://localhost:3000/api/projects?tag=production&limit=20"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": "proj_abc123",
        "name": "E-Commerce Platform",
        "description": "Main application",
        "created_at": 1699564800000,
        "repository_count": 5
      }
    ],
    "total": 1,
    "limit": 20,
    "offset": 0
  },
  "meta": {
    "requestId": "req_pqr678"
  }
}
```

---

### GET /api/projects/:id

Get detailed information about a specific project.

**Example Request:**

```bash
curl "http://localhost:3000/api/projects/proj_abc123"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "proj_abc123",
    "name": "E-Commerce Platform",
    "description": "Main e-commerce application",
    "created_at": 1699564800000,
    "updated_at": 1699564800000,
    "metadata": {
      "owner": "engineering-team",
      "tags": ["production"]
    },
    "repositories": [
      {
        "id": "repo_xyz789",
        "repository_path": "/home/repos/frontend",
        "repository_name": "frontend",
        "added_at": 1699564900000
      }
    ],
    "stats": {
      "total_files": 342,
      "total_entities": 1523,
      "languages": ["typescript", "javascript"]
    }
  },
  "meta": {
    "requestId": "req_stu901"
  }
}
```

---

### PATCH /api/projects/:id

Update an existing project's metadata.

**Request Body:**

```json
{
  "description": "Updated description",
  "metadata": {
    "tags": ["production", "monitored"]
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "proj_abc123",
    "name": "E-Commerce Platform",
    "description": "Updated description",
    "updated_at": 1699565000000
  },
  "meta": {
    "requestId": "req_vwx234"
  }
}
```

---

### DELETE /api/projects/:id

Delete a project and all its associations (repositories are not deleted from disk).

**Example Request:**

```bash
curl -X DELETE "http://localhost:3000/api/projects/proj_abc123"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "deleted": true
  },
  "meta": {
    "requestId": "req_yza567"
  }
}
```

---

### POST /api/projects/:id/repositories

Add a repository to an existing project.

**Request Body:**

```json
{
  "repository_path": "/home/user/repos/backend-api",
  "repository_name": "Backend API",
  "metadata": {
    "branch": "main",
    "commit": "abc123def"
  }
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `repository_path` | string | Yes | Absolute path to repository |
| `repository_name` | string | No | Display name for repository |
| `metadata` | object | No | Branch, commit, or other metadata |

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "repo_def456",
    "project_id": "proj_abc123",
    "repository_path": "/home/user/repos/backend-api",
    "repository_name": "Backend API",
    "added_at": 1699565100000,
    "metadata": {
      "branch": "main"
    }
  },
  "meta": {
    "requestId": "req_bcd890"
  }
}
```

---

### GET /api/projects/:id/repositories

List all repositories in a project.

**Response:**

```json
{
  "success": true,
  "data": {
    "repositories": [
      {
        "id": "repo_xyz789",
        "repository_path": "/home/repos/frontend",
        "repository_name": "Frontend",
        "added_at": 1699564900000
      }
    ],
    "total": 1
  },
  "meta": {
    "requestId": "req_efg123"
  }
}
```

---

### DELETE /api/projects/:projectId/repositories/:repositoryId

Remove a repository from a project (repository files are not deleted).

**Example Request:**

```bash
curl -X DELETE "http://localhost:3000/api/projects/proj_abc123/repositories/repo_xyz789"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "deleted": true
  },
  "meta": {
    "requestId": "req_hij456"
  }
}
```

---

### POST /api/projects/:id/search

Search across all repositories in a project using semantic or structural search.

**Request Body:**

```json
{
  "query": "user authentication logic",
  "repositories": ["/home/repos/backend-api", "/home/repos/auth-service"],
  "file_types": ["ts", "js"],
  "min_score": 0.6,
  "limit": 20
}
```

**Parameters:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `query` | string | Yes | - | Search query |
| `repositories` | string[] | No | all | Filter to specific repository paths |
| `file_types` | string[] | No | all | Filter by file extensions |
| `min_score` | number | No | 0 | Minimum similarity score (0-1) |
| `limit` | number | No | 10 | Maximum results (1-100) |

**Response:**

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "entity_multi_123",
        "score": 0.87,
        "repository": "/home/repos/backend-api",
        "content": "export async function authenticateUser(credentials) { ... }",
        "metadata": {
          "name": "authenticateUser",
          "filePath": "/home/repos/backend-api/src/auth.ts"
        }
      }
    ],
    "total": 1,
    "project_id": "proj_abc123",
    "query": "user authentication logic"
  },
  "meta": {
    "requestId": "req_klm789"
  }
}
```

---

### GET /api/projects/:id/stats

Get comprehensive statistics for a project across all repositories.

**Response:**

```json
{
  "success": true,
  "data": {
    "project_id": "proj_abc123",
    "repository_count": 3,
    "total_files": 856,
    "total_entities": 3421,
    "total_relationships": 12043,
    "languages": {
      "typescript": 542,
      "javascript": 214,
      "python": 100
    },
    "entity_types": {
      "function": 1523,
      "class": 421,
      "interface": 387
    },
    "largest_repository": {
      "path": "/home/repos/backend-api",
      "entities": 1842
    }
  },
  "meta": {
    "requestId": "req_nop012"
  }
}
```

---

## Graph Operations

Code graph operations for querying and analyzing code structure.

### POST /api/graph/entities/list

List all entities in a specific file.

**Request Body:**

```json
{
  "filePath": "/src/services/user-service.ts",
  "entityTypes": ["class", "function", "interface"]
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `filePath` | string | Yes | Path to the file |
| `entityTypes` | string[] | No | Filter by entity types |

**Response:**

```json
{
  "success": true,
  "data": {
    "entities": [
      {
        "id": "entity_qrs345",
        "name": "UserService",
        "type": "class",
        "filePath": "/src/services/user-service.ts",
        "lineNumber": 10,
        "metadata": {
          "methods": ["createUser", "deleteUser"]
        }
      }
    ],
    "total": 1,
    "filePath": "/src/services/user-service.ts"
  },
  "meta": {
    "requestId": "req_tuv678"
  }
}
```

---

### POST /api/graph/relationships/list

List relationships for a specific entity.

**Request Body:**

```json
{
  "entityName": "UserService",
  "filePath": "/src/services/user-service.ts",
  "depth": 2,
  "relationshipTypes": ["imports", "calls", "extends"]
}
```

**Parameters:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `entityId` | string | No* | - | Exact entity ID |
| `entityName` | string | No* | - | Entity name (requires filePath hint) |
| `filePath` | string | No | - | File path to disambiguate entity |
| `depth` | number | No | 1 | Relationship traversal depth |
| `relationshipTypes` | string[] | No | all | Types of relationships to include |

*Either `entityId` or `entityName` is required.

**Response:**

```json
{
  "success": true,
  "data": {
    "entity": {
      "id": "entity_qrs345",
      "name": "UserService"
    },
    "relationships": [
      {
        "type": "imports",
        "target": {
          "id": "entity_wxy901",
          "name": "DatabaseService",
          "filePath": "/src/services/database.ts"
        }
      },
      {
        "type": "calls",
        "target": {
          "id": "entity_zab234",
          "name": "validateUser",
          "filePath": "/src/utils/validators.ts"
        }
      }
    ],
    "depth": 2
  },
  "meta": {
    "requestId": "req_cde567"
  }
}
```

---

### POST /api/graph/query

Execute a natural language or structured query against the code graph.

**Request Body:**

```json
{
  "query": "all functions that call the database",
  "limit": 50
}
```

**Parameters:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `query` | string | Yes | - | Natural language or structured query |
| `limit` | number | No | 10 | Maximum results |

**Response:**

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "entity_fgh890",
        "name": "fetchUserData",
        "type": "function",
        "score": 0.91,
        "explanation": "Matches: calls database"
      }
    ],
    "query": "all functions that call the database",
    "total": 1
  },
  "meta": {
    "requestId": "req_ijk123"
  }
}
```

---

### POST /api/graph/get

Get a snapshot of the code graph with optional filtering.

**Request Body:**

```json
{
  "query": "UserService",
  "limit": 100
}
```

**Parameters:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `query` | string | No | - | Optional search query to filter results |
| `limit` | number | No | 100 | Maximum entities to return |

**Response:**

```json
{
  "success": true,
  "data": {
    "entities": [
      {
        "id": "entity_lmn456",
        "name": "UserService",
        "type": "class"
      }
    ],
    "relationships": [
      {
        "source": "entity_lmn456",
        "target": "entity_opq789",
        "type": "imports"
      }
    ],
    "stats": {
      "entityCount": 1,
      "relationshipCount": 1
    }
  },
  "meta": {
    "requestId": "req_rst012"
  }
}
```

---

### GET /api/graph/stats

Get comprehensive statistics about the code graph.

**Response:**

```json
{
  "success": true,
  "data": {
    "totalEntities": 3421,
    "totalRelationships": 12043,
    "entityTypes": {
      "function": 1523,
      "class": 421,
      "interface": 387,
      "variable": 890,
      "type": 200
    },
    "relationshipTypes": {
      "imports": 3204,
      "calls": 5621,
      "extends": 142,
      "implements": 98
    },
    "fileCount": 342,
    "avgEntitiesPerFile": 10.0
  },
  "meta": {
    "requestId": "req_uvw345"
  }
}
```

---

### GET /api/graph/health

Check the health status of the code graph.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `minEntities` | number | 1 | Minimum entity count for healthy status |
| `minRelationships` | number | 0 | Minimum relationship count |
| `sample` | number | 1 | Sample size for verification |

**Example Request:**

```bash
curl "http://localhost:3000/api/graph/health?minEntities=100"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "checks": {
      "entityCount": {
        "status": "pass",
        "value": 3421,
        "threshold": 100
      },
      "relationshipCount": {
        "status": "pass",
        "value": 12043,
        "threshold": 0
      },
      "sampleRead": {
        "status": "pass",
        "samplesRead": 1
      }
    },
    "timestamp": 1699565200000
  },
  "meta": {
    "requestId": "req_xyz678"
  }
}
```

---

### POST /api/graph/reset

Clear all graph data (useful for re-indexing).

**⚠️ Warning:** This operation is destructive and cannot be undone.

**Example Request:**

```bash
curl -X POST "http://localhost:3000/api/graph/reset"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "cleared": true,
    "message": "Graph data has been reset"
  },
  "meta": {
    "requestId": "req_abc901"
  }
}
```

---

## Code Analysis

Advanced code analysis operations including impact analysis, clone detection, and refactoring suggestions.

### POST /api/analysis/impact

Analyze the impact of changes to a specific entity.

**Request Body:**

```json
{
  "entityId": "entity_def234",
  "filePath": "/src/services/user-service.ts",
  "depth": 3
}
```

**Parameters:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `entityId` | string | Yes | - | Entity ID or name to analyze |
| `filePath` | string | No | - | File path hint to disambiguate |
| `depth` | number | No | 2 | Depth of impact analysis |

**Response:**

```json
{
  "success": true,
  "data": {
    "entity": {
      "id": "entity_def234",
      "name": "UserService",
      "filePath": "/src/services/user-service.ts"
    },
    "impactedEntities": [
      {
        "id": "entity_ghi567",
        "name": "AuthController",
        "filePath": "/src/controllers/auth.ts",
        "impactLevel": "high",
        "relationshipPath": ["imports", "calls"]
      },
      {
        "id": "entity_jkl890",
        "name": "UserRepository",
        "filePath": "/src/repositories/user.ts",
        "impactLevel": "medium",
        "relationshipPath": ["extends"]
      }
    ],
    "summary": {
      "totalImpacted": 2,
      "highImpact": 1,
      "mediumImpact": 1,
      "lowImpact": 0
    },
    "depth": 3
  },
  "meta": {
    "requestId": "req_mno123"
  }
}
```

**Use Cases:**

- Assess risk before making changes
- Identify which tests need to run
- Plan refactoring efforts

---

### POST /api/analysis/clones

Detect code clones using semantic similarity.

**Request Body:**

```json
{
  "minSimilarity": 0.85,
  "scope": "all"
}
```

**Parameters:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `minSimilarity` | number | No | 0.8 | Minimum similarity threshold (0-1) |
| `scope` | string | No | "all" | Scope: "all", "file", or "module" |

**Response:**

```json
{
  "success": true,
  "data": {
    "cloneGroups": [
      {
        "similarity": 0.92,
        "instances": [
          {
            "entityId": "entity_pqr456",
            "filePath": "/src/utils/validators.ts",
            "lineNumber": 10,
            "code": "function validateEmail(email) { ... }"
          },
          {
            "entityId": "entity_stu789",
            "filePath": "/src/services/user.ts",
            "lineNumber": 45,
            "code": "const isEmailValid = (email) => { ... }"
          }
        ]
      }
    ],
    "totalGroups": 1,
    "totalInstances": 2,
    "minSimilarity": 0.85
  },
  "meta": {
    "requestId": "req_vwx012"
  }
}
```

---

### POST /api/analysis/jscpd-clones

Detect code clones using JSCPD (token-based analysis).

**Request Body:**

```json
{
  "paths": ["/src", "/lib"],
  "formats": ["typescript", "javascript"],
  "minLines": 5,
  "minTokens": 50,
  "ignoreCase": true,
  "ignore": ["**/*.test.ts", "**/*.spec.ts"]
}
```

**Parameters:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `paths` | string[] | No | ["."] | Directories or files to scan |
| `pattern` | string | No | - | Glob pattern to apply |
| `ignore` | string[] | No | [] | Glob patterns to exclude |
| `formats` | string[] | No | all | File extensions to include |
| `minLines` | number | No | 5 | Minimum lines per clone block |
| `maxLines` | number | No | 500 | Maximum lines per clone block |
| `minTokens` | number | No | 50 | Minimum tokens per clone |
| `ignoreCase` | boolean | No | false | Lowercase tokens before comparison |

**Response:**

```json
{
  "success": true,
  "data": {
    "duplicates": [
      {
        "format": "typescript",
        "lines": 12,
        "tokens": 67,
        "firstFile": {
          "name": "/src/utils/helpers.ts",
          "start": 15,
          "end": 27,
          "fragment": "export function parseConfig(data) { ... }"
        },
        "secondFile": {
          "name": "/src/services/config.ts",
          "start": 32,
          "end": 44,
          "fragment": "function loadConfig(data) { ... }"
        }
      }
    ],
    "statistics": {
      "total": {
        "clones": 1,
        "duplicatedLines": 24,
        "duplicatedTokens": 134
      },
      "formats": {
        "typescript": {
          "clones": 1,
          "duplicatedLines": 24
        }
      }
    }
  },
  "meta": {
    "requestId": "req_yza345"
  }
}
```

---

### POST /api/analysis/refactoring

Get AI-powered refactoring suggestions for code.

**Request Body:**

```json
{
  "filePath": "/src/services/user-service.ts",
  "focusArea": "UserService",
  "startLine": 10,
  "endLine": 50
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `filePath` | string | Yes | File to analyze |
| `focusArea` | string | No | Entity name to focus on |
| `entityId` | string | No | Exact entity ID to analyze |
| `startLine` | number | No | 1-based start line |
| `endLine` | number | No | 1-based end line (exclusive) |

**Response:**

```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "type": "extract_method",
        "priority": "high",
        "title": "Extract validation logic",
        "description": "The user validation logic can be extracted into a separate method",
        "location": {
          "startLine": 15,
          "endLine": 25
        },
        "reason": "Improves readability and reusability",
        "estimatedImpact": "medium"
      },
      {
        "type": "simplify",
        "priority": "low",
        "title": "Simplify conditional logic",
        "description": "Nested if statements can be flattened",
        "location": {
          "startLine": 30,
          "endLine": 40
        }
      }
    ],
    "filePath": "/src/services/user-service.ts",
    "totalSuggestions": 2
  },
  "meta": {
    "requestId": "req_bcd678"
  }
}
```

---

### POST /api/analysis/hotspots

Identify code hotspots based on complexity, changes, or coupling.

**Request Body:**

```json
{
  "metric": "complexity",
  "limit": 10
}
```

**Parameters:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `metric` | string | No | "complexity" | Metric: "complexity", "changes", or "coupling" |
| `limit` | number | No | 10 | Maximum hotspots to return |

**Response:**

```json
{
  "success": true,
  "data": {
    "hotspots": [
      {
        "entityId": "entity_efg901",
        "name": "processPayment",
        "filePath": "/src/services/payment.ts",
        "metric": "complexity",
        "score": 45,
        "severity": "critical",
        "details": {
          "cyclomaticComplexity": 23,
          "cognitiveComplexity": 22,
          "linesOfCode": 156
        }
      }
    ],
    "metric": "complexity",
    "threshold": 15,
    "totalHotspots": 1
  },
  "meta": {
    "requestId": "req_hij234"
  }
}
```

**Metrics Explained:**

- **complexity**: Cyclomatic and cognitive complexity
- **changes**: Frequency of changes (requires git history)
- **coupling**: Number of dependencies and dependents

---

## System & Agents

System information, agent metrics, and knowledge bus operations.

### GET /api/agents/metrics

Get performance metrics for code analysis agents.

**Response:**

```json
{
  "success": true,
  "data": {
    "agents": [
      {
        "name": "SemanticSearchAgent",
        "status": "active",
        "metrics": {
          "totalQueries": 1523,
          "avgResponseTime": 245,
          "successRate": 0.98,
          "cacheHitRate": 0.62
        }
      }
    ],
    "system": {
      "uptime": 86400000,
      "memoryUsage": {
        "heapUsed": 145678912,
        "heapTotal": 268435456
      }
    }
  },
  "meta": {
    "requestId": "req_klm567"
  }
}
```

---

### GET /api/system/metrics

Get overall system performance metrics.

**Response:**

```json
{
  "success": true,
  "data": {
    "process": {
      "uptime": 86400,
      "memory": {
        "rss": 187654320,
        "heapTotal": 268435456,
        "heapUsed": 145678912
      },
      "cpu": {
        "user": 34567,
        "system": 12345
      }
    },
    "database": {
      "size": 524288000,
      "connections": 5
    },
    "requests": {
      "total": 5421,
      "avgResponseTime": 156,
      "errorRate": 0.02
    }
  },
  "meta": {
    "requestId": "req_nop890"
  }
}
```

---

### GET /api/system/version

Get version and build information.

**Response:**

```json
{
  "success": true,
  "data": {
    "version": "1.0.0",
    "buildDate": "2024-11-14",
    "nodeVersion": "v20.10.0",
    "features": {
      "phase1": "HTTP REST API",
      "phase2": "Multi-repository support",
      "phase3": "Voyage AI embeddings (1024-d)",
      "phase4": "Voyage AI re-ranker"
    }
  },
  "meta": {
    "requestId": "req_qrs123"
  }
}
```

---

### GET /api/bus/stats

Get statistics for the knowledge bus (pub/sub system).

**Response:**

```json
{
  "success": true,
  "data": {
    "topics": [
      {
        "name": "semantic:warmup:entities",
        "subscribers": 2,
        "messageCount": 156
      },
      {
        "name": "graph:update",
        "subscribers": 1,
        "messageCount": 42
      }
    ],
    "totalTopics": 2,
    "totalMessages": 198
  },
  "meta": {
    "requestId": "req_tuv456"
  }
}
```

---

### POST /api/bus/clear

Clear a specific knowledge bus topic.

**Request Body:**

```json
{
  "topic": "semantic:warmup:entities"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "topic": "semantic:warmup:entities",
    "cleared": true,
    "messagesCleared": 156
  },
  "meta": {
    "requestId": "req_wxy789"
  }
}
```

---

## Lerna Workspace

Operations for Lerna monorepo workspaces.

### POST /api/lerna/graph

Generate and optionally ingest a Lerna project graph.

**Request Body:**

```json
{
  "directory": "/path/to/lerna-workspace",
  "ingest": true,
  "force": false
}
```

**Parameters:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `directory` | string | No | current | Workspace directory |
| `ingest` | boolean | No | false | Store graph in graph storage |
| `force` | boolean | No | false | Bypass caches and regenerate |

**Response:**

```json
{
  "success": true,
  "data": {
    "workspace": {
      "root": "/path/to/lerna-workspace",
      "packageCount": 12
    },
    "packages": [
      {
        "name": "@myorg/core",
        "version": "1.0.0",
        "location": "packages/core",
        "dependencies": ["@myorg/utils"]
      }
    ],
    "graph": {
      "nodes": 12,
      "edges": 23
    },
    "ingested": true
  },
  "meta": {
    "requestId": "req_zab012"
  }
}
```

---

## Error Codes

Common error codes returned by the API:

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `NOT_FOUND` | 404 | Resource not found |
| `PROJECT_NOT_FOUND` | 404 | Project does not exist |
| `REPOSITORY_NOT_FOUND` | 404 | Repository not found |
| `ENTITY_NOT_FOUND` | 404 | Entity not found |
| `SEMANTIC_SEARCH_DISABLED` | 503 | Semantic search not configured |
| `RERANKER_DISABLED` | 503 | Re-ranker not enabled |
| `EMBEDDING_ERROR` | 500 | Embedding generation failed |
| `GRAPH_ERROR` | 500 | Graph operation failed |
| `INTERNAL_ERROR` | 500 | Unexpected internal error |

---

## Rate Limiting & Performance

### Best Practices

1. **Batch Requests**: Group multiple queries when possible
2. **Use Appropriate Limits**: Start with small limits (10-20) and increase if needed
3. **Enable Re-ranking Selectively**: Use only when result quality is critical
4. **Cache Results**: Cache search results on the client side when appropriate
5. **Monitor requestId**: Use for debugging and support requests

### Performance Guidelines

| Operation | Typical Response Time | Notes |
|-----------|----------------------|-------|
| Semantic Search (no rerank) | 100-300ms | Depends on result limit |
| Semantic Search (with rerank) | 300-600ms | Phase 4 feature |
| Graph Query | 50-150ms | Simple queries |
| Impact Analysis | 200-500ms | Depends on depth |
| Clone Detection (semantic) | 500-2000ms | Scans entire codebase |
| Clone Detection (JSCPD) | 1000-5000ms | Token-based analysis |

---

## Support & Resources

- **Documentation**: See `N8N_INTEGRATION_GUIDE.md` for n8n workflows
- **Swagger UI**: Available at `http://localhost:3000/api-docs`
- **Health Check**: `GET http://localhost:3000/health`
- **OpenAPI Spec**: `GET http://localhost:3000/api-docs.json`

---

## Changelog

### Phase 4 (Current)
- Added Voyage AI re-ranker for two-stage retrieval
- Enhanced semantic search with `useReranker` option
- Added `rerankTopK` parameter for quality/performance tuning

### Phase 3
- Integrated Voyage AI embeddings (1024 dimensions)
- Semantic search with `voyage-code-3` model
- Cross-language semantic search

### Phase 2
- Multi-repository project management
- Cross-repository search capabilities
- Project statistics and repository grouping

### Phase 1
- Initial HTTP REST API
- Graph operations and analysis
- Lerna workspace support
