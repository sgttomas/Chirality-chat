'use client'

import { HealthPanel } from '@/components/health'
import { FeatureFlagsPanel } from '@/components/settings'
import { Button } from '@/components/ui'
import Link from 'next/link'

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Chirality System Dashboard
            </h1>
            <p className="text-gray-600">
              Monitor system health and configure features
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/mcp">
              <Button variant="ghost">MCP Tools</Button>
            </Link>
            <Link href="/matrix">
              <Button variant="ghost">Matrix Visualization</Button>
            </Link>
            <Link href="/">
              <Button variant="secondary">← Back to Chat</Button>
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <HealthPanel />
          </div>
          
          <div>
            <FeatureFlagsPanel />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border">
          <h3 className="text-lg font-semibold mb-4">Phase 2: Backend Integration Status</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <span className="text-sm">React Query configuration and providers</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <span className="text-sm">Service clients for chirality-semantic-framework</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <span className="text-sm">Health monitoring UI components</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <span className="text-sm">Feature flag support for REST vs GraphQL mode toggle</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <span className="text-sm">Standardized error handling across the application</span>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Next Phase</h4>
            <p className="text-sm text-blue-800">
              Phase 3: Matrix Visualization - Contract definition, virtualized rendering, and interactions
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}