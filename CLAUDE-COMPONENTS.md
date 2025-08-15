# CLAUDE-COMPONENTS.md

Specialized guidance for Claude Code when working with React components and UI functionality in the Chirality Chat application.

## Component Architecture Overview

This application uses modern React patterns with:
- **TypeScript strict mode** for all components
- **Accessibility-first design** (WCAG 2.1 AA)
- **Performance optimization** with React.memo and hooks
- **Barrel exports** for clean imports
- **Error boundaries** for graceful degradation

## Key Component Patterns

### Component Structure Template
```typescript
'use client'  // For client-side components

import React, { useState, useEffect, useCallback, useMemo } from 'react'

interface ComponentProps {
  required: string
  optional?: number
  onAction: (value: string) => void
}

export const Component = React.memo<ComponentProps>(({ 
  required, 
  optional = 0, 
  onAction 
}) => {
  const [localState, setLocalState] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Memoized computations
  const processedData = useMemo(() => {
    return expensiveCalculation(required)
  }, [required])

  // Stable callbacks
  const handleAction = useCallback((value: string) => {
    setError(null)
    onAction(value)
  }, [onAction])

  // Effects with proper cleanup
  useEffect(() => {
    const controller = new AbortController()
    
    async function fetchData() {
      try {
        setIsLoading(true)
        const result = await fetch('/api/endpoint', {
          signal: controller.signal
        })
        // Handle result
      } catch (error) {
        if (!controller.signal.aborted) {
          setError(error.message)
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()

    return () => controller.abort()
  }, [required])

  // Error boundary integration
  if (error) {
    return (
      <div className="error-fallback">
        <p>Error: {error}</p>
        <button onClick={() => setError(null)}>Retry</button>
      </div>
    )
  }

  return (
    <div className="component-container">
      {/* Component content */}
    </div>
  )
})

Component.displayName = 'Component'

export default Component
```

## Critical Components

### Chat System Components

#### ChatWindow (`/src/components/chat/ChatWindow.tsx`)
**Purpose**: Main chat container with message history and streaming support.

**Key Features**:
- Message accumulation to prevent loss during streaming
- Auto-scroll with user override detection
- Virtual scrolling for performance
- Error boundary integration

**Implementation Pattern**:
```typescript
'use client'

import React, { useRef, useEffect, useState } from 'react'
import { Message } from './Message'
import { TypingIndicator } from './TypingIndicator'

interface ChatWindowProps {
  messages: ChatMessage[]
  isStreaming: boolean
  streamingContent: string
}

export const ChatWindow = React.memo<ChatWindowProps>(({ 
  messages, 
  isStreaming, 
  streamingContent 
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [userHasScrolled, setUserHasScrolled] = useState(false)

  // Auto-scroll management
  const scrollToBottom = useCallback(() => {
    if (!userHasScrolled) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [userHasScrolled])

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingContent, scrollToBottom])

  // Detect user scrolling
  const handleScroll = useCallback((e: React.UIEvent) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    const atBottom = scrollHeight - scrollTop === clientHeight
    setUserHasScrolled(!atBottom)
  }, [])

  return (
    <div 
      className="chat-window h-full overflow-y-auto p-4"
      onScroll={handleScroll}
      role="log"
      aria-label="Chat messages"
      aria-live="polite"
    >
      {messages.map((message, index) => (
        <Message
          key={`${message.id}-${index}`}
          message={message}
        />
      ))}
      
      {isStreaming && (
        <div className="streaming-message">
          <Message
            message={{
              id: 'streaming',
              role: 'assistant',
              content: streamingContent,
              timestamp: new Date()
            }}
            isStreaming={true}
          />
          <TypingIndicator />
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  )
})

ChatWindow.displayName = 'ChatWindow'
```

#### ChatInput (`/src/components/chat/ChatInput.tsx`)
**Purpose**: Message input with command detection and streaming triggers.

**Key Features**:
- Auto-resize textarea
- Keyboard shortcuts (Enter to send, Shift+Enter for new line)
- Command detection and suggestions
- Loading states and error handling

