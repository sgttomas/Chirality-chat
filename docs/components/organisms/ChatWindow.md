# ChatWindow Component

A complete chat interface with real-time messaging, streaming responses, and conversation management.

## Usage

```typescript
import { ChatWindow } from '@/components/organisms/ChatWindow';

function ChatPage() {
  return (
    <div className="h-screen">
      <ChatWindow conversationId="conv-123">
        <ChatWindow.Header>
          <h2>AI Assistant</h2>
          <Button variant="ghost" size="sm">Settings</Button>
        </ChatWindow.Header>
        <ChatWindow.Messages className="flex-1" />
        <ChatWindow.Input placeholder="Ask me anything..." />
      </ChatWindow>
    </div>
  );
}
```

## API Reference

### ChatWindow (Root)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `conversationId` | `string` | - | Unique conversation identifier |
| `className` | `string` | - | Additional CSS classes |
| `children` | `React.ReactNode` | - | Child components (Header, Messages, Input) |
| `onMessageSent` | `(message: Message) => void` | - | Callback when user sends a message |
| `onMessageReceived` | `(message: Message) => void` | - | Callback when AI responds |
| `autoFocus` | `boolean` | `true` | Auto-focus input on mount |

### ChatWindow.Header

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | - | Additional CSS classes |
| `children` | `React.ReactNode` | - | Header content |

### ChatWindow.Messages

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | - | Additional CSS classes |
| `maxMessages` | `number` | `100` | Maximum messages to display |
| `showTimestamps` | `boolean` | `true` | Show message timestamps |
| `enableVirtualization` | `boolean` | `false` | Enable virtual scrolling for performance |

### ChatWindow.Input

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `placeholder` | `string` | `"Type a message..."` | Input placeholder text |
| `disabled` | `boolean` | `false` | Disable input field |
| `maxLength` | `number` | `4000` | Maximum message length |
| `onSubmit` | `(message: string) => void` | - | Custom submit handler |
| `showWordCount` | `boolean` | `false` | Show character/word count |

## Component Structure

The ChatWindow uses a compound component pattern for maximum flexibility:

```typescript
// Complete chat interface
<ChatWindow conversationId="conv-123">
  <ChatWindow.Header>
    {/* Custom header content */}
  </ChatWindow.Header>
  
  <ChatWindow.Messages>
    {/* Messages automatically rendered */}
  </ChatWindow.Messages>
  
  <ChatWindow.Input>
    {/* Input field with send button */}
  </ChatWindow.Input>
</ChatWindow>
```

## Real-time Features

### Message Streaming

The ChatWindow automatically handles streaming responses from the AI:

```typescript
function StreamingExample() {
  const [streamingStatus, setStreamingStatus] = useState<string>('');
  
  return (
    <ChatWindow 
      conversationId="stream-demo"
      onMessageReceived={(message) => {
        if (message.streaming) {
          setStreamingStatus('AI is typing...');
        } else {
          setStreamingStatus('');
        }
      }}
    >
      <ChatWindow.Header>
        <div className="flex items-center justify-between">
          <h2>Streaming Demo</h2>
          {streamingStatus && (
            <span className="text-sm text-gray-500">{streamingStatus}</span>
          )}
        </div>
      </ChatWindow.Header>
      
      <ChatWindow.Messages />
      <ChatWindow.Input />
    </ChatWindow>
  );
}
```

### Connection Status

Monitor and display connection status:

```typescript
function ChatWithStatus() {
  const { isConnected, error } = useChatConnection();
  
  return (
    <ChatWindow>
      <ChatWindow.Header>
        <div className="flex items-center gap-2">
          <h2>Chat</h2>
          <div className={clsx(
            'w-2 h-2 rounded-full',
            isConnected ? 'bg-green-500' : 'bg-red-500'
          )} />
          <span className="text-xs text-gray-500">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </ChatWindow.Header>
      
      <ChatWindow.Messages />
      
      <ChatWindow.Input 
        disabled={!isConnected}
        placeholder={
          isConnected ? "Type a message..." : "Connecting..."
        }
      />
      
      {error && (
        <div className="p-3 bg-red-50 border-t border-red-200">
          <p className="text-sm text-red-700">
            Connection error: {error}
          </p>
        </div>
      )}
    </ChatWindow>
  );
}
```

## Message Types

### User Messages

```typescript
const userMessage: Message = {
  id: 'msg-123',
  role: 'user',
  content: 'Hello, how are you?',
  timestamp: new Date(),
  metadata: {
    edited: false,
    reactions: []
  }
};
```

### Assistant Messages

```typescript
const assistantMessage: Message = {
  id: 'msg-124', 
  role: 'assistant',
  content: 'Hello! I\'m doing well, thank you for asking.',
  timestamp: new Date(),
  streaming: false,
  metadata: {
    model: 'gpt-4',
    tokens: 156,
    citations: []
  }
};
```

### System Messages

```typescript
const systemMessage: Message = {
  id: 'msg-125',
  role: 'system', 
  content: 'Conversation started',
  timestamp: new Date(),
  metadata: {
    type: 'conversation_start'
  }
};
```

