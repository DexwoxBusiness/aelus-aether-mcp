# Product Intelligence System Architecture

## Vision

Transform the MCP server into a **Product Intelligence System** - a source of truth that deeply understands the entire product across all repositories, enabling AI agents to:

- Provide comprehensive PR reviews with edge case detection
- Generate accurate product documentation
- Detect bugs and potential issues
- Understand data flow across the entire stack
- Trace features from UI to database
- Identify breaking changes across services

## Core Concepts

### 1. Product Knowledge Graph

Instead of just indexing individual repos, we build a **unified knowledge graph** that understands:

- **Code Structure**: Functions, classes, modules (existing)
- **API Contracts**: REST endpoints, GraphQL schemas, gRPC services
- **Data Flow**: Frontend → Backend → Database → External APIs
- **Event Systems**: Message queues, event buses, webhooks
- **Business Logic**: Domain concepts, workflows, user journeys
- **Dependencies**: Cross-repo imports, API calls, shared libraries
- **Architecture**: Service boundaries, layers, design patterns

### 2. Multi-Dimensional Relationships

Enhanced relationship types beyond simple imports:

| Relationship Type | Example | Use Case |
|-------------------|---------|----------|
| `IMPORTS` | `LoginForm.tsx` imports `auth.ts` | Existing - code dependencies |
| `API_CALL` | `LoginForm.tsx` calls `POST /api/login` | Cross-service dependencies |
| `EXPOSES_ENDPOINT` | `auth.controller.ts` exposes `/api/login` | API contract mapping |
| `QUERIES_DATABASE` | `user.service.ts` queries `users` table | Data access patterns |
| `EMITS_EVENT` | `order.service.ts` emits `OrderCreated` | Event-driven architecture |
| `CONSUMES_EVENT` | `notification.service.ts` listens to `OrderCreated` | Event consumers |
| `DEPENDS_ON_SERVICE` | `frontend` → `backend` → `database` | Service dependency graph |
| `SHARES_TYPE` | `User` type shared across repos | Type contract |
| `IMPLEMENTS_FEATURE` | Multiple files implement "authentication" | Feature boundaries |
| `HANDLES_ERROR` | Try/catch, error handlers | Error flow |

### 3. Product-Level Metadata

Store in database:

```sql
-- Products table (superset of projects)
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  domain TEXT,  -- e.g., "e-commerce", "fintech"
  architecture_type TEXT,  -- "monolith", "microservices", "serverless"
  metadata TEXT,  -- JSON: tech stack, patterns, conventions
  created_at INTEGER,
  updated_at INTEGER
);

-- API Contracts
CREATE TABLE api_endpoints (
  id TEXT PRIMARY KEY,
  product_id TEXT,
  method TEXT,  -- GET, POST, etc.
  path TEXT,  -- /api/users/:id
  exposed_by_file TEXT,  -- backend/controllers/user.ts
  request_schema TEXT,  -- JSON schema
  response_schema TEXT,  -- JSON schema
  consumers TEXT,  -- JSON array of files that call this
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Data Models
CREATE TABLE data_models (
  id TEXT PRIMARY KEY,
  product_id TEXT,
  name TEXT,  -- "User", "Order"
  type TEXT,  -- "entity", "dto", "interface"
  schema TEXT,  -- JSON schema
  defined_in_files TEXT,  -- JSON array of files
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Business Concepts
CREATE TABLE business_concepts (
  id TEXT PRIMARY KEY,
  product_id TEXT,
  concept TEXT,  -- "authentication", "checkout", "payment"
  related_files TEXT,  -- JSON array of files
  related_entities TEXT,  -- JSON array of entity IDs
  description TEXT,  -- AI-generated description
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Data Flow Traces
CREATE TABLE data_flow_traces (
  id TEXT PRIMARY KEY,
  product_id TEXT,
  flow_name TEXT,  -- "User Login Flow"
  steps TEXT,  -- JSON array: [{file, action, data}]
  entry_point TEXT,  -- "LoginForm.tsx"
  exit_point TEXT,  -- "database/users"
  FOREIGN KEY (product_id) REFERENCES products(id)
);
```

