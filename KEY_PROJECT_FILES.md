# Key Project Files

Essential files for understanding, using, and contributing to the Chirality AI App.

## 📊 Continuous Improvement Status

**Status Legend:**
- ✅ **CURRENT** - Document meets current standards and requirements
- 🆕 **UPDATED** - Recently improved and meets enhanced standards
- 🔄 **NEEDS_UPDATE** - Scheduled for improvement in specified phase
- ⏸️ **ON_HOLD** - Development temporarily suspended
- 📋 **PLANNED** - Future enhancement identified

**Improvement Phases:**
- **Phase 1** 🔄 Technical accuracy and implementation status (IN_PROGRESS)
- **Phase 2** 📋 User experience and clarity improvements (PLANNED)
- **Phase 3** 📋 Cross-document consistency (PLANNED)
- **Phase 4** 📋 Evidence strengthening and validation (PLANNED)

**Continuous Improvement**: All documents now tracked via [CONTINUOUS_IMPROVEMENT_PLAN.md](CONTINUOUS_IMPROVEMENT_PLAN.md)

**Status Last Updated**: August 17, 2025
**Note**: Always ask user for current date/time when updating status - AI doesn't have real-time access

## 🚀 Getting Started

### For Users
- **[README.md](README.md)** - Project overview and basic setup | 🆕 **UPDATED** (Aug 17 - CF14 integration)
- **[GETTING_STARTED.md](GETTING_STARTED.md)** - Detailed setup and first steps | 🔄 **NEEDS_UPDATE** (Phase 1)
- **[ONBOARDING.md](ONBOARDING.md)** - Complete user onboarding experience | 🔄 **NEEDS_UPDATE** (Phase 1)
- **[HELP.md](HELP.md)** - Common questions and troubleshooting | 🔄 **NEEDS_UPDATE** (Phase 1)
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Comprehensive problem-solving guide | ✅ **CURRENT** (Created Aug 17)

### For Developers  
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System design and technical implementation | ✅ **CURRENT** (Created Aug 17)
- **[API.md](API.md)** - Complete API documentation and usage examples | ✅ **CURRENT** (Created Aug 17)
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Development guidelines and contribution process | ✅ **CURRENT** (Created Aug 17)
- **[INTEGRATION_ARCHITECTURE.md](INTEGRATION_ARCHITECTURE.md)** - System design and technical implementation | 🔄 **NEEDS_UPDATE** (Phase 1)
- **[MVP_IMPLEMENTATION_PLAN.md](MVP_IMPLEMENTATION_PLAN.md)** - Development roadmap and features | 🔄 **NEEDS_UPDATE** (Phase 1)
- **[src/README.md](src/README.md)** - Source code organization | 🔄 **NEEDS_UPDATE** (Phase 1)
- **[docs/FRONTEND_DOCUMENTATION_INDEX.md](docs/FRONTEND_DOCUMENTATION_INDEX.md)** - Complete frontend documentation guide | ✅ **CURRENT**

## 📋 Project Status & Planning

### Current State
- **[CURRENT_STATUS.md](CURRENT_STATUS.md)** - Running development timeline and active experiments | ✅ **CURRENT** (Created Aug 17)
- **[VERSION.md](VERSION.md)** - Version tracking and release notes | ✅ **CURRENT** (Created Aug 17)
- **[CHANGELOG.md](CHANGELOG.md)** - Detailed change history | ✅ **CURRENT** (Created Aug 17)

### Decision Making
- **[KEY_DECISIONS.md](KEY_DECISIONS.md)** - Major architectural choices | ✅ **CURRENT** (Created Aug 17)

### Future Planning
- **[ROADMAP.md](ROADMAP.md)** - Development plans and research directions | ✅ **CURRENT** (Created Aug 17)

## 🔧 Core Implementation

### Frontend Application
- **[src/app/README.md](src/app/README.md)** - Next.js App Router structure
- **[src/components/README.md](src/components/README.md)** - React component library
- **[src/hooks/README.md](src/hooks/README.md)** - Custom React hooks
- **[src/lib/](src/lib/)** - Utility libraries and API clients

### Core Engine Integration
- **[src/chirality-core/README.md](src/chirality-core/README.md)** - CF14 integration layer
- **[src/chirality-core/orchestrate.ts](src/chirality-core/orchestrate.ts)** - Semantic operations orchestration
- **[src/chirality-core/state/store.ts](src/chirality-core/state/store.ts)** - State management for semantic operations

### API Layer
- **[src/app/api/](src/app/api/)** - Next.js API routes
- **[src/app/api/chat/stream/route.ts](src/app/api/chat/stream/route.ts)** - Streaming chat endpoint
- **[src/app/api/core/orchestrate/route.ts](src/app/api/core/orchestrate/route.ts)** - CF14 orchestration endpoint
- **[src/app/api/v1/graph/graphql/route.ts](src/app/api/v1/graph/graphql/route.ts)** - CF14 GraphQL API with semantic matrix queries | 🆕 **UPDATED** (Aug 17 - CF14 types)

