# Integration Architecture - Graph Mirror with Selected Components

*System architecture for integrating document generation with metadata-only graph mirroring and read-only GraphQL access*

## Overview

This document defines the architecture for the hybrid approach where files remain the source of truth for complete document bodies, while Neo4j serves as a metadata-rich mirror for selected components with relationship tracking. The integration provides enhanced discoverability and relationship analysis without duplicating full content.

## Architecture Principles

### Files as Source of Truth
- **Complete Documents**: All DS/SP/X/M documents stored as files with full content
- **Single Write Path**: Only file system receives document writes
- **Authoritative State**: File system maintains complete document state and history

### Graph as Metadata Mirror
- **Selected Components**: Only high-value document sections mirrored to Neo4j
- **Relationship Tracking**: Cross-document references and derivations in graph
- **Read-Only Access**: Graph serves queries but never accepts writes
- **Async Mirroring**: Graph updates asynchronously after successful file writes

## System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Document Gen  │    │   Chat Interface│    │  Admin Dashboard│
│   (/chirality-  │    │   (Main Page)   │    │ (/chat-admin)   │
│    core)        │    │                 │    │                 │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │     Next.js API Routes    │
                    │   (/api/core /api/chat)   │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │  Document Generation +    │
                    │   Mirror Integration      │
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

## Component Selection Strategy

### Selection Configuration
```json
{
  "selection_v": "1.0.0",
  "threshold": 3,
  "topKPerDoc": 12,
  "maxNodesPerRun": 50,
  "keywords": ["API", "Dependency", "Integration", "Decision", "Risk", "Metric"],
  "largeSectionCharLimit": 10000
}
```

### Rule-Based Selection (Option 1 - MVP Implementation)

**Scoring Algorithm**:
- **Cross-References**: +3 points for sections with 2+ document references
- **Keywords**: +2 points for headings starting with selection keywords
- **Inbound Links**: +1 point for sections referenced by other documents
- **Large Sections**: -2 points if section >10k chars with <3 references

**Selection Criteria**:
- Score ≥ threshold (3) for inclusion
- Maximum 12 components per document
- Maximum 50 total nodes per mirror run
- Stable component IDs using content hashing

### Document Reference Extraction
```typescript
export function extractDocRefs(text: string): string[] {
  // [[DS:payments-auth]] or [[sp-deploy-runbook]]
  const wiki = /\[\[([A-Za-z]{1,2}:[\w-]+|[a-z0-9-]+)\]\]/g;
  // (…/docs/slug) or (slug)
  const md = /\]\((?:\/docs\/)?([a-z0-9-]+)\)/g;
  // inline DS:slug or SP:slug
  const inline = /\b([A-Za-z]{1,2}:[\w-]+)\b/g;
  
  const ids = new Set<string>();
  for (const m of text.matchAll(wiki)) ids.add(m[1]);
  for (const m of text.matchAll(md)) ids.add(m[1]);
  for (const m of text.matchAll(inline)) ids.add(m[1]);
  return [...ids];
}
```

## Data Flow Architecture

### Document Generation Flow
1. **User Input**: Problem statement and generation parameters
2. **File Generation**: Two-pass document generation writes to file system
3. **File Validation**: Ensure complete document persistence
4. **Mirror Trigger**: Async call to graph mirror after successful file write
5. **Component Selection**: Apply scoring algorithm to identify valuable sections
6. **Graph Update**: Idempotent upsert to Neo4j with relationship tracking

### Mirror Integration Points
```typescript
// Single integration point after file write
export async function mirrorAfterWrite(bundle: DocumentBundle) {
  if (process.env.FEATURE_GRAPH_ENABLED !== "true") return;
  
  const selection = selectForMirror(bundle, selectionConfig);
  
  // Non-blocking async mirror
  queueMicrotask(() => 
    mirrorGraph({ selection_v: "1.0.0", ...selection })
      .catch(err => console.warn("mirror deferred failed", err))
  );
}

// Integrated after successful file write
await writeDocumentsToFile(bundle);
await mirrorAfterWrite(bundle); // Non-blocking
```

### Query Access Patterns
- **Document Discovery**: Find documents by relationships and metadata
- **Component Search**: Full-text search within selected high-value sections
- **Relationship Analysis**: Traverse document dependencies and derivations
- **Impact Assessment**: Identify documents affected by changes