## Enhanced MCP Tools for Product Intelligence

### Core Product Management

#### 1. `create_product`
```typescript
{
  "name": "E-Commerce Platform",
  "description": "Full-stack e-commerce system",
  "domain": "e-commerce",
  "architecture_type": "microservices",
  "metadata": {
    "tech_stack": ["React", "Node.js", "PostgreSQL"],
    "patterns": ["REST", "Event-Driven", "CQRS"]
  }
}
```

#### 2. `add_repository_to_product`
```typescript
{
  "product_id": "prod_ecom_001",
  "repository_path": "/path/to/frontend",
  "repository_type": "frontend",  // frontend, backend, mobile, shared-lib
  "metadata": {
    "framework": "React",
    "entry_points": ["src/App.tsx"]
  }
}
```

#### 3. `index_product`
Indexes all repos in a product with deep analysis:
- Detect API endpoints and consumers
- Extract data models
- Identify business concepts
- Trace data flows
- Build cross-repo relationship graph

### Product Intelligence Tools

#### 4. `trace_data_flow`
Follow data from UI to database:
```typescript
{
  "product_id": "prod_ecom_001",
  "entry_point": "LoginForm.tsx submitHandler",
  "trace_type": "user_login"
}

// Returns:
{
  "flow": [
    {
      "step": 1,
      "file": "frontend/components/LoginForm.tsx",
      "action": "Form submission",
      "data": "{ email, password }"
    },
    {
      "step": 2,
      "file": "frontend/components/LoginForm.tsx",
      "action": "API call",
      "target": "POST /api/auth/login"
    },
    {
      "step": 3,
      "file": "backend/controllers/auth.controller.ts",
      "action": "Endpoint handler",
      "calls": "authService.login()"
    },
    {
      "step": 4,
      "file": "backend/services/auth.service.ts",
      "action": "Database query",
      "query": "SELECT * FROM users WHERE email = ?"
    },
    {
      "step": 5,
      "file": "backend/services/auth.service.ts",
      "action": "Password validation",
      "library": "bcrypt"
    },
    {
      "step": 6,
      "file": "backend/services/auth.service.ts",
      "action": "JWT generation",
      "returns": "{ token, user }"
    }
  ],
  "edge_cases": [
    "User not found",
    "Invalid password",
    "Database connection error"
  ],
  "test_coverage": "67%"
}
```

#### 5. `analyze_api_contract`
Understand API endpoints and their consumers:
```typescript
{
  "product_id": "prod_ecom_001",
  "endpoint": "/api/orders/:id"
}

// Returns:
{
  "endpoint": "/api/orders/:id",
  "method": "GET",
  "exposed_by": "backend/controllers/order.controller.ts:45",
  "consumers": [
    {
      "file": "frontend/pages/OrderDetails.tsx",
      "line": 23,
      "usage": "fetch(`/api/orders/${orderId}`)"
    },
    {
      "file": "mobile/screens/OrderScreen.tsx",
      "line": 67,
      "usage": "api.get(`/orders/${id}`)"
    }
  ],
  "request_params": {
    "id": "string (UUID)"
  },
  "response_schema": {
    "order": {
      "id": "string",
      "items": "array",
      "total": "number",
      "status": "enum"
    }
  },
  "breaking_changes_would_affect": [
    "frontend/pages/OrderDetails.tsx",
    "mobile/screens/OrderScreen.tsx",
    "backend/services/notification.service.ts"
  ]
}
```

