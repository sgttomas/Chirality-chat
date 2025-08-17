# GraphQL Neo4j Integration Plan

*Complete integration strategy for metadata-only graph mirroring with read-only GraphQL access*

## Executive Summary

This document outlines the complete integration plan for implementing a metadata-only graph mirror using Neo4j and GraphQL within the chirality-ai-app ecosystem. The design maintains files as the source of truth for document content while leveraging Neo4j for enhanced discoverability and relationship analysis of selected high-value components.

## Integration Architecture

### System Overview
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

### Core Principles
1. **Files as Source of Truth**: Complete document bodies remain in file system
2. **Graph as Metadata Mirror**: Neo4j contains selected components for discovery
3. **Async Mirroring**: Graph updates happen after file writes, non-blocking
4. **Read-Only GraphQL**: Query-only API with authentication and security
5. **Feature Flagged**: Entire system controlled via environment variables

## Phase 1: Backend Integration (Mirroring)

### 1.1 Selection Algorithm Implementation

#### Component Selection Strategy
```typescript
// Rule-based selection with configurable parameters
interface SelectionConfig {
  selection_v: string;           // Algorithm version for tracking
  threshold: number;             // Minimum score for inclusion (3)
  topKPerDoc: number;            // Max components per document (12)
  maxNodesPerRun: number;        // Total node limit per mirror (50)
  keywords: string[];            // High-value section indicators
  largeSectionCharLimit: number; // Penalty threshold for oversized sections
}

// Scoring algorithm
function scoreSection(doc: Doc, section: Section, config: SelectionConfig): number {
  let score = 0;
  
  // Cross-references: +3 points for 2+ document references
  const refs = extractDocRefs(section.content).filter(r => r !== doc.id);
  if (refs.length >= 2) score += 3;
  
  // Keywords: +2 points for important headings
  const kwRegex = new RegExp(`^(${config.keywords.join("|")})`, "i");
  if (kwRegex.test(section.heading)) score += 2;
  
  // Size penalty: -2 points for large sections with few references
  if (section.content.length > config.largeSectionCharLimit && refs.length < 3) {
    score -= 2;
  }
  
  return score;
}
```

#### Reference Extraction
```typescript
// Extract document references from content
export function extractDocRefs(text: string): string[] {
  const ids = new Set<string>();
  
  // Wiki-style: [[DS:auth-system]] or [[sp-deploy]]
  const wiki = /\[\[([A-Za-z]{1,2}:[\w-]+|[a-z0-9-]+)\]\]/g;
  
  // Markdown: (…/docs/slug) or (slug)
  const md = /\]\((?:\/docs\/)?([a-z0-9-]+)\)/g;
  
  // Inline: DS:slug or SP:slug
  const inline = /\b([A-Za-z]{1,2}:[\w-]+)\b/g;
  
  for (const match of text.matchAll(wiki)) ids.add(match[1]);
  for (const match of text.matchAll(md)) ids.add(match[1]);
  for (const match of text.matchAll(inline)) ids.add(match[1]);
  
  return [...ids];
}
```

### 1.2 Mirror Synchronization

#### Idempotent Mirror Operations
```typescript
// Core mirror function with error handling
export async function mirrorGraph(payload: MirrorPayload) {
  if (process.env.FEATURE_GRAPH_ENABLED !== "true") return;

  const driver = getDriver();
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

      // Handle removals (set difference approach)
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

      // Update relationships
      await tx.run(`
        UNWIND $derived AS e
        MATCH (s:Document {id: e.src}), (t:Document {id: e.dst})
        WHERE NOT (t)-[:DERIVED_FROM*1..]->(s)
        MERGE (s)-[:DERIVED_FROM]->(t)
      `, { derived: payload.derived });
    });
  } finally {
    await session.close();
    await driver.close();
  }
}
```

#### Integration Point
```typescript
// Single call site after file writes
export async function mirrorAfterWrite(bundle: DocumentBundle) {
  if (process.env.FEATURE_GRAPH_ENABLED !== "true") return;
  
  const selection = selectForMirror(bundle, selectionConfig);
  
  // Non-blocking async mirror
  queueMicrotask(() => 
    mirrorGraph({ selection_v: "1.0.0", ...selection })
      .catch(err => console.warn("mirror deferred failed", err))
  );
}

// Usage in document generation flow
await writeDocumentsToFile(bundle);
await mirrorAfterWrite(bundle); // Non-blocking
```

