'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button, Card, CardHeader, CardContent } from '@/components/ui'
import { MatrixPanel } from '@/components/matrix'
import { sampleMatrices } from '@/lib/matrix/sampleData'
import { useFeatureFlags } from '@/lib/feature-flags'

export default function MatrixPage() {
  const [selectedMatrix, setSelectedMatrix] = useState(sampleMatrices[0])
  const { flags } = useFeatureFlags()

  if (!flags.enableMatrixVisualization) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Matrix Visualization
            </h1>
            <p className="text-gray-600 mb-6">
              Matrix visualization is currently disabled. Enable it in the feature flags to proceed.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/dashboard">
                <Button>Go to Dashboard</Button>
              </Link>
              <Link href="/">
                <Button variant="secondary">Back to Chat</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Matrix Visualization
            </h1>
            <p className="text-gray-600">
              Interactive 3D molecular structure visualization
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/mcp">
              <Button variant="ghost">MCP</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="ghost">Dashboard</Button>
            </Link>
            <Link href="/">
              <Button variant="secondary">← Back to Chat</Button>
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sample selection sidebar */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <h3 className="text-lg font-semibold">Sample Molecules</h3>
            </CardHeader>
            <CardContent className="space-y-2">
              {sampleMatrices.map((matrix) => (
                <button
                  key={matrix.id}
                  onClick={() => setSelectedMatrix(matrix)}
                  className={`w-full p-3 text-left border rounded-lg transition-colors ${
                    selectedMatrix.id === matrix.id
                      ? 'border-blue-500 bg-blue-50 text-blue-900'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">{matrix.title}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {matrix.metadata.molecularFormula}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {matrix.metadata.stereoCenters} stereocenter{matrix.metadata.stereoCenters !== 1 ? 's' : ''}
                  </div>
                </button>
              ))}
              
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm text-blue-800">
                  <div className="font-medium mb-1">Interactions:</div>
                  <ul className="text-xs space-y-1">
                    <li>• Click & drag to pan</li>
                    <li>• Scroll to zoom</li>
                    <li>• Click nodes to select</li>
                    <li>• Shift+click for multi-select</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main visualization */}
          <div className="lg:col-span-3">
            <MatrixPanel 
              matrix={selectedMatrix}
              className="h-full"
            />
          </div>
        </div>

        {/* Phase 3 status */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Phase 3: Matrix Visualization Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  <span className="text-sm">Matrix visualization contracts and interfaces</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  <span className="text-sm">Core Canvas renderer with virtualization</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  <span className="text-sm">Matrix interaction handlers (zoom, pan, select)</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  <span className="text-sm">Matrix visualization UI components</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  <span className="text-sm">Integration with chat interface</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  <span className="text-sm">Phase 3 implementation complete</span>
                </div>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Next Phase</h4>
              <p className="text-sm text-blue-800">
                Phase 4: MCP Integration - Client, tool discovery, invocation UI, approval flow
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}