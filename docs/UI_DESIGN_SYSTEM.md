# UI Design System

Comprehensive design system documentation for the Chirality Chat application, including design tokens, component patterns, and visual guidelines.

## Overview

The Chirality Chat design system provides a cohesive visual language and interaction patterns that ensure consistency, accessibility, and scalability across the application. Built with modern web standards and based on design principles that prioritize user experience and accessibility.

## Design Principles

### 1. Clarity
- **Clear Visual Hierarchy**: Typography and spacing create obvious information hierarchy
- **Purposeful Color**: Color conveys meaning and supports usability
- **Consistent Iconography**: Icons are recognizable and support comprehension

### 2. Efficiency  
- **Streamlined Interactions**: Minimize steps to complete tasks
- **Predictable Patterns**: Consistent behavior across similar components
- **Progressive Disclosure**: Show information when and where it's needed

### 3. Accessibility
- **Inclusive Design**: WCAG 2.1 AA compliance built into every component
- **Flexible Interface**: Adapts to user preferences and assistive technologies
- **Robust Interaction**: Multiple ways to accomplish tasks

### 4. Responsiveness
- **Mobile-First**: Designed for small screens, enhanced for larger displays
- **Adaptive Layout**: Content and interface adapt to available space
- **Touch-Friendly**: Appropriate target sizes and interaction patterns

## Design Tokens

### Color System

#### Primary Palette
```css
:root {
  /* Primary Blue - Main brand color */
  --color-primary-50: #eff6ff;
  --color-primary-100: #dbeafe;
  --color-primary-200: #bfdbfe;
  --color-primary-300: #93c5fd;
  --color-primary-400: #60a5fa;
  --color-primary-500: #3b82f6;  /* Base primary */
  --color-primary-600: #2563eb;
  --color-primary-700: #1d4ed8;
  --color-primary-800: #1e40af;
  --color-primary-900: #1e3a8a;
  --color-primary-950: #172554;
}
```

#### Semantic Colors
```css
:root {
  /* Success - Green */
  --color-success-50: #f0fdf4;
  --color-success-500: #10b981;
  --color-success-900: #064e3b;
  
  /* Warning - Amber */
  --color-warning-50: #fefce8;
  --color-warning-500: #f59e0b;
  --color-warning-900: #78350f;
  
  /* Error - Red */
  --color-error-50: #fef2f2;
  --color-error-500: #ef4444;
  --color-error-900: #7f1d1d;
  
  /* Info - Blue */
  --color-info-50: #eff6ff;
  --color-info-500: #3b82f6;
  --color-info-900: #1e3a8a;
}
```

#### Neutral Palette
```css
:root {
  /* Gray scale for text, borders, backgrounds */
  --color-gray-50: #f9fafb;
  --color-gray-100: #f3f4f6;
  --color-gray-200: #e5e7eb;
  --color-gray-300: #d1d5db;
  --color-gray-400: #9ca3af;
  --color-gray-500: #6b7280;
  --color-gray-600: #4b5563;
  --color-gray-700: #374151;
  --color-gray-800: #1f2937;
  --color-gray-900: #111827;
  --color-gray-950: #030712;
}
```

#### Chat-Specific Colors
```css
:root {
  /* Role-based message colors */
  --color-chat-user: var(--color-primary-500);
  --color-chat-assistant: var(--color-success-500);
  --color-chat-system: var(--color-gray-500);
  --color-chat-streaming: var(--color-warning-500);
  
  /* Message bubble backgrounds */
  --color-bubble-user: var(--color-primary-500);
  --color-bubble-assistant: var(--color-gray-100);
  --color-bubble-system: var(--color-gray-50);
}
```

### Typography Scale

#### Font Families
```css
:root {
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  --font-mono: 'JetBrains Mono', 'Monaco', 'Cascadia Code', 'Fira Code', monospace;
}
```

#### Font Sizes
```css
:root {
  /* Typography scale based on 1.125 ratio */
  --text-xs: 0.75rem;     /* 12px */
  --text-sm: 0.875rem;    /* 14px */
  --text-base: 1rem;      /* 16px */
  --text-lg: 1.125rem;    /* 18px */
  --text-xl: 1.25rem;     /* 20px */
  --text-2xl: 1.5rem;     /* 24px */
  --text-3xl: 1.875rem;   /* 30px */
  --text-4xl: 2.25rem;    /* 36px */
  --text-5xl: 3rem;       /* 48px */
  --text-6xl: 3.75rem;    /* 60px */
}
```

#### Line Heights
```css
:root {
  --leading-none: 1;
  --leading-tight: 1.25;
  --leading-snug: 1.375;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
  --leading-loose: 2;
}
```

#### Font Weights
```css
:root {
  --font-thin: 100;
  --font-extralight: 200;
  --font-light: 300;
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  --font-extrabold: 800;
  --font-black: 900;
}
```

