# Chirality Chat - Help & Troubleshooting Guide

## Table of Contents
- [Quick Start](#quick-start)
- [Common Issues & Solutions](#common-issues--solutions)
- [Architecture Overview](#architecture-overview)
- [Development Workflow](#development-workflow)
- [API Integration](#api-integration)
- [Troubleshooting](#troubleshooting)
- [Performance Optimization](#performance-optimization)

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Access to Neo4j database (Aura or local)
- OpenAI API key
- [Chirality-Framework](https://github.com/sgttomas/Chirality-Framework) GraphQL service running

### Installation

1. **Clone and install:**
```bash
git clone https://github.com/sgttomas/Chirality-chat.git
cd Chirality-chat
npm install
```

2. **Configure environment:**
Create `.env.local` file:
```env
# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key

# Neo4j Configuration
NEO4J_URI=neo4j+s://your-instance.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=your-password
NEO4J_DATABASE=neo4j

# Optional: GraphQL endpoint (defaults to localhost:8080)
GRAPHQL_ENDPOINT=http://localhost:8080/graphql
```

3. **Start the application:**
```bash
npm run dev  # Development mode with hot reload
# or
npm run build && npm start  # Production mode
```

## Common Issues & Solutions

### Issue: "OpenAI API error: 401"
**Solution:** Verify your OPENAI_API_KEY in `.env.local` is valid and has credits.

### Issue: "Neo4j connection failed"
**Solutions:**
1. Check Neo4j credentials in `.env.local`
2. For Aura: Ensure URI starts with `neo4j+s://`
3. For local: Use `bolt://localhost:7687`
4. Verify database is running: `lsof -i :7687`

### Issue: "Message disappears after streaming"
**Solution:** This was fixed in the latest version. Ensure you have the latest code with the `accumulatedContent` fix in `useStream.ts`.

### Issue: "Port 3000 already in use"
**Solutions:**
```bash
# Find and kill process on port 3000
lsof -i :3000
kill -9 <PID>

# Or use a different port
PORT=3001 npm run dev
```

### Issue: "Turbopack hanging on startup"
**Solutions:**
1. Use Webpack instead: `TURBOPACK=0 npm run dev`
2. Or update package.json: `"dev": "next dev --turbo=false"`
3. Check for circular dependencies: `npx madge src --circular --extensions ts,tsx`

### Issue: "GraphQL service not reachable"
**Solutions:**
1. Ensure Chirality-Framework GraphQL service is running:
```bash
cd ../chirality-semantic-framework/graphql-service
npm run dev  # Should start on port 8080
```
2. Verify connection: `curl http://localhost:8080/graphql`

## Architecture Overview

### Frontend Stack
- **Framework:** Next.js 15.2.3 with App Router
- **Language:** TypeScript with strict typing
- **Styling:** Tailwind CSS
- **State:** Zustand for local state, React Query for server state
- **Components:** Custom UI library with accessibility features

### Key Components

#### Chat System (`/src/components/chat/`)
- `ChatWindow.tsx`: Main chat interface
- `ChatInput.tsx`: Message input with streaming support
- `Message.tsx`: Message display with markdown support
- `TypingIndicator.tsx`: Visual feedback during streaming

#### Matrix Visualization (`/src/components/matrix/`)
- `MatrixCanvas.tsx`: Canvas-based matrix rendering
- `MatrixControls.tsx`: Zoom, pan, and interaction controls
- `MatrixPanel.tsx`: Container with Neo4j data integration

#### Hooks (`/src/hooks/`)
- `useStream.ts`: Server-sent events for streaming responses
- `useSemantic.ts`: Neo4j/GraphQL data fetching
- `useHealth.ts`: Service health monitoring
- `useMCPClient.ts`: Model Context Protocol integration

### Data Flow
```
User Input → ChatInput → useStream Hook → API Route → OpenAI
                              ↓
                    Server-Sent Events (SSE)
                              ↓
                    Message Component → Chat Display
```

## Development Workflow

### Code Style
- ESLint + Prettier configured
- Run `npm run lint` before committing
- TypeScript strict mode enabled

### Testing
```bash
npm test          # Run test suite
npm run test:e2e  # End-to-end tests
```

### Building for Production
```bash
npm run build    # Creates optimized production build
npm run analyze  # Bundle size analysis
```

### Performance Monitoring
- React DevTools Profiler for component performance
- Chrome DevTools Performance tab for runtime analysis
- Bundle analyzer: `ANALYZE=true npm run build`

## API Integration

### OpenAI Responses API
The app uses OpenAI's Responses API with streaming:

```typescript
// API Route: /src/app/api/chat/stream/route.ts
- Uses Server-Sent Events (SSE) for real-time streaming
- Configured for gpt-4.1-nano model
- Supports system prompts for Chirality Framework context
```

### Neo4j Integration
Direct database queries via API routes:

```typescript
// API Routes: /src/app/api/neo4j/query/route.ts
- get_matrices: Retrieve semantic matrices
- get_components: Fetch Chirality components
- knowledge_graph: Query entity relationships
- custom: Execute Cypher queries
```

### GraphQL Service
Connects to Chirality-Framework GraphQL service:
- Default endpoint: `http://localhost:8080/graphql`
- Used for complex graph queries
- Type-safe with generated TypeScript types

## Troubleshooting

### Debug Mode
Enable debug logging:
```bash
DEBUG=* npm run dev
```

### Check Service Health
```bash
# API health check
curl http://localhost:3000/api/healthz

# Neo4j connection test
curl -X POST http://localhost:3000/api/neo4j/query \
  -H "Content-Type: application/json" \
  -d '{"query_type": "ping"}'

# GraphQL service test
curl http://localhost:8080/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ __schema { types { name } } }"}'
```

### Common Environment Variables
```env
# Debugging
NODE_ENV=development
DEBUG=true

# Performance
NEXT_TELEMETRY_DISABLED=1  # Disable telemetry
ANALYZE=true               # Enable bundle analysis

# API Configuration
OPENAI_API_TIMEOUT=60000   # API timeout in ms
MAX_TOKENS=2000            # Max response tokens
```

## Performance Optimization

### React Optimizations
- Components use `React.memo` for expensive renders
- `useMemo` and `useCallback` prevent unnecessary recalculations
- Virtual scrolling for long chat histories

### Canvas Rendering
- Path2D caching for matrix nodes
- RequestAnimationFrame for smooth animations
- Offscreen canvas for complex calculations

### Network Optimization
- API route caching with React Query
- Debounced search inputs
- Lazy loading for heavy components

### Bundle Optimization
- Dynamic imports for code splitting
- Tree shaking enabled
- Turbopack for faster development builds (when stable)

## Deployment

### Vercel Deployment
```bash
vercel --prod
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm ci --only=production
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables for Production
- Set all `.env.local` variables in your deployment platform
- Ensure CORS is configured for production domains
- Use connection pooling for Neo4j in production

## Getting Help

### Resources
- [Main Repository](https://github.com/sgttomas/Chirality-chat)
- [Framework Repository](https://github.com/sgttomas/Chirality-Framework)
- [Neo4j Documentation](https://neo4j.com/docs/)
- [OpenAI API Reference](https://platform.openai.com/docs/)

### Reporting Issues
When reporting issues, include:
1. Error messages from console
2. Network tab screenshots
3. Environment configuration (redact sensitive data)
4. Steps to reproduce

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Submit a pull request

## Version History

### v1.0.0 (Current)
- Initial release with core chat functionality
- OpenAI Responses API integration
- Neo4j semantic matrix visualization
- MCP tool integration
- Full accessibility support
- PWA capabilities

---

🤖 Generated with [Claude Code](https://claude.ai/code)