# Phase 3: Voyage AI Integration

## Overview

Phase 3 integrates Voyage AI's state-of-the-art code embeddings (`voyage-code-3`) with 1024-dimensional vectors, replacing the default 384-d embeddings. This provides superior semantic understanding for code search, similarity detection, and cross-repository analysis.

## What Changed

### 1. **Voyage AI Provider** (`src/semantic/providers/voyage-provider.ts`)

New embedding provider implementing the `EmbeddingProvider` interface:

- **Model**: `voyage-code-3` (1024-d embeddings optimized for code)
- **Batch Support**: Up to 128 texts per batch request
- **Input Types**: `document` (default) or `query` for search optimization
- **Auto-retry**: Built-in retry logic with exponential backoff
- **Concurrency Control**: Configurable parallel request limits

```typescript
const provider = new VoyageProvider({
  apiKey: process.env.VOYAGE_API_KEY!,
  model: 'voyage-code-3',
  inputType: 'document',
  maxBatchSize: 128,
  timeoutMs: 30000,
  concurrency: 4
});
```

### 2. **Database Schema Migration v4**

Enhanced embeddings table to support multiple embedding dimensions:

```sql
-- New columns
ALTER TABLE embeddings ADD COLUMN dimension INTEGER DEFAULT 384;
ALTER TABLE embeddings ADD COLUMN provider TEXT DEFAULT 'transformers';

-- New indexes for efficient querying
CREATE INDEX idx_embeddings_dimension ON embeddings(dimension);
CREATE INDEX idx_embeddings_provider ON embeddings(provider);
CREATE INDEX idx_embeddings_model_dim ON embeddings(model_name, dimension);

-- Statistics view
CREATE VIEW embedding_stats AS
SELECT
  provider,
  model_name,
  dimension,
  COUNT(*) as embedding_count,
  MIN(created_at) as first_created,
  MAX(created_at) as last_created
FROM embeddings
GROUP BY provider, model_name, dimension;
```

**Benefits**:
- Track which embeddings are from which provider
- Support multiple embedding dimensions in the same database
- Easy migration path (existing embeddings default to 384-d/transformers)
- Query statistics by model and dimension

### 3. **Configuration System Updates**

Added Voyage AI to the configuration system with environment variable support:

**YAML Configuration** (`config/default.yaml`):
```yaml
mcp:
  embedding:
    provider: "voyage"
    model: "voyage-code-3"
    enabled: true
    voyage:
      apiKey: "${VOYAGE_API_KEY}"
      baseUrl: "https://api.voyageai.com"  # Optional
      timeoutMs: 30000                      # Optional
      concurrency: 4                        # Optional
      inputType: "document"                 # Optional: "document" or "query"
      maxBatchSize: 128                     # Optional
```

**Environment Variables**:
```bash
# Required
export VOYAGE_API_KEY="your-api-key-here"

# Optional
export VOYAGE_BASE_URL="https://api.voyageai.com"
export VOYAGE_TIMEOUT_MS="30000"
export VOYAGE_CONCURRENCY="4"
export VOYAGE_INPUT_TYPE="document"
export VOYAGE_MAX_BATCH_SIZE="128"
```

### 4. **Provider Factory Integration**

Voyage AI is now available as a provider option:

```typescript
import { createProvider } from './semantic/providers/factory.js';

const provider = createProvider({
  provider: 'voyage',
  modelName: 'voyage-code-3',
  voyage: {
    apiKey: process.env.VOYAGE_API_KEY!,
    timeoutMs: 30000,
    concurrency: 4,
    inputType: 'document',
    maxBatchSize: 128
  }
});
```

## Usage Examples

### Basic Setup

1. **Get Voyage AI API Key**:
   - Sign up at https://www.voyageai.com/
   - Get your API key from the dashboard

2. **Configure Environment**:
   ```bash
   # .env file
   MCP_EMBEDDING_PROVIDER=voyage
   MCP_EMBEDDING_MODEL=voyage-code-3
   MCP_EMBEDDING_ENABLED=true
   VOYAGE_API_KEY=your-api-key-here
   ```