### 1.3 Database Schema and Constraints

#### Neo4j Schema
```cypher
// Node types
(:Document {
  id: String,           // e.g., "DS:auth-system"
  kind: String,         // "DS" | "SP" | "X" | "M"
  slug: String,         // e.g., "auth-system"
  title: String,        // Document title
  updatedAt: String,    // ISO timestamp
  selection_v: String   // Selection algorithm version
})

(:Component {
  id: String,          // Stable hash of docId + anchor
  type: String,        // Section type (first word of heading)
  title: String,       // Section heading
  anchor: String,      // URL anchor for section
  order: Int,          // Section order within document
  score: Int          // Selection score
})

// Relationship types
(doc:Document)-[:CONTAINS]->(comp:Component)
(doc1:Document)-[:REFERENCES]->(doc2:Document)
(derived:Document)-[:DERIVED_FROM]->(source:Document)
```

#### Database Initialization
```cypher
// Constraints for data integrity
CREATE CONSTRAINT doc_id IF NOT EXISTS 
FOR (d:Document) REQUIRE d.id IS UNIQUE;

CREATE CONSTRAINT comp_id IF NOT EXISTS 
FOR (c:Component) REQUIRE c.id IS UNIQUE;

// Performance indexes
CREATE INDEX doc_kind IF NOT EXISTS
FOR (d:Document) ON (d.kind);

CREATE INDEX comp_title_text IF NOT EXISTS
FOR (c:Component) ON (c.title);
```

## Phase 2: GraphQL API Implementation

### 2.1 Schema Definition

#### GraphQL Type System
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

### 2.2 API Route Implementation

#### Secure GraphQL Endpoint
```typescript
// app/api/v1/graph/graphql/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Neo4jGraphQL } from "@neo4j/graphql";
import neo4j from "neo4j-driver";
import { graphql } from "graphql";

// Schema initialization with connection pooling
let schemaPromise: Promise<any> | null = null;
function getSchema() {
  if (!schemaPromise) {
    const driver = neo4j.driver(
      process.env.NEO4J_URI!,
      neo4j.auth.basic(process.env.NEO4J_USERNAME!, process.env.NEO4J_PASSWORD!),
      {
        maxConnectionPoolSize: 50,
        connectionAcquisitionTimeout: 30000
      }
    );
    const neoSchema = new Neo4jGraphQL({ typeDefs, driver });
    schemaPromise = neoSchema.getSchema();
  }
  return schemaPromise;
}

// Security and CORS configuration
function cors() {
  return {
    "Access-Control-Allow-Origin": process.env.GRAPHQL_CORS_ORIGINS || "*",
    "Access-Control-Allow-Headers": "content-type, authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };
}

export async function POST(req: NextRequest) {
  // Feature flag check
  if (process.env.FEATURE_GRAPH_ENABLED !== "true") {
    return NextResponse.json(
      { error: "Graph disabled" }, 
      { status: 503, headers: cors() }
    );
  }

  // Authentication
  const auth = req.headers.get("authorization") || "";
  const authorized = auth === `Bearer ${process.env.GRAPHQL_BEARER_TOKEN}`;
  if (!authorized) {
    return NextResponse.json(
      { error: "Unauthorized" }, 
      { status: 401, headers: cors() }
    );
  }

  const { query, variables, operationName } = await req.json();
  
  // Query complexity limiting
  if (typeof query === "string" && (query.match(/\{/g)?.length || 0) > 20) {
    return NextResponse.json(
      { error: "Query too deep" }, 
      { status: 400, headers: cors() }
    );
  }

  const schema = await getSchema();
  const result = await graphql({
    schema,
    source: query,
    variableValues: variables,
    operationName,
    contextValue: {}
  });

  return NextResponse.json(result, { headers: cors() });
}
```

### 2.3 Example Query Patterns

#### Document Discovery Queries
```graphql
# Get document with relationships
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
      score
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

# Document lineage analysis
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

# Find documents by kind
query DocumentsByKind($kind: String!) {
  documents(where: { kind: $kind }) {
    id
    title
    slug
    updatedAt
    references {
      id
      title
    }
  }
}
```

## Phase 3: Frontend Integration

