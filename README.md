# Chirality AI App

Next.js chat interface with document generation capabilities powered by the Chirality Framework's two-pass semantic document system.

## What This App Does

- **Two-Pass Document Generation**: Creates coherent DS/SP/X/M documents through sequential generation and cross-referential refinement
- **RAG-Enhanced Chat**: Chat interface with automatic context injection from generated documents
- **CF14 Semantic Enhancement**: Neo4j integration with CF14 semantic matrix context for enhanced document generation
- **Real-time Streaming**: Server-sent events for responsive interactions
- **File-based Persistence**: Simple state management without database dependencies
- **Clean Architecture**: Focused implementation with minimal dependencies

### Quick Links
- **[Getting Started](GETTING_STARTED.md)** - Complete setup and first steps
- **[Help & Troubleshooting](HELP.md)** - Common issues and solutions
- **[Integration Architecture](INTEGRATION_ARCHITECTURE.md)** - System design and technical details
- **[Key Project Files](KEY_PROJECT_FILES.md)** - Complete documentation guide

## Installation

### Prerequisites
- Node.js 18+
- OpenAI API key
- Neo4j 5+ (optional, for graph features)

### Quick Setup
```bash
# Clone and install
npm install

# Environment setup
cp .env.example .env.local
# Edit .env.local with your OpenAI API key and optional graph settings

# Start development server
npm run dev
```

**Visit**: http://localhost:3001 (or 3000 if available)

**First Steps**: See [GETTING_STARTED.md](GETTING_STARTED.md) for complete setup guidance.

## How It Works

### Document Generation System
The app generates four types of structured documents through a two-pass process:

**Document Types:**
- **DS** (Data Sheet) - Core data specifications and requirements
- **SP** (Procedural Checklist) - Step-by-step implementation procedures  
- **X** (Solution Template) - Integrated solution framework
- **M** (Guidance) - Strategic recommendations and risk considerations

**Two-Pass Process:**
1. **Pass 1**: Sequential generation of all four documents
2. **Pass 2**: Cross-referential refinement using insights from other documents
3. **Final Resolution**: X document updated with all refined content

### Chat Interface with Document Context
- Generated documents automatically enhance chat responses
- Ask questions about your specific problem domain
- AI references generated content for grounded answers
- Maintains conversation continuity across document sessions

## Usage

### Generate Documents
1. Navigate to `/chirality-core`
2. Enter your problem (e.g., "implement user authentication system")
3. Choose generation mode:
   - **Single Pass** - Fast sequential generation
   - **Two-Pass with Resolution** - Comprehensive cross-referential refinement
4. Review generated documents in organized tabs

### Use Chat Interface
1. Generate documents first (provides context)
2. Chat normally - AI automatically references your documents
3. Ask follow-up questions about generated content
4. Use commands:
   - `set problem: [description]` - Define new problem context
   - `generate DS/SP/X/M` - Generate specific document types

## Project Structure

```
src/
├── app/
│   ├── chirality-core/           # Document generation UI
│   ├── chat-admin/               # Admin dashboard
│   └── api/
│       ├── core/                 # Document generation endpoints
│       └── chat/stream/          # RAG chat with SSE
├── chirality-core/               # Core orchestration logic
├── components/chat/              # Chat UI components
└── lib/                          # Utilities and API clients
```

### Technology Stack

- **Frontend**: Next.js 15.2.3, React 18, TypeScript
- **AI**: OpenAI Chat Completions API (gpt-4.1-nano)
- **Streaming**: Server-Sent Events for real-time responses
- **State**: File-based persistence with Zustand for UI state
- **Styling**: Tailwind CSS
- **Graph**: Neo4j 5+ with GraphQL API (optional)

## API Endpoints

### Document Generation
```bash
# Two-pass generation with refinement
POST /api/core/orchestrate

# Single document generation
POST /api/core/run
{ "kind": "DS" | "SP" | "X" | "M" }

# State management
GET /api/core/state      # Get current state
POST /api/core/state     # Update state  
DELETE /api/core/state   # Clear all documents
```

### Chat Interface
```bash
# RAG-enhanced streaming chat
POST /api/chat/stream  
{ "message": "your question", "conversationId": "optional" }

# Debug and monitoring
GET /api/chat/debug     # System status

# Graph API (optional)
POST /api/v1/graph/graphql  # GraphQL queries for document relationships
GET /api/v1/graph/health    # Graph system health check
```

## Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production  
- `npm run start` - Run production build
- `npm run lint` - Run linter
- `npm run type-check` - TypeScript validation

### Key Implementation Files
- `/src/app/api/core/orchestrate/route.ts` - Two-pass document generation
- `/src/app/api/chat/stream/route.ts` - RAG chat with document injection
- `/src/chirality-core/orchestrate.ts` - Core document generation logic
- `/src/chirality-core/state/store.ts` - File-based state persistence
- `/src/components/chat/ChatWindow.tsx` - Main chat interface

## Example Usage

1. **Set Problem**: "Implement user authentication system"
2. **Generate Documents**: Choose two-pass generation mode
3. **Review Generated Documents**: 
   - **DS**: Data requirements, user models, security specifications
   - **SP**: Implementation steps, testing procedures, deployment checklist
   - **X**: Integrated authentication solution with error handling
   - **M**: Security guidance, best practices, risk considerations
4. **Enhanced Chat**: "How should I handle password reset flows?" 
   - AI references your generated documents for grounded responses

## Graph Integration (Optional)

The application includes optional graph capabilities that enhance document discoverability while maintaining files as the source of truth.

### Graph Features
- **Metadata Mirror**: Neo4j mirrors selected high-value document components for discovery
- **Relationship Analysis**: Tracks cross-references and document lineage
- **GraphQL API**: Read-only queries for document relationships and component search
- **Component Selection**: Algorithm-driven selection of valuable sections based on cross-references and keywords

### Graph Setup
```bash
# Optional Neo4j configuration
FEATURE_GRAPH_ENABLED=true
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your-password
GRAPHQL_BEARER_TOKEN=your-secure-token
```

### Example GraphQL Query
```graphql
query GetDocument($id: ID!) {
  document(where: { id: $id }) {
    title
    kind
    components {
      title
      anchor
      score
    }
    references {
      title
      kind
    }
  }
}
```

## Use Cases

- **Technical Planning** - Software architecture and implementation strategies
- **Process Documentation** - Operational procedures and workflow design  
- **Problem Solving** - Complex technical challenges requiring structured analysis
- **Knowledge Management** - Converting problems into reusable documentation
- **Decision Support** - Strategic guidance generation
- **Document Discovery** - Graph-enhanced search and relationship exploration (with Neo4j)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

Key principles:
- Maintain clean separation between chat and document generation
- Test both single-pass and two-pass document flows
- Follow existing TypeScript and React patterns
- Keep dependencies minimal

## License

MIT

---

**For complete documentation see [KEY_PROJECT_FILES.md](KEY_PROJECT_FILES.md)**