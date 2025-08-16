# Accessibility Guidelines

Comprehensive accessibility standards and implementation guide for the Chirality Chat application.

## Overview

Chirality Chat is committed to providing an inclusive user experience that meets **WCAG 2.1 AA standards**. This document outlines our accessibility requirements, implementation patterns, and testing procedures.

## WCAG 2.1 AA Compliance

### Core Principles

#### 1. Perceivable
Information and UI components must be presentable to users in ways they can perceive.

**Requirements:**
- Text alternatives for non-text content
- Captions and alternatives for multimedia
- Content can be presented in different ways without losing meaning
- Make it easier for users to see and hear content

#### 2. Operable  
UI components and navigation must be operable by all users.

**Requirements:**
- All functionality available via keyboard
- Users have enough time to read content
- Content doesn't cause seizures or physical reactions
- Users can navigate and find content

#### 3. Understandable
Information and UI operation must be understandable.

**Requirements:**
- Text is readable and understandable
- Content appears and operates predictably
- Users are helped to avoid and correct mistakes

#### 4. Robust
Content must be robust enough for interpretation by assistive technologies.

**Requirements:**
- Compatible with current and future assistive technologies
- Valid, semantic HTML markup
- Progressive enhancement approach

## Implementation Standards

### Semantic HTML

#### Page Structure
```typescript
// ✅ Proper semantic structure
function ChatPage() {
  return (
    <div>
      <header role="banner">
        <nav role="navigation" aria-label="Main navigation">
          <ul>
            <li><a href="/chat">Chat</a></li>
            <li><a href="/documents">Documents</a></li>
          </ul>
        </nav>
      </header>
      
      <main role="main" aria-label="Chat interface">
        <h1>AI Assistant Chat</h1>
        <ChatWindow />
      </main>
      
      <footer role="contentinfo">
        <p>&copy; 2024 Chirality Chat</p>
      </footer>
    </div>
  );
}
```

#### Component Markup
```typescript
// ✅ Semantic form elements
function ChatInput() {
  return (
    <form onSubmit={handleSubmit} role="search">
      <label htmlFor="message-input" className="sr-only">
        Type your message
      </label>
      <input
        id="message-input"
        type="text"
        placeholder="Type a message..."
        aria-describedby="input-help"
        aria-required="true"
      />
      <div id="input-help" className="sr-only">
        Press Enter to send, Shift+Enter for new line
      </div>
      <button type="submit" aria-label="Send message">
        <Icon name="send" aria-hidden="true" />
      </button>
    </form>
  );
}
```

### ARIA (Accessible Rich Internet Applications)

#### Essential ARIA Attributes

```typescript
// ✅ Live regions for dynamic content
function StreamingMessage({ message }: { message: Message }) {
  return (
    <div 
      role="log"
      aria-live="polite"
      aria-label="AI response"
    >
      <div className="message-content">
        {message.content}
      </div>
      {message.streaming && (
        <div aria-live="assertive" className="sr-only">
          AI is typing
        </div>
      )}
    </div>
  );
}

// ✅ Dialog implementation
function Modal({ isOpen, onClose, children }: ModalProps) {
  const titleId = useId();
  const descId = useId();
  
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
      className={isOpen ? 'block' : 'hidden'}
    >
      <h2 id={titleId}>Dialog Title</h2>
      <div id={descId}>Dialog description</div>
      {children}
    </div>
  );
}

// ✅ Progressive disclosure
function ExpandableSection({ title, children }: ExpandableSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const contentId = useId();
  
  return (
    <div>
      <button
        aria-expanded={isExpanded}
        aria-controls={contentId}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {title}
        <Icon 
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          aria-hidden="true"
        />
      </button>
      
      <div
        id={contentId}
        className={isExpanded ? 'block' : 'hidden'}
        aria-hidden={!isExpanded}
      >
        {children}
      </div>
    </div>
  );
}
```

#### ARIA Landmarks

