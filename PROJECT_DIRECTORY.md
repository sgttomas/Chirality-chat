# PROJECT_DIRECTORY.md
*Machine-readable project structure for Claude/LLM navigation*

## CORE_IMPLEMENTATION
```
src/
├── app/                        # Next.js App Router structure
│   ├── layout.tsx             # Root layout with providers
│   ├── page.tsx               # Home page with chat interface
│   ├── globals.css            # Global styles and Tailwind imports
│   ├── api/                   # API routes
│   │   ├── chat/
│   │   │   ├── stream/route.ts    # Streaming chat endpoint
│   │   │   ├── debug/route.ts     # Debug endpoint for testing
│   │   │   └── test/route.ts      # Test endpoint validation
│   │   ├── core/
│   │   │   ├── orchestrate/route.ts # CF14 orchestration endpoint
│   │   │   ├── run/route.ts        # Direct CF14 run endpoint
│   │   │   └── state/route.ts      # State management endpoint
│   │   ├── healthz/route.ts        # Health check endpoint
│   │   └── readyz/route.ts         # Readiness check endpoint
│   ├── chat-admin/
│   │   └── page.tsx                # Admin interface for chat debugging
│   └── chirality-core/
│       └── page.tsx                # CF14 core operations interface
├── chirality-core/             # CF14 Integration Layer
│   ├── orchestrate.ts          # Main orchestration logic
│   ├── contracts.ts            # Type definitions and interfaces
│   ├── validators.ts           # Input/output validation
│   ├── systemPrompt.ts         # System prompt templates
│   ├── userPrompt.ts           # User prompt builders
│   ├── compactor.ts            # Data compression utilities
│   ├── state/
│   │   └── store.ts            # Zustand state management
│   ├── export/
│   │   └── formatters.ts       # Data export formatting
│   ├── rag/
│   │   ├── chunk.ts            # Document chunking
│   │   ├── retrieve.ts         # Retrieval logic
│   │   └── vectorStore.ts      # Vector database integration
│   ├── util/                   # Utility functions
│   └── vendor/                 # Third-party integrations
├── components/                 # React Component Library
│   ├── chat/
│   │   ├── ChatWindow.tsx      # Main chat interface
│   │   ├── ChatInput.tsx       # Message input component
│   │   ├── Message.tsx         # Individual message display
│   │   ├── TypingIndicator.tsx # Typing animation
│   │   └── index.ts            # Chat components barrel export
│   ├── ui/
│   │   ├── Button.tsx          # Reusable button component
│   │   ├── Input.tsx           # Form input component
│   │   ├── Card.tsx            # Card container component
│   │   ├── Badge.tsx           # Badge/label component
│   │   ├── ErrorMessage.tsx    # Error display component
│   │   ├── ErrorBoundary.tsx   # Error boundary wrapper
│   │   ├── CellWarnings.tsx    # CF14 cell validation warnings
│   │   └── index.ts            # UI components barrel export
│   └── ErrorBoundary.tsx       # Top-level error boundary
├── hooks/                      # Custom React Hooks
│   └── useStream.ts            # Server-sent events streaming hook
├── lib/                        # Utility Libraries
│   ├── api.ts                  # API client configuration
│   └── prompt/                 # Prompt engineering utilities
│       ├── builders.ts         # Prompt construction helpers
│       ├── formatters.ts       # General formatting utilities
│       ├── formatters.table.ts # Table formatting for CF14
│       ├── system.ts           # System prompt management
│       ├── user.ts             # User prompt management
│       ├── temperatures.ts     # LLM temperature settings
│       ├── validators.ts       # Prompt validation
│       ├── llmContracts.ts     # LLM interface contracts
│       └── index.ts            # Prompt utilities barrel export
└── types/
    └── global.d.ts             # Global TypeScript type definitions
```

## ACTIVE_DOCUMENTATION
```
README.md                      # Project overview and setup instructions
GETTING_STARTED.md             # Detailed setup and first steps guide
ONBOARDING.md                  # Complete user onboarding experience
HELP.md                        # Common questions and troubleshooting
CLAUDE.md                      # LLM role guidance and collaboration patterns
INTEGRATION_ARCHITECTURE.md    # System design and technical implementation
GRAPHQL_NEO4J_INTEGRATION_PLAN.md # GraphQL and Neo4j integration strategy
NEO4J_SEMANTIC_INTEGRATION.md  # Semantic graph integration details
MVP_IMPLEMENTATION_PLAN.md     # Development roadmap and feature planning
```

## PROJECT_MANAGEMENT
```
CURRENT_STATUS.md              # Running development timeline updates
VERSION.md                     # Version tracking and release notes
CHANGELOG.md                   # Standard format change tracking
KEY_DECISIONS.md               # Major architectural choices and rationale
ROADMAP.md                     # Future development plans and research directions
KEY_PROJECT_FILES.md           # Essential file reference guide with status tracking
```

