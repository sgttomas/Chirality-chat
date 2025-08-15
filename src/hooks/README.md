# Custom React Hooks

This directory contains custom React hooks that provide reusable logic for the Chirality Chat application, following React Hooks best practices with TypeScript strict typing and performance optimization.

## Overview

The hooks are designed for:
- **Reusable logic**: Common patterns abstracted into hooks
- **Performance**: Optimized with useMemo, useCallback, and proper dependencies
- **Type safety**: Full TypeScript integration with proper return types
- **Error handling**: Robust error states and recovery mechanisms
- **Real-time updates**: WebSocket and SSE integration patterns

## Hooks Documentation

### `useStream.ts` - Server-Sent Events Chat Streaming

**Purpose**: Manages real-time streaming responses from the chat API with proper error handling and message accumulation.

**Features**:
- Server-Sent Events (SSE) connection management
- Message accumulation to prevent content loss
- Connection retry logic with exponential backoff
- Proper cleanup and abort handling
- Error state management

**Usage**:
```typescript
const {
  isLoading,
  error,
  streamMessage
} = useStream()

// Send a message and get streaming response
await streamMessage("Hello, AI!", (chunk) => {
  // Handle incoming content chunks
  console.log('Received:', chunk)
})
```

**Implementation Details**:
```typescript
export function useStream() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const streamMessage = useCallback(async (
    message: string,
    onChunk: (content: string) => void
  ) => {
    setIsLoading(true)
    setError(null)
    
    let accumulatedContent = ''  // Prevents message loss
    
    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      })

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') return

            try {
              const parsed = JSON.parse(data)
              if (parsed.type === 'content') {
                accumulatedContent += parsed.content
                onChunk(accumulatedContent)  // Send accumulated content
              }
            } catch (e) {
              // Handle malformed JSON gracefully
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Stream error')
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { isLoading, error, streamMessage }
}
```

### `useHealth.ts` - Service Health Monitoring

**Purpose**: Monitors the health status of various services and provides real-time health indicators.

**Features**:
- Multiple service monitoring
- Automatic health checks with configurable intervals
- Health status aggregation
- Error tracking and recovery detection
- Performance metrics collection

**Usage**:
```typescript
const {
  overallHealth,
  services,
  isChecking,
  lastCheck,
  checkHealth
} = useHealth({
  services: ['api', 'neo4j', 'openai'],
  interval: 30000  // Check every 30 seconds
})

// Manual health check
await checkHealth()
```

**Return Values**:
```typescript
interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown'
  message: string
  latency?: number
  lastCheck: Date
}
```

### `useSemantic.ts` - Semantic Data Management

**Purpose**: Handles Neo4j and GraphQL operations for semantic matrix data with caching and error recovery.

**Features**:
- GraphQL query management
- Neo4j direct query support
- Automatic caching with React Query
- Optimistic updates
- Background data refetching

**Usage**:
```typescript
const {
  matrices,
  components,
  isLoading,
  error,
  refetch,
  queryMatrix,
  queryComponents
} = useSemantic()

// Query specific matrix
const matrixData = await queryMatrix('matrix-id')

// Query components with filters
const components = await queryComponents({ type: 'data' })
```

### `useMCPClient.ts` - Model Context Protocol Integration

**Purpose**: Manages MCP server connections and tool discovery with real-time status updates.

**Features**:
- WebSocket connection management
- Tool discovery and registration
- Server status monitoring
- Tool invocation with approval flows
- Connection retry and recovery

**Usage**:
```typescript
const {
  servers,
  tools,
  isConnected,
  connectionStatus,
  connectToServer,
  disconnectFromServer,
  invokeTool,
  discoverTools
} = useMCPClient()

// Connect to MCP server
await connectToServer('server-url')

// Invoke a tool with parameters
const result = await invokeTool('tool-name', { param: 'value' })
```

**Connection States**:
```typescript
type ConnectionStatus = 
  | 'disconnected'
  | 'connecting' 
  | 'connected'
  | 'error'
  | 'reconnecting'
```

### `useMatrixInteractions.ts` - Matrix Visualization Interactions

**Purpose**: Handles canvas-based matrix interactions including zoom, pan, selection, and hover states.

**Features**:
- Canvas event handling
- Zoom and pan transformations
- Node and edge selection
- Hover state management
- Keyboard navigation support

**Usage**:
```typescript
const {
  transform,
  selectedNodes,
  hoveredNode,
  isDragging,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  handleWheel,
  selectNode,
  clearSelection,
  resetView
} = useMatrixInteractions(canvasRef)

// Apply to canvas element
<canvas
  ref={canvasRef}
  onMouseDown={handleMouseDown}
  onMouseMove={handleMouseMove}
  onMouseUp={handleMouseUp}
  onWheel={handleWheel}
/>
```

