'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardContent } from '@/components/ui'
import { DocumentViewer } from './DocumentViewer'
import { DocumentControls } from './DocumentControls'
import { useQuery } from '@tanstack/react-query'
import type { DocumentSynthesisMatrix } from '@/lib/graphql/types'

interface DocumentBuilderProps {
  className?: string
}

interface DocumentData {
  DS?: any[]  // Data Sheet
  SP?: any[]  // Standard Procedure  
  X?: any[]   // Guidance Document
  Z?: any[]   // Checklist
  M?: any[]   // Solution Statements
  W?: any[]   // Iteration Deltas
  U?: any[]   // Cycle Synthesis
  N?: any[]   // Learning Traces
}

const MATRIX_TITLES = {
  DS: 'Data Sheet',
  SP: 'Standard Procedure',
  X: 'Guidance Document', 
  Z: 'Checklist',
  M: 'Solution Statements',
  W: 'Iteration Deltas',
  U: 'Cycle Synthesis',
  N: 'Learning Traces'
}

export function DocumentBuilder({ className }: DocumentBuilderProps) {
  const [selectedMatrix, setSelectedMatrix] = useState<keyof DocumentData>('DS')
  const [viewMode, setViewMode] = useState<'table' | 'markdown' | 'json'>('table')
  const [filterCriteria, setFilterCriteria] = useState<{
    minConfidence?: number
    status?: string[]
    version?: string
  }>({})

  // Fetch Document Synthesis matrices data
  const { data: docData, isLoading, error, refetch } = useQuery({
    queryKey: ['documentSynthesis'],
    queryFn: async () => {
      const response = await fetch('/api/neo4j/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query_type: 'get_document_synthesis' })
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch document synthesis data')
      }
      
      const result = await response.json()
      if (!result.ok) {
        throw new Error(result.error || 'Failed to fetch data')
      }
      
      // Transform the data into the expected format
      const transformed: DocumentData = {}
      result.matrices.forEach((matrix: any) => {
        transformed[matrix.name as keyof DocumentData] = matrix.cells
      })
      
      return transformed
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  const currentMatrixData = docData?.[selectedMatrix] || []
  const filteredData = currentMatrixData.filter(cell => {
    if (filterCriteria.minConfidence && cell.confidence < filterCriteria.minConfidence) {
      return false
    }
    if (filterCriteria.status?.length && !filterCriteria.status.includes(cell.status)) {
      return false
    }
    return true
  })

  const handleExport = async (format: 'markdown' | 'pdf' | 'json') => {
    try {
      const exportData = {
        matrix: selectedMatrix,
        title: MATRIX_TITLES[selectedMatrix],
        data: filteredData,
        metadata: {
          exportedAt: new Date().toISOString(),
          format,
          totalCells: filteredData.length,
          filters: filterCriteria
        }
      }

      if (format === 'json') {
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
          type: 'application/json' 
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${selectedMatrix}_${new Date().toISOString().split('T')[0]}.json`
        a.click()
        URL.revokeObjectURL(url)
      } else if (format === 'markdown') {
        const markdown = generateMarkdown(exportData)
        const blob = new Blob([markdown], { type: 'text/markdown' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${selectedMatrix}_${new Date().toISOString().split('T')[0]}.md`
        a.click()
        URL.revokeObjectURL(url)
      }
      // PDF export would need a server-side renderer
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const generateMarkdown = (exportData: any) => {
    const { title, data, metadata } = exportData
    let markdown = `# ${title}\n\n`
    markdown += `*Generated on ${new Date(metadata.exportedAt).toLocaleString()}*\n\n`
    
    if (data.length === 0) {
      return markdown + 'No data available.\n'
    }

    // Generate table based on matrix type
    if (selectedMatrix === 'DS') {
      markdown += '| Data Field | Units | Type | Source Refs | Notes |\n'
      markdown += '|------------|--------|------|-------------|-------|\n'
      data.forEach((cell: any) => {
        const parsed = JSON.parse(cell.value || '{}')
        markdown += `| ${parsed.dataField || ''} | ${parsed.units || ''} | ${parsed.type || ''} | ${parsed.sourceRefs?.join(', ') || ''} | ${parsed.notes || ''} |\n`
      })
    } else if (selectedMatrix === 'SP') {
      markdown += '| Step | Purpose | Inputs | Outputs | Preconditions | Postconditions |\n'
      markdown += '|------|---------|--------|---------|---------------|----------------|\n'
      data.forEach((cell: any) => {
        const parsed = JSON.parse(cell.value || '{}')
        markdown += `| ${parsed.step || ''} | ${parsed.purpose || ''} | ${parsed.inputs?.join(', ') || ''} | ${parsed.outputs?.join(', ') || ''} | ${parsed.preconditions?.join(', ') || ''} | ${parsed.postconditions?.join(', ') || ''} |\n`
      })
    } else if (selectedMatrix === 'Z') {
      markdown += '| Item | Rationale | Acceptance Criteria | Evidence | Severity |\n'
      markdown += '|------|-----------|---------------------|----------|----------|\n'
      data.forEach((cell: any) => {
        const parsed = JSON.parse(cell.value || '{}')
        markdown += `| ${parsed.item || ''} | ${parsed.rationale || ''} | ${parsed.acceptanceCriteria || ''} | ${parsed.evidence || ''} | ${parsed.severity || ''} |\n`
      })
    } else {
      // Generic format for other matrices
      markdown += '| Row | Column | Content |\n'
      markdown += '|-----|--------|----------|\n'
      data.forEach((cell: any) => {
        markdown += `| ${cell.labels?.rowLabel || cell.row} | ${cell.labels?.colLabel || cell.col} | ${cell.value || ''} |\n`
      })
    }

    return markdown
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading document synthesis data...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-red-600 mb-4">Failed to load document data</p>
          <button 
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Document Synthesis Builder</h3>
            <p className="text-sm text-gray-600 mt-1">
              Phase-2 Document Generation and Management
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {filteredData.length} of {currentMatrixData.length} cells
            </span>
            <button
              onClick={() => refetch()}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              title="Refresh data"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <DocumentControls
          selectedMatrix={selectedMatrix}
          onMatrixChange={setSelectedMatrix}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          filterCriteria={filterCriteria}
          onFilterChange={setFilterCriteria}
          onExport={handleExport}
        />

        <div className="border-t">
          <DocumentViewer
            matrix={selectedMatrix}
            title={MATRIX_TITLES[selectedMatrix]}
            data={filteredData}
            viewMode={viewMode}
          />
        </div>
      </CardContent>
    </Card>
  )
}