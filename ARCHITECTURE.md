# Architecture - Chirality AI App

## System Overview

Chirality AI App implements a Next.js-based chat interface with document generation capabilities, featuring a two-pass semantic document system that creates coherent, cross-referenced DS/SP/X/M documents through iterative refinement.

## High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Chat Interface│    │  Document Gen   │    │  Admin Dashboard│
│   (Main Page)   │    │  (/chirality-   │    │ (/chat-admin)   │
│                 │    │   core)         │    │                 │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │     Next.js API Routes    │
                    │ (/api/chat /api/core      │
                    │  /api/v1/graph)           │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │   Chirality Core Engine   │
                    │  (Two-Pass Generation +   │
                    │   Graph Mirror)           │
                    └─────────────┬─────────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          │                       │                       │
┌─────────▼─────────┐    ┌─────────▼─────────┐    ┌─────────▼─────────┐
│  File Storage     │    │   Graph Mirror    │    │  GraphQL API      │
│  (Source of       │    │   (Selected       │    │  (Read-Only       │
│   Truth)          │    │    Metadata)      │    │   Queries)        │
│                   │    │                   │    │                   │
│ store/state.json  │    │  Neo4j Database   │    │ /api/v1/graph/    │
│                   │    │                   │    │  graphql          │
└───────────────────┘    └───────────────────┘    └───────────────────┘
```

## Core Components

### Frontend Application | ✅ **IMPLEMENTED**
**Location**: `src/app/`

React-based user interface with multiple specialized pages.

#### Key Pages
- **[`page.tsx`](src/app/page.tsx)**: Main chat interface with RAG document integration
- **[`chirality-core/page.tsx`](src/app/chirality-core/page.tsx)**: Document generation interface
- **[`chat-admin/page.tsx`](src/app/chat-admin/page.tsx)**: System monitoring and debugging dashboard

#### Component Architecture
```typescript
// Main chat interface with streaming support
<ChatWindow>
  <Message />           # Individual message rendering
  <ChatInput />         # User input with command detection
  <TypingIndicator />   # Real-time typing feedback
</ChatWindow>
```

### API Layer | ✅ **IMPLEMENTED**
**Location**: `src/app/api/`

Next.js API routes providing document generation and chat capabilities.

#### Core Endpoints
- **[`/api/core/orchestrate`](src/app/api/core/orchestrate/route.ts)**: Two-pass document generation with refinement
- **[`/api/core/run`](src/app/api/core/run/route.ts)**: Single document generation
- **[`/api/chat/stream`](src/app/api/chat/stream/route.ts)**: RAG-enhanced streaming chat with SSE
- **[`/api/core/state`](src/app/api/core/state/route.ts)**: Document state management

#### Graph API Endpoints | 📋 **PLANNED**
- **[`/api/v1/graph/graphql`](src/app/api/v1/graph/graphql/route.ts)**: Read-only GraphQL endpoint for document relationships
- **[`/api/v1/graph/validate`](src/app/api/v1/graph/validate/route.ts)**: Component selection validation
- **[`/api/v1/graph/health`](src/app/api/v1/graph/health/route.ts)**: Graph system health check

#### API Architecture Pattern
```typescript
// Consistent error handling and type safety
export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Process request with type validation
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

### Document Generation Engine | ✅ **IMPLEMENTED**
**Location**: `src/chirality-core/`

Core logic implementing the two-pass semantic document generation system.

#### Key Modules
- **[`orchestrate.ts`](src/chirality-core/orchestrate.ts)**: Main orchestration logic with two-pass execution
- **[`contracts.ts`](src/chirality-core/contracts.ts)**: TypeScript interfaces for document types
- **[`validators.ts`](src/chirality-core/validators.ts)**: Flexible validation handling strings and arrays
- **[`systemPrompt.ts`](src/chirality-core/systemPrompt.ts)**: LLM system prompt templates
- **[`userPrompt.ts`](src/chirality-core/userPrompt.ts)**: Dynamic user prompt generation

