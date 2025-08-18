# Split-Apps Architecture Implementation

## Overview

Successfully implemented and evolved the split-apps structure that preserves all working functionality while organizing the codebase for future unified deployment. The architecture now includes comprehensive documentation systems, knowledge transfer pipelines, and published packages.

## Current Directory Structure

```
/Users/ryan/Desktop/ai-env/
├── Documentation System (root)      # CLAUDE ONBOARDING SYSTEM
│   ├── CLAUDE_ONBOARDING_GUIDE.md      # Master entry point for Claude instances
│   ├── CLAUDE_APP_SETUP_GUIDE.md       # Guide for app documentation work
│   ├── CLAUDE_FRAMEWORK_SETUP_GUIDE.md # Guide for framework documentation setup
│   └── DIRECTORY_STRUCTURE.md          # Complete directory map
│
├── chirality-ai/                    # Orchestrator repo (compose, desktop, docs)
│   ├── compose/
│   │   ├── docker-compose.yml       # Backend services (uses main framework)
│   │   └── .env                     # Environment configuration
│   ├── desktop/                     # Electron wrapper
│   └── .env                         # Shared environment configuration
│
├── chirality-ai-app/               # Product frontend (Next.js/TypeScript)
│   ├── lib/chirality-semantic-framework/  # FRAMEWORK DOCS MIRROR (29 files)
│   │   ├── KNOWLEDGE_TRANSFER_MANIFEST.md  # Canonical list
│   │   ├── CLAUDE.md                # AI collaboration for this mirror
│   │   └── Complete framework documentation
│   ├── CONTINUOUS_IMPROVEMENT_PLAN.md     # Ongoing documentation process
│   ├── KEY_PROJECT_FILES.md        # Documentation status tracking
│   └── Complete app documentation
│
├── chirality-semantic-framework/   # Core framework + backend services
│   ├── lib/chirality-ai-app/      # APP DOCS MIRROR (27 files)
│   │   ├── KNOWLEDGE_TRANSFER_MANIFEST.md  # Canonical list
│   │   ├── CLAUDE.md               # AI collaboration for this mirror
│   │   └── Complete app documentation
│   ├── chirality/                  # Core CF14 Python package
│   │   ├── core/                   # Semantic operations (A×B→C, etc.)
│   │   ├── adapters/               # Neo4j and other adapters
│   │   ├── exporters/              # CF14 Neo4j export functionality
│   │   └── tests/                  # Test suite with fixtures
│   ├── admin/                      # Express.js orchestration service
│   ├── graphql/                    # Standalone GraphQL service
│   ├── orchestration-service/      # Salvaged orchestration service
│   ├── setup.py                    # PyPI package configuration
│   └── Complete framework documentation
│
└── chirality-chat/                 # Independent sandbox app (legacy)
```

## Knowledge Transfer Architecture

### Bidirectional Documentation Mirrors

The system maintains comprehensive documentation mirrors for knowledge transfer:

```
chirality-ai-app/
└── lib/chirality-semantic-framework/  # How app devs learn framework
    ├── KNOWLEDGE_TRANSFER_MANIFEST.md (29 files listed)
    ├── Python examples (*.py)
    ├── CF14 execution traces (*.json)
    └── Complete framework docs

chirality-semantic-framework/
└── lib/chirality-ai-app/              # How framework devs learn app
    ├── KNOWLEDGE_TRANSFER_MANIFEST.md (27 files listed)
    ├── TypeScript configs (package.json, tsconfig.json)
    └── Complete app docs
```

### Documentation Improvement System

Both projects use the same systematic improvement cycle:

1. **CONTINUOUS_IMPROVEMENT_PLAN.md** - Ongoing process framework
2. **CONSOLIDATED_IMPROVEMENT_PLAN.md** - Specific implementation (when triggered)
3. **KEY_PROJECT_FILES.md** - Status tracking for all documentation

## Published Packages & Releases

### Python Framework
- **Package**: `chirality-framework` v14.3.1 on PyPI
- **Installation**: `pip install chirality-framework==14.3.1`
- **CLI**: `python -m chirality.cli`
- **GitHub Release**: v14.3.1 with enhanced semantic operations