```typescript
// ✅ Landmark roles for navigation
function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-layout">
      <nav role="navigation" aria-label="Main navigation">
        <MainNavigation />
      </nav>
      
      <aside role="complementary" aria-label="Chat sidebar">
        <ConversationList />
      </aside>
      
      <main role="main" aria-label="Chat conversation">
        {children}
      </main>
      
      <section role="region" aria-label="Settings panel">
        <SettingsPanel />
      </section>
    </div>
  );
}
```

### Keyboard Navigation

#### Focus Management

```typescript
// ✅ Proper focus management
function Modal({ isOpen, onClose }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  
  useEffect(() => {
    if (isOpen) {
      // Store current focus
      previousFocusRef.current = document.activeElement as HTMLElement;
      
      // Focus modal
      modalRef.current?.focus();
      
      // Trap focus within modal
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
        
        if (e.key === 'Tab') {
          trapFocus(e, modalRef.current);
        }
      };
      
      document.addEventListener('keydown', handleKeyDown);
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        
        // Restore focus
        previousFocusRef.current?.focus();
      };
    }
  }, [isOpen, onClose]);
  
  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      className={`modal ${isOpen ? 'open' : 'closed'}`}
    >
      {/* Modal content */}
    </div>
  );
}

// Focus trap utility
function trapFocus(event: KeyboardEvent, container: HTMLElement | null) {
  if (!container) return;
  
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstElement = focusableElements[0] as HTMLElement;
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
  
  if (event.shiftKey) {
    if (document.activeElement === firstElement) {
      event.preventDefault();
      lastElement?.focus();
    }
  } else {
    if (document.activeElement === lastElement) {
      event.preventDefault();
      firstElement?.focus();
    }
  }
}
```

#### Keyboard Shortcuts

```typescript
// ✅ Keyboard shortcuts with proper handling
function ChatInterface() {
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip if user is typing in an input
      if (event.target instanceof HTMLInputElement) return;
      
      const isCtrlOrCmd = event.ctrlKey || event.metaKey;
      
      switch (event.key) {
        case '/':
          if (!isCtrlOrCmd) {
            event.preventDefault();
            inputRef.current?.focus();
          }
          break;
          
        case 'k':
          if (isCtrlOrCmd) {
            event.preventDefault();
            inputRef.current?.focus();
          }
          break;
          
        case 'Escape':
          if (inputRef.current) {
            inputRef.current.blur();
            inputRef.current.value = '';
          }
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  return (
    <div>
      <ChatMessages />
      <input 
        ref={inputRef}
        aria-label="Type your message"
        placeholder="Type a message... (Press / to focus)"
      />
    </div>
  );
}
```

### Visual Design Requirements

#### Color and Contrast

```css
/* ✅ WCAG AA compliant color ratios */
:root {
  /* Primary colors - 4.5:1 contrast ratio minimum */
  --text-primary: #1f2937;        /* 16.7:1 on white */
  --text-secondary: #6b7280;      /* 7.2:1 on white */
  --text-muted: #9ca3af;          /* 4.6:1 on white */
  
  /* Interactive elements */
  --link-color: #3b82f6;          /* 5.9:1 on white */
  --link-hover: #1d4ed8;          /* 8.3:1 on white */
  
  /* Status colors */
  --success: #059669;             /* 4.8:1 on white */
  --warning: #d97706;             /* 5.1:1 on white */
  --error: #dc2626;               /* 5.9:1 on white */
  
  /* Dark mode variants */
  --dark-text-primary: #f9fafb;   /* 17.8:1 on dark background */
  --dark-text-secondary: #d1d5db; /* 9.5:1 on dark background */
  --dark-background: #111827;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  :root {
    --text-primary: #000000;
    --text-secondary: #000000;
    --text-muted: #333333;
    --link-color: #0000ee;
    --success: #006400;
    --warning: #ff8c00;
    --error: #8b0000;
  }
}

/* Focus indicators */
.focus-visible {
  outline: 2px solid var(--link-color);
  outline-offset: 2px;
}

button:focus-visible,
input:focus-visible,
a:focus-visible {
  @apply focus-visible;
}
```

#### Typography and Spacing

