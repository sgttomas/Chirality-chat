'use client'

import React, { Component, ReactNode } from 'react'
import { Card, CardContent } from './Card'
import { Button } from './Button'
interface Props {
  children: ReactNode
  fallback?: ReactNode
}
interface State {
  hasError: boolean
  error?: Error
}
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }
  handleReset = () => {
    this.setState({ hasError: false, error: undefined })
  }
  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }
      return (
        <Card className="m-4">
          <CardContent className="p-6 text-center">
            <div className="text-red-600 mb-4">
              <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h3>
            <p className="text-gray-600 mb-4">An unexpected error occurred. Please try again.</p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <pre className="text-xs text-red-600 bg-red-50 p-2 rounded text-left mb-4 overflow-auto">
                {this.state.error.stack}
              </pre>
            )}
            <Button onClick={this.handleReset}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      )
    }
    return this.props.children
  }
}
