# Frontend Data Consumption Plan from GraphQL/Neo4j

## Overview

This document outlines how the chirality-ai-app frontend consumes semantic component data from Neo4j via GraphQL. The frontend is responsible for querying, displaying, and interacting with the semantic components produced by the backend, without needing to understand how they were created.

## What We Consume from Neo4j

### Core Data We Query

#### 1. Semantic Components
**What We Receive**:
- Component ID and current state
- Matrix position and name
- State history with timestamps
- Semantic content at each state
- Thread context and domain

**How We Use It**:
- Display component evolution in UI
- Show current state in matrix visualization
- Enable state history exploration
- Provide semantic content tooltips

#### 2. Operation Audit Trails
**What We Receive**:
- Operation type and timestamp
- Input/output component references
- Resolver information
- Performance metrics
- Success/failure status

**How We Use It**:
- Display operation timeline
- Show performance analytics
- Visualize component lineage
- Debug failed operations

#### 3. Semantic Relationships
**What We Receive**:
- Component dependency graphs
- Operation lineage chains
- Thread membership data
- Semantic derivation paths

**How We Use It**:
- Render relationship graphs
- Navigate between related components
- Explore semantic transformations
- Filter by thread context

## GraphQL Query Interface

### Task 1: Component Query Implementation

**Queries We Make**:
```graphql
# Get component with full state history
query GetComponentWithHistory($id: ID!) {
  component(id: $id) {
    id
    matrixName
    matrixPosition
    currentState
    semanticDomain
    ontologyBinding
    stateHistory {
      state
      content
      timestamp
      operation {
        type
        resolver
      }
    }
    thread {
      id
      domain
      currentStation
    }
  }
}

# Get components by state
query GetComponentsByState($state: ComponentState!, $threadId: ID) {
  componentsByState(state: $state, threadId: $threadId) {
    id
    matrixName
    matrixPosition
    initialContent
    currentState
    updatedAt
  }
}
```

**Frontend Component Using Queries**:
```typescript
export function ComponentExplorer() {
  const { data, loading, error } = useQuery(GET_COMPONENT_WITH_HISTORY, {
    variables: { id: componentId },
    pollInterval: 5000  // Real-time updates
  });
  
  if (loading) return <ComponentSkeleton />;
  if (error) return <ErrorDisplay error={error} />;
  
  return (
    <ComponentCard
      component={data.component}
      onStateClick={(state) => navigateToState(state)}
    />
  );
}
```

### Task 2: Matrix Visualization Queries

**Matrix Data We Request**:
```graphql
query GetMatrixComponents($matrixName: String!, $threadId: ID!) {
  matrixComponents(matrixName: $matrixName, threadId: $threadId) {
    id
    position
    currentState
    content
    cellAddress  # cf14:domain:matrix:row:col:hash
  }
}

query GetMatrixOperations($matrixName: String!) {
  matrixOperations(matrixName: $matrixName) {
    id
    type
    timestamp
    inputMatrices
    outputMatrix
    performance {
      durationMs
      tokensUsed
    }
  }
}
```

**Matrix Display Component**:
```typescript
export function MatrixVisualization({ matrixName, threadId }: Props) {
  const { data } = useQuery(GET_MATRIX_COMPONENTS, {
    variables: { matrixName, threadId }
  });
  
  return (
    <MatrixGrid>
      {data?.matrixComponents.map(component => (
        <MatrixCell
          key={component.id}
          position={component.position}
          state={component.currentState}
          content={component.content}
          onClick={() => openComponentDetails(component.id)}
        />
      ))}
    </MatrixGrid>
  );
}
```

### Task 3: Operation Timeline Queries

**Operation History We Fetch**:
```graphql
query GetOperationTimeline($threadId: ID!, $limit: Int) {
  operationTimeline(threadId: $threadId, limit: $limit) {
    operations {
      id
      type
      timestamp
      duration
      inputComponents {
        id
        matrixName
      }
      outputComponent {
        id
        matrixName
        currentState
      }
      success
      error
    }
    totalCount
  }
}
```

**Timeline Display Component**:
```typescript
export function OperationTimeline({ threadId }: Props) {
  const { data, fetchMore } = useQuery(GET_OPERATION_TIMELINE, {
    variables: { threadId, limit: 20 }
  });
  
  return (
    <Timeline>
      {data?.operationTimeline.operations.map(op => (
        <TimelineItem
          key={op.id}
          operation={op}
          status={op.success ? 'success' : 'failed'}
          onClick={() => showOperationDetails(op)}
        />
      ))}
      <LoadMoreButton onClick={() => fetchMore()} />
    </Timeline>
  );
}
```

## Real-Time Updates

### Task 4: GraphQL Subscriptions

