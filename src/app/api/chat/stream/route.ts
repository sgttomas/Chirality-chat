import { NextRequest } from 'next/server'

export const runtime = 'nodejs'

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

    // Create the request body for OpenAI Responses API
    const openaiBody = {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant specializing in the Chirality Framework, semantic matrices, and knowledge representation. Be concise and informative.'
        },
        {
          role: 'user', 
          content: message
        }
      ],
      stream: true,
      temperature: 0.7,
      max_tokens: 2000,
      response_format: {
        type: 'text'
      }
    }

    // Make the API call to OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'OpenAI-Beta': 'responses-2024-12-17'
      },
      body: JSON.stringify(openaiBody)
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('OpenAI API error:', error)
      return new Response(`OpenAI API error: ${response.status}`, { status: response.status })
    }

    // Create a transform stream to convert OpenAI SSE to our format
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
              const content = parsed.choices?.[0]?.delta?.content
              
              if (content) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'content', content })}\n\n`))
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