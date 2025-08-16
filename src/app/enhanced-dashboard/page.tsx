'use client'

import React, { useState } from 'react'
import { Card, CardHeader, CardContent, Button } from '@/components/ui'
import { DocumentBuilder } from '@/components/document'
import { SemanticMatrixViewer } from '@/components/matrix/SemanticMatrixViewer'
import { PipelineMonitor } from '@/components/pipeline'
import { MCPPanel } from '@/components/mcp/MCPPanel'
import { HealthIndicator } from '@/components/health'
import { JOB_PRESETS, getOrchestratorClient, toMutableArgs } from '@/lib/orchestratorClient'

const STATIONS = [
  { name: 'Problem Statement', matrices: ['A'] },
  { name: 'Decisions', matrices: ['B'] },
  { name: 'Truncated Decisions', matrices: ['J'] },
  { name: 'Requirements', matrices: ['C'] },
  { name: 'Objectives', matrices: ['F'] },
  { name: 'Solution Objectives', matrices: ['D'] },
  { name: 'Document Synthesis', matrices: ['DS', 'SP', 'X', 'Z', 'M', 'W', 'U', 'N'] }
]

export default function EnhancedDashboard() {
  const [selectedStation, setSelectedStation] = useState('Requirements')
  const [selectedMatrix, setSelectedMatrix] = useState('C')
  const [activeView, setActiveView] = useState<'overview' | 'matrix' | 'documents' | 'pipeline' | 'mcp'>('overview')
  const [runningJob, setRunningJob] = useState<string | null>(null)

  const handleStationChange = (stationName: string) => {
    setSelectedStation(stationName)
    const station = STATIONS.find(s => s.name === stationName)
    if (station && station.matrices.length > 0) {
      setSelectedMatrix(station.matrices[0])
    }
  }

  const runPreset = async (presetName: keyof typeof JOB_PRESETS) => {
    try {
      const preset = JOB_PRESETS[presetName]
      const client = getOrchestratorClient()
      
      const result = await client.startJob(preset.command, toMutableArgs(preset))
      
      setRunningJob(result.jobId)
      setActiveView('pipeline')
      
      console.log(`Started job ${result.jobId} with preset: ${presetName}`)
    } catch (error) {
      console.error('Failed to start preset job:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Chirality Framework - Enhanced Dashboard
              </h1>
              <p className="text-sm text-gray-600">
                Phase-2 Document Synthesis & Semantic Matrix Visualization
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <HealthIndicator health={{ status: 'healthy', lastChecked: new Date().toISOString() }} serviceName="System" />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 py-4">
            {[
              { key: 'overview', label: '📊 Overview', icon: '📊' },
              { key: 'matrix', label: '🔢 Semantic Matrices', icon: '🔢' },
              { key: 'documents', label: '📝 Document Synthesis', icon: '📝' },
              { key: 'pipeline', label: '🔧 Pipeline Monitor', icon: '🔧' },
              { key: 'mcp', label: '🤖 MCP Tools', icon: '🤖' }
            ].map(view => (
              <button
                key={view.key}
                onClick={() => setActiveView(view.key as any)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeView === view.key
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {view.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeView === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Semantic Valley Status</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {STATIONS.map(station => (
                    <div key={station.name} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        {station.name}
                      </span>
                      <div className="flex space-x-1">
                        {station.matrices.map(matrix => (
                          <div
                            key={matrix}
                            className="w-6 h-6 bg-green-100 text-green-800 rounded text-xs flex items-center justify-center font-medium"
                          >
                            {matrix}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Recent Activity</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Matrix C regenerated</p>
                      <p className="text-xs text-gray-500">2 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Document DS created</p>
                      <p className="text-xs text-gray-500">15 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">UFO claim proposed</p>
                      <p className="text-xs text-gray-500">1 hour ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions & Presets */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Quick Actions</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Navigation */}
                  <div className="space-y-2">
                    <Button 
                      className="w-full justify-start"
                      variant="secondary"
                      onClick={() => setActiveView('matrix')}
                    >
                      <span className="mr-2">🔢</span>
                      View Semantic Matrices
                    </Button>
                    <Button 
                      className="w-full justify-start"
                      variant="secondary"
                      onClick={() => setActiveView('documents')}
                    >
                      <span className="mr-2">📝</span>
                      Generate Documents
                    </Button>
                    <Button 
                      className="w-full justify-start"
                      variant="secondary"
                      onClick={() => setActiveView('pipeline')}
                    >
                      <span className="mr-2">🔧</span>
                      Monitor Pipeline
                    </Button>
                    <Button 
                      className="w-full justify-start"
                      variant="secondary"
                      onClick={() => setActiveView('mcp')}
                    >
                      <span className="mr-2">🤖</span>
                      Use MCP Tools
                    </Button>
                  </div>

                  {/* Pipeline Presets */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Pipeline Presets</h4>
                    <div className="space-y-1">
                      <Button
                        size="sm"
                        className="w-full justify-start text-xs"
                        variant="ghost"
                        onClick={() => runPreset('Test Single Cell')}
                        disabled={!!runningJob}
                      >
                        🧪 Test Single Cell
                      </Button>
                      <Button
                        size="sm"
                        className="w-full justify-start text-xs"
                        variant="ghost"
                        onClick={() => runPreset('Full Requirements')}
                        disabled={!!runningJob}
                      >
                        📋 Generate Requirements
                      </Button>
                      <Button
                        size="sm"
                        className="w-full justify-start text-xs"
                        variant="ghost"
                        onClick={() => runPreset('Complete Solution')}
                        disabled={!!runningJob}
                      >
                        💡 Complete Solution
                      </Button>
                      <Button
                        size="sm"
                        className="w-full justify-start text-xs"
                        variant="ghost"
                        onClick={() => runPreset('Push Axioms')}
                        disabled={!!runningJob}
                      >
                        📤 Push Axioms
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeView === 'matrix' && (
          <div className="space-y-6">
            {/* Station and Matrix Selector */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Matrix Selection</h3>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Station
                    </label>
                    <select
                      value={selectedStation}
                      onChange={(e) => handleStationChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    >
                      {STATIONS.map(station => (
                        <option key={station.name} value={station.name}>
                          {station.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Matrix
                    </label>
                    <select
                      value={selectedMatrix}
                      onChange={(e) => setSelectedMatrix(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    >
                      {STATIONS.find(s => s.name === selectedStation)?.matrices.map(matrix => (
                        <option key={matrix} value={matrix}>
                          Matrix {matrix}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Matrix Visualization */}
            <SemanticMatrixViewer
              stationName={selectedStation}
              matrixName={selectedMatrix}
              includeOntologies={true}
            />
          </div>
        )}

        {activeView === 'documents' && (
          <DocumentBuilder />
        )}

        {activeView === 'pipeline' && (
          <PipelineMonitor orchestratorUrl="http://localhost:3001" />
        )}

        {activeView === 'mcp' && (
          <MCPPanel 
            onToolResult={(result) => {
              console.log('MCP Tool Result:', result)
            }}
          />
        )}
      </div>
    </div>
  )
}