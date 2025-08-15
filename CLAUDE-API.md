# CLAUDE-API.md

Specialized guidance for Claude Code when working with API routes and server-side functionality in the Chirality Chat application.

## API Architecture Overview

This application uses Next.js 15 App Router with TypeScript-strict API routes, featuring:
- **OpenAI Responses API integration** (NOT Chat Completions)
- **Server-Sent Events streaming** for real-time responses
- **File-based state management** for document persistence
- **RESTful endpoints** with proper HTTP semantics

## Critical API Patterns

### OpenAI Responses API Format (REQUIRED)

```typescript
// ✅ CORRECT - Use this pattern ALWAYS
const openaiRequestBody = {
  model: 'gpt-4.1-nano',  // ONLY this model
  instructions: systemPromptString,
  input: [
    {
      role: 'user',
      content: [{ type: 'input_text', text: userMessage }]
    }
  ],
  temperature: 0.6,
  max_output_tokens: 800,
  stream: true
}

const response = await fetch('https://api.openai.com/v1/responses', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
  },
  body: JSON.stringify(openaiRequestBody)
})
```

### SSE Streaming Response Transformation

```typescript
// ✅ CORRECT - Transform OpenAI SSE to our format
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
          
          // ✅ CORRECT - Use delta field for Responses API
          const content = parsed.delta
          
          if (content && parsed.type === 'response.output_text.delta') {
            controller.enqueue(encoder.encode(
              `data: ${JSON.stringify({ type: 'content', content })}\n\n`
            ))
          }
          
          // ✅ CORRECT - Completion detection
          if (parsed.type === 'response.completed') {
            controller.enqueue(encoder.encode(
              `data: ${JSON.stringify({ type: 'done', id: conversationId })}\n\n`
            ))
          }
        } catch (e) {
          // Ignore parse errors for incomplete chunks
        }
      }
    }
  }
})

return new Response(response.body?.pipeThrough(transformStream), {
  headers: {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  }
})
```

## API Route Implementations

### Main Chat Endpoint (`/src/app/api/chat/stream/route.ts`)

**Purpose**: Primary chat endpoint with RAG document injection and Chirality command processing.

**Key Features**:
- Document context injection from Chirality Core state
- Natural language command detection
- Streaming response handling
- Error recovery and retry logic

**Command Detection Pattern**:
```typescript
function detectChiralityCommand(message: string): DocKind | 'set-problem' | null {
  const lower = message.toLowerCase().trim()
  
  if (lower.includes('set problem') || lower.includes('define problem')) {
    return 'set-problem'
  }
  if (lower.includes('generate ds') || lower.includes('data sheet')) {
    return 'DS'
  }
  if (lower.includes('generate sp') || lower.includes('procedural checklist')) {
    return 'SP'
  }
  if (lower.includes('generate x') || lower.includes('solution template')) {
    return 'X'
  }
  if (lower.includes('generate m') || lower.includes('guidance')) {
    return 'M'
  }
  
  return null
}
```

**Document Injection Logic**:
```typescript
// Read current state and inject documents
const state = readState()
const { DS, SP, X, M } = state.finals ?? {}

const instructions = [
  'You are the Chirality Chat engine.',
  'Use pinned DS/SP/X/M as ground truth context for this session.',
  'Prefer cited evidence; include citation IDs when relevant.',
  'Be conversational but precise. Draw insights from the documents when answering.',
  ''
]

if (DS || SP || X || M) {
  instructions.push('--- Pinned Finals (compact) ---')
  if (DS) instructions.push(`DS: ${compactDS(DS.text)}`)
  if (SP) instructions.push(`SP: ${compactSP(SP.text)}`)
  if (X) instructions.push(`X: ${compactX(X.text)}`)
  if (M) instructions.push(`M: ${compactM(M.text)}`)
  instructions.push('--- End Pinned ---')
  instructions.push('')
} else {
  instructions.push('No documents pinned yet. Guide users to generate documents first using commands like "set problem: [description]" then "generate DS".')
  instructions.push('')
}
```

### Chirality Core State API (`/src/app/api/core/state/route.ts`)

**Purpose**: Manage document and problem state with file-based persistence.

**Operations**:

```typescript
// GET - Retrieve current state
export async function GET(request: NextRequest) {
  try {
    const state = readState()
    return NextResponse.json(state)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to read state' },
      { status: 500 }
    )
  }
}

// POST - Update state (merge)
export async function POST(request: NextRequest) {
  try {
    const updates = await request.json()
    const updatedState = writeState(updates)
    return NextResponse.json(updatedState)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update state' },
      { status: 500 }
    )
  }
}

// DELETE - Clear all documents and state
export async function DELETE(request: NextRequest) {
  try {
    const cleared = writeState({
      problem: { title: '', statement: '', initialVector: [] },
      finals: {}
    })
    return NextResponse.json(cleared)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to clear state' },
      { status: 500 }
    )
  }
}
```

