# App Router - Next.js 15 Application Structure

This directory contains the Next.js 15 App Router implementation for Chirality Chat, providing both client pages and server-side API routes with TypeScript strict typing and modern React patterns.

## Overview

The application follows Next.js 15 App Router conventions with:
- **File-based routing**: Automatic route generation from directory structure
- **Server-side API routes**: RESTful endpoints with OpenAI and Chirality Core integration
- **Streaming responses**: Server-Sent Events for real-time AI interactions
- **TypeScript everywhere**: Strict typing for both client and server code
- **Performance optimized**: React 18 features, streaming, and caching

## Directory Structure

```
app/
├── api/                    # Server-side API routes
│   ├── chat/              # Chat-related endpoints
│   ├── core/              # Chirality Core API
│   ├── neo4j/             # Database operations
│   └── healthz/           # Health checks
├── chat-admin/            # Admin dashboard page
├── chirality-core/        # Core document generation page
├── dashboard/             # Main dashboard
└── page.tsx              # Root chat interface
```

## API Routes (`api/`)

### Chat Endpoints (`api/chat/`)

#### `stream/route.ts` - Main Chat Streaming
- **Purpose**: Primary chat endpoint with RAG document injection
- **Method**: POST (and GET for compatibility)
- **Features**: 
  - OpenAI Responses API integration
  - Server-Sent Events streaming
  - Chirality command detection
  - Document context injection
  - Robust error handling

**Request Format:**
```typescript
{
  message: string;
  conversationId?: string;
}
```

**Response Format:** Server-Sent Events
```
data: {"type": "content", "content": "streaming text"}
data: {"type": "done", "id": "conversation-id"}
```

**Chirality Commands:**
- `"set problem: [description]"` - Define problem statement
- `"generate DS"` - Create Data Template
- `"generate SP"` - Create Procedural Checklist  
- `"generate X"` - Create Solution Template
- `"generate M"` - Create Guidance document

#### `debug/route.ts` - Debug Information
- **Purpose**: System transparency for admin dashboard
- **Method**: GET
- **Returns**: Full system instructions and document status
- **Usage**: Admin dashboard real-time monitoring

**Response Format:**
```typescript
{
  timestamp: string;
  state: {
    problem: ProblemDefinition;
    documentsFound: Record<DocType, boolean>;
  };
  fullInstructions: string;
  instructionsLength: number;
  compactedDocuments: Record<DocType, string | null>;
  rawDocuments: Record<DocType, any>;
}
```

#### `test/route.ts` - Configuration Testing
- **Purpose**: Validate chat configuration and document injection
- **Method**: POST
- **Features**: Simulates OpenAI API calls without actual execution
- **Usage**: Admin dashboard testing and metrics

### Core API (`api/core/`)

#### `run/route.ts` - Document Generation
- **Purpose**: Generate individual Chirality documents
- **Method**: POST
- **Integration**: Direct Chirality Core orchestration
- **Streaming**: Real-time generation progress

**Request Format:**
```typescript
{
  kind: 'DS' | 'SP' | 'X' | 'M';
  problem?: string;
}
```

#### `state/route.ts` - State Management
- **Purpose**: Manage document and problem state
- **Methods**: GET, POST, DELETE
- **Storage**: File-based persistent state
- **Operations**:
  - GET: Retrieve current state
  - POST: Update state (merge)
  - DELETE: Clear all documents and state

**State Format:**
```typescript
{
  problem: {
    title: string;
    statement: string;
    initialVector: string[];
  };
  finals: Record<DocType, Triple>;
}
```

### Database Operations (`api/neo4j/`)

#### `query/route.ts` - Neo4j Integration
- **Purpose**: Direct database queries for matrix operations
- **Method**: POST
- **Query Types**:
  - `get_matrices`: Retrieve semantic matrices
  - `get_components`: Fetch Chirality components
  - `knowledge_graph`: Query entity relationships
  - `custom`: Execute raw Cypher queries

**Request Format:**
```typescript
{
  query_type: string;
  params?: Record<string, any>;
  cypher?: string; // For custom queries
}
```

### Health Monitoring (`api/healthz/` & `api/readyz/`)

#### Health Check Endpoints
- **`healthz/route.ts`**: Liveness probe
- **`readyz/route.ts`**: Readiness probe
- **Purpose**: Service monitoring and load balancer integration
- **Method**: GET
- **Response**: JSON status with service checks

## Pages

### Root Chat Interface (`page.tsx`)
- **Route**: `/`
- **Purpose**: Main chat interface with streaming support
- **Features**:
  - Real-time message streaming
  - Document context awareness
  - Command recognition
  - Error boundaries
  - Mobile responsive

**Key Components:**
```typescript
export default function ChatPage() {
  return (
    <div className="h-screen flex flex-col">
      <ChatWindow />
      <ChatInput />
    </div>
  )
}
```

