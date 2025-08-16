# ADR-011: Server-Sent Events (SSE) Streaming Pattern

**Status**: Accepted  
**Date**: 2024-01-15  
**Deciders**: Frontend Team, Backend Team  

## Context

The Chirality Chat application requires real-time streaming of AI-generated responses and document generation progress. Users need to see content appearing incrementally rather than waiting for complete responses. We need a robust, scalable solution for real-time data streaming between the backend and frontend.

Key requirements:
- Real-time message streaming for chat interfaces
- Progress updates during document generation
- Graceful handling of connection failures
- Content accumulation to prevent message loss
- Cross-browser compatibility

## Decision

We will implement **Server-Sent Events (SSE)** as our primary real-time streaming technology, using the native **EventSource API** with custom retry logic and content accumulation patterns.

## Rationale

### SSE Advantages for Our Use Case

1. **Simplicity & Reliability**
   - Built-in browser support (no additional libraries)
   - Automatic reconnection with exponential backoff
   - HTTP-based (works through firewalls and proxies)
   - Text-based protocol (perfect for chat content)

2. **Performance Benefits**
   - Lower overhead than WebSocket for one-way streaming
   - Efficient for high-frequency small messages
   - Built-in compression support
   - No connection handshake overhead after initial connection

3. **Development Experience**
   - Simple to implement and debug
   - Easy to test with curl/browser dev tools
   - Integrates well with Next.js API routes
   - No complex protocol handling required

4. **AI Streaming Integration**
   - Perfect fit for LLM token streaming
   - Natural alignment with OpenAI's streaming API
   - Easy content accumulation patterns

### Technical Implementation

#### Backend Streaming (Next.js API Route)
```typescript
// app/api/chat/stream/route.ts
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const { message } = await request.json();
  
  // Create a ReadableStream for SSE
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      
      // Send initial event
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'start' })}\n\n`)
      );
      
      // Simulate streaming content (replace with actual LLM streaming)
      simulateAIResponse(message, (chunk) => {
        const data = JSON.stringify({
          type: 'content',
          content: chunk,
          timestamp: Date.now()
        });
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      })
      .then(() => {
        // Send completion event
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
        );
        controller.close();
      })
      .catch((error) => {
        // Send error event
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ 
            type: 'error', 
            error: error.message 
          })}\n\n`)
        );
        controller.close();
      });
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

async function simulateAIResponse(
  message: string, 
  onChunk: (chunk: string) => void
): Promise<void> {
  // Example: Integrate with OpenAI streaming
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: message }],
    stream: true
  });
  
  for await (const chunk of response) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      onChunk(content);
      // Small delay to prevent overwhelming the client
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
}
```

#### Frontend Streaming Hook
```typescript
// hooks/use-sse-stream.ts
import { useCallback, useRef, useState } from 'react';

interface StreamEvent {
  type: 'start' | 'content' | 'done' | 'error';
  content?: string;
  error?: string;
  timestamp?: number;
}

interface UseSSEStreamOptions {
  onMessage?: (content: string) => void;
  onComplete?: (fullContent: string) => void;
  onError?: (error: string) => void;
  reconnectAttempts?: number;
}

export function useSSEStream(endpoint: string, options: UseSSEStreamOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [accumulatedContent, setAccumulatedContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = options.reconnectAttempts ?? 3;
  
  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
    setIsStreaming(false);
  }, []);
  
  const connect = useCallback(async (data: any) => {
    // Disconnect any existing connection
    disconnect();
    
    setError(null);
    setAccumulatedContent('');
    
    try {
      // First, POST the data to initialize the stream
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Create EventSource for the streaming response
      const eventSource = new EventSource(endpoint);
      eventSourceRef.current = eventSource;
      
      eventSource.onopen = () => {
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
      };
      
      eventSource.onmessage = (event) => {
        try {
          const parsed: StreamEvent = JSON.parse(event.data);
          
          switch (parsed.type) {
            case 'start':
              setIsStreaming(true);
              break;
              
            case 'content':
              if (parsed.content) {
                setAccumulatedContent(prev => {
                  const newContent = prev + parsed.content;
                  options.onMessage?.(newContent);
                  return newContent;
                });
              }
              break;
              
            case 'done':
              setIsStreaming(false);
              options.onComplete?.(accumulatedContent);
              disconnect();
              break;
              
            case 'error':
              const errorMsg = parsed.error || 'Unknown streaming error';
              setError(errorMsg);
              options.onError?.(errorMsg);
              setIsStreaming(false);
              disconnect();
              break;
          }
        } catch (err) {
          console.error('Failed to parse SSE event:', err);
        }
      };
      
      eventSource.onerror = () => {
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          
          // Exponential backoff
          const delay = Math.pow(2, reconnectAttemptsRef.current) * 1000;
          setTimeout(() => {
            console.log(`Reconnecting... Attempt ${reconnectAttemptsRef.current}`);
            connect(data);
          }, delay);
        } else {
          setError('Connection failed after multiple attempts');
          setIsStreaming(false);
          disconnect();
        }
      };
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to start stream';
      setError(errorMsg);
      options.onError?.(errorMsg);
    }
  }, [endpoint, options, disconnect, accumulatedContent, maxReconnectAttempts]);
  
  return {
    connect,
    disconnect,
    isConnected,
    isStreaming,
    accumulatedContent,
    error
  };
}
```