**Implementation Pattern**:
```typescript
'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/Button'

interface ChatInputProps {
  onSendMessage: (message: string) => Promise<void>
  isLoading: boolean
  placeholder?: string
}

export const ChatInput = React.memo<ChatInputProps>(({ 
  onSendMessage, 
  isLoading, 
  placeholder = "Type a message or command..." 
}) => {
  const [message, setMessage] = useState('')
  const [isComposing, setIsComposing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
    }
  }, [])

  useEffect(() => {
    adjustTextareaHeight()
  }, [message, adjustTextareaHeight])

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!message.trim() || isLoading) return

    const messageToSend = message.trim()
    setMessage('')
    
    try {
      await onSendMessage(messageToSend)
    } catch (error) {
      // Restore message on error
      setMessage(messageToSend)
    }
  }, [message, isLoading, onSendMessage])

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }, [handleSubmit, isComposing])

  // Command detection and suggestions
  const isCommand = message.toLowerCase().includes('generate') || 
                   message.toLowerCase().includes('set problem')

  return (
    <form onSubmit={handleSubmit} className="chat-input-form">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          placeholder={placeholder}
          disabled={isLoading}
          className={`
            w-full resize-none rounded-lg border p-3 pr-12
            ${isCommand ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
            focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200
            disabled:bg-gray-100 disabled:cursor-not-allowed
          `}
          rows={1}
          aria-label="Message input"
          aria-describedby={isCommand ? "command-hint" : undefined}
        />
        
        <Button
          type="submit"
          disabled={!message.trim() || isLoading}
          className="absolute right-2 bottom-2"
          size="sm"
          aria-label="Send message"
        >
          {isLoading ? '...' : '→'}
        </Button>
      </div>

      {isCommand && (
        <div id="command-hint" className="text-sm text-blue-600 mt-1">
          💡 Command detected - this will trigger document generation
        </div>
      )}
    </form>
  )
})

ChatInput.displayName = 'ChatInput'
```

### UI Components

#### Button (`/src/components/ui/Button.tsx`)
**Purpose**: Reusable button component with variants and accessibility.

```typescript
'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: React.ReactNode
}

export const Button = React.memo<ButtonProps>(({ 
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  disabled,
  children,
  ...props
}) => {
  const baseClasses = `
    inline-flex items-center justify-center rounded-md font-medium
    transition-colors duration-200 focus:outline-none focus:ring-2 
    focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50
  `

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
    destructive: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
  }

  const sizeClasses = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-base',
    lg: 'h-12 px-6 text-lg'
  }

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  )
})

Button.displayName = 'Button'
```

### Matrix Visualization Components

#### MatrixCanvas (`/src/components/matrix/MatrixCanvas.tsx`)
**Purpose**: High-performance canvas-based matrix rendering.

**Key Features**:
- Canvas API with Path2D caching
- Zoom and pan interactions
- Node selection and highlighting
- Accessibility with keyboard navigation

**Performance Pattern**:
```typescript
'use client'

import React, { useRef, useEffect, useCallback, useMemo } from 'react'
import { useMatrixInteractions } from '@/hooks/useMatrixInteractions'

interface MatrixCanvasProps {
  nodes: MatrixNode[]
  edges: MatrixEdge[]
  width: number
  height: number
  onNodeSelect?: (nodeId: string) => void
}

export const MatrixCanvas = React.memo<MatrixCanvasProps>(({ 
  nodes, 
  edges, 
  width, 
  height, 
  onNodeSelect 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number>()

  // Interaction handling
  const {
    transform,
    selectedNodes,
    hoveredNode,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel
  } = useMatrixInteractions(canvasRef)

  // Path2D caching for performance
  const nodePaths = useMemo(() => {
    const paths = new Map<string, Path2D>()
    nodes.forEach(node => {
      const path = new Path2D()
      path.arc(node.x, node.y, node.radius, 0, 2 * Math.PI)
      paths.set(node.id, path)
    })
    return paths
  }, [nodes])

  // Optimized rendering function
  const render = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Apply transform
    ctx.save()
    ctx.translate(transform.x, transform.y)
    ctx.scale(transform.scale, transform.scale)

    // Render edges first
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 1 / transform.scale
    edges.forEach(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source)
      const targetNode = nodes.find(n => n.id === edge.target)
      
      if (sourceNode && targetNode) {
        ctx.beginPath()
        ctx.moveTo(sourceNode.x, sourceNode.y)
        ctx.lineTo(targetNode.x, targetNode.y)
        ctx.stroke()
      }
    })

    // Render nodes using cached paths
    nodes.forEach(node => {
      const path = nodePaths.get(node.id)
      if (!path) return

      // Node styling based on state
      const isSelected = selectedNodes.includes(node.id)
      const isHovered = hoveredNode === node.id

      ctx.fillStyle = isSelected ? '#3b82f6' : 
                     isHovered ? '#93c5fd' : 
                     node.color || '#6b7280'
      
      ctx.fill(path)
      
      // Border for selected/hovered
      if (isSelected || isHovered) {
        ctx.strokeStyle = '#1d4ed8'
        ctx.lineWidth = 2 / transform.scale
        ctx.stroke(path)
      }

      // Label
      if (transform.scale > 0.5) {
        ctx.fillStyle = '#374151'
        ctx.font = `${12 / transform.scale}px sans-serif`
        ctx.textAlign = 'center'
        ctx.fillText(node.label, node.x, node.y + node.radius + 15 / transform.scale)
      }
    })

    ctx.restore()
  }, [nodes, edges, nodePaths, transform, selectedNodes, hoveredNode, width, height])

  // Animation loop
  useEffect(() => {
    const animate = () => {
      render()
      animationFrameRef.current = requestAnimationFrame(animate)
    }
    
    animate()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [render])

  // Handle node selection
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left - transform.x) / transform.scale
    const y = (e.clientY - rect.top - transform.y) / transform.scale

    // Find clicked node
    const clickedNode = nodes.find(node => {
      const dx = x - node.x
      const dy = y - node.y
      return Math.sqrt(dx * dx + dy * dy) <= node.radius
    })

    if (clickedNode && onNodeSelect) {
      onNodeSelect(clickedNode.id)
    }
  }, [nodes, transform, onNodeSelect])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="border border-gray-300 cursor-grab active:cursor-grabbing"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onClick={handleCanvasClick}
      tabIndex={0}
      role="img"
      aria-label="Interactive matrix visualization"
    />
  )
})

MatrixCanvas.displayName = 'MatrixCanvas'
```

## Accessibility Implementation

### ARIA Attributes Pattern
```typescript
// Proper ARIA labeling
<div
  role="region"
  aria-label="Chat interface"
  aria-describedby="chat-description"
>
  <div id="chat-description" className="sr-only">
    Interactive chat interface with AI assistant. Use Enter to send messages.
  </div>
  
  <div
    role="log"
    aria-label="Chat messages"
    aria-live="polite"
    aria-atomic="false"
  >
    {/* Messages */}
  </div>
</div>
```

### Keyboard Navigation
```typescript
const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
  switch (e.key) {
    case 'Enter':
      if (e.shiftKey) {
        // New line
        return
      }
      e.preventDefault()
      handleSubmit()
      break
      
    case 'Escape':
      e.preventDefault()
      handleCancel()
      break
      
    case 'ArrowUp':
      if (e.metaKey || e.ctrlKey) {
        e.preventDefault()
        handleHistoryUp()
      }
      break
  }
}, [handleSubmit, handleCancel, handleHistoryUp])
```

### Screen Reader Support
```typescript
// Live regions for dynamic content
<div
  aria-live="polite"
  aria-atomic="true"
  className="sr-only"
>
  {screenReaderMessage}
</div>

// Status announcements
const announceStatus = useCallback((message: string) => {
  setScreenReaderMessage(message)
  setTimeout(() => setScreenReaderMessage(''), 1000)
}, [])
```

## Error Boundary Implementation

### Component Error Boundary
```typescript
'use client'

import React from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class ComponentErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Component error:', error, errorInfo)
    // Report to error tracking service
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary p-4 border border-red-300 rounded-lg bg-red-50">
          <h3 className="text-red-800 font-semibold mb-2">Something went wrong</h3>
          <p className="text-red-600 text-sm mb-3">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
```

## Performance Optimization Patterns

### React.memo Usage
```typescript
// Memo with custom comparison
export const ExpensiveComponent = React.memo<Props>(({ data, config }) => {
  // Component implementation
}, (prevProps, nextProps) => {
  // Custom comparison for deep objects
  return JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data) &&
         prevProps.config.id === nextProps.config.id
})
```

### useMemo and useCallback
```typescript
// Expensive calculations
const processedData = useMemo(() => {
  return data.map(item => expensiveTransform(item))
}, [data])

// Stable callbacks
const handleAction = useCallback((value: string) => {
  onAction(value, additionalData)
}, [onAction, additionalData])
```

### Virtual Scrolling Pattern
```typescript
const VirtualizedList = ({ items, itemHeight = 50 }) => {
  const [scrollTop, setScrollTop] = useState(0)
  const containerHeight = 400
  
  const visibleStart = Math.floor(scrollTop / itemHeight)
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  )
  
  const visibleItems = items.slice(visibleStart, visibleEnd)
  const totalHeight = items.length * itemHeight
  const offsetY = visibleStart * itemHeight

  return (
    <div
      className="virtual-list"
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div
              key={visibleStart + index}
              style={{ height: itemHeight }}
            >
              {item.content}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

## Testing Components

### Component Testing Pattern
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChatInput } from './ChatInput'

describe('ChatInput', () => {
  const mockOnSendMessage = jest.fn()
  
  beforeEach(() => {
    mockOnSendMessage.mockClear()
  })

  it('sends message on Enter key', async () => {
    const user = userEvent.setup()
    
    render(
      <ChatInput onSendMessage={mockOnSendMessage} isLoading={false} />
    )
    
    const textarea = screen.getByRole('textbox')
    await user.type(textarea, 'Hello world')
    await user.keyboard('{Enter}')
    
    expect(mockOnSendMessage).toHaveBeenCalledWith('Hello world')
  })

  it('does not send empty messages', async () => {
    const user = userEvent.setup()
    
    render(
      <ChatInput onSendMessage={mockOnSendMessage} isLoading={false} />
    )
    
    const textarea = screen.getByRole('textbox')
    await user.type(textarea, '   ')
    await user.keyboard('{Enter}')
    
    expect(mockOnSendMessage).not.toHaveBeenCalled()
  })
})
```

---

🎨 **For Claude Code**: When working with components, prioritize accessibility, performance, and TypeScript safety. Use the established patterns for error handling, memoization, and user interactions. The admin dashboard components provide excellent examples of real-time data visualization patterns.