```css
/* ✅ Accessible typography scale */
:root {
  /* Minimum 16px base font size */
  --text-base: 1rem;      /* 16px */
  --text-sm: 0.875rem;    /* 14px */
  --text-lg: 1.125rem;    /* 18px */
  --text-xl: 1.25rem;     /* 20px */
  
  /* Line heights for readability */
  --leading-tight: 1.25;   /* Headings */
  --leading-normal: 1.5;   /* Body text */
  --leading-relaxed: 1.75; /* Long-form content */
  
  /* Touch-friendly spacing */
  --touch-target: 44px;    /* Minimum touch target size */
  --spacing-xs: 0.25rem;   /* 4px */
  --spacing-sm: 0.5rem;    /* 8px */
  --spacing-md: 1rem;      /* 16px */
  --spacing-lg: 1.5rem;    /* 24px */
  --spacing-xl: 2rem;      /* 32px */
}

/* Text scaling support */
@media (prefers-reduced-motion: no-preference) {
  html {
    scroll-behavior: smooth;
  }
}

/* Respect user font size preferences */
body {
  font-size: clamp(1rem, 1rem + 0.5vw, 1.25rem);
  line-height: var(--leading-normal);
}

/* Touch target sizing */
button,
.button,
input[type="button"],
input[type="submit"] {
  min-height: var(--touch-target);
  min-width: var(--touch-target);
}
```

### Screen Reader Support

#### Screen Reader Only Content

```typescript
// ✅ Screen reader specific content
function ChatMessage({ message }: { message: Message }) {
  const timeAgo = formatTimeAgo(message.timestamp);
  
  return (
    <div className="message" role="article">
      <div className="sr-only">
        Message from {message.role} sent {timeAgo}
      </div>
      
      <div className="message-avatar" aria-hidden="true">
        <Avatar role={message.role} />
      </div>
      
      <div className="message-content">
        <div className="message-header">
          <span className="message-author">
            {message.role === 'user' ? 'You' : 'AI Assistant'}
          </span>
          <time dateTime={message.timestamp.toISOString()}>
            {timeAgo}
          </time>
        </div>
        
        <div className="message-text">
          {message.content}
        </div>
      </div>
      
      {message.streaming && (
        <div aria-live="polite" className="sr-only">
          AI is still typing this message
        </div>
      )}
    </div>
  );
}

// CSS for screen reader only content
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

#### Alternative Text

```typescript
// ✅ Proper alt text for images and icons
function DocumentThumbnail({ document }: { document: Document }) {
  return (
    <div className="document-thumbnail">
      <img 
        src={document.thumbnailUrl}
        alt={`Thumbnail of ${document.title} document`}
        loading="lazy"
      />
      
      <div className="document-info">
        <h3>{document.title}</h3>
        <p className="sr-only">
          Document type: {document.type}, 
          Last modified: {formatDate(document.updatedAt)}
        </p>
      </div>
    </div>
  );
}

// ✅ Decorative vs informative icons
function StatusIcon({ status }: { status: 'success' | 'error' | 'warning' }) {
  const iconMap = {
    success: { name: 'check-circle', alt: 'Success' },
    error: { name: 'x-circle', alt: 'Error' },
    warning: { name: 'exclamation-triangle', alt: 'Warning' }
  };
  
  const icon = iconMap[status];
  
  return (
    <Icon 
      name={icon.name}
      aria-label={icon.alt}
      role="img"
    />
  );
}

