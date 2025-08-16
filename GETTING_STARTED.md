# Getting Started with Chirality Chat

A comprehensive user guide for interacting with the Chirality Chat interface - your gateway to AI-powered semantic document generation and retrieval-augmented generation (RAG) conversations.

## 🚀 Quick Start

1. **Navigate to Chat**: http://localhost:3001
2. **Try a question**: Ask about any topic or use existing documents
3. **Generate documents**: Use natural language commands
4. **Monitor system**: Visit admin dashboard for transparency

## 🌐 Interface Overview

### Main Interfaces

#### 1. **Chat Interface** - `/` 
*Primary conversation experience with RAG-enhanced AI*

**What you can do:**
- Have natural conversations with AI
- Generated documents automatically provide context
- Use chat commands to generate new documents
- Get real-time streaming responses
- Copy and share messages

**Key Features:**
- Real-time streaming responses with SSE
- Markdown rendering with syntax highlighting
- Automatic document context injection
- Mobile-responsive design
- Accessibility-compliant (WCAG 2.1 AA)

#### 2. **Chirality Core Dashboard** - `/chirality-core`
*Document generation control center*

**What you can do:**
- Set problem statements to work on
- Generate 4 types of structured documents
- Use quick test problems for experimentation
- Clear all documents to start fresh
- Export generated documents

**Document Types:**
- **DS (Data Template)**: Structured data field definitions
- **SP (Procedural Checklist)**: Step-by-step workflow procedures
- **X (Solution Template)**: Narrative solution frameworks
- **M (Guidance)**: Justification and guidance documents

#### 3. **Admin Dashboard** - `/chat-admin`
*System transparency and debugging interface*

**What you can do:**
- View complete system prompts sent to OpenAI
- Monitor document injection in real-time
- Test chat endpoints directly
- Inspect raw document data
- Watch auto-refreshing metrics (updates every 2 seconds)

**Transparency Features:**
- Full system instruction visibility
- Document compaction preview
- OpenAI API payload inspection
- Validation status monitoring

## 💬 Chat Commands Reference

### Document Generation Commands
Use these natural language phrases in any chat interface:

```
"set problem: [describe your problem]"
```
*Defines the problem statement for document generation*

```
"generate DS"
```
*Creates a Data Template with structured field definitions*

```
"generate SP" 
```
*Creates a Procedural Checklist with step-by-step workflows*

```
"generate X"
```
*Creates a Solution Template with narrative solutions*

```
"generate M"
```
*Creates Guidance documents with justifications*

```
"clear all"
```
*Resets all documents and problem state*

### Example Workflow
```
User: "set problem: How to optimize database performance"
AI: [Sets problem and provides initial analysis]

User: "generate DS"
AI: [Creates data template for database metrics]

User: "generate SP"  
AI: [Creates procedural checklist for optimization steps]

User: "What are the key performance indicators I should monitor?"
AI: [Responds using context from generated DS and SP documents]
```

## 🎮 Interactive Controls

### Chat Interface Controls

**Message Input:**
- Type questions or commands
- Press Enter to send
- Shift+Enter for new lines

**Message Actions:**
- **Copy button**: Copy any message content
- **Scroll behavior**: Auto-scroll to new messages
- **Typing indicators**: Visual feedback during AI responses

### Document Generation Controls

**Quick Actions:**
- **Set Test Problem**: Pre-filled example problems
- **Generate [Type]**: One-click document generation
- **Clear All**: Reset workspace
- **Export**: Download generated documents

**Visual Feedback:**
- Progress indicators during generation
- Success/error status displays
- Document preview cards
- Real-time update notifications

## 📱 User Experience Features

### Responsive Design
- **Desktop**: Full-featured interface with side panels
- **Tablet**: Optimized layout with collapsible sections  
- **Mobile**: Touch-friendly controls with swipe navigation

### Accessibility Features
- **Keyboard navigation**: Full keyboard support
- **Screen reader**: ARIA labels and descriptions
- **High contrast**: Clear visual hierarchy
- **Focus management**: Logical tab order

### Performance Optimizations
- **Streaming responses**: Real-time message delivery
- **Content caching**: Efficient re-rendering
- **Error boundaries**: Graceful failure handling
- **Auto-recovery**: Robust connection management

## 🗺️ User Journey Paths