### CF14 Integration Layer
- **[src/app/chirality-graph/page.tsx](src/app/chirality-graph/page.tsx)** - CF14-enhanced document generation UI | ✅ **CURRENT** (Created Aug 17)
- **[scripts/link-cf-to-components.ts](scripts/link-cf-to-components.ts)** - CF14 semantic alignment linker | ✅ **CURRENT** (Created Aug 17)
- **[scripts/cf14-indexes.cypher](scripts/cf14-indexes.cypher)** - Neo4j constraints for CF14 data | ✅ **CURRENT** (Created Aug 17)
- **[scripts/bootstrap-cf14-to-neo4j.sh](scripts/bootstrap-cf14-to-neo4j.sh)** - CF14 integration setup script | ✅ **CURRENT** (Created Aug 17)
- **[types/graphql-depth-limit.d.ts](types/graphql-depth-limit.d.ts)** - TypeScript declarations for GraphQL validation | ✅ **CURRENT** (Created Aug 17)
- **[types/graphql-validation-complexity.d.ts](types/graphql-validation-complexity.d.ts)** - TypeScript declarations for complexity validation | ✅ **CURRENT** (Created Aug 17)

### Configuration
- **[package.json](package.json)** - Node.js dependencies and scripts
- **[next.config.js](next.config.js)** - Next.js configuration
- **[tsconfig.json](tsconfig.json)** - TypeScript configuration
- **[tailwind.config.js](tailwind.config.js)** - Tailwind CSS configuration

## 🎯 Specialized Documentation

### Frontend Documentation
- **[docs/FRONTEND_DOCUMENTATION_INDEX.md](docs/FRONTEND_DOCUMENTATION_INDEX.md)** - Complete frontend documentation guide | ✅ **CURRENT**
- **[docs/UI_DESIGN_SYSTEM.md](docs/UI_DESIGN_SYSTEM.md)** - Design system and component guidelines | ✅ **CURRENT**
- **[docs/components/README.md](docs/components/README.md)** - Component library documentation | ✅ **CURRENT**

### Architecture Decision Records
- **[docs/adr/frontend/](docs/adr/frontend/)** - Frontend architectural decisions | ✅ **CURRENT**
  - **[008-react-app-router.md](docs/adr/frontend/008-react-app-router.md)** - Next.js App Router adoption
  - **[009-zustand-state-management.md](docs/adr/frontend/009-zustand-state-management.md)** - State management choice
  - **[010-tailwind-design-system.md](docs/adr/frontend/010-tailwind-design-system.md)** - Design system approach
  - **[011-sse-streaming-pattern.md](docs/adr/frontend/011-sse-streaming-pattern.md)** - Real-time streaming implementation
  - **[012-component-composition.md](docs/adr/frontend/012-component-composition.md)** - Component architecture patterns

### Integration Documentation
- **[GRAPHQL_NEO4J_INTEGRATION_PLAN.md](GRAPHQL_NEO4J_INTEGRATION_PLAN.md)** - GraphQL and Neo4j integration strategy | 🔄 **NEEDS_UPDATE** (Phase 1)
- **[NEO4J_SEMANTIC_INTEGRATION.md](NEO4J_SEMANTIC_INTEGRATION.md)** - Semantic graph integration details | 🔄 **NEEDS_UPDATE** (Phase 1)

### Historical Context
- **[devhistory/](devhistory/)** - Development history and planning documents | ⏸️ **ON_HOLD**

### Process Documents
- **[CONTINUOUS_IMPROVEMENT_PLAN.md](CONTINUOUS_IMPROVEMENT_PLAN.md)** - Systematic documentation quality maintenance | ✅ **CURRENT** (Created Aug 17)
- **[CONSOLIDATED_IMPROVEMENT_PLAN.md](CONSOLIDATED_IMPROVEMENT_PLAN.md)** - Strategic improvement roadmap | 📋 **PLANNED** (Create)
- **[COMMIT_HOOKS.md](COMMIT_HOOKS.md)** - Git workflow integration for documentation review cycles | 📋 **PLANNED** (Create)
- **[AGENTS.md](AGENTS.md)** - AI agent workflows for automated documentation maintenance | 📋 **PLANNED** (Create)

### For AI Integration
- **[CLAUDE.md](CLAUDE.md)** - LLM role guidance and collaboration patterns | 🆕 **UPDATED** (Aug 17 - CF14 integration)
- **[PROJECT_DIRECTORY.md](PROJECT_DIRECTORY.md)** - Machine-readable project structure | 📋 **PLANNED** (Create)