// ✅ Decorative icons
function Button({ children }: { children: React.ReactNode }) {
  return (
    <button>
      <Icon name="arrow-right" aria-hidden="true" />
      {children}
    </button>
  );
}
```

### Form Accessibility

#### Labels and Descriptions

```typescript
// ✅ Accessible form implementation
function SettingsForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  return (
    <form onSubmit={handleSubmit} noValidate>
      <fieldset>
        <legend>Chat Preferences</legend>
        
        <div className="form-group">
          <label htmlFor="theme-select">
            Theme
          </label>
          <select
            id="theme-select"
            aria-describedby="theme-help"
            aria-invalid={errors.theme ? 'true' : 'false'}
            aria-errormessage={errors.theme ? 'theme-error' : undefined}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>
          
          <div id="theme-help" className="form-help">
            Choose your preferred color scheme
          </div>
          
          {errors.theme && (
            <div id="theme-error" className="form-error" role="alert">
              {errors.theme}
            </div>
          )}
        </div>
        
        <div className="form-group">
          <label htmlFor="notifications">
            <input
              type="checkbox"
              id="notifications"
              aria-describedby="notifications-help"
            />
            Enable notifications
          </label>
          
          <div id="notifications-help" className="form-help">
            Receive notifications for new messages
          </div>
        </div>
      </fieldset>
      
      <div className="form-actions">
        <button type="button" className="btn-secondary">
          Cancel
        </button>
        <button type="submit" className="btn-primary">
          Save Settings
        </button>
      </div>
    </form>
  );
}
```

#### Error Handling

```typescript
// ✅ Accessible error messages
function LoginForm() {
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors([]);
    
    try {
      await login();
    } catch (error) {
      setErrors(['Invalid email or password']);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} aria-label="Sign in to your account">
      {errors.length > 0 && (
        <div 
          role="alert" 
          aria-live="assertive"
          className="error-summary"
        >
          <h2>There was a problem with your submission:</h2>
          <ul>
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          required
          aria-invalid={errors.length > 0 ? 'true' : 'false'}
          aria-describedby="email-help"
        />
        <div id="email-help">
          Enter the email address associated with your account
        </div>
      </div>
      
      <button 
        type="submit" 
        disabled={isSubmitting}
        aria-describedby={isSubmitting ? 'loading-message' : undefined}
      >
        {isSubmitting ? 'Signing in...' : 'Sign In'}
      </button>
      
      {isSubmitting && (
        <div id="loading-message" aria-live="polite">
          Please wait while we sign you in
        </div>
      )}
    </form>
  );
}
```

## Motion and Animation

### Reduced Motion Support

```css
/* ✅ Respect user motion preferences */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  
  /* Keep essential animations */
  .loading-spinner {
    animation: spin 1s linear infinite;
  }
  
  /* Disable parallax and auto-playing videos */
  .parallax {
    transform: none !important;
  }
  
  video {
    animation: none !important;
  }
}

/* Safe animations for reduced motion */
.fade-in-safe {
  opacity: 0;
  animation: fade-in-safe 0.3s ease-out forwards;
}

@keyframes fade-in-safe {
  to {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .fade-in-safe {
    opacity: 1;
    animation: none;
  }
}
```

### Animation Guidelines

```typescript
// ✅ Accessible animations
function useAccessibleAnimation() {
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  
  return {
    duration: prefersReducedMotion ? 0 : 300,
    easing: prefersReducedMotion ? 'linear' : 'ease-out',
    enabled: !prefersReducedMotion
  };
}

function AnimatedComponent() {
  const animation = useAccessibleAnimation();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: animation.enabled ? 20 : 0 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: animation.duration / 1000,
        ease: animation.easing 
      }}
    >
      Content
    </motion.div>
  );
}
```

## Testing Procedures

### Automated Testing

```typescript
// ✅ Accessibility testing with jest-axe
import { axe, toHaveNoViolations } from 'jest-axe';
import { render } from '@testing-library/react';

expect.extend(toHaveNoViolations);