## Neo4j Graph Schema

### Node Types
```cypher
// Document nodes (one per DS/SP/X/M document)
(:Document {
  id: String,           // e.g., "DS:auth-system"
  kind: String,         // "DS" | "SP" | "X" | "M"
  slug: String,         // e.g., "auth-system"
  title: String,        // Document title
  updatedAt: String,    // ISO timestamp
  selection_v: String   // Selection algorithm version
})

// Component nodes (selected document sections)
(:Component {
  id: String,          // Stable hash of docId + anchor
  type: String,        // Section type (first word of heading)
  title: String,       // Section heading
  anchor: String,      // URL anchor for section
  order: Int,          // Section order within document
  score: Int          // Selection score
})
```

### Relationship Types
```cypher
// Document contains selected components
(doc:Document)-[:CONTAINS]->(comp:Component)

// Cross-document references
(doc1:Document)-[:REFERENCES]->(doc2:Document)

// Document derivation lineage
(derived:Document)-[:DERIVED_FROM]->(source:Document)
```

### Constraints and Indexes
```cypher
CREATE CONSTRAINT doc_id IF NOT EXISTS 
FOR (d:Document) REQUIRE d.id IS UNIQUE;

CREATE CONSTRAINT comp_id IF NOT EXISTS 
FOR (c:Component) REQUIRE c.id IS UNIQUE;

CREATE INDEX doc_kind IF NOT EXISTS
FOR (d:Document) ON (d.kind);

CREATE INDEX comp_title_text IF NOT EXISTS
FOR (c:Component) ON (c.title);
```

## GraphQL API Design

### Schema Definition
```graphql
type Document {
  id: ID!
  kind: String!
  slug: String!
  title: String!
  updatedAt: String
  components: [Component!]! @relationship(type: "CONTAINS", direction: OUT)
  references: [Document!]! @relationship(type: "REFERENCES", direction: OUT)
  derivedFrom: [Document!]! @relationship(type: "DERIVED_FROM", direction: OUT)
}

type Component {
  id: ID!
  type: String!
  title: String!
  anchor: String
  order: Int
  score: Int
  parent: Document! @relationship(type: "CONTAINS", direction: IN)
}

type Query {
  document(where: DocumentWhereOne!): Document
  documents(where: DocumentWhere): [Document!]!
  searchComponents(q: String!, limit: Int = 20): [Component!]!
    @cypher(
      statement: """
      MATCH (c:Component)
      WHERE toLower(c.title) CONTAINS toLower($q)
      RETURN c LIMIT $limit
      """
    )
}
```

### Security and Access Control
```typescript
// Bearer token authentication
const auth = req.headers.get("authorization") || "";
const authorized = auth === `Bearer ${process.env.GRAPHQL_BEARER_TOKEN}`;

// CORS configuration
const corsOrigins = process.env.GRAPHQL_CORS_ORIGINS || "*";

// Simple depth limiting
if (typeof query === "string" && (query.match(/\{/g)?.length || 0) > 20) {
  return NextResponse.json({ error: "Query too deep" }, { status: 400 });
}
```

### Example Queries
```graphql
# Find document with relationships
query GetDocument($id: ID!) {
  document(where: { id: $id }) {
    id
    title
    kind
    references {
      id
      title
      kind
    }
    components {
      id
      title
      anchor
      order
    }
  }
}

# Search components by content
query SearchComponents($query: String!) {
  searchComponents(q: $query, limit: 10) {
    id
    title
    type
    parent {
      id
      title
      kind
    }
  }
}

# Find document lineage
query DocumentLineage($id: ID!) {
  document(where: { id: $id }) {
    id
    title
    derivedFrom {
      id
      title
      derivedFrom {
        id
        title
      }
    }
  }
}
```

## Mirror Synchronization

