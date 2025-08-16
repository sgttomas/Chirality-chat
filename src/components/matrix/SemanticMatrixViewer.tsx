'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Card, CardHeader, CardContent, Button, Badge } from '@/components/ui'
import { useQuery } from '@tanstack/react-query'
import { getStageHexColor, getStageDisplayName, getStageBadgeColor, getAllStageColors } from '@/lib/stageColors'
import { OntologyChips } from '@/components/ontology'

interface SemanticMatrixViewerProps {
  stationName: string
  matrixName: string
  includeOntologies?: boolean
  className?: string
}

interface SemanticCell {
  row: number
  col: number
  labels: {
    rowLabel: string
    colLabel: string
  }
  latestStage?: {
    stage: string
    value: string
    modelId?: string
    createdAt: string
    warnings?: string[]
  }
  ontologies?: Array<{
    curie: string
    label: string
    scope?: string
  }>
}

interface MatrixData {
  name: string
  title: string
  matrixKey: string
  cells: SemanticCell[]
  axes: Array<{
    kind: 'ROW' | 'COL'
    labels: Array<{
      index: number
      value: string
    }>
  }>
}

export function SemanticMatrixViewer({ 
  stationName, 
  matrixName, 
  includeOntologies = false,
  className 
}: SemanticMatrixViewerProps) {
  const [selectedCell, setSelectedCell] = useState<SemanticCell | null>(null)
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Fetch matrix data
  const { data: matrixData, isLoading, error, refetch } = useQuery({
    queryKey: ['semanticMatrix', stationName, matrixName, includeOntologies],
    queryFn: async (): Promise<MatrixData> => {
      const response = await fetch('/api/neo4j/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query_type: 'get_matrix_overview',
          params: { stationName, matrixName, includeOntologies }
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch matrix data')
      }
      
      const result = await response.json()
      if (!result.ok) {
        throw new Error(result.error || 'Failed to fetch matrix')
      }
      
      return result.matrix
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  // Canvas drawing logic
  useEffect(() => {
    if (!matrixData || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * devicePixelRatio
    canvas.height = rect.height * devicePixelRatio
    ctx.scale(devicePixelRatio, devicePixelRatio)

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Get matrix dimensions
    const rowAxis = matrixData.axes.find(a => a.kind === 'ROW')
    const colAxis = matrixData.axes.find(a => a.kind === 'COL')
    
    const maxRows = Math.max(...matrixData.cells.map(c => c.row)) + 1
    const maxCols = Math.max(...matrixData.cells.map(c => c.col)) + 1

    const cellWidth = (rect.width - 100) / maxCols
    const cellHeight = (rect.height - 100) / maxRows
    const startX = 80
    const startY = 60

    // Draw grid and cells
    for (let row = 0; row < maxRows; row++) {
      for (let col = 0; col < maxCols; col++) {
        const x = startX + col * cellWidth
        const y = startY + row * cellHeight

        // Find cell data
        const cell = matrixData.cells.find(c => c.row === row && c.col === col)
        
        // Determine cell color based on stage using consistent colors
        let fillColor = '#f5f5f5'
        let borderColor = '#d1d5db'
        let borderWidth = 1

        if (cell?.latestStage) {
          fillColor = getStageHexColor(cell.latestStage.stage)
          borderColor = '#374151'
        }

        // Highlight hovered cell
        if (hoveredCell && hoveredCell.row === row && hoveredCell.col === col) {
          borderColor = '#3b82f6'
          borderWidth = 2
        }

        // Highlight selected cell
        if (selectedCell && selectedCell.row === row && selectedCell.col === col) {
          borderColor = '#ef4444'
          borderWidth = 3
        }

        // Draw cell rectangle
        ctx.fillStyle = fillColor
        ctx.fillRect(x, y, cellWidth - 1, cellHeight - 1)
        
        ctx.strokeStyle = borderColor
        ctx.lineWidth = borderWidth
        ctx.strokeRect(x, y, cellWidth - 1, cellHeight - 1)

        // Draw cell text (truncated)
        if (cell?.latestStage?.value) {
          ctx.fillStyle = '#374151'
          ctx.font = '10px sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          
          const text = cell.latestStage.value.substring(0, 20)
          ctx.fillText(text, x + cellWidth / 2, y + cellHeight / 2)
        }

        // Draw cell coordinates
        ctx.fillStyle = '#6b7280'
        ctx.font = '8px sans-serif'
        ctx.textAlign = 'left'
        ctx.fillText(`[${row},${col}]`, x + 2, y + 12)
      }
    }

    // Draw row labels
    if (rowAxis) {
      ctx.fillStyle = '#374151'
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'right'
      ctx.textBaseline = 'middle'
      
      rowAxis.labels.forEach(label => {
        const y = startY + label.index * cellHeight + cellHeight / 2
        ctx.fillText(label.value.substring(0, 15), startX - 5, y)
      })
    }

    // Draw column labels
    if (colAxis) {
      ctx.fillStyle = '#374151'
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'bottom'
      
      colAxis.labels.forEach(label => {
        const x = startX + label.index * cellWidth + cellWidth / 2
        ctx.save()
        ctx.translate(x, startY - 5)
        ctx.rotate(-Math.PI / 4)
        ctx.fillText(label.value.substring(0, 15), 0, 0)
        ctx.restore()
      })
    }

  }, [matrixData, hoveredCell, selectedCell])

  // Handle canvas clicks
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!matrixData || !canvasRef.current) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    const maxRows = Math.max(...matrixData.cells.map(c => c.row)) + 1
    const maxCols = Math.max(...matrixData.cells.map(c => c.col)) + 1
    const cellWidth = (rect.width - 100) / maxCols
    const cellHeight = (rect.height - 100) / maxRows
    const startX = 80
    const startY = 60

    // Calculate clicked cell
    const col = Math.floor((x - startX) / cellWidth)
    const row = Math.floor((y - startY) / cellHeight)

    if (row >= 0 && row < maxRows && col >= 0 && col < maxCols) {
      const cell = matrixData.cells.find(c => c.row === row && c.col === col)
      setSelectedCell(cell || null)
    }
  }

  // Handle canvas mouse move
  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!matrixData || !canvasRef.current) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    const maxRows = Math.max(...matrixData.cells.map(c => c.row)) + 1
    const maxCols = Math.max(...matrixData.cells.map(c => c.col)) + 1
    const cellWidth = (rect.width - 100) / maxCols
    const cellHeight = (rect.height - 100) / maxRows
    const startX = 80
    const startY = 60

    const col = Math.floor((x - startX) / cellWidth)
    const row = Math.floor((y - startY) / cellHeight)

    if (row >= 0 && row < maxRows && col >= 0 && col < maxCols) {
      setHoveredCell({ row, col })
    } else {
      setHoveredCell(null)
    }
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading {stationName}/{matrixName} matrix...</p>
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
          <p className="text-red-600 mb-4">Failed to load matrix</p>
          <Button onClick={() => refetch()}>Retry</Button>
        </CardContent>
      </Card>
    )
  }

  if (!matrixData) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <p className="text-gray-600">Matrix not found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">
              {matrixData.title || `${stationName} / ${matrixName}`}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Semantic Valley: {stationName} • Matrix: {matrixName}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant="default">
              {matrixData.cells.length} cells
            </Badge>
            <Button 
              size="sm" 
              variant="default"
              onClick={() => refetch()}
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Stage Legend */}
        <div className="flex flex-wrap gap-2 mt-4">
          {getAllStageColors().slice(0, 8).map(({ stage, hex, display }) => (
            <div key={stage} className="flex items-center space-x-1">
              <div 
                className="w-3 h-3 rounded"
                style={{ backgroundColor: hex }}
              />
              <span className="text-xs text-gray-600">{display}</span>
            </div>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="relative">
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            onMouseMove={handleCanvasMouseMove}
            onMouseLeave={() => setHoveredCell(null)}
            className="w-full h-96 border-t cursor-pointer"
            style={{ imageRendering: 'pixelated' }}
          />
        </div>

        {/* Cell Inspector */}
        {selectedCell && (
          <div className="border-t p-4 bg-gray-50">
            <h4 className="font-medium text-gray-800 mb-2">
              Cell [{selectedCell.row}, {selectedCell.col}]
            </h4>
            
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-gray-600">Labels: </span>
                <span>{selectedCell.labels.rowLabel} × {selectedCell.labels.colLabel}</span>
              </div>
              
              {selectedCell.latestStage && (
                <>
                  <div>
                    <span className="font-medium text-gray-600">Stage: </span>
                    <Badge variant={getStageBadgeColor(selectedCell.latestStage.stage) as any}>
                      {getStageDisplayName(selectedCell.latestStage.stage)}
                    </Badge>
                  </div>
                  
                  <div>
                    <span className="font-medium text-gray-600">Value: </span>
                    <span className="text-gray-700">
                      {selectedCell.latestStage.value.length > 100 
                        ? `${selectedCell.latestStage.value.substring(0, 100)}...`
                        : selectedCell.latestStage.value
                      }
                    </span>
                  </div>
                  
                  <div>
                    <span className="font-medium text-gray-600">Updated: </span>
                    <span>{new Date(selectedCell.latestStage.createdAt).toLocaleString()}</span>
                  </div>
                  
                  {selectedCell.latestStage.modelId && (
                    <div>
                      <span className="font-medium text-gray-600">Model: </span>
                      <span>{selectedCell.latestStage.modelId}</span>
                    </div>
                  )}
                  
                  {selectedCell.latestStage.warnings && selectedCell.latestStage.warnings.length > 0 && (
                    <div>
                      <span className="font-medium text-gray-600">Warnings: </span>
                      <ul className="list-disc list-inside text-yellow-700">
                        {selectedCell.latestStage.warnings.map((warning, i) => (
                          <li key={i}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
              
              {/* Ontologies */}
              {includeOntologies && selectedCell.ontologies && selectedCell.ontologies.length > 0 && (
                <div>
                  <span className="font-medium text-gray-600 block mb-2">Ontologies: </span>
                  <OntologyChips entities={selectedCell.ontologies} maxVisible={6} showScope={true} />
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}