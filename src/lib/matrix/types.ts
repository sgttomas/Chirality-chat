export interface Point2D {
  x: number
  y: number
}

export interface Point3D {
  x: number
  y: number
  z: number
}

export interface BoundingBox {
  min: Point2D
  max: Point2D
}

export interface ViewportState {
  center: Point2D
  zoom: number
  rotation: number
}

export interface MatrixCell {
  id: string
  position: Point2D
  value: number
  color?: string
  metadata?: Record<string, unknown>
}

export interface MatrixNode {
  id: string
  position: Point3D
  label: string
  type: 'atom' | 'bond' | 'group' | 'center'
  properties: {
    element?: string
    charge?: number
    bondOrder?: number
    chirality?: 'R' | 'S' | 'none'
    [key: string]: unknown
  }
  connections: string[] // IDs of connected nodes
}

export interface MatrixEdge {
  id: string
  from: string
  to: string
  type: 'bond' | 'interaction' | 'spatial'
  strength: number
  properties?: Record<string, unknown>
}

export interface ChiralityMatrix {
  id: string
  title: string
  nodes: MatrixNode[]
  edges: MatrixEdge[]
  metadata: {
    molecularFormula?: string
    stereoCenters?: number
    confidence?: number
    timestamp: string
    source?: string
  }
}

export interface RenderOptions {
  cellSize: number
  showGrid: boolean
  showLabels: boolean
  highlightStereocenters: boolean
  colorScheme: 'default' | 'chirality' | 'heatmap' | 'custom'
  opacity: number
}

export interface InteractionState {
  hoveredCell: string | null
  selectedCells: Set<string>
  dragStart: Point2D | null
  isInteracting: boolean
}

export interface CanvasRenderer {
  render(
    matrix: ChiralityMatrix,
    viewport: ViewportState,
    options: RenderOptions,
    interactions: InteractionState
  ): void
  
  getVisibleCells(viewport: ViewportState, bounds: BoundingBox): string[]
  worldToScreen(point: Point3D, viewport: ViewportState): Point2D
  screenToWorld(point: Point2D, viewport: ViewportState): Point3D
}