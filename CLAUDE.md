# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the **Chirality Core Chat** application.

## Project Overview

Chirality Core Chat is a streamlined chatbot interface with RAG (Retrieval-Augmented Generation) powered by the Chirality Framework's **two-pass document generation system**. This application focuses entirely on document-enhanced chat functionality with minimal dependencies.

## Architecture

### Core Technologies
- **Frontend**: Next.js 15.2.3, React 18, TypeScript
- **Streaming**: OpenAI Chat Completions API with Server-Sent Events
- **State**: Zustand for UI state, **file-based storage** for documents
- **Styling**: Tailwind CSS
- **AI Model**: **gpt-4.1-nano** (configurable via environment)

### Key Features
- **Two-Pass Document Generation**: Sequential generation followed by cross-referential refinement
- **Document-Enhanced Chat**: Automatic context injection from generated DS/SP/X/M documents
- **Real-time Streaming**: Server-sent events for responsive chat experience
- **File-based State**: Simple, database-free persistence
- **Clean Architecture**: Minimal dependencies, focused functionality

## Development Setup

### Prerequisites
1. ✅ **OpenAI API key** (required)
2. ❌ **No database dependencies** (uses file-based state)

### Quick Start
```bash
npm install
npm run dev  # Starts on http://localhost:3001 (or 3000 if available)
```

### Environment Configuration
Create `.env.local`:
```env
# REQUIRED
OPENAI_API_KEY=sk-proj-your-api-key
OPENAI_MODEL=gpt-4.1-nano

# OPTIONAL
DEFAULT_TEMPERATURE=0.6
MAX_OUTPUT_TOKENS=800
```

## Core Implementation: Two-Pass Document Generation

### Document Generation Flow

**Pass 1 (Sequential Generation):**
```
1. DS (Data Sheet) → generated first
2. SP (Procedural Checklist) → using DS
3. X (Solution Template) → using DS + SP  
4. M (Guidance) → using DS + SP + X
```

**Pass 2 (Cross-Referential Refinement):**
```
1. DS refined → using insights from SP, X, M
2. SP refined → using new DS + original X, M
3. X refined → using new DS, new SP + original M
4. M refined → using new DS, new SP, new X
```

**Final Resolution:**
```
5. X final update → using all refined DS, SP, M
```

This creates a feedback loop where each document gets enriched by insights from all others.

### Key Files (CRITICAL)

#### Document Generation
- **`/src/app/api/core/orchestrate/route.ts`**: Two-pass document generation endpoint
- **`/src/app/api/core/run/route.ts`**: Single document generation endpoint
- **`/src/chirality-core/orchestrate.ts`**: Core document generation logic with 2-pass LLM calls
- **`/src/chirality-core/validators.ts`**: Flexible document validation (handles strings and arrays)
- **`/src/chirality-core/vendor/llm.ts`**: OpenAI API wrapper

#### Chat System
- **`/src/app/api/chat/stream/route.ts`**: Main chat endpoint with RAG document injection
- **`/src/components/chat/ChatWindow.tsx`**: Main chat interface
- **`/src/components/chat/ChatInput.tsx`**: Message input with command detection

#### UI Components
- **`/src/app/chirality-core/page.tsx`**: Main document generation UI
- **`/src/app/chat-admin/page.tsx`**: Admin dashboard for system transparency

#### State Management
- **`/src/chirality-core/state/store.ts`**: File-based state persistence

### Document Types
```typescript
interface Triple<T> {
  text: T;              // Document-specific structure
  terms_used: string[]; // Keywords used
  warnings: string[];   // Generation warnings
}

// DS: Data Sheet
{ data_field: string, type?: string, units?: string, source_refs?: string[], notes?: string[] }

// SP: Procedural Checklist  
{ step: string, purpose?: string, inputs?: string[], outputs?: string[], preconditions?: string[], postconditions?: string[], refs?: string[] }

// X: Solution Template
{ heading: string, narrative: string, precedents?: string[], successors?: string[], context_notes?: string[], refs?: string[] }

// M: Guidance
{ statement: string, justification?: string, trace_back?: string[], assumptions?: string[], residual_risk?: string[] }
```

## API Endpoints

### POST /api/core/orchestrate
**Two-pass document generation with resolution**
```typescript
// Request: {}
// Response: { success: true, pass1: {}, pass2: {}, logs: string[], totalTimeSeconds: number }
```

### POST /api/core/run
**Single document generation**
```typescript
// Request: { kind: 'DS' | 'SP' | 'X' | 'M' }
// Response: { kind: string, triple: Triple<any>, latencyMs: number }
```

### POST /api/chat/stream
**Stream chat responses with document context**
```typescript
// Request: { message: string, conversationId?: string }
// Response: Server-Sent Events stream
```