### 3.1 Client Configuration

#### Apollo Client Setup
```typescript
// lib/apollo-client.ts
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const httpLink = createHttpLink({
  uri: '/api/v1/graph/graphql',
});

const authLink = setContext((_, { headers }) => {
  const token = process.env.NEXT_PUBLIC_GRAPHQL_TOKEN;
  
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  };
});

export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache({
    typePolicies: {
      Document: {
        keyFields: ["id"],
      },
      Component: {
        keyFields: ["id"],
      }
    }
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});
```

### 3.2 Frontend Query Components

#### Document Explorer Component
```typescript
// components/graph/DocumentExplorer.tsx
import { useQuery } from '@apollo/client';
import { GET_DOCUMENT_WITH_COMPONENTS } from '../queries/documentQueries';

interface DocumentExplorerProps {
  documentId: string;
}

export function DocumentExplorer({ documentId }: DocumentExplorerProps) {
  const { data, loading, error } = useQuery(GET_DOCUMENT_WITH_COMPONENTS, {
    variables: { id: documentId },
    pollInterval: 30000, // Refresh every 30 seconds
  });
  
  if (loading) return <DocumentSkeleton />;
  if (error) return <ErrorDisplay error={error} />;
  if (!data?.document) return <DocumentNotFound id={documentId} />;
  
  const document = data.document;
  
  return (
    <div className="document-explorer">
      <DocumentHeader 
        title={document.title}
        kind={document.kind}
        slug={document.slug}
        updatedAt={document.updatedAt}
      />
      
      <ComponentGrid 
        components={document.components}
        onComponentClick={(comp) => navigateToComponent(comp.id)}
      />
      
      <RelationshipPanel>
        <RelationshipSection title="References">
          {document.references.map(ref => (
            <DocumentLink key={ref.id} document={ref} />
          ))}
        </RelationshipSection>
        
        <RelationshipSection title="Derived From">
          {document.derivedFrom.map(source => (
            <DocumentLink key={source.id} document={source} />
          ))}
        </RelationshipSection>
      </RelationshipPanel>
    </div>
  );
}
```

#### Component Search Interface
```typescript
// components/graph/ComponentSearch.tsx
import { useState } from 'react';
import { useLazyQuery } from '@apollo/client';
import { SEARCH_COMPONENTS } from '../queries/componentQueries';

export function ComponentSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchComponents, { data, loading }] = useLazyQuery(SEARCH_COMPONENTS);
  
  const handleSearch = async (query: string) => {
    if (query.trim().length < 2) return;
    
    await searchComponents({
      variables: { q: query, limit: 20 }
    });
  };
  
  return (
    <div className="component-search">
      <SearchInput
        value={searchTerm}
        onChange={setSearchTerm}
        onSearch={handleSearch}
        placeholder="Search components..."
      />
      
      {loading && <SearchSkeleton />}
      
      {data?.searchComponents && (
        <SearchResults>
          {data.searchComponents.map(component => (
            <ComponentResult
              key={component.id}
              component={component}
              onSelect={() => navigateToComponent(component.id)}
            />
          ))}
        </SearchResults>
      )}
    </div>
  );
}
```

### 3.3 Data Transformation Layer

#### Frontend Data Adapters
```typescript
// lib/graph/adapters.ts
export class GraphDataAdapter {
  // Transform component for UI display
  static formatComponent(component: RawComponent): UIComponent {
    return {
      id: component.id,
      title: component.title,
      type: component.type,
      anchor: component.anchor,
      order: component.order,
      score: component.score,
      url: `#${component.anchor}`,
      parentDocument: {
        id: component.parent.id,
        title: component.parent.title,
        kind: component.parent.kind
      }
    };
  }
  
  // Transform document for navigation
  static formatDocument(document: RawDocument): UIDocument {
    return {
      id: document.id,
      title: document.title,
      kind: document.kind,
      slug: document.slug,
      url: `/docs/${document.slug}`,
      updatedAt: new Date(document.updatedAt),
      componentCount: document.components?.length || 0,
      referenceCount: document.references?.length || 0
    };
  }
  
  // Build relationship graph for visualization
  static buildRelationshipGraph(documents: RawDocument[]): GraphData {
    const nodes = documents.map(doc => ({
      id: doc.id,
      label: doc.title,
      group: doc.kind,
      size: doc.components?.length || 1
    }));
    
    const edges: GraphEdge[] = [];
    documents.forEach(doc => {
      doc.references?.forEach(ref => {
        edges.push({
          source: doc.id,
          target: ref.id,
          type: 'references'
        });
      });
      
      doc.derivedFrom?.forEach(source => {
        edges.push({
          source: doc.id,
          target: source.id,
          type: 'derived_from'
        });
      });
    });
    
    return { nodes, edges };
  }
}
```

## Phase 4: Operational Tools

### 4.1 Validation and Testing

#### Validation Endpoint
```typescript
// app/api/v1/graph/validate/route.ts
import { NextRequest, NextResponse } from "next/server";
import selectionConfig from "../../../../config/selection.json";
import { selectForMirror } from "../../../../lib/graph/selector";