#### Two-Pass Generation Process
```typescript
// Pass 1: Sequential generation
const pass1 = await Promise.all([
  runDoc('DS', problem, {}, resolver),
  runDoc('SP', problem, { DS: pass1.DS }, resolver),
  runDoc('X', problem, { DS: pass1.DS, SP: pass1.SP }, resolver),
  runDoc('M', problem, { DS: pass1.DS, SP: pass1.SP, X: pass1.X }, resolver)
]);

// Pass 2: Cross-referential refinement
const pass2 = await refineDocuments(pass1, resolver);

// Final resolution
const finalX = await resolveDocument(pass2, resolver);
```

### State Management | ✅ **IMPLEMENTED**
**Location**: `src/chirality-core/state/`

File-based persistence system with Zustand for UI state.

#### Storage Architecture
- **File Storage**: JSON-based document persistence in `store/state.json`
- **UI State**: Zustand store for component state management
- **Session Management**: Conversation tracking and document context

#### State Schema
```typescript
interface ChiralityState {
  problem?: { statement: string };
  finals?: {
    DS?: Triple<DSItem[]>;
    SP?: Triple<SPItem[]>;
    X?: Triple<XItem[]>;
    M?: Triple<MItem[]>;
  };
  metadata?: {
    lastGenerated: string;
    generationMode: 'single' | 'two-pass';
  };
}
```

### LLM Integration | ✅ **IMPLEMENTED**
**Location**: `src/chirality-core/vendor/`

OpenAI API integration with streaming support and error handling.

#### Integration Features
- **Model Configuration**: gpt-4.1-nano with configurable parameters
- **Streaming Support**: Real-time response generation for chat interface
- **Error Recovery**: Graceful handling of API failures and rate limits
- **Context Management**: Automatic document injection for RAG functionality

### Graph Integration Layer | 📋 **PLANNED**
**Location**: `src/lib/graph/`

Metadata-only graph mirroring system that enhances document discoverability while maintaining files as the source of truth.

#### Architecture Principles
- **Files as Source of Truth**: Complete document bodies remain in file system
- **Graph as Metadata Mirror**: Neo4j contains selected high-value components for discovery
- **Async Mirroring**: Graph updates happen after file writes, non-blocking
- **Feature Flagged**: Entire system controlled via `FEATURE_GRAPH_ENABLED`

#### Key Components
```typescript
// Component selection algorithm
export function selectForMirror(bundle: DocumentBundle, config: SelectionConfig) {
  // Rule-based scoring: +3 for cross-refs, +2 for keywords, -2 for large sections
  return {
    docs: selectedDocuments,
    components: selectedComponents,
    references: documentReferences,
    derived: documentLineage
  };
}

// Idempotent mirror synchronization
export async function mirrorAfterWrite(bundle: DocumentBundle) {
  if (process.env.FEATURE_GRAPH_ENABLED !== "true") return;
  
  const selection = selectForMirror(bundle, selectionConfig);
  queueMicrotask(() => 
    mirrorGraph({ selection_v: "1.0.0", ...selection })
      .catch(err => console.warn("mirror deferred failed", err))
  );
}
```

#### Selection Strategy
- **Rule-Based Selection**: Algorithm-driven component selection using scoring
- **Cross-References**: +3 points for sections with 2+ document references
- **Keywords**: +2 points for headings starting with high-value indicators
- **Size Penalties**: -2 points for large sections with few references
- **Stable IDs**: SHA1-based component identifiers for consistency

#### Neo4j Schema
```cypher
// Document and Component nodes with relationships
(:Document {id, kind, slug, title, updatedAt, selection_v})
(:Component {id, type, title, anchor, order, score})

// Relationship types
(doc:Document)-[:CONTAINS]->(comp:Component)
(doc1:Document)-[:REFERENCES]->(doc2:Document)
(derived:Document)-[:DERIVED_FROM]->(source:Document)
```

