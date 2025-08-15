# Chirality Core - Graph-Free Implementation

This directory contains the core graph-free implementation of the Chirality Framework, providing document generation and state management without dependencies on GraphQL or Neo4j.

## Overview

The Chirality Core implements a streamlined 4-document workflow:
- **DS (Data Template)**: Structured field definitions and data specifications
- **SP (Procedural Checklist)**: Step-by-step procedural workflows  
- **X (Solution Template)**: Narrative solution templates
- **M (Guidance)**: Guidance documents with justifications

## Architecture

### Key Components

#### State Management (`state/`)
- **`store.ts`**: File-based persistent storage for documents and problem definitions
- **Format**: JSON serialization with atomic file operations
- **Location**: Temporary directory with `.chirality-state.json`

#### Document Generation (`orchestrate.ts`)
- **Two-pass generation**: Draft → Finalize for higher quality
- **LLM integration**: OpenAI Responses API with robust error handling
- **JSON unwrapping**: Handles various LLM response formats automatically
- **Validation**: Triple format validation (`{text, terms_used, warnings}`)

#### LLM Integration (`vendor/`)
- **`llm.ts`**: OpenAI Responses API wrapper (NOT Chat Completions)
- **Model**: Exclusively uses `gpt-4.1-nano` 
- **Error handling**: Robust JSON parsing with fallback for malformed responses
- **Retry logic**: Built-in retry mechanism for API failures

#### Document Optimization (`compactor.ts`)
- **Compact serialization**: Optimized document representation for AI context
- **Format-specific**: Custom compaction for each document type (DS/SP/X/M)
- **Token efficiency**: Minimizes token usage while preserving semantic content

### Document Generation Flow

```
1. Problem Definition → state/store.ts
2. System Prompt Generation → systemPrompt.ts  
3. User Prompt Building → userPrompt.ts
4. LLM Generation (2-pass) → vendor/llm.ts
5. Response Processing → orchestrate.ts
6. Validation & Storage → state/store.ts
7. Compaction for RAG → compactor.ts
```

## API Usage

### State Management

```typescript
import { readState, writeState } from './state/store'

// Read current state
const state = readState()
const { problem, finals } = state

// Write new state
writeState({
  problem: {
    title: 'Problem Title',
    statement: 'Problem description',
    initialVector: ['analysis', 'solution']
  }
})

// Add generated document
writeState({
  finals: {
    ...state.finals,
    DS: generatedTriple
  }
})
```

### Document Generation

```typescript
import { runDoc } from './orchestrate'

// Generate a document
const triple = await runDoc('DS', problem, existingFinals)

// Result format: Triple<DS>
// {
//   text: { data_field: "...", type: "...", units: "..." },
//   terms_used: ["term1", "term2"],
//   warnings: ["warning if any"]
// }
```

### Document Compaction

```typescript
import { compactDS, compactSP, compactX, compactM } from './compactor'

// Compact for AI context injection
const compactedDS = compactDS(dsDocument.text)
const compactedSP = compactSP(spDocument.text)
```

## Configuration

### Environment Variables

```env
# Required
OPENAI_API_KEY=sk-proj-your-api-key
OPENAI_MODEL=gpt-4.1-nano

# Optional tuning
DEFAULT_TEMPERATURE=0.6
MAX_OUTPUT_TOKENS=800
OPENAI_API_TIMEOUT=60000
```

### Model Requirements

- **Only gpt-4.1-nano**: Other models are not supported
- **Responses API**: Uses OpenAI Responses API, not Chat Completions
- **Temperature**: Draft=0.7, Final=0.5 for optimal quality

## File Formats

### State File Structure
```json
{
  "problem": {
    "title": "Problem Title",
    "statement": "Detailed problem description",
    "initialVector": ["keyword1", "keyword2"]
  },
  "finals": {
    "DS": {
      "text": { "data_field": "...", "type": "...", "units": "..." },
      "terms_used": ["term1", "term2"],
      "warnings": []
    },
    "SP": { /* Procedural checklist structure */ },
    "X": { /* Solution template structure */ },
    "M": { /* Guidance structure */ }
  }
}
```

### Triple Format
All generated documents follow the triple format:
```typescript
interface Triple<T> {
  text: T;           // Document-specific structure
  terms_used: string[];  // Keywords and terms used
  warnings: string[];    // Any generation warnings
}
```

## Document Types

### DS (Data Template)
```typescript
interface DS {
  data_field: string;
  type?: string;
  units?: string;
  source_refs?: string[];
}
```

### SP (Procedural Checklist)  
```typescript
interface SP {
  step: string;
  purpose?: string;
  inputs?: string[];
  outputs?: string[];
}
```

### X (Solution Template)
```typescript
interface X {
  heading: string;
  narrative: string;
}
```

### M (Guidance)
```typescript
interface M {
  statement: string;
  justification?: string;
  residual_risk?: string[];
}
```

## Error Handling

### Common Errors

1. **API Key Issues**: Verify `OPENAI_API_KEY` environment variable
2. **Model Access**: Ensure access to `gpt-4.1-nano` model
3. **File Permissions**: Check write access to temporary directory
4. **JSON Parsing**: Handles malformed LLM responses gracefully
5. **Validation Failures**: Returns error documents with warnings

### Debugging

```typescript
// Enable debug logging
console.log('State:', readState())

// Check document generation
try {
  const result = await runDoc('DS', problem, finals)
  console.log('Generated:', result)
} catch (error) {
  console.error('Generation failed:', error)
}
```

## Testing

### Manual Testing
```bash
# Test state management
curl -X GET http://localhost:3000/api/core/state

# Test document generation  
curl -X POST http://localhost:3000/api/core/run \
  -H "Content-Type: application/json" \
  -d '{"kind": "DS", "problem": "Test problem"}'

# Clear state
curl -X DELETE http://localhost:3000/api/core/state
```

### Integration Testing
- State persistence across server restarts
- Document generation with various problem types
- Error recovery and graceful degradation
- JSON parsing with malformed responses

## Performance Considerations

### Optimization Strategies
- **File-based storage**: No database overhead
- **Compact serialization**: Minimal token usage in AI context
- **Two-pass generation**: Higher quality with manageable cost
- **Caching**: State persists between requests

### Scaling Considerations
- **Stateless design**: Each request is independent
- **File locking**: Atomic operations prevent corruption
- **Memory usage**: Minimal in-memory state
- **Token efficiency**: Optimized for gpt-4.1-nano context limits

## Migration Notes

### From GraphQL/Neo4j
This implementation replaces the previous GraphQL/Neo4j dependency:
- **No database**: File-based state management
- **Simplified API**: Direct function calls instead of GraphQL
- **Independent**: No external service dependencies
- **Portable**: Works anywhere Node.js runs

### API Changes
- State management: `readState()` / `writeState()` instead of database queries
- Document generation: Direct `runDoc()` calls instead of GraphQL mutations
- No schema dependencies: Pure TypeScript interfaces

---

🤖 This implementation provides a complete, graph-free Chirality Framework core with robust error handling, efficient document generation, and transparent state management.