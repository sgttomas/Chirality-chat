# Component Library Documentation

## Overview

This directory contains comprehensive documentation for the Chirality Chat component library. Our components follow **Atomic Design** principles and are built with **React 18**, **TypeScript**, and **Tailwind CSS**.

## Component Architecture

### Design System Hierarchy

```
Atoms (Basic Elements)
├── Button
├── Input  
├── Icon
├── Typography
└── Badge

Molecules (Simple Combinations)
├── InputGroup
├── MessageBubble
├── SearchBox
├── ProgressBar
└── AlertBanner

Organisms (Complex Components)
├── ChatWindow
├── DocumentViewer
├── NavigationBar
├── SettingsPanel
└── DocumentGenerator

Templates (Page Layouts)
├── ChatLayout
├── DocumentLayout
├── AdminLayout
└── AuthLayout

Pages (Specific Implementations)
├── ChatPage
├── DocumentPage
├── AdminPage
└── LoginPage
```

## Quick Start

### Import Patterns
```typescript
// ✅ Import from component directories
import { Button } from '@/components/atoms/Button';
import { ChatWindow } from '@/components/organisms/ChatWindow';

// ✅ Use compound components
import { Modal } from '@/components/organisms/Modal';

function App() {
  return (
    <Modal isOpen={true}>
      <Modal.Title>Confirm Action</Modal.Title>
      <Modal.Description>Are you sure?</Modal.Description>
      <Modal.Footer>
        <Button variant="secondary">Cancel</Button>
        <Button variant="primary">Confirm</Button>
      </Modal.Footer>
    </Modal>
  );
}
```

### Component Documentation Structure

Each component includes:
- **Usage Examples** - How to use the component
- **Props API** - TypeScript interfaces and prop descriptions
- **Accessibility** - WCAG compliance notes and ARIA patterns
- **Styling** - Tailwind classes and customization options
- **Testing** - Testing patterns and examples

## Component Categories

### 🔸 Atoms

| Component | Description | Status |
|-----------|-------------|---------|
| [Button](./atoms/Button.md) | Interactive button with variants and states | ✅ Stable |
| [Input](./atoms/Input.md) | Form input with validation states | ✅ Stable |
| [Icon](./atoms/Icon.md) | SVG icon system with semantic names | ✅ Stable |
| [Typography](./atoms/Typography.md) | Text elements with design system tokens | ✅ Stable |
| [Badge](./atoms/Badge.md) | Status indicators and labels | ✅ Stable |

### 🔹 Molecules  

| Component | Description | Status |
|-----------|-------------|---------|
| [InputGroup](./molecules/InputGroup.md) | Input with prefix/suffix elements | ✅ Stable |
| [MessageBubble](./molecules/MessageBubble.md) | Chat message display with role variants | ✅ Stable |
| [SearchBox](./molecules/SearchBox.md) | Search input with suggestions | ✅ Stable |
| [ProgressBar](./molecules/ProgressBar.md) | Progress indication with animation | ✅ Stable |
| [AlertBanner](./molecules/AlertBanner.md) | Notification banners with severity levels | ✅ Stable |

### 🔷 Organisms

| Component | Description | Status |
|-----------|-------------|---------|
| [ChatWindow](./organisms/ChatWindow.md) | Complete chat interface with real-time updates | ✅ Stable |
| [DocumentViewer](./organisms/DocumentViewer.md) | Document display with export capabilities | ✅ Stable |
| [NavigationBar](./organisms/NavigationBar.md) | Main navigation with responsive design | ✅ Stable |
| [SettingsPanel](./organisms/SettingsPanel.md) | User preferences and configuration | 🚧 In Progress |
| [DocumentGenerator](./organisms/DocumentGenerator.md) | Document creation workflow | 🚧 In Progress |

### 📄 Templates

| Template | Description | Status |
|----------|-------------|---------|
| [ChatLayout](./templates/ChatLayout.md) | Layout for chat interfaces | ✅ Stable |
| [DocumentLayout](./templates/DocumentLayout.md) | Layout for document management | ✅ Stable |
| [AdminLayout](./templates/AdminLayout.md) | Layout for admin dashboards | 🚧 In Progress |
| [AuthLayout](./templates/AuthLayout.md) | Layout for authentication pages | 📋 Planned |

## Component Development Guidelines

### 1. Component Structure
```typescript
// ComponentName.tsx
interface ComponentNameProps {
  // Props interface first
  children?: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}

export function ComponentName({ 
  children, 
  className, 
  variant = 'primary',
  size = 'md' 
}: ComponentNameProps) {
  const componentClasses = clsx(
    'base-component-classes',
    {
      'variant-classes': variant === 'primary',
      'size-classes': size === 'lg'
    },
    className
  );
  
  return (
    <div className={componentClasses}>
      {children}
    </div>
  );
}
```

### 2. TypeScript Patterns
```typescript
// ✅ Use discriminated unions for variants
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

// ✅ Extend HTML element props when appropriate
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
}
```

### 3. Accessibility Requirements
```typescript
// ✅ Always include ARIA attributes
<button
  aria-label="Close dialog"
  aria-expanded={isOpen}
  aria-controls="menu-items"
  role="button"
  tabIndex={0}
>
  Close
</button>

// ✅ Support keyboard navigation
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    onClick?.();
  }
};
```

### 4. Styling Guidelines
```typescript
// ✅ Use Tailwind utility classes
const buttonClasses = clsx(
  // Base styles
  'inline-flex items-center justify-center font-medium transition-colors',
  'focus:outline-none focus:ring-2 focus:ring-offset-2',
  'disabled:opacity-50 disabled:pointer-events-none',
  
  // Variant styles
  {
    'bg-primary-500 text-white hover:bg-primary-600': variant === 'primary',
    'bg-gray-200 text-gray-900 hover:bg-gray-300': variant === 'secondary'
  },
  
  // Size styles
  {
    'px-3 py-1.5 text-sm rounded-md': size === 'sm',
    'px-4 py-2 text-base rounded-lg': size === 'md'
  },
  
  className
);
```

