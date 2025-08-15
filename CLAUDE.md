# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the Chirality Chat application.

## Project Overview

Chirality Chat is a modern, **graph-free** chat interface for the Chirality Framework, providing conversational AI access to semantic document generation and knowledge management. This application has been redesigned with complete independence from GraphQL/Neo4j dependencies.

## Recent Major Changes (IMPORTANT)

🚨 **Critical Architecture Update**: This application now features:
- **Graph-free Chirality Core**: Complete independence from GraphQL/Neo4j
- **OpenAI Responses API**: Migration from Chat Completions API (NOT backwards compatible)
- **File-based state management**: No database dependencies
- **4-Document Workflow**: DS → SP → X → M with RAG chat integration
- **Admin Dashboard**: Full transparency at `/chat-admin`
- **Fixed SSE Streaming**: Robust error handling and message accumulation

## Architecture

### Polyrepo Structure
- **This Repository**: Chat UI, streaming responses, **graph-free Chirality Core**
- **[Chirality-Framework](https://github.com/sgttomas/Chirality-Framework)**: **Optional** GraphQL service (no longer required)

### Key Technologies
- **Frontend**: Next.js 15.2.3, React 18, TypeScript
- **Streaming**: **OpenAI Responses API** with Server-Sent Events (NOT Chat Completions)
- **State**: Zustand for UI state, **file-based storage** for documents
- **Styling**: Tailwind CSS with accessibility-compliant components
- **AI Model**: **gpt-4.1-nano ONLY** (never use other models)

## Development Setup

### Prerequisites
1. ✅ **OpenAI API key** (required)
2. ❌ ~~Neo4j database~~ (optional, legacy features only)
3. ❌ ~~Chirality-Framework GraphQL service~~ (optional, not required)

### Quick Start
```bash
npm install
npm run dev  # Starts on http://localhost:3000
```

### Environment Configuration
Create `.env.local`:
```env
# REQUIRED
OPENAI_API_KEY=sk-proj-your-api-key
OPENAI_MODEL=gpt-4.1-nano

# OPTIONAL (for legacy GraphQL features)
NEO4J_URI=neo4j+s://...
NEO4J_USER=neo4j
NEO4J_PASSWORD=...
```

## Core Implementation: Graph-Free Chirality

### Document Generation Flow
```
1. Set Problem → /chirality-core (UI) or chat command
2. Generate DS → Data Template document
3. Generate SP → Procedural Checklist document  
4. Generate X → Solution Template document
5. Generate M → Guidance document
6. RAG Chat → Documents auto-injected into system prompt
```

### Key Files (CRITICAL)
- **`/src/app/api/chat/stream/route.ts`**: Main chat endpoint with RAG document injection
- **`/src/chirality-core/orchestrate.ts`**: Document generation with 2-pass LLM calls
- **`/src/chirality-core/vendor/llm.ts`**: OpenAI **Responses API** wrapper (NOT Chat Completions)
- **`/src/chirality-core/state/store.ts`**: File-based state persistence
- **`/src/app/chat-admin/page.tsx`**: Admin dashboard for system transparency

### Document Types
```typescript
interface Triple<T> {
  text: T;              // Document-specific structure
  terms_used: string[]; // Keywords used
  warnings: string[];   // Generation warnings
}

// DS: Data Template
{ data_field: string, type?: string, units?: string, source_refs?: string[] }

// SP: Procedural Checklist  
{ step: string, purpose?: string, inputs?: string[], outputs?: string[] }

// X: Solution Template
{ heading: string, narrative: string }

// M: Guidance
{ statement: string, justification?: string, residual_risk?: string[] }
```

## Key Components

### Chat System (`/src/components/chat/`)
- **ChatWindow**: Main container with message accumulation
- **ChatInput**: Command detection and streaming triggers
- **Message**: Markdown rendering with syntax highlighting
- **useStream hook**: **SSE connection with content accumulation** (prevents message loss)

### Chirality Core (`/src/chirality-core/`)
- **orchestrate.ts**: Two-pass document generation (draft → final)
- **vendor/llm.ts**: **Responses API integration** (fixed JSON parsing)
- **state/store.ts**: Atomic file operations for state persistence
- **compactor.ts**: Document optimization for AI context injection

### Admin Tools (`/src/app/chat-admin/`)
- **Debug visibility**: Full system prompt inspection
- **Document injection**: Real-time monitoring of RAG context
- **Auto-refresh**: 2-second polling for live updates
- **Test endpoints**: Validation and metrics

### API Routes (`/src/app/api/`)
- **chat/stream**: Main streaming endpoint with document injection
- **chat/debug**: Admin dashboard data source
- **core/state**: Document state management (GET/POST/DELETE)
- **core/run**: Individual document generation

## Critical Implementation Details

### OpenAI API Usage (IMPORTANT)
```typescript
// ✅ CORRECT - Responses API format
const body = {
  model: 'gpt-4.1-nano',  // ONLY this model
  instructions: systemPrompt,
  input: [
    {
      role: 'user',
      content: [{ type: 'input_text', text: userMessage }]
    }
  ],
  temperature: 0.6,
  stream: true
}

// ❌ WRONG - Chat Completions format (do not use)
const wrongBody = {
  model: 'gpt-3.5-turbo',  // Wrong model
  messages: [/* wrong format */]
}
```

### SSE Streaming Pattern (FIXED)
```typescript
// ✅ CORRECT - Content accumulation pattern
let accumulatedContent = ''

// Parse streaming response
const content = parsed.delta  // NOT parsed.output?.[0]?.content
if (content && parsed.type === 'response.output_text.delta') {
  accumulatedContent += content
  // Send accumulated content to prevent loss
}

// Completion detection
if (parsed.type === 'response.completed') {
  // Stream complete
}
```

### Document State Management
```typescript
// Read current state
const state = readState()  // From file system
const { problem, finals } = state

// Write new document
writeState({
  finals: {
    ...state.finals,
    DS: generatedTriple
  }
})

// Clear all documents
fetch('/api/core/state', { method: 'DELETE' })
```

## Common Tasks

### Adding New Document Types
1. Add interface to `/src/chirality-core/contracts.ts`
2. Extend `runDoc` function in `/src/chirality-core/orchestrate.ts`
3. Add compactor function in `/src/chirality-core/compactor.ts`
4. Update UI components to handle new type

### Modifying Chat Behavior
- **Document injection**: Edit `/src/app/api/chat/stream/route.ts` (lines 246-268)
- **Command detection**: Update `detectChiralityCommand` function
- **Streaming logic**: Modify SSE transform stream (lines 305-339)

### Working with Documents
- **Generation**: Use `runDoc(kind, problem, finals)` function
- **State access**: Use `readState()` and `writeState()` 
- **Compaction**: Use `compactDS/SP/X/M()` for AI context
- **Validation**: Triple format automatically validated

## Debugging Tools

### Admin Dashboard (`/chat-admin`)
- **Document Status**: Real-time view of generated documents
- **System Instructions**: Full prompt sent to OpenAI
- **Compacted View**: Optimized document content
- **Raw Data**: Complete document structures
- **Auto-refresh**: Live monitoring

### Debug Endpoints
```bash
# System status
curl http://localhost:3000/api/chat/debug

# Test document injection
curl -X POST http://localhost:3000/api/chat/test \
  -H "Content-Type: application/json" \
  -d '{"testMessage": "What documents are available?"}'

# Check current state
curl http://localhost:3000/api/core/state
```

### Common Issues & Solutions

#### "SSE error: {}"
- Check OpenAI API key validity
- Verify model access to `gpt-4.1-nano`
- Check network connectivity

#### Document Generation Fails
- Ensure problem is set first: `"set problem: [description]"`
- Check OpenAI API credits
- View errors in admin dashboard

#### Empty Document Fields
- Fixed in current version with JSON unwrapping
- Documents may have extra wrapper layers that are automatically handled

#### Model Errors
- **ONLY use `gpt-4.1-nano`** - other models will fail
- Verify model access in OpenAI dashboard

## Performance Considerations

### Document Generation
- **Two-pass generation**: Draft (temp=0.7) → Final (temp=0.5)
- **Content accumulation**: Prevents streaming message loss  
- **Atomic file operations**: State consistency guaranteed
- **JSON parsing**: Robust handling of malformed LLM responses

### UI Optimizations
- **React.memo**: Expensive component memoization
- **Virtual scrolling**: Long chat history handling
- **Canvas caching**: Matrix rendering optimization
- **Debounced inputs**: Search and form optimization

## Testing Strategy

### Manual Testing Workflow
1. Navigate to `/chirality-core`
2. Set test problem
3. Generate DS → SP → X → M in sequence
4. Test chat with documents injected at `/`
5. Monitor system at `/chat-admin`
6. Clear state and repeat

### Automated Testing
```bash
# Component tests
npm test

# API endpoint tests
curl -X POST http://localhost:3000/api/core/run \
  -H "Content-Type: application/json" \
  -d '{"kind": "DS", "problem": "Test problem"}'
```

## Code Style & Conventions

### TypeScript Patterns
- **Strict mode**: All files use strict typing
- **Interfaces**: Define all data structures
- **Named exports**: Prefer over default exports
- **Barrel imports**: Use index.ts files

### Component Guidelines
- **'use client'**: For client-side components
- **Error boundaries**: Wrap major component trees
- **Loading states**: Handle async operations
- **Accessibility**: WCAG 2.1 AA compliance

### API Route Patterns
- **Error handling**: Proper HTTP status codes
- **TypeScript**: Request/response type safety
- **Streaming**: Use TransformStream for SSE
- **Validation**: Server-side input validation

## Deployment Considerations

### Production Environment
```env
# Required
OPENAI_API_KEY=sk-proj-production-key
OPENAI_MODEL=gpt-4.1-nano

# Optional
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

### Build Process
```bash
npm run build  # Production optimization
npm start      # Production server
```

## Integration Points

### With OpenAI
- **Responses API**: Streaming document generation
- **Model**: Exclusively `gpt-4.1-nano`
- **System prompts**: Dynamic document injection
- **Error handling**: Robust retry mechanisms

### With File System
- **State storage**: Temporary directory JSON files
- **Atomic operations**: Race condition prevention
- **Cleanup**: Automatic state management

### Legacy GraphQL (Optional)
- **Matrix visualization**: Neo4j data (if available)
- **Backwards compatibility**: Graceful degradation
- **Optional dependency**: App works without it

## Best Practices

### Do's ✅
- Use **OpenAI Responses API** format consistently
- Accumulate content in SSE streams to prevent loss
- Always set problem before generating documents
- Use admin dashboard for debugging and transparency
- Handle malformed JSON responses gracefully
- Follow file-based state management patterns

### Don'ts ❌
- Don't use Chat Completions API (deprecated in this app)
- Don't use models other than `gpt-4.1-nano`
- Don't bypass document validation
- Don't expose API keys in client code
- Don't assume GraphQL/Neo4j availability
- Don't ignore SSE error states

## Migration Notes

### From GraphQL Version
- State management: File-based instead of database
- Document generation: Direct LLM calls instead of GraphQL
- Dependencies: Removed Neo4j requirements
- API format: Responses API instead of Chat Completions

### From Chat Completions API
- Request format: `instructions` + `input` instead of `messages`
- Response parsing: `delta` field instead of `choices[0].delta`
- Model requirements: `gpt-4.1-nano` only
- Streaming events: Different event types

## Resources

- [Repository](https://github.com/sgttomas/Chirality-chat)
- [Framework Repository](https://github.com/sgttomas/Chirality-Framework) (optional)
- [OpenAI Responses API](https://platform.openai.com/docs/api-reference/responses)
- [Next.js App Router](https://nextjs.org/docs/app)

---

🤖 **For Claude Code**: This codebase implements a complete graph-free Chirality Framework with robust document generation, RAG chat integration, and comprehensive admin tools. Focus on the file-based state management and OpenAI Responses API patterns when making modifications.