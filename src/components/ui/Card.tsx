'use client'

import React, { ReactNode } from 'react'

export type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
  className?: string
  onClick?: React.MouseEventHandler<HTMLDivElement>
  role?: string
  tabIndex?: number
}
interface CardHeaderProps {
  children: ReactNode
  className?: string
}
interface CardContentProps {
  children: ReactNode
  className?: string
}
export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`} {...props}>
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
