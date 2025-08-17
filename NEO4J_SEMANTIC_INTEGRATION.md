# Neo4j Semantic Integration Implementation

*Implementation details for metadata-only graph mirroring with selected components*

## Overview

This document defines the technical implementation of the Neo4j graph mirror system, where files remain the source of truth for document content while Neo4j mirrors selected high-value metadata for enhanced discoverability and relationship analysis.

## Architecture Principles

### Source of Truth Design
- **Files**: Complete document bodies stored as files (DS/SP/X/M documents)
- **Neo4j**: Metadata mirror for selected document components only
- **Async Mirroring**: Graph updates happen after successful file writes, non-blocking
- **Idempotent Operations**: Mirror operations can be safely repeated
- **Feature Flagged**: Entire graph system controlled via `FEATURE_GRAPH_ENABLED`

### Selection Strategy
- **Rule-Based MVP**: Algorithm-driven component selection using scoring
- **Stable IDs**: SHA1-based component identifiers for consistency
- **Bounded Selection**: Configurable limits on components per document and per mirror run
- **Content Filtering**: Only high-value sections based on references and keywords

## Implementation Components

### 1. Environment Configuration

#### Required Environment Variables
```bash
# Core configuration
FEATURE_GRAPH_ENABLED=true
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=testpass

# GraphQL API security
GRAPHQL_CORS_ORIGINS=http://localhost:3000
GRAPHQL_BEARER_TOKEN=dev-super-secret
```

#### Local Development Setup
```yaml
# docker-compose.neo4j.yml
services:
  neo4j:
    image: neo4j:5-community
    environment:
      NEO4J_AUTH: neo4j/testpass
    ports:
      - "7687:7687" # bolt
      - "7474:7474" # browser
```

#### Dependencies
```bash
# Server dependencies
pnpm add neo4j-driver graphql @neo4j/graphql zod
# Parsing and utilities
pnpm add gray-matter remark remark-parse unified slugify
# Development and testing
pnpm add -D tsx jest @types/jest ts-jest
```

### 2. Selection Configuration

#### Selection Parameters
```json
# config/selection.json
{
  "selection_v": "1.0.0",
  "threshold": 3,
  "topKPerDoc": 12,
  "maxNodesPerRun": 50,
  "keywords": ["API", "Dependency", "Integration", "Decision", "Risk", "Metric"],
  "largeSectionCharLimit": 10000
}
```

**Configuration Explanation**:
- `threshold`: Minimum score for component inclusion (3 points)
- `topKPerDoc`: Maximum components selected per document (12)
- `maxNodesPerRun`: Total node limit per mirror operation (50)
- `keywords`: High-value section heading indicators
- `largeSectionCharLimit`: Penalty threshold for oversized sections

#### Scoring Algorithm
```typescript
// Scoring rules for component selection
function scoreSection(doc: Doc, section: Section, config: SelCfg): number {
  let score = 0;
  
  // Cross-references: +3 points for sections with 2+ document references
  const refs = extractDocRefs(section.content).filter(r => r !== doc.id);
  if (refs.length >= 2) score += 3;
  
  // Keywords: +2 points for headings starting with selection keywords
  const kwRegex = new RegExp(`^(${config.keywords.join("|")})`); 
  if (kwRegex.test(section.heading)) score += 2;
  
  // Large sections: -2 points if >10k chars with <3 references
  if (section.content.length > config.largeSectionCharLimit && refs.length < 3) {
    score -= 2;
  }
  
  return score;
}
```

### 3. Document Reference Extraction

#### Reference Pattern Detection
```typescript
// lib/graph/selector.ts
export function extractDocRefs(text: string): string[] {
  const ids = new Set<string>();
  
  // Wiki-style references: [[DS:payments-auth]] or [[sp-deploy-runbook]]
  const wiki = /\[\[([A-Za-z]{1,2}:[\w-]+|[a-z0-9-]+)\]\]/g;
  
  // Markdown links: (…/docs/slug) or (slug)
  const md = /\]\((?:\/docs\/)?([a-z0-9-]+)\)/g;
  
  // Inline references: DS:slug or SP:slug
  const inline = /\b([A-Za-z]{1,2}:[\w-]+)\b/g;
  
  for (const match of text.matchAll(wiki)) ids.add(match[1]);
  for (const match of text.matchAll(md)) ids.add(match[1]);
  for (const match of text.matchAll(inline)) ids.add(match[1]);
  
  return [...ids];
}
```

