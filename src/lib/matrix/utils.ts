import type { Point2D, Point3D, ViewportState, BoundingBox, ChiralityMatrix } from './types'

export const matrixUtils = {
  // Coordinate transformations
  worldToScreen(point: Point3D, viewport: ViewportState, canvasSize: { width: number; height: number }): Point2D {
    const { center, zoom, rotation } = viewport
    
    // Apply rotation
    const cos = Math.cos(rotation)
    const sin = Math.sin(rotation)
    const rotatedX = point.x * cos - point.y * sin
    const rotatedY = point.x * sin + point.y * cos
    
    // Apply zoom and translation
    const screenX = (rotatedX - center.x) * zoom + canvasSize.width / 2
    const screenY = (rotatedY - center.y) * zoom + canvasSize.height / 2
    
    return { x: screenX, y: screenY }
  },

  screenToWorld(point: Point2D, viewport: ViewportState, canvasSize: { width: number; height: number }): Point3D {
    const { center, zoom, rotation } = viewport
    
    // Reverse translation and zoom
    const localX = (point.x - canvasSize.width / 2) / zoom + center.x
    const localY = (point.y - canvasSize.height / 2) / zoom + center.y
    
    // Reverse rotation
    const cos = Math.cos(-rotation)
    const sin = Math.sin(-rotation)
    const worldX = localX * cos - localY * sin
    const worldY = localX * sin + localY * cos
    
    return { x: worldX, y: worldY, z: 0 }
  },

  // Viewport calculations
  getVisibleBounds(viewport: ViewportState, canvasSize: { width: number; height: number }): BoundingBox {
    const corners = [
      { x: 0, y: 0 },
      { x: canvasSize.width, y: 0 },
      { x: canvasSize.width, y: canvasSize.height },
      { x: 0, y: canvasSize.height }
    ]
    
    const worldCorners = corners.map(corner => 
      this.screenToWorld(corner, viewport, canvasSize)
    )
    
    const xs = worldCorners.map(p => p.x)
    const ys = worldCorners.map(p => p.y)
    
    return {
      min: { x: Math.min(...xs), y: Math.min(...ys) },
      max: { x: Math.max(...xs), y: Math.max(...ys) }
    }
  },

  // Distance calculations
  distance2D(a: Point2D, b: Point2D): number {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
  },

  distance3D(a: Point3D, b: Point3D): number {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2)
  },

  // Matrix operations
  calculateCenter(matrix: ChiralityMatrix): Point3D {
    if (matrix.nodes.length === 0) return { x: 0, y: 0, z: 0 }
    
    const sum = matrix.nodes.reduce(
      (acc, node) => ({
        x: acc.x + node.position.x,
        y: acc.y + node.position.y,
        z: acc.z + node.position.z
      }),
      { x: 0, y: 0, z: 0 }
    )
    
    return {
      x: sum.x / matrix.nodes.length,
      y: sum.y / matrix.nodes.length,
      z: sum.z / matrix.nodes.length
    }
  },

  calculateBounds(matrix: ChiralityMatrix): { min: Point3D; max: Point3D } {
    if (matrix.nodes.length === 0) {
      return {
        min: { x: 0, y: 0, z: 0 },
        max: { x: 0, y: 0, z: 0 }
      }
    }
    
    const first = matrix.nodes[0].position
    const bounds = matrix.nodes.reduce(
      (acc, node) => ({
        min: {
          x: Math.min(acc.min.x, node.position.x),
          y: Math.min(acc.min.y, node.position.y),
          z: Math.min(acc.min.z, node.position.z)
        },
        max: {
          x: Math.max(acc.max.x, node.position.x),
          y: Math.max(acc.max.y, node.position.y),
          z: Math.max(acc.max.z, node.position.z)
        }
      }),
      {
        min: { ...first },
        max: { ...first }
      }
    )
    
    return bounds
  },

  // Color utilities
  getChiralityColor(chirality: 'R' | 'S' | 'none'): string {
    switch (chirality) {
      case 'R': return '#ef4444' // red
      case 'S': return '#3b82f6' // blue
      case 'none': return '#6b7280' // gray
      default: return '#6b7280'
    }
  },

  getElementColor(element: string): string {
    const colors: Record<string, string> = {
      C: '#404040',  // carbon - dark gray
      O: '#dc2626',  // oxygen - red
      N: '#2563eb',  // nitrogen - blue
      S: '#eab308',  // sulfur - yellow
      P: '#ea580c',  // phosphorus - orange
      H: '#f8fafc',  // hydrogen - white
      F: '#10b981',  // fluorine - green
      Cl: '#10b981', // chlorine - green
      Br: '#a855f7', // bromine - purple
      I: '#7c3aed',  // iodine - violet
    }
    return colors[element] || '#6b7280'
  }
}