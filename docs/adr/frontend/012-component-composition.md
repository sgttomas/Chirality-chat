# ADR-012: React Component Composition Architecture

**Status**: Accepted  
**Date**: 2024-01-15  
**Deciders**: Frontend Team  

## Context

The Chirality Chat application requires a scalable, maintainable component architecture that supports:
- Complex chat interfaces with real-time updates
- Document generation workflows with multiple states
- Reusable UI components across different features
- Type-safe prop passing and state management
- Accessibility and responsive design requirements

We need to establish clear patterns for component composition, state flow, and reusability that will scale as the application grows.

## Decision

We will implement a **composition-over-inheritance** architecture using React's modern patterns:
- **Compound Components** for complex UI patterns
- **Render Props** and **Custom Hooks** for logic reuse
- **Higher-Order Components (HOCs)** sparingly, only for cross-cutting concerns
- **Context Providers** for localized state sharing
- **Atomic Design** methodology for component organization

## Rationale

### Composition Benefits

1. **Flexibility**: Components can be combined in different ways
2. **Reusability**: Logic and UI can be shared across features
3. **Maintainability**: Clear separation of concerns
4. **Type Safety**: TypeScript integration with composition patterns
5. **Testing**: Easier to test individual pieces in isolation

### Component Architecture Patterns

#### 1. Atomic Design Structure
```
components/
├── atoms/              # Basic building blocks
│   ├── Button/
│   ├── Input/
│   ├── Icon/
│   └── Typography/
├── molecules/          # Simple combinations of atoms
│   ├── InputGroup/
│   ├── MessageBubble/
│   ├── SearchBox/
│   └── ProgressBar/
├── organisms/          # Complex UI components
│   ├── ChatWindow/
│   ├── DocumentViewer/
│   ├── NavigationBar/
│   └── SettingsPanel/
├── templates/          # Page-level layouts
│   ├── ChatLayout/
│   ├── DocumentLayout/
│   └── AdminLayout/
└── pages/              # Specific page implementations
    ├── ChatPage/
    ├── DocumentPage/
    └── AdminPage/
```

#### 2. Compound Components Pattern
```typescript
// components/organisms/ChatWindow/index.tsx
interface ChatWindowProps {
  conversationId?: string;
  className?: string;
  children?: React.ReactNode;
}

function ChatWindowRoot({ conversationId, className, children }: ChatWindowProps) {
  const { messages, sendMessage, isStreaming } = useChat(conversationId);
  
  const contextValue = {
    messages,
    sendMessage,
    isStreaming,
    conversationId
  };
  
  return (
    <ChatContext.Provider value={contextValue}>
      <div className={clsx('chat-window', className)}>
        {children}
      </div>
    </ChatContext.Provider>
  );
}

function ChatHeader({ children }: { children?: React.ReactNode }) {
  const { conversationId } = useChatContext();
  
  return (
    <header className="chat-header">
      <h2>Conversation {conversationId || 'New'}</h2>
      {children}
    </header>
  );
}

function ChatMessages({ className }: { className?: string }) {
  const { messages } = useChatContext();
  
  return (
    <div className={clsx('chat-messages', className)}>
      {messages.map(message => (
        <MessageBubble key={message.id} message={message} />
      ))}
    </div>
  );
}

function ChatInput({ placeholder, disabled }: { 
  placeholder?: string; 
  disabled?: boolean; 
}) {
  const { sendMessage, isStreaming } = useChatContext();
  const [input, setInput] = useState('');
  
  const handleSubmit = useCallback((e: FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage(input.trim());
      setInput('');
    }
  }, [input, sendMessage]);
  
  return (
    <form onSubmit={handleSubmit} className="chat-input-form">
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={placeholder || "Type a message..."}
        disabled={disabled || isStreaming}
      />
      <Button 
        type="submit" 
        disabled={!input.trim() || isStreaming}
        variant="primary"
      >
        Send
      </Button>
    </form>
  );
}

// Compound component pattern
export const ChatWindow = Object.assign(ChatWindowRoot, {
  Header: ChatHeader,
  Messages: ChatMessages,
  Input: ChatInput
});

// Usage
function ChatPage() {
  return (
    <ChatWindow conversationId="123" className="h-full">
      <ChatWindow.Header>
        <Button variant="ghost" size="sm">Settings</Button>
      </ChatWindow.Header>
      <ChatWindow.Messages className="flex-1" />
      <ChatWindow.Input />
    </ChatWindow>
  );
}
```