**Transform Object**:
```typescript
interface Transform {
  x: number      // Pan X offset
  y: number      // Pan Y offset  
  scale: number  // Zoom level
}
```

### `usePromptBuilder.ts` - Dynamic Prompt Construction

**Purpose**: Builds dynamic prompts for AI interactions with document context and user preferences.

**Features**:
- Template-based prompt construction
- Document context injection
- User preference integration
- Prompt validation and optimization
- Token counting and optimization

**Usage**:
```typescript
const {
  buildPrompt,
  validatePrompt,
  estimateTokens,
  promptTemplates
} = usePromptBuilder()

// Build prompt with context
const prompt = buildPrompt({
  template: 'analysis',
  context: documents,
  userInput: 'Analyze this data',
  preferences: { style: 'detailed' }
})

// Validate and optimize
const { isValid, tokenCount } = validatePrompt(prompt)
```

## Hook Design Patterns

### State Management Pattern
```typescript
export function useCustomHook() {
  const [state, setState] = useState<StateType>(initialState)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const performAction = useCallback(async (params) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await apiCall(params)
      setState(result)
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { state, isLoading, error, performAction }
}
```

### Cleanup Pattern
```typescript
export function useWebSocketHook(url: string) {
  const [socket, setSocket] = useState<WebSocket | null>(null)

  useEffect(() => {
    const ws = new WebSocket(url)
    setSocket(ws)

    return () => {
      ws.close()
      setSocket(null)
    }
  }, [url])

  useEffect(() => {
    return () => {
      socket?.close()
    }
  }, [socket])
}
```

### Memoization Pattern
```typescript
export function useExpensiveComputation(data: any[]) {
  const processedData = useMemo(() => {
    return data.map(item => expensiveProcessing(item))
  }, [data])

  const computeResult = useCallback((input: string) => {
    return heavyComputation(input, processedData)
  }, [processedData])

  return { processedData, computeResult }
}
```

## Performance Considerations

### Dependency Arrays
- Always include all dependencies in useEffect, useMemo, and useCallback
- Use ESLint plugin for exhaustive-deps to catch missing dependencies
- Avoid creating objects/arrays in dependency arrays

### Memory Management
```typescript
// Good: Stable reference
const stableConfig = useMemo(() => ({ option: 'value' }), [])

// Bad: New object on every render
const unstableConfig = { option: 'value' }
```

### Event Listener Cleanup
```typescript
useEffect(() => {
  const handleResize = () => { /* handle resize */ }
  
  window.addEventListener('resize', handleResize)
  return () => window.removeEventListener('resize', handleResize)
}, [])
```

## Error Handling Patterns

### Async Error Handling
```typescript
const [error, setError] = useState<string | null>(null)

const handleAsyncOperation = useCallback(async () => {
  try {
    setError(null)
    await riskyOperation()
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Operation failed')
    // Optionally report to error tracking service
  }
}, [])
```

### Error Boundaries Integration
```typescript
// Hook that works with error boundaries
export function useErrorHandler() {
  return useCallback((error: Error, errorInfo: any) => {
    // Log error
    console.error('Hook error:', error, errorInfo)
    
    // Report to monitoring service
    // reportError(error, errorInfo)
  }, [])
}
```

## Testing Hooks

### Test Setup
```typescript
import { renderHook, act } from '@testing-library/react'
import { useStream } from './useStream'

describe('useStream', () => {
  it('manages streaming state correctly', async () => {
    const { result } = renderHook(() => useStream())
    
    expect(result.current.isLoading).toBe(false)
    
    await act(async () => {
      await result.current.streamMessage('test', jest.fn())
    })
    
    expect(result.current.error).toBeNull()
  })
})
```

### Mocking Dependencies
```typescript
// Mock fetch for useStream tests
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    body: {
      getReader: () => ({
        read: () => Promise.resolve({ done: true, value: undefined })
      })
    }
  })
) as jest.Mock
```

## Best Practices

### Hook Naming
- Always prefix with "use"
- Use descriptive names: `useStream` vs `useS`
- Include the domain: `useMatrixInteractions` vs `useInteractions`

### Return Values
- Use object returns for multiple values: `{ data, error, loading }`
- Use array returns for symmetric values: `[state, setState]`
- Maintain consistent naming patterns across hooks

### Documentation
- Document all parameters and return values
- Include usage examples
- Explain performance implications
- Note any side effects or requirements

---

🎣 These custom hooks provide a robust foundation for state management, real-time communication, and user interactions throughout the Chirality Chat application.