describe('Accessibility Tests', () => {
  test('ChatWindow has no accessibility violations', async () => {
    const { container } = render(<ChatWindow />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  
  test('Form has proper labels and error handling', async () => {
    const { container } = render(<SettingsForm />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// ✅ Keyboard navigation testing
describe('Keyboard Navigation', () => {
  test('modal can be navigated with keyboard', async () => {
    const user = userEvent.setup();
    render(<Modal isOpen={true}>Modal content</Modal>);
    
    // Tab through focusable elements
    await user.tab();
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
    
    // Escape closes modal
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

// ✅ Screen reader testing simulation
describe('Screen Reader Support', () => {
  test('provides proper alternative text', () => {
    render(<DocumentThumbnail document={mockDocument} />);
    
    expect(screen.getByAltText(/thumbnail of/i)).toBeInTheDocument();
    expect(screen.getByText(/document type:/i)).toHaveClass('sr-only');
  });
  
  test('announces live updates', () => {
    render(<StreamingMessage message={mockMessage} />);
    
    expect(screen.getByLabelText('AI response')).toHaveAttribute('aria-live', 'polite');
  });
});
```

### Manual Testing Checklist

#### Keyboard Navigation
- [ ] All interactive elements are reachable via Tab
- [ ] Tab order is logical and intuitive
- [ ] Focus indicators are visible and clear
- [ ] Enter/Space activate buttons and controls
- [ ] Escape closes modals and dropdowns
- [ ] Arrow keys navigate within components (lists, menus)

#### Screen Reader Testing
- [ ] Content is announced in logical order
- [ ] Headings create proper document outline
- [ ] Images have appropriate alt text
- [ ] Form labels are associated correctly
- [ ] Live regions announce dynamic content
- [ ] Error messages are announced immediately

#### Visual Testing
- [ ] Text contrast meets WCAG AA standards (4.5:1)
- [ ] UI is usable at 200% zoom
- [ ] Content reflows properly on small screens
- [ ] High contrast mode is supported
- [ ] No information conveyed by color alone

#### Motor Accessibility
- [ ] Touch targets are at least 44px × 44px
- [ ] Drag and drop has keyboard alternatives
- [ ] Hover states have focus equivalents
- [ ] No content requires precise mouse control

### Browser Testing

Test with these assistive technologies:

#### Screen Readers
- **NVDA** (Windows) - Free and widely used
- **JAWS** (Windows) - Most popular commercial option
- **VoiceOver** (macOS/iOS) - Built into Apple devices
- **TalkBack** (Android) - Built into Android devices

#### Browser Extensions
- **axe DevTools** - Automated accessibility testing
- **WAVE** - Web accessibility evaluation
- **Colour Contrast Analyser** - Color contrast checking
- **Accessibility Insights** - Microsoft's accessibility tool

#### Testing Commands

```bash
# Run accessibility tests
npm run test:a11y

# Test with axe-cli
npx axe-cli http://localhost:3000

# Lighthouse accessibility audit
npx lighthouse http://localhost:3000 --only-categories=accessibility

# Pa11y testing
npx pa11y http://localhost:3000
```

## Implementation Guidelines

### Development Workflow

1. **Design Phase**
   - Include accessibility requirements in designs
   - Specify color contrast ratios
   - Plan keyboard navigation flow
   - Consider screen reader experience

2. **Development Phase**
   - Use semantic HTML as foundation
   - Add ARIA attributes where needed
   - Implement keyboard navigation
   - Test with assistive technologies

3. **Testing Phase**
   - Run automated accessibility tests
   - Manual testing with keyboard only
   - Screen reader testing
   - Validate with real users

4. **Deployment Phase**
   - Include accessibility tests in CI/CD
   - Monitor accessibility metrics
   - Collect user feedback
   - Iterate based on findings

### Code Review Checklist

- [ ] **Semantic HTML**: Uses appropriate HTML elements
- [ ] **ARIA**: Proper ARIA attributes where needed
- [ ] **Keyboard**: Keyboard navigation implemented
- [ ] **Focus**: Focus management handled correctly
- [ ] **Labels**: Form inputs have associated labels
- [ ] **Contrast**: Color contrast meets standards
- [ ] **Alternative Text**: Images have appropriate alt text
- [ ] **Testing**: Accessibility tests pass

## Resources

### Documentation
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Resources](https://webaim.org/resources/)
- [A11y Project](https://www.a11yproject.com/)

### Tools
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE](https://wave.webaim.org/)
- [Colour Contrast Analyser](https://www.tpgi.com/color-contrast-checker/)
- [Pa11y](https://pa11y.org/)

### Testing
- [NVDA Screen Reader](https://www.nvaccess.org/download/)
- [Screen Reader Testing Guide](https://webaim.org/articles/screenreader_testing/)
- [Keyboard Testing Guide](https://webaim.org/articles/keyboard/)

---

**Commitment**: We are committed to maintaining WCAG 2.1 AA compliance across all features and continuously improving accessibility based on user feedback and evolving standards.

**Contact**: For accessibility questions or to report accessibility issues, please contact our accessibility team or file an issue in our repository.