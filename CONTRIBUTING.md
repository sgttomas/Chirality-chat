# Contributing to Chirality AI App

Welcome to Chirality AI App development! This guide provides everything you need to know about contributing to our systematic document generation and RAG-enhanced chat platform.

## Project Philosophy

Chirality AI App embodies the Chirality Framework's core principle: **systematic semantic operations produce superior results to ad-hoc approaches**. This philosophy extends to our development process, where structured methodologies guide code quality, documentation, and collaboration.

### Core Values
- **Systematic Approach**: Structured processes over ad-hoc solutions
- **Quality First**: Comprehensive testing and validation
- **User-Centered Design**: Features driven by user value and experience
- **Documentation as Code**: Living documentation that evolves with the system
- **Continuous Improvement**: Regular refinement based on evidence and feedback

## Getting Started

### Prerequisites
- **Node.js 18+** with npm
- **OpenAI API Key** for document generation and chat functionality
- **Git** for version control
- **Code Editor** with TypeScript support (VS Code recommended)

### Development Setup

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd chirality-ai-app
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your OpenAI API key
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Verify Setup**
   - Navigate to `http://localhost:3001`
   - Test document generation in `/chirality-core`
   - Test chat interface on main page

### Project Structure Understanding

Before contributing, familiarize yourself with the architecture:

```
src/
├── app/                          # Next.js App Router
│   ├── chirality-core/          # Document generation interface
│   ├── chat-admin/              # Admin dashboard
│   └── api/                     # Backend API routes
├── chirality-core/              # Core document generation logic
├── components/                  # Reusable React components
├── lib/                         # Utility libraries
└── types/                       # TypeScript definitions
```

**Key Files to Understand**:
- [`src/chirality-core/orchestrate.ts`](src/chirality-core/orchestrate.ts) - Two-pass generation logic
- [`src/app/api/chat/stream/route.ts`](src/app/api/chat/stream/route.ts) - RAG chat implementation
- [`src/components/chat/ChatWindow.tsx`](src/components/chat/ChatWindow.tsx) - Main chat interface

## Development Workflow

### Branching Strategy

We use a simplified Git flow optimized for systematic development:

- **`main`**: Production-ready code, always deployable
- **`develop`**: Integration branch for features
- **`feature/<name>`**: Individual feature development
- **`fix/<name>`**: Bug fixes
- **`docs/<name>`**: Documentation updates

### Pull Request Process

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Development with Documentation Assessment**
   ```bash
   git commit -m "feat: implement feature description

   Documentation Assessment: STANDARD_UPDATE
   Scope: TECHNICAL_ACCURACY, USER_EXPERIENCE
   Methodology: FEATURE_DOCUMENTATION

   Detailed description of changes and impact."
   ```

3. **Testing Requirements**
   ```bash
   npm run type-check    # TypeScript validation
   npm run lint          # Code quality checks
   npm run test          # Unit tests (when implemented)
   ```

4. **Pull Request Creation**
   - Clear title describing the change
   - Comprehensive description with motivation and implementation details
   - Reference to related issues or feature requests
   - Screenshots for UI changes
   - Documentation updates included

5. **Review Process**
   - Code review by team member
   - Documentation review for user-facing changes
   - Manual testing of affected functionality
   - Automated validation (CI/CD when implemented)

### Code Quality Standards

#### TypeScript Guidelines
```typescript
// ✅ Good: Explicit types with comprehensive interfaces
interface DocumentGenerationRequest {
  kind: 'DS' | 'SP' | 'X' | 'M';
  context?: Record<string, any>;
  options?: GenerationOptions;
}

// ❌ Avoid: Implicit any types
function generateDocument(request: any) { ... }

// ✅ Good: Type-safe error handling
function handleApiError(error: unknown): ApiError {
  if (error instanceof Error) {
    return { message: error.message, type: 'client_error' };
  }
  return { message: 'Unknown error', type: 'unknown_error' };
}
```

#### React Component Patterns
```tsx
// ✅ Good: Explicit props interface with JSDoc
interface ChatMessageProps {
  /** Message content to display */
  content: string;
  /** Message author information */
  author: 'user' | 'assistant';
  /** Optional timestamp for message */
  timestamp?: string;
}

export function ChatMessage({ content, author, timestamp }: ChatMessageProps) {
  return (
    <div className={`message ${author}`}>
      {content}
      {timestamp && <span className="timestamp">{timestamp}</span>}
    </div>
  );
}

// ✅ Good: Error boundaries for resilience
export function ChatWindow() {
  return (
    <ErrorBoundary fallback={<ChatErrorFallback />}>
      <ChatMessages />
      <ChatInput />
    </ErrorBoundary>
  );
}
```