#### 6. `detect_breaking_changes`
Analyze PR changes for cross-repo impacts:
```typescript
{
  "product_id": "prod_ecom_001",
  "changed_files": [
    "backend/controllers/auth.controller.ts"
  ],
  "changed_entities": [
    "login_endpoint_handler"
  ]
}

// Returns:
{
  "breaking_changes": [
    {
      "type": "api_contract_change",
      "severity": "high",
      "change": "Response schema changed: removed 'refreshToken' field",
      "affected_consumers": [
        "frontend/services/auth.service.ts:34",
        "mobile/services/auth.ts:89"
      ],
      "recommendation": "Update frontend and mobile to handle new token flow"
    },
    {
      "type": "type_incompatibility",
      "severity": "critical",
      "change": "User.email is now optional (was required)",
      "affected_files": [
        "frontend/components/UserProfile.tsx",
        "backend/services/email.service.ts"
      ],
      "recommendation": "Add null checks in 12 locations"
    }
  ],
  "safe_changes": [
    {
      "change": "Added logging to login handler",
      "impact": "none"
    }
  ]
}
```

#### 7. `find_edge_cases`
Use graph analysis to find untested scenarios:
```typescript
{
  "product_id": "prod_ecom_001",
  "feature": "user_authentication"
}

// Returns:
{
  "edge_cases": [
    {
      "scenario": "User logs in with expired token",
      "code_path": "auth.service.ts:verifyToken() → throws TokenExpiredError",
      "handled": true,
      "tested": false,
      "recommendation": "Add test for expired token scenario"
    },
    {
      "scenario": "Concurrent login attempts from different devices",
      "code_path": "auth.service.ts:login()",
      "handled": false,
      "tested": false,
      "severity": "high",
      "recommendation": "Add session management logic"
    },
    {
      "scenario": "Database connection fails during password validation",
      "code_path": "auth.service.ts:login() → userRepo.findByEmail()",
      "handled": true,
      "tested": false,
      "error_handling": "Generic 500 error",
      "recommendation": "Return more specific error to client"
    }
  ]
}
```

#### 8. `generate_product_documentation`
Auto-generate comprehensive docs:
```typescript
{
  "product_id": "prod_ecom_001",
  "doc_type": "architecture"  // or "api", "data_models", "features"
}

// Returns markdown documentation:
{
  "documentation": `
# E-Commerce Platform Architecture

## Overview
Microservices architecture with 3 main services:
- Frontend (React SPA)
- Backend API (Node.js/Express)
- Mobile App (React Native)

## Service Dependencies
\`\`\`
Frontend ──→ Backend API ──→ PostgreSQL
           │            └──→ Redis (sessions)
           │
Mobile ────┘
\`\`\`

## API Endpoints

### Authentication
- **POST /api/auth/login**
  - Request: { email, password }
  - Response: { token, user }
  - Consumers: LoginForm.tsx, LoginScreen.tsx
  - Implementation: auth.controller.ts:45

### Orders
- **GET /api/orders/:id**
  - Consumers: OrderDetails.tsx, OrderScreen.tsx
  ...

## Data Models

### User
- Defined in: backend/models/user.ts, frontend/types/user.ts
- Fields: id, email, name, role
- Used by: 23 files across frontend and backend
...
  `
}
```

#### 9. `analyze_product_health`
Overall product intelligence metrics:
```typescript
{
  "product_id": "prod_ecom_001"
}

// Returns:
{
  "health_score": 78,
  "metrics": {
    "cross_repo_consistency": {
      "score": 85,
      "issues": [
        "User type has different fields in frontend vs backend"
      ]
    },
    "api_contract_stability": {
      "score": 90,
      "breaking_changes_in_last_30_days": 2
    },
    "test_coverage": {
      "overall": 67,
      "critical_paths": 82,
      "edge_cases": 34
    },
    "documentation_completeness": {
      "score": 45,
      "missing": ["API docs for 12 endpoints", "Data model schemas"]
    }
  },
  "recommendations": [
    "Unify User type definition across repos",
    "Add tests for 23 identified edge cases",
    "Document API endpoints in auth and order modules"
  ]
}
```

#### 10. `suggest_integration_tests`
Based on cross-repo dependencies:
```typescript
{
  "product_id": "prod_ecom_001",
  "scope": "authentication_flow"
}