**Subscriptions We Use**:
```graphql
# Subscribe to component state changes
subscription OnComponentStateChange($componentId: ID!) {
  componentStateChanged(componentId: $componentId) {
    componentId
    newState
    content
    timestamp
    operation {
      type
      resolver
    }
  }
}

# Subscribe to new operations
subscription OnNewOperation($threadId: ID!) {
  operationCreated(threadId: $threadId) {
    id
    type
    inputComponents
    outputComponent
    timestamp
  }
}
```

**Real-Time Update Hook**:
```typescript
export function useComponentUpdates(componentId: string) {
  const { data: component } = useQuery(GET_COMPONENT, {
    variables: { id: componentId }
  });
  
  const { data: update } = useSubscription(ON_COMPONENT_STATE_CHANGE, {
    variables: { componentId },
    onSubscriptionData: ({ subscriptionData }) => {
      // Update local cache with new state
      updateComponentCache(subscriptionData.data);
    }
  });
  
  return {
    component,
    latestUpdate: update?.componentStateChanged
  };
}
```

## Data Transformation for UI

### Task 5: Frontend Data Adapters

**Transform Neo4j Data for Display**:
```typescript
class ComponentDataAdapter {
  // Transform raw component data for UI
  static toDisplayComponent(raw: ComponentData): DisplayComponent {
    return {
      id: raw.id,
      title: `${raw.matrixName}[${raw.matrixPosition.join(',')}]`,
      state: this.formatState(raw.currentState),
      content: this.truncateContent(raw.content),
      semanticAddress: raw.ontologyBinding,
      lastUpdated: this.formatTimestamp(raw.updatedAt)
    };
  }
  
  // Transform state history for timeline
  static toStateTimeline(states: StateData[]): TimelineItem[] {
    return states.map((state, index) => ({
      id: `state-${index}`,
      label: state.state,
      content: state.content,
      timestamp: new Date(state.timestamp),
      icon: this.getStateIcon(state.state),
      color: this.getStateColor(state.state)
    }));
  }
  
  // Transform operations for visualization
  static toOperationGraph(operations: OperationData[]): GraphData {
    const nodes = this.extractNodes(operations);
    const edges = this.extractEdges(operations);
    
    return {
      nodes: nodes.map(n => ({
        id: n.id,
        label: n.label,
        type: n.type,
        x: n.position.x,
        y: n.position.y
      })),
      edges: edges.map(e => ({
        source: e.from,
        target: e.to,
        label: e.operation
      }))
    };
  }
}
```

### Task 6: UI State Management

**Managing Fetched Data**:
```typescript
// Zustand store for component data
interface ComponentStore {
  components: Map<string, Component>;
  operations: Operation[];
  activeThread: string | null;
  
  // Actions
  fetchComponent: (id: string) => Promise<void>;
  fetchThreadComponents: (threadId: string) => Promise<void>;
  subscribeToUpdates: (threadId: string) => void;
  unsubscribeFromUpdates: () => void;
}

export const useComponentStore = create<ComponentStore>((set, get) => ({
  components: new Map(),
  operations: [],
  activeThread: null,
  
  fetchComponent: async (id) => {
    const { data } = await apolloClient.query({
      query: GET_COMPONENT_WITH_HISTORY,
      variables: { id }
    });
    
    set(state => ({
      components: new Map(state.components).set(id, data.component)
    }));
  },
  
  fetchThreadComponents: async (threadId) => {
    const { data } = await apolloClient.query({
      query: GET_THREAD_COMPONENTS,
      variables: { threadId }
    });
    
    const componentMap = new Map();
    data.threadComponents.forEach(c => componentMap.set(c.id, c));
    
    set({ 
      components: componentMap,
      activeThread: threadId 
    });
  }
}));
```

## Visualization Components

### Task 7: Component State Viewer

**Display Component Evolution**:
```tsx
export function ComponentStateViewer({ componentId }: Props) {
  const { data, loading } = useQuery(GET_COMPONENT_STATES, {
    variables: { componentId }
  });
  
  if (loading) return <Skeleton />;
  
  const states = ComponentDataAdapter.toStateTimeline(data.states);
  
  return (
    <div className="component-state-viewer">
      <StateTimeline states={states} />
      <StateComparison 
        initial={states[0]}
        current={states[states.length - 1]}
      />
      <StateTransitionGraph 
        transitions={data.transitions}
        onNodeClick={(state) => setSelectedState(state)}
      />
    </div>
  );
}
```

### Task 8: Semantic Graph Explorer