#### 3. Custom Hooks for Logic Reuse
```typescript
// hooks/use-chat.ts
interface UseChatOptions {
  onMessageReceived?: (message: Message) => void;
  onError?: (error: string) => void;
}

export function useChat(conversationId?: string, options: UseChatOptions = {}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { connect, disconnect } = useSSEStream('/api/chat/stream', {
    onMessage: (content) => {
      // Update streaming message
      setMessages(prev => 
        prev.map(msg => 
          msg.streaming ? { ...msg, content } : msg
        )
      );
    },
    onComplete: (content) => {
      // Finalize message
      setMessages(prev => 
        prev.map(msg => 
          msg.streaming ? { ...msg, content, streaming: false } : msg
        )
      );
      setIsStreaming(false);
      options.onMessageReceived?.(/* final message */);
    },
    onError: (error) => {
      setError(error);
      setIsStreaming(false);
      options.onError?.(error);
    }
  });
  
  const sendMessage = useCallback(async (content: string) => {
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: new Date()
    };
    
    const assistantMessage: Message = {
      id: generateId(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      streaming: true
    };
    
    setMessages(prev => [...prev, userMessage, assistantMessage]);
    setIsStreaming(true);
    setError(null);
    
    await connect({ message: content, conversationId });
  }, [connect, conversationId]);
  
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);
  
  return {
    messages,
    sendMessage,
    clearMessages,
    isStreaming,
    error
  };
}

// hooks/use-document-generation.ts
export function useDocumentGeneration() {
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const generateDocument = useCallback(async (params: GenerationParams) => {
    setIsGenerating(true);
    setGenerationProgress(0);
    
    try {
      // Use SSE for progress updates
      const { connect } = useSSEStream('/api/documents/generate');
      
      await connect({
        type: params.type,
        problem: params.problem,
        context: params.context
      });
      
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setIsGenerating(false);
      setGenerationProgress(100);
    }
  }, []);
  
  return {
    currentDocument,
    generationProgress,
    isGenerating,
    generateDocument
  };
}
```

#### 4. Render Props Pattern
```typescript
// components/molecules/LoadingWrapper.tsx
interface LoadingWrapperProps<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  loadingComponent?: React.ReactNode;
  errorComponent?: (error: string) => React.ReactNode;
  children: (data: T) => React.ReactNode;
}

export function LoadingWrapper<T>({
  data,
  isLoading,
  error,
  loadingComponent,
  errorComponent,
  children
}: LoadingWrapperProps<T>) {
  if (isLoading) {
    return loadingComponent || <LoadingSpinner />;
  }
  
  if (error) {
    return errorComponent?.(error) || <ErrorMessage message={error} />;
  }
  
  if (!data) {
    return <div>No data available</div>;
  }
  
  return <>{children(data)}</>;
}

// Usage
function DocumentViewer({ documentId }: { documentId: string }) {
  const { data, isLoading, error } = useDocument(documentId);
  
  return (
    <LoadingWrapper
      data={data}
      isLoading={isLoading}
      error={error}
      loadingComponent={<DocumentSkeleton />}
      errorComponent={(error) => (
        <ErrorBoundary>
          <p>Failed to load document: {error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </ErrorBoundary>
      )}
    >
      {(document) => (
        <div className="document-content">
          <h1>{document.title}</h1>
          <DocumentContent content={document.content} />
        </div>
      )}
    </LoadingWrapper>
  );
}
```

#### 5. Higher-Order Components (Sparingly)
```typescript
// hocs/withErrorBoundary.tsx
interface WithErrorBoundaryOptions {
  fallback?: React.ComponentType<{ error: Error }>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options: WithErrorBoundaryOptions = {}
) {
  const WrappedComponent = (props: P) => {
    return (
      <ErrorBoundary
        fallback={options.fallback}
        onError={options.onError}
      >
        <Component {...props} />
      </ErrorBoundary>
    );
  };
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Usage
const SafeChatWindow = withErrorBoundary(ChatWindow, {
  fallback: ({ error }) => (
    <div className="error-fallback">
      <h2>Chat Error</h2>
      <p>{error.message}</p>
      <Button onClick={() => window.location.reload()}>
        Reload
      </Button>
    </div>
  )
});
```

### State Flow Architecture

#### Component-Level State
```typescript
// For UI-only state that doesn't need to be shared
function SearchBox() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="relative">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setIsOpen(true)}
      />
      {isOpen && query && (
        <SearchResults query={query} onClose={() => setIsOpen(false)} />
      )}
    </div>
  );
}
```