### Admin Dashboard (`chat-admin/page.tsx`)
- **Route**: `/chat-admin`
- **Purpose**: System transparency and debugging
- **Features**:
  - Real-time system monitoring
  - Document injection visibility
  - Full system prompt inspection
  - Auto-refresh capabilities
  - Test endpoint integration

**Dashboard Sections:**
- Document status overview
- System instructions viewer
- Compacted document display
- Raw document data
- Real-time metrics

### Chirality Core Interface (`chirality-core/page.tsx`)
- **Route**: `/chirality-core`
- **Purpose**: Document generation interface
- **Features**:
  - Problem definition
  - Sequential document generation
  - Progress monitoring
  - State management
  - Clear all functionality

**Workflow:**
1. Set problem statement
2. Generate DS document
3. Generate SP document  
4. Generate X document
5. Generate M document
6. View generated content

### Dashboard (`dashboard/page.tsx`)
- **Route**: `/dashboard`
- **Purpose**: Overview of system status and metrics
- **Features**:
  - Health monitoring
  - Usage statistics
  - System performance
  - Recent activity

## Streaming Implementation

### Server-Sent Events (SSE)
The chat system uses SSE for real-time streaming:

```typescript
// Transform OpenAI Responses API to our format
const transformStream = new TransformStream({
  async transform(chunk, controller) {
    const text = decoder.decode(chunk, { stream: true })
    const lines = text.split('\n')
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6)
        
        if (data === '[DONE]') {
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ type: 'done', id: conversationId })}\n\n`
          ))
          continue
        }
        
        try {
          const parsed = JSON.parse(data)
          const content = parsed.delta
          
          if (content && parsed.type === 'response.output_text.delta') {
            controller.enqueue(encoder.encode(
              `data: ${JSON.stringify({ type: 'content', content })}\n\n`
            ))
          }
        } catch (e) {
          // Ignore parse errors for incomplete chunks
        }
      }
    }
  }
})
```

### Error Handling
- **API errors**: Proper HTTP status codes and error messages
- **Streaming errors**: Graceful degradation with retry mechanisms
- **Validation errors**: Client-side and server-side validation
- **Network errors**: Timeout handling and connection recovery

## Performance Optimizations

### API Route Optimizations
- **Response caching**: React Query integration for client-side caching
- **Streaming**: Non-blocking responses for better UX
- **Connection pooling**: Efficient database connections
- **Middleware**: Request/response optimization

### Client-Side Optimizations
- **Static generation**: Pre-built pages where possible
- **Code splitting**: Dynamic imports for large components
- **Image optimization**: Next.js Image component
- **Font optimization**: System fonts and font display swap

## Environment Configuration

### Required Variables
```env
# OpenAI Configuration
OPENAI_API_KEY=sk-proj-your-api-key
OPENAI_MODEL=gpt-4.1-nano
DEFAULT_TEMPERATURE=0.6
MAX_OUTPUT_TOKENS=800

# Neo4j Configuration (optional)
NEO4J_URI=neo4j+s://your-instance.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=your-password
```

### Optional Variables
```env
# Performance tuning
OPENAI_API_TIMEOUT=60000
NEXT_TELEMETRY_DISABLED=1

# Debugging
DEBUG=true
NODE_ENV=development
```

## Security Considerations

### API Security
- **Environment variables**: Sensitive data in environment only
- **CORS**: Proper cross-origin resource sharing
- **Rate limiting**: API endpoint protection
- **Input validation**: Server-side request validation

### Client Security
- **XSS prevention**: Proper input sanitization
- **CSRF protection**: Next.js built-in protection
- **Content Security Policy**: Restrictive CSP headers
- **Secret management**: No client-side secrets

## Testing

### API Route Testing
```typescript
import { POST } from './route'
import { NextRequest } from 'next/server'

describe('/api/chat/stream', () => {
  it('handles chat messages', async () => {
    const request = new NextRequest('http://localhost:3000/api/chat/stream', {
      method: 'POST',
      body: JSON.stringify({ message: 'Hello' })
    })
    
    const response = await POST(request)
    expect(response.status).toBe(200)
  })
})
```

### Page Testing
```typescript
import { render, screen } from '@testing-library/react'
import ChatPage from './page'

describe('Chat Page', () => {
  it('renders chat interface', () => {
    render(<ChatPage />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })
})
```

## Deployment

### Vercel Deployment
```bash
vercel --prod
```

### Environment Setup
- Configure all required environment variables
- Set up domain and SSL certificates
- Configure monitoring and logging

### Performance Monitoring
- Enable Next.js analytics
- Configure error tracking
- Set up performance monitoring

---

🚀 This App Router structure provides a complete, performant, and secure foundation for the Chirality Chat application with modern Next.js patterns and comprehensive API integration.