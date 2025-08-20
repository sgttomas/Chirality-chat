# Claude App Setup Guide

**For: Future Claude updating documentation improvement cycle in chirality-ai-app**  
**Purpose: Maintain and evolve the continuous improvement system in the TypeScript app project**

## Context

You're working with the documentation improvement system in `chirality-ai-app` that needs periodic updates. This is one half of the Chirality system:
- **chirality-ai-app**: TypeScript document generation with Neo4j (this project)
- **chirality-semantic-framework**: Python CF14 semantic operations (sister project)

## Current State

The app project already has a working continuous improvement system. Your job is to maintain and evolve it based on new developments.

## Step 1: Navigate to the App Project

```bash
cd /Users/ryan/Desktop/ai-env/chirality-ai-app/
```

## Step 2: Review Existing Documentation System

### Core Files Already in Place
1. **CONTINUOUS_IMPROVEMENT_PLAN.md** - The ongoing process framework
2. **CONSOLIDATED_IMPROVEMENT_PLAN.md** - May exist from previous cycle
3. **KEY_PROJECT_FILES.md** - Tracking document for all documentation
4. **AGENT.md** - AI collaboration guide (in project root)
5. **AGENT_ONBOARDING_GUIDE.md** - In parent directory `/Users/ryan/Desktop/ai-env/`

### Knowledge Transfer Pipeline
Located in `/chirality-ai-app/lib/chirality-semantic-framework/` containing:
1. 4_DOCUMENTS_ANALYSIS.md
2. API.md
3. CHANGELOG.md
4. AGENT.md
5. COMMIT_HOOKS.md
6. CONTINUOUS_IMPROVEMENT_PLAN.md
7. CONTRIBUTING.md
8. CURRENT_STATUS.md
9. GRAPHQL_NEO4J_INTEGRATION_PLAN.md
10. INTEGRATION_ARCHITECTURE.md
11. KEY_DECISIONS.md
12. LICENSE
13. NEO4J_SEMANTIC_INTEGRATION.md
14. PROJECT_DIRECTORY.md
15. README.md
16. RELEASE_NOTES_14.3.0.md
17. VERSION.md
18. cf14_execution_trace.json
19. cf14_integration_example.py
20. component_viewer.py
21. requirements.txt
22. semantic_component_tracker.py
23. semantic_components.json
24. setup.py

## Step 3: Check for Updates Needed

### Review Triggers
Look for these signs that updates are needed:
- Git commits with documentation flags (MAJOR_OVERHAUL, STANDARD_UPDATE)
- New features added to the app
- User feedback about documentation issues
- Quarterly review cycle due
- Integration changes with chirality-semantic-framework

### Version and Release Coordination
- Check if app version has changed in package.json
- Review if new releases were published
- Verify if framework version changed (affects integration docs)

## Step 4: Update Process

### If Triggered by Git Commit

1. **Check for CONSOLIDATED_IMPROVEMENT_PLAN.md**
   - If it exists, this is the previous cycle's implementation plan
   - Review what was completed vs what's still pending

2. **Transform Plans if Needed**
   - If major overhaul triggered, create new CONSOLIDATED_IMPROVEMENT_PLAN.md
   - Use CONTINUOUS_IMPROVEMENT_PLAN.md as the template
   - Apply Matrix A (current state) × Matrix B (methodology) approach

3. **Execute Updates**
   - Follow the phased approach in the plan
   - Update KEY_PROJECT_FILES.md status as you go
   - Maintain reasoning traces

### Regular Maintenance Updates

1. **Update KEY_PROJECT_FILES.md**
   ```markdown
   - Change statuses: 🔄 NEEDS_UPDATE → 🆕 UPDATED → ✅ CURRENT
   - Add new files that were created
   - Mark deprecated files
   ```

2. **Synchronize Mirror Documentation**
   - Check if `/lib/chirality-semantic-framework/` needs updates
   - Particularly AGENT.md in that directory
   - Ensure version numbers match current framework release

3. **Update Integration Documentation**
   - INTEGRATION_ARCHITECTURE.md for any Neo4j changes
   - API.md for new endpoints or GraphQL schema changes
   - NEO4J_SEMANTIC_INTEGRATION.md for CF14 integration updates

## Step 5: TypeScript/App Specific Considerations

### Frontend Documentation
Located in `/docs/` directory:
- FRONTEND_DOCUMENTATION_INDEX.md
- UI_DESIGN_SYSTEM.md
- Component documentation in `/docs/components/`
- ADRs in `/docs/adr/frontend/`

