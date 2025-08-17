# Chirality AI App v1.0.0

## 🎉 First Official Release - CF14-Enhanced Document Generation

The first stable release of the Chirality AI App, featuring two-pass document generation with optional CF14 semantic enhancement through Neo4j integration.

### ✨ Core Features

#### Two-Pass Document Generation System
- **Sequential Generation**: DS → SP → X → M document creation
- **Cross-Referential Refinement**: Second pass using insights from all documents
- **Final Resolution**: X document updated with complete context
- **Flexible Validation**: Handles both string and array document formats

#### CF14 Semantic Enhancement
- **Dual UI Architecture**: Standard `/chirality-core` and enhanced `/chirality-graph`
- **CF14 Context Injection**: Semantic matrix data enhances document generation
- **GraphQL Integration**: Real-time CF14 matrix queries with production security
- **Neo4j Storage**: Shared semantic context between Python framework and TypeScript app

#### Document Types Generated
- **DS (Data Sheet)**: Core data specifications and requirements
- **SP (Procedural Checklist)**: Step-by-step implementation procedures  
- **X (Solution Template)**: Integrated solution framework
- **M (Guidance)**: Strategic recommendations and risk considerations

### 🏗️ Technical Architecture

#### Frontend Stack
- **Next.js 15.2.3** with App Router
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Zustand** for UI state management
- **Server-Sent Events** for real-time streaming

#### AI Integration
- **OpenAI Chat Completions API** (gpt-4.1-nano)
- **RAG-Enhanced Chat** with automatic document context injection
- **CF14 Semantic Matrices** for enhanced reasoning
- **Streaming Responses** with proper error handling

#### Graph Integration (Optional)
- **Neo4j 5+** with GraphQL API
- **CF14 Matrix Queries** with depth/complexity validation
- **Production Security** with bearer token authentication
- **Idempotent Operations** with stable content-based IDs

### 🚀 Getting Started

#### Quick Setup
```bash
# Clone and install
npm install

# Environment setup
cp .env.example .env.local
# Add your OpenAI API key

# Start development server
npm run dev
# Visit http://localhost:3001
```

#### Optional CF14 Enhancement
```bash
# Start Neo4j for graph features
docker compose -f docker-compose.neo4j.yml up -d

# Initialize graph constraints
npm run init:graph:constraints

# Export CF14 matrices (from semantic framework)
cd ../chirality-semantic-framework
python -m chirality.cli run --thread "demo:test" \
  --A chirality/tests/fixtures/A.json \
  --B chirality/tests/fixtures/B.json \
  --resolver echo --write-cf14-neo4j
```

### 📚 Key Documentation

#### User Guides
- **[README.md](README.md)** - Project overview and quick start
- **[GETTING_STARTED.md](GETTING_STARTED.md)** - Complete setup guide
- **[HELP.md](HELP.md)** - Common issues and troubleshooting

#### Developer Resources
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System design and implementation
- **[API.md](API.md)** - Complete API documentation
- **[CLAUDE.md](CLAUDE.md)** - AI collaboration patterns and testing workflows

### 🎯 API Endpoints

#### Document Generation
- `POST /api/core/orchestrate` - Two-pass generation with resolution
- `POST /api/core/run` - Single document generation
- `GET/POST/DELETE /api/core/state` - Document state management

#### Chat System
- `POST /api/chat/stream` - RAG-enhanced streaming chat with document injection
- `GET /api/chat/debug` - System status and debugging

#### CF14 Graph Integration
- `POST /api/v1/graph/graphql` - CF14 semantic matrix queries
- `GET /api/v1/graph/health` - Graph system health check

### 🧪 Scripts and Tools

#### Development
- `npm run dev` - Development server with hot reloading
- `npm run build` - Production build
- `npm run type-check` - TypeScript validation
- `npm run lint` - Code linting

#### CF14 Integration
- `npm run init:graph:constraints` - Initialize Neo4j constraints
- `npm run link:cf14` - Link CF14 semantic nodes to document components
- `npm run graph:health` - Check CF14 graph connectivity

#### Testing and Debug
- `npm run orchestrate:test` - Test document generation pipeline
- `npm run state:clear` - Clear all generated documents
- `npm run debug` - System status check

### 🔧 Files and Components

#### Core Implementation
- `/src/app/chirality-core/page.tsx` - Standard document generation UI
- `/src/app/chirality-graph/page.tsx` - CF14-enhanced generation UI
- `/src/app/api/core/orchestrate/route.ts` - Two-pass orchestration endpoint
- `/src/app/api/chat/stream/route.ts` - RAG chat with document injection

#### CF14 Integration Layer
- `/src/app/api/v1/graph/graphql/route.ts` - GraphQL API with CF14 types
- `/scripts/cf14-indexes.cypher` - Neo4j constraints for CF14 data
- `/scripts/link-cf-to-components.ts` - CF14 semantic alignment
- `/types/graphql-*.d.ts` - TypeScript declarations for GraphQL validation

### 🌟 Use Cases
- **Technical Planning** - Software architecture and implementation strategies
- **Process Documentation** - Operational procedures and workflow design  
- **Problem Solving** - Complex technical challenges with structured analysis
- **Knowledge Management** - Converting problems into reusable documentation
- **Research Enhancement** - CF14 semantic context for deeper insights

### 🔗 Integration with Chirality Semantic Framework
This release pairs perfectly with chirality-semantic-framework v14.3.0 for complete CF14 semantic enhancement capabilities.

---

**Requirements**: Node.js 18+, OpenAI API key
**Optional**: Neo4j 5+ for CF14 enhancement
**License**: MIT
