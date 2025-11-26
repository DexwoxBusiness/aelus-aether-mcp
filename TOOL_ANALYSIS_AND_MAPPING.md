# MCP Tool Analysis & Product Intelligence Mapping

## Objective
Analyze existing 24 MCP tools and map them against proposed Product Intelligence features to:
- Avoid duplication
- Identify gaps
- Determine what needs enhancement vs. new implementation
- Consolidate tool set efficiently

---

## Existing 24 MCP Tools Analysis

### Category 1: Indexing & Core (4 tools)

| Tool | Schema | Current Capabilities | Product Intelligence Fit |
|------|--------|---------------------|-------------------------|
| **index** | `directory`, `incremental`, `reset`, `excludePatterns` | Index codebase using tree-sitter parsing | ✅ **ENHANCE**: Add `product_id` parameter for project-aware indexing |
| **list_file_entities** | `filePath`, `entityTypes` | List entities in a file (functions, classes, imports) | ✅ **KEEP**: Useful for entity discovery |
| **list_entity_relationships** | `entityId/entityName`, `filePath`, `depth` | List relationships for an entity | ✅ **ENHANCE**: Add `product_id` filter |
| **query** | `query`, `limit` | Natural language graph queries | ✅ **ENHANCE**: Add `product_id` filter |

**Gap Analysis:**
- ❌ No product/project management
- ❌ No cross-repo import detection during indexing
- ❌ No API endpoint detection
- ❌ No data model extraction

---

### Category 2: Semantic Search (4 tools)

| Tool | Schema | Current Capabilities | Product Intelligence Fit |
|------|--------|---------------------|-------------------------|
| **semantic_search** | `query`, `limit` | Natural language code search using embeddings | ✅ **ENHANCE**: Add `product_id` filter for cross-repo search |
| **find_similar_code** | `code`, `threshold`, `limit` | Find similar code snippets | ✅ **ENHANCE**: Add `product_id` to scope to product |
| **cross_language_search** | `query`, `languages` | Search across multiple languages | ✅ **ENHANCE**: Add `product_id` for multi-repo search |
| **find_related_concepts** | `entityId`, `limit` | Find conceptually related code | ✅ **ENHANCE**: Useful for feature boundary detection |

**Gap Analysis:**
- ❌ No business concept extraction (e.g., "authentication" feature)
- ❌ No data flow semantic understanding

---

### Category 3: Code Analysis (6 tools)

| Tool | Schema | Current Capabilities | Product Intelligence Fit |
|------|--------|---------------------|-------------------------|
| **analyze_code_impact** | `entityId`, `filePath`, `depth` | Impact analysis (direct & indirect dependencies) | ✅ **ENHANCE**: Add `product_id` for cross-repo impact |
| **detect_code_clones** | `minSimilarity`, `scope` | Semantic clone detection | ✅ **ENHANCE**: Add `product_id` for cross-repo clones |
| **jscpd_detect_clones** | `paths`, `patterns`, `minLines`, `minTokens` | Token-based clone detection | ✅ **KEEP**: Works well as-is |
| **suggest_refactoring** | `filePath`, `focusArea`, `entityId`, `startLine`, `endLine` | AI-powered refactoring suggestions | ✅ **ENHANCE**: Add product context |
| **analyze_hotspots** | `metric`, `limit` | Find complex/coupled/changed code | ✅ **ENHANCE**: Add `product_id` for product-level hotspots |

**Gap Analysis:**
- ❌ No breaking change detection across repos
- ❌ No edge case identification
- ❌ No test coverage analysis

---

### Category 4: Graph Operations (7 tools)

| Tool | Schema | Current Capabilities | Product Intelligence Fit |
|------|--------|---------------------|-------------------------|
| **get_graph** | `query`, `limit` | Get code graph entities and relationships | ✅ **ENHANCE**: Add `product_id` filter |
| **get_graph_stats** | None | Graph statistics (entity count, relationship count) | ✅ **ENHANCE**: Add per-product stats |
| **get_graph_health** | `minEntities`, `minRelationships`, `sample` | Health check with samples | ✅ **KEEP**: Useful for monitoring |
| **reset_graph** | None | Clear all graph data | ⚠️ **ENHANCE**: Add option to reset specific product |
| **clean_index** | `directory` | Reset and reindex | ✅ **ENHANCE**: Add `product_id` parameter |
| **lerna_project_graph** | `directory`, `ingest`, `force` | Lerna workspace dependency graph | ✅ **GREAT**: Already supports monorepo! Use as inspiration |
| **get_bus_stats** | None | Knowledge bus statistics | ✅ **KEEP**: System monitoring |

