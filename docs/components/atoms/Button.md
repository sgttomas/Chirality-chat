# Button Component

A versatile, accessible button component with multiple variants, sizes, and states.

## Usage

```typescript
import { Button } from '@/components/atoms/Button';

function Example() {
  return (
    <div className="space-y-4">
      <Button variant="primary">Primary Action</Button>
      <Button variant="secondary">Secondary Action</Button>
      <Button variant="ghost">Ghost Action</Button>
      <Button variant="destructive">Delete Item</Button>
    </div>
  );
}
```

## API Reference

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'ghost' \| 'destructive'` | `'primary'` | Visual style variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Button size |
| `loading` | `boolean` | `false` | Shows loading spinner and disables interaction |
| `disabled` | `boolean` | `false` | Disables the button |
| `className` | `string` | - | Additional CSS classes |
| `children` | `React.ReactNode` | - | Button content |
| `onClick` | `() => void` | - | Click event handler |

### HTML Props

The Button component also accepts all standard HTML button attributes:
- `type` - Button type (`'button'`, `'submit'`, `'reset'`)
- `form` - Associated form ID
- `aria-label` - Accessibility label
- `tabIndex` - Tab order

## Variants

### Primary
The main call-to-action button with high emphasis.

```typescript
<Button variant="primary">Save Changes</Button>
<Button variant="primary" size="lg">Get Started</Button>
```

### Secondary  
Medium emphasis button for secondary actions.

```typescript
<Button variant="secondary">Cancel</Button>
<Button variant="secondary" size="sm">Edit</Button>
```

### Ghost
Low emphasis button, often used for tertiary actions.

```typescript
<Button variant="ghost">Learn More</Button>
<Button variant="ghost" size="sm">Skip</Button>
```

### Destructive
High emphasis button for dangerous actions.

```typescript
<Button variant="destructive">Delete Account</Button>
<Button variant="destructive" size="sm">Remove</Button>
```

## Sizes

### Small (`sm`)
Compact button for tight spaces.

```typescript
<Button size="sm">Small Button</Button>
```

### Medium (`md`) - Default
Standard button size for most use cases.

```typescript
<Button size="md">Medium Button</Button>
<Button>Default Size</Button>
```

### Large (`lg`)
Prominent button for important actions.

```typescript
<Button size="lg">Large Button</Button>
```

## States

### Loading
Shows a spinner and disables interaction.

```typescript
function SaveButton() {
  const [isSaving, setIsSaving] = useState(false);
  
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveData();
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <Button 
      variant="primary" 
      loading={isSaving}
      onClick={handleSave}
    >
      {isSaving ? 'Saving...' : 'Save Changes'}
    </Button>
  );
}
```

### Disabled
Prevents interaction and shows disabled appearance.

```typescript
<Button disabled>Disabled Button</Button>
<Button variant="primary" disabled>Cannot Click</Button>
```

## Icon Buttons

### With Icon and Text

```typescript
import { Icon } from '@/components/atoms/Icon';

<Button variant="primary">
  <Icon name="plus" className="mr-2" />
  Add Item
</Button>

<Button variant="secondary">
  <Icon name="download" className="mr-2" />
  Download
</Button>
```

### Icon Only

```typescript
<Button 
  variant="ghost" 
  size="sm"
  aria-label="Close dialog"
>
  <Icon name="x" />
</Button>

<Button 
  variant="primary"
  aria-label="Search"
>
  <Icon name="search" />
</Button>
```

## Advanced Usage

### Button Groups

```typescript
<div className="inline-flex rounded-lg border border-gray-200" role="group">
  <Button 
    variant="ghost" 
    className="rounded-r-none border-r"
  >
    Previous
  </Button>
  <Button 
    variant="ghost"
    className="rounded-none border-r"
  >
    Current
  </Button>
  <Button 
    variant="ghost"
    className="rounded-l-none"
  >
    Next
  </Button>
</div>
```

### Form Submission

```typescript
function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await submitForm();
    } catch (error) {
      console.error('Submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <div className="flex gap-3">
        <Button type="button" variant="secondary">
          Cancel
        </Button>
        <Button 
          type="submit" 
          variant="primary"
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          Submit
        </Button>
      </div>
    </form>
  );
}
```

## Accessibility

### ARIA Attributes

The Button component automatically handles basic accessibility:

```typescript
// Automatic attributes
<Button>Click me</Button>
// Renders: <button type="button" role="button">Click me</button>

