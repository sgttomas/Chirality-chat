'use client'

import React, { useState, useEffect } from 'react'

interface ChatDebugData {
  timestamp: string
  state: {
    problem: {
      title: string
      statement: string
      initialVector: string[]
    }
    documentsFound: {
      DS: boolean
      SP: boolean
      X: boolean
      M: boolean
    }
  }
  fullInstructions: string
  instructionsLength: number
  compactedDocuments: {
    DS: string | null
    SP: string | null
    X: string | null
    M: string | null
  }
  rawDocuments: {
    DS: any
    SP: any
    X: any
    M: any
  }
}

export default function ChatAdminDashboard() {
  const [debugData, setDebugData] = useState<ChatDebugData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedView, setSelectedView] = useState<'overview' | 'instructions' | 'compacted' | 'raw'>('overview')
  const [autoRefresh, setAutoRefresh] = useState(false)

  const fetchDebugData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/chat/debug')
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const data = await response.json()
      setDebugData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDebugData()
  }, [])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchDebugData, 2000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const testChatWithDocuments = async () => {
    try {
      const response = await fetch('/api/chat/stream', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        alert('Chat endpoint is accessible. Check browser network tab for actual request details.')
      } else {
        alert(`Chat endpoint error: ${response.status}`)
      }
    } catch (err) {
      alert(`Failed to test chat: ${err}`)
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h1 className="text-2xl font-bold text-red-800 mb-4">Chat Admin Dashboard - Error</h1>
            <p className="text-red-600">Failed to load debug data: {error}</p>
            <button 
              onClick={fetchDebugData}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Chat System Admin Dashboard</h1>
              <p className="text-gray-600 mt-2">
                Transparency window into the chat LLM's system prompt and document injection
              </p>
            </div>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="mr-2"
                />
                Auto-refresh (2s)
              </label>
              <button
                onClick={fetchDebugData}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isLoading ? 'Loading...' : 'Refresh'}
              </button>
              <button
                onClick={testChatWithDocuments}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Test Chat Endpoint
              </button>
            </div>
          </div>
        </div>

        {debugData && (
          <>
            {/* Status Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Documents Loaded</h3>
                <div className="space-y-2">
                  {Object.entries(debugData.state.documentsFound).map(([doc, found]) => (
                    <div key={doc} className="flex justify-between">
                      <span className="text-gray-600">{doc}:</span>
                      <span className={found ? 'text-green-600 font-semibold' : 'text-red-600'}>
                        {found ? '✓ Loaded' : '✗ Missing'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Instructions</h3>
                <div className="text-2xl font-bold text-blue-600">
                  {debugData.instructionsLength.toLocaleString()}
                </div>
                <p className="text-gray-600 text-sm">characters in system prompt</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Problem Set</h3>
                <div className="text-sm">
                  <div className={debugData.state.problem.statement ? 'text-green-600' : 'text-red-600'}>
                    {debugData.state.problem.statement ? '✓ Problem defined' : '✗ No problem set'}
                  </div>
                  {debugData.state.problem.title && (
                    <div className="text-gray-600 mt-1">"{debugData.state.problem.title}"</div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Last Updated</h3>
                <div className="text-sm text-gray-600">
                  {new Date(debugData.timestamp).toLocaleString()}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {((Date.now() - new Date(debugData.timestamp).getTime()) / 1000).toFixed(0)}s ago
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  {[
                    { key: 'overview', label: 'Overview' },
                    { key: 'instructions', label: 'Full Instructions' },
                    { key: 'compacted', label: 'Compacted Documents' },
                    { key: 'raw', label: 'Raw Documents' }
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setSelectedView(tab.key as any)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        selectedView === tab.key
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-6">
                {selectedView === 'overview' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Problem Statement</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="font-medium">{debugData.state.problem.title || 'No title set'}</div>
                        <div className="text-gray-600 mt-2">
                          {debugData.state.problem.statement || 'No problem statement defined'}
                        </div>
                        {debugData.state.problem.initialVector.length > 0 && (
                          <div className="mt-2">
                            <span className="text-sm text-gray-500">Initial Vector: </span>
                            {debugData.state.problem.initialVector.map((token, i) => (
                              <span key={i} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1">
                                {token}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3">Document Injection Status</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(debugData.state.documentsFound).map(([doc, found]) => (
                          <div key={doc} className={`p-4 rounded-lg border ${found ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{doc} Document</span>
                              <span className={found ? 'text-green-600' : 'text-red-600'}>
                                {found ? '✓' : '✗'}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              {found ? 'Injected into chat instructions' : 'Not available in chat context'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {selectedView === 'instructions' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">
                      Full System Instructions ({debugData.instructionsLength.toLocaleString()} chars)
                    </h3>
                    <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-auto max-h-96">
                      <pre className="whitespace-pre-wrap">{debugData.fullInstructions}</pre>
                    </div>
                  </div>
                )}

                {selectedView === 'compacted' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Compacted Documents (as sent to LLM)</h3>
                    {Object.entries(debugData.compactedDocuments).map(([doc, content]) => (
                      <div key={doc} className="border rounded-lg p-4">
                        <h4 className="font-medium text-lg mb-2">{doc}</h4>
                        {content ? (
                          <div className="bg-gray-50 p-3 rounded font-mono text-sm">
                            {content}
                          </div>
                        ) : (
                          <div className="text-gray-500 italic">No {doc} document available</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {selectedView === 'raw' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Raw Document Data</h3>
                    {Object.entries(debugData.rawDocuments).map(([doc, content]) => (
                      <div key={doc} className="border rounded-lg p-4">
                        <h4 className="font-medium text-lg mb-2">{doc}</h4>
                        {content ? (
                          <div className="bg-gray-50 p-3 rounded">
                            <pre className="text-sm overflow-auto max-h-64">
                              {JSON.stringify(content, null, 2)}
                            </pre>
                          </div>
                        ) : (
                          <div className="text-gray-500 italic">No {doc} document available</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}