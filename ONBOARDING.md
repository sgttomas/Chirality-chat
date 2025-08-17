# Onboarding Guide - Chirality Core Chat

Welcome to the team! This guide will help you understand and contribute to the Chirality Core Chat project.

## 🎯 Project Overview

Chirality Core Chat is a streamlined chatbot interface that implements the **Chirality Framework's two-pass document generation system**. It combines structured document generation with RAG-enhanced chat for powerful problem-solving workflows.

### Key Innovation: Two-Pass Generation
Unlike traditional single-pass systems, our approach uses:
1. **Sequential generation** (DS→SP→X→M)  
2. **Cross-referential refinement** (each document refined using insights from others)
3. **Final resolution** (X updated with refined M guidance)

This creates documents that are highly coherent and cross-referenced.

## 🏗️ Architecture Deep Dive

### Core Philosophy
- **Minimal dependencies** - Keep it simple and focused
- **File-based state** - No database complexity  
- **RAG-first** - Documents enhance every chat interaction
- **Streaming UX** - Real-time progress feedback

### Tech Stack
```
Frontend: Next.js 15.2.3 + React 18 + TypeScript
AI: OpenAI Chat Completions API (gpt-4.1-nano)
State: File-based JSON + Zustand
Styling: Tailwind CSS
```

### Document Flow
```
Problem → [Pass 1: DS→SP→X→M] → [Pass 2: Refinement] → [Resolution: X final] → RAG Chat
```

## 🚀 Development Workflow

### 1. Local Setup
```bash
git clone <repo>
cd chirality-ai-app
npm install
cp .env.example .env.local  # Add your OpenAI API key
npm run dev
```

### 2. Testing Changes
- **Document Generation**: Test at `/chirality-core`
- **Chat Integration**: Test RAG functionality at `/`
- **Admin Dashboard**: Monitor system at `/chat-admin`
- **API Testing**: Use curl or Postman for endpoints

### 3. Key Files to Know
- **`/src/app/api/core/orchestrate/route.ts`** - Two-pass generation logic
- **`/src/chirality-core/orchestrate.ts`** - Core document generation  
- **`/src/chirality-core/validators.ts`** - Flexible validation system
- **`/src/app/api/chat/stream/route.ts`** - RAG chat endpoint
- **`/src/app/chirality-core/page.tsx`** - Main UI

## 🛠️ Common Development Tasks

### Adding New Document Types
1. Define interface in `contracts.ts`
2. Add validator in `validators.ts`  
3. Update orchestration logic
4. Add UI components
5. Test both single and two-pass generation

### Modifying Document Structure
1. Update TypeScript interfaces
2. Modify validators to handle new fields
3. Test with various input formats
4. Update compactor functions if needed

### Enhancing Chat RAG
1. Modify document injection in `/api/chat/stream`
2. Update compactor functions for better context
3. Test chat quality with different document sets

### Performance Optimization
- **Document generation**: Optimize LLM calls and validation
- **Chat streaming**: Improve SSE performance  
- **UI responsiveness**: React optimization patterns

## 📋 Code Guidelines

### TypeScript Standards
- **Strict typing** everywhere
- **Interface-first** design
- **Named exports** preferred
- **Error boundaries** for UI components

### API Design
- **RESTful patterns** for endpoints
- **Consistent error handling** 
- **TypeScript request/response types**
- **Proper HTTP status codes**

### Testing Strategy
- **Manual testing** workflows for document generation
- **API testing** with curl/Postman
- **Cross-browser testing** for chat UI
- **Edge case validation** (malformed responses, network issues)

## 🔍 Debugging Guide

### Common Issues
1. **Document validation fails** → Check `validators.ts` for flexible handling
2. **Chat context missing** → Verify document injection in stream endpoint
3. **LLM responses malformed** → Review JSON parsing in `vendor/llm.ts`
4. **UI state inconsistent** → Check Zustand store updates

### Debug Tools
- **Admin Dashboard** (`/chat-admin`) - System state visibility
- **Browser DevTools** - Network tab for API calls
- **Server Logs** - Document generation progress
- **API Endpoints** - Direct testing with curl

### Performance Monitoring
- **Generation timing** - Track LLM call latency
- **Memory usage** - File-based state efficiency
- **User experience** - Streaming responsiveness

## 🎯 Contribution Guidelines

### Before You Start
1. **Understand the two-pass flow** - This is our core innovation
2. **Test both generation modes** - Single-pass vs two-pass
3. **Verify RAG integration** - Documents should enhance chat
4. **Check admin dashboard** - Ensure transparency

### Making Changes
1. **Small, focused PRs** - One feature/fix per PR
2. **Test thoroughly** - Both generation modes + chat
3. **Update documentation** - Keep docs current
4. **Follow TypeScript patterns** - Maintain code consistency

### Code Review Focus
- **Document coherence** - Does refinement improve quality?
- **Chat integration** - Are documents properly injected?
- **Error handling** - Graceful degradation?
- **Performance impact** - Any regressions?

## 🚀 Advanced Features

### Custom Document Types
You can extend the system with new document types by following the established patterns for DS/SP/X/M.

### Enhanced RAG Strategies
Experiment with different document injection patterns, compaction strategies, and context window optimization.

### Multi-Modal Integration
The architecture supports extending to other AI models or multi-modal inputs.

## 🎉 Welcome Aboard!

You're now ready to contribute to Chirality Core Chat! Start with small improvements, understand the two-pass generation flow, and don't hesitate to ask questions.

**Remember**: Our goal is creating coherent, cross-referenced documents that make chat conversations significantly more valuable. Every change should support this vision.

Happy coding! 🚀