#### Chat Component Integration
```typescript
// components/chat/chat-window.tsx
import { useSSEStream } from '@/hooks/use-sse-stream';
import { useChatStore } from '@/stores/chat-store';

export function ChatWindow() {
  const { messages, addMessage, updateMessage } = useChatStore();
  const [currentMessageId, setCurrentMessageId] = useState<string | null>(null);
  
  const { connect, isStreaming, accumulatedContent, error } = useSSEStream(
    '/api/chat/stream',
    {
      onMessage: (content) => {
        // Update the current streaming message
        if (currentMessageId) {
          updateMessage(currentMessageId, { 
            content, 
            streaming: true 
          });
        }
      },
      onComplete: (finalContent) => {
        // Mark message as complete
        if (currentMessageId) {
          updateMessage(currentMessageId, { 
            content: finalContent, 
            streaming: false 
          });
        }
        setCurrentMessageId(null);
      },
      onError: (errorMsg) => {
        // Add error message to chat
        addMessage({
          id: generateId(),
          role: 'system',
          content: `Error: ${errorMsg}`,
          timestamp: new Date(),
          error: true
        });
        setCurrentMessageId(null);
      }
    }
  );
  
  const handleSendMessage = useCallback(async (content: string) => {
    // Add user message
    const userMessage = {
      id: generateId(),
      role: 'user' as const,
      content,
      timestamp: new Date()
    };
    addMessage(userMessage);
    
    // Create placeholder for assistant response
    const assistantMessageId = generateId();
    const assistantMessage = {
      id: assistantMessageId,
      role: 'assistant' as const,
      content: '',
      timestamp: new Date(),
      streaming: true
    };
    addMessage(assistantMessage);
    setCurrentMessageId(assistantMessageId);
    
    // Start streaming
    await connect({ message: content });
  }, [addMessage, connect]);
  
  return (
    <div className="chat-window">
      <div className="messages">
        {messages.map(message => (
          <MessageBubble 
            key={message.id} 
            message={message}
            isStreaming={message.streaming}
          />
        ))}
      </div>
      
      <ChatInput 
        onSend={handleSendMessage}
        disabled={isStreaming}
        placeholder={isStreaming ? "AI is responding..." : "Type a message..."}
      />
      
      {error && (
        <div className="error-banner">
          Connection error: {error}
        </div>
      )}
    </div>
  );
}
```

### Document Generation Streaming
```typescript
// hooks/use-document-stream.ts
export function useDocumentStream() {
  const { connect, isStreaming, error } = useSSEStream('/api/documents/generate');
  
  const generateDocument = useCallback(async (params: GenerateDocumentParams) => {
    return connect({
      type: params.type,
      problem: params.problem,
      context: params.context
    });
  }, [connect]);
  
  return {
    generateDocument,
    isGenerating: isStreaming,
    error
  };
}

// Usage in document component
function DocumentGenerator() {
  const { generateDocument, isGenerating } = useDocumentStream();
  const [progress, setProgress] = useState(0);
  
  const handleGenerate = useCallback(async () => {
    await generateDocument({
      type: 'DS',
      problem: 'Sample problem',
      context: {}
    });
  }, [generateDocument]);
  
  return (
    <div>
      <button 
        onClick={handleGenerate} 
        disabled={isGenerating}
        className="btn-primary"
      >
        {isGenerating ? 'Generating...' : 'Generate Document'}
      </button>
      
      {isGenerating && (
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
```

## Error Handling & Resilience

