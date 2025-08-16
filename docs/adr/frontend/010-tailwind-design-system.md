# ADR-010: Tailwind CSS Design System

**Status**: Accepted  
**Date**: 2024-01-15  
**Deciders**: Frontend Team, Design Team  

## Context

The Chirality Chat application requires a consistent, maintainable, and performant styling solution that supports:
- Real-time UI updates and animations
- Dark mode and accessibility features
- Responsive design across devices
- Component-based development workflow
- Fast iteration and prototyping

We need a styling approach that integrates well with React components and supports design system principles.

## Decision

We will use **Tailwind CSS 3.4** as our primary styling solution, implementing a custom design system with design tokens and component variants.

## Rationale

### Tailwind CSS Advantages

1. **Utility-First Approach**
   - Rapid prototyping and development
   - Consistent spacing, colors, and typography
   - No CSS bloat or unused styles in production

2. **Design System Integration**
   - Custom design tokens through configuration
   - Consistent component variants
   - Built-in responsive and dark mode support

3. **Performance Benefits**
   - Purged CSS results in minimal bundle sizes
   - No runtime CSS-in-JS overhead
   - Excellent caching characteristics

4. **Developer Experience**
   - IntelliSense support with IDE extensions
   - No context switching between CSS and JSX
   - Excellent documentation and community

### Design System Architecture

```javascript
// tailwind.config.js
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // Design Tokens
      colors: {
        // Brand Colors
        primary: {
          50: '#eff6ff',
          100: '#dbeafe', 
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6', // Primary blue
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554'
        },
        
        // Semantic Colors
        semantic: {
          success: {
            50: '#f0fdf4',
            500: '#10b981',
            900: '#064e3b'
          },
          warning: {
            50: '#fefce8', 
            500: '#f59e0b',
            900: '#78350f'
          },
          error: {
            50: '#fef2f2',
            500: '#ef4444', 
            900: '#7f1d1d'
          },
          info: {
            50: '#eff6ff',
            500: '#3b82f6',
            900: '#1e3a8a'
          }
        },
        
        // Neutral Colors
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#030712'
        },
        
        // Chat-specific colors
        chat: {
          user: '#3b82f6',
          assistant: '#10b981',
          system: '#6b7280',
          streaming: '#f59e0b'
        }
      },
      
      // Typography Scale
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif'
        ],
        mono: [
          'JetBrains Mono',
          'Monaco',
          'Cascadia Code',
          'Fira Code',
          'monospace'
        ]
      },
      
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }]
      },
      
      // Spacing Scale
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem'
      },
      
      // Animation & Transitions
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'fade-out': 'fadeOut 0.2s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'spin-slow': 'spin 3s linear infinite',
        'pulse-soft': 'pulseSoft 2s infinite',
        'typing': 'typing 1s infinite'
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' }
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' }
        },
        typing: {
          '0%, 50%': { opacity: '1' },
          '51%, 100%': { opacity: '0' }
        }
      },
      
      // Border Radius
      borderRadius: {
        'sm': '0.25rem',
        'md': '0.375rem', 
        'lg': '0.5rem',
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem'
      },
      
      // Shadows
      boxShadow: {
        'soft': '0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        'medium': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        'large': '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        'chat': '0 2px 8px 0 rgba(0, 0, 0, 0.08)',
        'modal': '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      }
    }
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    require('@tailwindcss/aspect-ratio'),
    // Custom plugin for component utilities
    function({ addUtilities, addComponents, theme }) {
      // Custom utilities
      addUtilities({
        '.text-balance': {
          'text-wrap': 'balance'
        },
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none'
          }
        }
      });
      
      // Component classes
      addComponents({
        '.btn-primary': {
          '@apply bg-primary-500 text-white px-4 py-2 rounded-lg font-medium transition-colors hover:bg-primary-600 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed': {}
        },
        '.btn-secondary': {
          '@apply bg-gray-200 text-gray-900 px-4 py-2 rounded-lg font-medium transition-colors hover:bg-gray-300 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed': {}
        },
        '.input-primary': {
          '@apply block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:cursor-not-allowed': {}
        }
      });
    }
  ]
};
```

### Component Styling Patterns

