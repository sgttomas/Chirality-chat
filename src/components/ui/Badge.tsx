'use client'

import { ReactNode } from 'react'
interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md'
  children: ReactNode
  className?: string
}
export function Badge({ 
  variant = 'default', 
  size = 'sm', 
  children, 
  className = '' 
}: BadgeProps) {
  const baseStyles = 'inline-flex items-center font-medium rounded-full'
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800'
  }
  const sizes = {
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm'
  }
  return (
    <span className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  )
}
