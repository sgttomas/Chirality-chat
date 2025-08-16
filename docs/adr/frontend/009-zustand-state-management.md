# ADR-009: Zustand State Management

**Status**: Accepted  
**Date**: 2024-01-15  
**Deciders**: Frontend Team  

## Context

The Chirality Chat application requires robust client-side state management for:
- Real-time chat messages and streaming states
- Document generation progress and results  
- UI state (modals, sidebars, preferences)
- Cross-component communication

We need a state management solution that is lightweight, TypeScript-friendly, and integrates well with React 18 and Server Components.

## Decision

We will use **Zustand** as our primary client-side state management library, complemented by **React Query (TanStack Query)** for server state.

## Rationale

### Zustand Advantages

1. **Simplicity & Bundle Size**
   - ~2.5kb gzipped vs Redux (~8kb+)
   - Minimal boilerplate compared to Redux Toolkit
   - No providers needed in React tree

2. **TypeScript Excellence**
   - First-class TypeScript support
   - Excellent type inference
   - No complex type gymnastics required

3. **React 18 Compatibility**
   - Works seamlessly with Concurrent Features
   - No issues with Server Components
   - Supports Suspense patterns

4. **Developer Experience**
   - Simple, intuitive API
   - No action creators or reducers required
   - Easy debugging with DevTools

### Technical Implementation

```typescript
// stores/chat-store.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  streaming?: boolean;
}

interface ChatState {
  // State
  messages: Message[];
  isStreaming: boolean;
  currentConversationId: string | null;
  sidebarOpen: boolean;
  
  // Actions
  addMessage: (message: Message) => void;
  updateMessage: (id: string, update: Partial<Message>) => void;
  setStreaming: (streaming: boolean) => void;
  clearMessages: () => void;
  toggleSidebar: () => void;
  setConversationId: (id: string | null) => void;
}

export const useChatStore = create<ChatState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial state
      messages: [],
      isStreaming: false,
      currentConversationId: null,
      sidebarOpen: true,
      
      // Actions
      addMessage: (message) => 
        set((state) => ({
          messages: [...state.messages, message]
        }), false, 'chat/addMessage'),
        
      updateMessage: (id, update) =>
        set((state) => ({
          messages: state.messages.map(msg => 
            msg.id === id ? { ...msg, ...update } : msg
          )
        }), false, 'chat/updateMessage'),
        
      setStreaming: (streaming) => 
        set({ isStreaming: streaming }, false, 'chat/setStreaming'),
        
      clearMessages: () => 
        set({ messages: [] }, false, 'chat/clearMessages'),
        
      toggleSidebar: () =>
        set((state) => ({ 
          sidebarOpen: !state.sidebarOpen 
        }), false, 'chat/toggleSidebar'),
        
      setConversationId: (id) =>
        set({ currentConversationId: id }, false, 'chat/setConversationId')
    })),
    { name: 'chat-store' }
  )
);

// Selectors for performance
export const useMessages = () => useChatStore(state => state.messages);
export const useIsStreaming = () => useChatStore(state => state.isStreaming);
export const useSidebarOpen = () => useChatStore(state => state.sidebarOpen);
```

### Document Store Example
```typescript
// stores/document-store.ts
interface DocumentState {
  documents: Record<string, Document>;
  selectedDocumentId: string | null;
  searchQuery: string;
  filters: DocumentFilters;
  
  setDocument: (id: string, document: Document) => void;
  selectDocument: (id: string) => void;
  updateDocument: (id: string, update: Partial<Document>) => void;
  setSearchQuery: (query: string) => void;
  setFilters: (filters: Partial<DocumentFilters>) => void;
}

export const useDocumentStore = create<DocumentState>((set) => ({
  documents: {},
  selectedDocumentId: null,
  searchQuery: '',
  filters: { type: 'all', status: 'all' },
  
  setDocument: (id, document) =>
    set((state) => ({
      documents: { ...state.documents, [id]: document }
    })),
    
  selectDocument: (id) =>
    set({ selectedDocumentId: id }),
    
  updateDocument: (id, update) =>
    set((state) => ({
      documents: {
        ...state.documents,
        [id]: { ...state.documents[id], ...update }
      }
    })),
    
  setSearchQuery: (query) =>
    set({ searchQuery: query }),
    
  setFilters: (filters) =>
    set((state) => ({ 
      filters: { ...state.filters, ...filters } 
    }))
}));
```

### Component Usage Patterns
```typescript
// components/chat/chat-window.tsx
function ChatWindow() {
  const { messages, isStreaming, addMessage } = useChatStore();
  const { data: conversation } = useConversation(); // React Query
  
  const handleSendMessage = useCallback((content: string) => {
    const message: Message = {
      id: generateId(),
      content,
      role: 'user',
      timestamp: new Date()
    };
    addMessage(message);
  }, [addMessage]);
  
  return (
    <div className="chat-window">
      <MessageList messages={messages} />
      <ChatInput 
        onSend={handleSendMessage} 
        disabled={isStreaming} 
      />
    </div>
  );
}

// Performance optimization with selectors
function MessageCount() {
  const messageCount = useChatStore(state => state.messages.length);
  return <span>{messageCount} messages</span>;
}

// Subscription for side effects
function ChatNotifications() {
  useEffect(() => {
    const unsubscribe = useChatStore.subscribe(
      (state) => state.messages,
      (messages, prevMessages) => {
        if (messages.length > prevMessages.length) {
          // New message arrived
          showNotification('New message received');
        }
      }
    );
    
    return unsubscribe;
  }, []);
  
  return null;
}
```