3. **Start the Server**:
   ```bash
   npm start
   ```

### HTTP API Usage

**Generate Embeddings**:
```bash
curl -X POST http://localhost:3000/api/semantic/embed \
  -H "Content-Type: application/json" \
  -d '{
    "texts": ["function calculateTotal(items) { return items.reduce((sum, item) => sum + item.price, 0); }"],
    "inputType": "document"
  }'
```

**Semantic Search** (uses configured provider automatically):
```bash
curl -X POST http://localhost:3000/api/semantic/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "calculate total price",
    "limit": 10,
    "minScore": 0.7
  }'
```

### Multi-Repository Search

Works seamlessly with Phase 2's project management:

```bash
# Search across all repositories in a project
curl -X POST http://localhost:3000/api/projects/my-project/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "authentication logic",
    "limit": 20,
    "repositories": ["repo1", "repo2"],
    "min_score": 0.75
  }'
```

### Embedding Statistics

Check embedding distribution:

```bash
# Query the embedding_stats view
curl http://localhost:3000/api/semantic/stats
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "provider": "voyage",
      "model_name": "voyage-code-3",
      "dimension": 1024,
      "embedding_count": 15234,
      "first_created": 1731513600000,
      "last_created": 1731600000000
    },
    {
      "provider": "transformers",
      "model_name": "default",
      "dimension": 384,
      "embedding_count": 8456,
      "first_created": 1731427200000,
      "last_created": 1731513600000
    }
  ]
}
```

## Migration Guide

### Migrating Existing Embeddings

The database schema automatically handles existing embeddings:

1. **Automatic Migration**: When you upgrade, existing embeddings are tagged as:
   - `dimension: 384`
   - `provider: 'transformers'`

2. **Gradual Re-indexing**: Re-index repositories to generate new 1024-d embeddings:
   ```bash
   curl -X POST http://localhost:3000/api/index \
     -H "Content-Type: application/json" \
     -d '{
       "projectId": "my-project",
       "repoPath": "/path/to/repo",
       "force": true
     }'
   ```

3. **Hybrid Search**: The system supports both embedding dimensions simultaneously:
   - Old searches use 384-d embeddings
   - New searches use 1024-d embeddings
   - No downtime required

### Provider Switching

Switch between providers without data loss:

```bash
# Switch to Voyage AI
export MCP_EMBEDDING_PROVIDER=voyage
export VOYAGE_API_KEY=your-key

# Or switch back to transformers
export MCP_EMBEDDING_PROVIDER=transformers

# Or use OpenAI
export MCP_EMBEDDING_PROVIDER=openai
export OPENAI_API_KEY=your-key
```

## Supported Models

### Voyage AI Models

| Model | Dimension | Use Case | Context Length |
|-------|-----------|----------|----------------|
| `voyage-code-3` | 1024 | Code embeddings (recommended) | 16,000 tokens |
| `voyage-3` | 1024 | General-purpose | 32,000 tokens |
| `voyage-3-lite` | 512 | Fast, cost-effective | 32,000 tokens |
| `voyage-large-2` | 1536 | High-accuracy | 16,000 tokens |
| `voyage-code-2` | 1536 | Previous code model | 16,000 tokens |

### Configuration Example for Different Models

```yaml
# voyage-code-3 (recommended for code)
mcp:
  embedding:
    provider: "voyage"
    model: "voyage-code-3"

# voyage-3-lite (cost-effective)
mcp:
  embedding:
    provider: "voyage"
    model: "voyage-3-lite"
```

## Performance Considerations

### Batch Processing

Voyage AI supports efficient batch processing:

- **Max Batch Size**: 128 texts
- **Auto-chunking**: Larger batches split automatically
- **Parallel Requests**: Configurable concurrency (default: 4)

```typescript
// Efficient batch embedding
const results = await provider.embedBatch([
  'function foo() { ... }',
  'class Bar { ... }',
  // ... up to 128 texts
]);
```

