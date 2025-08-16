'use client'

import { ReactNode } from 'react'
interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'secondary' | 'destructive'
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
  const variants: Record<NonNullable<BadgeProps['variant']>, string> = {
    default: 'bg-gray-200 text-gray-900',
    success: 'bg-green-100 text-green-900',
    warning: 'bg-yellow-100 text-yellow-900',
    error:   'bg-red-100 text-red-900',
    secondary: 'bg-gray-200 text-gray-900', // alias of default
    destructive: 'bg-red-100 text-red-900', // alias of error
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
