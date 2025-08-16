'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui'
import type { MatrixKey } from '@/lib/graphql/types'

interface DocumentControlsProps {
  selectedMatrix: MatrixKey
  onMatrixChange: (matrix: MatrixKey) => void
  viewMode: 'table' | 'markdown' | 'json'
  onViewModeChange: (mode: 'table' | 'markdown' | 'json') => void
  filterCriteria: {
    minConfidence?: number
    status?: string[]
    version?: string
  }
  onFilterChange: (criteria: any) => void
  onExport: (format: 'markdown' | 'pdf' | 'json') => void
}

const MATRICES = [
  { key: 'DS', title: 'Data Sheet', icon: '📊' },
  { key: 'SP', title: 'Standard Procedure', icon: '📋' },
  { key: 'X', title: 'Guidance Document', icon: '📖' },
  { key: 'Z', title: 'Checklist', icon: '✅' },
  { key: 'M', title: 'Solution Statements', icon: '💡' },
  { key: 'W', title: 'Iteration Deltas', icon: '🔄' },
  { key: 'U', title: 'Cycle Synthesis', icon: '🔗' },
  { key: 'N', title: 'Learning Traces', icon: '📚' }
] as const satisfies Array<{ key: MatrixKey; title: string; icon: string }>

export function DocumentControls({
  selectedMatrix,
  onMatrixChange,
  viewMode,
  onViewModeChange,
  filterCriteria,
  onFilterChange,
  onExport
}: DocumentControlsProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)

  return (
    <div className="bg-gray-50 border-b">
      {/* Main Controls */}
      <div className="p-4 space-y-4">
        {/* Matrix Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Document Matrix
          </label>
          <div className="flex flex-wrap gap-2">
            {MATRICES.map(matrix => (
              <button
                key={matrix.key}
                onClick={() => onMatrixChange(matrix.key)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                  selectedMatrix === matrix.key
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <span>{matrix.icon}</span>
                <span>{matrix.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* View Mode and Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* View Mode */}
            <div className="flex items-center space-x-1">
              <label className="text-sm font-medium text-gray-700 mr-2">View:</label>
              <div className="flex bg-white border border-gray-200 rounded-lg overflow-hidden">
                {(['table', 'markdown', 'json'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => onViewModeChange(mode)}
                    className={`px-3 py-1 text-sm font-medium transition-colors ${
                      viewMode === mode
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {mode === 'table' && '📋'}
                    {mode === 'markdown' && '📝'}
                    {mode === 'json' && '📄'}
                    <span className="ml-1 capitalize">{mode}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors flex items-center space-x-1 ${
                showFilters
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
              </svg>
              <span>Filters</span>
            </button>
          </div>

          {/* Export Menu */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Export</span>
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                <button
                  onClick={() => {
                    onExport('markdown')
                    setShowExportMenu(false)
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                >
                  <span>📝</span>
                  <span>Export as Markdown</span>
                </button>
                <button
                  onClick={() => {
                    onExport('json')
                    setShowExportMenu(false)
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                >
                  <span>📄</span>
                  <span>Export as JSON</span>
                </button>
                <button
                  onClick={() => {
                    onExport('pdf')
                    setShowExportMenu(false)
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                  disabled
                >
                  <span>📄</span>
                  <span>Export as PDF (Coming Soon)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="border-t bg-white p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Filter Options</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Confidence Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Min Confidence
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={filterCriteria.minConfidence || 0}
                onChange={(e) => onFilterChange({
                  ...filterCriteria,
                  minConfidence: parseFloat(e.target.value)
                })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="text-xs text-gray-500 mt-1">
                {((filterCriteria.minConfidence || 0) * 100).toFixed(0)}%
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Status
              </label>
              <select
                value={filterCriteria.status?.[0] || ''}
                onChange={(e) => onFilterChange({
                  ...filterCriteria,
                  status: e.target.value ? [e.target.value] : []
                })}
                className="w-full px-3 py-1 border border-gray-200 rounded text-sm"
              >
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="final">Final</option>
              </select>
            </div>

            {/* Version Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Version
              </label>
              <select
                value={filterCriteria.version || ''}
                onChange={(e) => onFilterChange({
                  ...filterCriteria,
                  version: e.target.value || undefined
                })}
                className="w-full px-3 py-1 border border-gray-200 rounded text-sm"
              >
                <option value="">All Versions</option>
                <option value="V1">Version 1</option>
                <option value="V2">Version 2</option>
                <option value="V3">Version 3</option>
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          <div className="mt-3 flex justify-end">
            <button
              onClick={() => onFilterChange({})}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      )}
    </div>
  )
}