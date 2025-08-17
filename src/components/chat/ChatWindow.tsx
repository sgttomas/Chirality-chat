'use client'

import { useState, useEffect, useRef, useCallback, memo } from 'react'
import { useStream, StreamMessage } from '@/hooks/useStream'
import { Message } from './Message'
import { ChatInput } from './ChatInput'
import { TypingIndicator } from './TypingIndicator'
import { Card, CardHeader, CardContent, Button } from '@/components/ui'
import Link from 'next/link'

export const ChatWindow = memo(function ChatWindow() {
  const [messages, setMessages] = useState<StreamMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Stable callback references for better performance
  const handleMessage = useCallback(async (message: StreamMessage) => {
    setMessages(prev => {
      const filtered = prev.filter(m => m.id !== message.id)
      return [...filtered, message].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    })
    
    // Storage removed for simplicity
  }, [])

  const handleError = useCallback((error: Error) => {
    console.error('Stream error:', error)
  }, [])

  const { sendMessage, abort, isStreaming, currentMessage } = useStream({
    onMessage: handleMessage,
    onError: handleError
  })

  // Load messages on mount
  useEffect(() => {
    setIsLoading(false)
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, currentMessage])

  const handleClearMessages = useCallback(() => {
    setMessages([])
  }, [])

  const handleExportMessages = useCallback(() => {
    const blob = new Blob([JSON.stringify(messages, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chat-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [messages])

  if (isLoading) {
    return (
      <Card className="h-full flex items-center justify-center">
        <div className="text-gray-500">Loading chat history...</div>
      </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <h1 
            className="text-lg font-semibold text-gray-900"
            id="chat-title"
          >
            Chirality Chat
          </h1>
          <div className="flex items-center gap-2">
            <Link href="/matrix">
              <Button variant="ghost" size="sm">
                Matrix
              </Button>
            </Link>
            <Link href="/mcp">
              <Button variant="ghost" size="sm">
                MCP
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                Dashboard
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleExportMessages}
              disabled={messages.length === 0}
              aria-label={`Export ${messages.length} messages as JSON`}
            >
              Export
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleClearMessages}
              disabled={messages.length === 0}
              aria-label={`Clear all ${messages.length} messages`}
            >
              Clear
            </Button>
            {isStreaming && (
              <Button 
                variant="secondary" 
                size="sm"
                onClick={abort}
                aria-label="Stop current message generation"
              >
                Stop
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto space-y-0 p-0">
        <div className="p-4 space-y-0">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>No messages yet. Start a conversation!</p>
            </div>
          ) : (
            messages.map((message) => (
              <Message key={message.id} message={message} />
            ))
          )}
          
          {currentMessage && (
            <Message message={currentMessage} />
          )}
          
          <TypingIndicator visible={isStreaming && !currentMessage} />
          <div ref={messagesEndRef} />
        </div>
      </CardContent>
      
      <ChatInput 
        onSendMessage={sendMessage}
        disabled={isStreaming}
        placeholder="Ask me anything about chirality..."
        aria-label="Message input"
        aria-describedby="chat-title"
      />
    </Card>
  )
})