## State Architecture

### Client State (Zustand)
- **UI State**: Modal visibility, sidebar state, form data
- **Transient State**: Loading states, optimistic updates
- **User Preferences**: Theme, language, settings
- **Real-time State**: Chat messages, streaming status

### Server State (React Query)
- **API Data**: Documents, conversations, user data
- **Caching**: Intelligent cache management
- **Background Updates**: Automatic refetching
- **Mutations**: Create, update, delete operations

### Persistence Strategy
```typescript
// stores/persistent-store.ts
import { persist } from 'zustand/middleware';

interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  sidebarCollapsed: boolean;
}

export const usePreferencesStore = create<UserPreferences>()(
  persist(
    (set) => ({
      theme: 'system',
      language: 'en',
      sidebarCollapsed: false,
      
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      toggleSidebar: () => 
        set((state) => ({ 
          sidebarCollapsed: !state.sidebarCollapsed 
        }))
    }),
    {
      name: 'user-preferences',
      storage: {
        getItem: (name) => {
          const value = localStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
        }
      }
    }
  )
);
```

## Alternatives Considered

### Redux Toolkit
- **Pros**: Mature ecosystem, extensive tooling, predictable patterns
- **Cons**: Complex setup, larger bundle size, verbose syntax
- **Verdict**: Overkill for our use case, unnecessary complexity

### Context + useReducer
- **Pros**: Built-in React, no additional dependencies
- **Cons**: Performance issues with frequent updates, verbose implementation
- **Verdict**: Not suitable for real-time chat features

### Valtio
- **Pros**: Proxy-based reactivity, simple mutation syntax
- **Cons**: Smaller ecosystem, potential debugging complexity
- **Verdict**: Interesting but less proven than Zustand

### Jotai
- **Pros**: Atomic approach, excellent TypeScript support
- **Cons**: Different mental model, potential over-atomization
- **Verdict**: Good alternative but Zustand's simplicity wins

## Consequences

### Positive
- **Reduced Bundle Size**: Smaller footprint compared to Redux
- **Improved DX**: Less boilerplate, easier to understand
- **Better Performance**: Selective subscriptions prevent unnecessary re-renders
- **TypeScript Integration**: Excellent type safety and inference

### Negative
- **Learning Curve**: Team needs to learn Zustand patterns
- **Ecosystem Size**: Smaller than Redux (mitigated by simplicity)
- **Advanced Patterns**: Some complex use cases might need custom solutions

### Migration Strategy

1. **Gradual Adoption**
   ```typescript
   // Start with new features
   // Migrate existing state incrementally
   // Keep React Query for server state
   ```

2. **Store Organization**
   ```typescript
   stores/
   ├── chat-store.ts          # Chat-related state
   ├── document-store.ts      # Document management
   ├── ui-store.ts           # UI state (modals, etc.)
   ├── preferences-store.ts   # User preferences
   └── index.ts              # Re-exports
   ```

3. **Testing Strategy**
   ```typescript
   // stores/__tests__/chat-store.test.ts
   import { renderHook, act } from '@testing-library/react';
   import { useChatStore } from '../chat-store';
   
   test('adds message to store', () => {
     const { result } = renderHook(() => useChatStore());
     
     act(() => {
       result.current.addMessage({
         id: '1',
         content: 'Hello',
         role: 'user',
         timestamp: new Date()
       });
     });
     
     expect(result.current.messages).toHaveLength(1);
   });
   ```

## Performance Considerations

### Optimization Patterns
```typescript
// ✅ Use selectors to prevent unnecessary re-renders
const messageCount = useChatStore(state => state.messages.length);

// ✅ Memoize complex selectors
const sortedMessages = useChatStore(
  useCallback(
    state => state.messages.sort((a, b) => 
      a.timestamp.getTime() - b.timestamp.getTime()
    ),
    []
  )
);

// ✅ Split large stores
// Instead of one large store, use multiple focused stores
const useUIStore = create(...);
const useChatStore = create(...);
const useDocumentStore = create(...);
```

## Integration with React Query

```typescript
// hooks/use-chat-integration.ts
export function useChatIntegration() {
  const { addMessage, setStreaming } = useChatStore();
  
  const sendMessage = useMutation({
    mutationFn: (content: string) => postMessage(content),
    onMutate: (content) => {
      // Optimistic update
      addMessage({
        id: generateTempId(),
        content,
        role: 'user',
        timestamp: new Date()
      });
    },
    onSuccess: (response) => {
      // Replace with server response
      addMessage(response.message);
    },
    onError: () => {
      // Handle error, maybe show retry option
    }
  });
  
  return { sendMessage };
}
```

## Monitoring & Debugging

### DevTools Integration
```typescript
// Enable Redux DevTools for all stores
const useChatStore = create<ChatState>()(
  devtools(
    // store implementation
    { name: 'chat-store' }
  )
);
```

### Performance Monitoring
```typescript
// Monitor store subscription performance
const unsubscribe = useChatStore.subscribe(
  (state) => state.messages,
  (messages) => {
    performance.mark('messages-updated');
    // Track performance metrics
  }
);
```

## Related Decisions

- **ADR-008**: Next.js App Router (architectural foundation)
- **ADR-011**: SSE Streaming Pattern (real-time state updates)
- **ADR-012**: Component Composition (how state flows through components)

## References

- [Zustand Documentation](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [React Query Integration](https://tanstack.com/query/latest)
- [State Management Comparison](https://react-state-management-comparison.netlify.app/)