#### API Route Standards
```typescript
// ✅ Good: Comprehensive error handling with types
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Input validation
    if (!isValidDocumentRequest(body)) {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }

    const result = await processDocumentGeneration(body);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Document generation error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error', timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
```

### Testing Strategy

#### Unit Testing (Planned Implementation)
```typescript
// Example test structure for components
describe('ChatMessage', () => {
  it('renders user messages correctly', () => {
    render(
      <ChatMessage 
        content="Test message" 
        author="user" 
        timestamp="2025-08-17T09:00:00Z" 
      />
    );
    
    expect(screen.getByText('Test message')).toBeInTheDocument();
    expect(screen.getByText('2025-08-17T09:00:00Z')).toBeInTheDocument();
  });

  it('handles assistant messages with proper styling', () => {
    render(<ChatMessage content="AI response" author="assistant" />);
    
    const message = screen.getByText('AI response');
    expect(message.closest('.message')).toHaveClass('assistant');
  });
});

// Example test for document generation logic
describe('Document Generation', () => {
  it('generates DS document with required fields', async () => {
    const result = await generateDocument('DS', 'test problem', {});
    
    expect(result.text).toBeInstanceOf(Array);
    expect(result.text[0]).toHaveProperty('data_field');
    expect(result.terms_used).toBeInstanceOf(Array);
    expect(result.warnings).toBeInstanceOf(Array);
  });
});
```

#### Integration Testing Approach
- **Document Generation Workflows**: Complete two-pass generation cycles
- **Chat Integration**: RAG context injection and response streaming
- **API Endpoints**: Request/response validation and error handling
- **State Management**: File-based persistence consistency

#### Manual Testing Checklist
- [ ] Document generation (single-pass and two-pass modes)
- [ ] Chat interface with document context
- [ ] Admin dashboard functionality
- [ ] Error handling and recovery
- [ ] Cross-browser compatibility (Chrome, Firefox, Safari, Edge)
- [ ] Mobile responsiveness

## Contribution Types

### Feature Development

#### Two-Pass Generation Enhancements
- **Document Type Extensions**: New document types beyond DS/SP/X/M
- **Generation Optimization**: Performance improvements for document creation
- **Quality Metrics**: Automated assessment of document coherence
- **Refinement Algorithms**: Enhanced cross-referential improvement logic

#### Chat Interface Improvements
- **Advanced RAG**: Vector similarity search within documents
- **Context Management**: Improved document injection strategies
- **User Experience**: Enhanced interaction patterns and visual design
- **Multi-Modal Support**: Image and file integration with chat

#### Platform Features
- **User Authentication**: Multi-user support with document isolation
- **Collaboration**: Real-time document sharing and editing
- **Export Capabilities**: Multiple document formats and sharing options
- **Analytics**: Usage tracking and document quality metrics

### Bug Fixes

#### Reporting Bugs
Use the bug report template:
```markdown
## Bug Description
Clear description of the issue

## Steps to Reproduce
1. Step one
2. Step two
3. Expected vs actual behavior

## Environment
- Browser: Chrome 91.0.4472.124
- OS: macOS 11.4
- Node.js: 18.16.0

## Additional Context
Any relevant logs, screenshots, or additional information
```

#### Bug Fix Guidelines
- **Root Cause Analysis**: Understand the underlying issue before fixing
- **Minimal Change**: Fix only what's necessary to resolve the issue
- **Test Coverage**: Add tests to prevent regression
- **Documentation Update**: Update relevant documentation if behavior changes

### Documentation Contributions

#### Documentation Standards
- **Accuracy**: All examples must work when copy-pasted
- **Completeness**: Cover all use cases and edge conditions
- **Clarity**: Write for the intended audience with appropriate technical depth
- **Currency**: Keep documentation synchronized with code changes

#### Documentation Types
- **User Guides**: Step-by-step instructions for common tasks
- **API Documentation**: Comprehensive endpoint references with examples
- **Architecture Documentation**: System design and technical implementation
- **Troubleshooting Guides**: Common issues and their solutions

#### Documentation Process
1. **Follow Documentation Assessment**: Include assessment in commit messages
2. **Cross-Reference Validation**: Ensure all links and references work
3. **Example Validation**: Test all code examples
4. **Review for Consistency**: Maintain consistent terminology and style

## Specialized Contribution Areas