### Spacing System

#### Spacing Scale
```css
:root {
  /* Spacing scale based on 0.25rem (4px) increments */
  --space-0: 0;
  --space-px: 1px;
  --space-0_5: 0.125rem;  /* 2px */
  --space-1: 0.25rem;     /* 4px */
  --space-1_5: 0.375rem;  /* 6px */
  --space-2: 0.5rem;      /* 8px */
  --space-2_5: 0.625rem;  /* 10px */
  --space-3: 0.75rem;     /* 12px */
  --space-3_5: 0.875rem;  /* 14px */
  --space-4: 1rem;        /* 16px */
  --space-5: 1.25rem;     /* 20px */
  --space-6: 1.5rem;      /* 24px */
  --space-7: 1.75rem;     /* 28px */
  --space-8: 2rem;        /* 32px */
  --space-9: 2.25rem;     /* 36px */
  --space-10: 2.5rem;     /* 40px */
  --space-11: 2.75rem;    /* 44px */
  --space-12: 3rem;       /* 48px */
  --space-14: 3.5rem;     /* 56px */
  --space-16: 4rem;       /* 64px */
  --space-20: 5rem;       /* 80px */
  --space-24: 6rem;       /* 96px */
  --space-28: 7rem;       /* 112px */
  --space-32: 8rem;       /* 128px */
}
```

#### Layout Spacing
```css
:root {
  /* Consistent spacing for layout components */
  --layout-gutter: var(--space-4);        /* 16px - Small screens */
  --layout-gutter-md: var(--space-6);     /* 24px - Medium screens */
  --layout-gutter-lg: var(--space-8);     /* 32px - Large screens */
  
  --section-spacing: var(--space-12);      /* 48px - Between sections */
  --component-spacing: var(--space-6);     /* 24px - Between components */
  --element-spacing: var(--space-4);       /* 16px - Between elements */
}
```

### Border Radius

```css
:root {
  --radius-none: 0;
  --radius-sm: 0.125rem;   /* 2px */
  --radius-base: 0.25rem;  /* 4px */
  --radius-md: 0.375rem;   /* 6px */
  --radius-lg: 0.5rem;     /* 8px */
  --radius-xl: 0.75rem;    /* 12px */
  --radius-2xl: 1rem;      /* 16px */
  --radius-3xl: 1.5rem;    /* 24px */
  --radius-full: 9999px;   /* Full circle */
}
```

### Shadows

```css
:root {
  /* Elevation system with consistent shadows */
  --shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --shadow-base: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-md: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);
  --shadow-2xl: 0 50px 100px -20px rgb(0 0 0 / 0.25);
  --shadow-inner: inset 0 2px 4px 0 rgb(0 0 0 / 0.05);
  
  /* Chat-specific shadows */
  --shadow-message: var(--shadow-sm);
  --shadow-input: var(--shadow-base);
  --shadow-modal: var(--shadow-xl);
}
```

### Z-Index Scale

```css
:root {
  --z-auto: auto;
  --z-0: 0;
  --z-10: 10;
  --z-20: 20;
  --z-30: 30;
  --z-40: 40;
  --z-50: 50;
  
  /* Semantic z-index values */
  --z-dropdown: var(--z-10);
  --z-tooltip: var(--z-20);
  --z-modal: var(--z-30);
  --z-notification: var(--z-40);
  --z-overlay: var(--z-50);
}
```

## Component Guidelines

### Button Components

#### Primary Button
```css
.btn-primary {
  background-color: var(--color-primary-500);
  color: white;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-lg);
  font-weight: var(--font-medium);
  transition: all 150ms ease;
}

.btn-primary:hover {
  background-color: var(--color-primary-600);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn-primary:focus {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
```

#### Size Variants
```css
.btn-sm {
  padding: var(--space-1_5) var(--space-3);
  font-size: var(--text-sm);
  line-height: var(--leading-tight);
}

.btn-md {
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-base);
  line-height: var(--leading-normal);
}

.btn-lg {
  padding: var(--space-3) var(--space-6);
  font-size: var(--text-lg);
  line-height: var(--leading-normal);
}
```

### Input Components

#### Text Input
```css
.input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-lg);
  font-size: var(--text-base);
  line-height: var(--leading-normal);
  transition: border-color 150ms ease, box-shadow 150ms ease;
}

.input:focus {
  outline: none;
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px rgb(59 130 246 / 0.1);
}

.input::placeholder {
  color: var(--color-gray-400);
}

.input:disabled {
  background-color: var(--color-gray-50);
  color: var(--color-gray-500);
  cursor: not-allowed;
}
```