## Advanced Usage

### Custom Message Rendering

```typescript
function CustomChatWindow() {
  return (
    <ChatWindow>
      <ChatWindow.Header>
        <h2>Custom Chat</h2>
      </ChatWindow.Header>
      
      <ChatWindow.Messages 
        renderMessage={(message) => (
          <CustomMessageBubble 
            key={message.id}
            message={message}
            onEdit={handleEdit}
            onDelete={handleDelete}
            showActions={message.role === 'user'}
          />
        )}
      />
      
      <ChatWindow.Input />
    </ChatWindow>
  );
}
```

### Conversation Management

```typescript
function MultiConversationChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const createNewConversation = () => {
    const newConv: Conversation = {
      id: generateId(),
      title: 'New Conversation',
      createdAt: new Date(),
      messages: []
    };
    
    setConversations(prev => [...prev, newConv]);
    setActiveId(newConv.id);
  };
  
  return (
    <div className="flex h-screen">
      <ConversationSidebar 
        conversations={conversations}
        activeId={activeId}
        onSelect={setActiveId}
        onNew={createNewConversation}
      />
      
      <div className="flex-1">
        {activeId ? (
          <ChatWindow 
            conversationId={activeId}
            onMessageSent={(message) => {
              // Update conversation in state
              updateConversationMessages(activeId, message);
            }}
          >
            <ChatWindow.Header>
              <ConversationTitle conversationId={activeId} />
            </ChatWindow.Header>
            <ChatWindow.Messages />
            <ChatWindow.Input />
          </ChatWindow>
        ) : (
          <EmptyState onStartChat={createNewConversation} />
        )}
      </div>
    </div>
  );
}
```

### File Upload Integration

```typescript
function ChatWithFileUpload() {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  
  const handleFileUpload = (files: File[]) => {
    setUploadedFiles(prev => [...prev, ...files]);
  };
  
  return (
    <ChatWindow>
      <ChatWindow.Header>
        <h2>Chat with Files</h2>
      </ChatWindow.Header>
      
      <ChatWindow.Messages />
      
      <div className="border-t border-gray-200">
        {uploadedFiles.length > 0 && (
          <div className="p-3 bg-gray-50">
            <div className="flex flex-wrap gap-2">
              {uploadedFiles.map((file, index) => (
                <FileChip 
                  key={index}
                  file={file}
                  onRemove={() => {
                    setUploadedFiles(prev => 
                      prev.filter((_, i) => i !== index)
                    );
                  }}
                />
              ))}
            </div>
          </div>
        )}
        
        <ChatWindow.Input 
          onFileUpload={handleFileUpload}
          acceptedFileTypes={['image/*', '.pdf', '.txt']}
        />
      </div>
    </ChatWindow>
  );
}
```

## Keyboard Shortcuts

The ChatWindow includes built-in keyboard shortcuts:

| Key Combination | Action |
|----------------|---------|
| `Enter` | Send message |
| `Shift + Enter` | New line in message |
| `Ctrl/Cmd + K` | Focus message input |
| `Escape` | Clear current input |
| `↑` | Edit last user message |
| `Ctrl/Cmd + /` | Show keyboard shortcuts |

### Custom Shortcuts

```typescript
function ChatWithCustomShortcuts() {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case 'n':
          event.preventDefault();
          createNewConversation();
          break;
        case 's':
          event.preventDefault();
          saveConversation();
          break;
      }
    }
  }, []);
  
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
  
  return <ChatWindow>{/* ... */}</ChatWindow>;
}
```

## Accessibility

### Screen Reader Support

```typescript
// Proper ARIA labels and live regions
<ChatWindow>
  <ChatWindow.Header>
    <h1 id="chat-title">AI Assistant Chat</h1>
  </ChatWindow.Header>
  
  <ChatWindow.Messages 
    role="log"
    aria-label="Conversation messages"
    aria-live="polite"
    aria-relevant="additions"
  />
  
  <ChatWindow.Input 
    aria-label="Type your message"
    aria-describedby="input-help"
  />
  
  <div id="input-help" className="sr-only">
    Press Enter to send, Shift+Enter for new line
  </div>
</ChatWindow>
```

### Keyboard Navigation

- **Tab**: Navigate between interactive elements
- **Arrow Keys**: Navigate through message history
- **Enter/Space**: Activate buttons and send messages
- **Escape**: Close modals or clear input

### High Contrast Support

```typescript
// Automatic high contrast detection
function AccessibleChatWindow() {
  const prefersHighContrast = useMediaQuery('(prefers-contrast: high)');
  
  return (
    <ChatWindow 
      className={clsx({
        'high-contrast': prefersHighContrast
      })}
    >
      <ChatWindow.Header>
        <h2>Accessible Chat</h2>
      </ChatWindow.Header>
      <ChatWindow.Messages />
      <ChatWindow.Input />
    </ChatWindow>
  );
}
```

## Performance Optimization

### Virtual Scrolling

For conversations with many messages:

```typescript
<ChatWindow>
  <ChatWindow.Messages 
    enableVirtualization={true}
    maxMessages={1000}
    estimatedMessageHeight={120}
  />
</ChatWindow>
```

