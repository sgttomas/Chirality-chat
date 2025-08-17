# Chirality Core Chat

A streamlined chatbot interface with RAG (Retrieval-Augmented Generation) powered by the Chirality Framework's document system.

## Features

- **Document-Enhanced Chat**: Automatic context injection from generated DS/SP/X/M documents
- **Real-time Streaming**: Server-sent events for responsive chat experience  
- **Document Generation**: Create semantic documents through chat commands
- **File-based State**: Simple, database-free persistence
- **Clean Architecture**: Minimal dependencies, focused functionality

## Quick Start

### Prerequisites
- Node.js 18+
- OpenAI API key

### Installation

```bash
npm install
```

### Configuration

Create `.env.local`:
```env
OPENAI_API_KEY=sk-proj-your-api-key
OPENAI_MODEL=gpt-4o-mini  # or your preferred model
```

### Run

```bash
npm run dev
```

Visit http://localhost:3000 - you'll be redirected to the Chirality Core interface.

## Usage

### Chat Commands

The chatbot responds to these special commands:

- `set problem: [description]` - Define the problem context
- `generate DS` - Generate Data Sheet document
- `generate SP` - Generate Procedural Checklist
- `generate X` - Generate Solution Template
- `generate M` - Generate Guidance document

### Document Workflow

1. **Set a Problem**: Start by defining what you're working on
2. **Generate Documents**: Create DS→SP→X→M in sequence
3. **Chat with Context**: Documents are automatically injected into chat context
4. **RAG-Enhanced Responses**: The AI references your documents when answering

## Architecture

```
/chirality-core         # Main UI page
/api/chat/stream       # SSE chat endpoint with RAG
/api/core/run          # Document generation
/api/core/state        # State management
/chirality-core/*      # Core orchestration logic
```

### Key Components

- **Streaming Chat**: OpenAI API integration with SSE
- **Document Orchestration**: Two-pass LLM generation (draft → final)
- **State Management**: File-based persistence in temp directory
- **Context Injection**: Automatic document embedding in chat prompts

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Run production build
- `npm run lint` - Run linter
- `npm run type-check` - TypeScript validation

### Project Structure

```
src/
├── app/
│   ├── chirality-core/    # Main UI
│   └── api/
│       ├── chat/          # Chat endpoints
│       └── core/          # Document endpoints
├── chirality-core/        # Core logic
│   ├── orchestrate.ts     # Document generation
│   ├── state/            # State management
│   └── vendor/           # OpenAI integration
└── components/
    └── chat/             # Chat UI components
```

## API Endpoints

### POST /api/chat/stream
Stream chat responses with document context

```typescript
{
  message: string
  conversationId?: string
}
```

### POST /api/core/run
Generate a specific document

```typescript
{
  kind: 'DS' | 'SP' | 'X' | 'M'
}
```

### GET/POST/DELETE /api/core/state
Manage document state

## Contributing

This is a simplified, focused implementation. When contributing:
- Keep dependencies minimal
- Maintain the RAG-first approach
- Preserve the clean separation between chat and document generation
- Test document generation and chat flows

## License

MIT

---

Built on the Chirality Framework's semantic document architecture.