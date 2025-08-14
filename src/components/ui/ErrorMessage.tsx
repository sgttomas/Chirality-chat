'use client'

import { ReactNode } from 'react'
import { Button } from './Button'
interface ErrorMessageProps {
  title?: string
  message: string | ReactNode
  action?: {
    label: string
    onClick: () => void
  }
  variant?: 'error' | 'warning' | 'info'
}
export function ErrorMessage({ 
  title = 'Error', 
  message, 
  action,
  variant = 'error'
}: ErrorMessageProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'error':
        return 'border-red-200 bg-red-50 text-red-800'
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 text-yellow-800'
      case 'info':
        return 'border-blue-200 bg-blue-50 text-blue-800'
      default:
        return 'border-red-200 bg-red-50 text-red-800'
    }
  }
  const getIconColor = () => {
    switch (variant) {
      case 'error':
        return 'text-red-500'
      case 'warning':
        return 'text-yellow-500'
      case 'info':
        return 'text-blue-500'
      default:
        return 'text-red-500'
    }
  }
  const getIcon = () => {
    switch (variant) {
      case 'error':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        )
      case 'warning':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        )
      case 'info':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      default:
        return null
    }
  }
  return (
    <div className={`border rounded-lg p-4 ${getVariantStyles()}`}>
      <div className="flex items-start">
        <div className={`flex-shrink-0 ${getIconColor()}`}>
          {getIcon()}
        </div>
        <div className="ml-3 flex-1">
          <h4 className="text-sm font-medium">{title}</h4>
          <div className="mt-1 text-sm">
            {typeof message === 'string' ? <p>{message}</p> : message}
          </div>
          {action && (
            <div className="mt-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
