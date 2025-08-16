# ADR-008: Next.js App Router Architecture

**Status**: Accepted  
**Date**: 2024-01-15  
**Deciders**: Frontend Team  

## Context

The Chirality Chat application requires a modern, performant frontend architecture that supports real-time features, server-side rendering, and progressive enhancement. We need to choose between Next.js Pages Router (legacy) and App Router (modern) for our React application structure.

## Decision

We will use **Next.js 15 with App Router** as our primary frontend architecture.

## Rationale

### App Router Advantages

1. **React 18 Integration**
   - Full support for Concurrent Features
   - Native Suspense and Streaming SSR
   - Server Components for better performance

2. **Improved Developer Experience**
   - File-system based routing with improved conventions
   - Colocation of page components and layouts
   - Built-in loading states and error boundaries

3. **Performance Benefits**
   - Smaller JavaScript bundles with Server Components
   - Automatic code splitting at the route level
   - Improved Core Web Vitals scores

4. **Real-time Features Support**
   - Better streaming capabilities for chat interfaces
   - Improved SSE (Server-Sent Events) integration
   - Progressive enhancement patterns

### Technical Implementation

```typescript
// app/layout.tsx - Root layout
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

// app/chat/page.tsx - Chat page
export default function ChatPage() {
  return <ChatWindow />;
}

// app/chat/layout.tsx - Chat-specific layout
export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="chat-layout">
      <ChatSidebar />
      <main>{children}</main>
    </div>
  );
}
```

### Route Structure
```
app/
├── layout.tsx                 # Root layout
├── page.tsx                   # Home page
├── chat/
│   ├── layout.tsx            # Chat layout
│   ├── page.tsx              # Main chat interface
│   └── [conversationId]/
│       └── page.tsx          # Specific conversation
├── chat-admin/
│   └── page.tsx              # Admin dashboard
├── api/                      # API routes
│   ├── chat/
│   │   └── stream/
│   │       └── route.ts      # SSE streaming endpoint
│   └── documents/
│       └── route.ts          # Document API
└── (auth)/                   # Route groups
    ├── login/
    └── register/
```

## Alternatives Considered

### Pages Router
- **Pros**: More mature, stable, extensive documentation
- **Cons**: No Server Components, limited Streaming SSR, legacy patterns

### Single Page Application (SPA)
- **Pros**: Simple deployment, client-side routing
- **Cons**: SEO challenges, slower initial load, no SSR benefits

### Other Frameworks (Remix, SvelteKit)
- **Pros**: Modern architectures, good DX
- **Cons**: Learning curve, smaller ecosystem, migration complexity

## Consequences

### Positive
- **Improved Performance**: Smaller bundles, better Core Web Vitals
- **Better Real-time Features**: Enhanced streaming and SSE support
- **Future-Proof**: Aligned with React's roadmap and modern patterns
- **Enhanced SEO**: Server Components improve initial page loads

### Negative
- **Learning Curve**: Team needs to adapt to new App Router patterns
- **Beta Stability**: Some features still evolving (mitigated by Next.js 15 stability)
- **Migration Complexity**: If moving from Pages Router (not applicable to new project)

### Implementation Requirements

1. **File Structure Migration**
   ```bash
   # Move from pages/ to app/ structure
   pages/chat.tsx → app/chat/page.tsx
   pages/api/chat.ts → app/api/chat/route.ts
   ```

2. **Component Updates**
   ```typescript
   // Update imports for App Router
   import { redirect } from 'next/navigation'; // not from 'next/router'
   import { useRouter } from 'next/navigation'; // not from 'next/router'
   ```

3. **Metadata Handling**
   ```typescript
   // app/chat/page.tsx
   export const metadata = {
     title: 'Chat - Chirality',
     description: 'AI-powered document generation chat'
   };
   ```

## Monitoring

- **Core Web Vitals**: Track LCP, FID, CLS improvements
- **Bundle Size**: Monitor JavaScript bundle sizes with App Router
- **Development Velocity**: Measure developer productivity with new patterns
- **Error Rates**: Monitor stability during the transition period

## Related Decisions

- **ADR-009**: Zustand State Management (complements App Router)
- **ADR-010**: Tailwind CSS Design System (styling approach)
- **ADR-011**: SSE Streaming Pattern (real-time features)

## References

- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [React 18 Server Components](https://react.dev/blog/2020/12/21/data-fetching-with-react-server-components)
- [App Router Migration Guide](https://nextjs.org/docs/app/building-your-application/upgrading/app-router-migration)