## Testing Guidelines

### Component Testing Template
```typescript
// ComponentName.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentName } from './ComponentName';

describe('ComponentName', () => {
  test('renders with default props', () => {
    render(<ComponentName>Test Content</ComponentName>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });
  
  test('applies custom className', () => {
    render(<ComponentName className="custom-class">Content</ComponentName>);
    expect(screen.getByText('Content').parentElement).toHaveClass('custom-class');
  });
  
  test('handles user interactions', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();
    
    render(<ComponentName onClick={handleClick}>Click me</ComponentName>);
    
    await user.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  test('meets accessibility requirements', () => {
    render(<ComponentName>Accessible content</ComponentName>);
    
    const element = screen.getByText('Accessible content');
    expect(element).toBeVisible();
    expect(element).toHaveAttribute('role');
  });
});
```

### Accessibility Testing
```typescript
// accessibility.test.tsx
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('Component has no accessibility violations', async () => {
  const { container } = render(<ComponentName />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## Storybook Integration

### Story Template
```typescript
// ComponentName.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { ComponentName } from './ComponentName';

const meta: Meta<typeof ComponentName> = {
  title: 'Atoms/ComponentName',
  component: ComponentName,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'ghost']
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button'
  }
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button'
  }
};

export const WithIcon: Story = {
  args: {
    variant: 'primary',
    children: (
      <>
        <Icon name="plus" className="mr-2" />
        Add Item
      </>
    )
  }
};
```

## Performance Considerations

### 1. Component Memoization
```typescript
// Use React.memo for expensive components
export const ExpensiveComponent = memo(({ data, options }: Props) => {
  const processedData = useMemo(() => 
    processLargeDataset(data, options),
    [data, options]
  );
  
  return <div>{/* render processed data */}</div>;
});
```

### 2. Event Handler Optimization
```typescript
// ✅ Memoize event handlers
const handleClick = useCallback((id: string) => {
  onItemClick(id);
}, [onItemClick]);

// ✅ Use event delegation for lists
const handleListClick = useCallback((event: MouseEvent) => {
  const target = event.target as HTMLElement;
  const itemId = target.dataset.itemId;
  if (itemId) {
    onItemClick(itemId);
  }
}, [onItemClick]);
```

### 3. Lazy Loading
```typescript
// Lazy load heavy components
const HeavyChartComponent = lazy(() => import('./HeavyChartComponent'));

function Dashboard() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <HeavyChartComponent />
    </Suspense>
  );
}
```

## Common Patterns

### 1. Compound Components
```typescript
// Modal compound component pattern
export const Modal = Object.assign(ModalRoot, {
  Title: ModalTitle,
  Description: ModalDescription,
  Footer: ModalFooter
});

// Usage
<Modal isOpen={true}>
  <Modal.Title>Confirm</Modal.Title>
  <Modal.Description>Are you sure?</Modal.Description>
  <Modal.Footer>
    <Button>Cancel</Button>
    <Button variant="primary">Confirm</Button>
  </Modal.Footer>
</Modal>
```

### 2. Render Props
```typescript
// Flexible rendering with render props
interface DataListProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  renderEmpty?: () => React.ReactNode;
}

function DataList<T>({ data, renderItem, renderEmpty }: DataListProps<T>) {
  if (data.length === 0) {
    return renderEmpty?.() || <div>No items</div>;
  }
  
  return (
    <div>
      {data.map((item, index) => renderItem(item, index))}
    </div>
  );
}
```

### 3. Custom Hooks Integration
```typescript
// Component with custom hook
function ChatMessage({ messageId }: { messageId: string }) {
  const { message, isLoading, error } = useMessage(messageId);
  const { isStreaming } = useStreamingStatus(messageId);
  
  if (isLoading) return <MessageSkeleton />;
  if (error) return <ErrorMessage error={error} />;
  
  return (
    <MessageBubble 
      message={message} 
      isStreaming={isStreaming}
    />
  );
}
```

## Contributing

### Adding New Components

1. **Create Component Structure**
   ```bash
   mkdir src/components/atoms/NewComponent
   cd src/components/atoms/NewComponent
   touch index.ts NewComponent.tsx NewComponent.types.ts
   touch NewComponent.test.tsx NewComponent.stories.tsx
   ```

2. **Implement Component**
   - Follow TypeScript patterns
   - Include accessibility features
   - Add proper styling with Tailwind
   - Write comprehensive tests

3. **Add Documentation**
   ```bash
   touch docs/components/atoms/NewComponent.md
   ```

4. **Update Exports**
   ```typescript
   // src/components/atoms/index.ts
   export { NewComponent } from './NewComponent';
   ```

### Code Review Checklist

- [ ] **TypeScript**: Proper interfaces and type safety
- [ ] **Accessibility**: ARIA attributes and keyboard navigation
- [ ] **Performance**: Memoization where appropriate
- [ ] **Testing**: Comprehensive test coverage
- [ ] **Documentation**: Usage examples and API docs
- [ ] **Styling**: Consistent Tailwind patterns
- [ ] **Responsive**: Mobile-first design approach

## Resources

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Testing Library Docs](https://testing-library.com/docs/)
- [Storybook Documentation](https://storybook.js.org/docs/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

*For questions about components or to suggest improvements, please refer to the [Contributing Guidelines](../../CONTRIBUTING.md) or open an issue.*