#### Stable Component Identification
```typescript
// Generate consistent component IDs
export function stableComponentId(docId: string, anchor: string): string {
  return crypto.createHash("sha1").update(`${docId}#${anchor}`).digest("hex");
}
```

### 4. Neo4j Graph Schema

#### Node Types
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

#### Relationship Types
```cypher
// Document contains selected components
(doc:Document)-[:CONTAINS]->(comp:Component)

// Cross-document references
(doc1:Document)-[:REFERENCES]->(doc2:Document)

// Document derivation lineage
(derived:Document)-[:DERIVED_FROM]->(source:Document)
```

#### Database Constraints
```cypher
// Unique constraints
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

### 5. Mirror Synchronization Implementation

#### Idempotent Mirror Operations
```typescript
// lib/graph/mirror.ts
import neo4j, { Driver } from "neo4j-driver";

export async function mirrorGraph(payload: MirrorPayload) {
  if (process.env.FEATURE_GRAPH_ENABLED !== "true") return;

  const driver = getDriver();
  const session = driver.session();
  const start = Date.now();
  
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
        
        UNWIND $components AS c
          MATCH (d:Document {id: c.docId}), (k:Component {id: c.id})
          MERGE (d)-[:CONTAINS]->(k);
      `, {
        docs: payload.docs, 
        components: payload.components, 
        selection_v: payload.selection_v 
      });

      // Handle component removals (set difference approach)
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

      // Update cross-document references
      await tx.run(`
        UNWIND $refs AS r
        MATCH (s:Document {id: r.src})
        MERGE (t:Document {id: r.dst})
        MERGE (s)-[:REFERENCES]->(t)
      `, { refs: payload.references });

      // Update derivation relationships with cycle prevention
      await tx.run(`
        UNWIND $derived AS e
        MATCH (s:Document {id: e.src}), (t:Document {id: e.dst})
        WHERE NOT (t)-[:DERIVED_FROM*1..]->(s)
        MERGE (s)-[:DERIVED_FROM]->(t)
      `, { derived: payload.derived });
    });

    // Emit success metrics
    console.log(JSON.stringify({
      at: "graph_mirror", result: "success",
      docs: payload.docs.length, 
      components: payload.components.length,
      references: payload.references.length, 
      derived: payload.derived.length,
      latency_ms: Date.now() - start, 
      selection_v: payload.selection_v
    }));
  } catch (err) {
    console.warn("mirrorGraph failed", err);
    console.log(JSON.stringify({ 
      at: "graph_mirror", 
      result: "failure", 
      latency_ms: Date.now() - start 
    }));
  } finally {
    await session.close();
    await driver.close();
  }
}
```

#### Mirror Integration Point
```typescript
// lib/graph/integration.ts
import selectionConfig from "../../config/selection.json";
import { selectForMirror } from "./selector";
import { mirrorGraph } from "./mirror";

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

// Usage after successful file write
await writeDocumentsToFile(bundle);
await mirrorAfterWrite(bundle); // Non-blocking via queueMicrotask
```

### 6. GraphQL API Implementation

#### Schema Definition
```graphql
# GraphQL type definitions for Neo4j integration
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