### Chat System with RAG | ✅ **IMPLEMENTED**
**Location**: `src/app/api/chat/stream/`

Server-sent events based chat with automatic document context injection.

#### RAG Implementation
```typescript
// Automatic document context injection
const instructions = [
  'You are the Chirality Chat engine.',
  'Use pinned DS/SP/X/M as ground truth context for this session.',
  'Prefer cited evidence; include citation IDs when relevant.'
];

if (hasDocuments) {
  instructions.push('--- Pinned Finals (compact) ---');
  if (DS) instructions.push(`DS: ${compactDS(DS.text)}`);
  if (SP) instructions.push(`SP: ${compactSP(SP.text)}`);
  if (X) instructions.push(`X: ${compactX(X.text)}`);
  if (M) instructions.push(`M: ${compactM(M.text)}`);
  instructions.push('--- End Pinned ---');
}
```

## Data Flow

### Document Generation Flow
1. **User Input**: Problem statement entered in `/chirality-core`
2. **Validation**: Input validation and problem context setting
3. **Pass 1**: Sequential generation of DS → SP → X → M documents
4. **Pass 2**: Cross-referential refinement using insights from all documents
5. **Resolution**: Final X document update with all refined content
6. **File Storage**: Document persistence to file-based storage (source of truth)
7. **Graph Mirror**: Async mirroring of selected components to Neo4j (if enabled)
8. **UI Update**: Real-time progress display and result presentation

### Graph Mirroring Flow | 📋 **PLANNED**
1. **Document Write**: Successful file write completion
2. **Component Selection**: Rule-based scoring algorithm identifies high-value sections
3. **Mirror Trigger**: Non-blocking async call to graph mirror
4. **Neo4j Sync**: Idempotent upsert of documents, components, and relationships
5. **Removal Handling**: Cleanup of stale components using set difference approach
6. **Metrics Emission**: Performance and success metrics logging

### Chat Integration Flow
1. **Message Input**: User message in chat interface
2. **Context Injection**: Automatic inclusion of generated documents
3. **LLM Processing**: OpenAI API call with enriched context
4. **Streaming Response**: Server-sent events for real-time display
5. **Citation Handling**: Reference management for document sources

### State Synchronization
```
User Actions → UI State (Zustand) → API Calls → File Storage → State Refresh
     ↑                                                              ↓
     └─────────────────── UI Updates ←────────────────────────────┘
```

## Technology Stack

### Core Technologies | ✅ **IMPLEMENTED**
- **Frontend**: Next.js 15.2.3 with App Router
- **Runtime**: React 18 with TypeScript
- **Styling**: Tailwind CSS with responsive design
- **AI Integration**: OpenAI Chat Completions API
- **State Management**: Zustand for UI, file-based for persistence

### Graph Technologies | 📋 **PLANNED**
- **Graph Database**: Neo4j 5 Community Edition
- **GraphQL Layer**: @neo4j/graphql with schema generation
- **Query Interface**: Apollo Client for frontend integration
- **Document Processing**: gray-matter, remark, unified for content parsing
- **Mirroring**: neo4j-driver with connection pooling and retry logic

### Development Tools
- **Build System**: Next.js with Turbopack
- **Type Safety**: TypeScript strict mode
- **Code Quality**: ESLint configuration
- **Package Management**: npm with lock file

## Scalability Considerations

### Performance Optimization | ✅ **CURRENT IMPLEMENTATION**
- **Streaming Responses**: Real-time UI updates during document generation
- **Component Lazy Loading**: Code splitting for better initial load times
- **State Optimization**: Minimal re-renders through proper state management
- **File I/O Efficiency**: Atomic operations for state persistence

### Resource Management
- **Memory Usage**: Efficient document storage and retrieval
- **API Rate Limiting**: Built-in handling for OpenAI API constraints
- **Error Recovery**: Graceful degradation during service failures
- **Concurrent Operations**: Safe handling of multiple document generations

## Security Architecture

