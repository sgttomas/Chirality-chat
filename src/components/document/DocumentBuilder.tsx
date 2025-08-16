'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardContent } from '@/components/ui'
import { DocumentViewer } from './DocumentViewer'
import { DocumentControls } from './DocumentControls'
import { useQuery } from '@tanstack/react-query'
import { parseCellValue, type DS, type SP, type X, type Z, type M, type LlmTriple } from '@/lib/parseCellValue'
import { formatDSTableMarkdown, formatBundleMarkdown } from '@/lib/prompt/formatters.table'
import { dsTriplesToCsv, downloadCsv } from '@/lib/export/dsCsv'
import { smartSerialize } from '@/lib/serializers'
import type { MatrixKey } from '@/lib/graphql/types'

interface DocumentBuilderProps {
  className?: string
}

// Separate UI matrix shape for document builder
type MatrixCell = {
  value: string
  row: number
  col: number
  confidence: number
  status?: string
}
type UiMatrix = Record<MatrixKey, MatrixCell[]>

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
  const [selectedMatrix, setSelectedMatrix] = useState<MatrixKey>('DS')
  const [viewMode, setViewMode] = useState<'table' | 'markdown' | 'json'>('table')
  const [filterCriteria, setFilterCriteria] = useState<{
    minConfidence?: number
    status?: string[]
    version?: string
  }>({})

  // Fetch Document Synthesis matrices data from Chirality Core
  const { data: docData, isLoading, error, refetch } = useQuery({
    queryKey: ['documentSynthesis'],
    queryFn: async () => {
      // First try to get data from Chirality Core
      try {
        const coreResponse = await fetch('/api/core/state')
        if (coreResponse.ok) {
          const coreData = await coreResponse.json()
          
          // Transform Chirality Core data to UI matrix format
          // IMPORTANT: Serialize Triple objects to strings for parseCellValue
          const doc: UiMatrix = { DS: [], SP: [], X: [], Z: [], M: [], W: [], U: [], N: [] }
          
          if (coreData.finals?.DS) {
            // Use smart serialization to handle Triple format properly
            const serialized = smartSerialize(coreData.finals.DS)
            doc.DS = [{
              value: serialized,
              row: 0,
              col: 0,
              confidence: 1.0
            }]
          }
          
          if (coreData.finals?.SP) {
            // Use smart serialization to handle Triple format properly
            const serialized = smartSerialize(coreData.finals.SP)
            doc.SP = [{
              value: serialized,
              row: 0,
              col: 0,
              confidence: 1.0
            }]
          }
          
          if (coreData.finals?.X) {
            // Use smart serialization to handle Triple format properly
            const serialized = smartSerialize(coreData.finals.X)
            doc.X = [{
              value: serialized,
              row: 0,
              col: 0,
              confidence: 1.0
            }]
          }
          
          if (coreData.finals?.M) {
            // Use smart serialization to handle Triple format properly
            const serialized = smartSerialize(coreData.finals.M)
            doc.M = [{
              value: serialized,
              row: 0,
              col: 0,
              confidence: 1.0
            }]
          }
          
          // If we have Core data, return it
          if (Object.keys(doc).length > 0) {
            return doc
          }
        }
      } catch (e) {
        console.log('Chirality Core not available, falling back to Neo4j')
      }
      
      // Fall back to Neo4j query
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
      const doc: UiMatrix = { DS: [], SP: [], X: [], Z: [], M: [], W: [], U: [], N: [] }
      result.matrices.forEach((matrix: any) => {
        doc[matrix.name as MatrixKey] = matrix.cells
      })
      
      return doc
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  const currentMatrixData = docData?.[selectedMatrix] || []
  const filteredData = currentMatrixData.filter(cell => {
    if (filterCriteria.minConfidence && cell.confidence < filterCriteria.minConfidence) {
      return false
    }
    if (filterCriteria.status?.length && (!cell.status || !filterCriteria.status.includes(cell.status))) {
      return false
    }
    return true
  })

  const handleExport = async (format: 'markdown' | 'pdf' | 'json' | 'csv') => {
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
      } else if (format === 'csv' && selectedMatrix === 'DS') {
        // Use the specialized DS CSV exporter
        const triples = filteredData.map(cell => parseCellValue<DS>(cell.value))
        const csv = dsTriplesToCsv(triples, {
          includeTerms: true,
          includeWarnings: true,
          delimiter: ','
        })
        downloadCsv(`${selectedMatrix}_${new Date().toISOString().split('T')[0]}.csv`, csv)
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

    // Generate table based on matrix type using safe parsing
    if (selectedMatrix === 'DS') {
      // Use the specialized DS table formatter
      markdown += '## Data Sheet Entries\n\n'
      data.forEach((cell: any, index: number) => {
        const triple = parseCellValue<DS>(cell.value)
        if (triple) {
          markdown += `### Entry ${index + 1} (${cell.labels?.rowLabel || cell.row}, ${cell.labels?.colLabel || cell.col})\n\n`
          markdown += formatDSTableMarkdown(triple) + '\n\n'
        }
      })
    } else if (selectedMatrix === 'SP') {
      markdown += '| Step | Purpose | Inputs | Outputs | Preconditions | Postconditions |\n'
      markdown += '|------|---------|--------|---------|---------------|----------------|\n'
      data.forEach((cell: any) => {
        const triple = parseCellValue<SP>(cell.value)
        if (triple && triple.text) {
          const t = triple.text
          markdown += `| ${t.step || ''} | ${t.purpose || ''} | ${t.inputs?.join(', ') || ''} | ${t.outputs?.join(', ') || ''} | ${t.preconditions?.join(', ') || ''} | ${t.postconditions?.join(', ') || ''} |\n`
        }
      })
    } else if (selectedMatrix === 'Z') {
      markdown += '| Item | Rationale | Acceptance Criteria | Evidence | Severity |\n'
      markdown += '|------|-----------|---------------------|----------|----------|\n'
      data.forEach((cell: any) => {
        const triple = parseCellValue<Z>(cell.value)
        if (triple && triple.text) {
          const t = triple.text
          markdown += `| ${t.item || ''} | ${t.rationale || ''} | ${t.acceptance_criteria || ''} | ${t.evidence?.join(', ') || ''} | ${t.severity || ''} |\n`
        }
      })
    } else if (selectedMatrix === 'X') {
      markdown += '## Guidance Documents\n\n'
      data.forEach((cell: any, index: number) => {
        const triple = parseCellValue<X>(cell.value)
        if (triple && triple.text) {
          const t = triple.text
          markdown += `### ${t.heading || `Section ${index + 1}`}\n\n`
          markdown += `${t.narrative || ''}\n\n`
          if (t.precedents?.length) {
            markdown += `**Precedents:** ${t.precedents.join(', ')}\n\n`
          }
          if (t.successors?.length) {
            markdown += `**Successors:** ${t.successors.join(', ')}\n\n`
          }
        }
      })
    } else if (selectedMatrix === 'M') {
      markdown += '## Solution Statements\n\n'
      data.forEach((cell: any, index: number) => {
        const triple = parseCellValue<M>(cell.value)
        if (triple && triple.text) {
          const t = triple.text
          markdown += `### Statement ${index + 1}\n\n`
          markdown += `**Statement:** ${t.statement || ''}\n\n`
          if (t.justification) {
            markdown += `**Justification:** ${t.justification}\n\n`
          }
          if (t.assumptions?.length) {
            markdown += `**Assumptions:** ${t.assumptions.join(', ')}\n\n`
          }
        }
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