**Gap Analysis:**
- ❌ No product-level graph view
- ❌ No service dependency graph
- ❌ No architecture visualization data

---

### Category 5: System & Metrics (3 tools)

| Tool | Schema | Current Capabilities | Product Intelligence Fit |
|------|--------|---------------------|-------------------------|
| **get_metrics** | None | System metrics and agent performance | ✅ **KEEP**: System health |
| **get_version** | None | Server version info | ✅ **KEEP**: Version tracking |
| **get_agent_metrics** | None | Runtime telemetry for agents | ✅ **KEEP**: Performance monitoring |
| **clear_bus_topic** | `topic` | Clear knowledge bus topic | ✅ **KEEP**: Cache management |

**Gap Analysis:**
- None - these are system-level tools

---

## Product Intelligence Feature Mapping

### Proposed Features vs. Existing Tools

| Proposed Feature | Existing Tool Coverage | Gap | Recommendation |
|------------------|----------------------|-----|----------------|
| **Product Management** | ❌ None | Create/manage products with repos | 🆕 **NEW TOOLS NEEDED** |
| **Cross-Repo Impact Analysis** | ✅ `analyze_code_impact` exists | No `product_id` filter | ✏️ **ENHANCE EXISTING** |
| **API Contract Analysis** | ❌ None | Detect endpoints & consumers | 🆕 **NEW CAPABILITY NEEDED** |
| **Data Flow Tracing** | ❌ None | Trace data across stack | 🆕 **NEW TOOL NEEDED** |
| **Breaking Change Detection** | ⚠️ Partial via `analyze_code_impact` | No API contract awareness | ✏️ **ENHANCE + NEW** |
| **Edge Case Detection** | ❌ None | Find untested paths | 🆕 **NEW TOOL NEEDED** |
| **Auto Documentation** | ❌ None | Generate product docs | 🆕 **NEW TOOL NEEDED** |
| **Business Concept Mapping** | ⚠️ Partial via `find_related_concepts` | No explicit feature extraction | ✏️ **ENHANCE EXISTING** |
| **Test Coverage Analysis** | ❌ None | Identify gaps | 🆕 **NEW CAPABILITY NEEDED** |
| **Product Health Metrics** | ⚠️ Partial via `get_graph_stats` | No product-level view | ✏️ **ENHANCE EXISTING** |

---

## Consolidated Recommendation

### ✏️ ENHANCE Existing Tools (12 tools)

Add `product_id` parameter to scope operations to a product:

```typescript
// Enhanced schemas (add product_id to these)
const EnhancedSchemaTemplate = {
  product_id: z.string().optional().describe("Filter to specific product/project"),
  // ... existing parameters
};
```

**Tools to Enhance:**
1. ✅ `index` - Project-aware indexing
2. ✅ `list_entity_relationships` - Filter by product
3. ✅ `query` - Product-scoped queries
4. ✅ `semantic_search` - Cross-repo search within product
5. ✅ `find_similar_code` - Product-scoped similarity
6. ✅ `cross_language_search` - Multi-repo multi-language
7. ✅ `find_related_concepts` - Feature boundary detection
8. ✅ `analyze_code_impact` - **CRITICAL**: Cross-repo impact
9. ✅ `detect_code_clones` - Cross-repo clone detection
10. ✅ `suggest_refactoring` - Product context awareness
11. ✅ `analyze_hotspots` - Product-level hotspots
12. ✅ `get_graph` - Product-filtered graph

---

### 🆕 NEW Tools Needed (6 minimal tools)

#### 1. **Product Management (3 tools)**

```typescript
// create_product
{
  name: string,
  description?: string,
  metadata?: { domain, architecture_type, tech_stack }
}

// add_repository_to_product
{
  product_id: string,
  repository_path: string,
  repository_type: "frontend" | "backend" | "mobile" | "shared",
  metadata?: object
}

// list_products
{
  name?: string,  // filter
  limit?: number,
  offset?: number
}
```

#### 2. **API Contract Analysis (1 tool)**

