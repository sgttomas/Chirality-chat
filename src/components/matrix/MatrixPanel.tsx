'use client'

import { useState } from 'react'
import { Card, CardHeader, CardContent } from '@/components/ui'
import { MatrixCanvas } from './MatrixCanvas'
import { MatrixControls } from './MatrixControls'
import type { ChiralityMatrix, RenderOptions } from '@/lib/matrix/types'

interface MatrixPanelProps {
  matrix: ChiralityMatrix | null
  title?: string
  className?: string
}

const defaultRenderOptions: RenderOptions = {
  cellSize: 20,
  showGrid: true,
  showLabels: true,
  highlightStereocenters: true,
  colorScheme: 'default',
  opacity: 1.0
}

export function MatrixPanel({ matrix, title, className }: MatrixPanelProps) {
  const [renderOptions, setRenderOptions] = useState<RenderOptions>(defaultRenderOptions)
  const [selectedNodes, setSelectedNodes] = useState<string[]>([])
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [controlsRef, setControlsRef] = useState<{
    zoomToFit: () => void
    resetView: () => void
    clearSelection: () => void
  } | null>(null)

  const handleOptionsChange = (newOptions: Partial<RenderOptions>) => {
    setRenderOptions(prev => ({ ...prev, ...newOptions }))
  }

  const handleControlsReady = (controls: typeof controlsRef) => {
    setControlsRef(controls)
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">
              {title || matrix?.title || 'Matrix Visualization'}
            </h3>
            {matrix?.metadata && (
              <div className="text-sm text-gray-600 mt-1">
                {matrix.metadata.molecularFormula && (
                  <span className="mr-4">Formula: {matrix.metadata.molecularFormula}</span>
                )}
                {matrix.metadata.stereoCenters && (
                  <span className="mr-4">Stereocenters: {matrix.metadata.stereoCenters}</span>
                )}
                {matrix.metadata.confidence && (
                  <span>Confidence: {(matrix.metadata.confidence * 100).toFixed(1)}%</span>
                )}
              </div>
            )}
          </div>
          
          {matrix && (
            <div className="text-sm text-gray-500">
              {matrix.nodes.length} nodes • {matrix.edges.length} edges
              {selectedNodes.length > 0 && (
                <span className="ml-2 text-blue-600">
                  {selectedNodes.length} selected
                </span>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="border-b">
          <MatrixControls
            options={renderOptions}
            onOptionsChange={handleOptionsChange}
            onZoomToFit={() => controlsRef?.zoomToFit()}
            onResetView={() => controlsRef?.resetView()}
            onClearSelection={() => controlsRef?.clearSelection()}
            selectedCount={selectedNodes.length}
          />
        </div>

        <div className="h-96">
          <MatrixCanvas
            matrix={matrix}
            options={renderOptions}
            onSelectionChange={setSelectedNodes}
            onNodeHover={setHoveredNode}
            className="h-full"
          />
        </div>

        {/* Info panel */}
        {(selectedNodes.length > 0 || hoveredNode) && (
          <div className="border-t p-4 bg-gray-50">
            <div className="text-sm">
              {hoveredNode && !selectedNodes.includes(hoveredNode) && (
                <div className="mb-2">
                  <span className="font-medium text-gray-700">Hovered: </span>
                  {getNodeInfo(matrix, hoveredNode)}
                </div>
              )}
              
              {selectedNodes.length > 0 && (
                <div>
                  <span className="font-medium text-gray-700">
                    Selected ({selectedNodes.length}): 
                  </span>
                  <div className="mt-1 space-y-1">
                    {selectedNodes.slice(0, 5).map(nodeId => (
                      <div key={nodeId} className="text-xs text-gray-600">
                        {getNodeInfo(matrix, nodeId)}
                      </div>
                    ))}
                    {selectedNodes.length > 5 && (
                      <div className="text-xs text-gray-500">
                        ... and {selectedNodes.length - 5} more
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function getNodeInfo(matrix: ChiralityMatrix | null, nodeId: string): string {
  if (!matrix) return nodeId
  
  const node = matrix.nodes.find(n => n.id === nodeId)
  if (!node) return nodeId
  
  const parts = [node.label]
  
  if (node.properties.element) {
    parts.push(`(${node.properties.element})`)
  }
  
  if (node.properties.chirality && node.properties.chirality !== 'none') {
    parts.push(`[${node.properties.chirality}]`)
  }
  
  return parts.join(' ')
}