// Custom ARIA labels
<Button aria-label="Close notification">
  <Icon name="x" />
</Button>

// Expanded state for dropdowns
<Button aria-expanded={isOpen} aria-controls="menu-items">
  Menu
</Button>
```

### Keyboard Navigation

- **Enter/Space**: Activates the button
- **Tab**: Moves focus to/from the button
- **Disabled buttons**: Cannot receive focus

### Screen Reader Support

```typescript
// Loading state announcement
<Button loading aria-live="polite">
  {loading ? 'Saving changes...' : 'Save'}
</Button>

// Descriptive labels for icon buttons
<Button aria-label="Delete item from shopping cart">
  <Icon name="trash" />
</Button>
```

## Styling Customization

### Custom Classes

```typescript
// Additional styling
<Button 
  variant="primary"
  className="shadow-lg transform hover:scale-105 transition-transform"
>
  Fancy Button
</Button>

// Override default styles
<Button 
  variant="ghost"
  className="text-purple-600 hover:bg-purple-50"
>
  Custom Colors
</Button>
```

### CSS Variables

```css
/* Custom button styles */
.custom-button {
  --button-primary-bg: theme('colors.purple.600');
  --button-primary-hover: theme('colors.purple.700');
  --button-border-radius: theme('borderRadius.2xl');
}
```

## Testing

### Unit Tests

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  test('renders with correct variant classes', () => {
    render(<Button variant="primary">Test</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-primary-500');
  });
  
  test('handles click events', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();
    
    render(<Button onClick={handleClick}>Click me</Button>);
    
    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  test('shows loading state', () => {
    render(<Button loading>Loading</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });
  
  test('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### Accessibility Tests

```typescript
import { axe } from 'jest-axe';

test('Button has no accessibility violations', async () => {
  const { container } = render(<Button>Accessible Button</Button>);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});

test('Icon button has proper aria-label', () => {
  render(
    <Button aria-label="Close dialog">
      <Icon name="x" />
    </Button>
  );
  
  expect(screen.getByLabelText('Close dialog')).toBeInTheDocument();
});
```

## Performance

### Memoization

The Button component is automatically memoized to prevent unnecessary re-renders:

```typescript
// Button is wrapped with React.memo
export const Button = memo(forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, children, className, ...props }, ref) => {
    // Component implementation
  }
));
```

### Event Handler Optimization

```typescript
// ✅ Memoize click handlers in parent components
const handleSave = useCallback(() => {
  saveData();
}, []);

return <Button onClick={handleSave}>Save</Button>;
```

## Common Patterns

### Confirmation Dialogs

```typescript
function DeleteButton({ onDelete }: { onDelete: () => void }) {
  const [showConfirm, setShowConfirm] = useState(false);
  
  return (
    <>
      <Button 
        variant="destructive"
        onClick={() => setShowConfirm(true)}
      >
        Delete
      </Button>
      
      {showConfirm && (
        <Modal isOpen onClose={() => setShowConfirm(false)}>
          <Modal.Title>Confirm Deletion</Modal.Title>
          <Modal.Description>
            This action cannot be undone.
          </Modal.Description>
          <Modal.Footer>
            <Button 
              variant="secondary"
              onClick={() => setShowConfirm(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                onDelete();
                setShowConfirm(false);
              }}
            >
              Delete
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </>
  );
}
```

### Async Actions

```typescript
function AsyncButton({ onAction }: { onAction: () => Promise<void> }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleClick = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await onAction();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div>
      <Button 
        variant="primary"
        loading={isLoading}
        onClick={handleClick}
      >
        {isLoading ? 'Processing...' : 'Start Action'}
      </Button>
      
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
```

## Related Components

- [Icon](./Icon.md) - For button icons
- [InputGroup](../molecules/InputGroup.md) - For input-button combinations
- [Modal](../organisms/Modal.md) - For confirmation dialogs

## Migration Guide

### From HTML Buttons

```typescript
// Before
<button className="bg-blue-500 text-white px-4 py-2 rounded">
  Click me
</button>

// After
<Button variant="primary">
  Click me
</Button>
```

### From Other Button Libraries

```typescript
// Material-UI
<MaterialButton variant="contained" color="primary">
  Click me
</MaterialButton>

// Chirality Button
<Button variant="primary">
  Click me
</Button>
```

---

**Version**: 1.0.0  
**Last Updated**: 2024-01-15  
**Status**: ✅ Stable