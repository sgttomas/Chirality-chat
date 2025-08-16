# CLAUDE_FRONTEND.md

Frontend development guidance for Claude Code when working with the Chirality Chat application.

## Frontend Architecture Overview

Chirality Chat is a **modern React application** with Next.js 15 App Router, focusing on conversational AI interfaces and real-time document generation. This document provides Claude Code with essential context for frontend development tasks.

## Technology Stack & Patterns

### Core Technologies
- **Next.js 15.2.3** with App Router (NOT Pages Router)
- **React 18** with Concurrent Features and Suspense
- **TypeScript 5.4.5** in strict mode
- **Tailwind CSS 3.4** with custom design system
- **Zustand 5.0** for client state management
- **React Query (TanStack Query) 5.51** for server state

### Key Patterns to Follow
- **Component Composition** over inheritance
- **Custom hooks** for stateful logic
- **Server-Sent Events (SSE)** for real-time streaming
- **Progressive enhancement** for accessibility
- **Mobile-first** responsive design

## Project Structure (CRITICAL)

```
src/
├── app/                    # Next.js App Router pages (NOT pages/)
│   ├── (routes)/          # Route groups with parentheses
│   ├── api/               # API routes (backend endpoints)
│   ├── chat/              # Main chat interface
│   ├── chat-admin/        # Admin dashboard
│   └── chirality-core/    # Core document generation UI
├── components/            # Reusable UI components
│   ├── chat/              # Chat-specific components
│   ├── chirality/         # Chirality framework components  
│   ├── document/          # Document generation/viewing
│   ├── matrix/            # Matrix visualization components
│   └── ui/                # Base design system components
├── lib/                   # Utilities and configurations
│   ├── hooks/             # Custom React hooks
│   ├── stores/            # Zustand store definitions
│   ├── utils/             # Helper functions
│   └── types/             # TypeScript type definitions
└── styles/                # Global styles and Tailwind config
```

## Component Development Guidelines

### 1. Component Naming Conventions
```typescript
// ✅ CORRECT - PascalCase for components
export function ChatWindow() {}
export function DocumentViewer() {}
export function MessageBubble() {}

// ✅ CORRECT - camelCase for hooks  
export function useStream() {}
export function useDocumentState() {}

// ✅ CORRECT - kebab-case for files
// chat-window.tsx, document-viewer.tsx, message-bubble.tsx
```

### 2. Component Structure Pattern
```typescript
// Standard component template
interface ComponentProps {
  // Props interface first
  data: SomeType;
  onAction?: (value: string) => void;
  disabled?: boolean;
}

export function Component({ data, onAction, disabled = false }: ComponentProps) {
  // Hooks at the top
  const [state, setState] = useState();
  const { data: serverData } = useQuery();
  
  // Event handlers
  const handleClick = useCallback(() => {
    onAction?.(data.value);
  }, [onAction, data.value]);
  
  // Early returns for loading/error states
  if (!data) return <ComponentSkeleton />;
  
  // Main render
  return (
    <div className="component-wrapper">
      {/* JSX here */}
    </div>
  );
}

// Default export for lazy loading
export default Component;
```

### 3. TypeScript Patterns (MANDATORY)
```typescript
// ✅ Always use interfaces for props
interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
  onEdit?: (id: string, content: string) => void;
}

// ✅ Use strict typing for state
interface ChatState {
  messages: Message[];
  isConnected: boolean;
  error: string | null;
}

// ✅ Type event handlers properly
const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  // handler logic
};

// ❌ AVOID any types
// const data: any = response;
```

## State Management Patterns

### Zustand Store Pattern
```typescript
// stores/chat-store.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface ChatState {
  messages: Message[];
  isStreaming: boolean;
  
  // Actions grouped together
  addMessage: (message: Message) => void;
  setStreaming: (streaming: boolean) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    messages: [],
    isStreaming: false,
    
    // Actions use set() for updates
    addMessage: (message) => set((state) => ({
      messages: [...state.messages, message]
    })),
    
    setStreaming: (streaming) => set({ isStreaming: streaming }),
    
    clearMessages: () => set({ messages: [] })
  }))
);

// Usage in components
function ChatComponent() {
  const { messages, addMessage } = useChatStore();
  // component logic
}
```

### React Query Integration
```typescript
// hooks/use-documents.ts
export function useDocuments() {
  return useQuery({
    queryKey: ['documents'],
    queryFn: fetchDocuments,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  });
}

export function useDocument(id: string) {
  return useQuery({
    queryKey: ['document', id],
    queryFn: () => fetchDocument(id),
    enabled: !!id // Only fetch if id exists
  });
}

// Usage with loading states
function DocumentViewer({ id }: { id: string }) {
  const { data: document, isLoading, error } = useDocument(id);
  
  if (isLoading) return <DocumentSkeleton />;
  if (error) return <ErrorMessage error={error} />;
  
  return <div>{/* render document */}</div>;
}
```

## Styling Guidelines

