import type {
  ChiralityMatrix,
  ViewportState,
  RenderOptions,
  InteractionState,
  CanvasRenderer,
  Point2D,
  Point3D,
  BoundingBox
} from './types'
import { matrixUtils } from './utils'

export class CanvasMatrixRenderer implements CanvasRenderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private animationFrameId: number | null = null
  private lastRenderTime = 0
  private frameCount = 0
  public fps = 0
  public lastVisibleCount = 0
  
  // Performance caching
  private nodeCache = new Map<string, Path2D>()
  private labelCache = new Map<string, { text: string, width: number }>()
  private colorCache = new Map<string, string>()

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Failed to get 2D rendering context')
    }
    this.ctx = ctx
    this.setupCanvas()
  }

  private setupCanvas() {
    const dpr = window.devicePixelRatio || 1
    const rect = this.canvas.getBoundingClientRect()
    
    this.canvas.width = rect.width * dpr
    this.canvas.height = rect.height * dpr
    
    this.ctx.scale(dpr, dpr)
    this.canvas.style.width = `${rect.width}px`
    this.canvas.style.height = `${rect.height}px`
  }

  render(
    matrix: ChiralityMatrix,
    viewport: ViewportState,
    options: RenderOptions,
    interactions: InteractionState
  ): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
    }

    this.animationFrameId = requestAnimationFrame(() => {
      const startTime = performance.now()
      this.performRender(matrix, viewport, options, interactions)
      this.updateFPS(performance.now() - startTime)
    })
  }

  private performRender(
    matrix: ChiralityMatrix,
    viewport: ViewportState,
    options: RenderOptions,
    interactions: InteractionState
  ) {
    const { width, height } = this.canvas.getBoundingClientRect()
    
    // Clear canvas
    this.ctx.clearRect(0, 0, width, height)
    
    // Set global alpha
    this.ctx.globalAlpha = options.opacity
    
    // Get visible nodes using virtualization
    const visibleNodes = this.getVisibleNodes(matrix, viewport, { width, height })
    
    // Render background grid if enabled
    if (options.showGrid) {
      this.renderGrid(viewport, { width, height })
    }
    
    // Render edges first (behind nodes)
    this.renderEdges(matrix, viewport, { width, height }, visibleNodes, options)
    
    // Render nodes
    this.renderNodes(matrix, viewport, { width, height }, visibleNodes, options, interactions)
    
    // Render labels if enabled
    if (options.showLabels) {
      this.renderLabels(matrix, viewport, { width, height }, visibleNodes, options)
    }
    
    // Render selection overlay
    this.renderSelectionOverlay(matrix, viewport, { width, height }, interactions)
  }

  private getVisibleNodes(
    matrix: ChiralityMatrix, 
    viewport: ViewportState, 
    canvasSize: { width: number; height: number }
  ): string[] {
    const bounds = matrixUtils.getVisibleBounds(viewport, canvasSize)
    const margin = 50 / viewport.zoom // Add margin for smooth scrolling
    
    const visibleNodes = matrix.nodes
      .filter(node => {
        const pos = node.position
        return (
          pos.x >= bounds.min.x - margin &&
          pos.x <= bounds.max.x + margin &&
          pos.y >= bounds.min.y - margin &&
          pos.y <= bounds.max.y + margin
        )
      })
      .map(node => node.id)
    
    this.lastVisibleCount = visibleNodes.length
    return visibleNodes
  }

  private renderGrid(viewport: ViewportState, canvasSize: { width: number; height: number }) {
    this.ctx.strokeStyle = '#f3f4f6'
    this.ctx.lineWidth = 1
    
    const gridSize = 50 * viewport.zoom
    const bounds = matrixUtils.getVisibleBounds(viewport, canvasSize)
    
    // Vertical lines
    const startX = Math.floor(bounds.min.x / 50) * 50
    for (let x = startX; x <= bounds.max.x; x += 50) {
      const screenPos = matrixUtils.worldToScreen({ x, y: bounds.min.y, z: 0 }, viewport, canvasSize)
      const screenEnd = matrixUtils.worldToScreen({ x, y: bounds.max.y, z: 0 }, viewport, canvasSize)
      
      this.ctx.beginPath()
      this.ctx.moveTo(screenPos.x, screenPos.y)
      this.ctx.lineTo(screenEnd.x, screenEnd.y)
      this.ctx.stroke()
    }
    
    // Horizontal lines
    const startY = Math.floor(bounds.min.y / 50) * 50
    for (let y = startY; y <= bounds.max.y; y += 50) {
      const screenPos = matrixUtils.worldToScreen({ x: bounds.min.x, y, z: 0 }, viewport, canvasSize)
      const screenEnd = matrixUtils.worldToScreen({ x: bounds.max.x, y, z: 0 }, viewport, canvasSize)
      
      this.ctx.beginPath()
      this.ctx.moveTo(screenPos.x, screenPos.y)
      this.ctx.lineTo(screenEnd.x, screenEnd.y)
      this.ctx.stroke()
    }
  }

  private renderEdges(
    matrix: ChiralityMatrix,
    viewport: ViewportState,
    canvasSize: { width: number; height: number },
    visibleNodes: string[],
    options: RenderOptions
  ) {
    const visibleNodeSet = new Set(visibleNodes)
    const visibleEdges = matrix.edges.filter(
      edge => visibleNodeSet.has(edge.from) || visibleNodeSet.has(edge.to)
    )

    for (const edge of visibleEdges) {
      const fromNode = matrix.nodes.find(n => n.id === edge.from)
      const toNode = matrix.nodes.find(n => n.id === edge.to)
      
      if (!fromNode || !toNode) continue
      
      const fromScreen = matrixUtils.worldToScreen(fromNode.position, viewport, canvasSize)
      const toScreen = matrixUtils.worldToScreen(toNode.position, viewport, canvasSize)
      
      this.ctx.strokeStyle = this.getEdgeColor(edge, options)
      this.ctx.lineWidth = this.getEdgeWidth(edge, viewport.zoom)
      
      this.ctx.beginPath()
      this.ctx.moveTo(fromScreen.x, fromScreen.y)
      this.ctx.lineTo(toScreen.x, toScreen.y)
      this.ctx.stroke()
    }
  }

  private renderNodes(
    matrix: ChiralityMatrix,
    viewport: ViewportState,
    canvasSize: { width: number; height: number },
    visibleNodes: string[],
    options: RenderOptions,
    interactions: InteractionState
  ) {
    // Batch rendering setup
    this.ctx.save()
    
    for (const nodeId of visibleNodes) {
      const node = matrix.nodes.find(n => n.id === nodeId)
      if (!node) continue
      
      const screenPos = matrixUtils.worldToScreen(node.position, viewport, canvasSize)
      const radius = this.getNodeRadius(node, viewport.zoom)
      
      // Use cached colors for better performance
      const colorKey = `${node.properties?.element || 'C'}-${options.colorScheme}`
      let fillColor = this.colorCache.get(colorKey)
      if (!fillColor) {
        fillColor = this.getNodeColor(node, options)
        this.colorCache.set(colorKey, fillColor)
      }
      
      // Highlight hovered node
      if (interactions.hoveredCell === nodeId) {
        fillColor = this.lightenColor(fillColor, 0.3)
      }
      
      // Create or reuse Path2D for better performance
      const nodeKey = `${nodeId}-${radius}`
      let nodePath = this.nodeCache.get(nodeKey)
      if (!nodePath) {
        nodePath = new Path2D()
        nodePath.arc(screenPos.x, screenPos.y, radius, 0, Math.PI * 2)
        this.nodeCache.set(nodeKey, nodePath)
      }
      
      // Highlight selected nodes
      if (interactions.selectedCells.has(nodeId)) {
        this.ctx.strokeStyle = '#3b82f6'
        this.ctx.lineWidth = 3
        const selectionPath = new Path2D()
        selectionPath.arc(screenPos.x, screenPos.y, radius + 2, 0, Math.PI * 2)
        this.ctx.stroke(selectionPath)
      }
      
      // Draw node with cached path
      this.ctx.fillStyle = fillColor
      this.ctx.fill(nodePath)
      
      // Add outline for better visibility
      this.ctx.strokeStyle = '#374151'
      this.ctx.lineWidth = 1
      this.ctx.stroke(nodePath)
    }
    
    this.ctx.restore()
  }

  private renderLabels(
    matrix: ChiralityMatrix,
    viewport: ViewportState,
    canvasSize: { width: number; height: number },
    visibleNodes: string[],
    options: RenderOptions
  ) {
    this.ctx.fillStyle = '#374151'
    this.ctx.font = `${Math.max(10, 12 * viewport.zoom)}px system-ui, sans-serif`
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    
    for (const nodeId of visibleNodes) {
      const node = matrix.nodes.find(n => n.id === nodeId)
      if (!node) continue
      
      const screenPos = matrixUtils.worldToScreen(node.position, viewport, canvasSize)
      const radius = this.getNodeRadius(node, viewport.zoom)
      
      // Only show labels if zoom is sufficient
      if (viewport.zoom > 0.5) {
        this.ctx.fillText(node.label, screenPos.x, screenPos.y + radius + 15)
      }
    }
  }

  private renderSelectionOverlay(
    matrix: ChiralityMatrix,
    viewport: ViewportState,
    canvasSize: { width: number; height: number },
    interactions: InteractionState
  ) {
    // This could be used for drag selection rectangles or other overlays
    if (interactions.dragStart && interactions.isInteracting) {
      // Implementation for drag selection would go here
    }
  }

  private getNodeColor(node: any, options: RenderOptions): string {
    switch (options.colorScheme) {
      case 'chirality':
        return matrixUtils.getChiralityColor(node.properties.chirality || 'none')
      case 'default':
        return matrixUtils.getElementColor(node.properties.element || 'C')
      case 'heatmap':
        // Could implement based on some numerical property
        return '#3b82f6'
      default:
        return '#6b7280'
    }
  }

  private getEdgeColor(edge: any, options: RenderOptions): string {
    switch (edge.type) {
      case 'bond':
        return '#374151'
      case 'interaction':
        return '#f59e0b'
      case 'spatial':
        return '#10b981'
      default:
        return '#6b7280'
    }
  }

  private getNodeRadius(node: any, zoom: number): number {
    const baseRadius = node.type === 'center' ? 8 : 6
    return Math.max(2, baseRadius * Math.min(zoom, 2))
  }

  private getEdgeWidth(edge: any, zoom: number): number {
    const baseWidth = edge.properties?.bondOrder || 1
    return Math.max(0.5, baseWidth * Math.min(zoom, 2))
  }

  private lightenColor(color: string, factor: number): string {
    // Simple color lightening - could be improved
    if (color.startsWith('#')) {
      const num = parseInt(color.replace('#', ''), 16)
      const amt = Math.round(2.55 * factor * 100)
      const R = (num >> 16) + amt
      const G = (num >> 8 & 0x00FF) + amt
      const B = (num & 0x0000FF) + amt
      return `#${(0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1)}`
    }
    return color
  }

  getVisibleCells(viewport: ViewportState, bounds: BoundingBox): string[] {
    // Implementation would depend on the current matrix
    return []
  }

  worldToScreen(point: Point3D, viewport: ViewportState): Point2D {
    const { width, height } = this.canvas.getBoundingClientRect()
    return matrixUtils.worldToScreen(point, viewport, { width, height })
  }

  screenToWorld(point: Point2D, viewport: ViewportState): Point3D {
    const { width, height } = this.canvas.getBoundingClientRect()
    return matrixUtils.screenToWorld(point, viewport, { width, height })
  }

  private updateFPS(renderTime: number) {
    this.frameCount++
    const now = performance.now()
    
    if (now - this.lastRenderTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastRenderTime))
      this.frameCount = 0
      this.lastRenderTime = now
    }
  }

  private clearCaches() {
    // Clear caches when they get too large
    if (this.nodeCache.size > 1000) {
      this.nodeCache.clear()
    }
    if (this.colorCache.size > 100) {
      this.colorCache.clear()
    }
    if (this.labelCache.size > 500) {
      this.labelCache.clear()
    }
  }

  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
    }
    this.nodeCache.clear()
    this.colorCache.clear()
    this.labelCache.clear()
  }
}