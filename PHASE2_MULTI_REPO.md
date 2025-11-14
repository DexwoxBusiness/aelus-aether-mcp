# Phase 2: Multi-Repository Support

This document describes the multi-repository support added in Phase 2 of the Code Graph RAG transformation.

## Overview

Phase 2 adds the ability to manage multiple repositories under a single project, enabling cross-repository code analysis and search capabilities.

## Features

### 1. Project Management

Projects are containers for multiple repositories:

- Create, read, update, and delete projects
- Add/remove repositories to/from projects
- Track project statistics (repository count, entity count, file count, etc.)
- Project metadata for tags, owner, settings

### 2. Database Schema Changes

**New Tables:**
- `projects` - Store project information
- `project_repositories` - Track repositories within projects
- `project_stats` - View for quick project insights

**Enhanced Tables:**
- `entities` - Added `project_id` column
- `relationships` - Added `project_id` column
- `files` - Added `project_id` column
- `embeddings` - Added `project_id` column

All tables are properly indexed for efficient project-based queries.

### 3. API Endpoints

#### Project Management

**Create Project**
```bash
POST /api/projects
{
  "name": "My Multi-Repo Project",
  "description": "Frontend and backend repositories",
  "metadata": {
    "owner": "team-name",
    "tags": ["production", "microservices"]
  }
}
```

**List Projects**
```bash
GET /api/projects?name=frontend&limit=10&offset=0
```

**Get Project**
```bash
GET /api/projects/:id
```

**Update Project**
```bash
PATCH /api/projects/:id
{
  "name": "Updated Name",
  "metadata": { "tags": ["staging"] }
}
```

**Delete Project**
```bash
DELETE /api/projects/:id
```

**Get Project Statistics**
```bash
GET /api/projects/:id/stats
```

#### Repository Management

**Add Repository to Project**
```bash
POST /api/projects/:id/repositories
{
  "repository_path": "/path/to/frontend-repo",
  "repository_name": "Frontend App",
  "metadata": {
    "branch": "main",
    "commit": "abc123"
  }
}
```

**List Repositories in Project**
```bash
GET /api/projects/:id/repositories
```

**Remove Repository from Project**
```bash
DELETE /api/projects/:projectId/repositories/:repositoryId
```

#### Cross-Repository Search

**Search Across All Repositories**
```bash
POST /api/projects/:id/search
{
  "query": "authentication",
  "repositories": ["/path/to/repo1", "/path/to/repo2"],
  "file_types": ["ts", "js"],
  "limit": 20
}
```

## Implementation Details

### ProjectManager Class

Location: `src/core/project-manager.ts`

The `ProjectManager` class provides:
- Project CRUD operations
- Repository management within projects
- Cross-repository search
- Project statistics

**Example Usage:**
```typescript
import { ProjectManager } from './core/project-manager.js';
import { SQLiteManager } from './storage/sqlite-manager.js';

const sqliteManager = new SQLiteManager();
const projectManager = new ProjectManager(sqliteManager);

// Create a project
const project = projectManager.createProject({
  name: "My Project",
  description: "Multi-repo project"
});

// Add repositories
const repo1 = projectManager.addRepository(project.id, {
  repository_path: "/path/to/repo1",
  repository_name: "Repo 1"
});

// Search across repositories
const results = await projectManager.searchAcrossRepos({
  project_id: project.id,
  query: "getUserProfile",
  limit: 10
});
```

### Database Migration

The schema migration (version 3) is automatically applied when the server starts.

**Migration includes:**
1. Create `projects` table
2. Create `project_repositories` table
3. Add `project_id` column to existing tables
4. Create indexes for efficient querying
5. Create `project_stats` view

### Type Definitions

Location: `src/types/project.ts`

Key types:
- `Project` - Project entity
- `ProjectRepository` - Repository within a project
- `ProjectStats` - Project statistics
- `CreateProjectInput` - Create project payload
- `UpdateProjectInput` - Update project payload
- `AddRepositoryInput` - Add repository payload
- `CrossRepoSearchOptions` - Cross-repo search options

## Usage Example

### 1. Create a Multi-Repo Project