```typescript
// analyze_api_contracts
{
  product_id: string,
  endpoint?: string,  // analyze specific endpoint or all
  include_consumers?: boolean
}

// Returns:
{
  endpoints: [
    {
      method: "POST",
      path: "/api/auth/login",
      exposed_by: "backend/auth.controller.ts:45",
      request_schema: {...},
      response_schema: {...},
      consumers: ["frontend/auth.service.ts:23", ...]
    }
  ]
}
```

#### 3. **Breaking Change Detection (1 tool)**

```typescript
// detect_breaking_changes
{
  product_id: string,
  changed_files: string[],
  changed_entities?: string[]
}

// Returns:
{
  breaking_changes: [
    {
      type: "api_contract_change" | "type_incompatibility",
      severity: "critical" | "high" | "medium",
      change: "description",
      affected_files: [...],
      recommendation: "action to take"
    }
  ]
}
```

#### 4. **Product Intelligence Summary (1 tool)**

```typescript
// get_product_intelligence
{
  product_id: string,
  include?: ["stats", "health", "apis", "dependencies"]
}

// Returns comprehensive product overview:
{
  stats: { repos: 3, entities: 1543, files: 287 },
  health_score: 78,
  api_endpoints: 24,
  service_dependencies: {...},
  critical_paths: [...],
  recommendations: [...]
}
```

---

### ❌ NOT NEEDED (Use existing + LLM)

These proposed features can be achieved by **combining existing tools with LLM reasoning in n8n**:

| Feature | How to Achieve |
|---------|---------------|
| **Data Flow Tracing** | Combine `list_entity_relationships` + `analyze_code_impact` + LLM to trace paths |
| **Edge Case Detection** | Use `analyze_code_impact` + `analyze_hotspots` + LLM to identify untested paths |
| **Auto Documentation** | Use `get_graph` + `get_product_intelligence` + LLM to generate docs |
| **Integration Test Suggestions** | Use `analyze_code_impact` + `analyze_api_contracts` + LLM to suggest tests |

**Reasoning:** The MCP provides the **data/knowledge**, n8n + LLM provides the **intelligence/reasoning**.

---

## Final Tool Count

| Category | Count | Action |
|----------|-------|--------|
| **Existing tools to keep as-is** | 7 | No changes |
| **Existing tools to enhance** | 12 | Add `product_id` parameter |
| **New tools needed** | 6 | Implement from scratch |
| **Total tools after implementation** | **30 tools** | (24 existing + 6 new) |

---

## Implementation Priority

### Phase 1: Foundation (Week 1-2)
1. Add `product_id` to all 12 tools that need enhancement
2. Implement 3 product management tools
3. Wire up ProjectManager to routes
4. Update database queries to filter by `product_id`

### Phase 2: Intelligence (Week 3-4)
5. Implement `analyze_api_contracts` tool
6. Implement `detect_breaking_changes` tool
7. Enhance indexing to detect API endpoints and cross-repo imports

### Phase 3: Integration (Week 5)
8. Implement `get_product_intelligence` tool
9. Create n8n workflow examples
10. Documentation and testing

---

## Schema Enhancement Pattern

For all 12 tools that need enhancement, apply this pattern:

```typescript
// BEFORE
const SemanticSearchSchema = z.object({
  query: z.string(),
  limit: z.number().optional().default(10)
});

// AFTER
const SemanticSearchSchema = z.object({
  query: z.string(),
  limit: z.number().optional().default(10),
  product_id: z.string().optional().describe("Filter results to specific product")
});
```

And update implementation:

```typescript
// BEFORE
const results = await storage.searchEntities(query);

// AFTER
const results = await storage.searchEntities(query, { product_id });
```

---

## Key Insights

1. **We already have 70% of needed capabilities** - just need `product_id` awareness
2. **Only 6 truly new tools needed** - not 10-15 as initially proposed
3. **LLM in n8n handles reasoning** - MCP provides data, LLM connects dots
4. **Lerna tool shows the pattern** - already has monorepo understanding, apply same approach
5. **Minimal duplication** - consolidate around existing tools rather than add new ones

---

## Next Steps

**Question for you:**
1. Should we start with Phase 1 (foundation + product management)?
2. Or would you prefer a different prioritization?
3. Any specific tool from the 6 new ones you want first?

Once confirmed, I'll start implementation following this consolidated plan.