### Idempotent Updates
```typescript
export async function mirrorGraph(payload: MirrorPayload) {
  const session = driver.session();
  
  try {
    await session.executeWrite(async tx => {
      // Upsert documents and components
      await tx.run(`
        UNWIND $docs AS d
          MERGE (doc:Document {id: d.id})
          SET doc += d.props, doc.selection_v = $selection_v;
        
        UNWIND $components AS c
          MERGE (k:Component {id: c.id})
          SET k += c.props;
      `, { docs: payload.docs, components: payload.components, selection_v: payload.selection_v });

      // Handle component removals (set difference)
      await tx.run(`
        UNWIND keys($keepByDoc) AS did
        WITH did, $keepByDoc[did] AS keep
        MATCH (d:Document {id: did})-[r:CONTAINS]->(k:Component)
        WHERE NOT k.id IN keep
        DELETE r
        WITH k
        WHERE size( (k)<-[:CONTAINS]-() ) = 0
        DETACH DELETE k
      `, { keepByDoc: payload.keepByDoc });

      // Update relationships with cycle prevention
      await tx.run(`
        UNWIND $derived AS e
        MATCH (s:Document {id: e.src}), (t:Document {id: e.dst})
        WHERE NOT (t)-[:DERIVED_FROM*1..]->(s)
        MERGE (s)-[:DERIVED_FROM]->(t)
      `, { derived: payload.derived });
    });
  } finally {
    await session.close();
  }
}
```

### Conflict Resolution
- **File Wins**: Files always override graph state in case of conflicts
- **Async Updates**: Graph updates never block file operations
- **Graceful Degradation**: System continues operating if graph is unavailable
- **Retry Logic**: Failed mirror operations retry with exponential backoff

## Performance Considerations

### Selection Efficiency
- **Batch Processing**: Process multiple documents in single mirror operation
- **Content Limits**: Configurable limits prevent oversized graph operations
- **Incremental Updates**: Only mirror changed documents when possible
- **Memory Management**: Streaming processing for large document sets

### Query Optimization
- **Graph Indexes**: Strategic indexes on frequently queried fields
- **Query Complexity**: Depth and cost limiting for GraphQL queries
- **Connection Pooling**: Efficient Neo4j driver configuration
- **Caching**: GraphQL query result caching where appropriate

### Monitoring and Observability
```typescript
// Metrics emitted
graph_mirror_attempts_total{result=success|failure}
graph_mirror_latency_ms
graphql_requests_total{route="/api/v1/graph/graphql"}
graphql_latency_ms
component_selection_count
document_mirror_size_bytes
```

## Development and Testing

### Local Development Setup
```bash
# Start Neo4j container
docker compose -f docker-compose.neo4j.yml up -d

# Environment configuration
FEATURE_GRAPH_ENABLED=true
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=testpass
GRAPHQL_CORS_ORIGINS=http://localhost:3000
GRAPHQL_BEARER_TOKEN=dev-super-secret
```

### Validation Endpoint
```typescript
// POST /api/v1/graph/validate
// Validates selection logic without writing to graph
export async function POST(req: NextRequest) {
  const { bundle } = await req.json();
  const selection = selectForMirror(bundle, selectionConfig);
  
  return NextResponse.json({
    docs: selection.docs.map(d => d.id),
    keepByDoc: selection.keepByDoc,
    components: selection.components.map(c => ({ 
      id: c.id, 
      docId: c.docId 
    }))
  });
}
```

### Backfill Operations
```bash
# Backfill from existing files
pnpm tsx scripts/backfill-graph-from-files.ts \
  --root=content \
  --since=2025-08-01 \
  --batch=200
```

## Future Enhancements

### Alternative Selection Strategies
- **Option 2 - User-Driven**: Chat commands and UI for targeted component selection
- **Option 3 - AI-Assisted**: LLM-guided selection with effectiveness tracking
- **Hybrid Approaches**: Combine rule-based with user overrides and AI hints

### Advanced Graph Features
- **Vector Embeddings**: Semantic similarity search within components
- **Temporal Queries**: Time-based component and relationship analysis
- **Impact Analysis**: Automated assessment of document change effects
- **Quality Scoring**: ML-based component importance and quality metrics

### Integration Expansion
- **External Systems**: Connect graph data to project management and documentation tools
- **Real-time Updates**: WebSocket subscriptions for live graph updates
- **Advanced Analytics**: Usage patterns and relationship strength analysis
- **Collaborative Features**: User annotations and bookmarking of components

---

*This integration architecture provides a scalable foundation for enhanced document discoverability while maintaining the simplicity and reliability of file-based document storage.*