#### Context for Component Trees
```typescript
// contexts/DocumentContext.tsx
interface DocumentContextType {
  currentDocument: Document | null;
  isEditing: boolean;
  setEditing: (editing: boolean) => void;
  saveDocument: (document: Document) => Promise<void>;
}

const DocumentContext = createContext<DocumentContextType | null>(null);

export function DocumentProvider({ children }: { children: React.ReactNode }) {
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const saveDocument = useCallback(async (document: Document) => {
    // Save logic
    setCurrentDocument(document);
    setIsEditing(false);
  }, []);
  
  const value = {
    currentDocument,
    isEditing,
    setEditing: setIsEditing,
    saveDocument
  };
  
  return (
    <DocumentContext.Provider value={value}>
      {children}
    </DocumentContext.Provider>
  );
}

export function useDocumentContext() {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error('useDocumentContext must be used within DocumentProvider');
  }
  return context;
}
```

#### Global State with Zustand
```typescript
// For application-wide state
const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  activeConversationId: null,
  
  addConversation: (conversation) => 
    set((state) => ({
      conversations: [...state.conversations, conversation]
    })),
    
  setActiveConversation: (id) =>
    set({ activeConversationId: id })
}));
```

### Accessibility Patterns

#### Accessible Compound Components
```typescript
// components/organisms/Modal/index.tsx
function ModalRoot({ isOpen, onClose, children }: ModalProps) {
  const modalId = useId();
  const titleId = `${modalId}-title`;
  const descriptionId = `${modalId}-description`;
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Focus management
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  return (
    <div 
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <ModalContext.Provider value={{ titleId, descriptionId, onClose }}>
        <div className="modal-content">
          {children}
        </div>
      </ModalContext.Provider>
    </div>
  );
}

function ModalTitle({ children }: { children: React.ReactNode }) {
  const { titleId } = useModalContext();
  
  return (
    <h2 id={titleId} className="modal-title">
      {children}
    </h2>
  );
}

function ModalDescription({ children }: { children: React.ReactNode }) {
  const { descriptionId } = useModalContext();
  
  return (
    <p id={descriptionId} className="modal-description">
      {children}
    </p>
  );
}

export const Modal = Object.assign(ModalRoot, {
  Title: ModalTitle,
  Description: ModalDescription,
  Footer: ModalFooter
});
```

### Performance Optimization Patterns

#### React.memo for Expensive Components
```typescript
// components/molecules/MessageBubble.tsx
interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
}

export const MessageBubble = memo(({ message, isStreaming }: MessageBubbleProps) => {
  const bubbleClasses = useMemo(() => 
    clsx(
      'message-bubble',
      `message-${message.role}`,
      { 'streaming': isStreaming }
    ),
    [message.role, isStreaming]
  );
  
  return (
    <div className={bubbleClasses}>
      <div className="message-content">
        {message.content}
      </div>
      <div className="message-timestamp">
        {formatTimestamp(message.timestamp)}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for optimization
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.isStreaming === nextProps.isStreaming
  );
});
```

#### Virtual Scrolling for Large Lists
```typescript
// components/organisms/VirtualMessageList.tsx
interface VirtualMessageListProps {
  messages: Message[];
  height: number;
  itemHeight: number;
}

export function VirtualMessageList({ messages, height, itemHeight }: VirtualMessageListProps) {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.min(
      start + Math.ceil(height / itemHeight) + 1,
      messages.length
    );
    return { start, end };
  }, [scrollTop, itemHeight, height, messages.length]);
  
  const visibleMessages = useMemo(() => 
    messages.slice(visibleRange.start, visibleRange.end),
    [messages, visibleRange]
  );
  
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);
  
  return (
    <div 
      className="virtual-list"
      style={{ height, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      <div style={{ height: messages.length * itemHeight, position: 'relative' }}>
        {visibleMessages.map((message, index) => (
          <div
            key={message.id}
            style={{
              position: 'absolute',
              top: (visibleRange.start + index) * itemHeight,
              height: itemHeight
            }}
          >
            <MessageBubble message={message} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Testing Strategies

### Component Testing
```typescript
// __tests__/ChatWindow.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatWindow } from '@/components/organisms/ChatWindow';

