import { useState, useCallback, useRef, useEffect } from 'react'

export interface StreamMessage {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  status: 'pending' | 'streaming' | 'complete' | 'error'
}

export interface UseStreamOptions {
  onMessage?: (message: StreamMessage) => void
  onError?: (error: Error) => void
  endpoint?: string
}

export function useStream({ 
  onMessage, 
  onError,
  endpoint = '/api/chat/stream' 
}: UseStreamOptions = {}) {
  const [isStreaming, setIsStreaming] = useState(false)
  const [currentMessage, setCurrentMessage] = useState<StreamMessage | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    
    setIsStreaming(false)
    setCurrentMessage(null)
  }, [])

  const sendMessage = useCallback(async (content: string) => {
    if (isStreaming) {
      abort()
    }

    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const userMessage: StreamMessage = {
      id: `${messageId}-user`,
      content,
      role: 'user',
      timestamp: new Date(),
      status: 'complete'
    }

    // Emit user message immediately
    onMessage?.(userMessage)

    const assistantMessage: StreamMessage = {
      id: `${messageId}-assistant`,
      content: '',
      role: 'assistant',
      timestamp: new Date(),
      status: 'pending'
    }

    setCurrentMessage(assistantMessage)
    setIsStreaming(true)
    
    // Track accumulated content separately
    let accumulatedContent = ''

    try {
      // Use SSE for streaming
      const params = new URLSearchParams({ message: content, id: messageId })
      const eventSource = new EventSource(`${endpoint}?${params}`)
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        setCurrentMessage(prev => prev ? { ...prev, status: 'streaming' } : null)
      }

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          if (data.type === 'content') {
            accumulatedContent += data.content
            setCurrentMessage(prev => prev ? {
              ...prev,
              content: accumulatedContent,
              status: 'streaming'
            } : null)
          } else if (data.type === 'done') {
            const finalMessage: StreamMessage = {
              ...assistantMessage,
              content: accumulatedContent,
              status: 'complete'
            }
            onMessage?.(finalMessage)
            setCurrentMessage(null)
            setIsStreaming(false)
            eventSource.close()
            eventSourceRef.current = null
          } else if (data.type === 'error') {
            throw new Error(data.error || 'Stream error')
          }
        } catch (parseError) {
          console.error('Failed to parse SSE message:', parseError)
          onError?.(parseError as Error)
        }
      }

      eventSource.onerror = (error) => {
        console.error('SSE error:', error)
        const errorMessage = new Error('Connection lost')
        onError?.(errorMessage)
        setCurrentMessage(prev => prev ? { ...prev, status: 'error' } : null)
        setIsStreaming(false)
        eventSource.close()
        eventSourceRef.current = null
      }

    } catch (error) {
      console.error('Stream error:', error)
      onError?.(error as Error)
      setCurrentMessage(prev => prev ? { ...prev, status: 'error' } : null)
      setIsStreaming(false)
    }
  }, [isStreaming, endpoint, onMessage, onError, abort])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abort()
    }
  }, [abort])

  return {
    sendMessage,
    abort,
    isStreaming,
    currentMessage
  }
}