// Returns:
{
  "suggested_tests": [
    {
      "test_type": "integration",
      "name": "End-to-end login flow",
      "steps": [
        "User enters credentials in LoginForm",
        "Frontend calls POST /api/auth/login",
        "Backend validates credentials",
        "Backend returns JWT token",
        "Frontend stores token",
        "Frontend redirects to dashboard"
      ],
      "repos_involved": ["frontend", "backend"],
      "current_coverage": "partial - only backend unit tests exist"
    },
    {
      "test_type": "integration",
      "name": "Token refresh flow",
      "missing_in_code": true,
      "severity": "high",
      "recommendation": "Implement token refresh logic before testing"
    }
  ]
}
```

## Implementation Phases

### Phase 1: Foundation (Current)
- ✅ Multi-repo database schema
- ⚠️ Project routes (TODOs)
- ⚠️ Cross-repo relationship detection

### Phase 2: Product Intelligence Core
- [ ] Product schema (vs. Project schema)
- [ ] API endpoint detection and mapping
- [ ] Data model extraction
- [ ] Enhanced relationship types (API_CALL, QUERIES_DATABASE, etc.)
- [ ] Cross-repo import resolution

### Phase 3: Data Flow Tracing
- [ ] Trace user actions across repos
- [ ] Identify data transformations
- [ ] Map error handling paths
- [ ] Detect circular dependencies

### Phase 4: Business Intelligence
- [ ] Extract business concepts using semantic analysis
- [ ] Map features to code
- [ ] Identify critical paths
- [ ] Generate architecture diagrams

### Phase 5: AI Agent Tools
- [ ] Breaking change detection
- [ ] Edge case identification
- [ ] Auto-documentation generation
- [ ] Integration test suggestions

### Phase 6: n8n Integration Workflows
- [ ] PR Review Agent workflow
- [ ] Documentation Generator workflow
- [ ] Edge Case Detector workflow
- [ ] Product Health Monitor workflow

## n8n Workflow Examples

### PR Review Agent with Product Intelligence

```
GitHub PR Webhook
  ↓
Extract changed files
  ↓
MCP: detect_breaking_changes(product_id, changed_files)
  ↓
MCP: find_edge_cases(product_id, affected_features)
  ↓
MCP: trace_data_flow(product_id, changed_entities)
  ↓
MCP: suggest_integration_tests(product_id, scope)
  ↓
Generate comprehensive review:
  - Breaking changes across repos
  - Edge cases to consider
  - Integration tests needed
  - Documentation to update
  ↓
Post as PR comment with AI insights
```

### Documentation Generator

```
Schedule (weekly)
  ↓
MCP: list_products
  ↓
For each product:
  ├─ MCP: generate_product_documentation(product_id, "architecture")
  ├─ MCP: generate_product_documentation(product_id, "api")
  ├─ MCP: generate_product_documentation(product_id, "data_models")
  └─ MCP: analyze_product_health(product_id)
  ↓
Combine all docs
  ↓
Commit to docs/ directory
  ↓
Deploy to documentation site
```

### Edge Case Detector

```
Schedule (daily)
  ↓
MCP: list_products
  ↓
For each product:
  └─ MCP: find_edge_cases(product_id)
  ↓
Filter: severity = "high" AND tested = false
  ↓
Create JIRA tickets for each
  ↓
Notify team in Slack
```

## Success Metrics

The Product Intelligence System is successful when:

1. **PR Review Agent** catches 90% of breaking changes before merge
2. **Documentation** is 80%+ auto-generated and always up-to-date
3. **Edge Cases** are proactively identified before becoming production bugs
4. **Cross-Repo Changes** are safely coordinated across teams
5. **New Developers** can understand the product by querying MCP

## Technical Advantages

- **Single Source of Truth**: All product knowledge in one graph
- **AI-Native**: Designed for AI agent consumption via MCP
- **Cross-Repo Intelligence**: Understands relationships across service boundaries
- **Proactive**: Identifies issues before they happen
- **Self-Documenting**: Product documents itself through code analysis
- **Test-Aware**: Knows what's tested and what's not
- **Evolution-Friendly**: Tracks how the product changes over time

---

**Next Steps**: Implement Phase 2 with focus on API contract detection and cross-repo relationship mapping.
