'use client'

import { ChiralityChat } from '@/components/chirality'
import { QueryProvider } from '@/components/providers'

export default function ChiralityPage() {
  return (
    <QueryProvider>
      <div className="min-h-screen bg-gray-50 py-8">
        <ChiralityChat />
      </div>
    </QueryProvider>
  )
}