#### Error State
```css
.input.error {
  border-color: var(--color-error-500);
}

.input.error:focus {
  border-color: var(--color-error-500);
  box-shadow: 0 0 0 3px rgb(239 68 68 / 0.1);
}

.input-error-message {
  color: var(--color-error-500);
  font-size: var(--text-sm);
  margin-top: var(--space-1);
}
```

### Card Components

#### Base Card
```css
.card {
  background-color: white;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-gray-200);
  overflow: hidden;
  transition: box-shadow 150ms ease;
}

.card:hover {
  box-shadow: var(--shadow-md);
}

.card-header {
  padding: var(--space-6);
  border-bottom: 1px solid var(--color-gray-200);
}

.card-body {
  padding: var(--space-6);
}

.card-footer {
  padding: var(--space-6);
  border-top: 1px solid var(--color-gray-200);
  background-color: var(--color-gray-50);
}
```

### Message Components

#### Message Bubble
```css
.message-bubble {
  max-width: 80%;
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-2xl);
  margin-bottom: var(--space-4);
  box-shadow: var(--shadow-message);
  position: relative;
}

.message-bubble.user {
  background-color: var(--color-bubble-user);
  color: white;
  margin-left: auto;
  border-bottom-right-radius: var(--radius-base);
}

.message-bubble.assistant {
  background-color: var(--color-bubble-assistant);
  color: var(--color-gray-900);
  margin-right: auto;
  border-bottom-left-radius: var(--radius-base);
}

.message-bubble.system {
  background-color: var(--color-bubble-system);
  color: var(--color-gray-600);
  margin: 0 auto;
  text-align: center;
  font-size: var(--text-sm);
}
```

#### Streaming Animation
```css
.message-bubble.streaming {
  position: relative;
}

.message-bubble.streaming::after {
  content: '';
  display: inline-block;
  width: 8px;
  height: 20px;
  background-color: currentColor;
  margin-left: var(--space-1);
  animation: typing 1s infinite;
}

@keyframes typing {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}
```

## Layout Patterns

### Container Sizes
```css
.container {
  width: 100%;
  margin: 0 auto;
  padding: 0 var(--layout-gutter);
}

@media (min-width: 640px) {
  .container {
    max-width: 640px;
    padding: 0 var(--layout-gutter-md);
  }
}

@media (min-width: 768px) {
  .container {
    max-width: 768px;
  }
}

@media (min-width: 1024px) {
  .container {
    max-width: 1024px;
    padding: 0 var(--layout-gutter-lg);
  }
}

@media (min-width: 1280px) {
  .container {
    max-width: 1280px;
  }
}

@media (min-width: 1536px) {
  .container {
    max-width: 1536px;
  }
}
```

### Grid System
```css
.grid {
  display: grid;
  gap: var(--layout-gutter);
}

.grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
.grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.grid-cols-12 { grid-template-columns: repeat(12, minmax(0, 1fr)); }

/* Responsive grid columns */
@media (min-width: 768px) {
  .md\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .md\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .md\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}

@media (min-width: 1024px) {
  .lg\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .lg\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .lg\:grid-cols-6 { grid-template-columns: repeat(6, minmax(0, 1fr)); }
}
```

### Flexbox Utilities
```css
.flex {
  display: flex;
}

.flex-col {
  flex-direction: column;
}

.flex-row {
  flex-direction: row;
}

.items-start { align-items: flex-start; }
.items-center { align-items: center; }
.items-end { align-items: flex-end; }
.items-stretch { align-items: stretch; }

.justify-start { justify-content: flex-start; }
.justify-center { justify-content: center; }
.justify-end { justify-content: flex-end; }
.justify-between { justify-content: space-between; }
.justify-around { justify-content: space-around; }

.flex-1 { flex: 1 1 0%; }
.flex-auto { flex: 1 1 auto; }
.flex-none { flex: none; }
```

## Dark Mode Support

### Dark Mode Colors
```css
@media (prefers-color-scheme: dark) {
  :root {
    --color-background: var(--color-gray-900);
    --color-surface: var(--color-gray-800);
    --color-text-primary: var(--color-gray-100);
    --color-text-secondary: var(--color-gray-300);
    --color-text-muted: var(--color-gray-400);
    --color-border: var(--color-gray-700);
    
    /* Update message bubbles for dark mode */
    --color-bubble-assistant: var(--color-gray-800);
    --color-bubble-system: var(--color-gray-750);
  }
}

/* Manual dark mode class */
.dark {
  --color-background: var(--color-gray-900);
  --color-surface: var(--color-gray-800);
  --color-text-primary: var(--color-gray-100);
  --color-text-secondary: var(--color-gray-300);
  --color-text-muted: var(--color-gray-400);
  --color-border: var(--color-gray-700);
}
```

### Dark Mode Components
```css
.card {
  background-color: var(--color-surface, white);
  border-color: var(--color-border, var(--color-gray-200));
  color: var(--color-text-primary, var(--color-gray-900));
}

.input {
  background-color: var(--color-surface, white);
  border-color: var(--color-border, var(--color-gray-300));
  color: var(--color-text-primary, var(--color-gray-900));
}
```