## FRONTEND_DOCUMENTATION
```
docs/
├── FRONTEND_DOCUMENTATION_INDEX.md # Complete frontend documentation guide
├── UI_DESIGN_SYSTEM.md             # Design system and component guidelines
├── components/
│   ├── README.md                   # Component library overview
│   ├── atoms/
│   │   └── Button.md               # Button component documentation
│   └── organisms/
│       └── ChatWindow.md           # ChatWindow component documentation
└── adr/                            # Architecture Decision Records
    └── frontend/
        ├── 008-react-app-router.md      # Next.js App Router adoption
        ├── 009-zustand-state-management.md # State management choice
        ├── 010-tailwind-design-system.md   # Design system approach
        ├── 011-sse-streaming-pattern.md    # Real-time streaming implementation
        └── 012-component-composition.md    # Component architecture patterns
```

## CONFIGURATION
```
package.json                   # Node.js dependencies and npm scripts
next.config.js                # Next.js configuration and build settings
tsconfig.json                 # TypeScript compiler configuration
tailwind.config.js            # Tailwind CSS configuration and theming
postcss.config.js             # PostCSS processing configuration
.env.example                  # Environment variable template
requirements.txt              # Python dependencies for CF14 integration
```

## TESTING_AND_SCRIPTS
```
scripts/
├── README.md                  # Script documentation and usage
├── test-orchestration.ts     # CF14 integration testing
├── test-orchestration-enhanced.ts # Enhanced integration testing
├── smoke-rest.mjs            # API smoke testing
├── validate-env.js           # Environment validation
└── update-docs-index.js      # Documentation index maintenance
```

## BUILD_AND_DEPLOYMENT
```
public/                       # Static assets and PWA files
├── favicon.ico              # Site favicon
├── manifest.json            # PWA manifest
├── offline.html             # Offline fallback page
└── sw.js                    # Service worker for PWA
pages/api/                   # Legacy API routes (if any)
store/state.json             # Persistent state storage
dev.log                      # Development log file
```

## PROCESS_DOCUMENTS
```
CONTINUOUS_IMPROVEMENT_PLAN.md # Systematic documentation quality maintenance
CONSOLIDATED_IMPROVEMENT_PLAN.md # Strategic improvement roadmap
COMMIT_HOOKS.md               # Git workflow integration
AGENTS.md                     # AI agent workflows for documentation maintenance
```

## DEVELOPMENT_HISTORY
```
devhistory/                    # Historical documents and planning archives
└── (empty - documents restored to active)
```

## CHAT_INTERFACE_QUICK_REF
- **ChatWindow**: Main conversational interface with message history
- **ChatInput**: User input with streaming support and validation
- **Message**: Individual message rendering with markdown support
- **TypingIndicator**: Real-time typing feedback during LLM responses
- **useStream**: SSE hook for real-time streaming responses

## CF14_INTEGRATION_PATTERNS
- **orchestrate.ts**: Main bridge between chat interface and CF14 semantic operations
- **contracts.ts**: Type-safe interfaces for CF14 matrix operations
- **validators.ts**: Input validation for semantic matrices and operations
- **state/store.ts**: Zustand store managing CF14 operation state and history
- **export/formatters.ts**: Document generation from CF14 semantic outputs

## API_ENDPOINTS
- **/api/chat/stream**: Server-sent events for real-time chat responses
- **/api/core/orchestrate**: CF14 semantic operation orchestration
- **/api/core/run**: Direct CF14 pipeline execution
- **/api/core/state**: State management for semantic operations
- **/api/healthz**: Health check for monitoring
- **/api/readyz**: Readiness check for deployment

## COMPONENT_ARCHITECTURE
- **Atomic Design**: Components organized by atoms, molecules, organisms
- **Barrel Exports**: Clean imports through index.ts files
- **Error Boundaries**: Robust error handling throughout component tree
- **Streaming Support**: Real-time updates through SSE integration
- **Type Safety**: Full TypeScript coverage with strict configuration

## STATE_MANAGEMENT
- **Zustand**: Lightweight state management for CF14 operations
- **React Context**: Global providers for theme and configuration
- **Local State**: Component-level state for UI interactions
- **Persistent Storage**: Store state across browser sessions

## INTEGRATION_POINTS
- **CF14 Semantic Framework**: Core reasoning engine integration
- **OpenAI API**: LLM integration for semantic interpolation
- **Neo4j Database**: Graph persistence for reasoning traces
- **GraphQL**: Planned API layer for semantic operations

## STATUS_CURRENT
- ✅ Next.js App Router with TypeScript and Tailwind CSS
- ✅ Real-time chat interface with streaming responses
- ✅ CF14 integration layer with semantic operations
- ✅ Component library with design system
- 🔄 Documentation standardization and continuous improvement
- 📋 Neo4j integration for reasoning trace persistence
- 📋 Advanced semantic operation workflows

## NEXT_PRIORITY
Apply systematic documentation improvement methodology to achieve consistency with chirality-semantic-framework standards.