### Message Memoization

```typescript
const MemoizedMessageBubble = memo(MessageBubble, (prev, next) => {
  return (
    prev.message.id === next.message.id &&
    prev.message.content === next.message.content &&
    prev.isStreaming === next.isStreaming
  );
});
```

### Lazy Loading

```typescript
function LazyLoadingChat() {
  const { 
    messages, 
    hasMore, 
    loadMore, 
    isLoading 
  } = usePaginatedMessages(conversationId);
  
  return (
    <ChatWindow>
      <ChatWindow.Messages 
        onScrollTop={() => {
          if (hasMore && !isLoading) {
            loadMore();
          }
        }}
      >
        {isLoading && <LoadingSpinner />}
        {messages.map(message => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </ChatWindow.Messages>
    </ChatWindow>
  );
}
```

## Testing

### Component Testing

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatWindow } from './ChatWindow';

describe('ChatWindow', () => {
  test('renders chat interface', () => {
    render(
      <ChatWindow>
        <ChatWindow.Header>Test Chat</ChatWindow.Header>
        <ChatWindow.Messages />
        <ChatWindow.Input />
      </ChatWindow>
    );
    
    expect(screen.getByText('Test Chat')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
  });
  
  test('sends message on form submission', async () => {
    const user = userEvent.setup();
    const onMessageSent = jest.fn();
    
    render(
      <ChatWindow onMessageSent={onMessageSent}>
        <ChatWindow.Messages />
        <ChatWindow.Input />
      </ChatWindow>
    );
    
    const input = screen.getByPlaceholderText('Type a message...');
    await user.type(input, 'Hello world');
    await user.keyboard('{Enter}');
    
    expect(onMessageSent).toHaveBeenCalledWith(
      expect.objectContaining({
        content: 'Hello world',
        role: 'user'
      })
    );
  });
  
  test('handles streaming responses', async () => {
    const { rerender } = render(
      <ChatWindow>
        <ChatWindow.Messages />
      </ChatWindow>
    );
    
    // Simulate streaming message
    const streamingMessage = {
      id: '1',
      role: 'assistant' as const,
      content: 'Hello',
      streaming: true,
      timestamp: new Date()
    };
    
    // Update with streaming content
    // ... test streaming behavior
  });
});
```

### Integration Testing

```typescript
describe('ChatWindow Integration', () => {
  test('full conversation flow', async () => {
    const user = userEvent.setup();
    
    render(<ChatWindow conversationId="test-conv" />);
    
    // Send message
    const input = screen.getByPlaceholderText('Type a message...');
    await user.type(input, 'Hello AI');
    await user.keyboard('{Enter}');
    
    // Wait for response
    await screen.findByText('Hello AI'); // User message
    await screen.findByText(/AI response/, {}, { timeout: 5000 });
    
    // Check message count
    const messages = screen.getAllByTestId('message-bubble');
    expect(messages).toHaveLength(2);
  });
});
```

## Error Handling

### Connection Errors

```typescript
function RobustChatWindow() {
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const handleConnectionError = useCallback((error: string) => {
    setError(error);
    
    // Auto-retry with exponential backoff
    if (retryCount < 3) {
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        // Reconnect logic
      }, Math.pow(2, retryCount) * 1000);
    }
  }, [retryCount]);
  
  return (
    <ChatWindow onConnectionError={handleConnectionError}>
      <ChatWindow.Header>
        <h2>Robust Chat</h2>
      </ChatWindow.Header>
      
      <ChatWindow.Messages />
      
      <ChatWindow.Input 
        disabled={!!error}
        placeholder={error ? "Reconnecting..." : "Type a message..."}
      />
      
      {error && (
        <ErrorBanner 
          message={error}
          action={
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => {
                setError(null);
                setRetryCount(0);
              }}
            >
              Retry
            </Button>
          }
        />
      )}
    </ChatWindow>
  );
}
```

### Message Failures

```typescript
function ChatWithMessageRetry() {
  const [failedMessages, setFailedMessages] = useState<Set<string>>(new Set());
  
  const retryMessage = useCallback(async (messageId: string) => {
    // Retry sending logic
    setFailedMessages(prev => {
      const next = new Set(prev);
      next.delete(messageId);
      return next;
    });
  }, []);
  
  return (
    <ChatWindow
      onMessageFailed={(messageId, error) => {
        setFailedMessages(prev => new Set(prev).add(messageId));
      }}
    >
      <ChatWindow.Messages 
        renderMessage={(message) => (
          <MessageBubble
            message={message}
            failed={failedMessages.has(message.id)}
            onRetry={() => retryMessage(message.id)}
          />
        )}
      />
    </ChatWindow>
  );
}
```

## Related Components

- [MessageBubble](../molecules/MessageBubble.md) - Individual message display
- [Button](../atoms/Button.md) - Action buttons
- [Input](../atoms/Input.md) - Message input field
- [Modal](./Modal.md) - Settings and confirmation dialogs

---

**Version**: 1.0.0  
**Last Updated**: 2024-01-15  
**Status**: ✅ Stable