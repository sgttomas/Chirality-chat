'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Card, CardContent, Button } from '@/components/ui'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo })
    
    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)
    
    console.error('Error Boundary caught an error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Card className="m-4 border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-red-600 mb-4">
                <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              
              <h2 className="text-lg font-semibold text-red-900 mb-2">
                Something went wrong
              </h2>
              
              <p className="text-red-700 mb-4">
                The application encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.
              </p>
              
              <div className="space-x-2">
                <Button 
                  onClick={this.handleReset}
                  variant="secondary"
                >
                  Try Again
                </Button>
                <Button 
                  onClick={() => window.location.reload()}
                  variant="primary"
                >
                  Refresh Page
                </Button>
              </div>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-6 text-left">
                  <summary className="cursor-pointer text-sm font-medium text-red-800 mb-2">
                    Error Details (Development)
                  </summary>
                  <div className="bg-red-100 p-4 rounded border text-xs font-mono text-red-800 overflow-auto">
                    <div className="mb-2">
                      <strong>Error:</strong> {this.state.error.message}
                    </div>
                    <div className="mb-2">
                      <strong>Stack:</strong>
                      <pre className="whitespace-pre-wrap">{this.state.error.stack}</pre>
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </div>
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}

// Specialized error boundaries for different parts of the app
export function ChatErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Chat error:', error.message)
      }}
      fallback={
        <Card className="h-full flex items-center justify-center border-red-200 bg-red-50">
          <CardContent className="text-center p-6">
            <div className="text-red-600 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.001 8.001 0 01-7.916-6.747M3 12a9 9 0 014.916-7.917" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-900 mb-2">
              Chat Error
            </h3>
            <p className="text-red-700 mb-4">
              The chat interface encountered an error. Please refresh the page to continue.
            </p>
            <Button onClick={() => window.location.reload()}>
              Refresh Chat
            </Button>
          </CardContent>
        </Card>
      }
    >
      {children}
    </ErrorBoundary>
  )
}

export function MatrixErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Matrix error:', error.message)
      }}
      fallback={
        <Card className="h-full flex items-center justify-center border-red-200 bg-red-50">
          <CardContent className="text-center p-6">
            <div className="text-red-600 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-900 mb-2">
              Matrix Visualization Error
            </h3>
            <p className="text-red-700 mb-4">
              The matrix visualization encountered an error. This may be due to corrupted data or a rendering issue.
            </p>
            <Button onClick={() => window.location.reload()}>
              Refresh Visualization
            </Button>
          </CardContent>
        </Card>
      }
    >
      {children}
    </ErrorBoundary>
  )
}

export function MCPErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('MCP error:', error.message)
      }}
      fallback={
        <Card className="h-full flex items-center justify-center border-red-200 bg-red-50">
          <CardContent className="text-center p-6">
            <div className="text-red-600 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01M15 8a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-900 mb-2">
              MCP Connection Error
            </h3>
            <p className="text-red-700 mb-4">
              The Model Context Protocol interface encountered an error. This may be due to server connection issues.
            </p>
            <Button onClick={() => window.location.reload()}>
              Reconnect MCP
            </Button>
          </CardContent>
        </Card>
      }
    >
      {children}
    </ErrorBoundary>
  )
}

// Global error handler for unhandled promise rejections
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason)
    console.error('Unhandled promise rejection:', event.reason)
  })

  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error || event.message)
    console.error('Global error:', event.error || event.message)
  })
}