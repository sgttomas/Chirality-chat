# Knowledge Transfer Manifest

**Canonical list of knowledge transfer files from chirality-semantic-framework to chirality-ai-app**

## Purpose

This manifest defines the authoritative set of documentation files that constitute the knowledge transfer pipeline from the Python framework to the TypeScript application. These files enable bidirectional understanding between the two halves of the Chirality system.

## Canonical File List

The following 29 files comprise the complete knowledge transfer set:

1. **4_DOCUMENTS_ANALYSIS.md** - Document workflow analysis
2. **API.md** - Python SDK and CLI interface documentation
3. **ARCHITECTURE.md** - System architecture documentation
4. **CHANGELOG.md** - Version history and changes
5. **CLAUDE.md** - AI collaboration guide for framework
6. **COMMIT_HOOKS.md** - Git workflow integration
7. **CONTINUOUS_IMPROVEMENT_PLAN.md** - Ongoing documentation improvement process
8. **CONTRIBUTING.md** - Development guidelines
9. **CURRENT_STATUS.md** - Current development state
10. **GRAPHQL_NEO4J_INTEGRATION_PLAN.md** - Graph integration planning
11. **INTEGRATION_ARCHITECTURE.md** - System design and implementation
12. **KEY_DECISIONS.md** - Architectural decision rationale
13. **KEY_PROJECT_FILES.md** - Documentation status tracking
14. **KNOWLEDGE_TRANSFER_MANIFEST.md** - This file (canonical list)
15. **LICENSE** - MIT license
16. **MVP_IMPLEMENTATION_PLAN.md** - Implementation roadmap
17. **NEO4J_SEMANTIC_INTEGRATION.md** - Semantic layer integration details
18. **PROJECT_DIRECTORY.md** - Project structure navigation
19. **README.md** - Framework overview and quick start
20. **RELEASE_NOTES_14.3.0.md** - Release documentation
21. **TROUBLESHOOTING.md** - Common issues and solutions
22. **VERSION.md** - Version tracking methodology
23. **cf14_execution_trace.json** - Example CF14 execution data
24. **cf14_integration_example.py** - Python integration example
25. **component_viewer.py** - Component analysis tool
26. **requirements.txt** - Python dependencies
27. **semantic_component_tracker.py** - Component tracking utility
28. **semantic_components.json** - Component data structure
29. **setup.py** - Python package configuration

## Usage

When synchronizing documentation between projects:
1. Refer to this manifest as the authoritative list
2. Ensure all files listed here are present and current
3. Update this manifest if files are added or removed
4. The CLAUDE.md file provides framework-specific guidance

## Location

- **This directory**: `/Users/ryan/Desktop/ai-env/chirality-ai-app/lib/chirality-semantic-framework/`
- **Mirror directory**: `/Users/ryan/Desktop/ai-env/chirality-semantic-framework/lib/chirality-ai-app/`

## Key Files for App Developers

### Understanding CF14 Operations
- **README.md** - Framework overview and capabilities
- **API.md** - How to call Python functions from TypeScript
- **cf14_execution_trace.json** - Example of what CF14 produces
- **cf14_integration_example.py** - How to integrate with the framework

### Integration Points
- **INTEGRATION_ARCHITECTURE.md** - How framework and app connect
- **NEO4J_SEMANTIC_INTEGRATION.md** - Shared Neo4j patterns
- **GRAPHQL_NEO4J_INTEGRATION_PLAN.md** - Graph layer both projects use

### Framework Development
- **KEY_DECISIONS.md** - Why the framework was built certain ways
- **PROJECT_DIRECTORY.md** - Navigate the Python codebase
- **setup.py** - Package configuration and dependencies

## Maintenance

This manifest should be updated whenever:
- New documentation files are added to the knowledge transfer pipeline
- Files are removed from the transfer set
- The structure of the knowledge transfer changes
- Major framework updates affect integration

## Verification

To verify completeness, check that:
- All Python-specific files (*.py, setup.py, requirements.txt) are included
- All documentation files (*.md) are present
- JSON data files for examples are included
- The total count matches the number listed (29 files)

---

*This manifest ensures consistent knowledge transfer between the Python framework and TypeScript application components of the Chirality system.*