# Frontend Development Guide

## Overview

The Chirality Chat frontend is a modern React application built with Next.js 15, providing a conversational AI interface for semantic document generation and knowledge management. This document outlines the frontend architecture, development priorities, and implementation patterns.

## Technology Stack

### Core Framework
- **Next.js 15.2.3** with App Router
- **React 18** with Concurrent Features
- **TypeScript 5.4.5** for type safety
- **Tailwind CSS 3.4** for styling

### State Management
- **Zustand 5.0** for client state
- **React Query (TanStack Query) 5.51** for server state
- **File-based persistence** for document state

### Real-time Features  
- **Server-Sent Events (SSE)** for streaming responses
- **WebSocket** integration for live updates
- **Progressive enhancement** for offline scenarios

### Development Tools
- **ESLint** with Next.js configuration
- **TypeScript** strict mode
- **Turbopack** for fast development builds
- **Chrome DevTools** integration

## Architecture Principles

### 1. Component Composition
- **Atomic Design** methodology (atoms → molecules → organisms)
- **Compound components** for complex UI patterns  
- **Render props** and **custom hooks** for logic reuse
- **Error boundaries** for graceful failure handling

### 2. Data Flow Patterns
- **Unidirectional data flow** with React
- **Server state** managed by React Query
- **Client state** managed by Zustand stores
- **Event-driven** communication between components

### 3. Performance Optimization
- **Code splitting** with dynamic imports
- **React.memo** and **useMemo** for expensive operations
- **Virtual scrolling** for large datasets
- **Image optimization** with Next.js Image component

### 4. Accessibility First
- **WCAG 2.1 AA compliance**
- **Keyboard navigation** support
- **Screen reader** optimization
- **High contrast** and **reduced motion** preferences

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Route groups
│   ├── api/               # API routes
│   ├── chat/              # Chat interface
│   ├── chat-admin/        # Admin dashboard
│   └── chirality-core/    # Core UI pages
├── components/            # Reusable UI components
│   ├── chat/              # Chat-specific components
│   ├── chirality/         # Chirality framework components  
│   ├── document/          # Document generation UI
│   ├── matrix/            # Matrix visualization
│   └── ui/                # Base UI components
├── lib/                   # Utilities and configurations
│   ├── hooks/             # Custom React hooks
│   ├── stores/            # Zustand stores
│   ├── utils/             # Helper functions
│   └── types/             # TypeScript type definitions
└── styles/                # Global styles and Tailwind config
```

## Development Status

### ✅ Completed Features

#### Core Chat Interface
- **ChatWindow** component with message accumulation
- **ChatInput** with command detection and streaming
- **Message** rendering with Markdown and syntax highlighting
- **useStream** hook for SSE connection management

#### Document Generation UI
- **DocumentViewer** with real-time updates
- **DocumentBuilder** for manual document creation
- **DocumentExporter** with multiple format support
- **DocumentSearch** with full-text search capabilities

#### Admin & Monitoring
- **Admin Dashboard** with system transparency
- **Debug Tools** for development and troubleshooting
- **Performance Metrics** visualization
- **Error Logging** and reporting

#### Responsive Design
- **Mobile-first** responsive layout
- **Touch-friendly** interactions
- **Dark mode** support
- **Accessibility** features

### 🚧 In Progress

#### Enhanced UI Components
- **Component Library** standardization
- **Storybook** integration for component development
- **Design System** documentation
- **Visual Regression Testing**

#### Performance Optimizations
- **Bundle Analysis** and optimization
- **Core Web Vitals** monitoring
- **Progressive Web App** features
- **Offline Support** capabilities

### 📋 Planned Features

#### Advanced Interactions
- **Drag & Drop** file uploads
- **Multi-tab** document editing
- **Real-time Collaboration** features
- **Voice Input** support

#### Visualization Enhancements
- **Interactive Charts** for document analytics
- **3D Visualizations** for complex relationships
- **Export Animations** for presentation mode
- **Custom Themes** and branding

## Component Architecture

### Base Components (`/components/ui/`)

#### Design System Components
```typescript
// Button component with variant system
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  children: ReactNode;
}