**Interactive Graph Navigation**:
```tsx
export function SemanticGraphExplorer({ rootComponentId }: Props) {
  const { data } = useQuery(GET_COMPONENT_GRAPH, {
    variables: { 
      rootId: rootComponentId,
      depth: 3  // Levels of relationships to fetch
    }
  });
  
  const graphData = ComponentDataAdapter.toOperationGraph(data.operations);
  
  return (
    <GraphCanvas
      data={graphData}
      onNodeClick={(nodeId) => navigateToComponent(nodeId)}
      onEdgeClick={(edgeData) => showOperationDetails(edgeData)}
      layout="force-directed"
      enableZoom
      enablePan
    />
  );
}
```

## Performance Optimization

### Task 9: Query Optimization

**Efficient Data Fetching**:
```typescript
// Batch component fetching
const BATCH_COMPONENTS_QUERY = gql`
  query BatchGetComponents($ids: [ID!]!) {
    components(ids: $ids) {
      id
      matrixName
      currentState
      content
    }
  }
`;

// Pagination for large datasets
const PAGINATED_OPERATIONS_QUERY = gql`
  query GetOperations($cursor: String, $limit: Int!) {
    operations(after: $cursor, first: $limit) {
      edges {
        node {
          id
          type
          timestamp
        }
        cursor
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

// Fragment reuse for consistency
const COMPONENT_FRAGMENT = gql`
  fragment ComponentFields on Component {
    id
    matrixName
    matrixPosition
    currentState
    semanticDomain
  }
`;
```

### Task 10: Caching Strategy

**Apollo Client Cache Configuration**:
```typescript
const cache = new InMemoryCache({
  typePolicies: {
    Component: {
      keyFields: ["id"],
      fields: {
        stateHistory: {
          merge(existing = [], incoming) {
            // Merge new states while maintaining order
            return [...existing, ...incoming].sort(
              (a, b) => a.timestamp - b.timestamp
            );
          }
        }
      }
    },
    Query: {
      fields: {
        components: {
          keyArgs: ["threadId", "state"],
          merge(existing, incoming) {
            return incoming;
          }
        }
      }
    }
  }
});

// Optimistic updates for better UX
const optimisticResponse = {
  updateComponentState: {
    __typename: "Component",
    id: componentId,
    currentState: newState,
    updatedAt: new Date().toISOString()
  }
};
```

## Error Handling

### Task 11: Frontend Error Management

**Graceful Error Handling**:
```typescript
export function useComponentData(componentId: string) {
  const { data, loading, error, refetch } = useQuery(GET_COMPONENT, {
    variables: { id: componentId },
    errorPolicy: 'all',  // Return partial data even with errors
    notifyOnNetworkStatusChange: true
  });
  
  // Handle different error scenarios
  if (error?.networkError) {
    return {
      error: "Unable to connect to server. Please check your connection.",
      retry: () => refetch()
    };
  }
  
  if (error?.graphQLErrors?.length) {
    const gqlError = error.graphQLErrors[0];
    if (gqlError.extensions?.code === 'NOT_FOUND') {
      return {
        error: `Component ${componentId} not found`,
        notFound: true
      };
    }
  }
  
  return { data, loading, error, refetch };
}
```

## Testing

### Task 12: Frontend Query Testing

**Test GraphQL Integration**:
```typescript
describe('ComponentExplorer', () => {
  it('should fetch and display component data', async () => {
    const mocks = [
      {
        request: {
          query: GET_COMPONENT_WITH_HISTORY,
          variables: { id: 'test-component-1' }
        },
        result: {
          data: {
            component: mockComponent
          }
        }
      }
    ];
    
    const { getByText, getByTestId } = render(
      <MockedProvider mocks={mocks}>
        <ComponentExplorer componentId="test-component-1" />
      </MockedProvider>
    );
    
    await waitFor(() => {
      expect(getByText(mockComponent.matrixName)).toBeInTheDocument();
      expect(getByTestId('state-indicator')).toHaveTextContent('resolved');
    });
  });
  
  it('should handle loading and error states', async () => {
    const errorMock = {
      request: {
        query: GET_COMPONENT_WITH_HISTORY,
        variables: { id: 'error-component' }
      },
      error: new Error('Component not found')
    };
    
    const { getByText } = render(
      <MockedProvider mocks={[errorMock]}>
        <ComponentExplorer componentId="error-component" />
      </MockedProvider>
    );
    
    await waitFor(() => {
      expect(getByText(/Component not found/)).toBeInTheDocument();
    });
  });
});
```

## Summary

The chirality-ai-app frontend is responsible for:

1. **Querying** semantic component data via GraphQL
2. **Displaying** component states and evolution in the UI
3. **Visualizing** matrices, operations, and relationships
4. **Subscribing** to real-time updates
5. **Transforming** Neo4j data for optimal display
6. **Caching** data for performance
7. **Handling** errors gracefully

The frontend consumes the rich semantic data produced by the backend without needing to understand the complexity of how it was generated.