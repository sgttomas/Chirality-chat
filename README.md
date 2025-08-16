# Chirality AI App - Document Generation Interface

A modern, graph-free chat interface for the Chirality Framework, providing conversational AI access to semantic document generation and knowledge management through real-time streaming responses.

> **⚡ Complete Development Environment**: For full multi-service setup including backend services and desktop app, see **[Chirality AI - Complete Developer Setup Guide](https://github.com/[org]/chirality-ai#-complete-developer-setup-guide)**.

## 🚀 What's New

This application has been recently updated with:
- **Graph-free Chirality Core**: Complete independence from GraphQL/Neo4j with in-memory RAG
- **OpenAI Responses API**: Full migration from Chat Completions API for improved streaming
- **4-Document Workflow**: DS (Data Template) → SP (Procedural Checklist) → X (Solution Template) → M (Guidance)
- **Admin Dashboard**: Full transparency into chat LLM system prompts and document injection at `/chat-admin`
- **Fixed SSE Streaming**: Robust Server-Sent Events implementation with proper error handling
- **Document RAG Chat**: True retrieval-augmented generation injecting generated documents into chat context

## 🏗️ Architecture

### Split-Apps Architecture
- **This Repository**: Document generation UI with graph-free Chirality Core
- **[Chirality-Framework](https://github.com/sgttomas/Chirality-Framework)**: Backend semantic engine & GraphQL service
- **[Chirality-AI](https://github.com/[org]/chirality-ai)**: Production orchestration & desktop packaging

## 🏃‍♂️ Standalone Development (This Repository Only)

```bash
npm install
npm run dev  # Starts on http://localhost:3000
```

**Key URLs:**
- **Main Interface**: http://localhost:3000
- **Chirality Core**: http://localhost:3000/chirality-core ⭐ (document generation)
- **Admin Dashboard**: http://localhost:3000/chat-admin
- **Health Check**: http://localhost:3000/api/healthz

**Requirements:**
- Node.js 20.x
- OpenAI API key in `.env.local`
- Optional: GraphQL service on port 8080 (for advanced features)

### Core Technologies
- **Frontend**: Next.js 15.2.3, React 18, TypeScript
- **Streaming**: OpenAI Responses API with Server-Sent Events
- **State**: Zustand for UI state, React Query for server state, file-based document storage
- **Styling**: Tailwind CSS with custom accessibility-compliant components
- **AI**: OpenAI gpt-4.1-nano model exclusively

## 🎯 Key Features

### 🤖 Chirality Document Generation
- **Set Problem**: Define problem statements with initial analysis vectors
- **Generate DS**: Data Template with structured field definitions
- **Generate SP**: Procedural Checklist with step-by-step workflows  
- **Generate X**: Solution Template with narrative solutions
- **Generate M**: Guidance documents with justifications
- **Clear All**: Reset all documents and problem state

### 💬 RAG-Enhanced Chat
- **Document Injection**: All generated documents automatically injected into chat system prompt
- **Citation Support**: References to generated documents with ID tracking
- **Streaming Responses**: Real-time response streaming with robust SSE implementation
- **Command Support**: Natural language commands for document generation

### 🔧 Developer Tools
- **Admin Dashboard** (`/chat-admin`): Full visibility into system prompts and document injection
- **Debug Endpoints**: Testing and validation endpoints for chat configuration
- **Health Checks**: Service availability monitoring
- **Error Boundaries**: Graceful error handling throughout the application

### 🎨 User Experience
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Accessibility**: WCAG 2.1 AA compliance with keyboard navigation
- **Real-time Updates**: Auto-refreshing admin dashboard with metrics
- **Performance**: React memoization, optimized rendering, efficient state management

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- OpenAI API key
- (Optional) Neo4j database for advanced GraphQL operations

### Installation

1. **Clone and install:**
```bash
git clone https://github.com/sgttomas/Chirality-chat.git
cd Chirality-chat
npm install
```

2. **Configure environment:**
Create `.env.local`:
```env
# Required: OpenAI Configuration
OPENAI_API_KEY=sk-proj-your-openai-api-key
OPENAI_MODEL=gpt-4.1-nano
DEFAULT_TEMPERATURE=0.6
MAX_OUTPUT_TOKENS=800

# Optional: Neo4j (for advanced GraphQL operations)
NEO4J_URI=neo4j+s://your-instance.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=your-password

# Optional: Framework integration
GRAPHQL_ENDPOINT=http://localhost:8080/graphql
```

3. **Start the application:**
```bash
npm run dev  # Starts on http://localhost:3000
```

## 📖 Usage Guide

### Basic Workflow

1. **Navigate to Chirality Core** (`/chirality-core`)
2. **Set a problem**: Click "Set Test Problem" or use chat command `"set problem: [description]"`
3. **Generate documents** in sequence:
   - `"generate DS"` - Creates data template
   - `"generate SP"` - Creates procedural checklist  
   - `"generate X"` - Creates solution template
   - `"generate M"` - Creates guidance document
4. **Use RAG Chat** (`/`) - Generated documents are automatically injected into chat context
5. **Monitor system** (`/chat-admin`) - View full transparency into document injection

### Chat Commands

The chat interface supports natural language commands:
- `"set problem: [your problem description]"` - Define the problem to work on
- `"generate DS"` - Generate Data Template document
- `"generate SP"` - Generate Procedural Checklist document
- `"generate X"` - Generate Solution Template document
- `"generate M"` - Generate Guidance document

### Admin Dashboard Features

Visit `/chat-admin` for complete transparency:
- **Document Status**: Real-time view of generated documents
- **System Instructions**: Full system prompt sent to OpenAI
- **Compacted Documents**: Optimized document content as injected
- **Raw Documents**: Full document data structures
- **Auto-refresh**: 2-second polling for live updates
- **Test Endpoints**: Direct testing of chat configuration

## 🏃‍♂️ Performance & Optimization

### Streaming Implementation
- **Robust SSE**: Fixed connection handling with proper error recovery
- **Content Accumulation**: Prevents message loss during streaming
- **Delta Processing**: Efficient incremental content updates

### Document Management
- **File-based Storage**: Persistent state without database dependencies
- **Compact Serialization**: Optimized document representation for AI context
- **JSON Parsing**: Robust handling of malformed LLM responses with fallbacks

### Frontend Optimizations
- **React Memoization**: Optimized component re-rendering
- **State Management**: Efficient Zustand store with minimal re-renders
- **Error Boundaries**: Graceful degradation on component failures

## 🛠️ Development

### Project Structure
```
src/
├── app/                          # Next.js App Router
│   ├── api/chat/                # Chat endpoints
│   │   ├── stream/              # Main streaming endpoint
│   │   ├── debug/               # Debug information
│   │   └── test/                # Testing endpoint
│   ├── api/core/                # Chirality Core API
│   │   └── state/               # Document state management
│   ├── chat-admin/              # Admin dashboard
│   ├── chirality-core/          # Core document generation
│   └── page.tsx                 # Main chat interface
├── chirality-core/              # Graph-free Chirality implementation
│   ├── state/                   # File-based state storage
│   ├── vendor/                  # LLM integration (Responses API)
│   ├── orchestrate.ts           # Document generation logic
│   └── compactor.ts             # Document optimization
├── components/                  # React components
│   ├── chat/                    # Chat interface
│   ├── ui/                      # Reusable components
│   └── mcp/                     # MCP integration
├── hooks/                       # Custom React hooks
└── lib/                         # Utilities and services
```

### Key Files

- **`/src/app/api/chat/stream/route.ts`**: Main chat endpoint with RAG document injection
- **`/src/chirality-core/orchestrate.ts`**: Document generation with LLM integration
- **`/src/chirality-core/vendor/llm.ts`**: OpenAI Responses API wrapper
- **`/src/app/chat-admin/page.tsx`**: Admin dashboard for system transparency
- **`/src/chirality-core/state/store.ts`**: File-based state persistence

### Testing

```bash
# Health checks
curl http://localhost:3000/api/healthz

# Chat debug info
curl http://localhost:3000/api/chat/debug

# Test document injection
curl -X POST http://localhost:3000/api/chat/test \
  -H "Content-Type: application/json" \
  -d '{"testMessage": "What documents are available?"}'
```

### Building for Production

```bash
npm run build    # Production build
npm start        # Start production server
```

## 🔧 Troubleshooting

### Common Issues

**SSE Connection Errors**: Ensure OpenAI API key is valid and has credits
**Document Generation Fails**: Check OpenAI model permissions for gpt-4.1-nano
**Port Conflicts**: Use `lsof -i :3000` to find conflicting processes
**Turbopack Issues**: Disable with `TURBOPACK=0 npm run dev`

### Debug Mode
```bash
DEBUG=* npm run dev  # Enable verbose logging
```

### Environment Variables
```env
# Debugging
NODE_ENV=development
DEBUG=true
NEXT_TELEMETRY_DISABLED=1

# Performance tuning
OPENAI_API_TIMEOUT=60000
MAX_TOKENS=2000
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make changes with proper TypeScript typing
4. Test with admin dashboard for verification
5. Submit a pull request

### Code Style
- TypeScript strict mode enabled
- Prefer named exports over default exports
- Use barrel imports from index files
- Follow React best practices with hooks

## 📜 License

MIT License - see LICENSE file for details.

## 🔗 Related Projects

- **[Chirality-Framework](https://github.com/sgttomas/Chirality-Framework)**: Backend GraphQL service and Python CLI
- **[Neo4j](https://neo4j.com/)**: Graph database for semantic relationships
- **[OpenAI](https://openai.com/)**: AI model provider for document generation

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/sgttomas/Chirality-chat/issues)
- **Documentation**: See `HELP.md` for detailed troubleshooting
- **Framework Docs**: [Chirality Framework](https://github.com/sgttomas/Chirality-Framework)

---

🤖 **Last Updated**: This README reflects the current state with graph-free Chirality Core, fixed SSE streaming, OpenAI Responses API integration, and comprehensive admin dashboard for full system transparency.