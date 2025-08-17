# API Documentation - Chirality AI App

## Overview

Chirality AI App provides REST API endpoints for document generation and chat interaction through Next.js API routes. The API supports two-pass semantic document generation and RAG-enhanced streaming chat with automatic document context injection.

**Base URL**: `http://localhost:3001` (development)

**Authentication**: OpenAI API key required via environment variables

## Core Endpoints

### Document Generation

#### POST /api/core/orchestrate
**Two-pass document generation with cross-referential refinement**

Generates all four document types (DS/SP/X/M) using the two-pass methodology: sequential generation followed by cross-referential refinement and final resolution.

**Request**:
```bash
POST /api/core/orchestrate
Content-Type: application/json

{}  # Empty body - uses current problem from state
```

**Response**:
```typescript
{
  success: true,
  pass1: {
    DS: Triple<DSItem[]>,
    SP: Triple<SPItem[]>, 
    X: Triple<XItem[]>,
    M: Triple<MItem[]>
  },
  pass2: {
    DS: Triple<DSItem[]>,
    SP: Triple<SPItem[]>,
    X: Triple<XItem[]>, 
    M: Triple<MItem[]>
  },
  final: {
    X: Triple<XItem[]>  // Final resolution
  },
  logs: string[],        // Generation progress logs
  totalTimeSeconds: number
}
```

**Example Usage**:
```bash
curl -X POST http://localhost:3001/api/core/orchestrate \
  -H "Content-Type: application/json" \
  -d '{}'
```

#### POST /api/core/run
**Single document generation**

Generates a specific document type using current problem context and available document dependencies.

**Request**:
```typescript
{
  kind: "DS" | "SP" | "X" | "M"  // Document type to generate
}
```

**Response**:
```typescript
{
  kind: string,           // Document type generated
  triple: Triple<any>,    // Generated document with metadata
  latencyMs: number      // Generation time in milliseconds
}
```

**Example Usage**:
```bash
curl -X POST http://localhost:3001/api/core/run \
  -H "Content-Type: application/json" \
  -d '{"kind": "DS"}'
```

### Chat Interface

#### POST /api/chat/stream
**RAG-enhanced streaming chat with document context**

Provides streaming chat responses with automatic injection of generated documents for context-aware responses.

**Request**:
```typescript
{
  message: string,              // User message
  conversationId?: string      // Optional conversation tracking
}
```

**Response**: Server-Sent Events stream
```
data: {"type": "content", "content": "partial response text"}
data: {"type": "content", "content": " more text"}
data: {"type": "done"}
```

**Example Usage**:
```bash
curl -X POST http://localhost:3001/api/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"message": "How should I implement the authentication system?"}' \
  --no-buffer
```

**JavaScript Client Example**:
```typescript
const response = await fetch('/api/chat/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'Your question here' })
});

const reader = response.body?.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      if (data.type === 'content') {
        console.log(data.content);
      }
    }
  }
}
```

#### GET /api/chat/debug
**System status and debugging information**

Returns current system status, document context, and debugging information.

**Response**:
```typescript
{
  status: "operational",
  documents: {
    hasDS: boolean,
    hasSP: boolean,
    hasX: boolean,
    hasM: boolean
  },
  problem: string | null,
  lastGenerated: string | null,
  systemInfo: {
    model: string,
    timestamp: string
  }
}
```

### State Management

#### GET /api/core/state
**Retrieve current application state**

Returns current problem statement and generated documents.

**Response**:
```typescript
{
  problem?: {
    statement: string
  },
  finals?: {
    DS?: Triple<DSItem[]>,
    SP?: Triple<SPItem[]>,
    X?: Triple<XItem[]>,
    M?: Triple<MItem[]>
  },
  metadata?: {
    lastGenerated: string,
    generationMode: "single" | "two-pass"
  }
}
```

#### POST /api/core/state
**Update application state**

Updates problem statement or document state.

**Request**:
```typescript
{
  problem?: {
    statement: string
  },
  finals?: {
    DS?: Triple<DSItem[]>,
    SP?: Triple<SPItem[]>, 
    X?: Triple<XItem[]>,
    M?: Triple<MItem[]>
  }
}
```

**Response**:
```typescript
{
  success: true,
  message: "State updated successfully"
}
```

#### DELETE /api/core/state
**Clear all application state**

Removes all documents and resets problem statement.

**Response**:
```typescript
{
  success: true,
  message: "State cleared successfully"
}
```

### Graph API (v1)

#### POST /api/v1/graph/graphql
**GraphQL endpoint for document metadata queries**

Read-only GraphQL interface for querying document relationships and selected components from the Neo4j graph mirror.

**Authentication**: Bearer token required

**Request**:
```typescript
{
  query: string,                // GraphQL query
  variables?: Record<string, any>, // Query variables
  operationName?: string        // Operation name (optional)
}
```

**Headers**:
```
Content-Type: application/json
Authorization: Bearer <GRAPHQL_BEARER_TOKEN>
```