#### Base UI Components
```typescript
// components/ui/button.tsx
import { clsx } from 'clsx';
import { forwardRef } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    const buttonClasses = clsx(
      // Base styles
      'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
      
      // Variant styles
      {
        'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500': variant === 'primary',
        'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500': variant === 'secondary',
        'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500': variant === 'ghost',
        'bg-semantic-error-500 text-white hover:bg-semantic-error-600 focus:ring-semantic-error-500': variant === 'destructive'
      },
      
      // Size styles
      {
        'px-3 py-1.5 text-sm rounded-md': size === 'sm',
        'px-4 py-2 text-base rounded-lg': size === 'md',
        'px-6 py-3 text-lg rounded-xl': size === 'lg'
      },
      
      className
    );
    
    return (
      <button
        ref={ref}
        className={buttonClasses}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="w-4 h-4 mr-2 animate-spin" viewBox="0 0 24 24">
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4" 
              fill="none"
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
    );
  }
);
```

#### Chat-Specific Components
```typescript
// components/chat/message-bubble.tsx
interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
}

export function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const bubbleClasses = clsx(
    'max-w-[80%] rounded-2xl px-4 py-3 animate-fade-in',
    {
      // User messages (right-aligned)
      'bg-primary-500 text-white ml-auto': message.role === 'user',
      
      // Assistant messages (left-aligned)
      'bg-gray-100 text-gray-900 mr-auto dark:bg-gray-800 dark:text-gray-100': message.role === 'assistant',
      
      // System messages (centered)
      'bg-gray-50 text-gray-600 mx-auto text-center text-sm': message.role === 'system',
      
      // Streaming animation
      'animate-pulse-soft': isStreaming
    }
  );
  
  return (
    <div className="flex w-full mb-4">
      <div className={bubbleClasses}>
        <div className="prose prose-sm max-w-none dark:prose-invert">
          {message.content}
        </div>
        {isStreaming && (
          <span className="inline-block w-2 h-4 ml-1 bg-current animate-typing" />
        )}
      </div>
    </div>
  );
}
```

### Dark Mode Implementation
```typescript
// lib/theme-provider.tsx
import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system');
  
  useEffect(() => {
    const root = document.documentElement;
    
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

// Theme toggle component
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  
  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors hover:bg-gray-300 dark:hover:bg-gray-700"
    >
      {theme === 'dark' ? '🌞' : '🌙'}
    </button>
  );
}
```

### Responsive Design Patterns
```typescript
// Mobile-first responsive component
export function ResponsiveGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="
      grid 
      grid-cols-1 
      gap-4
      md:grid-cols-2 
      lg:grid-cols-3 
      xl:grid-cols-4
      p-4
      md:p-6
      lg:p-8
    ">
      {children}
    </div>
  );
}

// Responsive typography
export function ResponsiveHeading({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="
      text-2xl 
      font-bold 
      text-gray-900 
      dark:text-gray-100
      sm:text-3xl 
      md:text-4xl 
      lg:text-5xl
      leading-tight
      tracking-tight
    ">
      {children}
    </h1>
  );
}
```

## Component Organization

### Styling Architecture
```
src/
├── styles/
│   ├── globals.css           # Tailwind directives and global styles
│   ├── components.css        # Custom component styles
│   └── utilities.css         # Custom utility classes
├── components/
│   ├── ui/                   # Base design system components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── modal.tsx
│   │   └── index.ts
│   ├── chat/                 # Chat-specific styled components
│   └── layout/               # Layout components
└── lib/
    ├── utils.ts              # Utility functions (clsx, etc.)
    └── theme-provider.tsx    # Theme management
```

### Global Styles
```css
/* styles/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11';
  }
  
  body {
    @apply bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100;
  }
  
  /* Custom scrollbar */
  ::-webkit-scrollbar {
    width: 6px;
  }
  
  ::-webkit-scrollbar-track {
    @apply bg-gray-100 dark:bg-gray-800;
  }
  
  ::-webkit-scrollbar-thumb {
    @apply bg-gray-300 dark:bg-gray-600 rounded-full;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    @apply bg-gray-400 dark:bg-gray-500;
  }
}

@layer components {
  /* Focus styles for accessibility */
  .focus-ring {
    @apply focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900;
  }
  
  /* Content wrapper */
  .container-fluid {
    @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8;
  }
  
  /* Card component */
  .card {
    @apply bg-white dark:bg-gray-900 rounded-xl shadow-medium border border-gray-200 dark:border-gray-700;
  }
}

@layer utilities {
  /* Text truncation utilities */
  .text-truncate-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .text-truncate-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}
```