```bash
# Create project
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "E-Commerce Platform",
    "description": "Frontend, Backend, and Mobile repositories",
    "metadata": {
      "owner": "platform-team",
      "tags": ["production", "e-commerce"]
    }
  }'

# Response
{
  "success": true,
  "data": {
    "id": "proj_abc123",
    "name": "E-Commerce Platform",
    "description": "Frontend, Backend, and Mobile repositories",
    "created_at": 1234567890,
    "updated_at": 1234567890,
    "metadata": {
      "owner": "platform-team",
      "tags": ["production", "e-commerce"]
    }
  }
}
```

### 2. Add Repositories

```bash
# Add frontend repository
curl -X POST http://localhost:3000/api/projects/proj_abc123/repositories \
  -H "Content-Type: application/json" \
  -d '{
    "repository_path": "/home/user/projects/frontend",
    "repository_name": "Frontend App",
    "metadata": {
      "branch": "main"
    }
  }'

# Add backend repository
curl -X POST http://localhost:3000/api/projects/proj_abc123/repositories \
  -H "Content-Type: application/json" \
  -d '{
    "repository_path": "/home/user/projects/backend",
    "repository_name": "Backend API"
  }'
```

### 3. Index Repositories

```bash
# Index frontend (will use project_id automatically)
curl -X POST http://localhost:3000/api/index \
  -H "Content-Type: application/json" \
  -d '{
    "directory": "/home/user/projects/frontend",
    "project_id": "proj_abc123"
  }'

# Index backend
curl -X POST http://localhost:3000/api/index \
  -H "Content-Type: application/json" \
  -d '{
    "directory": "/home/user/projects/backend",
    "project_id": "proj_abc123"
  }'
```

### 4. Search Across Repositories

```bash
# Search for authentication code across both repos
curl -X POST http://localhost:3000/api/projects/proj_abc123/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "authentication",
    "limit": 10,
    "file_types": ["ts", "js"]
  }'
```

### 5. Get Project Statistics

```bash
curl http://localhost:3000/api/projects/proj_abc123/stats

# Response
{
  "success": true,
  "data": {
    "project_id": "proj_abc123",
    "project_name": "E-Commerce Platform",
    "repository_count": 2,
    "entity_count": 1543,
    "file_count": 287,
    "embedding_count": 1543,
    "last_indexed": 1234567890
  }
}
```

## Next Steps (Phase 3 & 4)

### Phase 3: Voyage AI Integration
- Add `VoyageProvider` for better embeddings (1024-d)
- Support `voyage-code-3` model
- Migration path from 384-d to 1024-d embeddings

### Phase 4: Re-Ranker
- Implement `VoyageReranker` for search result re-ranking
- Use `rerank-2` model
- Improve cross-repository search relevance

## Migration from Single-Repo

If you have existing data from Phase 1:

1. **Automatic Migration**: Database schema will be automatically upgraded to version 3
2. **Existing Data**: Existing entities will have `project_id = NULL` (backward compatible)
3. **Create Projects**: Create projects for existing data and update `project_id`

```bash
# Create a project for existing data
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Legacy Project",
    "description": "Migrated from single-repo setup"
  }'

# Update entities to associate with project (would need custom SQL or API endpoint)
```

## Technical Notes

- All `project_id` columns are nullable for backward compatibility
- Foreign key constraints ensure referential integrity
- Cascade deletes: Deleting a project removes all associated repositories and data
- Indexes optimize project-filtered queries
- Cross-repo search is currently basic FTS - will be enhanced with semantic search and re-ranking in Phase 4

## Testing

```bash
# Run type checking
npm run typecheck

# Build project
npm run build

# Start HTTP server
MCP_SERVER_DIR=/path/to/codebase npm run http

# Access API documentation
open http://localhost:3000/api-docs
```

## Files Changed

### New Files
- `src/storage/schema-migrations.ts` - Added migration version 3
- `src/types/project.ts` - Project type definitions
- `src/core/project-manager.ts` - ProjectManager class
- `src/http/routes/projects.ts` - Project HTTP routes

### Modified Files
- `src/http/server.ts` - Added projects routes
- Database schema - Added project tables and columns

## API Documentation

Full API documentation with request/response schemas is available at:
```
http://localhost:3000/api-docs
```

Navigate to the "Projects" section for detailed endpoint documentation.