**Example Query - Get Document with Components**:
```graphql
query GetDocument($id: ID!) {
  document(where: { id: $id }) {
    id
    title
    kind
    slug
    updatedAt
    components {
      id
      title
      anchor
      order
      score
    }
    references {
      id
      title
      kind
    }
    derivedFrom {
      id
      title
    }
  }
}
```

**Example Query - Search Components**:
```graphql
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
```

**Response**:
```typescript
{
  data?: {
    // GraphQL query results
  },
  errors?: Array<{
    message: string,
    locations?: Array<{
      line: number,
      column: number
    }>,
    path?: Array<string | number>
  }>
}
```

**Example Usage**:
```bash
curl -X POST http://localhost:3001/api/v1/graph/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token-here" \
  -d '{
    "query": "query { documents { id title kind } }"
  }'
```

#### POST /api/v1/graph/validate
**Validate component selection logic**

Test the component selection algorithm without writing to the graph database.

**Request**:
```typescript
{
  bundle: {
    DS?: DocumentBundle,
    SP?: DocumentBundle, 
    X?: DocumentBundle,
    M?: DocumentBundle
  }
}
```

**Response**:
```typescript
{
  selection_v: string,        // Algorithm version
  docs: string[],             // Document IDs
  keepByDoc: Record<string, string[]>, // Components to keep per document
  components: Array<{
    id: string,
    docId: string,
    title: string,
    score: number
  }>,
  stats: {
    totalComponents: number,
    totalDocs: number,
    references: number,
    derived: number
  }
}
```

#### GET /api/v1/graph/health
**Graph system health check**

Checks Neo4j connectivity and provides database statistics.

**Response**:
```typescript
{
  status: "healthy" | "unhealthy",
  neo4j?: {
    connected: boolean,
    documents: number,
    components: number
  },
  graph_enabled: boolean,
  timestamp: string,
  error?: string
}
```

### Health Monitoring

#### GET /api/healthz
**Health check endpoint**

Simple health check for monitoring and load balancers.

**Response**:
```typescript
{
  status: "healthy",
  timestamp: string
}
```

#### GET /api/readyz
**Readiness check endpoint**

Comprehensive readiness check including OpenAI API connectivity.

**Response**:
```typescript
{
  status: "ready",
  checks: {
    openai: "connected" | "error",
    storage: "accessible" | "error"
  },
  timestamp: string
}
```

## Data Types

### Document Structure
All documents follow the Triple pattern with content, metadata, and validation information:

```typescript
interface Triple<T> {
  text: T,                    // Document-specific content structure
  terms_used: string[],       // Keywords and terms used in generation
  warnings: string[]          // Generation warnings and notes
}
```

### Document Content Types

#### DS (Data Sheet)
```typescript
interface DSItem {
  data_field: string,         // Data element name
  type?: string,              // Data type specification
  units?: string,             // Units of measurement
  source_refs?: string[],     // Reference sources
  notes?: string[]            // Additional notes
}
```

#### SP (Procedural Checklist)
```typescript
interface SPItem {
  step: string,               // Procedure step description
  purpose?: string,           // Step objective
  inputs?: string[],          // Required inputs
  outputs?: string[],         // Expected outputs
  preconditions?: string[],   // Prerequisites
  postconditions?: string[],  // Post-step conditions
  refs?: string[]             // Reference materials
}
```

#### X (Solution Template)
```typescript
interface XItem {
  heading: string,            // Solution section heading
  narrative: string,          // Detailed description
  precedents?: string[],      // Dependencies
  successors?: string[],      // Follow-up items
  context_notes?: string[],   // Contextual information
  refs?: string[]             // References
}
```

#### M (Guidance)
```typescript
interface MItem {
  statement: string,          // Guidance statement
  justification?: string,     // Reasoning
  trace_back?: string[],      // Supporting evidence
  assumptions?: string[],     // Underlying assumptions
  residual_risk?: string[]    // Remaining risks
}
```

## Error Handling

### Standard Error Response
```typescript
{
  error: string,              // Error message
  details?: any,              // Additional error details
  timestamp: string           // Error timestamp
}
```

### Common HTTP Status Codes
- **200 OK**: Successful request
- **400 Bad Request**: Invalid request parameters
- **500 Internal Server Error**: Server-side error
- **503 Service Unavailable**: OpenAI API unavailable

### Error Examples

#### Invalid Document Type
```bash
POST /api/core/run
{"kind": "INVALID"}

# Response: 400 Bad Request
{
  "error": "Invalid document kind. Must be one of: DS, SP, X, M",
  "timestamp": "2025-08-17T09:00:00.000Z"
}
```

#### OpenAI API Error
```bash
POST /api/core/orchestrate

# Response: 500 Internal Server Error  
{
  "error": "OpenAI API request failed",
  "details": "Rate limit exceeded",
  "timestamp": "2025-08-17T09:00:00.000Z"
}
```

## Rate Limits and Quotas

