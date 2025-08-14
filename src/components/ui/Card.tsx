'use client'

import { ReactNode } from 'react'
interface CardProps {
  children: ReactNode
  className?: string
}
interface CardHeaderProps {
  children: ReactNode
  className?: string
}
interface CardContentProps {
  children: ReactNode
  className?: string
}
export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {children}
    </div>
  )
}
export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div className={`px-6 py-4 border-b border-gray-200 ${className}`}>
      {children}
    </div>
  )
}
export function CardContent({ children, className = '' }: CardContentProps) {
  return (
    <div className={`px-6 py-4 ${className}`}>
      {children}
    </div>
  )
}
