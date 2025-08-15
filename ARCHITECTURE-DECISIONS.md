# Architecture Decision Records (ADR)

This document captures the key architectural decisions made during the development of Chirality Chat, providing context for future contributors and maintainers.

## ADR-001: Graph-Free Architecture Migration

**Date**: 2024-01-15  
**Status**: Implemented  
**Deciders**: Development Team  

### Context
The original implementation required GraphQL service and Neo4j database dependencies, creating complexity for deployment and development setup.

### Decision
Migrate to a **graph-free architecture** with file-based state management, eliminating external database dependencies.

### Consequences

**Positive:**
- ✅ Simplified deployment (no database setup required)
- ✅ Faster development setup (one command: `npm run dev`)
- ✅ Self-contained application (portable across environments)
- ✅ Reduced infrastructure costs (no database hosting)
- ✅ Stateless scaling (horizontal scaling simplified)

**Negative:**
- ❌ Loss of advanced graph query capabilities
- ❌ No persistent state across application restarts
- ❌ File-based storage limits concurrent access patterns

**Mitigation:**
- Keep GraphQL/Neo4j as optional dependency for advanced features
- Implement robust file locking for state management
- Plan future database migration path if persistence becomes critical

### Implementation Details
- State stored in `/tmp/.chirality-state.json`
- Atomic file operations prevent corruption
- Graceful fallback when state file missing
- Optional GraphQL integration maintained for backward compatibility

---

## ADR-002: OpenAI Responses API Migration

**Date**: 2024-01-15  
**Status**: Implemented  
**Deciders**: Development Team  

### Context
The application originally used OpenAI's Chat Completions API, but Responses API provides better streaming and instruction-based interactions.

### Decision
Migrate from **Chat Completions API** to **Responses API** for all LLM interactions.

### Consequences

**Positive:**
- ✅ Better streaming performance and reliability
- ✅ Instruction-based prompting (cleaner than system messages)
- ✅ More predictable response format
- ✅ Better token efficiency for system prompts

**Negative:**
- ❌ Breaking change requiring code updates throughout
- ❌ Different API format not backwards compatible
- ❌ Model restrictions (gpt-4.1-nano required)

**Technical Changes:**
```typescript
// OLD - Chat Completions format
{
  model: "gpt-3.5-turbo",
  messages: [
    { role: "system", content: "..." },
    { role: "user", content: "..." }
  ]
}

// NEW - Responses API format
{
  model: "gpt-4.1-nano",
  instructions: "...",
  input: [
    { role: "user", content: [{ type: "input_text", text: "..." }] }
  ]
}
```

### Implementation Details
- All LLM calls converted to Responses API format
- Response parsing updated for new streaming format
- Error handling adapted for new error codes
- Model locked to `gpt-4.1-nano` for consistency

---

## ADR-003: Server-Sent Events for Streaming

**Date**: 2024-01-15  
**Status**: Implemented  
**Deciders**: Development Team  

### Context
Real-time streaming responses are critical for good user experience, but WebSocket implementation was complex and unreliable.

### Decision
Use **Server-Sent Events (SSE)** for streaming AI responses instead of WebSockets.

### Consequences

**Positive:**
- ✅ Simpler implementation than WebSockets
- ✅ Built-in reconnection handling in browsers
- ✅ Works well with serverless deployments
- ✅ HTTP-based (firewall friendly)
- ✅ Excellent browser support

**Negative:**
- ❌ Unidirectional (server → client only)
- ❌ No binary data support
- ❌ Connection limits per domain

**Technical Implementation:**
```typescript
// Server: Transform OpenAI stream to SSE
const transformStream = new TransformStream({
  async transform(chunk, controller) {
    // Process OpenAI chunks
    const content = parsed.delta
    controller.enqueue(encoder.encode(
      `data: ${JSON.stringify({ type: 'content', content })}\n\n`
    ))
  }
})

// Client: EventSource for receiving
const eventSource = new EventSource('/api/chat/stream')
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data)
  if (data.type === 'content') {
    accumulateContent(data.content)
  }
}
```

### Implementation Details
- Content accumulation prevents message loss
- Proper error handling and reconnection
- Transform stream for OpenAI → SSE conversion
- Event types: `content`, `done`, `error`

---

## ADR-004: Document State Management Strategy

**Date**: 2024-01-15  
**Status**: Implemented  
**Deciders**: Development Team  

### Context
The 4-document workflow (DS → SP → X → M) requires persistent state management for generated documents and problem definitions.

### Decision
Implement **file-based JSON state storage** with atomic operations for document persistence.

### Consequences

