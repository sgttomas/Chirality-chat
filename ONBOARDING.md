# Onboarding Guide - Chirality Chat

Welcome to the Chirality Chat project! This guide will get you from zero to productive contributor in minutes.

## 🚀 Quick Start (5 minutes)

### 1. Prerequisites Check
```bash
# Check Node.js version (need 18+)
node --version  # Should be v18+ or v20+

# Check npm
npm --version

# Check if you have access to OpenAI API
echo "You'll need an OpenAI API key with access to gpt-4.1-nano"
```

### 2. Clone and Setup
```bash
git clone https://github.com/sgttomas/Chirality-chat.git
cd Chirality-chat
npm install
```

### 3. Environment Configuration
```bash
# Copy example environment file
cp .env.local.example .env.local

# Edit with your OpenAI API key
# REQUIRED: OPENAI_API_KEY=sk-proj-your-key
# REQUIRED: OPENAI_MODEL=gpt-4.1-nano
```

### 4. Start Development
```bash
npm run dev
# Opens http://localhost:3000
```

### 5. Verify Everything Works
1. Navigate to `/chirality-core`
2. Click "Set Test Problem"
3. Generate DS → SP → X → M documents
4. Go to `/` and chat: "What documents are available?"
5. Check `/chat-admin` for system transparency

**🎉 If this works, you're ready to contribute!**

## 🏗️ Project Architecture (What You Need to Know)

### Core Concept
This is a **graph-free chat interface** that generates semantic documents and injects them into AI conversations.

```
User Problem → Generate 4 Documents (DS/SP/X/M) → RAG Chat with Documents
```

### Key Technologies
- **Frontend**: Next.js 15 + React 18 + TypeScript
- **AI**: OpenAI gpt-4.1-nano via Responses API (NOT Chat Completions)
- **State**: File-based storage (no database required)
- **Streaming**: Server-Sent Events for real-time responses

### Critical Files to Understand
1. **`/src/app/api/chat/stream/route.ts`** - Main chat endpoint with RAG
2. **`/src/chirality-core/orchestrate.ts`** - Document generation logic
3. **`/src/app/chat-admin/page.tsx`** - Admin dashboard for debugging
4. **`/src/chirality-core/state/store.ts`** - File-based state management

### 3 Main Workflows
1. **Document Generation**: Problem → DS → SP → X → M documents
2. **RAG Chat**: Documents injected into chat system prompt
3. **Admin Monitoring**: Real-time transparency via dashboard

## 🛠️ Development Workflows

### Making Your First Contribution

#### 1. Pick a Good First Issue
- UI improvements (styling, accessibility)
- Additional compaction functions in `/src/chirality-core/compactor.ts`
- New admin dashboard metrics
- Component testing additions

#### 2. Development Process
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes
# ... edit files ...

# Test your changes
npm run dev
# Visit /chat-admin to verify system state
# Test the full workflow: problem → documents → chat

# Commit with descriptive message
git commit -m "feat: add new compaction function for X documents

- Optimizes X document content for AI context
- Reduces token usage by 30%
- Maintains semantic meaning
- Includes unit tests"
```

#### 3. Before Submitting PR
- [ ] Test the complete workflow (problem → documents → chat)
- [ ] Check `/chat-admin` dashboard shows correct state
- [ ] Verify no TypeScript errors: `npm run build`
- [ ] Test edge cases (empty documents, malformed JSON)
- [ ] Add/update tests if applicable

### Common Development Tasks

#### Adding a New Document Type
1. Add interface to `/src/chirality-core/contracts.ts`
2. Update `runDoc` in `/src/chirality-core/orchestrate.ts`
3. Add compactor function in `/src/chirality-core/compactor.ts`
4. Update UI to handle new type
5. Test generation and chat injection

#### Modifying Chat Behavior
1. Edit document injection in `/src/app/api/chat/stream/route.ts`
2. Update command detection if needed
3. Test with `/chat-admin` dashboard
4. Verify SSE streaming still works

#### Adding UI Components
1. Create component in `/src/components/[domain]/`
2. Add to barrel export in `index.ts`
3. Follow accessibility patterns (see `/src/components/README.md`)
4. Add to Storybook if applicable

## 🐛 Debugging Guide

### When Things Go Wrong

#### "SSE error: {}"
1. Check OpenAI API key in `.env.local`
2. Verify access to gpt-4.1-nano model
3. Check browser console for network errors
4. Visit `/chat-admin` for system state

#### "Documents not generating"
1. Ensure problem is set first
2. Check server console for errors
3. Use `/chat-admin` to monitor generation
4. Test with minimal problem statement

#### "Chat not aware of documents"
1. Visit `/chat-admin` → "Full Instructions" tab
2. Look for "--- Pinned Finals (compact) ---"
3. Check document content lengths > 0
4. Verify state persistence with `/api/core/state`

### Debug Tools
- **Primary**: `/chat-admin` dashboard
- **API**: `/api/chat/debug` endpoint
- **State**: `/api/core/state` endpoint
- **Testing**: `/api/chat/test` endpoint

## 📚 Learning Resources

### Understanding the Codebase
1. **Start with**: `CLAUDE.md` - Complete overview
2. **API patterns**: `CLAUDE-API.md` - Server-side implementation
3. **Components**: `CLAUDE-COMPONENTS.md` - Frontend patterns
4. **Debugging**: `CLAUDE-DEBUGGING.md` - Troubleshooting
5. **Deployment**: `CLAUDE-DEPLOYMENT.md` - Production setup

### Key Concepts to Learn
- **OpenAI Responses API** (different from Chat Completions)
- **Server-Sent Events** streaming patterns
- **File-based state management** (no database)
- **RAG (Retrieval-Augmented Generation)** document injection
- **React performance patterns** with TypeScript

### Code Patterns to Follow
```typescript
// ✅ Good - OpenAI Responses API format
const body = {
  model: 'gpt-4.1-nano',
  instructions: systemPrompt,
  input: [{ role: 'user', content: [{ type: 'input_text', text: message }] }]
}