#### API Route Implementation
```typescript
// app/api/v1/graph/graphql/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Neo4jGraphQL } from "@neo4j/graphql";
import neo4j from "neo4j-driver";
import { graphql } from "graphql";

// Schema initialization with caching
let schemaPromise: Promise<any> | null = null;
function getSchema() {
  if (!schemaPromise) {
    const driver = neo4j.driver(
      process.env.NEO4J_URI!,
      neo4j.auth.basic(process.env.NEO4J_USERNAME!, process.env.NEO4J_PASSWORD!)
    );
    const neoSchema = new Neo4jGraphQL({ typeDefs, driver });
    schemaPromise = neoSchema.getSchema();
  }
  return schemaPromise;
}

// CORS configuration
function cors() {
  return {
    "Access-Control-Allow-Origin": process.env.GRAPHQL_CORS_ORIGINS || "*",
    "Access-Control-Allow-Headers": "content-type, authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };
}

// OPTIONS handler for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, { headers: cors() });
}

// POST handler with authentication and query processing
export async function POST(req: NextRequest) {
  if (process.env.FEATURE_GRAPH_ENABLED !== "true") {
    return NextResponse.json(
      { error: "Graph disabled" }, 
      { status: 503, headers: cors() }
    );
  }

  // Bearer token authentication
  const auth = req.headers.get("authorization") || "";
  const authorized = auth === `Bearer ${process.env.GRAPHQL_BEARER_TOKEN}`;
  if (!authorized) {
    return NextResponse.json(
      { error: "Unauthorized" }, 
      { status: 401, headers: cors() }
    );
  }

  const { query, variables, operationName } = await req.json();
  const schema = await getSchema();

  // Simple depth limiting for query complexity
  if (typeof query === "string" && (query.match(/\{/g)?.length || 0) > 20) {
    return NextResponse.json(
      { error: "Query too deep" }, 
      { status: 400, headers: cors() }
    );
  }

  const result = await graphql({
    schema,
    source: query,
    variableValues: variables,
    operationName,
    contextValue: {} // Neo4j driver injected by @neo4j/graphql
  });

  return NextResponse.json(result, { headers: cors() });
}
```

#### Example GraphQL Queries
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

### 7. Validation and Testing Endpoints

#### Validation Endpoint (Non-Destructive Testing)
```typescript
// app/api/v1/graph/validate/route.ts
import { NextRequest, NextResponse } from "next/server";
import selectionConfig from "../../../../config/selection.json";
import { selectForMirror } from "../../../../lib/graph/selector";

// Validates selection logic without writing to graph
export async function POST(req: NextRequest) {
  const { bundle } = await req.json();
  const selection = selectForMirror(bundle, selectionConfig);
  
  return NextResponse.json({
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

#### Unit Tests for Selection Logic
```typescript
// __tests__/selector.test.ts
import selectionConfig from "../config/selection.json";
import { selectForMirror, Doc } from "../lib/graph/selector";

function makeDoc(id: string, kind: any, body: string): Doc {
  return { 
    id, 
    kind, 
    slug: id.split(":")[1], 
    title: "Test Document", 
    sections: [], 
    raw: body 
  };
}

test("selection threshold and caps work correctly", () => {
  const body = `
# Title
## API Integrations
See [[DS:core-auth]] and [[sp-deploy]] plus (docs/x-runbook).
## Random Notes
no refs here
## Decisions
Links: [[X:runner]], [[m-guidelines]]
`;
  
  const bundle = { DS: makeDoc("DS:sample", "DS", body) } as any;
  const selection = selectForMirror(bundle, selectionConfig);
  
  const componentTitles = selection.components.map(c => c.props.title);
  expect(componentTitles.join(" ")).toMatch(/API Integrations/);
  expect(componentTitles.join(" ")).toMatch(/Decisions/);
  expect(componentTitles.join(" ")).not.toMatch(/Random Notes/);
});

test("stable component IDs are consistent", () => {
  const doc = makeDoc("SP:ship", "SP", "## Metrics\nok");
  const selection1 = selectForMirror({ SP: doc } as any, selectionConfig);
  const selection2 = selectForMirror({ SP: doc } as any, selectionConfig);
  
  expect(selection1.components[0].id).toBe(selection2.components[0].id);
});

test("component caps are enforced", () => {
  const largeBody = Array.from({ length: 20 }, (_, i) => 
    `## API Section ${i}\nSee [[DS:ref${i}]] and [[SP:ref${i}]]`
  ).join("\n");
  
  const bundle = { DS: makeDoc("DS:large", "DS", largeBody) } as any;
  const selection = selectForMirror(bundle, selectionConfig);
  
  expect(selection.components.length).toBeLessThanOrEqual(selectionConfig.topKPerDoc);
});
```

### 8. Backfill Operations

#### Backfill Script for Existing Documents
```typescript
// scripts/backfill-graph-from-files.ts
#!/usr/bin/env tsx
import fs from "node:fs/promises";
import path from "node:path";
import selectionConfig from "../config/selection.json";
import { selectForMirror, Doc, Section } from "../lib/graph/selector";
import { mirrorGraph, ensureConstraints, getDriver } from "../lib/graph/mirror";