### Tailwind CSS Patterns
```typescript
// ✅ CORRECT - Use Tailwind utility classes
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">
  <h2 className="text-xl font-semibold text-gray-900">Title</h2>
  <button className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700">
    Action
  </button>
</div>

// ✅ CORRECT - Conditional classes with clsx
import { clsx } from 'clsx';

const buttonClasses = clsx(
  'px-4 py-2 rounded font-medium transition-colors',
  {
    'bg-blue-600 text-white hover:bg-blue-700': variant === 'primary',
    'bg-gray-200 text-gray-900 hover:bg-gray-300': variant === 'secondary',
    'opacity-50 cursor-not-allowed': disabled
  }
);

// ✅ CORRECT - Responsive design mobile-first
<div className="w-full md:w-1/2 lg:w-1/3">
  <img className="w-full h-48 md:h-64 object-cover" />
</div>
```

### Design System Usage
```typescript
// Use consistent spacing scale
const SPACING = {
  xs: 'p-1',    // 4px
  sm: 'p-2',    // 8px  
  md: 'p-4',    // 16px
  lg: 'p-6',    // 24px
  xl: 'p-8'     // 32px
};

// Use semantic color names
const COLORS = {
  primary: 'bg-blue-600',
  secondary: 'bg-gray-600',
  success: 'bg-green-600',
  warning: 'bg-yellow-600',
  error: 'bg-red-600'
};
```

## Real-time Features (SSE Streaming)

### Server-Sent Events Pattern
```typescript
// hooks/use-stream.ts
export function useStream(endpoint: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [data, setData] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  const connect = useCallback(() => {
    const eventSource = new EventSource(endpoint);
    
    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
    };
    
    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        setData(prev => prev + parsed.content);
      } catch (err) {
        console.error('Failed to parse SSE data:', err);
      }
    };
    
    eventSource.onerror = () => {
      setError('Connection failed');
      setIsConnected(false);
      eventSource.close();
    };
    
    return () => {
      eventSource.close();
      setIsConnected(false);
    };
  }, [endpoint]);
  
  return { connect, isConnected, data, error };
}

// Usage in chat component
function ChatWindow() {
  const { connect, isConnected, data } = useStream('/api/chat/stream');
  
  const handleSendMessage = useCallback((message: string) => {
    connect(); // Start streaming
  }, [connect]);
  
  return (
    <div>
      {data && <MessageContent content={data} />}
      <ChatInput onSend={handleSendMessage} disabled={!isConnected} />
    </div>
  );
}
```

## Accessibility Requirements (MANDATORY)

### WCAG 2.1 AA Compliance
```typescript
// ✅ CORRECT - Semantic HTML and ARIA
<button 
  aria-label="Send message"
  aria-disabled={isLoading}
  className="focus:ring-2 focus:ring-blue-500 focus:outline-none"
>
  {isLoading ? 'Sending...' : 'Send'}
</button>

// ✅ CORRECT - Keyboard navigation
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    handleSubmit();
  }
};

// ✅ CORRECT - Screen reader support
<div role="status" aria-live="polite">
  {isLoading && <span className="sr-only">Loading message...</span>}
</div>

// ✅ CORRECT - Focus management
const dialogRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  if (isOpen) {
    dialogRef.current?.focus();
  }
}, [isOpen]);
```

### Color and Contrast
```typescript
// ✅ Use high contrast ratios
const TEXT_COLORS = {
  primary: 'text-gray-900',     // High contrast on light backgrounds
  secondary: 'text-gray-600',   // Medium contrast for less important text
  inverse: 'text-white',        // High contrast on dark backgrounds
  link: 'text-blue-600'         // Accessible blue for links
};

// ✅ Provide visual focus indicators
const FOCUS_STYLES = 'focus:ring-2 focus:ring-blue-500 focus:outline-none';
```

## Performance Best Practices

### Code Splitting & Lazy Loading
```typescript
// ✅ Route-based code splitting
const AdminDashboard = lazy(() => import('./admin-dashboard'));

function App() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Suspense>
  );
}

// ✅ Component-based code splitting
const HeavyChart = lazy(() => import('./heavy-chart'));

function Dashboard() {
  const [showChart, setShowChart] = useState(false);
  
  return (
    <div>
      {showChart && (
        <Suspense fallback={<ChartSkeleton />}>
          <HeavyChart />
        </Suspense>
      )}
    </div>
  );
}
```

### Memoization Patterns
```typescript
// ✅ Memoize expensive computations
const DocumentStats = memo(({ documents }: { documents: Document[] }) => {
  const stats = useMemo(() => {
    return calculateDocumentStatistics(documents);
  }, [documents]);
  
  return <StatsDisplay stats={stats} />;
});

// ✅ Memoize callback functions
function DocumentList({ documents, onSelect }: DocumentListProps) {
  const handleSelect = useCallback((id: string) => {
    onSelect(id);
  }, [onSelect]);
  
  return (
    <div>
      {documents.map(doc => (
        <DocumentItem 
          key={doc.id} 
          document={doc} 
          onSelect={handleSelect} 
        />
      ))}
    </div>
  );
}
```

## Error Handling Patterns

### Error Boundaries
```typescript
// components/error-boundary.tsx
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Send to error reporting service
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    
    return this.props.children;
  }
}

// Usage
<ErrorBoundary>
  <ChatWindow />
</ErrorBoundary>
```

