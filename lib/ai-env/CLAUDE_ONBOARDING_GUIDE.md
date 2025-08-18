# Claude Onboarding Guide

**For future Claude instances working on Chirality Framework projects**

## Quick Start

You're working with a dual-project system. First, determine which project needs work:
- **chirality-ai-app**: TypeScript document generation app with Neo4j
- **chirality-semantic-framework**: Python CF14 semantic operations

Then use the appropriate setup guide:
- **For app work**: Read CLAUDE_APP_SETUP_GUIDE.md (in this directory)
- **For framework work**: Read CLAUDE_FRAMEWORK_SETUP_GUIDE.md (in this directory)
- **For new Claude instances**: Continue reading this guide

## The System Overview

**Two Projects, One System:**
```
/Users/ryan/Desktop/ai-env/
├── chirality-ai-app/           (TypeScript/Next.js app)
│   └── lib/chirality-semantic-framework/  (Framework docs mirror)
└── chirality-semantic-framework/  (Python CF14 framework)
    └── lib/chirality-ai-app/   (App docs mirror)
```

**Key Guides in This Directory:**
- **CLAUDE_ONBOARDING_GUIDE.md** (this file) - Start here
- **CLAUDE_APP_SETUP_GUIDE.md** - For app documentation work
- **CLAUDE_FRAMEWORK_SETUP_GUIDE.md** - For framework documentation work

## Step 1: Determine Your Task

Check which project you're working on:
```bash
pwd  # Where are you?
```

If in `/chirality-ai-app/`: You're doing app documentation
If in `/chirality-semantic-framework/`: You're doing framework documentation

## Step 2: Read the Knowledge Transfer Pipeline

### For App Work
Read these in `/chirality-ai-app/lib/chirality-semantic-framework/`:
1. **KNOWLEDGE_TRANSFER_MANIFEST.md** - The canonical list (29 files)
2. **CLAUDE.md** - Your role for this mirror
3. **README.md** through **VERSION.md** - All framework docs
4. Review the Python examples and config files

### For Framework Work  
Read these in `/chirality-semantic-framework/lib/chirality-ai-app/`:
1. **KNOWLEDGE_TRANSFER_MANIFEST.md** - The canonical list (27 files)
2. **CLAUDE.md** - Your role for this mirror
3. **README.md** through **VERSION.md** - All app docs
4. Review the TypeScript configs and package files

## Step 3: Read Project-Specific Documentation

### In the App Project Root
Key files to understand:
- **CONTINUOUS_IMPROVEMENT_PLAN.md** - The ongoing process
- **KEY_PROJECT_FILES.md** - Documentation status tracking
- **CONSOLIDATED_IMPROVEMENT_PLAN.md** - May exist from previous cycle

### In the Framework Project Root
Key files to check/create:
- **CONTINUOUS_IMPROVEMENT_PLAN.md** - Create if missing
- **KEY_PROJECT_FILES.md** - Create if missing
- **CLAUDE.md** - Update existing one

## Step 4: Understand the Improvement Cycle

The documentation system cycles between two states:

1. **CONTINUOUS_IMPROVEMENT_PLAN.md** - Ongoing process framework (always exists)
2. **CONSOLIDATED_IMPROVEMENT_PLAN.md** - Specific implementation plan (created when triggered)

The cycle:
- Git commit or trigger → Generate CONSOLIDATED plan from CONTINUOUS
- Execute improvements → Update KEY_PROJECT_FILES.md
- Complete cycle → Rename CONSOLIDATED back to CONTINUOUS
- Capture lessons learned → Update this guide if needed

## Step 5: Check Both Projects

Even if working on one project, check the other:
- Version coordination (PyPI vs npm)
- Integration documentation alignment
- Mirror directories staying in sync
- KNOWLEDGE_TRANSFER_MANIFEST.md accuracy

## Quality Standards

**Do:**
- Follow existing patterns
- Update status tracking continuously
- Test code examples
- Keep mirrors synchronized
- Coordinate versions between projects

**Don't:**
- Break established patterns
- Skip status updates
- Create docs without need
- Ignore the other project
- Over-engineer simple updates

## Common Tasks Reference

### Setting Up Framework Documentation System
→ Read CLAUDE_FRAMEWORK_SETUP_GUIDE.md

### Maintaining App Documentation
→ Read CLAUDE_APP_SETUP_GUIDE.md

### Creating New Release
1. Update VERSION.md
2. Create RELEASE_NOTES_v*.md
3. Update CHANGELOG.md
4. Coordinate PyPI/npm releases

### Updating Mirrors
1. Check KNOWLEDGE_TRANSFER_MANIFEST.md in both mirrors
2. Sync changed files
3. Update CLAUDE.md if needed
4. Test integration points

## File Location Quick Reference

```
/Users/ryan/Desktop/ai-env/
├── CLAUDE_ONBOARDING_GUIDE.md (this file)
├── CLAUDE_APP_SETUP_GUIDE.md
├── CLAUDE_FRAMEWORK_SETUP_GUIDE.md
├── chirality-ai-app/
│   ├── CONTINUOUS_IMPROVEMENT_PLAN.md
│   ├── KEY_PROJECT_FILES.md
│   └── lib/chirality-semantic-framework/ (29 files)
│       ├── KNOWLEDGE_TRANSFER_MANIFEST.md
│       └── CLAUDE.md
└── chirality-semantic-framework/
    ├── CONTINUOUS_IMPROVEMENT_PLAN.md (create if missing)
    ├── KEY_PROJECT_FILES.md (create if missing)
    └── lib/chirality-ai-app/ (27 files)
        ├── KNOWLEDGE_TRANSFER_MANIFEST.md
        └── CLAUDE.md
```

## Next Steps

1. Identify which project needs work
2. Read the appropriate setup guide
3. Follow the knowledge transfer pipeline
4. Execute the improvement methodology
5. Update status tracking
6. Consider mirror synchronization

---

*This guide helps future Claude instances navigate the complete Chirality documentation system.*