// ✅ Good - Component with proper typing
export const Component = React.memo<Props>(({ prop1, onAction }) => {
  const [state, setState] = useState<StateType>()
  const callback = useCallback(() => {}, [dependencies])
  // ...
})

// ✅ Good - Error handling
try {
  const result = await operation()
  return result
} catch (error) {
  console.error('Operation failed:', error)
  setError(error instanceof Error ? error.message : 'Unknown error')
}
```

## 🤝 Contributing Guidelines

### Code Style
- **TypeScript strict mode** - no `any` types
- **Named exports** preferred over default
- **Accessibility first** - WCAG 2.1 AA compliance
- **Performance minded** - use React.memo, useMemo, useCallback
- **Error boundaries** - graceful degradation

### Commit Messages
Follow conventional commits:
```
feat: add new document compaction algorithm
fix: resolve SSE connection timeout issues
docs: update API endpoint documentation
test: add unit tests for state management
refactor: optimize matrix rendering performance
```

### Pull Request Process
1. Fork the repository
2. Create feature branch from `main`
3. Make changes with tests
4. Update documentation if needed
5. Test with admin dashboard
6. Submit PR with clear description

### What We're Looking For
- **UI/UX improvements** - Better user experience
- **Performance optimizations** - Faster, more efficient
- **Testing coverage** - More robust tests
- **Documentation** - Clearer guides and examples
- **Accessibility** - Better a11y support
- **New features** - Document types, analysis tools

## 🎯 Project Goals & Vision

### Current State
We have a working graph-free Chirality Framework that:
- Generates 4 types of semantic documents
- Provides RAG chat with document context
- Offers complete system transparency
- Works without database dependencies

### Near-term Goals (Next 3 months)
- [ ] Enhanced document templates and validation
- [ ] Better document visualization and editing
- [ ] Performance optimizations for large documents
- [ ] More comprehensive testing suite
- [ ] Mobile-responsive design improvements

### Long-term Vision
- **Semantic framework platform** - Multiple document types and workflows
- **Collaborative editing** - Multi-user document generation
- **AI model flexibility** - Support for additional AI providers
- **Enterprise features** - Authentication, permissions, audit logs

### How You Can Help
- **Frontend developers**: UI/UX improvements, accessibility, mobile support
- **Backend developers**: API optimizations, new document types, integrations
- **AI/ML engineers**: Better prompts, document validation, quality metrics
- **DevOps engineers**: Deployment automation, monitoring, scaling
- **Technical writers**: Documentation, tutorials, examples

## 📞 Getting Help

### Resources
- **Issues**: [GitHub Issues](https://github.com/sgttomas/Chirality-chat/issues)
- **Discussions**: [GitHub Discussions](https://github.com/sgttomas/Chirality-chat/discussions)
- **Documentation**: All `*.md` files in repository root

### Common Questions

**Q: Do I need the GraphQL service?**
A: No! This is now graph-free. The GraphQL service is optional for legacy matrix features.

**Q: Which OpenAI model should I use?**
A: Only `gpt-4.1-nano`. Other models will not work correctly.

**Q: How do I debug issues?**
A: Start with the `/chat-admin` dashboard - it shows everything you need to know.

**Q: Can I add new document types?**
A: Yes! Follow the pattern in `orchestrate.ts` and add a compactor function.

**Q: How do I test my changes?**
A: Use the admin dashboard to monitor the full workflow and verify your changes.

---

🎉 **Welcome to the team!** The admin dashboard at `/chat-admin` is your best friend for understanding how everything works. Start there, explore the codebase, and don't hesitate to ask questions.