### GET/POST/DELETE /api/core/state
**Document state management**
```typescript
// GET: Returns current state
// POST: { problem?: {}, finals?: {} }
// DELETE: Clears all state
```

## Chat System with RAG

### Document Injection Pattern
The chat system automatically injects generated documents into the system context:

```typescript
const instructions = [
  'You are the Chirality Chat engine.',
  'Use pinned DS/SP/X/M as ground truth context for this session.',
  'Prefer cited evidence; include citation IDs when relevant.',
  ''
]

if (DS || SP || X || M) {
  instructions.push('--- Pinned Finals (compact) ---')
  if (DS) instructions.push(`DS: ${compactDS(DS.text)}`)
  if (SP) instructions.push(`SP: ${compactSP(SP.text)}`)
  if (X) instructions.push(`X: ${compactX(X.text)}`)
  if (M) instructions.push(`M: ${compactM(M.text)}`)
  instructions.push('--- End Pinned ---')
}
```

### Command Detection
The chat system recognizes these commands:
- `set problem: [description]` - Define the problem context
- `generate DS/SP/X/M` - Generate specific documents

## Common Development Tasks

### Adding New Document Types
1. Add interface to `/src/chirality-core/contracts.ts`
2. Extend `runDoc` function in `/src/chirality-core/orchestrate.ts`
3. Add validator in `/src/chirality-core/validators.ts`
4. Add compactor function in `/src/chirality-core/compactor.ts`
5. Update UI components to handle new type

### Modifying Document Generation
- **Two-pass logic**: Edit `/src/app/api/core/orchestrate/route.ts`
- **Single document**: Edit `/src/app/api/core/run/route.ts`
- **Validation**: Update `/src/chirality-core/validators.ts`
- **LLM prompts**: Modify `/src/chirality-core/systemPrompt.ts` and `/src/chirality-core/userPrompt.ts`

### Modifying Chat Behavior
- **Document injection**: Edit `/src/app/api/chat/stream/route.ts` (lines around 246-268)
- **Command detection**: Update `detectChiralityCommand` function
- **Streaming logic**: Modify SSE transform stream

## Testing Strategy

### Manual Testing Workflow
1. Navigate to `/chirality-core`
2. Enter a test problem (e.g., "how to weld carbon steel pipe to stainless steel pipe")
3. Choose "Single Pass" or "🔄 Two-Pass with Resolution"
4. Observe document generation in logs
5. Test chat with documents injected at `/`
6. Monitor system at `/chat-admin`
7. Clear state and repeat with different problems

### Debug Endpoints
```bash
# System status
curl http://localhost:3001/api/chat/debug

# Check current state
curl http://localhost:3001/api/core/state

# Clear state
curl -X DELETE http://localhost:3001/api/core/state
```

## Performance Considerations

### Document Generation
- **Two-pass generation**: 8 total LLM calls (4 initial + 4 refinement + 1 resolution)
- **Single-pass generation**: 4 LLM calls
- **Content validation**: Flexible validators handle both string and array formats
- **Atomic file operations**: State consistency guaranteed

### Error Handling
- **Graceful degradation**: Continues generation even if individual documents fail
- **Flexible validation**: Automatically converts strings to arrays where needed
- **Comprehensive logging**: Detailed progress tracking in UI

## Code Style & Conventions

### TypeScript Patterns
- **Strict mode**: All files use strict typing
- **Interfaces**: Define all data structures
- **Named exports**: Prefer over default exports

### Component Guidelines
- **'use client'**: For client-side components
- **Error boundaries**: Wrap major component trees
- **Loading states**: Handle async operations

### API Route Patterns
- **Error handling**: Proper HTTP status codes
- **TypeScript**: Request/response type safety
- **Streaming**: Use TransformStream for SSE

## Deployment Considerations

### Production Environment
```env
OPENAI_API_KEY=sk-proj-production-key
OPENAI_MODEL=gpt-4.1-nano
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

### Build Process
```bash
npm run build  # Production optimization
npm start      # Production server
```

## Best Practices

### Do's ✅
- Use **two-pass generation** for complex problems requiring document coherence
- Test both single-pass and two-pass modes
- Always set problem before generating documents
- Use admin dashboard for debugging and transparency
- Handle validation errors gracefully

### Don'ts ❌
- Don't assume specific test framework - check codebase first
- Don't bypass document validation
- Don't expose API keys in client code
- Don't ignore SSE error states

## Resources

- [Repository](https://github.com/sgttomas/Chirality-chat)
- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference/chat)
- [Next.js App Router](https://nextjs.org/docs/app)

---

🤖 **For Claude Code**: This codebase implements a streamlined Chirality Framework with innovative two-pass document generation, creating coherent cross-referenced documents through iterative refinement. Focus on the two-pass orchestration system and document injection patterns when making modifications.