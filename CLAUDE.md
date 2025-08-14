# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the Chirality Chat application.

## Project Overview

Chirality Chat is a modern chat interface for the Chirality Framework, providing conversational AI access to semantic matrices and knowledge graphs. This is the frontend application that connects to the [Chirality-Framework](https://github.com/sgttomas/Chirality-Framework) backend services.

## Architecture

### Polyrepo Structure
- **This Repository**: Chat UI, streaming responses, matrix visualization
- **Chirality-Framework**: GraphQL service, Python CLI, Neo4j operations

### Key Technologies
- **Frontend**: Next.js 15.2.3, React 18, TypeScript
- **Streaming**: OpenAI Responses API with Server-Sent Events
- **State**: Zustand for UI state, React Query for server state
- **Styling**: Tailwind CSS with custom components
- **Database**: Neo4j via GraphQL and REST APIs

## Development Setup

### Prerequisites
1. Chirality-Framework GraphQL service running on port 8080
2. Neo4j database accessible
3. Valid OpenAI API key

### Quick Start
```bash
npm install
npm run dev  # Starts on http://localhost:3000
```

### Environment Configuration
Create `.env.local`:
```env
OPENAI_API_KEY=sk-proj-...
NEO4J_URI=neo4j+s://...
NEO4J_USER=neo4j
NEO4J_PASSWORD=...
```

## Key Components

### Chat System (`/src/components/chat/`)
- **ChatWindow**: Main container, manages message history
- **ChatInput**: Handles user input and triggers streaming
- **Message**: Renders individual messages with markdown
- **useStream hook**: Manages SSE connection for streaming

### Matrix Visualization (`/src/components/matrix/`)
- **MatrixCanvas**: Canvas-based rendering with zoom/pan
- **MatrixControls**: User interaction controls
- **MatrixPanel**: Container with data integration

### API Routes (`/src/app/api/`)
- **chat/stream**: OpenAI streaming endpoint
- **neo4j/query**: Database queries
- **healthz/readyz**: Health checks

## Important Patterns

### Streaming Responses
The app uses Server-Sent Events for real-time streaming:
```typescript
// useStream.ts accumulates content to prevent message loss
let accumulatedContent = ''
// ... accumulate chunks
// Use accumulated content for final message
```

### Error Handling
- Error boundaries wrap major components
- Graceful fallbacks for failed API calls
- User-friendly error messages

### Performance
- React.memo for expensive components
- useMemo/useCallback for optimizations
- Canvas caching for matrix rendering
- Virtual scrolling for long chats

## Common Tasks

### Adding a New Feature
1. Create component in appropriate directory
2. Add to barrel export (index.ts)
3. Import using barrel imports
4. Add types to lib/types.ts if needed

### Modifying Chat Behavior
- Edit `useStream.ts` for streaming logic
- Update `ChatWindow.tsx` for message handling
- Modify API route for OpenAI configuration

### Working with Matrices
- Matrix data comes from Neo4j via API
- Rendering uses Canvas API for performance
- Interactions handled via useMatrixInteractions hook

## Debugging

### Enable Debug Mode
```bash
DEBUG=* npm run dev
```

### Check Service Health
```bash
# Frontend API
curl http://localhost:3000/api/healthz

# Neo4j connection
curl -X POST http://localhost:3000/api/neo4j/query \
  -d '{"query_type": "ping"}'

# GraphQL service
curl http://localhost:8080/graphql
```

### Common Issues

#### Turbopack Hanging
Solution: Use Webpack instead
```json
"dev": "TURBOPACK=0 next dev"
```

#### Message Disappearing
Fixed in latest version - ensure useStream.ts uses accumulatedContent

#### Port Conflicts
```bash
lsof -i :3000  # Find process
kill -9 <PID>  # Kill process
```

## Code Style

### Conventions
- Use 'use client' for client components
- Prefer named exports
- Use barrel imports from index files
- TypeScript strict mode enabled

### File Organization
```
src/
├── app/          # Next.js app router
├── components/   # React components
├── hooks/        # Custom hooks
├── lib/          # Utilities and services
```

### Component Guidelines
- One component per file
- Props interface above component
- Use memo for expensive renders
- Handle loading/error states

## Testing

### Run Tests
```bash
npm test         # Unit tests
npm run test:e2e # E2E tests
```

### Test New Features
1. Test streaming with various message lengths
2. Verify Neo4j data displays correctly
3. Check error states and recovery
4. Test on multiple browsers

## Deployment

### Build for Production
```bash
npm run build
npm start
```

### Environment Variables
All `.env.local` variables must be set in production:
- OPENAI_API_KEY
- NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD
- Any feature flags

### Performance Monitoring
- Use React DevTools Profiler
- Monitor bundle size: `ANALYZE=true npm run build`
- Check Core Web Vitals

## Integration Points

### With Chirality-Framework
- GraphQL service at localhost:8080
- REST APIs for legacy operations
- Shared Neo4j database

### With OpenAI
- Responses API for streaming
- System prompts for Chirality context
- Token limits and rate limiting

### With Neo4j
- Direct queries via API routes
- GraphQL for complex operations
- Real-time updates via polling

## Migration Notes

If updating from older versions:
1. Check for breaking changes in Next.js 15
2. Update environment variables
3. Clear .next cache
4. Reinstall dependencies

## Best Practices

### Do's
- ✅ Use streaming for better UX
- ✅ Cache API responses with React Query
- ✅ Handle errors gracefully
- ✅ Optimize bundle size
- ✅ Test on slow connections

### Don'ts
- ❌ Don't expose API keys in client code
- ❌ Don't bypass TypeScript checks
- ❌ Don't ignore accessibility
- ❌ Don't skip error boundaries
- ❌ Don't assume service availability

## Resources

- [Repository](https://github.com/sgttomas/Chirality-chat)
- [Backend Framework](https://github.com/sgttomas/Chirality-Framework)
- [Next.js Docs](https://nextjs.org/docs)
- [OpenAI API](https://platform.openai.com/docs)