### Connection Failure Recovery
```typescript
// utils/sse-recovery.ts
export class SSERecoveryManager {
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private baseDelay = 1000;
  
  async attemptReconnection(
    connectFn: () => Promise<void>,
    onFailure?: (error: string) => void
  ): Promise<boolean> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      onFailure?.('Maximum reconnection attempts reached');
      return false;
    }
    
    this.reconnectAttempts++;
    const delay = this.baseDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    try {
      await connectFn();
      this.reconnectAttempts = 0; // Reset on successful connection
      return true;
    } catch (error) {
      console.warn(`Reconnection attempt ${this.reconnectAttempts} failed:`, error);
      return this.attemptReconnection(connectFn, onFailure);
    }
  }
  
  reset() {
    this.reconnectAttempts = 0;
  }
}
```

### Content Accumulation & Persistence
```typescript
// utils/content-accumulator.ts
export class ContentAccumulator {
  private content = '';
  private chunks: string[] = [];
  private lastUpdateTime = Date.now();
  
  addChunk(chunk: string): string {
    this.chunks.push(chunk);
    this.content += chunk;
    this.lastUpdateTime = Date.now();
    return this.content;
  }
  
  getFullContent(): string {
    return this.content;
  }
  
  getChunks(): string[] {
    return [...this.chunks];
  }
  
  clear(): void {
    this.content = '';
    this.chunks = [];
    this.lastUpdateTime = Date.now();
  }
  
  // Persist content to localStorage for recovery
  persist(key: string): void {
    localStorage.setItem(key, JSON.stringify({
      content: this.content,
      chunks: this.chunks,
      timestamp: this.lastUpdateTime
    }));
  }
  
  // Restore content from localStorage
  restore(key: string): boolean {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const data = JSON.parse(stored);
        this.content = data.content || '';
        this.chunks = data.chunks || [];
        this.lastUpdateTime = data.timestamp || Date.now();
        return true;
      }
    } catch (error) {
      console.warn('Failed to restore content:', error);
    }
    return false;
  }
}
```

## Performance Optimization

### Message Throttling
```typescript
// hooks/use-throttled-updates.ts
import { useCallback, useRef } from 'react';

export function useThrottledUpdates<T>(
  updateFn: (value: T) => void,
  delay: number = 100
) {
  const lastUpdateTime = useRef(0);
  const pendingUpdate = useRef<T | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const throttledUpdate = useCallback((value: T) => {
    const now = Date.now();
    pendingUpdate.current = value;
    
    if (now - lastUpdateTime.current >= delay) {
      // Update immediately if enough time has passed
      updateFn(value);
      lastUpdateTime.current = now;
      pendingUpdate.current = null;
    } else {
      // Schedule update for later
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        if (pendingUpdate.current !== null) {
          updateFn(pendingUpdate.current);
          lastUpdateTime.current = Date.now();
          pendingUpdate.current = null;
        }
      }, delay - (now - lastUpdateTime.current));
    }
  }, [updateFn, delay]);
  
  return throttledUpdate;
}

// Usage in streaming component
function StreamingMessage({ messageId }: { messageId: string }) {
  const updateMessage = useChatStore(state => state.updateMessage);
  
  const throttledUpdate = useThrottledUpdates(
    (content: string) => updateMessage(messageId, { content }),
    100 // Update UI at most once per 100ms
  );
  
  // Use throttledUpdate instead of direct updateMessage
  return <div>...</div>;
}
```

## Testing Strategy

### SSE Integration Tests
```typescript
// __tests__/sse-stream.test.ts
import { renderHook, act } from '@testing-library/react';
import { useSSEStream } from '@/hooks/use-sse-stream';

// Mock EventSource
class MockEventSource {
  url: string;
  onopen?: () => void;
  onmessage?: (event: MessageEvent) => void;
  onerror?: () => void;
  
  constructor(url: string) {
    this.url = url;
  }
  
  close() {
    // Mock implementation
  }
}

global.EventSource = MockEventSource as any;

describe('useSSEStream', () => {
  test('connects and receives messages', async () => {
    const onMessage = jest.fn();
    const { result } = renderHook(() => 
      useSSEStream('/api/test', { onMessage })
    );
    
    await act(async () => {
      await result.current.connect({ test: 'data' });
    });
    
    // Simulate receiving a message
    const mockEvent = {
      data: JSON.stringify({ type: 'content', content: 'Hello' })
    } as MessageEvent;
    
    act(() => {
      if (result.current.eventSource?.onmessage) {
        result.current.eventSource.onmessage(mockEvent);
      }
    });
    
    expect(onMessage).toHaveBeenCalledWith('Hello');
  });
  
  test('handles connection errors with retry', async () => {
    const onError = jest.fn();
    const { result } = renderHook(() => 
      useSSEStream('/api/test', { onError, reconnectAttempts: 2 })
    );
    
    await act(async () => {
      await result.current.connect({ test: 'data' });
    });
    
    // Simulate connection error
    act(() => {
      if (result.current.eventSource?.onerror) {
        result.current.eventSource.onerror();
      }
    });
    
    // Should attempt reconnection
    expect(result.current.error).toBeNull(); // Still trying to reconnect
  });
});
```

