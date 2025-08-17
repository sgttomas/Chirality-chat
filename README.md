# Chirality Core Chat

A streamlined chatbot interface with RAG (Retrieval-Augmented Generation) powered by the **Chirality Framework's innovative two-pass document generation system**.

## ✨ Key Features

- **🔄 Two-Pass Document Generation**: Sequential generation followed by cross-referential refinement with final resolution
- **📄 Document-Enhanced Chat**: Automatic context injection from generated DS/SP/X/M documents  
- **⚡ Real-time Streaming**: Server-sent events for responsive chat experience
- **💾 File-based State**: Simple, database-free persistence
- **🎯 Clean Architecture**: Minimal dependencies, focused functionality

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- OpenAI API key

### Installation & Setup

```bash
# Install dependencies
npm install

# Create environment file
cat > .env.local << EOF
OPENAI_API_KEY=sk-proj-your-api-key-here
OPENAI_MODEL=gpt-4.1-nano
EOF

# Start development server
npm run dev
```

Visit **http://localhost:3001** - you'll be redirected to the Chirality Core interface.

## 🎯 How It Works

### Two-Pass Document Generation

**Pass 1 - Sequential Generation:**
1. **DS** (Data Sheet) - Core data specifications
2. **SP** (Procedural Checklist) - Step-by-step procedures  
3. **X** (Solution Template) - Integrated solution approach
4. **M** (Guidance) - Strategic guidance and recommendations

**Pass 2 - Cross-Referential Refinement:**
1. **DS refined** using insights from SP, X, M
2. **SP refined** using new DS + original X, M  
3. **X refined** using new DS, new SP + original M
4. **M refined** using all new DS, SP, X

**Final Resolution:**
5. **X final update** using all refined documents

This creates a feedback loop where each document gets enriched by insights from all others, resulting in highly coherent and cross-referenced documentation.

### RAG-Enhanced Chat

After generating documents, they're automatically injected into chat context:
- Documents provide grounded context for AI responses
- Chat references generated content when answering questions
- Maintains conversation continuity across document sets

## 🎮 Usage

### Document Generation

1. **Navigate to `/chirality-core`**
2. **Enter your problem** (e.g., "how to weld carbon steel pipe to stainless steel pipe")
3. **Choose generation mode:**
   - **Single Pass** - Fast, sequential generation
   - **🔄 Two-Pass with Resolution** - Comprehensive with cross-referential refinement
4. **View results** in organized tabs with detailed logs

### Chat Interface

1. **Generate documents first** (for context)
2. **Chat normally** - AI automatically references your documents
3. **Ask follow-up questions** about the generated content
4. **Use commands:**
   - `set problem: [description]` - Define new problem context
   - `generate DS/SP/X/M` - Generate specific documents

## 🏗️ Architecture

```
/chirality-core              # Main document generation UI
/api/core/orchestrate       # Two-pass generation endpoint  
/api/core/run               # Single document generation
/api/chat/stream            # RAG-enhanced chat with SSE
/api/core/state             # Document state management
/chirality-core/*           # Core orchestration logic
```

### Core Technologies

- **Frontend**: Next.js 15.2.3, React 18, TypeScript
- **AI**: OpenAI Chat Completions API (gpt-4.1-nano)
- **Streaming**: Server-Sent Events for real-time responses
- **State**: File-based persistence, Zustand for UI state
- **Styling**: Tailwind CSS

## 📋 Document Types

| Type | Purpose | Key Fields |
|------|---------|------------|
| **DS** | Data Sheet | `data_field`, `type`, `units`, `source_refs` |
| **SP** | Procedural Checklist | `step`, `purpose`, `inputs`, `outputs`, `preconditions` |
| **X** | Solution Template | `heading`, `narrative`, `precedents`, `successors` |
| **M** | Guidance | `statement`, `justification`, `assumptions`, `residual_risk` |

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production  
- `npm run start` - Run production build
- `npm run lint` - Run linter
- `npm run type-check` - TypeScript validation

### Key Files

```
src/
├── app/
│   ├── chirality-core/           # Main UI
│   └── api/
│       ├── core/
│       │   ├── orchestrate/      # Two-pass generation
│       │   ├── run/              # Single document generation
│       │   └── state/            # State management
│       └── chat/stream/          # RAG chat endpoint
├── chirality-core/
│   ├── orchestrate.ts            # Document generation logic
│   ├── validators.ts             # Flexible validation
│   ├── state/store.ts            # File-based persistence
│   └── vendor/llm.ts             # OpenAI integration
└── components/chat/              # Chat UI components
```

## 🔍 API Reference

### Two-Pass Generation
```bash
POST /api/core/orchestrate
# Generates all documents with refinement
```

### Single Document
```bash
POST /api/core/run
Content-Type: application/json
{ "kind": "DS" | "SP" | "X" | "M" }
```

### RAG Chat
```bash
POST /api/chat/stream  
Content-Type: application/json
{ "message": "your question", "conversationId": "optional" }
```

### State Management
```bash
GET /api/core/state      # Get current state
POST /api/core/state     # Update state  
DELETE /api/core/state   # Clear all documents
```

## 🧪 Example Workflow

1. **Set Problem**: "Implement user authentication system"
2. **Generate Documents**: Choose two-pass generation
3. **Review Results**: 
   - DS: Data requirements, user models, security specifications
   - SP: Implementation steps, testing procedures, deployment checklist
   - X: Integrated authentication solution with error handling
   - M: Security guidance, best practices, risk considerations
4. **Chat**: "How should I handle password reset flows?" (AI references generated docs)

## 🎯 Use Cases

- **Technical Planning**: Software architecture, implementation strategies
- **Process Documentation**: Operational procedures, workflow design
- **Problem Solving**: Complex technical challenges requiring structured analysis
- **Knowledge Management**: Converting problems into reusable documentation
- **Decision Support**: Guidance generation for strategic choices

## 🤝 Contributing

This is a focused, streamlined implementation. When contributing:
- Keep dependencies minimal
- Maintain the RAG-first approach  
- Preserve clean separation between chat and document generation
- Test both single-pass and two-pass document flows
- Follow existing TypeScript patterns

## 📄 License

MIT

---

**Built on the Chirality Framework's semantic document architecture with innovative two-pass refinement for maximum document coherence.**