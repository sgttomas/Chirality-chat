# Frontend Consumption Architecture

## Overview

This document defines the architecture for how the chirality-ai-app frontend consumes, displays, and interacts with semantic component data from Neo4j via GraphQL. The frontend is a pure consumer of the rich semantic data produced by the backend.

## What We Consume

### Data Products We Receive

1. **Semantic Components**: Fully-formed components with state history
2. **Operation Audit Trails**: Complete operation lineage and performance data
3. **Relationship Graphs**: Component dependencies and derivations
4. **Thread Contexts**: Grouped semantic operations
5. **Performance Metrics**: Operation timing and resource usage
6. **Semantic Addresses**: Unique cell identifiers for navigation

## Frontend Architecture Layers

### Layer 1: GraphQL Client Layer

**How We Connect to Data**:
```typescript
import { ApolloClient, InMemoryCache } from '@apollo/client';

const graphqlClient = new ApolloClient({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:8080/graphql',
  cache: new InMemoryCache({
    typePolicies: {
      Component: {
        keyFields: ['id'],
        fields: {
          stateHistory: {
            // Always show latest state first
            read(existing = []) {
              return [...existing].sort((a, b) => 
                new Date(b.timestamp) - new Date(a.timestamp)
              );
            }
          }
        }
      }
    }
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all'
    }
  }
});
```

**Query Patterns We Use**:
- Single component queries for detail views
- Batch queries for matrix displays
- Subscription queries for real-time updates
- Paginated queries for large datasets
- Filtered queries by state/thread/domain

### Layer 2: Data Transformation Layer

**Transform Backend Data for UI**:
```typescript
class UIDataTransformer {
  /**
   * Transform component data for display
   */
  static toUIComponent(backendComponent: BackendComponent): UIComponent {
    return {
      // Basic info
      id: backendComponent.id,
      title: this.formatTitle(backendComponent),
      subtitle: backendComponent.semanticDomain,
      
      // Visual state
      visual: {
        color: this.getStateColor(backendComponent.currentState),
        icon: this.getStateIcon(backendComponent.currentState),
        badge: this.getStateBadge(backendComponent.currentState)
      },
      
      // Content
      content: {
        initial: backendComponent.initialContent,
        current: this.getCurrentContent(backendComponent),
        preview: this.truncate(backendComponent.initialContent, 100)
      },
      
      // Metadata
      meta: {
        position: backendComponent.matrixPosition,
        matrix: backendComponent.matrixName,
        thread: backendComponent.threadId,
        address: backendComponent.ontologyBinding,
        timestamps: {
          created: new Date(backendComponent.createdAt),
          updated: new Date(backendComponent.updatedAt)
        }
      }
    };
  }
  
  /**
   * Transform operations for timeline display
   */
  static toTimelineItems(operations: BackendOperation[]): TimelineItem[] {
    return operations.map(op => ({
      id: op.id,
      type: 'operation',
      title: this.humanizeOperationType(op.operationType),
      subtitle: `${op.performanceMetrics.durationMs}ms`,
      timestamp: new Date(op.timestamp),
      icon: this.getOperationIcon(op.operationType),
      color: op.success ? 'green' : 'red',
      expandable: true,
      details: {
        inputs: op.inputComponents.length,
        output: op.outputComponent,
        tokens: op.performanceMetrics.tokensUsed,
        resolver: op.resolver
      }
    }));
  }
}
```

### Layer 3: UI State Management

