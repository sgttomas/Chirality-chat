# Components - React UI Library

This directory contains the complete React component library for Chirality Chat, organized by feature domain with accessibility-first design and TypeScript strict typing.

## Overview

The component architecture follows a modular design with:
- **Feature-based organization**: Components grouped by functionality
- **Accessibility compliance**: WCAG 2.1 AA standards throughout
- **TypeScript strict mode**: Full type safety and IntelliSense
- **Barrel exports**: Clean imports via index.ts files
- **React best practices**: Hooks, memoization, and performance optimization

## Component Structure

### Chat System (`chat/`)

The core chat interface with real-time streaming support.

#### `ChatWindow.tsx`
- **Purpose**: Main chat container with message history
- **Features**: Auto-scroll, message persistence, error boundaries
- **State**: Manages conversation flow and message accumulation
- **Performance**: Virtualized scrolling for long conversations

#### `ChatInput.tsx`  
- **Purpose**: User input with streaming trigger
- **Features**: Auto-resize textarea, keyboard shortcuts, command detection
- **Integration**: Triggers SSE streaming via useStream hook
- **Accessibility**: ARIA labels, keyboard navigation

#### `Message.tsx`
- **Purpose**: Individual message rendering with markdown
- **Features**: Syntax highlighting, copy functionality, timestamps
- **Types**: User messages, assistant responses, system notifications
- **Performance**: React.memo for expensive renders

#### `TypingIndicator.tsx`
- **Purpose**: Visual feedback during streaming responses
- **Animation**: CSS-based dot animation
- **States**: Typing, processing, completed

### UI Components (`ui/`)

Reusable interface elements with consistent design system.

#### `Button.tsx`
- **Variants**: Primary, secondary, outline, ghost
- **Sizes**: Small, medium, large
- **States**: Default, hover, active, disabled, loading
- **Accessibility**: Focus rings, screen reader support

#### `Card.tsx`
- **Purpose**: Content containers with elevation
- **Variants**: Default, outlined, elevated
- **Composition**: Header, body, footer sections
- **Responsive**: Mobile-first design

#### `Input.tsx`
- **Types**: Text, email, password, search
- **Features**: Validation states, icons, help text
- **Accessibility**: Associated labels, error announcements
- **Integration**: Form libraries compatible

#### `Badge.tsx`
- **Purpose**: Status indicators and labels
- **Variants**: Default, success, warning, error, info
- **Sizes**: Small, medium, large
- **Use cases**: Document status, connection states

### Matrix Visualization (`matrix/`)

Canvas-based semantic matrix rendering with interactions.

#### `MatrixCanvas.tsx`
- **Purpose**: High-performance matrix visualization
- **Technology**: HTML5 Canvas with Path2D caching
- **Features**: Zoom, pan, node selection, edge highlighting
- **Performance**: RequestAnimationFrame, offscreen rendering

#### `MatrixControls.tsx`
- **Purpose**: Matrix interaction controls
- **Features**: Zoom levels, reset view, export options
- **Accessibility**: Keyboard shortcuts, screen reader descriptions

#### `MatrixPanel.tsx`
- **Purpose**: Container with data integration
- **Integration**: Neo4j data fetching, real-time updates
- **Error handling**: Graceful degradation, retry mechanisms

#### `SemanticMatrixViewer.tsx`
- **Purpose**: Complete matrix viewing experience
- **Features**: Multiple matrix support, comparison mode
- **State**: View preferences, interaction history

### MCP Integration (`mcp/`)

Model Context Protocol interface components.

#### `MCPPanel.tsx`
- **Purpose**: Main MCP interface
- **Features**: Server management, tool discovery
- **Real-time**: WebSocket connections, status monitoring

#### `ServerList.tsx`
- **Purpose**: Available MCP servers display
- **Features**: Connection status, server details
- **Actions**: Connect, disconnect, configure

#### `ToolList.tsx`
- **Purpose**: Available tools from MCP servers
- **Features**: Tool categorization, usage history
- **Integration**: Tool invocation, parameter input

#### `ToolInvocation.tsx`
- **Purpose**: Tool execution interface
- **Features**: Parameter forms, result display
- **States**: Pending, running, completed, error

#### `ApprovalDialog.tsx`
- **Purpose**: Tool execution approval system
- **Security**: User confirmation for potentially dangerous operations
- **Accessibility**: Clear action descriptions, escape handling

### Document Management (`document/`)

Document generation and editing interface.

#### `DocumentBuilder.tsx`
- **Purpose**: Interactive document creation
- **Features**: Template selection, field validation
- **Integration**: Chirality Core document generation

#### `DocumentViewer.tsx`
- **Purpose**: Read-only document display
- **Features**: Export options, print formatting
- **Performance**: Lazy loading, caching

#### `DocumentControls.tsx`
- **Purpose**: Document management actions
- **Features**: Save, export, delete, duplicate
- **Validation**: Prevents data loss, confirmation dialogs

### Health Monitoring (`health/`)

System status and monitoring components.

#### `HealthIndicator.tsx`
- **Purpose**: Service status display
- **States**: Healthy, degraded, unhealthy, unknown
- **Updates**: Real-time status polling

