import { NextRequest } from 'next/server'
import { runDoc } from '@/chirality-core/orchestrate'
import { readState, writeState } from '@/chirality-core/state/store'
import { DocKind } from '@/chirality-core/contracts'
import { compactDS, compactSP, compactX, compactM } from '@/chirality-core/compactor'

export const runtime = 'nodejs'

// Detect Chirality Framework commands
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

// Handle Chirality workflow
async function handleChiralityWorkflow(command: DocKind | 'set-problem', message: string, conversationId?: string) {
  const encoder = new TextEncoder()
  
  try {
    if (command === 'set-problem') {
      // Extract problem from message
      const problemMatch = message.match(/problem[:\s]+(.+)/i)
      const problem = problemMatch ? problemMatch[1].trim() : message
      
      const state = writeState({
        problem: {
          title: 'User Defined Problem',
          statement: problem,
          initialVector: ['analysis', 'solution', 'implementation']
        }
      })
      
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'content', 
            content: `✅ Problem set: "${problem}"\n\nYou can now generate documents:\n- "generate DS" for Data Sheet\n- "generate SP" for Procedural Checklist\n- "generate X" for Solution Template\n- "generate M" for Guidance\n` 
          })}\n\n`))
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'done', 
            id: conversationId 
          })}\n\n`))
          
          controller.close()
        }
      })
      
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }
    
    // Handle document generation
    const state = readState()
    if (!state.problem.statement) {
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'content', 
            content: '❌ No problem defined. Please set a problem first using "set problem: [your problem description]"' 
          })}\n\n`))
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'done', 
            id: conversationId 
          })}\n\n`))
          
          controller.close()
        }
      })
      
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }
    
    // Generate the document
    const stream = new ReadableStream({
      async start(controller) {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'content', 
            content: `🔄 Generating ${command} document using OpenAI gpt-4.1-nano...\n\n` 
          })}\n\n`))
          
          const t0 = Date.now()
          const triple = await runDoc(command as DocKind, state.problem, state.finals)
          const latencyMs = Date.now() - t0
          
          // Save the result
          const finals = { ...state.finals, [command]: triple }
          writeState({ finals })
          
          // Format and stream the result
          const doc = triple.text as any
          let content = `✅ ${command} Document Generated (${(latencyMs/1000).toFixed(1)}s)\n\n`
          
          if (command === 'DS') {
            content += `**Data Field:** ${doc.data_field}\n`
            content += `**Type:** ${doc.type || 'Not specified'}\n`
            content += `**Units:** ${doc.units || 'Not specified'}\n`
            if (doc.source_refs?.length) {
              content += `**Sources:** ${doc.source_refs.join(', ')}\n`
            }
          } else if (command === 'SP') {
            content += `**Step:** ${doc.step}\n`
            content += `**Purpose:** ${doc.purpose || 'Not specified'}\n`
            if (doc.inputs?.length) {
              content += `**Inputs:** ${doc.inputs.join(', ')}\n`
            }
            if (doc.outputs?.length) {
              content += `**Outputs:** ${doc.outputs.join(', ')}\n`
            }
          } else if (command === 'X') {
            content += `**Heading:** ${doc.heading}\n`
            content += `**Narrative:** ${doc.narrative}\n`
          } else if (command === 'M') {
            content += `**Statement:** ${doc.statement}\n`
            content += `**Justification:** ${doc.justification || 'Not specified'}\n`
          }
          
          content += `\n**Terms Used:** ${triple.terms_used.join(', ')}\n`
          
          if (triple.warnings.length > 0) {
            content += `\n⚠️ **Warnings:** ${triple.warnings.join(', ')}\n`
          }
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'content', 
            content 
          })}\n\n`))
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'done', 
            id: conversationId 
          })}\n\n`))
          
        } catch (error) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'content', 
            content: `❌ Error generating ${command}: ${error instanceof Error ? error.message : 'Unknown error'}` 
          })}\n\n`))
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'done', 
            id: conversationId 
          })}\n\n`))
        } finally {
          controller.close()
        }
      }
    })
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      }
    })
    
  } catch (error) {
    console.error('Chirality workflow error:', error)
    
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          type: 'content', 
          content: `❌ Workflow error: ${error instanceof Error ? error.message : 'Unknown error'}` 
        })}\n\n`))
        
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          type: 'done', 
          id: conversationId 
        })}\n\n`))
        
        controller.close()
      }
    })
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
}

export async function POST(request: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return new Response('OpenAI API key not configured', { status: 500 })
  }

  try {
    const body = await request.json()
    const { message, conversationId } = body

    if (!message) {
      return new Response('Missing message', { status: 400 })
    }

    // Check for Chirality workflow commands
    const chiralityCommand = detectChiralityCommand(message)
    if (chiralityCommand) {
      return await handleChiralityWorkflow(chiralityCommand, message, conversationId)
    }

    // === TRUE RAG CHAT: Inject DS/SP/X/M documents into system context ===
    
    // 1) Get current finals from state
    const state = readState()
    const { DS, SP, X, M } = state.finals ?? {}
    
    // 2) Build instructions (system-equivalent) with document context
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

    instructions.push('Available commands: "set problem: [description]", "generate DS", "generate SP", "generate X", "generate M"')

    // 3) Build the Responses API payload
    const openaiBody = {
      model: process.env.OPENAI_MODEL || 'gpt-4.1-nano',
      instructions: instructions.join('\n'),
      input: [
        {
          role: 'user',
          content: [{ type: 'input_text', text: message }]
        }
      ],
      temperature: parseFloat(process.env.DEFAULT_TEMPERATURE || '0.6'),
      max_output_tokens: parseInt(process.env.MAX_OUTPUT_TOKENS || '800'),
      stream: true
    }

    // 4) Make the API call to OpenAI Responses API
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify(openaiBody)
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('OpenAI API error:', error)
      return new Response(`OpenAI API error: ${response.status}`, { status: response.status })
    }

    // Create a transform stream to convert Responses API SSE to our format
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()
    
    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        const text = decoder.decode(chunk, { stream: true })
        const lines = text.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            
            if (data === '[DONE]') {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', id: conversationId })}\n\n`))
              continue
            }
            
            try {
              const parsed = JSON.parse(data)
              
              // Handle Responses API format: direct delta field for streaming
              const content = parsed.delta
              
              if (content && parsed.type === 'response.output_text.delta') {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'content', content })}\n\n`))
              }
              
              // Handle completion event
              if (parsed.type === 'response.completed') {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', id: conversationId })}\n\n`))
              }
            } catch (e) {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }
    })

    // Return the transformed stream
    return new Response(response.body?.pipeThrough(transformStream), {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      }
    })
  } catch (error) {
    console.error('Stream error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  // For backward compatibility, redirect GET to POST
  const { searchParams } = new URL(request.url)
  const message = searchParams.get('message')
  const id = searchParams.get('id')
  
  if (!message) {
    return new Response('Missing message parameter', { status: 400 })
  }
  
  // Create a synthetic POST request
  const postRequest = new NextRequest(request.url, {
    method: 'POST',
    body: JSON.stringify({ message, conversationId: id }),
    headers: {
      'Content-Type': 'application/json'
    }
  })
  
  return POST(postRequest)
}