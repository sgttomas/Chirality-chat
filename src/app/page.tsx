'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  
  useEffect(() => {
    router.push('/chirality-core')
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Redirecting to Chirality Core...</h1>
        <p className="text-gray-600">If you're not redirected, <a href="/chirality-core" className="text-blue-600 hover:underline">click here</a></p>
      </div>
    </div>
  )
}