### Key App-Specific Updates
- **Streaming/SSE**: Document any changes to real-time features
- **Chat Interface**: Update chat component documentation
- **Document Generation**: Two-pass generation flow changes
- **RAG System**: Updates to retrieval-augmented generation

### Package Management
- Keep package.json version synchronized with documentation
- Update RELEASE_NOTES_v*.md for new versions
- Coordinate with PyPI releases of framework

## Step 6: Coordination with Framework

### Check Framework Mirror
The framework has its own mirror at:
`/chirality-semantic-framework/lib/chirality-ai-app/`

That directory should contain these 27 files:
1. API.md
2. ARCHITECTURE.md
3. CHANGELOG.md
4. AGENT.md
5. COMMIT_HOOKS.md
6. CONTINUOUS_IMPROVEMENT_PLAN.md
7. CONTRIBUTING.md
8. CURRENT_STATUS.md
9. GRAPHQL_NEO4J_INTEGRATION_PLAN.md
10. HELP.md
11. INTEGRATION_ARCHITECTURE.md
12. KEY_DECISIONS.md
13. KEY_PROJECT_FILES.md
14. KNOWLEDGE_TRANSFER_MANIFEST.md
15. LICENSE
16. MVP_IMPLEMENTATION_PLAN.md
17. NEO4J_SEMANTIC_INTEGRATION.md
18. ONBOARDING.md
19. PROJECT_DIRECTORY.md
20. README.md
21. RELEASE_NOTES_v1.0.0.md
22. TROUBLESHOOTING.md
23. VERSION.md
24. package-lock.json
25. package.json
26. requirements.txt
27. tsconfig.json

**Important**: When you make significant updates to app documentation, consider if the framework mirror needs updating too.

## Step 7: Implementation Checklist

### Before Starting
- [ ] Read AGENT_ONBOARDING_GUIDE.md
- [ ] Review current CONTINUOUS_IMPROVEMENT_PLAN.md
- [ ] Check for existing CONSOLIDATED_IMPROVEMENT_PLAN.md
- [ ] Review KEY_PROJECT_FILES.md current statuses

### During Updates
- [ ] Follow the improvement methodology (phases 1-4)
- [ ] Update status tracking continuously
- [ ] Maintain reasoning traces
- [ ] Test all code examples
- [ ] Verify internal links work

### After Completion
- [ ] Update KEY_PROJECT_FILES.md final statuses
- [ ] If cycle complete, handle plan transformation
- [ ] Update AGENT_ONBOARDING_GUIDE.md if process changed
- [ ] Consider framework mirror updates
- [ ] Document lessons learned

## Common Update Patterns

### New Feature Documentation
1. Update README.md with feature mention
2. Enhance GETTING_STARTED.md if affects setup
3. Add to API.md if new endpoints
4. Update ARCHITECTURE.md if structural change
5. Add to HELP.md if common issues expected

### Integration Changes
1. Update INTEGRATION_ARCHITECTURE.md
2. Modify NEO4J_SEMANTIC_INTEGRATION.md if graph changes
3. Update GRAPHQL_NEO4J_INTEGRATION_PLAN.md
4. Ensure API.md reflects new contracts
5. Update framework mirror if needed

### Version Release
1. Update VERSION.md
2. Create new RELEASE_NOTES_v*.md
3. Update CHANGELOG.md
4. Modify package.json version
5. Update README.md version badges

## Quick Reference for File Locations

```
/Users/ryan/Desktop/ai-env/
├── AGENT_ONBOARDING_GUIDE.md (app onboarding)
├── AGENT_APP_SETUP_GUIDE.md (this file)
├── AGENT_FRAMEWORK_SETUP_GUIDE.md (framework setup)
└── chirality-ai-app/
    ├── CONTINUOUS_IMPROVEMENT_PLAN.md ✓
    ├── KEY_PROJECT_FILES.md ✓
    ├── CONSOLIDATED_IMPROVEMENT_PLAN.md (may exist)
    ├── docs/ (frontend documentation)
    ├── lib/
    │   └── chirality-semantic-framework/ (framework mirror)
    └── All other project files...
```

## Success Criteria

You know the update is successful when:
- All documentation accurately reflects current implementation
- KEY_PROJECT_FILES.md shows appropriate status for all docs
- Code examples work when tested
- Internal links are functional
- Version numbers are consistent
- Integration documentation matches both projects

---

*This guide helps maintain documentation quality and consistency in the chirality-ai-app project.*