#### `HealthPanel.tsx`
- **Purpose**: Comprehensive health dashboard
- **Features**: Service breakdown, historical data
- **Alerts**: Error notifications, recovery status

### Utility Components

#### `ErrorBoundary.tsx`
- **Purpose**: React error boundary for graceful degradation
- **Features**: Error logging, fallback UI, retry mechanisms
- **Coverage**: Wraps major component trees

#### `providers/QueryProvider.tsx`
- **Purpose**: React Query configuration
- **Features**: Caching, background updates, error handling
- **Performance**: Optimistic updates, stale-while-revalidate

## Design System

### Color Palette
```css
/* Primary colors */
--primary: #3b82f6;
--primary-foreground: #ffffff;

/* Status colors */
--success: #10b981;
--warning: #f59e0b;
--error: #ef4444;
--info: #6366f1;

/* Neutral colors */
--background: #ffffff;
--foreground: #111827;
--muted: #f3f4f6;
--border: #e5e7eb;
```

### Typography
```css
/* Font families */
--font-sans: ui-sans-serif, system-ui, sans-serif;
--font-mono: ui-monospace, 'Cascadia Code', 'Source Code Pro', monospace;

/* Font sizes */
--text-xs: 0.75rem;
--text-sm: 0.875rem;
--text-base: 1rem;
--text-lg: 1.125rem;
--text-xl: 1.25rem;
```

### Spacing
```css
/* Consistent spacing scale */
--space-1: 0.25rem;
--space-2: 0.5rem;
--space-4: 1rem;
--space-8: 2rem;
--space-16: 4rem;
```

## Accessibility Features

### WCAG 2.1 AA Compliance
- **Color contrast**: 4.5:1 minimum ratio
- **Keyboard navigation**: Full keyboard accessibility
- **Screen readers**: ARIA labels and descriptions
- **Focus management**: Visible focus indicators

### Keyboard Shortcuts
- **Chat**: Enter to send, Shift+Enter for new line
- **Matrix**: Arrow keys for navigation, Space for selection
- **General**: Tab for focus, Escape for modal dismissal

### Screen Reader Support
- **Live regions**: Dynamic content announcements
- **Role attributes**: Semantic HTML with ARIA roles
- **State changes**: Status updates announced appropriately

## Performance Optimization

### React Patterns
```typescript
// Memoization for expensive components
const ExpensiveComponent = React.memo(({ data }) => {
  const processedData = useMemo(() => heavyProcessing(data), [data])
  return <div>{processedData}</div>
})

// Callback optimization
const OptimizedComponent = ({ onAction }) => {
  const handleClick = useCallback((event) => {
    onAction(event.target.value)
  }, [onAction])
  
  return <Button onClick={handleClick}>Action</Button>
}
```

### Canvas Optimization
```typescript
// Path2D caching for matrix nodes
const nodeCache = useMemo(() => new Map(), [])
const getNodePath = useCallback((node) => {
  if (!nodeCache.has(node.id)) {
    const path = new Path2D()
    path.arc(node.x, node.y, node.radius, 0, 2 * Math.PI)
    nodeCache.set(node.id, path)
  }
  return nodeCache.get(node.id)
}, [nodeCache])
```

### Bundle Optimization
- **Code splitting**: Dynamic imports for large components
- **Tree shaking**: Unused code elimination
- **Barrel exports**: Optimized import/export structure

## Testing Strategy

### Component Testing
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from './Button'

test('button handles click events', () => {
  const handleClick = jest.fn()
  render(<Button onClick={handleClick}>Click me</Button>)
  
  fireEvent.click(screen.getByRole('button'))
  expect(handleClick).toHaveBeenCalledTimes(1)
})
```

### Accessibility Testing
```typescript
import { axe, toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

test('component has no accessibility violations', async () => {
  const { container } = render(<Component />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

## Usage Examples

### Chat Integration
```typescript
import { ChatWindow, ChatInput } from '@/components/chat'

export function ChatApp() {
  return (
    <div className="h-screen flex flex-col">
      <ChatWindow />
      <ChatInput />
    </div>
  )
}
```

### Matrix Visualization
```typescript
import { MatrixPanel } from '@/components/matrix'

export function MatrixDashboard() {
  return (
    <MatrixPanel 
      data={matrixData}
      onNodeSelect={handleNodeSelect}
      interactive={true}
    />
  )
}
```

### Form Building
```typescript
import { Card, Input, Button } from '@/components/ui'

export function DocumentForm() {
  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <Input 
          label="Document Title"
          value={title}
          onChange={setTitle}
          required
        />
        <Button type="submit">Create Document</Button>
      </form>
    </Card>
  )
}
```

## Contributing Guidelines

### Component Creation Checklist
- [ ] TypeScript interfaces for all props
- [ ] Accessibility attributes (ARIA, roles)
- [ ] Responsive design (mobile-first)
- [ ] Error boundary integration
- [ ] Performance optimization (memo, callbacks)
- [ ] Unit tests with accessibility checks
- [ ] Storybook documentation (if applicable)

### Code Style
- Use named exports over default exports
- Prefer composition over inheritance
- Follow React Hooks rules
- Implement proper error boundaries
- Use semantic HTML elements

---

🎨 This component library provides a complete, accessible, and performant UI foundation for the Chirality Chat application with consistent design patterns and TypeScript safety.