### Document Generation API (`/src/app/api/core/run/route.ts`)

**Purpose**: Generate individual Chirality documents with streaming progress.

**Implementation**:
```typescript
export async function POST(request: NextRequest) {
  const encoder = new TextEncoder()
  
  try {
    const { kind, problem: problemText } = await request.json()
    
    if (!kind || !['DS', 'SP', 'X', 'M'].includes(kind)) {
      return new Response('Invalid document kind', { status: 400 })
    }

    const state = readState()
    
    // Use provided problem or existing state
    const problem = problemText 
      ? { title: 'User Provided', statement: problemText, initialVector: [] }
      : state.problem

    if (!problem.statement) {
      return new Response('No problem defined', { status: 400 })
    }

    // Stream generation progress
    const stream = new ReadableStream({
      async start(controller) {
        try {
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ type: 'content', content: `🔄 Generating ${kind} document...\n` })}\n\n`
          ))

          const triple = await runDoc(kind as DocKind, problem, state.finals)
          
          // Save result
          const finals = { ...state.finals, [kind]: triple }
          writeState({ finals })

          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ type: 'content', content: `✅ ${kind} document generated successfully\n` })}\n\n`
          ))

          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ type: 'done' })}\n\n`
          ))
        } catch (error) {
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ type: 'content', content: `❌ Error: ${error.message}\n` })}\n\n`
          ))
        } finally {
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    })
  } catch (error) {
    return new Response('Internal server error', { status: 500 })
  }
}
```

### Debug and Admin APIs

#### Debug Endpoint (`/src/app/api/chat/debug/route.ts`)
```typescript
export async function GET() {
  try {
    const state = readState()
    const { DS, SP, X, M } = state.finals ?? {}
    
    // Build exact same instructions as chat stream
    const instructions = [/* same logic as chat/stream */]

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      state: {
        problem: state.problem,
        documentsFound: { DS: !!DS, SP: !!SP, X: !!X, M: !!M }
      },
      fullInstructions: instructions.join('\n'),
      instructionsLength: instructions.join('\n').length,
      compactedDocuments: {
        DS: DS ? compactDS(DS.text) : null,
        SP: SP ? compactSP(SP.text) : null,
        X: X ? compactX(X.text) : null,
        M: M ? compactM(M.text) : null
      },
      rawDocuments: {
        DS: DS?.text || null,
        SP: SP?.text || null,
        X: X?.text || null,
        M: M?.text || null
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to read chat state' },
      { status: 500 }
    )
  }
}
```

#### Test Endpoint (`/src/app/api/chat/test/route.ts`)
```typescript
export async function POST(request: NextRequest) {
  try {
    const { testMessage = "Based on the pinned documents, what are the key considerations?" } = await request.json().catch(() => ({}))
    
    const state = readState()
    const { DS, SP, X, M } = state.finals ?? {}
    
    // Simulate OpenAI API payload without actual call
    const openaiBody = {
      model: process.env.OPENAI_MODEL || 'gpt-4.1-nano',
      instructions: instructions.join('\n'),
      input: [
        {
          role: 'user',
          content: [{ type: 'input_text', text: testMessage }]
        }
      ],
      temperature: parseFloat(process.env.DEFAULT_TEMPERATURE || '0.6'),
      max_output_tokens: parseInt(process.env.MAX_OUTPUT_TOKENS || '800'),
      stream: true
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      testMessage,
      documentsDetected: {
        DS: !!DS, SP: !!SP, X: !!X, M: !!M,
        totalFound: [!!DS, !!SP, !!X, !!M].filter(Boolean).length
      },
      instructionsAnalysis: {
        totalLength: instructions.join('\n').length,
        documentMentions: {
          DS: (instructions.join('\n').match(/DS:/g) || []).length,
          SP: (instructions.join('\n').match(/SP:/g) || []).length,
          X: (instructions.join('\n').match(/X:/g) || []).length,
          M: (instructions.join('\n').match(/M:/g) || []).length
        }
      },
      validation: {
        hasDocuments: !!(DS || SP || X || M),
        instructionsContainDocuments: instructions.join('\n').includes('--- Pinned Finals (compact) ---'),
        allDocumentsInjected: [!!DS, !!SP, !!X, !!M].filter(Boolean).length === 4
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to test chat configuration' },
      { status: 500 }
    )
  }
}
```

## Error Handling Patterns

### API Error Responses
```typescript
// Standard error response format
return NextResponse.json(
  { 
    error: 'Human-readable error message',
    code: 'ERROR_CODE',
    details: error instanceof Error ? error.message : 'Unknown error',
    timestamp: new Date().toISOString()
  },
  { status: 500 }
)
```

### Streaming Error Handling
```typescript
// Error in streaming response
controller.enqueue(encoder.encode(
  `data: ${JSON.stringify({ 
    type: 'error', 
    content: `❌ ${error.message}`,
    recoverable: true 
  })}\n\n`
))

controller.enqueue(encoder.encode(
  `data: ${JSON.stringify({ type: 'done' })}\n\n`
))
```