### Async Error Handling
```typescript
// ✅ Handle API errors gracefully
function useDocumentMutation() {
  return useMutation({
    mutationFn: createDocument,
    onError: (error) => {
      toast.error(`Failed to create document: ${error.message}`);
    },
    onSuccess: () => {
      toast.success('Document created successfully');
    }
  });
}
```

## Testing Patterns

### Component Testing
```typescript
// __tests__/chat-input.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatInput } from '../chat-input';

describe('ChatInput', () => {
  test('submits message on Enter key', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    
    render(<ChatInput onSubmit={onSubmit} />);
    
    const input = screen.getByPlaceholderText('Type a message...');
    await user.type(input, 'Hello world');
    await user.keyboard('{Enter}');
    
    expect(onSubmit).toHaveBeenCalledWith('Hello world');
  });
  
  test('does not submit empty messages', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    
    render(<ChatInput onSubmit={onSubmit} />);
    
    const input = screen.getByPlaceholderText('Type a message...');
    await user.keyboard('{Enter}');
    
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
```

## Development Workflow

### Git Conventions
```bash
# ✅ Feature branch naming
git checkout -b feature/chat-streaming
git checkout -b fix/document-export-bug  
git checkout -b refactor/component-architecture

# ✅ Commit message format
git commit -m "feat(chat): add real-time message streaming"
git commit -m "fix(document): resolve export format issue"
git commit -m "refactor(ui): extract reusable button component"
```

### Code Review Checklist
- [ ] **TypeScript** - No `any` types, proper interfaces
- [ ] **Accessibility** - ARIA labels, keyboard navigation, contrast
- [ ] **Performance** - Proper memoization, code splitting
- [ ] **Testing** - Unit tests for complex logic
- [ ] **Responsive** - Mobile-first design verified
- [ ] **Error Handling** - Graceful failure scenarios

## API Integration Patterns

### Next.js API Routes
```typescript
// app/api/documents/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    
    const documents = await fetchDocuments({ query });
    
    return NextResponse.json({ documents });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const document = await createDocument(body);
    
    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create document' },
      { status: 400 }
    );
  }
}
```

### Client-side API Calls
```typescript
// lib/api/documents.ts
export async function fetchDocuments(params?: { query?: string }) {
  const url = new URL('/api/documents', window.location.origin);
  if (params?.query) {
    url.searchParams.set('q', params.query);
  }
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch documents');
  }
  
  return response.json();
}
```

## Important Implementation Notes

### 1. SSE Streaming (Critical for Chat)
- Always use **EventSource** for real-time streaming
- Implement **reconnection logic** for dropped connections  
- Handle **partial JSON** parsing for streaming responses
- Use **content accumulation** pattern to prevent message loss

### 2. Document Generation UI
- **Real-time updates** during generation process
- **Progress indicators** for multi-step operations
- **Error recovery** for failed generation attempts
- **Export functionality** with multiple format support

### 3. State Persistence
- Use **localStorage** for client-side preferences
- Implement **optimistic updates** for better UX
- Handle **offline scenarios** gracefully
- **Sync state** between multiple tabs/windows

### 4. Performance Considerations
- **Virtualize** large document lists
- **Debounce** search inputs and API calls
- **Lazy load** heavy components and charts
- **Preload** critical route data

## Common Pitfalls to Avoid

### ❌ Don't Do This
```typescript
// ❌ Using any types
const data: any = response.data;

// ❌ Inline styles instead of Tailwind
<div style={{ padding: '16px', backgroundColor: 'blue' }}>

// ❌ Missing dependency arrays
useEffect(() => {
  fetchData();
}); // Missing dependency array

// ❌ Mutating state directly
setState(state => {
  state.items.push(newItem); // Mutating state
  return state;
});
```

### ✅ Do This Instead
```typescript
// ✅ Proper TypeScript
interface ApiResponse {
  data: Document[];
  status: string;
}
const response: ApiResponse = await fetchDocuments();

// ✅ Tailwind classes
<div className="p-4 bg-blue-600">

// ✅ Proper dependency arrays
useEffect(() => {
  fetchData();
}, [searchQuery]); // Include dependencies

// ✅ Immutable state updates
setState(state => ({
  ...state,
  items: [...state.items, newItem]
}));
```

## Resources & Documentation

### Essential Links
- [Next.js App Router](https://nextjs.org/docs/app) - App Router patterns
- [React 18 Docs](https://react.dev) - Latest React features
- [Tailwind CSS](https://tailwindcss.com/docs) - Utility-first CSS
- [Zustand Guide](https://docs.pmnd.rs/zustand/getting-started/introduction) - State management
- [React Query](https://tanstack.com/query/latest) - Server state management

### Development Tools
- **React DevTools** - Component debugging
- **Accessibility Insights** - WCAG compliance checking
- **Lighthouse** - Performance auditing  
- **Next.js Bundle Analyzer** - Bundle size analysis

---

This document should be your primary reference for all frontend development tasks in the Chirality Chat application. Follow these patterns consistently to maintain code quality and user experience standards.