## 🧪 Testing & Scripts

### Test Scripts
- **[scripts/README.md](scripts/README.md)** - Script documentation and usage | ✅ **CURRENT**
- **[scripts/test-orchestration.ts](scripts/test-orchestration.ts)** - CF14 integration testing
- **[scripts/test-orchestration-enhanced.ts](scripts/test-orchestration-enhanced.ts)** - Enhanced integration testing
- **[scripts/smoke-rest.mjs](scripts/smoke-rest.mjs)** - API smoke testing

### Validation Scripts
- **[scripts/validate-env.js](scripts/validate-env.js)** - Environment validation
- **[scripts/update-docs-index.js](scripts/update-docs-index.js)** - Documentation index maintenance

## 📝 Configuration Templates

### Environment Setup
- **[.env.example](.env.example)** - Environment variable template | 📋 **PLANNED** (Create)
- **[requirements.txt](requirements.txt)** - Python dependencies for CF14 integration | ✅ **CURRENT**

### Legal & Licensing
- **[LICENSE](LICENSE)** - MIT License terms | ✅ **CURRENT**

## 🔍 Quick Navigation by Use Case

### "I want to understand what this app does"
1. [README.md](README.md) - Overview
2. [GETTING_STARTED.md](GETTING_STARTED.md) - Quick start
3. [ONBOARDING.md](ONBOARDING.md) - Complete walkthrough

### "I want to use the chat interface"
1. [GETTING_STARTED.md](GETTING_STARTED.md) - Setup instructions
2. [HELP.md](HELP.md) - Usage guidance
3. [docs/UI_DESIGN_SYSTEM.md](docs/UI_DESIGN_SYSTEM.md) - Interface overview

### "I want to contribute to development"
1. [INTEGRATION_ARCHITECTURE.md](INTEGRATION_ARCHITECTURE.md) - System design
2. [MVP_IMPLEMENTATION_PLAN.md](MVP_IMPLEMENTATION_PLAN.md) - Development roadmap
3. [docs/adr/frontend/](docs/adr/frontend/) - Architectural decisions

### "I want to understand the frontend"
1. [docs/FRONTEND_DOCUMENTATION_INDEX.md](docs/FRONTEND_DOCUMENTATION_INDEX.md) - Complete guide
2. [src/components/README.md](src/components/README.md) - Component library
3. [docs/UI_DESIGN_SYSTEM.md](docs/UI_DESIGN_SYSTEM.md) - Design system

### "I want to integrate with CF14"
1. [GRAPHQL_NEO4J_INTEGRATION_PLAN.md](GRAPHQL_NEO4J_INTEGRATION_PLAN.md) - Integration strategy
2. [src/chirality-core/README.md](src/chirality-core/README.md) - Core integration layer
3. [NEO4J_SEMANTIC_INTEGRATION.md](NEO4J_SEMANTIC_INTEGRATION.md) - Semantic graph details

### "I'm an LLM working with this project"
1. [CLAUDE.md](CLAUDE.md) - Your role and collaboration patterns
2. [PROJECT_DIRECTORY.md](PROJECT_DIRECTORY.md) - Project structure
3. [src/](src/) - Source code organization

## 📊 File Importance Matrix

### Critical (Project won't work without these)
- src/app/api/chat/stream/route.ts
- src/chirality-core/orchestrate.ts
- package.json, next.config.js

### Important (Project functionality)
- README.md, GETTING_STARTED.md, INTEGRATION_ARCHITECTURE.md
- src/components/ (React components)
- src/chirality-core/ (CF14 integration)

### Valuable (Project quality/usability)
- ONBOARDING.md, HELP.md
- docs/UI_DESIGN_SYSTEM.md
- Test scripts and validation tools

### Reference (Historical/organizational)
- docs/adr/ (architectural decisions)
- CHANGELOG.md, VERSION.md
- Development history and planning documents

## 🔄 Status Update Protocol

### When to Update Status
- After completing documentation improvements
- Following major implementation changes
- During quarterly documentation reviews
- When git commits affect document relevance

### Status Update Process
1. **Review Current Status**: Check all documents against current implementation
2. **Identify Changes**: Note which documents need updates based on recent work
3. **Update Status Indicators**: Change status symbols and phase assignments
4. **Update Last Modified**: Record date/time of status update
5. **Commit Changes**: Include status update in git commit with clear message

### Automated Status Tracking
- **Agent Integration**: Status updates can be automated through documentation agents
- **Git Hook Integration**: Automatic status review triggered by significant commits
- **Validation Scripts**: Automated checking of document currency and accuracy

---

*This file serves as a navigation hub for the project's essential components, organized by user need and file importance. Status tracking ensures all documentation remains current and useful.*