## Animation System

### Transition Durations
```css
:root {
  --duration-75: 75ms;
  --duration-100: 100ms;
  --duration-150: 150ms;
  --duration-200: 200ms;
  --duration-300: 300ms;
  --duration-500: 500ms;
  --duration-700: 700ms;
  --duration-1000: 1000ms;
}
```

### Easing Functions
```css
:root {
  --ease-linear: linear;
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

### Common Animations
```css
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-up {
  from { 
    opacity: 0;
    transform: translateY(10px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scale-in {
  from { 
    opacity: 0;
    transform: scale(0.95);
  }
  to { 
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

### Animation Utilities
```css
.animate-fade-in {
  animation: fade-in var(--duration-200) var(--ease-out);
}

.animate-slide-up {
  animation: slide-up var(--duration-300) var(--ease-out);
}

.animate-scale-in {
  animation: scale-in var(--duration-200) var(--ease-out);
}

.animate-spin {
  animation: spin 1s linear infinite;
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Respect reduced motion preferences */
@media (prefers-reduced-motion: reduce) {
  .animate-fade-in,
  .animate-slide-up,
  .animate-scale-in,
  .animate-pulse {
    animation: none;
  }
  
  .animate-spin {
    animation: spin 3s linear infinite;
  }
}
```

## Responsive Design

### Breakpoints
```css
:root {
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl: 1536px;
}
```

### Mobile-First Media Queries
```css
/* Mobile styles (default) */
.responsive-element {
  padding: var(--space-4);
  font-size: var(--text-sm);
}

/* Tablet and up */
@media (min-width: 768px) {
  .responsive-element {
    padding: var(--space-6);
    font-size: var(--text-base);
  }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .responsive-element {
    padding: var(--space-8);
    font-size: var(--text-lg);
  }
}
```

### Container Queries (Future)
```css
/* When supported, use container queries for component-level responsiveness */
@container (min-width: 400px) {
  .chat-message {
    padding: var(--space-6);
  }
}
```

## Icon System

### Icon Guidelines
- Use consistent stroke width (2px)
- Maintain 24px × 24px base size
- Provide multiple sizes: 16px, 20px, 24px, 32px
- Ensure icons work in light and dark modes
- Include proper accessibility attributes

### Icon Implementation
```css
.icon {
  display: inline-block;
  width: 1em;
  height: 1em;
  stroke-width: 2;
  stroke: currentColor;
  fill: none;
  vertical-align: middle;
}

.icon-sm { font-size: 1rem; }      /* 16px */
.icon-base { font-size: 1.25rem; } /* 20px */
.icon-md { font-size: 1.5rem; }    /* 24px */
.icon-lg { font-size: 2rem; }      /* 32px */
```

## Usage Guidelines

### Do's ✅
- Use consistent spacing from the design token system
- Follow the established color hierarchy
- Implement proper focus states for interactive elements
- Maintain consistent typography scales
- Test components in both light and dark modes
- Ensure sufficient color contrast (4.5:1 minimum)
- Use semantic HTML elements as the foundation
- Implement proper keyboard navigation
- Include loading and error states
- Follow the established animation patterns

### Don'ts ❌
- Don't create custom spacing values outside the system
- Don't use colors that don't meet accessibility standards
- Don't rely solely on color to convey information
- Don't create inconsistent component variants
- Don't forget to test with assistive technologies
- Don't use animations that could trigger vestibular disorders
- Don't ignore mobile users in responsive design
- Don't bypass the established design token system
- Don't create components without proper accessibility attributes
- Don't use custom fonts that impact performance

## Tools and Resources

### Design Tools
- **Figma**: Primary design tool with design token sync
- **Sketch**: Alternative design tool with symbol libraries
- **Adobe XD**: Prototyping and design handoff

### Development Tools
- **Tailwind CSS**: Utility-first CSS framework implementation
- **CSS Custom Properties**: Design token implementation
- **PostCSS**: CSS processing and optimization
- **Stylelint**: CSS linting and code quality

### Accessibility Tools
- **axe DevTools**: Automated accessibility testing
- **WAVE**: Web accessibility evaluation
- **Colour Contrast Analyser**: Color contrast verification
- **Screen readers**: NVDA, JAWS, VoiceOver for testing

### Documentation
- **Storybook**: Component library documentation
- **Design Tokens**: Token documentation and usage
- **Pattern Library**: Component pattern guidelines

---

**Version**: 1.0.0  
**Last Updated**: 2024-01-15  
**Maintained by**: Design System Team

*This design system is a living document that evolves with our product needs and user feedback. For questions or contributions, please refer to our [Contributing Guidelines](../CONTRIBUTING.md).*