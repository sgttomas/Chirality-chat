# Frontend Neo4j Data Consumption Interface

## Purpose

This document defines how the chirality-ai-app frontend consumes and utilizes semantic component data from Neo4j via GraphQL. The frontend receives fully-formed semantic components and displays them without needing to understand their creation process.

## Data Schema We Consume

### Node Types We Query

#### 1. Component Nodes - What We Receive
```javascript
// Component data structure from GraphQL
{
  id: "thread:matrix:row:col",              // Unique identifier
  matrixName: "A|B|C|D|F|J",               // Which matrix it belongs to
  matrixPosition: [0, 0],                   // Position in matrix grid
  threadId: "operation_context",            // Grouping context
  initialContent: "Quality",                // Original value
  currentState: "resolved",                 // Current lifecycle state
  semanticDomain: "software_dev",           // Domain context
  ontologyBinding: "cf14:software:A:0:0:abc", // Semantic address
  createdAt: "2025-08-17T01:20:59",        // Creation timestamp
  updatedAt: "2025-08-17T01:21:45"         // Last update
}
```

**How We Use This Data**:
- Display in matrix grid at `matrixPosition`
- Show `currentState` with visual indicators (colors/icons)
- Enable clicking to view state history
- Group by `threadId` for context filtering
- Display `semanticDomain` as category badge

#### 2. ComponentState Nodes - State History
```javascript
// State evolution data we receive
{
  id: "state_uuid",
  componentId: "parent_component",
  stateType: "interpreted",                 // Which state this represents
  content: "Quality Critical",              // Content at this state
  timestamp: "2025-08-17T01:20:59",
  operationMetadata: {
    operation: "semantic_multiplication",
    resolver: "openai_gpt4",
    sources: ["comp_a", "comp_b"]
  }
}
```

**How We Display States**:
- Timeline visualization showing progression
- State comparison view (before/after)
- Operation details on hover/click
- Color coding by state type
- Duration calculation between states

#### 3. SemanticOperation Nodes - Operation History
```javascript
// Operation audit data we receive
{
  id: "operation_uuid",
  operationType: "semantic_multiplication",
  resolver: "openai_gpt4",
  timestamp: "2025-08-17T01:20:59",
  inputComponents: ["id1", "id2"],
  outputComponent: "result_id",
  performanceMetrics: {
    durationMs: 1250,
    apiCalls: 1,
    tokensUsed: 350
  }
}
```

**How We Present Operations**:
- Operation timeline with icons
- Performance metrics dashboard
- Success/failure indicators
- Lineage visualization
- Filter by operation type

### Relationships We Navigate

```javascript
// Component relationships we traverse
{
  // State evolution path
  component.stateHistory: [
    { state: "initial", content: "...", timestamp: "..." },
    { state: "interpreted", content: "...", timestamp: "..." },
    { state: "resolved", content: "...", timestamp: "..." }
  ],
  
  // Operation lineage
  component.producedBy: {
    operation: "semantic_multiplication",
    inputs: ["comp1", "comp2"]
  },
  
  // Dependencies
  component.dependsOn: ["comp1", "comp2"],
  
  // Thread context
  component.thread: {
    id: "thread_123",
    domain: "software_dev",
    componentCount: 16
  }
}
```

## Frontend Query Patterns

### Task 1: Component Display Queries

**Basic Component Query**:
```typescript
const GET_COMPONENT = gql`
  query GetComponent($id: ID!) {
    component(id: $id) {
      id
      matrixName
      matrixPosition
      currentState
      initialContent
      semanticDomain
      ontologyBinding
      updatedAt
    }
  }
`;

// Usage in React component
export function ComponentDisplay({ componentId }) {
  const { data, loading } = useQuery(GET_COMPONENT, {
    variables: { id: componentId }
  });
  
  if (loading) return <Spinner />;
  
  return (
    <Card>
      <Badge>{data.component.currentState}</Badge>
      <Title>{data.component.matrixName}[{data.component.matrixPosition}]</Title>
      <Content>{data.component.initialContent}</Content>
      <Footer>Updated: {formatDate(data.component.updatedAt)}</Footer>
    </Card>
  );
}
```

### Task 2: State History Visualization

**State Evolution Query**:
```typescript
const GET_STATE_HISTORY = gql`
  query GetStateHistory($componentId: ID!) {
    component(id: $componentId) {
      stateHistory {
        id
        stateType
        content
        timestamp
        operationMetadata {
          operation
          resolver
        }
      }
    }
  }
`;

// State timeline component
export function StateTimeline({ componentId }) {
  const { data } = useQuery(GET_STATE_HISTORY, {
    variables: { componentId }
  });
  
  return (
    <Timeline>
      {data?.component.stateHistory.map((state, index) => (
        <TimelineItem
          key={state.id}
          icon={getStateIcon(state.stateType)}
          color={getStateColor(state.stateType)}
          title={state.stateType}
          subtitle={state.operationMetadata.operation}
          content={state.content}
          timestamp={state.timestamp}
          isLast={index === data.component.stateHistory.length - 1}
        />
      ))}
    </Timeline>
  );
}
```