**Managing Consumed Data**:
```typescript
// Zustand store for UI state
interface UIStore {
  // Data from backend
  components: Map<string, UIComponent>;
  operations: UIOperation[];
  threads: Thread[];
  
  // UI state
  selectedComponent: string | null;
  selectedThread: string | null;
  viewMode: 'grid' | 'timeline' | 'graph';
  filters: {
    state?: ComponentState;
    domain?: string;
    matrix?: string;
  };
  
  // Actions
  loadComponent: (id: string) => Promise<void>;
  loadThread: (threadId: string) => Promise<void>;
  setViewMode: (mode: ViewMode) => void;
  applyFilter: (filter: FilterOptions) => void;
  subscribeToUpdates: (componentId: string) => () => void;
}

export const useUIStore = create<UIStore>((set, get) => ({
  components: new Map(),
  operations: [],
  threads: [],
  selectedComponent: null,
  selectedThread: null,
  viewMode: 'grid',
  filters: {},
  
  loadComponent: async (id) => {
    const { data } = await graphqlClient.query({
      query: GET_COMPONENT_WITH_HISTORY,
      variables: { id }
    });
    
    const uiComponent = UIDataTransformer.toUIComponent(data.component);
    
    set(state => ({
      components: new Map(state.components).set(id, uiComponent),
      selectedComponent: id
    }));
  },
  
  loadThread: async (threadId) => {
    const { data } = await graphqlClient.query({
      query: GET_THREAD_DATA,
      variables: { threadId }
    });
    
    const components = data.threadComponents.map(UIDataTransformer.toUIComponent);
    const operations = UIDataTransformer.toTimelineItems(data.threadOperations);
    
    set({
      components: new Map(components.map(c => [c.id, c])),
      operations,
      selectedThread: threadId
    });
  }
}));
```

### Layer 4: Visualization Components

**Component Display Layer**:
```typescript
// Matrix Grid Visualization
export function MatrixGridView() {
  const { components, filters, viewMode } = useUIStore();
  
  // Filter components based on UI state
  const filteredComponents = useMemo(() => {
    return Array.from(components.values()).filter(comp => {
      if (filters.state && comp.meta.state !== filters.state) return false;
      if (filters.matrix && comp.meta.matrix !== filters.matrix) return false;
      if (filters.domain && comp.meta.domain !== filters.domain) return false;
      return true;
    });
  }, [components, filters]);
  
  // Group by matrix for grid display
  const matrices = useMemo(() => {
    const grouped = {};
    filteredComponents.forEach(comp => {
      const matrix = comp.meta.matrix;
      if (!grouped[matrix]) grouped[matrix] = [];
      grouped[matrix].push(comp);
    });
    return grouped;
  }, [filteredComponents]);
  
  return (
    <div className="matrix-grid-container">
      {Object.entries(matrices).map(([matrixName, comps]) => (
        <MatrixGrid key={matrixName} name={matrixName} components={comps} />
      ))}
    </div>
  );
}

// Component State Timeline
export function ComponentTimeline({ componentId }: { componentId: string }) {
  const { data } = useQuery(GET_COMPONENT_STATES, {
    variables: { componentId }
  });
  
  if (!data) return <TimelineSkeleton />;
  
  const timelineItems = data.stateHistory.map((state, idx) => ({
    id: `state-${idx}`,
    type: 'state',
    title: state.stateType,
    content: state.content,
    timestamp: new Date(state.timestamp),
    icon: STATE_ICONS[state.stateType],
    color: STATE_COLORS[state.stateType]
  }));
  
  return <Timeline items={timelineItems} />;
}

// Semantic Graph Explorer
export function SemanticGraphView() {
  const { components, operations } = useUIStore();
  
  const graphData = useMemo(() => {
    const nodes = Array.from(components.values()).map(comp => ({
      id: comp.id,
      label: comp.title,
      group: comp.meta.matrix,
      color: comp.visual.color
    }));
    
    const edges = operations.flatMap(op => 
      op.details.inputs.map(input => ({
        from: input,
        to: op.details.output,
        label: op.title
      }))
    );
    
    return { nodes, edges };
  }, [components, operations]);
  
  return (
    <ForceGraph
      data={graphData}
      onNodeClick={(nodeId) => navigateToComponent(nodeId)}
      onEdgeClick={(edge) => showOperationDetails(edge)}
    />
  );
}
```

## Consumption Workflows

### Task 1: Initial Data Load

**How We Load Initial Data**:
```typescript
export function AppInitializer() {
  const loadInitialData = useUIStore(state => state.loadInitialData);
  
  useEffect(() => {
    // Load default thread or last viewed
    const defaultThread = localStorage.getItem('lastViewedThread') || 'default';
    loadInitialData(defaultThread);
  }, []);
  
  return <AppContent />;
}

async function loadInitialData(threadId: string) {
  // Batch load all thread data
  const { data } = await graphqlClient.query({
    query: gql`
      query LoadThread($threadId: ID!) {
        thread(id: $threadId) {
          id
          domain
          currentStation
          components {
            ...ComponentFields
          }
          operations {
            ...OperationFields
          }
        }
      }
    `,
    variables: { threadId }
  });
  
  // Transform and store
  const uiData = transformThreadData(data.thread);
  updateUIStore(uiData);
}
```

