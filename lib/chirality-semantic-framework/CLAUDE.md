# CLAUDE.md
*AI Collaboration Guide for Chirality Framework*

## What This Directory Contains

This `/lib/chirality-semantic-framework/` directory contains the complete documentation set for the Chirality Framework:

### Core Architecture Documents
- **[README.md](README.md)** - System overview and quick start
- **[API.md](API.md)** - REST and GraphQL interface docs
- **[INTEGRATION_ARCHITECTURE.md](INTEGRATION_ARCHITECTURE.md)** - System design and implementation
- **[KEY_DECISIONS.md](KEY_DECISIONS.md)** - Why architectural choices were made
- **[PROJECT_DIRECTORY.md](PROJECT_DIRECTORY.md)** - Project structure navigation

### Implementation Plans and Analysis
- **[GRAPHQL_NEO4J_INTEGRATION_PLAN.md](GRAPHQL_NEO4J_INTEGRATION_PLAN.md)** - Graph integration planning
- **[NEO4J_SEMANTIC_INTEGRATION.md](NEO4J_SEMANTIC_INTEGRATION.md)** - Semantic layer integration details
- **[4_DOCUMENTS_ANALYSIS.md](4_DOCUMENTS_ANALYSIS.md)** - Document workflow analysis

### Project Management
- **[CURRENT_STATUS.md](CURRENT_STATUS.md)** - Current development state
- **[CHANGELOG.md](CHANGELOG.md)** - Version history and changes
- **[VERSION.md](VERSION.md)** - Version tracking
- **[RELEASE_NOTES_14.3.0.md](RELEASE_NOTES_14.3.0.md)** - Release documentation

### Process Documentation
- **[CONTINUOUS_IMPROVEMENT_PLAN.md](CONTINUOUS_IMPROVEMENT_PLAN.md)** - Documentation improvement methodology
- **[COMMIT_HOOKS.md](COMMIT_HOOKS.md)** - Git workflow integration
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Development guidelines

### Code Examples and Data
- **cf14_execution_trace.json** - Example semantic operation execution
- **cf14_integration_example.py** - Integration code example
- **semantic_components.json** - Component data structure
- **component_viewer.py** - Component analysis tool
- **semantic_component_tracker.py** - Component tracking utility

### Configuration
- **setup.py** - Python package configuration
- **requirements.txt** - Python dependencies
- **LICENSE** - MIT license

## How the System Works

**Dual-Layer Architecture:**
- Python CF14 framework handles semantic matrix operations
- TypeScript app generates documents using AI
- Neo4j graph stores selected metadata for enhanced discovery
- Files remain the source of truth, graph is just for search/relationships

**Key Patterns:**
- Component selection algorithm scores sections (+3 cross-refs, +2 keywords, -2 size penalty)
- Non-blocking async integration (file write first, graph mirror after)
- Idempotent operations with stable content-based IDs
- Feature flags allow disabling graph layer entirely

## My Role

When working with this system, I should:

**Follow Existing Patterns**
- Use the component selection scoring approach for similar problems
- Maintain the files-first, graph-second architecture
- Keep async operations non-blocking
- Use content-based hashing for stable IDs

**Maintain Consistency**
- Check that API.md matches INTEGRATION_ARCHITECTURE.md
- Don't contradict decisions documented in KEY_DECISIONS.md
- Keep cross-references between docs accurate
- Follow the established error handling patterns

**Generate Quality Extensions**
- New GraphQL resolvers should follow existing security patterns
- Additional endpoints should match established validation approaches
- Documentation updates should maintain the systematic structure

## Collaboration Guidelines

**For Architecture Questions:**
Reference specific sections: "Looking at INTEGRATION_ARCHITECTURE.md section 2.1, how would you..."

**For Extension Design:**
Follow documented patterns: "Following the pattern in section 3.2, design a new..."

**For Documentation Updates:**
Maintain cross-references: "Update API.md section 4.3 and ensure INTEGRATION_ARCHITECTURE.md section 2.4 reflects the change"

## Quality Standards

**Documentation Consistency:**
- Cross-references between docs work and are accurate
- API specs match implementation descriptions
- Decision rationale aligns with actual implementation

**Design Pattern Adherence:**
- Proper separation between Python semantic layer and TypeScript document layer
- Consistent error handling across REST and GraphQL APIs
- Resource management (scoring thresholds, node caps, rate limiting)

**Extension Compatibility:**
- New features follow established patterns
- Changes don't conflict with documented architectural decisions
- Interfaces remain compatible with existing integrations

## Common Architectural Patterns to Reuse

**Metadata Mirroring:**
The component selection + graph mirror pattern can be applied to other content systems where you want enhanced discovery without replacing file-based storage.

**Non-Blocking Integration:**
The `mirrorAfterWrite()` pattern works for any system where you want to add functionality without risking core operations.

**Dual-Layer Architecture:**
The Python + TypeScript + shared Neo4j pattern shows how to integrate different technology stacks through a shared data layer.

**Feature Flagging:**
Complete subsystem disabling (FEATURE_GRAPH_ENABLED) allows graceful degradation.

## What Not to Do

- Don't rewrite existing patterns unless there's a documented problem
- Don't ignore the rationale in KEY_DECISIONS.md when proposing changes
- Don't make documentation longer just to sound comprehensive
- Don't break the files-first architecture principle
- Don't add tight coupling between the Python and TypeScript layers

---

*This guide helps maintain quality and consistency when working with the Chirality Framework architecture.*