// Input with validation states  
interface InputProps {
  type: string;
  placeholder?: string;
  error?: string;
  success?: string;
  disabled?: boolean;
  autoComplete?: string;
}
```

#### Layout Components
- **Container** - responsive max-width wrapper
- **Grid** - CSS Grid wrapper with responsive breakpoints
- **Stack** - Flexbox stack with configurable spacing
- **Sidebar** - collapsible navigation sidebar

### Domain Components (`/components/chat/`, `/components/document/`)

#### Chat Components
```typescript
// Main chat interface
export function ChatWindow() {
  const { messages, isStreaming } = useChat();
  const { send } = useStream();
  
  return (
    <div className="chat-window">
      <MessageList messages={messages} />
      <ChatInput onSend={send} disabled={isStreaming} />
    </div>
  );
}

// Streaming message hook
export function useStream() {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const connect = useCallback(() => {
    // SSE connection logic
  }, []);
  
  return { connect, isConnected, error };
}
```

#### Document Components
```typescript
// Document viewer with real-time updates
export function DocumentViewer({ documentId }: { documentId: string }) {
  const { data: document, isLoading } = useDocument(documentId);
  const { subscribe } = useDocumentUpdates(documentId);
  
  if (isLoading) return <DocumentSkeleton />;
  
  return (
    <div className="document-viewer">
      <DocumentHeader document={document} />
      <DocumentContent content={document.content} />
      <DocumentActions document={document} />
    </div>
  );
}
```

## State Management Patterns

### Zustand Stores

#### Chat Store
```typescript
interface ChatState {
  messages: Message[];
  isStreaming: boolean;
  currentConversationId: string | null;
  
  addMessage: (message: Message) => void;
  updateMessage: (id: string, update: Partial<Message>) => void;
  setStreaming: (streaming: boolean) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isStreaming: false,
  currentConversationId: null,
  
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message]
  })),
  
  updateMessage: (id, update) => set((state) => ({
    messages: state.messages.map(msg => 
      msg.id === id ? { ...msg, ...update } : msg
    )
  })),
  
  setStreaming: (streaming) => set({ isStreaming: streaming }),
  clearMessages: () => set({ messages: [] })
}));
```

#### Document Store
```typescript
interface DocumentState {
  documents: Record<string, Document>;
  selectedDocumentId: string | null;
  searchQuery: string;
  filters: DocumentFilters;
  
  setDocument: (id: string, document: Document) => void;
  selectDocument: (id: string) => void;
  updateDocument: (id: string, update: Partial<Document>) => void;
  setSearchQuery: (query: string) => void;
}
```

### React Query Integration

#### Server State Management
```typescript
// Document queries
export function useDocument(id: string) {
  return useQuery({
    queryKey: ['document', id],
    queryFn: () => fetchDocument(id),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  });
}

export function useDocuments(filters: DocumentFilters) {
  return useQuery({
    queryKey: ['documents', filters],
    queryFn: () => fetchDocuments(filters),
    keepPreviousData: true
  });
}

// Mutations
export function useCreateDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createDocument,
    onSuccess: () => {
      queryClient.invalidateQueries(['documents']);
    }
  });
}
```

## Styling & Design System

### Tailwind Configuration
```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          500: '#3b82f6',
          900: '#1e3a8a'
        },
        semantic: {
          success: '#10b981',
          warning: '#f59e0b', 
          error: '#ef4444',
          info: '#3b82f6'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'spin-slow': 'spin 3s linear infinite'
      }
    }
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    require('@tailwindcss/aspect-ratio')
  ]
};
```

### CSS Custom Properties
```css
:root {
  /* Spacing scale */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;
  
  /* Typography scale */
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  
  /* Border radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}
```

## Performance Guidelines

### Code Splitting Strategies
```typescript
// Route-based code splitting
const AdminDashboard = lazy(() => import('./AdminDashboard'));
const DocumentEditor = lazy(() => import('./DocumentEditor'));

// Component-based code splitting
const HeavyChart = lazy(() => import('./HeavyChart'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/documents" element={<DocumentEditor />} />
      </Routes>
    </Suspense>
  );
}
```

### Optimization Patterns
```typescript
// Memoization for expensive calculations
const DocumentStats = memo(({ documents }: { documents: Document[] }) => {
  const stats = useMemo(() => {
    return calculateDocumentStats(documents);
  }, [documents]);
  
  return <div>{/* render stats */}</div>;
});