### API Security | ✅ **IMPLEMENTED**
- **Environment Variables**: Secure API key management
- **Input Validation**: Request sanitization and validation
- **Error Handling**: No sensitive information exposure in error messages
- **CORS Configuration**: Appropriate cross-origin resource sharing

### Graph Security | 📋 **PLANNED**
- **Bearer Token Authentication**: Required for all GraphQL endpoints
- **Query Complexity Limiting**: Depth and cost analysis for GraphQL queries
- **Rate Limiting**: Request throttling for graph API endpoints
- **CORS Restrictions**: Configurable allowed origins for GraphQL access
- **Feature Flagging**: Complete graph system can be disabled via environment

### Data Protection
- **Local Storage**: File-based persistence without external dependencies
- **Content Validation**: Document content sanitization
- **Session Isolation**: Conversation and document context separation

## Extension Points

### Custom Document Types | 📋 **PLANNED**
Framework supports adding new document types beyond DS/SP/X/M:
```typescript
interface CustomDocType {
  // Define new document structure
  customField: string;
  metadata?: Record<string, any>;
}

// Extend orchestration logic
export async function runCustomDoc(
  type: string,
  problem: string,
  context: Record<string, any>,
  resolver: LLMResolver
): Promise<Triple<CustomDocType[]>>
```

### Resolver Strategies | 📋 **PLANNED**
Support for alternative LLM providers and resolution strategies:
- **Local LLM Integration**: Offline document generation
- **Multi-Model Ensemble**: Combining multiple LLM responses
- **Human-in-the-Loop**: Manual validation and refinement steps

### Storage Backends | 📋 **PLANNED**
Alternative persistence mechanisms:
- **Database Integration**: PostgreSQL or MongoDB for multi-user scenarios
- **Cloud Storage**: S3 or similar for distributed deployments
- **Version Control**: Git-based document history tracking

## Deployment Architecture

### Development Environment | ✅ **CURRENT**
- **Local Development**: `npm run dev` with hot reloading
- **Port Configuration**: Automatic port selection (3001 or 3000)
- **Environment Setup**: `.env.local` for API key configuration

### Production Considerations | 📋 **PLANNED**
- **Build Optimization**: `npm run build` for production assets
- **Environment Configuration**: Production environment variables
- **Monitoring**: Application performance and error tracking
- **Scaling**: Horizontal scaling considerations for multi-user deployment

## Quality Assurance

### Testing Strategy | 🔄 **IN_PROGRESS**
- **API Testing**: Endpoint validation and error handling
- **Component Testing**: React component unit tests
- **Integration Testing**: End-to-end document generation workflows
- **Performance Testing**: Load testing for document generation under stress

### Code Quality Standards
- **TypeScript Strict Mode**: Full type safety across the application
- **ESLint Configuration**: Consistent code style and error prevention
- **Component Patterns**: Reusable component architecture
- **Error Boundaries**: Robust error handling in React components

## Migration and Evolution

### Architecture Evolution | ✅ **COMPLETED**
The current implementation provides a hybrid approach:
- **Core Functionality**: File-based storage with direct API routes for reliability
- **Enhanced Discovery**: Optional graph layer for metadata and relationships
- **Incremental Adoption**: Graph features are feature-flagged and non-blocking
- **Source of Truth**: Files remain authoritative, graph provides auxiliary value

### Future Evolution Path | 📋 **ROADMAP**
- **Graph Enhancement**: Complete graph integration with frontend discovery interface
- **Enhanced RAG**: Vector similarity search combined with graph relationship traversal
- **Multi-User Support**: User authentication and document isolation with graph-based sharing
- **Advanced Analytics**: Usage tracking and document quality metrics via graph analysis
- **AI-Assisted Selection**: LLM-guided component selection with effectiveness tracking
- **API Versioning**: Backward compatibility for API evolution

---

*Architecture documentation for Chirality AI App - Reflects current implementation with Next.js, two-pass document generation, and RAG-enhanced chat interface.*