### End-to-End Testing
```typescript
// __tests__/e2e/chat-streaming.test.ts
import { test, expect } from '@playwright/test';

test('chat streaming works end-to-end', async ({ page }) => {
  await page.goto('/chat');
  
  // Send a message
  await page.fill('[data-testid="chat-input"]', 'Hello, AI!');
  await page.click('[data-testid="send-button"]');
  
  // Wait for streaming to start
  await expect(page.locator('[data-testid="streaming-indicator"]')).toBeVisible();
  
  // Wait for response to complete
  await expect(page.locator('[data-testid="streaming-indicator"]')).toBeHidden({
    timeout: 30000
  });
  
  // Check that response was received
  const messages = await page.locator('[data-testid="message"]').count();
  expect(messages).toBeGreaterThan(1); // User message + AI response
});
```

## Alternatives Considered

### WebSocket
- **Pros**: Bi-directional, lower latency, more protocol features
- **Cons**: More complex implementation, connection management overhead, firewall issues
- **Verdict**: Overkill for primarily one-way streaming

### HTTP Polling
- **Pros**: Simple implementation, universal compatibility
- **Cons**: Higher latency, inefficient resource usage, poor UX
- **Verdict**: Not suitable for real-time chat experience

### WebRTC Data Channels
- **Pros**: Very low latency, peer-to-peer capable
- **Cons**: Complex setup, NAT traversal issues, overkill for server communication
- **Verdict**: Not appropriate for server-client messaging

### GraphQL Subscriptions
- **Pros**: Type-safe, integrates with existing GraphQL
- **Cons**: Added complexity, requires WebSocket transport, heavier protocol
- **Verdict**: Too complex for our streaming needs

## Consequences

### Positive
- **Simple Implementation**: Native browser support, minimal dependencies
- **Reliable Streaming**: Built-in reconnection and error handling
- **Great UX**: Real-time content appearance without full-page reloads
- **Performance**: Efficient for high-frequency small messages

### Negative
- **One-way Communication**: Cannot send data back through SSE connection
- **Browser Limits**: Connection limits per domain (usually 6)
- **Text-Only**: Binary data requires encoding (not a concern for our use case)

### Monitoring Requirements
- **Connection Success Rate**: Track successful connections vs failures
- **Reconnection Frequency**: Monitor how often reconnections occur
- **Message Latency**: Time from server send to client receive
- **Content Integrity**: Ensure no message chunks are lost

## Implementation Checklist

- [x] ✅ **Basic SSE Hook**: Core useSSEStream implementation
- [x] ✅ **Error Handling**: Reconnection logic and error states
- [x] ✅ **Content Accumulation**: Prevent message loss during streaming
- [x] ✅ **Chat Integration**: Integration with chat store and UI
- [ ] 🚧 **Document Streaming**: Progress updates for document generation
- [ ] 🚧 **Performance Optimization**: Message throttling and batching
- [ ] 📋 **Offline Support**: Queue messages when connection is lost
- [ ] 📋 **Metrics Collection**: Performance and reliability monitoring

## Related Decisions

- **ADR-008**: Next.js App Router (SSE API route integration)
- **ADR-009**: Zustand State Management (streaming state management)
- **ADR-012**: Component Composition (streaming UI patterns)

## References

- [Server-Sent Events Specification](https://html.spec.whatwg.org/multipage/server-sent-events.html)
- [EventSource API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/EventSource)
- [Next.js Streaming Documentation](https://nextjs.org/docs/app/building-your-application/routing/route-handlers#streaming)
- [OpenAI Streaming Guide](https://platform.openai.com/docs/api-reference/streaming)