// Virtual scrolling for large lists
function DocumentList({ documents }: { documents: Document[] }) {
  const [startIndex, endIndex] = useVirtualization({
    itemCount: documents.length,
    itemHeight: 80,
    containerHeight: 600
  });
  
  const visibleDocuments = documents.slice(startIndex, endIndex);
  
  return (
    <div>
      {visibleDocuments.map(doc => (
        <DocumentItem key={doc.id} document={doc} />
      ))}
    </div>
  );
}
```

## Testing Strategy

### Component Testing
```typescript
// Component unit tests
describe('ChatInput', () => {
  test('submits message on enter key', async () => {
    const onSubmit = jest.fn();
    render(<ChatInput onSubmit={onSubmit} />);
    
    const input = screen.getByPlaceholderText('Type a message...');
    await user.type(input, 'Hello world{enter}');
    
    expect(onSubmit).toHaveBeenCalledWith('Hello world');
  });
  
  test('disables input when streaming', () => {
    render(<ChatInput isStreaming={true} />);
    
    const input = screen.getByPlaceholderText('Type a message...');
    expect(input).toBeDisabled();
  });
});
```

### Integration Testing
```typescript
// API integration tests
describe('Document API', () => {
  test('creates and displays new document', async () => {
    const mockDocument = { id: '1', title: 'Test Doc', content: 'Content' };
    server.use(
      rest.post('/api/documents', (req, res, ctx) => {
        return res(ctx.json(mockDocument));
      })
    );
    
    render(<DocumentCreator />);
    
    await user.type(screen.getByLabelText('Title'), 'Test Doc');
    await user.click(screen.getByRole('button', { name: 'Create' }));
    
    expect(await screen.findByText('Test Doc')).toBeInTheDocument();
  });
});
```

## Deployment & Build Process

### Build Configuration
```javascript
// next.config.js
const nextConfig = {
  experimental: {
    optimizeCss: true,
    scrollRestoration: true
  },
  
  images: {
    domains: ['example.com'],
    formats: ['image/webp', 'image/avif']
  },
  
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }
        ]
      }
    ];
  },
  
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'react/jsx-runtime.js': 'preact/compat/jsx-runtime'
      };
    }
    return config;
  }
};
```

### Performance Monitoring
```typescript
// Core Web Vitals tracking
export function reportWebVitals(metric: Metric) {
  switch (metric.name) {
    case 'CLS':
    case 'FID':
    case 'FCP':
    case 'LCP':
    case 'TTFB':
      // Send to analytics
      analytics.track('Web Vital', {
        name: metric.name,
        value: metric.value,
        id: metric.id
      });
      break;
  }
}
```

## Development Priorities

### Phase 1: Foundation (Current)
1. ✅ **Component Architecture** - Establish patterns and conventions
2. ✅ **State Management** - Implement Zustand + React Query
3. ✅ **Styling System** - Tailwind configuration and design tokens
4. ✅ **Basic Accessibility** - WCAG compliance foundations

### Phase 2: Enhancement (Next Sprint)
1. 🚧 **Component Library** - Comprehensive UI component documentation
2. 🚧 **Testing Framework** - Unit, integration, and e2e test setup
3. 🚧 **Performance Optimization** - Bundle analysis and Core Web Vitals
4. 🚧 **Advanced Interactions** - Drag & drop, keyboard shortcuts

### Phase 3: Scale (Future)
1. 📋 **Micro-frontends** - Module federation architecture
2. 📋 **Progressive Web App** - Service workers and offline support
3. 📋 **Advanced Analytics** - User behavior tracking and optimization
4. 📋 **Internationalization** - Multi-language support

## Contributing Guidelines

### Code Style
- Use **TypeScript** for all new components
- Follow **ESLint** and **Prettier** configurations
- Implement **proper error boundaries**
- Write **comprehensive PropTypes** or TypeScript interfaces

### Git Workflow
- Create **feature branches** from `main`
- Use **conventional commits** for clear history
- Include **tests** for new functionality
- Update **documentation** for API changes

### Review Process
- Ensure **accessibility compliance**
- Verify **responsive design**
- Test **keyboard navigation**
- Check **performance impact**

## Resources

### Documentation
- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [React 18 Features](https://react.dev/blog/2022/03/29/react-v18)
- [Tailwind CSS Guide](https://tailwindcss.com/docs)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

### Tools & Extensions
- [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/)
- [Accessibility Insights](https://accessibilityinsights.io/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [Web Vitals Extension](https://chrome.google.com/webstore/detail/web-vitals/)

---

*This document is maintained by the frontend team and updated regularly as the architecture evolves.*