### Task 2: Real-Time Updates

**How We Handle Live Updates**:
```typescript
export function LiveUpdateManager({ componentIds }: { componentIds: string[] }) {
  const updateComponent = useUIStore(state => state.updateComponent);
  
  // Subscribe to component updates
  const { data } = useSubscription(
    gql`
      subscription ComponentUpdates($ids: [ID!]!) {
        componentsUpdated(ids: $ids) {
          id
          currentState
          updatedAt
          latestOperation {
            type
            timestamp
          }
        }
      }
    `,
    {
      variables: { ids: componentIds },
      onSubscriptionData: ({ subscriptionData }) => {
        if (subscriptionData.data) {
          const update = subscriptionData.data.componentsUpdated;
          updateComponent(update.id, update);
          
          // Show notification
          showUpdateNotification({
            component: update.id,
            newState: update.currentState
          });
        }
      }
    }
  );
  
  return null; // This is a manager component
}
```

### Task 3: User Interaction Handling

**How We Handle User Actions**:
```typescript
export function InteractiveComponentCard({ component }: { component: UIComponent }) {
  const router = useRouter();
  const { setSelectedComponent, loadComponentDetails } = useUIStore();
  
  const handleClick = async () => {
    setSelectedComponent(component.id);
    await loadComponentDetails(component.id);
    router.push(`/component/${component.id}`);
  };
  
  const handleStateClick = (state: string) => {
    router.push(`/component/${component.id}/state/${state}`);
  };
  
  return (
    <Card onClick={handleClick} className="interactive-card">
      <CardHeader>
        <Badge color={component.visual.color}>{component.meta.state}</Badge>
        <Title>{component.title}</Title>
      </CardHeader>
      
      <CardContent>
        <Preview>{component.content.preview}</Preview>
      </CardContent>
      
      <CardFooter>
        <StateIndicators 
          states={component.meta.states}
          onClick={handleStateClick}
        />
      </CardFooter>
    </Card>
  );
}
```

## Performance Optimization

### Task 4: Query Optimization

**How We Optimize Data Fetching**:
```typescript
// Use fragments for consistent field selection
const COMPONENT_FRAGMENT = gql`
  fragment ComponentCore on Component {
    id
    matrixName
    matrixPosition
    currentState
    semanticDomain
  }
`;

// Batch similar queries
const batchLoader = new DataLoader(async (ids: string[]) => {
  const { data } = await graphqlClient.query({
    query: gql`
      query BatchLoad($ids: [ID!]!) {
        components(ids: $ids) {
          ...ComponentCore
        }
      }
      ${COMPONENT_FRAGMENT}
    `,
    variables: { ids }
  });
  
  return ids.map(id => data.components.find(c => c.id === id));
});

// Implement pagination
export function usePaginatedComponents(pageSize = 20) {
  const [page, setPage] = useState(0);
  
  const { data, loading, fetchMore } = useQuery(
    gql`
      query PaginatedComponents($offset: Int!, $limit: Int!) {
        components(offset: $offset, limit: $limit) {
          items {
            ...ComponentCore
          }
          totalCount
          hasMore
        }
      }
      ${COMPONENT_FRAGMENT}
    `,
    {
      variables: {
        offset: page * pageSize,
        limit: pageSize
      }
    }
  );
  
  return {
    components: data?.components.items || [],
    loading,
    hasMore: data?.components.hasMore,
    loadMore: () => setPage(p => p + 1)
  };
}
```

### Task 5: Caching Strategy

**How We Cache Data**:
```typescript
// Apollo cache configuration
const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        components: {
          // Merge paginated results
          keyArgs: ['filter'],
          merge(existing = { items: [] }, incoming) {
            return {
              ...incoming,
              items: [...existing.items, ...incoming.items]
            };
          }
        }
      }
    },
    Component: {
      fields: {
        stateHistory: {
          // Don't cache state history - always fetch fresh
          merge: false
        }
      }
    }
  }
});

// Local storage for offline support
class OfflineCache {
  static save(key: string, data: any) {
    try {
      localStorage.setItem(`cf14_cache_${key}`, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.warn('Cache save failed:', e);
    }
  }
  
  static load(key: string, maxAge = 3600000) { // 1 hour default
    try {
      const cached = localStorage.getItem(`cf14_cache_${key}`);
      if (!cached) return null;
      
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp > maxAge) return null;
      
      return data;
    } catch (e) {
      return null;
    }
  }
}
```