### Cost Optimization

- **Batch requests**: Always prefer `embedBatch()` over multiple `embed()` calls
- **Cache embeddings**: Embeddings are stored in SQLite and reused
- **Incremental indexing**: Only re-index changed files
- **Model selection**: Use `voyage-3-lite` for cost-sensitive applications

### Rate Limits

Default Voyage AI limits (check your plan):
- **Requests**: 300 requests/minute
- **Tokens**: 1M tokens/minute

The provider includes:
- Automatic retry with exponential backoff
- Configurable timeout (default: 30s)
- Concurrency limiting

## Troubleshooting

### API Key Issues

**Error**: `"Voyage AI apiKey is required"`

**Solution**:
```bash
export VOYAGE_API_KEY="your-api-key-here"
# Or add to config/default.yaml
```

### Timeout Errors

**Error**: `"Request timeout after 30000ms"`

**Solution**: Increase timeout for large batches:
```yaml
mcp:
  embedding:
    voyage:
      timeoutMs: 60000  # 60 seconds
```

### Rate Limit Errors

**Error**: `"HTTP 429 Too Many Requests"`

**Solution**: Reduce concurrency:
```yaml
mcp:
  embedding:
    voyage:
      concurrency: 2  # Reduce from default 4
```

### Dimension Mismatch

**Error**: `"Vector dimension mismatch: expected 1024, got 384"`

**Solution**: Ensure you're using the correct provider configuration and re-index if switching providers.

## API Reference

### VoyageProvider

```typescript
interface VoyageOptions {
  baseUrl?: string;           // Default: "https://api.voyageai.com"
  apiKey: string;             // Required
  model: string;              // e.g., "voyage-code-3"
  timeoutMs?: number;         // Default: 30000
  concurrency?: number;       // Default: 4
  inputType?: "query" | "document";  // Default: "document"
  maxBatchSize?: number;      // Default: 128
  logger?: ProviderLogger;    // Optional logger
}

class VoyageProvider implements EmbeddingProvider {
  constructor(opts: VoyageOptions);
  async embed(text: string, opts?: EmbedOptions): Promise<Float32Array>;
  async embedBatch(texts: string[], opts?: EmbedOptions): Promise<Float32Array[]>;
  getDimension(): number;
  async initialize(): Promise<void>;
  async close(): Promise<void>;
}
```

### Input Types

- **`document`** (default): Optimized for indexing documents
- **`query`**: Optimized for search queries

```typescript
// When indexing code
await provider.embed(code, { inputType: 'document' });

// When searching
await provider.embed(userQuery, { inputType: 'query' });
```

## Next Steps

### Phase 4: Re-Ranker Implementation

Coming next:
- Voyage AI Re-ranker integration (`rerank-2` model)
- Two-stage search: embedding retrieval + re-ranking
- Improved search relevance for top results
- Cross-repository re-ranking

### Future Enhancements

- **Multimodal embeddings**: `voyage-multimodal-3` for code + diagrams
- **Fine-tuning**: Custom models for specific codebases
- **Hybrid search**: Combine embeddings with BM25 text search
- **Semantic caching**: Cache common query embeddings

## Resources

- **Voyage AI Documentation**: https://docs.voyageai.com/
- **API Reference**: https://docs.voyageai.com/reference/embeddings-api
- **Model Comparison**: https://docs.voyageai.com/docs/embeddings
- **Pricing**: https://www.voyageai.com/pricing

## Summary

Phase 3 successfully integrates Voyage AI's state-of-the-art code embeddings:

✅ **VoyageProvider**: Production-ready implementation with retry logic
✅ **1024-d Embeddings**: Superior code understanding vs 384-d
✅ **Database Migration**: Backward-compatible schema update
✅ **Configuration**: YAML + environment variable support
✅ **Multi-model**: Supports 6 Voyage AI models
✅ **Batch Processing**: Efficient API usage with auto-chunking
✅ **Build Status**: Zero TypeScript errors

**Ready for**: Phase 4 (Re-ranker) and production testing!