### OpenAI API Error Handling
```typescript
const response = await fetch('https://api.openai.com/v1/responses', {
  method: 'POST',
  headers: { /* headers */ },
  body: JSON.stringify(openaiBody)
})

if (!response.ok) {
  const error = await response.text()
  console.error('OpenAI API error:', error)
  
  // Return appropriate error based on status
  switch (response.status) {
    case 401:
      return new Response('Invalid API key', { status: 401 })
    case 429:
      return new Response('Rate limit exceeded', { status: 429 })
    case 400:
      return new Response('Invalid request format', { status: 400 })
    default:
      return new Response(`OpenAI API error: ${response.status}`, { status: response.status })
  }
}
```

## Environment Variables

### Required Variables
```typescript
// Validate required environment variables
if (!process.env.OPENAI_API_KEY) {
  return new Response('OpenAI API key not configured', { status: 500 })
}

// Access with defaults
const model = process.env.OPENAI_MODEL || 'gpt-4.1-nano'
const temperature = parseFloat(process.env.DEFAULT_TEMPERATURE || '0.6')
const maxTokens = parseInt(process.env.MAX_OUTPUT_TOKENS || '800')
```

### Optional Variables
```typescript
// Optional with graceful degradation
const debugMode = process.env.DEBUG === 'true'
const timeout = parseInt(process.env.OPENAI_API_TIMEOUT || '60000')
```

## Security Considerations

### API Key Protection
```typescript
// ✅ CORRECT - Server-side only
const apiKey = process.env.OPENAI_API_KEY

// ❌ WRONG - Never expose in client code
// const apiKey = 'sk-proj-...' // Never do this
```

### Input Validation
```typescript
// Validate request body
const requestBodySchema = {
  message: 'string',
  conversationId: 'string?'
}

try {
  const body = await request.json()
  
  if (!body.message || typeof body.message !== 'string') {
    return new Response('Invalid message format', { status: 400 })
  }
  
  if (body.message.length > 10000) {
    return new Response('Message too long', { status: 400 })
  }
} catch (error) {
  return new Response('Invalid JSON', { status: 400 })
}
```

### CORS Headers
```typescript
// Proper CORS configuration
const headers = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE',
  'Access-Control-Allow-Headers': 'Content-Type'
}
```

## Performance Optimizations

### Streaming Efficiency
```typescript
// Use TransformStream for efficient streaming
const transformStream = new TransformStream({
  async transform(chunk, controller) {
    // Process chunks efficiently
    const text = decoder.decode(chunk, { stream: true })
    // Batch processing for better performance
  }
})
```

### File I/O Optimization
```typescript
// Atomic file operations
import { writeFileSync, readFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

const stateFile = join(tmpdir(), '.chirality-state.json')

// Atomic write with temp file
const tempFile = `${stateFile}.tmp`
writeFileSync(tempFile, JSON.stringify(state, null, 2))
renameSync(tempFile, stateFile)
```

## Testing API Routes

### Manual Testing
```bash
# Test chat stream
curl -X POST http://localhost:3000/api/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, test the streaming"}'

# Test state management
curl -X GET http://localhost:3000/api/core/state
curl -X DELETE http://localhost:3000/api/core/state

# Test document generation
curl -X POST http://localhost:3000/api/core/run \
  -H "Content-Type: application/json" \
  -d '{"kind": "DS", "problem": "Test problem statement"}'

# Test admin endpoints
curl http://localhost:3000/api/chat/debug
curl -X POST http://localhost:3000/api/chat/test \
  -H "Content-Type: application/json" \
  -d '{"testMessage": "What documents are available?"}'
```

### Automated Testing
```typescript
import { POST } from './route'
import { NextRequest } from 'next/server'

describe('API Route Tests', () => {
  it('handles chat streaming', async () => {
    const request = new NextRequest('http://localhost:3000/api/chat/stream', {
      method: 'POST',
      body: JSON.stringify({ message: 'test message' })
    })
    
    const response = await POST(request)
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('text/event-stream')
  })
})
```

## Common API Issues & Solutions

### Issue: "OpenAI API 400 - Invalid type for 'text'"
- **Cause**: Using Chat Completions format instead of Responses API
- **Solution**: Use `type: 'input_text'` in content array

### Issue: "SSE connection lost"  
- **Cause**: Improper streaming response handling
- **Solution**: Use proper TransformStream and error boundaries

### Issue: "Document not found in state"
- **Cause**: State file corruption or race condition
- **Solution**: Implement atomic file operations and validation

### Issue: "Model access denied"
- **Cause**: API key doesn't have access to gpt-4.1-nano
- **Solution**: Verify model permissions in OpenAI dashboard

---

🚀 **For Claude Code**: When working with API routes, always use the OpenAI Responses API format, implement proper SSE streaming, and follow the file-based state management patterns. The admin endpoints provide excellent debugging visibility into the system state.