### TypeScript Application
- **GitHub Release**: v1.0.0 
- **Features**: Complete document generation with CF14 integration
- **Neo4j Integration**: Graph mirror for enhanced discovery

## Services & Ports

### Backend Services (via Docker Compose)
*Services now sourced from chirality-semantic-framework/*
- **Neo4j**: `localhost:7474` (HTTP), `localhost:7687` (Bolt)
- **GraphQL**: `localhost:8080` (from chirality-semantic-framework/graphql/)
- **Admin**: `localhost:3001` (from chirality-semantic-framework/admin/)

### Frontend Applications
- **Product App** (`chirality-ai-app`): `localhost:3000`
- **Semantic Framework**: Independent ports
- **Chat Sandbox**: Independent ports (legacy)

## Data Contracts

### CF14 Semantic Operations
```python
# CF14 Protocol Operations
op_multiply(A, B) → C       # Semantic intersection
op_interpret(C) → J         # Stakeholder translation  
op_elementwise(J, C) → F    # Element combination
op_add(A, F) → D           # Final synthesis
```

### Neo4j CF14 Integration
```cypher
# CF14 Matrix Nodes
(:CFMatrix {id: "sha1_hash", content: "json", thread: "id"})
(:CFNode {id: "sha1_hash", value: "content", row: 0, col: 0})

# Relationships
(:CFMatrix)-[:CONTAINS]->(:CFNode)
(:CFNode)-[:PART_OF]->(:CFMatrix)
```

### GraphQL API
```typescript
type Query {
  health: ServiceHealth!
  cfMatrices(threadId: String!): [CFMatrix!]!
  components(limit: Int): [Component!]!
}

type CFMatrix {
  id: String!
  threadId: String!
  matrixType: String!
  content: String!
  nodes: [CFNode!]!
}

type CFNode {
  id: String!
  value: String!
  row: Int!
  col: Int!
  matrixId: String!
}
```

### Component Selection Algorithm
```typescript
// Scoring rules for graph mirror
const score = 
  (crossRefs * 3) +        // +3 for each cross-reference
  (keywords * 2) +         // +2 for each keyword match  
  (sizeBonus) -            // Size considerations
  (sizePenalty * 2)        // -2 for oversized content

// Thresholds
const MIN_SCORE = 3        // Minimum for inclusion
const MAX_PER_DOC = 12     // Per document limit
const MAX_TOTAL = 50       // System-wide limit
```

## Environment Configuration

### Shared Environment (chirality-ai/.env)
```env
# OpenAI Configuration
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4o-mini

# Neo4j Configuration (Cloud)
NEO4J_PASSWORD=nCyn72sE19a3qJQOfzAMCyL_X2KmCXmrTlHLglN3eHQ
NEO4J_URI=neo4j+s://c0a5bb06.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_DATABASE=neo4j

# Local Neo4j (Docker)
NEO4J_USERNAME=neo4j
NEO4J_LOCAL_PASSWORD=password

# Application Ports
ADMIN_PORT=3001
GRAPHQL_PORT=8080
NEO4J_HTTP_PORT=7474
NEO4J_BOLT_PORT=7687
FRONTEND_PORT=3000

# Feature Flags
FEATURE_GRAPH_ENABLED=true

# Application URLs
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:8080/graphql
NEXT_PUBLIC_API_BASE=http://localhost:3001
```

## Implementation Status

### ✅ Completed (August 2025)
1. **CF14 Integration**: Complete semantic matrix operations with Neo4j export
2. **Document Generation**: Two-pass generation with RAG enhancement
3. **Graph Mirror**: Component selection with metadata-only mirroring
4. **PyPI Package**: Published chirality-framework v14.3.1
5. **GitHub Releases**: Both v14.3.1 (framework) and v1.0.0 (app)
6. **Knowledge Transfer**: Bidirectional documentation mirrors (29/27 files)
7. **Documentation System**: Systematic improvement cycle for both projects
8. **AI Collaboration**: Complete Claude onboarding and setup guides

### Services Status
- ✅ **Neo4j**: Running with CF14 matrix storage
- ✅ **GraphQL**: CF14 and component queries working
- ✅ **Admin**: Orchestration service operational
- ✅ **Frontend**: Complete document generation with streaming
- ✅ **Python CLI**: Published package with CF14 operations
- ✅ **Component Mirror**: Metadata mirroring with scoring algorithm

## Application Usage

### Product App Usage (Full Stack)
```bash
# Start Neo4j (local Docker)
cd /Users/ryan/Desktop/ai-env/chirality-ai-app
docker compose -f docker-compose.neo4j.yml up -d

# Start backend services
cd /Users/ryan/Desktop/ai-env/chirality-ai/compose
docker compose up -d

# Start frontend
cd /Users/ryan/Desktop/ai-env/chirality-ai-app
npm run dev  # Available at http://localhost:3000
```

### Framework Development
```bash
cd /Users/ryan/Desktop/ai-env/chirality-semantic-framework

# Use published package
pip install chirality-framework==14.3.1
python -m chirality.cli run --thread "example" --A A.json --B B.json

# Test CF14 Neo4j export
python -m chirality.cli run --thread "test:$(date +%s)" \
  --A chirality/tests/fixtures/A.json \
  --B chirality/tests/fixtures/B.json \
  --resolver echo --write-cf14-neo4j
```

### Documentation Work
```bash
# For app documentation
cd /Users/ryan/Desktop/ai-env/
# Read CLAUDE_APP_SETUP_GUIDE.md

# For framework documentation  
cd /Users/ryan/Desktop/ai-env/
# Read CLAUDE_FRAMEWORK_SETUP_GUIDE.md

# For new Claude instances
cd /Users/ryan/Desktop/ai-env/
# Read CLAUDE_ONBOARDING_GUIDE.md
```

## Verification Commands

### CF14 Operations Test
```bash
cd /Users/ryan/Desktop/ai-env/chirality-semantic-framework
python -m chirality.cli run \
  --thread "verification:$(date +%s)" \
  --A chirality/tests/fixtures/A.json \
  --B chirality/tests/fixtures/B.json \
  --resolver echo --write-cf14-neo4j
```

### GraphQL Health Check
```bash
curl -s -X POST http://localhost:8080/graphql \
  -H 'Content-Type: application/json' \
  -d '{"query":"{health{status lastChecked}}"}'
```

### Component Mirror Check
```bash
curl -s -X POST http://localhost:8080/graphql \
  -H 'Content-Type: application/json' \
  -d '{"query":"{components(limit:5){id title score}}"}'
```

### Frontend Health Check
```bash
curl -s http://localhost:3000/api/healthz
# Expected: {"ok":true,"timestamp":"..."}
```

## Current Service Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend Applications                       │
│  ┌─────────────────┐    ┌─────────────────┐                  │
│  │ chirality-ai-app│    │  chirality-chat │                  │
│  │   (v1.0.0)      │    │    (legacy)     │                  │
│  └─────────────────┘    └─────────────────┘                  │
└─────────────┬───────────────────┬──────────────────────────────┘
              │                   │
              ▼                   ▼
┌─────────────────────────────────────────────────────────────────┐
│          Chirality Framework (v14.3.1 - PyPI Published)        │
│                                                                 │
│  CF14 Semantic Operations:                                      │
│  ├── A×B→C (semantic intersection)                             │
│  ├── C→J (stakeholder translation)                             │
│  ├── J⊙C→F (element combination)                               │
│  └── A⊕F→D (final synthesis)                                   │
│                                                                 │
│  Production Services (Docker-ready):                           │
│  ├── admin/ (Express.js orchestration)                         │
│  ├── graphql/ (CF14 + Component queries)                       │
│  └── orchestration-service/ (Service coordination)             │
│                                                                 │
│  Knowledge Transfer:                                            │
│  ├── lib/chirality-ai-app/ (27 files - app docs mirror)       │
│  └── KNOWLEDGE_TRANSFER_MANIFEST.md                            │
└─────────────┬───────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Neo4j Database                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  CF14 Semantic Matrices    │    Document Components     │   │
│  │  (:CFMatrix, :CFNode)      │    (:Component, :Document)  │   │
│  │  SHA1-based IDs            │    Metadata mirror only    │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Documentation Knowledge Transfer Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   Documentation System                         │
│                                                                 │
│  ┌─────────────────┐              ┌─────────────────┐           │
│  │ App Project     │◄────────────►│ Framework       │           │
│  │                 │              │ Project         │           │
│  │ CONTINUOUS_     │              │ CONTINUOUS_     │           │
│  │ IMPROVEMENT_    │              │ IMPROVEMENT_    │           │
│  │ PLAN.md         │              │ PLAN.md         │           │
│  │                 │              │                 │           │
│  │ lib/            │              │ lib/            │           │
│  │ chirality-      │              │ chirality-      │           │
│  │ semantic-       │              │ ai-app/         │           │
│  │ framework/      │              │ (27 files)      │           │
│  │ (29 files)      │              │                 │           │
│  └─────────────────┘              └─────────────────┘           │
│                                                                 │
│  Coordinated by:                                                │
│  ├── CLAUDE_ONBOARDING_GUIDE.md (master entry point)           │
│  ├── CLAUDE_APP_SETUP_GUIDE.md (app maintenance)               │
│  └── CLAUDE_FRAMEWORK_SETUP_GUIDE.md (framework setup)         │
└─────────────────────────────────────────────────────────────────┘
```

## Benefits Achieved

### Technical Architecture
1. **CF14 Implementation**: Complete semantic matrix operations with Neo4j integration
2. **Package Distribution**: Published Python package on PyPI (v14.3.1)
3. **Document Generation**: Two-pass generation with RAG enhancement
4. **Graph Integration**: Metadata mirroring with component selection algorithm
5. **API Integration**: GraphQL layer supporting both CF14 and document queries

### Documentation System
1. **Knowledge Transfer**: Bidirectional mirrors enabling cross-project understanding
2. **Systematic Improvement**: Repeatable documentation improvement cycles
3. **AI Collaboration**: Complete onboarding system for future Claude instances
4. **Status Tracking**: Comprehensive documentation health monitoring

### Development Experience
1. **Zero Downtime**: Preserved all functionality through evolution
2. **Independent Development**: Projects can iterate separately while staying coordinated
3. **Deployment Flexibility**: Multiple service deployment options
4. **Quality Assurance**: Systematic testing and validation workflows

## Future: Electron Desktop App

The current structure supports the planned Electron wrapper:

```javascript
// chirality-ai/desktop/main.js
async function startApp() {
  // 1. Start Docker services
  await exec('docker compose -f ../compose/docker-compose.yml up -d')
  
  // 2. Wait for health checks
  await waitForHealthy('http://localhost:8080/graphql')
  await waitForHealthy('http://localhost:3001/health')
  
  // 3. Start frontend in embedded browser
  const window = new BrowserWindow({
    webPreferences: { nodeIntegration: false }
  })
  window.loadURL('http://localhost:3000')
}
```

## Maintenance Notes

### Documentation Coordination
- **Mirror Synchronization**: Keep KNOWLEDGE_TRANSFER_MANIFEST.md files accurate
- **Version Coordination**: Align PyPI and npm releases
- **Status Tracking**: Update KEY_PROJECT_FILES.md as documentation evolves
- **Claude Guides**: Update setup guides as processes improve

### Development Workflow
```bash
# Framework development (Python)
cd chirality-semantic-framework
pip install -e .  # Editable install
python -m chirality.cli --help

# App development (TypeScript)  
cd chirality-ai-app
npm run dev  # Start with hot reload

# Documentation work
# Follow appropriate CLAUDE_*_SETUP_GUIDE.md
```

### Release Coordination
```bash
# Framework release
cd chirality-semantic-framework
# 1. Update setup.py and __init__.py versions
# 2. python setup.py sdist bdist_wheel
# 3. twine upload dist/*
# 4. gh release create v14.x.x

# App release
cd chirality-ai-app  
# 1. Update package.json version
# 2. gh release create v1.x.x
```

---

**Current Status**: The split-apps architecture is fully operational with published packages, comprehensive documentation systems, and systematic improvement processes. Ready for continued development, production deployment, or desktop app packaging.

**Knowledge Transfer**: Complete bidirectional documentation mirrors enable seamless collaboration between Python framework and TypeScript application teams.

**AI Collaboration**: Systematic onboarding guides ensure future Claude instances can effectively maintain and evolve both projects.