**Positive:**
- ✅ Simple implementation with standard file I/O
- ✅ Human-readable state format (JSON)
- ✅ No database setup or maintenance
- ✅ Easy backup and migration
- ✅ Atomic operations prevent corruption

**Negative:**
- ❌ Not suitable for multi-user scenarios
- ❌ Limited to single-server deployments
- ❌ No built-in versioning or history
- ❌ Performance limitations for large states

**State Structure:**
```typescript
interface ChiralityState {
  problem: {
    title: string
    statement: string
    initialVector: string[]
  }
  finals: {
    DS?: Triple<DS>
    SP?: Triple<SP>
    X?: Triple<X>
    M?: Triple<M>
  }
}
```

### Implementation Details
- State file: `/tmp/.chirality-state.json`
- Atomic writes using temporary files
- Read-through caching for performance
- Graceful handling of missing/corrupted files
- Clear state API endpoint for testing

---

## ADR-005: Admin Dashboard for Transparency

**Date**: 2024-01-15  
**Status**: Implemented  
**Deciders**: Development Team  

### Context
Debugging document generation and chat context injection was difficult without visibility into internal system state.

### Decision
Create a **comprehensive admin dashboard** at `/chat-admin` providing real-time system transparency.

### Consequences

**Positive:**
- ✅ Complete visibility into document generation
- ✅ Real-time monitoring of chat context injection
- ✅ Excellent debugging capabilities
- ✅ Non-intrusive (separate route)
- ✅ Auto-refresh for live monitoring

**Negative:**
- ❌ Additional maintenance burden
- ❌ Potential security exposure in production
- ❌ Development time investment

**Dashboard Features:**
- Document status overview
- Full system instructions display
- Compacted document content viewer
- Raw document data inspection
- Real-time metrics and timestamps
- Test endpoint integration

### Implementation Details
- React-based dashboard with auto-refresh
- Debug API endpoints for data access
- Tabbed interface for different views
- Real-time polling every 2 seconds
- Mobile-responsive design

---

## ADR-006: Two-Pass Document Generation

**Date**: 2024-01-15  
**Status**: Implemented  
**Deciders**: Development Team  

### Context
Single-pass LLM generation sometimes produced low-quality or inconsistent documents.

### Decision
Implement **two-pass document generation**: Draft (high temperature) → Final (low temperature).

### Consequences

**Positive:**
- ✅ Higher quality document generation
- ✅ More consistent output format
- ✅ Better JSON compliance
- ✅ Reduced need for retries

**Negative:**
- ❌ Doubled API costs per document
- ❌ Increased generation time
- ❌ More complex error handling

**Implementation:**
```typescript
// Two-pass generation pattern
const draft = await callJSON(system, user, { temperature: 0.7 })
const final = await callJSON(system, user, { temperature: 0.5, prior: draft })
```

### Implementation Details
- Draft pass: Higher temperature (0.7) for creativity
- Final pass: Lower temperature (0.5) for consistency
- JSON unwrapping handles various response formats
- Validation ensures proper Triple format
- Fallback to single-pass on errors

---

## ADR-007: React Performance Optimization Strategy

**Date**: 2024-01-15  
**Status**: Implemented  
**Deciders**: Development Team  

### Context
Chat interface and admin dashboard needed to handle real-time updates without performance degradation.

### Decision
Implement **comprehensive React performance optimization** using memoization, virtualization, and proper hook patterns.

### Consequences

**Positive:**
- ✅ Smooth real-time updates
- ✅ Efficient re-rendering patterns
- ✅ Good performance with large document sets
- ✅ Responsive user interface

**Negative:**
- ❌ Increased complexity in component code
- ❌ More careful dependency management required
- ❌ Additional testing burden

**Optimization Techniques:**
```typescript
// Component memoization
export const Component = React.memo<Props>(({ data, onAction }) => {
  // Expensive calculation memoization
  const processedData = useMemo(() => 
    expensiveProcessing(data), [data]
  )
  
  // Stable callback references
  const handleAction = useCallback((value) => 
    onAction(value), [onAction]
  )
  
  return <div>{/* component content */}</div>
})
```

### Implementation Details
- React.memo for expensive components
- useMemo for computational work
- useCallback for stable function references
- Virtual scrolling for long chat histories
- Canvas optimization for matrix rendering

---

## ADR-008: TypeScript Strict Mode Enforcement

**Date**: 2024-01-15  
**Status**: Implemented  
**Deciders**: Development Team  

### Context
Type safety is critical for maintainability and preventing runtime errors in a complex AI application.

### Decision
Enforce **TypeScript strict mode** throughout the application with no exceptions.

### Consequences

**Positive:**
- ✅ Excellent type safety and IntelliSense
- ✅ Catch errors at compile time
- ✅ Better refactoring capabilities
- ✅ Self-documenting code through types

