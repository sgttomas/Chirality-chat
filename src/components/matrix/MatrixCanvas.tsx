'use client'

import { useEffect, useRef, useState, useMemo, useCallback, memo } from 'react'
import { CanvasMatrixRenderer } from '@/lib/matrix/renderer'
import { useMatrixInteractions } from '@/hooks/useMatrixInteractions'
import type { ChiralityMatrix, RenderOptions } from '@/lib/matrix/types'
import { 
  AriaRoles, 
  KeyboardKeys, 
  ScreenReader, 
  createKeyboardHandler,
  generateAriaDescription 
} from '@/lib/accessibility'

interface MatrixCanvasProps {
  matrix: ChiralityMatrix | null
  options?: Partial<RenderOptions>
  onSelectionChange?: (selectedIds: string[]) => void
  onNodeHover?: (nodeId: string | null) => void
  className?: string
}

const defaultOptions: RenderOptions = {
  cellSize: 20,
  showGrid: true,
  showLabels: true,
  highlightStereocenters: true,
  colorScheme: 'default',
  opacity: 1.0
}

export const MatrixCanvas = memo(function MatrixCanvas({ 
  matrix, 
  options = {},
  onSelectionChange,
  onNodeHover,
  className = ''
}: MatrixCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<CanvasMatrixRenderer | null>(null)
  const [isReady, setIsReady] = useState(false)
  
  // Memoize render options to prevent unnecessary re-renders
  const renderOptions = useMemo(() => ({ 
    ...defaultOptions, 
    ...options 
  }), [options])

  // Stable callback references
  const stableOnSelectionChange = useCallback(onSelectionChange || (() => {}), [onSelectionChange])
  const stableOnNodeHover = useCallback(onNodeHover || (() => {}), [onNodeHover])

  // Initialize renderer
  useEffect(() => {
    if (!canvasRef.current) return

    try {
      const renderer = new CanvasMatrixRenderer(canvasRef.current)
      rendererRef.current = renderer
      setIsReady(true)
      
      return () => {
        renderer.destroy()
        rendererRef.current = null
        setIsReady(false)
      }
    } catch (error) {
      console.error('Failed to initialize matrix renderer:', error)
    }
  }, [])

  // Extend controls type locally so TS knows pan/zoom may exist
  type Controls = {
    zoomToFit: () => void
    resetView: () => void
    clearSelection: () => void
    pan?: (dx: number, dy: number) => void
    zoom?: (z: number) => void
  }

  // Set up interactions with stable callbacks
  const { viewport, interactions, handlers, controls: rawControls } = useMatrixInteractions({
    matrix,
    renderer: rendererRef.current,
    onSelectionChange: stableOnSelectionChange,
    onNodeHover: stableOnNodeHover
  })
  
  const controls: Controls = rawControls as Controls

  // Auto-fit to matrix when it changes
  useEffect(() => {
    if (matrix && isReady) {
      // Small delay to ensure renderer is fully ready
      const timer = setTimeout(() => {
        controls.zoomToFit()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [matrix, isReady, controls])

  // Optimized render loop with change detection
  useEffect(() => {
    if (!matrix || !rendererRef.current || !isReady) return

    // Render with performance monitoring
    rendererRef.current.render(matrix, viewport, renderOptions, interactions)
  }, [matrix, viewport, renderOptions, interactions, isReady])

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeObserver = new ResizeObserver(() => {
      if (rendererRef.current) {
        // Trigger re-render on resize
        setTimeout(() => {
          if (matrix && rendererRef.current) {
            rendererRef.current.render(matrix, viewport, renderOptions, interactions)
          }
        }, 0)
      }
    })

    resizeObserver.observe(canvas)
    return () => resizeObserver.disconnect()
  }, [matrix, viewport, renderOptions, interactions])

  // Accessibility: Keyboard navigation
  const keyboardHandler = useMemo(() => createKeyboardHandler({
    [KeyboardKeys.ARROW_UP]: () => controls.pan?.(0, -50),
    [KeyboardKeys.ARROW_DOWN]: () => controls.pan?.(0, 50),
    [KeyboardKeys.ARROW_LEFT]: () => controls.pan?.(-50, 0),
    [KeyboardKeys.ARROW_RIGHT]: () => controls.pan?.(50, 0),
    [KeyboardKeys.PAGE_UP]: () => controls.zoom?.(viewport.zoom * 1.2),
    [KeyboardKeys.PAGE_DOWN]: () => controls.zoom?.(viewport.zoom * 0.8),
    [KeyboardKeys.HOME]: () => controls.zoomToFit(),
    [KeyboardKeys.SPACE]: () => controls.resetView()
  }), [controls, viewport.zoom])

  // Adapt native KeyboardEvent-returning handler to React's event type
  const onCanvasKeyDown: React.KeyboardEventHandler<HTMLCanvasElement> = (e) => {
    keyboardHandler(e.nativeEvent)
  }

  // Accessibility: Announce matrix changes
  useEffect(() => {
    if (matrix) {
      const message = `Matrix loaded: ${matrix.nodes.length} nodes, ${matrix.edges?.length || 0} edges`
      ScreenReader.announce(message)
    }
  }, [matrix])

  // Accessibility: Announce selection changes
  useEffect(() => {
    if (interactions.selectedCells.size > 0) {
      ScreenReader.announce(`${interactions.selectedCells.size} nodes selected`)
    }
  }, [interactions.selectedCells.size])

  const matrixDescription = useMemo(() => {
    if (!matrix) return 'No matrix data available'
    return `Interactive molecular matrix with ${matrix.nodes.length} nodes and ${matrix.edges?.length || 0} bonds. Use arrow keys to pan, Page Up/Down to zoom, Home to fit, Space to reset view.`
  }, [matrix])

  return (
    <div className={`relative w-full h-full ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        style={{ touchAction: 'none' }}
        role={AriaRoles.APPLICATION}
        aria-label="Molecular structure visualization"
        aria-description={matrixDescription}
        tabIndex={0}
        onKeyDown={onCanvasKeyDown}
        {...handlers}
      />
      
      {!matrix && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg"
          role={AriaRoles.REGION}
          aria-label="Empty matrix visualization area"
        >
          <div className="text-center text-gray-500">
            <svg 
              className="w-12 h-12 mx-auto mb-4 text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-sm">No matrix data to visualize</p>
            <p className="text-xs text-gray-400 mt-1">Matrix will appear here when available</p>
          </div>
        </div>
      )}
      
      {/* Performance info overlay (development only) */}
      {process.env.NODE_ENV === 'development' && matrix && (
        <div 
          className="absolute top-2 left-2 bg-black/75 text-white text-xs p-2 rounded font-mono"
          role={AriaRoles.REGION}
          aria-label="Matrix visualization debug information"
        >
          <div>Zoom: {viewport.zoom.toFixed(2)}x</div>
          <div>Center: ({viewport.center.x.toFixed(1)}, {viewport.center.y.toFixed(1)})</div>
          <div>Nodes: {matrix.nodes.length}</div>
          <div>Selected: {interactions.selectedCells.size}</div>
        </div>
      )}
      
      {/* Screen reader announcements for matrix interactions */}
      <div 
        className="sr-only" 
        aria-live="polite" 
        aria-atomic="true"
      >
        {interactions.hoveredCell && `Hovering over node ${interactions.hoveredCell}`}
      </div>
      {/* Keyboard navigation help (initially hidden, shown on focus) */}
      <div className="absolute bottom-2 left-2 bg-blue-900/90 text-white text-xs p-3 rounded-lg opacity-0 focus-within:opacity-100 transition-opacity">
        <div className="font-semibold mb-1">Keyboard Navigation:</div>
        <div>Arrow keys: Pan • Page Up/Down: Zoom</div>
        <div>Home: Fit to view • Space: Reset view</div>
      </div>
    </div>
  )
})