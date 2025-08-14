'use client'
import { memo, useMemo } from 'react'
import { StreamMessage } from '@/hooks/useStream'
import { Badge } from '@/components/ui'

interface MessageProps {
  message: StreamMessage
}

const statusColors = {
  pending: 'warning',
  streaming: 'default', 
  complete: 'success',
  error: 'error'
} as const

export const Message = memo(function Message({ message }: MessageProps) {
  const isUser = message.role === 'user'
  
  // Memoize expensive calculations
  const formattedTime = useMemo(() => 
    message.timestamp.toLocaleTimeString(), 
    [message.timestamp]
  )
  
  const messageClasses = useMemo(() => 
    `max-w-[70%] ${isUser ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'} rounded-lg px-4 py-2`,
    [isUser]
  )

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={messageClasses}>
        <div className="flex items-start justify-between mb-1">
          <span className="text-xs opacity-70">
            {isUser ? 'You' : 'Assistant'}
          </span>
          <div className="flex items-center gap-2 ml-2">
            <Badge variant={statusColors[message.status]} size="sm">
              {message.status}
            </Badge>
            <span className="text-xs opacity-70">
              {formattedTime}
            </span>
          </div>
        </div>
        
        <div className="whitespace-pre-wrap">
          {message.content}
          {message.status === 'streaming' && (
            <span className="inline-block w-2 h-4 ml-1 bg-current opacity-70 animate-pulse">|</span>
          )}
        </div>
      </div>
    </div>
  )
})