### Path 1: Quick Chat Experience
1. Visit `/` (main chat)
2. Ask questions using existing document context
3. Use admin dashboard to understand how documents enhance responses

### Path 2: Document Generation Workflow
1. Visit `/chirality-core`
2. Set a problem statement
3. Generate DS → SP → X → M in sequence
4. Return to `/` to chat with generated context
5. Monitor injection at `/chat-admin`

### Path 3: System Exploration
1. Start at `/chat-admin` to understand current state
2. Test endpoints to see document availability
3. Visit `/chirality-core` to generate new documents
4. Use `/` to experience RAG-enhanced conversations

### Path 4: Power User Analysis
1. Use `/chat-admin` for real-time system monitoring
2. Generate documents at `/chirality-core`
3. Analyze system prompts and document injection
4. Test chat responses with transparent debugging

## 🔍 Understanding Document Injection

### How RAG Works in Chirality Chat

When you chat, the system automatically:

1. **Detects available documents** (DS, SP, X, M)
2. **Compacts document content** for efficient AI context
3. **Injects into system prompt** before sending to OpenAI
4. **Provides context-aware responses** using your generated documents

### Monitoring Document Usage

**In Admin Dashboard:**
- View exact system instructions sent to AI
- See which documents are injected
- Monitor token usage and optimization
- Validate successful document integration

**In Chat Interface:**
- Responses reference your generated documents
- AI provides citations and connections
- Context-aware answers to domain-specific questions

## 🎯 Common Use Cases

### Academic Research
```
1. Set problem: "Literature review methodology for AI ethics"
2. Generate DS → Data fields for paper analysis
3. Generate SP → Review procedure checklist
4. Chat: "How should I structure my analysis framework?"
```

### Business Process Design
```
1. Set problem: "Customer onboarding optimization"
2. Generate DS → Customer data requirements
3. Generate SP → Onboarding workflow steps
4. Generate X → Solution architecture
5. Chat: "What are the critical success metrics?"
```

### Technical Documentation
```
1. Set problem: "API integration best practices"
2. Generate all document types
3. Chat: "Create a developer guide using these documents"
4. Export final documentation
```

### Problem-Solving Workshops
```
1. Use test problems for quick exploration
2. Generate documents collaboratively
3. Use chat to explore solutions
4. Monitor system transparency for learning
```

## 🛠️ Tips and Best Practices

### Effective Problem Statements
- **Be specific**: "Database query optimization for e-commerce analytics"
- **Include context**: "For a team of 5 developers with PostgreSQL"
- **Define scope**: "Focus on read performance under high load"

### Document Generation Strategy
- **Start with DS**: Define data requirements first
- **Follow with SP**: Establish procedures and workflows
- **Use X for solutions**: Create narrative frameworks
- **Finish with M**: Document justifications and guidance

### Chat Optimization
- **Ask specific questions**: Reference document types directly
- **Request comparisons**: "Compare the DS and SP approaches"
- **Seek elaboration**: "Expand on step 3 from the SP document"
- **Test understanding**: "Summarize the key risks from document M"

### Admin Dashboard Usage
- **Monitor before and after**: See how documents change responses
- **Validate injection**: Ensure all documents are properly included
- **Debug issues**: Check system prompts for troubleshooting
- **Optimize tokens**: Monitor content length and efficiency

## 🔗 Integration Points

### With External Systems
- **Export capabilities**: Download documents in various formats
- **API endpoints**: Programmatic access to generated content
- **Health monitoring**: System status and availability checks

### With Development Workflow
- **Real-time debugging**: Live system prompt inspection
- **Performance monitoring**: Token usage and response times
- **Error tracking**: Graceful failure handling and recovery

## 🎉 Next Steps

Once comfortable with basic interactions:

1. **Explore advanced features** in enhanced dashboard
2. **Experiment with different problem domains**
3. **Monitor system behavior** through admin interface
4. **Integrate with workflows** using API endpoints
5. **Contribute feedback** for continuous improvement

---

🤖 **Remember**: Chirality Chat combines structured document generation with conversational AI to provide context-aware, domain-specific responses. The more structured documents you generate, the more intelligent and relevant your chat conversations become!

For technical details, see **README.md**. For troubleshooting, see **HELP.md**. For development, see **ONBOARDING.md** and **CLAUDE.md**.