// Command line arguments
const ROOT = process.argv.find(a => a.startsWith("--root="))?.split("=")[1] || "content";
const DRY_RUN = process.argv.includes("--dry-run");
const SINCE = process.argv.find(a => a.startsWith("--since="))?.split("=")[1];
const BATCH = Number(process.argv.find(a => a.startsWith("--batch="))?.split("=")[1] || 200);

async function loadDocument(filePath: string, kind: Doc["kind"]): Promise<Doc> {
  const raw = await fs.readFile(filePath, "utf-8");
  const slug = path.basename(filePath, ".md");
  const title = raw.split("\n")[0].replace(/^#\s*/, "").trim();
  const sections: Section[] = []; // Selector can parse if empty
  return { id: `${kind}:${slug}`, kind, slug, title, sections, raw };
}

(async () => {
  const driver = getDriver();
  await ensureConstraints(driver);

  const files = await fs.readdir(ROOT);
  const docFiles = files.filter(f => f.endsWith(".md"));
  let scanned = 0, upserted = 0, failed = 0;

  for (const file of docFiles) {
    // Determine document kind from filename
    const kind = (
      file.startsWith("DS-") ? "DS" :
      file.startsWith("SP-") ? "SP" :
      file.startsWith("X-") ? "X" : "M"
    ) as Doc["kind"];
    
    const filePath = path.join(ROOT, file);

    // Filter by modification date if --since provided
    if (SINCE) {
      const stats = await fs.stat(filePath);
      if (stats.mtime < new Date(SINCE)) continue;
    }

    const document = await loadDocument(filePath, kind);
    const bundle = { [kind]: document } as any;
    const selection = selectForMirror(bundle, selectionConfig);
    const payload = { selection_v: selectionConfig.selection_v, ...selection };

    scanned++;
    if (!DRY_RUN) {
      try {
        await mirrorGraph(payload);
        upserted += selection.components.length + selection.docs.length;
      } catch (error) {
        console.error(`Failed to mirror ${file}:`, error);
        failed++;
      }
    }

    if (scanned % BATCH === 0) {
      console.log({ scanned, upserted, failed, current: file });
    }
  }

  console.log({
    final: { scanned, upserted, failed },
    since: SINCE || null,
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
# Backfill all documents from content directory
pnpm tsx scripts/backfill-graph-from-files.ts --root=content

# Backfill only recent documents with batch progress
pnpm tsx scripts/backfill-graph-from-files.ts \
  --root=content \
  --since=2025-08-01 \
  --batch=200

# Dry run to test selection without writing to database
pnpm tsx scripts/backfill-graph-from-files.ts \
  --root=content \
  --dry-run
```

### 9. Security and Performance

#### Security Implementation
```typescript
// Authentication and authorization
function authenticateRequest(req: NextRequest): boolean {
  const auth = req.headers.get("authorization") || "";
  return auth === `Bearer ${process.env.GRAPHQL_BEARER_TOKEN}`;
}

// CORS configuration
function getCorsHeaders() {
  return {
    "Access-Control-Allow-Origin": process.env.GRAPHQL_CORS_ORIGINS || "*",
    "Access-Control-Allow-Headers": "content-type, authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };
}

// Query complexity limiting
function validateQueryComplexity(query: string): boolean {
  const depthCount = (query.match(/\{/g)?.length || 0);
  return depthCount <= 20; // Simple depth guard
}

// Rate limiting (example with simple in-memory store)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

function rateLimitCheck(clientId: string, maxRequests = 100, windowMs = 60000): boolean {
  const now = Date.now();
  const existing = requestCounts.get(clientId);
  
  if (!existing || now > existing.resetTime) {
    requestCounts.set(clientId, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (existing.count >= maxRequests) {
    return false;
  }
  
  existing.count++;
  return true;
}
```

#### Performance Optimizations
```typescript
// Connection pooling for Neo4j
export function getDriver(): Driver {
  return neo4j.driver(
    process.env.NEO4J_URI!,
    neo4j.auth.basic(process.env.NEO4J_USERNAME!, process.env.NEO4J_PASSWORD!),
    {
      maxConnectionPoolSize: 50,
      connectionAcquisitionTimeout: 30000,
      connectionTimeout: 20000,
      maxTransactionRetryTime: 30000
    }
  );
}

// Query result caching
const queryCache = new Map<string, { result: any; expiry: number }>(); 

function getCachedResult(queryKey: string, ttlMs = 300000): any | null {
  const cached = queryCache.get(queryKey);
  if (cached && Date.now() < cached.expiry) {
    return cached.result;
  }
  queryCache.delete(queryKey);
  return null;
}

function setCachedResult(queryKey: string, result: any, ttlMs = 300000) {
  queryCache.set(queryKey, {
    result,
    expiry: Date.now() + ttlMs
  });
}

// Batch processing for mirror operations
export async function batchMirrorUpdates(bundles: DocumentBundle[], batchSize = 10) {
  for (let i = 0; i < bundles.length; i += batchSize) {
    const batch = bundles.slice(i, i + batchSize);
    const promises = batch.map(bundle => mirrorAfterWrite(bundle));
    await Promise.allSettled(promises);
    
    // Brief pause between batches to avoid overwhelming the database
    if (i + batchSize < bundles.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}
```

### 10. Observability and Monitoring

#### Metrics Collection
```typescript
// Metrics interface for monitoring
interface GraphMetrics {
  graph_mirror_attempts_total: { result: 'success' | 'failure' };
  graph_mirror_latency_ms: number;
  graphql_requests_total: { route: string; method: string };
  graphql_latency_ms: number;
  component_selection_count: number;
  document_mirror_size_bytes: number;
}

// Metrics emitter (integrate with your metrics system)
class MetricsCollector {
  static emit(metric: keyof GraphMetrics, value: any, labels?: Record<string, string>) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      metric,
      value,
      labels,
      timestamp,
      service: 'chirality-graph-mirror'
    };
    
    // Replace with your actual metrics system (Prometheus, DataDog, etc.)
    console.log(JSON.stringify(logEntry));
  }
}

// Usage in mirror operations
export async function instrumentedMirrorGraph(payload: MirrorPayload) {
  const start = Date.now();
  
  try {
    await mirrorGraph(payload);
    
    MetricsCollector.emit('graph_mirror_attempts_total', 1, { result: 'success' });
    MetricsCollector.emit('graph_mirror_latency_ms', Date.now() - start);
    MetricsCollector.emit('component_selection_count', payload.components.length);
    
  } catch (error) {
    MetricsCollector.emit('graph_mirror_attempts_total', 1, { result: 'failure' });
    MetricsCollector.emit('graph_mirror_latency_ms', Date.now() - start);
    throw error;
  }
}

// Health check endpoint
export async function checkGraphHealth(): Promise<{ status: string; details: any }> {
  try {
    const driver = getDriver();
    const session = driver.session();
    
    const result = await session.run('RETURN 1 as health');
    const docCount = await session.run('MATCH (d:Document) RETURN count(d) as count');
    const compCount = await session.run('MATCH (c:Component) RETURN count(c) as count');
    
    await session.close();
    await driver.close();
    
    return {
      status: 'healthy',
      details: {
        neo4j_connected: true,
        documents: docCount.records[0].get('count').toNumber(),
        components: compCount.records[0].get('count').toNumber(),
        last_check: new Date().toISOString()
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      details: {
        error: error.message,
        neo4j_connected: false,
        last_check: new Date().toISOString()
      }
    };
  }
}
```

### 11. Error Handling and Resilience

#### Graceful Degradation
```typescript
// Resilient mirror operation with fallback
export async function resilientMirrorAfterWrite(bundle: DocumentBundle) {
  if (process.env.FEATURE_GRAPH_ENABLED !== "true") {
    return { status: 'disabled', reason: 'feature flag off' };
  }
  
  try {
    await mirrorAfterWrite(bundle);
    return { status: 'success' };
  } catch (error) {
    // Log error but don't fail the main operation
    console.warn('Graph mirror failed, continuing without graph update:', error);
    
    // Emit failure metric
    MetricsCollector.emit('graph_mirror_attempts_total', 1, { result: 'failure' });
    
    return { 
      status: 'failed', 
      error: error.message,
      fallback: 'documents still persisted to files'
    };
  }
}

// Retry logic with exponential backoff
class RetryableOperation {
  static async execute<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    baseDelayMs = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) {
          break; // Final attempt failed
        }
        
        // Exponential backoff with jitter
        const delayMs = baseDelayMs * Math.pow(2, attempt) + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    
    throw lastError!;
  }
}

// Circuit breaker pattern for Neo4j connections
class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  constructor(
    private readonly failureThreshold = 5,
    private readonly recoveryTimeoutMs = 30000
  ) {}
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeoutMs) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }
  
  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }
}

// Global circuit breaker instance
export const graphCircuitBreaker = new CircuitBreaker();
```

### 12. Development and Deployment

#### Development Environment Setup
```bash
# Start local Neo4j
docker compose -f docker-compose.neo4j.yml up -d

# Install dependencies
pnpm add neo4j-driver graphql @neo4j/graphql zod
pnpm add gray-matter remark remark-parse unified slugify
pnpm add -D tsx jest @types/jest ts-jest

# Initialize database constraints
pnpm tsx scripts/init-graph-constraints.ts

# Validate environment
pnpm tsx scripts/validate-graph-env.ts
```

#### Environment Validation Script
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
    console.error('Missing environment variables:', missing);
    process.exit(1);
  }
  
  try {
    const driver = getDriver();
    await ensureConstraints(driver);
    
    const session = driver.session();
    const result = await session.run('RETURN "connection test" as message');
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

#### Production Deployment Checklist
```bash
# Security checklist
- [ ] GRAPHQL_BEARER_TOKEN is cryptographically secure
- [ ] GRAPHQL_CORS_ORIGINS restricted to known domains
- [ ] Neo4j authentication credentials are secure
- [ ] Query depth limiting is enabled
- [ ] Rate limiting is configured

# Performance checklist  
- [ ] Neo4j connection pooling configured
- [ ] Query result caching enabled
- [ ] Database indexes created
- [ ] Monitoring and metrics collection active

# Operational checklist
- [ ] Health check endpoint responding
- [ ] Backup strategy for Neo4j data
- [ ] Log aggregation configured
- [ ] Error alerting set up
- [ ] Circuit breaker thresholds tuned
```

## Implementation Summary

The Neo4j semantic integration provides metadata-only mirroring of selected document components while maintaining files as the source of truth for complete document bodies. Key implementation highlights:

### Core Features
1. **Rule-Based Selection**: Algorithm-driven component selection using reference counts, keywords, and content analysis
2. **Stable Identifiers**: SHA1-based component IDs ensure consistency across mirror operations
3. **Idempotent Operations**: Mirror operations safely handle additions, updates, and removals
4. **Async Processing**: Non-blocking graph updates prevent interference with file operations
5. **Feature Flagging**: Complete system can be disabled via environment variable

### Architecture Benefits
- **Source of Truth Clarity**: Files contain complete document bodies, graph contains metadata
- **Enhanced Discovery**: GraphQL API enables relationship traversal and component search
- **Operational Resilience**: System continues functioning if graph components fail
- **Scalable Selection**: Configurable limits prevent graph operations from becoming unwieldy
- **Development Flexibility**: Validation endpoints allow testing without database writes

### Integration Points
- **Single Mirror Call**: `mirrorAfterWrite()` triggered after successful file writes
- **GraphQL Endpoint**: `/api/v1/graph/graphql` with authentication and CORS
- **Validation Endpoint**: `/api/v1/graph/validate` for testing selection logic
- **Backfill Script**: Batch processing for existing document migration
- **Health Monitoring**: Metrics collection and circuit breaker patterns

### Security and Performance
- **Authentication**: Bearer token required for GraphQL access
- **Query Protection**: Depth limiting and rate limiting implemented
- **Connection Management**: Pooled Neo4j connections with timeouts
- **Error Handling**: Graceful degradation with comprehensive logging
- **Observability**: Metrics emission for monitoring graph operations

This implementation provides a robust foundation for metadata-rich document discovery while preserving the simplicity and reliability of file-based document storage.