### Task 3: Matrix Grid Display

**Matrix Components Query**:
```typescript
const GET_MATRIX_GRID = gql`
  query GetMatrixGrid($matrixName: String!, $threadId: ID!) {
    matrixComponents(matrixName: $matrixName, threadId: $threadId) {
      id
      position: matrixPosition
      content: initialContent
      state: currentState
      semanticAddress: ontologyBinding
    }
  }
`;

// Matrix grid visualization
export function MatrixGrid({ matrixName, threadId }) {
  const { data } = useQuery(GET_MATRIX_GRID, {
    variables: { matrixName, threadId }
  });
  
  // Transform flat list to 2D grid
  const grid = useMemo(() => {
    const matrix = {};
    data?.matrixComponents.forEach(comp => {
      const [row, col] = comp.position;
      if (!matrix[row]) matrix[row] = {};
      matrix[row][col] = comp;
    });
    return matrix;
  }, [data]);
  
  return (
    <Grid>
      {Object.entries(grid).map(([row, cols]) => (
        <GridRow key={row}>
          {Object.entries(cols).map(([col, component]) => (
            <GridCell
              key={component.id}
              state={component.state}
              onClick={() => openDetails(component.id)}
            >
              <CellContent>{component.content}</CellContent>
              <CellState state={component.state} />
            </GridCell>
          ))}
        </GridRow>
      ))}
    </Grid>
  );
}
```

## Data Transformation Layer

### Task 4: Frontend Data Adapters

**Transform for Display**:
```typescript
class DataTransformer {
  // Format component for UI display
  static formatComponent(raw: RawComponent): UIComponent {
    return {
      id: raw.id,
      title: this.formatTitle(raw.matrixName, raw.matrixPosition),
      subtitle: raw.semanticDomain,
      state: {
        current: raw.currentState,
        color: this.getStateColor(raw.currentState),
        icon: this.getStateIcon(raw.currentState)
      },
      content: this.truncateContent(raw.initialContent, 100),
      metadata: {
        created: this.formatDate(raw.createdAt),
        updated: this.formatRelativeTime(raw.updatedAt),
        address: raw.ontologyBinding
      }
    };
  }
  
  // Format operation for timeline
  static formatOperation(raw: RawOperation): UIOperation {
    return {
      id: raw.id,
      type: this.humanizeOperationType(raw.operationType),
      icon: this.getOperationIcon(raw.operationType),
      timestamp: new Date(raw.timestamp),
      duration: `${raw.performanceMetrics.durationMs}ms`,
      cost: `${raw.performanceMetrics.tokensUsed} tokens`,
      inputs: raw.inputComponents.length,
      status: raw.success ? 'success' : 'failed'
    };
  }
  
  // Build relationship graph
  static buildGraph(components: RawComponent[], operations: RawOperation[]): GraphData {
    const nodes = components.map(c => ({
      id: c.id,
      label: `${c.matrixName}[${c.matrixPosition}]`,
      group: c.matrixName,
      state: c.currentState
    }));
    
    const edges = operations.flatMap(op => 
      op.inputComponents.map(input => ({
        from: input,
        to: op.outputComponent,
        label: op.operationType
      }))
    );
    
    return { nodes, edges };
  }
}
```

### Task 5: UI State Mapping

**Map to UI Components**:
```typescript
// Map state types to UI representations
const STATE_UI_MAP = {
  initial: {
    color: 'gray',
    icon: 'circle-outline',
    label: 'Initial',
    description: 'Original component value'
  },
  interpreted: {
    color: 'blue',
    icon: 'brain',
    label: 'Interpreted',
    description: 'Semantic interpretation applied'
  },
  combined: {
    color: 'purple',
    icon: 'merge',
    label: 'Combined',
    description: 'Combined with other components'
  },
  resolved: {
    color: 'green',
    icon: 'check-circle',
    label: 'Resolved',
    description: 'Final resolved state'
  }
};

// Map operation types to UI representations
const OPERATION_UI_MAP = {
  semantic_multiplication: {
    icon: 'multiply',
    color: 'blue',
    label: 'Semantic Multiplication'
  },
  element_wise_combination: {
    icon: 'combine',
    color: 'purple',
    label: 'Element-wise Combination'
  },
  semantic_addition: {
    icon: 'plus',
    color: 'green',
    label: 'Semantic Addition'
  }
};
```

## Interactive Features

### Task 6: Component Navigation

**Navigate Between Components**:
```typescript
export function ComponentNavigator({ currentId }) {
  const { data } = useQuery(GET_COMPONENT_RELATIONSHIPS, {
    variables: { id: currentId }
  });
  
  return (
    <NavigationPanel>
      <Section title="Depends On">
        {data?.component.dependsOn.map(dep => (
          <NavigationLink
            key={dep.id}
            to={`/component/${dep.id}`}
            label={dep.matrixName}
            position={dep.matrixPosition}
          />
        ))}
      </Section>
      
      <Section title="Produces">
        {data?.component.produces.map(prod => (
          <NavigationLink
            key={prod.id}
            to={`/component/${prod.id}`}
            label={prod.matrixName}
            position={prod.matrixPosition}
          />
        ))}
      </Section>
    </NavigationPanel>
  );
}
```