// Test selection logic without database writes
export async function POST(req: NextRequest) {
  const { bundle } = await req.json();
  const selection = selectForMirror(bundle, selectionConfig);
  
  return NextResponse.json({
    selection_v: selectionConfig.selection_v,
    docs: selection.docs.map(d => d.id),
    keepByDoc: selection.keepByDoc,
    components: selection.components.map(c => ({ 
      id: c.id, 
      docId: c.docId,
      title: c.props.title,
      score: c.props.score
    })),
    stats: {
      totalComponents: selection.components.length,
      totalDocs: selection.docs.length,
      references: selection.references.length,
      derived: selection.derived.length
    }
  });
}
```

#### Health Check Endpoint
```typescript
// app/api/v1/graph/health/route.ts
import { NextResponse } from "next/server";
import { getDriver } from "../../../../lib/graph/mirror";

export async function GET() {
  try {
    const driver = getDriver();
    const session = driver.session();
    
    // Test connection
    await session.run('RETURN 1 as health');
    
    // Get database stats
    const docCount = await session.run('MATCH (d:Document) RETURN count(d) as count');
    const compCount = await session.run('MATCH (c:Component) RETURN count(c) as count');
    
    await session.close();
    await driver.close();
    
    return NextResponse.json({
      status: 'healthy',
      neo4j: {
        connected: true,
        documents: docCount.records[0].get('count').toNumber(),
        components: compCount.records[0].get('count').toNumber()
      },
      graph_enabled: process.env.FEATURE_GRAPH_ENABLED === 'true',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: error.message,
      graph_enabled: process.env.FEATURE_GRAPH_ENABLED === 'true',
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}
```

### 4.2 Backfill Operations

#### Backfill Script
```typescript
// scripts/backfill-graph-from-files.ts
#!/usr/bin/env tsx
import fs from "node:fs/promises";
import path from "node:path";
import selectionConfig from "../config/selection.json";
import { selectForMirror, Doc } from "../lib/graph/selector";
import { mirrorGraph, ensureConstraints, getDriver } from "../lib/graph/mirror";

// Command line argument parsing
const ROOT = process.argv.find(a => a.startsWith("--root="))?.split("=")[1] || "content";
const DRY_RUN = process.argv.includes("--dry-run");
const SINCE = process.argv.find(a => a.startsWith("--since="))?.split("=")[1];
const BATCH = Number(process.argv.find(a => a.startsWith("--batch="))?.split("=")[1] || 200);

async function loadDocument(filePath: string, kind: Doc["kind"]): Promise<Doc> {
  const raw = await fs.readFile(filePath, "utf-8");
  const slug = path.basename(filePath, ".md");
  const title = raw.split("\n")[0].replace(/^#\s*/, "").trim();
  const sections = []; // Selector will parse if empty
  return { id: `${kind}:${slug}`, kind, slug, title, sections, raw };
}

(async () => {
  console.log('Starting graph backfill...', {
    root: ROOT,
    since: SINCE || 'all time',
    dryRun: DRY_RUN,
    batch: BATCH
  });
  
  const driver = getDriver();
  await ensureConstraints(driver);

  const files = await fs.readdir(ROOT);
  const docFiles = files.filter(f => f.endsWith(".md"));
  let processed = 0, succeeded = 0, failed = 0;

  for (const file of docFiles) {
    const kind = (
      file.startsWith("DS-") ? "DS" :
      file.startsWith("SP-") ? "SP" :
      file.startsWith("X-") ? "X" : "M"
    ) as Doc["kind"];
    
    const filePath = path.join(ROOT, file);

    // Filter by modification date
    if (SINCE) {
      const stats = await fs.stat(filePath);
      if (stats.mtime < new Date(SINCE)) continue;
    }

    const document = await loadDocument(filePath, kind);
    const bundle = { [kind]: document } as any;
    const selection = selectForMirror(bundle, selectionConfig);
    const payload = { selection_v: selectionConfig.selection_v, ...selection };

    processed++;
    if (!DRY_RUN) {
      try {
        await mirrorGraph(payload);
        succeeded++;
      } catch (error) {
        console.error(`Failed to mirror ${file}:`, error);
        failed++;
      }
    }

    if (processed % BATCH === 0) {
      console.log('Progress:', { processed, succeeded, failed, current: file });
    }
  }

  console.log('Backfill complete:', {
    processed,
    succeeded,
    failed,
    dryRun: DRY_RUN
  });
  
  await driver.close();
})().catch(error => {
  console.error("Backfill failed:", error);
  process.exit(1);
});
```

#### Usage Examples
```bash
# Backfill all documents
pnpm tsx scripts/backfill-graph-from-files.ts --root=content

# Backfill recent documents only
pnpm tsx scripts/backfill-graph-from-files.ts \
  --root=content \
  --since=2025-08-01 \
  --batch=100

# Test selection without writing
pnpm tsx scripts/backfill-graph-from-files.ts \
  --root=content \
  --dry-run
```

## Phase 5: Security and Performance

### 5.1 Security Implementation

#### Authentication and Authorization
```typescript
// lib/graph/security.ts
export class GraphSecurity {
  // Validate bearer token
  static authenticateRequest(req: NextRequest): boolean {
    const auth = req.headers.get("authorization") || "";
    const expectedToken = `Bearer ${process.env.GRAPHQL_BEARER_TOKEN}`;
    return auth === expectedToken;
  }
  
  // Query complexity analysis
  static validateQueryComplexity(query: string): { valid: boolean; reason?: string } {
    const depthCount = (query.match(/\{/g)?.length || 0);
    const lengthCount = query.length;
    
    if (depthCount > 20) {
      return { valid: false, reason: "Query too deep" };
    }
    
    if (lengthCount > 10000) {
      return { valid: false, reason: "Query too long" };
    }
    
    return { valid: true };
  }
  
  // Rate limiting (simple in-memory implementation)
  private static requestCounts = new Map<string, { count: number; resetTime: number }>();
  
  static checkRateLimit(clientId: string, maxRequests = 100, windowMs = 60000): boolean {
    const now = Date.now();
    const existing = this.requestCounts.get(clientId);
    
    if (!existing || now > existing.resetTime) {
      this.requestCounts.set(clientId, { count: 1, resetTime: now + windowMs });
      return true;
    }
    
    if (existing.count >= maxRequests) {
      return false;
    }
    
    existing.count++;
    return true;
  }
}
```

### 5.2 Performance Optimizations

#### Connection Pooling and Caching
```typescript
// lib/graph/performance.ts
import neo4j, { Driver } from "neo4j-driver";

class GraphPerformance {
  private static driver: Driver | null = null;
  private static queryCache = new Map<string, { result: any; expiry: number }>();
  
  // Optimized driver with connection pooling
  static getOptimizedDriver(): Driver {
    if (!this.driver) {
      this.driver = neo4j.driver(
        process.env.NEO4J_URI!,
        neo4j.auth.basic(process.env.NEO4J_USERNAME!, process.env.NEO4J_PASSWORD!),
        {
          maxConnectionPoolSize: 50,
          connectionAcquisitionTimeout: 30000,
          connectionTimeout: 20000,
          maxTransactionRetryTime: 30000,
          logging: {
            level: 'warn',
            logger: (level, message) => console.log(`[Neo4j ${level}] ${message}`)
          }
        }
      );
    }
    return this.driver;
  }
  
  // Query result caching
  static getCachedResult(queryKey: string, ttlMs = 300000): any | null {
    const cached = this.queryCache.get(queryKey);
    if (cached && Date.now() < cached.expiry) {
      return cached.result;
    }
    this.queryCache.delete(queryKey);
    return null;
  }
  
  static setCachedResult(queryKey: string, result: any, ttlMs = 300000) {
    this.queryCache.set(queryKey, {
      result,
      expiry: Date.now() + ttlMs
    });
  }
  
  // Batch mirror updates for efficiency
  static async batchMirrorUpdates(bundles: DocumentBundle[], batchSize = 10) {
    for (let i = 0; i < bundles.length; i += batchSize) {
      const batch = bundles.slice(i, i + batchSize);
      const promises = batch.map(bundle => mirrorAfterWrite(bundle));
      await Promise.allSettled(promises);
      
      // Brief pause between batches
      if (i + batchSize < bundles.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }
}
```

### 5.3 Observability and Monitoring

#### Metrics Collection
```typescript
// lib/graph/metrics.ts
interface GraphMetrics {
  graph_mirror_attempts_total: { result: 'success' | 'failure' };
  graph_mirror_latency_ms: number;
  graphql_requests_total: { route: string; method: string };
  graphql_latency_ms: number;
  component_selection_count: number;
  document_mirror_size_bytes: number;
}

class MetricsCollector {
  static emit(metric: keyof GraphMetrics, value: any, labels?: Record<string, string>) {
    const logEntry = {
      metric,
      value,
      labels,
      timestamp: new Date().toISOString(),
      service: 'chirality-graph-mirror'
    };
    
    // Replace with your metrics system (Prometheus, DataDog, etc.)
    console.log(JSON.stringify(logEntry));
  }
  
  // Instrumented mirror operation
  static async instrumentedMirrorGraph(payload: MirrorPayload) {
    const start = Date.now();
    
    try {
      await mirrorGraph(payload);
      
      this.emit('graph_mirror_attempts_total', 1, { result: 'success' });
      this.emit('graph_mirror_latency_ms', Date.now() - start);
      this.emit('component_selection_count', payload.components.length);
      
    } catch (error) {
      this.emit('graph_mirror_attempts_total', 1, { result: 'failure' });
      this.emit('graph_mirror_latency_ms', Date.now() - start);
      throw error;
    }
  }
}
```

## Phase 6: Development and Deployment

### 6.1 Development Environment

#### Local Setup Script
```bash
#!/bin/bash
# scripts/setup-graph-dev.sh

echo "Setting up graph development environment..."

# Start Neo4j container
docker compose -f docker-compose.neo4j.yml up -d

# Wait for Neo4j to be ready
echo "Waiting for Neo4j to start..."
sleep 10

# Install dependencies
echo "Installing dependencies..."
pnpm add neo4j-driver graphql @neo4j/graphql zod
pnpm add gray-matter remark remark-parse unified slugify
pnpm add -D tsx jest @types/jest ts-jest

# Initialize database
echo "Initializing database constraints..."
pnpm tsx scripts/init-graph-constraints.ts

# Validate environment
echo "Validating environment..."
pnpm tsx scripts/validate-graph-env.ts

echo "Graph development environment ready!"
```

#### Environment Validation
```typescript
// scripts/validate-graph-env.ts
import { getDriver, ensureConstraints } from "../lib/graph/mirror";

(async () => {
  const required = [
    'NEO4J_URI',
    'NEO4J_USERNAME', 
    'NEO4J_PASSWORD',
    'GRAPHQL_BEARER_TOKEN'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    console.error('❌ Missing environment variables:', missing);
    process.exit(1);
  }
  
  try {
    const driver = getDriver();
    await ensureConstraints(driver);
    
    const session = driver.session();
    await session.run('RETURN "connection test" as message');
    
    console.log('✅ Neo4j connection successful');
    console.log('✅ Constraints ensured');
    console.log('✅ Environment validation passed');
    
    await session.close();
    await driver.close();
  } catch (error) {
    console.error('❌ Environment validation failed:', error);
    process.exit(1);
  }
})();
```

### 6.2 Production Deployment

#### Production Checklist
```markdown
# Production Deployment Checklist

## Security
- [ ] GRAPHQL_BEARER_TOKEN uses cryptographically secure value
- [ ] GRAPHQL_CORS_ORIGINS restricted to known domains
- [ ] Neo4j credentials are production-ready
- [ ] Query depth limiting enabled (max 20 levels)
- [ ] Rate limiting configured (100 req/min default)
- [ ] No sensitive data in logs

## Performance
- [ ] Neo4j connection pooling configured (50 max connections)
- [ ] Query result caching enabled (5min TTL)
- [ ] Database indexes created
- [ ] Mirror batch processing configured
- [ ] Circuit breaker thresholds set

## Monitoring
- [ ] Health check endpoint responding
- [ ] Metrics collection active
- [ ] Error alerting configured
- [ ] Log aggregation setup
- [ ] Database backup strategy

## Operational
- [ ] Feature flag FEATURE_GRAPH_ENABLED configured
- [ ] Backfill script tested
- [ ] Validation endpoint accessible
- [ ] Documentation updated
- [ ] Rollback plan defined
```

#### Environment Configuration
```bash
# Production environment variables
# .env.production

# Core graph settings
FEATURE_GRAPH_ENABLED=true
NEO4J_URI=bolt://neo4j-prod.internal:7687
NEO4J_USERNAME=chirality_app
NEO4J_PASSWORD=<secure-password>

# API security
GRAPHQL_BEARER_TOKEN=<cryptographically-secure-token>
GRAPHQL_CORS_ORIGINS=https://chirality-app.com,https://admin.chirality-app.com

# Performance tuning
NEO4J_MAX_POOL_SIZE=50
NEO4J_CONNECTION_TIMEOUT=20000
GRAPHQL_QUERY_CACHE_TTL=300000

# Monitoring
METRICS_ENABLED=true
LOG_LEVEL=warn
```

## Implementation Timeline

### Phase 1: Backend Foundation (Week 1-2)
- [ ] Environment setup and dependencies
- [ ] Neo4j schema design and constraints
- [ ] Selection algorithm implementation
- [ ] Mirror synchronization logic
- [ ] Integration point with file writes
- [ ] Basic error handling

### Phase 2: GraphQL API (Week 2-3)
- [ ] GraphQL schema definition
- [ ] API route implementation
- [ ] Authentication and security
- [ ] Query complexity limiting
- [ ] CORS configuration
- [ ] Health check endpoint

### Phase 3: Frontend Integration (Week 3-4)
- [ ] Apollo Client configuration
- [ ] Query component implementations
- [ ] Search interface
- [ ] Data transformation layer
- [ ] UI components for graph data
- [ ] Error handling and loading states

### Phase 4: Operational Tools (Week 4)
- [ ] Validation endpoint
- [ ] Backfill script
- [ ] Metrics collection
- [ ] Monitoring setup
- [ ] Performance optimizations
- [ ] Documentation updates

### Phase 5: Testing and Production (Week 5)
- [ ] Unit tests for selection logic
- [ ] Integration tests for GraphQL
- [ ] Performance testing
- [ ] Security audit
- [ ] Production deployment
- [ ] Monitoring validation

## Success Criteria

### Functional Requirements
- [ ] File writes trigger async graph mirrors
- [ ] Selection algorithm identifies high-value components
- [ ] GraphQL API provides read-only access to graph data
- [ ] Frontend can search and navigate document relationships
- [ ] System gracefully handles graph service unavailability

### Performance Requirements
- [ ] Mirror operations complete within 5 seconds
- [ ] GraphQL queries respond within 1 second
- [ ] System supports 100+ concurrent GraphQL requests
- [ ] Memory usage remains stable under load
- [ ] Database query performance is acceptable

### Operational Requirements
- [ ] Feature can be disabled via environment flag
- [ ] Health checks provide accurate system status
- [ ] Metrics collection enables monitoring
- [ ] Backfill process handles existing documents
- [ ] Error conditions are logged appropriately

## Risk Mitigation

### Technical Risks
- **Neo4j Performance**: Implement connection pooling and query optimization
- **Selection Algorithm Accuracy**: Provide validation endpoint for testing
- **Mirror Synchronization Failures**: Implement retry logic and circuit breakers
- **GraphQL Security**: Enforce authentication, rate limiting, and query complexity

### Operational Risks
- **Database Outages**: Design graceful degradation in file-only mode
- **Migration Issues**: Provide comprehensive backfill tooling
- **Performance Impact**: Monitor metrics and implement batching
- **Data Consistency**: Ensure idempotent operations and proper error handling

---

*This integration plan provides a comprehensive roadmap for implementing metadata-only graph mirroring with GraphQL access while maintaining files as the authoritative source of truth for document content.*