describe('ChatWindow', () => {
  test('compound component renders correctly', () => {
    render(
      <ChatWindow>
        <ChatWindow.Header>Chat Header</ChatWindow.Header>
        <ChatWindow.Messages />
        <ChatWindow.Input />
      </ChatWindow>
    );
    
    expect(screen.getByText('Chat Header')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
  });
  
  test('sends message when form is submitted', async () => {
    const user = userEvent.setup();
    
    render(
      <ChatWindow>
        <ChatWindow.Messages />
        <ChatWindow.Input />
      </ChatWindow>
    );
    
    const input = screen.getByPlaceholderText('Type a message...');
    const button = screen.getByRole('button', { name: 'Send' });
    
    await user.type(input, 'Hello, world!');
    await user.click(button);
    
    // Assert message was sent (mock the hook)
  });
});
```

### Custom Hook Testing
```typescript
// __tests__/use-chat.test.ts
import { renderHook, act } from '@testing-library/react';
import { useChat } from '@/hooks/use-chat';

describe('useChat', () => {
  test('sends message and updates state', async () => {
    const { result } = renderHook(() => useChat());
    
    await act(async () => {
      await result.current.sendMessage('Test message');
    });
    
    expect(result.current.messages).toHaveLength(2); // User + Assistant messages
    expect(result.current.isStreaming).toBe(true);
  });
});
```

## Style Guide & Conventions

### Component File Structure
```
ComponentName/
├── index.ts                # Main export
├── ComponentName.tsx       # Main component
├── ComponentName.types.ts  # TypeScript interfaces
├── ComponentName.test.tsx  # Tests
├── ComponentName.stories.tsx # Storybook stories
└── components/             # Sub-components
    ├── SubComponent.tsx
    └── index.ts
```

### Naming Conventions
```typescript
// ✅ Component names: PascalCase
export function ChatWindow() {}
export function MessageBubble() {}

// ✅ Hook names: camelCase starting with 'use'
export function useChat() {}
export function useDocumentState() {}

// ✅ Props interfaces: ComponentNameProps
interface ChatWindowProps {}
interface MessageBubbleProps {}

// ✅ Event handlers: handle + EventType
const handleClick = () => {};
const handleSubmit = () => {};
const handleChange = () => {};
```

### Prop Patterns
```typescript
// ✅ Use children for composition
interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

// ✅ Use render props for flexible rendering
interface DataTableProps<T> {
  data: T[];
  renderRow: (item: T, index: number) => React.ReactNode;
  renderEmpty?: () => React.ReactNode;
}

// ✅ Use discriminated unions for variants
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost';
  size: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}
```

## Alternatives Considered

### Class-Based Components
- **Pros**: Familiar object-oriented patterns, lifecycle methods
- **Cons**: More verbose, harder to test, no hooks support
- **Verdict**: Function components with hooks are more modern and flexible

### Component Libraries (Material-UI, Chakra UI)
- **Pros**: Pre-built components, consistent design, accessibility
- **Cons**: Bundle size, customization limitations, design constraints
- **Verdict**: Custom components give us more control over design and performance

### CSS-in-JS Component Libraries (Styled Components)
- **Pros**: Dynamic styling, theme integration
- **Cons**: Runtime overhead, complexity, SSR challenges
- **Verdict**: Tailwind CSS provides better performance and simpler patterns

## Consequences

### Positive
- **Flexibility**: Easy to compose components in different ways
- **Reusability**: Logic and UI patterns can be shared across features
- **Maintainability**: Clear separation of concerns and predictable patterns
- **Type Safety**: Strong TypeScript integration throughout the component tree

### Negative
- **Learning Curve**: Team needs to understand composition patterns
- **Complexity**: Some patterns (compound components) can be complex to implement
- **Performance**: Need to be careful with re-renders and memoization

### Implementation Guidelines

1. **Start Simple**: Begin with basic function components, add patterns as needed
2. **Compose Gradually**: Build up complex components from simpler ones
3. **Test Thoroughly**: Test components in isolation and in composition
4. **Document Patterns**: Use Storybook to document component usage patterns

## Related Decisions

- **ADR-008**: Next.js App Router (component integration patterns)
- **ADR-009**: Zustand State Management (state flow in components)
- **ADR-010**: Tailwind CSS Design System (component styling)
- **ADR-011**: SSE Streaming Pattern (real-time component updates)

## References

- [React Composition Documentation](https://react.dev/learn/passing-props-to-a-component)
- [Compound Components Pattern](https://kentcdodds.com/blog/compound-components-with-react-hooks)
- [Atomic Design Methodology](https://bradfrost.com/blog/post/atomic-web-design/)
- [React Patterns](https://reactpatterns.com/)