### Task 7: Real-Time Updates

**Subscribe to Changes**:
```typescript
const COMPONENT_UPDATES = gql`
  subscription ComponentUpdates($componentId: ID!) {
    componentUpdated(id: $componentId) {
      id
      currentState
      updatedAt
      latestOperation {
        type
        timestamp
      }
    }
  }
`;

export function LiveComponentView({ componentId }) {
  const { data: initial } = useQuery(GET_COMPONENT, {
    variables: { id: componentId }
  });
  
  const { data: update } = useSubscription(COMPONENT_UPDATES, {
    variables: { componentId }
  });
  
  // Merge initial and updates
  const component = update?.componentUpdated || initial?.component;
  
  return (
    <LiveCard>
      <LiveIndicator active={!!update} />
      <ComponentDisplay component={component} />
      {update && (
        <UpdateNotification>
          Component updated to {update.componentUpdated.currentState}
        </UpdateNotification>
      )}
    </LiveCard>
  );
}
```

## Performance Optimization

### Task 8: Efficient Data Fetching

**Batch and Cache Queries**:
```typescript
// Batch multiple component fetches
const batchComponentLoader = new DataLoader(async (ids: string[]) => {
  const { data } = await apolloClient.query({
    query: BATCH_GET_COMPONENTS,
    variables: { ids }
  });
  
  // Return in same order as requested
  return ids.map(id => 
    data.components.find(c => c.id === id)
  );
});

// Cache configuration
const cacheConfig = {
  typePolicies: {
    Component: {
      keyFields: ['id'],
      fields: {
        stateHistory: {
          // Always fetch fresh state history
          merge: false
        }
      }
    }
  }
};
```

### Task 9: Lazy Loading

**Load Data As Needed**:
```typescript
export function LazyComponentDetails({ componentId }) {
  const [expanded, setExpanded] = useState(false);
  
  // Only fetch details when expanded
  const { data } = useQuery(GET_COMPONENT_DETAILS, {
    variables: { id: componentId },
    skip: !expanded,
    fetchPolicy: 'cache-first'
  });
  
  return (
    <Collapsible>
      <CollapsibleTrigger onClick={() => setExpanded(!expanded)}>
        <ComponentSummary id={componentId} />
      </CollapsibleTrigger>
      
      {expanded && (
        <CollapsibleContent>
          {data ? (
            <ComponentFullDetails data={data.component} />
          ) : (
            <LoadingDetails />
          )}
        </CollapsibleContent>
      )}
    </Collapsible>
  );
}
```

## Error Handling

### Task 10: Graceful Degradation

**Handle Missing Data**:
```typescript
export function ResilientComponentView({ componentId }) {
  const { data, loading, error } = useQuery(GET_COMPONENT, {
    variables: { id: componentId },
    errorPolicy: 'all'  // Get partial data even with errors
  });
  
  // Handle different failure modes
  if (error?.networkError) {
    return <OfflineMessage onRetry={() => refetch()} />;
  }
  
  if (error?.graphQLErrors?.some(e => e.extensions.code === 'NOT_FOUND')) {
    return <ComponentNotFound id={componentId} />;
  }
  
  if (loading) {
    return <ComponentPlaceholder />;
  }
  
  // Show what we have, even if incomplete
  return (
    <ComponentCard>
      {data?.component ? (
        <ComponentData component={data.component} />
      ) : (
        <FallbackContent componentId={componentId} />
      )}
      {error && <ErrorBanner error={error} />}
    </ComponentCard>
  );
}
```

## Testing

### Task 11: UI Testing with Mock Data

**Test Component Display**:
```typescript
describe('Component Display', () => {
  const mockComponent = {
    id: 'test:A:0:0',
    matrixName: 'A',
    matrixPosition: [0, 0],
    currentState: 'resolved',
    initialContent: 'Quality',
    semanticDomain: 'software_dev'
  };
  
  it('displays component data correctly', () => {
    const { getByText, getByTestId } = render(
      <MockedProvider mocks={[
        {
          request: { query: GET_COMPONENT, variables: { id: 'test:A:0:0' } },
          result: { data: { component: mockComponent } }
        }
      ]}>
        <ComponentDisplay componentId="test:A:0:0" />
      </MockedProvider>
    );
    
    expect(getByText('A[0,0]')).toBeInTheDocument();
    expect(getByText('Quality')).toBeInTheDocument();
    expect(getByTestId('state-badge')).toHaveTextContent('resolved');
  });
});
```

## Summary

The chirality-ai-app frontend:

1. **Receives** fully-formed semantic components from Neo4j
2. **Queries** specific data needed for display via GraphQL
3. **Transforms** raw data into UI-friendly formats
4. **Displays** components in grids, timelines, and graphs
5. **Navigates** relationships between components
6. **Updates** in real-time via subscriptions
7. **Optimizes** performance with caching and lazy loading
8. **Handles** errors gracefully with fallbacks

The frontend is purely a consumer of the semantic data, focusing on presentation and interaction without concerning itself with how the data was produced.