**Negative:**
- ❌ Longer initial development time
- ❌ Steeper learning curve for contributors
- ❌ More verbose type definitions

**Type Safety Patterns:**
```typescript
// Strict interface definitions
interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

// No 'any' types allowed
const parseResponse = (data: unknown): ChatMessage => {
  if (!isValidChatMessage(data)) {
    throw new Error('Invalid chat message format')
  }
  return data
}
```

### Implementation Details
- Strict TypeScript configuration
- Interface definitions for all data structures
- Type guards for runtime validation
- Generic types for reusable patterns
- No `any` types allowed

---

## ADR-009: Barrel Exports for Import Organization

**Date**: 2024-01-15  
**Status**: Implemented  
**Deciders**: Development Team  

### Context
Import statements were becoming long and difficult to manage as the codebase grew.

### Decision
Implement **barrel exports** using `index.ts` files in all component and utility directories.

### Consequences

**Positive:**
- ✅ Clean, readable import statements
- ✅ Better code organization
- ✅ Easier refactoring and moving files
- ✅ Consistent import patterns

**Negative:**
- ❌ Additional maintenance of index files
- ❌ Potential for circular dependencies
- ❌ Bundle size optimization complexity

**Pattern:**
```typescript
// src/components/chat/index.ts
export { ChatWindow } from './ChatWindow'
export { ChatInput } from './ChatInput'
export { Message } from './Message'

// Usage
import { ChatWindow, ChatInput, Message } from '@/components/chat'
```

### Implementation Details
- Index files in all component directories
- Named exports preferred over default
- TypeScript path mapping for clean imports
- ESLint rules prevent circular dependencies

---

## ADR-010: Accessibility-First Design

**Date**: 2024-01-15  
**Status**: Implemented  
**Deciders**: Development Team  

### Context
The application must be usable by all users, including those with disabilities.

### Decision
Implement **WCAG 2.1 AA compliance** as a primary design constraint, not an afterthought.

### Consequences

**Positive:**
- ✅ Inclusive user experience
- ✅ Better usability for all users
- ✅ Legal compliance in many jurisdictions
- ✅ Better SEO and semantic markup

**Negative:**
- ❌ Additional development time
- ❌ More complex component implementations
- ❌ Testing overhead

**Accessibility Features:**
```typescript
// Proper ARIA attributes
<div
  role="log"
  aria-label="Chat messages"
  aria-live="polite"
  aria-atomic="false"
>
  {messages.map(message => (
    <Message key={message.id} message={message} />
  ))}
</div>

// Screen reader support
<button
  onClick={handleSubmit}
  aria-label="Send message"
  aria-describedby="input-hint"
>
  Send
</button>
```

### Implementation Details
- ARIA attributes throughout components
- Keyboard navigation support
- Color contrast compliance (4.5:1 ratio)
- Screen reader tested
- Focus management patterns

---

## Decision Summary

| ADR | Decision | Impact | Status |
|-----|----------|---------|--------|
| 001 | Graph-Free Architecture | 🟢 High | ✅ Complete |
| 002 | OpenAI Responses API | 🟢 High | ✅ Complete |
| 003 | Server-Sent Events | 🟡 Medium | ✅ Complete |
| 004 | File-Based State | 🟡 Medium | ✅ Complete |
| 005 | Admin Dashboard | 🟡 Medium | ✅ Complete |
| 006 | Two-Pass Generation | 🟡 Medium | ✅ Complete |
| 007 | React Optimization | 🟡 Medium | ✅ Complete |
| 008 | TypeScript Strict | 🟢 High | ✅ Complete |
| 009 | Barrel Exports | 🔵 Low | ✅ Complete |
| 010 | Accessibility-First | 🟡 Medium | ✅ Complete |

## Future Architecture Decisions

### Under Consideration
- **ADR-011**: Database migration strategy for multi-user support
- **ADR-012**: Micro-frontend architecture for component reuse
- **ADR-013**: AI model abstraction for provider flexibility
- **ADR-014**: Real-time collaboration features
- **ADR-015**: Enterprise authentication and authorization

### Evaluation Criteria
When making new architectural decisions, consider:

1. **Simplicity**: Does this reduce or increase complexity?
2. **Performance**: What is the performance impact?
3. **Maintainability**: How does this affect long-term maintenance?
4. **Security**: What are the security implications?
5. **Scalability**: How does this affect scaling capabilities?
6. **Developer Experience**: Does this improve or hinder development?
7. **User Experience**: What is the impact on end users?

---

**Note**: This document should be updated whenever significant architectural decisions are made. Each ADR should include context, decision rationale, consequences, and implementation details.