### LLM Integration Development

#### Adding New Model Providers
```typescript
// Interface pattern for new providers
interface LLMProvider {
  name: string;
  generateDocument(
    prompt: string, 
    options: GenerationOptions
  ): Promise<LLMResponse>;
  
  streamChat(
    messages: ChatMessage[], 
    context: DocumentContext
  ): AsyncIterable<string>;
}

// Implementation example
class AnthropicProvider implements LLMProvider {
  name = 'anthropic';
  
  async generateDocument(prompt: string, options: GenerationOptions) {
    // Implementation details
  }
  
  async* streamChat(messages: ChatMessage[], context: DocumentContext) {
    // Streaming implementation
  }
}
```

#### Generation Algorithm Improvements
- **Prompt Engineering**: Enhanced system and user prompts for better quality
- **Context Management**: Optimal document context injection strategies
- **Error Recovery**: Graceful handling of LLM API failures
- **Cost Optimization**: Token usage optimization and caching strategies

### UI/UX Development

#### Component Development Standards
- **Accessibility**: WCAG 2.1 compliance with proper ARIA labels
- **Responsive Design**: Mobile-first approach with progressive enhancement
- **Performance**: Lazy loading and code splitting for optimal performance
- **Design System**: Consistent with established Tailwind CSS patterns

#### Chat Interface Enhancements
- **Real-time Indicators**: Enhanced typing indicators and status feedback
- **Message Management**: Message editing, deletion, and conversation history
- **File Handling**: Drag-and-drop file upload and processing
- **Keyboard Shortcuts**: Power user features for efficient interaction

### Backend Development

#### API Development Guidelines
- **RESTful Design**: Consistent endpoint naming and HTTP methods
- **Error Handling**: Comprehensive error responses with appropriate status codes
- **Validation**: Input validation with clear error messages
- **Documentation**: OpenAPI/Swagger documentation for all endpoints

#### State Management Enhancements
- **Concurrency Handling**: Safe concurrent access to file-based storage
- **Backup and Recovery**: Automated backup and state recovery mechanisms
- **Migration Support**: Version migration for state format changes
- **Performance Optimization**: Efficient state loading and saving

## Release Process

### Version Numbering
We follow semantic versioning (SemVer):
- **MAJOR**: Breaking changes to API or core functionality
- **MINOR**: New features with backward compatibility
- **PATCH**: Bug fixes and small improvements

### Release Checklist
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Performance regression testing
- [ ] Security vulnerability scanning
- [ ] User acceptance testing
- [ ] Deployment verification

### Change Documentation
- Update CHANGELOG.md with all user-facing changes
- Create release notes highlighting key improvements
- Update API documentation for any endpoint changes
- Communicate breaking changes clearly to users

## Community Guidelines

### Code of Conduct
- **Respectful Communication**: Professional and constructive feedback
- **Inclusive Environment**: Welcoming to contributors of all backgrounds
- **Collaborative Spirit**: Focus on project success and user value
- **Learning Culture**: Encourage questions and knowledge sharing

### Getting Help
- **Technical Questions**: Create GitHub issues with detailed context
- **Architecture Discussions**: Use GitHub discussions for design conversations
- **Documentation Issues**: Report unclear or incorrect documentation
- **Feature Requests**: Propose new features with use cases and rationale

### Recognition
Contributors are recognized through:
- **Commit Attribution**: Clear attribution in git history
- **Release Notes**: Contributor acknowledgment in release documentation
- **Documentation**: Contributors section maintenance
- **Community**: Public appreciation for significant contributions

## Advanced Topics

### Performance Optimization
- **Bundle Analysis**: Regular bundle size monitoring and optimization
- **API Performance**: Response time monitoring and optimization
- **Memory Management**: Efficient state and component memory usage
- **Caching Strategies**: Intelligent caching for documents and API responses

### Security Considerations
- **Input Validation**: Comprehensive sanitization of user inputs
- **API Security**: Rate limiting and abuse prevention
- **Data Protection**: Secure handling of user-generated content
- **Dependency Management**: Regular security updates and vulnerability scanning

### Monitoring and Observability
- **Error Tracking**: Comprehensive error monitoring and alerting
- **Performance Monitoring**: Application performance tracking
- **Usage Analytics**: User behavior and feature adoption tracking
- **Health Checks**: System health monitoring and automated recovery

---

*This contributing guide reflects the systematic approach to development that embodies the Chirality Framework's principles of structured, quality-focused collaboration. It evolves with the project to maintain relevance and effectiveness.*