## Alternatives Considered

### CSS Modules
- **Pros**: Scoped styles, good TypeScript integration
- **Cons**: Requires separate CSS files, no utility-first benefits
- **Verdict**: More verbose for component-heavy application

### Styled Components / Emotion
- **Pros**: CSS-in-JS, dynamic styling, theming
- **Cons**: Runtime overhead, complexity, SSR challenges
- **Verdict**: Performance concerns for real-time chat features

### Vanilla CSS / Sass
- **Pros**: No build dependencies, familiar syntax
- **Cons**: No purging, larger bundle sizes, maintenance overhead
- **Verdict**: Doesn't scale well for design system approach

### CSS-in-JS Libraries (Stitches, Vanilla Extract)
- **Pros**: Type-safe styles, zero runtime
- **Cons**: Learning curve, smaller ecosystem
- **Verdict**: Tailwind's maturity and ecosystem wins

## Consequences

### Positive
- **Rapid Development**: Utility-first approach speeds up prototyping
- **Consistent Design**: Design tokens ensure visual consistency
- **Small Bundle Size**: Purged CSS results in minimal production bundles
- **Excellent DX**: IntelliSense, documentation, and tooling support

### Negative
- **Learning Curve**: Team needs to learn utility class names
- **HTML Verbosity**: Long class lists can make HTML harder to read
- **Design Constraints**: Utility approach may limit creative freedom

### Performance Impact
```bash
# Production bundle analysis
Bundle Size (gzipped):
- CSS: ~8KB (purged Tailwind)
- JS: ~200KB (React + Next.js)
- Total: ~208KB

# Comparison with alternatives:
- Styled Components: ~15KB CSS + runtime overhead
- CSS Modules: ~20KB CSS (no purging)
- Vanilla CSS: ~50KB+ CSS (all styles included)
```

## Testing Strategy

### Visual Regression Testing
```typescript
// __tests__/visual/button.test.tsx
import { render } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button Visual Tests', () => {
  test('renders primary button correctly', () => {
    const { container } = render(
      <Button variant="primary">Click me</Button>
    );
    expect(container.firstChild).toMatchSnapshot();
  });
  
  test('renders in dark mode', () => {
    const { container } = render(
      <div className="dark">
        <Button variant="primary">Click me</Button>
      </div>
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
```

### Accessibility Testing
```typescript
// __tests__/accessibility/button.test.tsx
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Button } from '@/components/ui/button';

expect.extend(toHaveNoViolations);

test('Button has no accessibility violations', async () => {
  const { container } = render(
    <Button variant="primary">Accessible button</Button>
  );
  
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## Development Workflow

### IDE Setup
```json
// .vscode/settings.json
{
  "tailwindCSS.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  },
  "tailwindCSS.experimental.classRegex": [
    "clsx\\(([^)]*)\\)",
    "className[\"'`]([^\"'`]*).*?[\"'`]"
  ]
}
```

### Prettier Integration
```javascript
// prettier.config.js
module.exports = {
  plugins: ['prettier-plugin-tailwindcss'],
  tailwindConfig: './tailwind.config.js'
};
```

## Monitoring & Maintenance

### Bundle Size Monitoring
```javascript
// next.config.js - Bundle analyzer
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true'
});

module.exports = withBundleAnalyzer({
  // Next.js config
});

// Usage: ANALYZE=true npm run build
```

### Design Token Updates
```javascript
// scripts/update-design-tokens.js
// Automated script to sync design tokens from Figma/design system
const updateTokens = async () => {
  const tokens = await fetchDesignTokens();
  updateTailwindConfig(tokens);
  regenerateTypeDefinitions(tokens);
};
```

## Related Decisions

- **ADR-008**: Next.js App Router (styling integration)
- **ADR-009**: Zustand State Management (theme state)
- **ADR-012**: Component Composition (styling patterns)

## References

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Tailwind UI Components](https://tailwindui.com/components)
- [Design System Best Practices](https://www.designsystems.com/)
- [Dark Mode Implementation Guide](https://tailwindcss.com/docs/dark-mode)