## Error Handling

### Task 6: Graceful Error Recovery

**How We Handle Errors**:
```typescript
export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ReactErrorBoundary
      fallback={<ErrorFallback />}
      onError={(error, errorInfo) => {
        console.error('UI Error:', error, errorInfo);
        
        // Send to error tracking
        if (process.env.NODE_ENV === 'production') {
          trackError(error, errorInfo);
        }
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
}

function ErrorFallback() {
  return (
    <div className="error-fallback">
      <h2>Something went wrong</h2>
      <p>Unable to load component data. Please try refreshing.</p>
      <button onClick={() => window.location.reload()}>
        Refresh Page
      </button>
    </div>
  );
}

// Network error handling
export function useResilientQuery(query: DocumentNode, options?: QueryOptions) {
  const [retryCount, setRetryCount] = useState(0);
  
  const { data, loading, error, refetch } = useQuery(query, {
    ...options,
    errorPolicy: 'all',
    notifyOnNetworkStatusChange: true,
    onError: (error) => {
      if (error.networkError && retryCount < 3) {
        setTimeout(() => {
          setRetryCount(r => r + 1);
          refetch();
        }, 1000 * Math.pow(2, retryCount)); // Exponential backoff
      }
    }
  });
  
  // Try to load from cache if network fails
  const cachedData = useMemo(() => {
    if (error?.networkError && !data) {
      return OfflineCache.load(getCacheKey(query, options?.variables));
    }
    return null;
  }, [error, data]);
  
  return {
    data: data || cachedData,
    loading,
    error,
    isOffline: !!cachedData,
    retry: () => {
      setRetryCount(0);
      refetch();
    }
  };
}
```

## Testing

### Task 7: UI Testing

**How We Test Consumption**:
```typescript
describe('Component Display', () => {
  it('correctly displays component data from GraphQL', async () => {
    const mockData = {
      component: {
        id: 'test:A:0:0',
        matrixName: 'A',
        matrixPosition: [0, 0],
        currentState: 'resolved',
        initialContent: 'Quality',
        semanticDomain: 'software_dev'
      }
    };
    
    const { getByText, getByTestId } = render(
      <MockedProvider mocks={[
        {
          request: {
            query: GET_COMPONENT,
            variables: { id: 'test:A:0:0' }
          },
          result: { data: mockData }
        }
      ]}>
        <ComponentDisplay componentId="test:A:0:0" />
      </MockedProvider>
    );
    
    await waitFor(() => {
      expect(getByText('A[0,0]')).toBeInTheDocument();
      expect(getByTestId('state-badge')).toHaveTextContent('resolved');
    });
  });
  
  it('handles loading and error states gracefully', async () => {
    const errorMock = {
      request: {
        query: GET_COMPONENT,
        variables: { id: 'error-component' }
      },
      error: new Error('Component not found')
    };
    
    const { getByText } = render(
      <MockedProvider mocks={[errorMock]}>
        <ComponentDisplay componentId="error-component" />
      </MockedProvider>
    );
    
    // Should show loading first
    expect(getByText(/Loading/)).toBeInTheDocument();
    
    // Then show error
    await waitFor(() => {
      expect(getByText(/not found/)).toBeInTheDocument();
    });
  });
});
```

## Summary

The chirality-ai-app frontend architecture is designed to:

1. **Consume** semantic component data via GraphQL efficiently
2. **Transform** backend data into UI-optimized structures
3. **Display** components in multiple visualization modes
4. **Update** in real-time via subscriptions
5. **Cache** data for performance and offline support
6. **Handle** errors gracefully with fallbacks
7. **Test** all consumption patterns thoroughly

The frontend is a pure consumer, focusing entirely on presenting and interacting with the rich semantic data produced by the backend, without any knowledge of how that data was created or transformed.