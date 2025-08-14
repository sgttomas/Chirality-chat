import { useCallback, useRef, useState } from 'react'
import type { 
  ViewportState, 
  InteractionState, 
  Point2D, 
  ChiralityMatrix,
  CanvasRenderer
} from '@/lib/matrix/types'
import { matrixUtils } from '@/lib/matrix/utils'

interface UseMatrixInteractionsOptions {
  matrix: ChiralityMatrix | null
  renderer: CanvasRenderer | null
  onSelectionChange?: (selectedIds: string[]) => void
  onNodeHover?: (nodeId: string | null) => void
}

export function useMatrixInteractions({
  matrix,
  renderer,
  onSelectionChange,
  onNodeHover
}: UseMatrixInteractionsOptions) {
  const [viewport, setViewport] = useState<ViewportState>({
    center: { x: 0, y: 0 },
    zoom: 1,
    rotation: 0
  })

  const [interactions, setInteractions] = useState<InteractionState>({
    hoveredCell: null,
    selectedCells: new Set<string>(),
    dragStart: null,
    isInteracting: false
  })

  const lastPanPoint = useRef<Point2D | null>(null)
  const lastDistance = useRef<number | null>(null)

  // Mouse handlers
  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = event.currentTarget
    const rect = canvas.getBoundingClientRect()
    const point = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    }

    if (event.button === 0) { // Left click
      if (event.shiftKey) {
        // Multi-select mode
        const nodeId = getNodeAtPoint(point)
        if (nodeId) {
          setInteractions(prev => {
            const newSelected = new Set(prev.selectedCells)
            if (newSelected.has(nodeId)) {
              newSelected.delete(nodeId)
            } else {
              newSelected.add(nodeId)
            }
            onSelectionChange?.(Array.from(newSelected))
            return { ...prev, selectedCells: newSelected }
          })
        }
      } else if (event.ctrlKey || event.metaKey) {
        // Pan mode
        lastPanPoint.current = point
        setInteractions(prev => ({ ...prev, isInteracting: true }))
      } else {
        // Single select
        const nodeId = getNodeAtPoint(point)
        setInteractions(prev => {
          const newSelected = nodeId ? new Set([nodeId]) : new Set<string>()
          onSelectionChange?.(Array.from(newSelected))
          return { ...prev, selectedCells: newSelected, dragStart: point }
        })
      }
    }
  }, [matrix, renderer, onSelectionChange])

  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = event.currentTarget
    const rect = canvas.getBoundingClientRect()
    const point = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    }

    // Handle hover
    const nodeId = getNodeAtPoint(point)
    if (nodeId !== interactions.hoveredCell) {
      setInteractions(prev => ({ ...prev, hoveredCell: nodeId }))
      onNodeHover?.(nodeId)
    }

    // Handle panning
    if (lastPanPoint.current && interactions.isInteracting) {
      const dx = point.x - lastPanPoint.current.x
      const dy = point.y - lastPanPoint.current.y
      
      setViewport(prev => ({
        ...prev,
        center: {
          x: prev.center.x - dx / prev.zoom,
          y: prev.center.y - dy / prev.zoom
        }
      }))
      
      lastPanPoint.current = point
    }
  }, [interactions, renderer])

  const handleMouseUp = useCallback(() => {
    lastPanPoint.current = null
    setInteractions(prev => ({ 
      ...prev, 
      isInteracting: false,
      dragStart: null
    }))
  }, [])

  // Wheel handler for zooming
  const handleWheel = useCallback((event: React.WheelEvent<HTMLCanvasElement>) => {
    event.preventDefault()
    
    const canvas = event.currentTarget
    const rect = canvas.getBoundingClientRect()
    const point = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    }

    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1
    
    setViewport(prev => {
      const newZoom = Math.max(0.1, Math.min(5, prev.zoom * zoomFactor))
      
      if (!renderer) return prev
      
      // Zoom towards mouse cursor
      const worldPoint = renderer.screenToWorld(point, prev)
      const newWorldPoint = renderer.screenToWorld(point, { ...prev, zoom: newZoom })
      
      return {
        ...prev,
        zoom: newZoom,
        center: {
          x: prev.center.x + (worldPoint.x - newWorldPoint.x),
          y: prev.center.y + (worldPoint.y - newWorldPoint.y)
        }
      }
    })
  }, [renderer])

  // Touch handlers for mobile support
  const handleTouchStart = useCallback((event: React.TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault()
    
    if (event.touches.length === 1) {
      // Single touch - pan
      const touch = event.touches[0]
      const canvas = event.currentTarget
      const rect = canvas.getBoundingClientRect()
      lastPanPoint.current = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      }
      setInteractions(prev => ({ ...prev, isInteracting: true }))
    } else if (event.touches.length === 2) {
      // Two touches - zoom
      const touch1 = event.touches[0]
      const touch2 = event.touches[1]
      const distance = Math.sqrt(
        (touch1.clientX - touch2.clientX) ** 2 + (touch1.clientY - touch2.clientY) ** 2
      )
      lastDistance.current = distance
    }
  }, [])

  const handleTouchMove = useCallback((event: React.TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault()
    
    if (event.touches.length === 1 && lastPanPoint.current) {
      // Pan
      const touch = event.touches[0]
      const canvas = event.currentTarget
      const rect = canvas.getBoundingClientRect()
      const point = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      }
      
      const dx = point.x - lastPanPoint.current.x
      const dy = point.y - lastPanPoint.current.y
      
      setViewport(prev => ({
        ...prev,
        center: {
          x: prev.center.x - dx / prev.zoom,
          y: prev.center.y - dy / prev.zoom
        }
      }))
      
      lastPanPoint.current = point
    } else if (event.touches.length === 2 && lastDistance.current) {
      // Zoom
      const touch1 = event.touches[0]
      const touch2 = event.touches[1]
      const distance = Math.sqrt(
        (touch1.clientX - touch2.clientX) ** 2 + (touch1.clientY - touch2.clientY) ** 2
      )
      
      const zoomFactor = distance / lastDistance.current
      
      setViewport(prev => ({
        ...prev,
        zoom: Math.max(0.1, Math.min(5, prev.zoom * zoomFactor))
      }))
      
      lastDistance.current = distance
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    lastPanPoint.current = null
    lastDistance.current = null
    setInteractions(prev => ({ ...prev, isInteracting: false }))
  }, [])

  // Utility function to find node at screen point
  const getNodeAtPoint = useCallback((screenPoint: Point2D): string | null => {
    if (!matrix || !renderer) return null
    
    const worldPoint = renderer.screenToWorld(screenPoint, viewport)
    const threshold = 20 / viewport.zoom // Hit test threshold
    
    for (const node of matrix.nodes) {
      const distance = matrixUtils.distance3D(worldPoint, node.position)
      if (distance <= threshold) {
        return node.id
      }
    }
    
    return null
  }, [matrix, renderer, viewport])

  // Public API
  const zoomToFit = useCallback(() => {
    if (!matrix || matrix.nodes.length === 0) return
    
    const bounds = matrixUtils.calculateBounds(matrix)
    const center = matrixUtils.calculateCenter(matrix)
    
    const width = bounds.max.x - bounds.min.x
    const height = bounds.max.y - bounds.min.y
    const maxDimension = Math.max(width, height)
    
    const zoom = maxDimension > 0 ? Math.min(1, 400 / maxDimension) : 1
    
    setViewport({
      center: { x: center.x, y: center.y },
      zoom,
      rotation: 0
    })
  }, [matrix])

  const resetView = useCallback(() => {
    setViewport({
      center: { x: 0, y: 0 },
      zoom: 1,
      rotation: 0
    })
  }, [])

  const clearSelection = useCallback(() => {
    setInteractions(prev => ({ ...prev, selectedCells: new Set() }))
    onSelectionChange?.([])
  }, [onSelectionChange])

  return {
    viewport,
    interactions,
    handlers: {
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onWheel: handleWheel,
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd
    },
    controls: {
      zoomToFit,
      resetView,
      clearSelection
    }
  }
}