### API Limits
- **Document Generation**: No application-level limits (bound by OpenAI API)
- **Chat Streaming**: 100 concurrent connections maximum
- **State Operations**: 1000 requests/minute per client

### OpenAI API Considerations
- **Model**: gpt-4.1-nano (configurable via environment)
- **Rate Limits**: Subject to OpenAI account limits
- **Token Limits**: Context window managed automatically
- **Cost**: Based on OpenAI pricing for chosen model

## Authentication

### Environment Configuration
```bash
# Core API (Required)
OPENAI_API_KEY=sk-proj-your-api-key-here
OPENAI_MODEL=gpt-4.1-nano

# Graph API (Optional - feature flagged)
FEATURE_GRAPH_ENABLED=true
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your-neo4j-password
GRAPHQL_BEARER_TOKEN=your-secure-bearer-token
GRAPHQL_CORS_ORIGINS=http://localhost:3000

# Optional
DEFAULT_TEMPERATURE=0.6
MAX_OUTPUT_TOKENS=800
```

### API Security

#### Core API Endpoints
- **No authentication required** for document generation and chat endpoints
- OpenAI API key managed server-side only
- Rate limiting based on OpenAI account limits

#### Graph API Endpoints  
- **Bearer token authentication required** for all `/api/v1/graph/*` endpoints
- Token must be provided in `Authorization: Bearer <token>` header
- CORS restrictions configurable via `GRAPHQL_CORS_ORIGINS`
- Feature can be completely disabled via `FEATURE_GRAPH_ENABLED=false`

### API Key Security
- API keys stored in environment variables only
- No client-side exposure of sensitive credentials
- Automatic redaction in error messages and logs
- GraphQL bearer tokens should be cryptographically secure

## Performance Characteristics

### Document Generation Timing
- **Single Document**: 3-8 seconds per document
- **Two-Pass Generation**: 45-90 seconds total (8 LLM calls)
- **Context Processing**: <1 second for document injection

### Chat Response Timing
- **First Token**: 500ms-2s depending on context size
- **Streaming Rate**: 20-50 tokens/second
- **Context Injection**: Minimal latency impact

### Concurrency Support
- **Document Generation**: 5 concurrent generations recommended
- **Chat Streams**: 100+ concurrent connections supported
- **State Operations**: High concurrency with file locking

## Usage Examples

### Complete Workflow Example
```typescript
// 1. Set problem statement
await fetch('/api/core/state', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    problem: { statement: 'Implement user authentication system' }
  })
});

// 2. Generate documents with two-pass process
const generation = await fetch('/api/core/orchestrate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({})
});

const documents = await generation.json();

// 3. Chat with document context
const chatResponse = await fetch('/api/chat/stream', {
  method: 'POST', 
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'What are the security considerations for password storage?'
  })
});

// Handle streaming response
const reader = chatResponse.body.getReader();
// ... stream processing logic
```

### Error Handling Example
```typescript
async function generateDocuments() {
  try {
    const response = await fetch('/api/core/orchestrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Generation failed: ${error.error}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Document generation error:', error);
    // Handle error appropriately
  }
}
```

## Integration Patterns

### React Component Integration
```typescript
import { useEffect, useState } from 'react';

function DocumentGenerator() {
  const [documents, setDocuments] = useState(null);
  const [generating, setGenerating] = useState(false);

  const generateDocuments = async () => {
    setGenerating(true);
    try {
      const response = await fetch('/api/core/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const result = await response.json();
      setDocuments(result);
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div>
      <button onClick={generateDocuments} disabled={generating}>
        {generating ? 'Generating...' : 'Generate Documents'}
      </button>
      {documents && <DocumentDisplay documents={documents} />}
    </div>
  );
}
```

### State Synchronization Pattern
```typescript
// Custom hook for state management
function useChiralityState() {
  const [state, setState] = useState(null);

  const loadState = async () => {
    const response = await fetch('/api/core/state');
    const data = await response.json();
    setState(data);
  };

  const updateProblem = async (statement: string) => {
    await fetch('/api/core/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ problem: { statement } })
    });
    await loadState();
  };

  useEffect(() => {
    loadState();
  }, []);

  return { state, updateProblem, reload: loadState };
}
```

## Troubleshooting

### Common Issues

#### Environment Configuration
**Problem**: OpenAI API authentication errors
**Solution**: Verify OPENAI_API_KEY is set correctly in .env.local

#### Document Generation Failures
**Problem**: Generation stops or returns incomplete documents
**Solution**: Check OpenAI API rate limits and account status

#### Chat Streaming Issues
**Problem**: Chat responses not streaming or cutting off
**Solution**: Verify browser supports Server-Sent Events, check network connectivity

### Debug Endpoints
```bash
# Check system status
curl http://localhost:3001/api/chat/debug

# Verify current state
curl http://localhost:3001/api/core/state

# Health check
curl http://localhost:3001/api/healthz
```

---

*API documentation for Chirality AI App - Updated for current Next.js implementation with two-pass document generation and RAG-enhanced chat capabilities.*