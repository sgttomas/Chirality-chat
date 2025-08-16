/**
 * Export functionality for chat conversations and matrix visualizations
 */

import type { StreamMessage } from '@/hooks/useStream'
import type { ChiralityMatrix } from './matrix/types'
import { analytics } from './analytics'

export interface ExportOptions {
  format: 'json' | 'txt' | 'md' | 'csv' | 'pdf'
  includeMetadata?: boolean
  includeTimestamps?: boolean
  dateRange?: {
    start: Date
    end: Date
  }
}

export interface MatrixExportOptions {
  format: 'json' | 'csv' | 'png' | 'svg'
  includeMetadata?: boolean
  imageOptions?: {
    width: number
    height: number
    backgroundColor?: string
    quality?: number
  }
}

// Chat export functions
export class ChatExporter {
  static async exportMessages(
    messages: StreamMessage[], 
    options: ExportOptions = { format: 'json' }
  ): Promise<{ content: string; filename: string; mimeType: string }> {
    const filteredMessages = this.filterMessagesByDate(messages, options.dateRange)
    const timestamp = new Date().toISOString().split('T')[0]
    
    analytics.trackExport('chat', options.format)

    switch (options.format) {
      case 'json':
        return this.exportAsJSON(filteredMessages, options, timestamp)
      case 'txt':
        return this.exportAsText(filteredMessages, options, timestamp)
      case 'md':
        return this.exportAsMarkdown(filteredMessages, options, timestamp)
      case 'csv':
        return this.exportAsCSV(filteredMessages, options, timestamp)
      case 'pdf':
        return await this.exportAsPDF(filteredMessages, options, timestamp)
      default:
        throw new Error(`Unsupported export format: ${options.format}`)
    }
  }

  private static filterMessagesByDate(
    messages: StreamMessage[], 
    dateRange?: { start: Date; end: Date }
  ): StreamMessage[] {
    if (!dateRange) return messages
    
    return messages.filter(message => 
      message.timestamp >= dateRange.start && message.timestamp <= dateRange.end
    )
  }

  private static exportAsJSON(
    messages: StreamMessage[], 
    options: ExportOptions, 
    timestamp: string
  ) {
    const exportData = {
      exportedAt: new Date().toISOString(),
      messageCount: messages.length,
      format: 'chirality-chat-export-v1',
      ...(options.includeMetadata && {
        metadata: {
          totalMessages: messages.length,
          dateRange: {
            earliest: messages[0]?.timestamp?.toISOString(),
            latest: messages[messages.length - 1]?.timestamp?.toISOString()
          },
          participants: [...new Set(messages.map(m => m.role))]
        }
      }),
      messages: messages.map(message => ({
        id: message.id,
        role: message.role,
        content: message.content,
        status: message.status,
        ...(options.includeTimestamps && { timestamp: message.timestamp.toISOString() })
      }))
    }

    return {
      content: JSON.stringify(exportData, null, 2),
      filename: `chirality-chat-${timestamp}.json`,
      mimeType: 'application/json'
    }
  }

  private static exportAsText(
    messages: StreamMessage[], 
    options: ExportOptions, 
    timestamp: string
  ) {
    let content = `Chirality Chat Conversation\\n`
    content += `Exported: ${new Date().toLocaleString()}\\n`
    content += `Messages: ${messages.length}\\n\\n`
    content += `${'='.repeat(50)}\\n\\n`

    for (const message of messages) {
      const timeStr = options.includeTimestamps 
        ? ` (${message.timestamp.toLocaleString()})` 
        : ''
      
      content += `${message.role.toUpperCase()}${timeStr}:\\n`
      content += `${message.content}\\n\\n`
      content += `${'-'.repeat(30)}\\n\\n`
    }

    return {
      content,
      filename: `chirality-chat-${timestamp}.txt`,
      mimeType: 'text/plain'
    }
  }

  private static exportAsMarkdown(
    messages: StreamMessage[], 
    options: ExportOptions, 
    timestamp: string
  ) {
    let content = `# Chirality Chat Conversation\\n\\n`
    content += `**Exported:** ${new Date().toLocaleString()}  \\n`
    content += `**Messages:** ${messages.length}\\n\\n`
    content += `---\\n\\n`

    for (const message of messages) {
      const timeStr = options.includeTimestamps 
        ? ` <small>(${message.timestamp.toLocaleString()})</small>` 
        : ''
      
      const roleIcon = message.role === 'user' ? '👤' : '🤖'
      content += `## ${roleIcon} ${message.role.charAt(0).toUpperCase() + message.role.slice(1)}${timeStr}\\n\\n`
      content += `${message.content}\\n\\n`
      content += `---\\n\\n`
    }

    return {
      content,
      filename: `chirality-chat-${timestamp}.md`,
      mimeType: 'text/markdown'
    }
  }

  private static exportAsCSV(
    messages: StreamMessage[], 
    options: ExportOptions, 
    timestamp: string
  ) {
    const headers = ['ID', 'Role', 'Content', 'Status']
    if (options.includeTimestamps) headers.push('Timestamp')

    let content = headers.join(',') + '\\n'

    for (const message of messages) {
      const row = [
        `"${message.id}"`,
        `"${message.role}"`,
        `"${message.content.replace(/"/g, '""')}"`,
        `"${message.status}"`
      ]
      
      if (options.includeTimestamps) {
        row.push(`"${message.timestamp.toISOString()}"`)
      }
      
      content += row.join(',') + '\\n'
    }

    return {
      content,
      filename: `chirality-chat-${timestamp}.csv`,
      mimeType: 'text/csv'
    }
  }

  private static async exportAsPDF(
    messages: StreamMessage[], 
    options: ExportOptions, 
    timestamp: string
  ) {
    // PDF export would require a library like jsPDF or Puppeteer
    // For now, we'll create a printable HTML version
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Chirality Chat Conversation</title>
        <style>
          body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          .header { border-bottom: 2px solid #ccc; padding-bottom: 20px; margin-bottom: 20px; }
          .message { margin-bottom: 20px; padding: 15px; border-radius: 8px; }
          .user { background: #e3f2fd; }
          .assistant { background: #f5f5f5; }
          .role { font-weight: bold; margin-bottom: 5px; }
          .timestamp { font-size: 0.8em; color: #666; }
          .content { white-space: pre-wrap; }
          @media print { 
            body { margin: 0; padding: 15px; }
            .message { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Chirality Chat Conversation</h1>
          <p><strong>Exported:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Messages:</strong> ${messages.length}</p>
        </div>
    `

    for (const message of messages) {
      const timeStr = options.includeTimestamps 
        ? `<div class="timestamp">${message.timestamp.toLocaleString()}</div>` 
        : ''
      
      html += `
        <div class="message ${message.role}">
          <div class="role">${message.role.charAt(0).toUpperCase() + message.role.slice(1)}</div>
          ${timeStr}
          <div class="content">${message.content.replace(/\\n/g, '<br>')}</div>
        </div>
      `
    }

    html += `
      </body>
      </html>
    `

    return {
      content: html,
      filename: `chirality-chat-${timestamp}.html`,
      mimeType: 'text/html'
    }
  }
}

// Matrix export functions
export class MatrixExporter {
  static async exportMatrix(
    matrix: ChiralityMatrix,
    canvas?: HTMLCanvasElement,
    options: MatrixExportOptions = { format: 'json' }
  ): Promise<{ content: string | Blob; filename: string; mimeType: string }> {
    const timestamp = new Date().toISOString().split('T')[0]
    
    analytics.trackExport('matrix', options.format)

    switch (options.format) {
      case 'json':
        return this.exportMatrixAsJSON(matrix, options, timestamp)
      case 'csv':
        return this.exportMatrixAsCSV(matrix, options, timestamp)
      case 'png':
        return await this.exportMatrixAsPNG(canvas, options, timestamp)
      case 'svg':
        return this.exportMatrixAsSVG(matrix, options, timestamp)
      default:
        throw new Error(`Unsupported matrix export format: ${options.format}`)
    }
  }

  private static exportMatrixAsJSON(
    matrix: ChiralityMatrix, 
    options: MatrixExportOptions, 
    timestamp: string
  ) {
    const exportData = {
      exportedAt: new Date().toISOString(),
      format: 'chirality-matrix-export-v1',
      ...(options.includeMetadata && {
        metadata: {
          nodeCount: matrix.nodes.length,
          edgeCount: matrix.edges?.length || 0,
          matrixType: (matrix.metadata && 'type' in matrix.metadata) ? (matrix.metadata as any).type : undefined,
          molecularFormula: matrix.metadata?.molecularFormula
        }
      }),
      matrix
    }

    return {
      content: JSON.stringify(exportData, null, 2),
      filename: `matrix-${matrix.id}-${timestamp}.json`,
      mimeType: 'application/json'
    }
  }

  private static exportMatrixAsCSV(
    matrix: ChiralityMatrix, 
    options: MatrixExportOptions, 
    timestamp: string
  ) {
    // Export nodes as CSV
    let content = 'Node ID,Label,Type,Element,X,Y,Z,Chirality\\n'
    
    for (const node of matrix.nodes) {
      content += [
        node.id,
        node.label || '',
        node.type || '',
        node.properties?.element || '',
        node.position.x,
        node.position.y,
        node.position.z || 0,
        node.properties?.chirality || ''
      ].map(v => `"${v}"`).join(',') + '\\n'
    }

    // Add edges if present
    if (matrix.edges && matrix.edges.length > 0) {
      content += '\\n\\nEdge From,Edge To,Type,Bond Order\\n'
      for (const edge of matrix.edges) {
        content += [
          edge.from,
          edge.to,
          edge.type || '',
          edge.properties?.bondOrder || ''
        ].map(v => `"${v}"`).join(',') + '\\n'
      }
    }

    return {
      content,
      filename: `matrix-${matrix.id}-${timestamp}.csv`,
      mimeType: 'text/csv'
    }
  }

  private static async exportMatrixAsPNG(
    canvas: HTMLCanvasElement | undefined,
    options: MatrixExportOptions,
    timestamp: string
  ): Promise<{ content: Blob; filename: string; mimeType: string }> {
    if (!canvas) {
      throw new Error('Canvas is required for PNG export')
    }

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve({
            content: blob,
            filename: `matrix-${timestamp}.png`,
            mimeType: 'image/png'
          })
        } else {
          reject(new Error('Failed to create PNG blob'))
        }
      }, 'image/png', options.imageOptions?.quality || 0.9)
    })
  }

  private static exportMatrixAsSVG(
    matrix: ChiralityMatrix,
    options: MatrixExportOptions,
    timestamp: string
  ) {
    // Create SVG representation of the matrix
    const bounds = this.calculateMatrixBounds(matrix)
    const padding = 50
    const width = bounds.width + (padding * 2)
    const height = bounds.height + (padding * 2)

    let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .node { fill: #6b7280; stroke: #374151; stroke-width: 1; }
      .edge { stroke: #374151; stroke-width: 1; }
      .label { font-family: system-ui, sans-serif; font-size: 12px; text-anchor: middle; }
    </style>
  </defs>
`

    // Add edges
    if (matrix.edges) {
      for (const edge of matrix.edges) {
        const fromNode = matrix.nodes.find(n => n.id === edge.from)
        const toNode = matrix.nodes.find(n => n.id === edge.to)
        if (fromNode && toNode) {
          const x1 = fromNode.position.x - bounds.minX + padding
          const y1 = fromNode.position.y - bounds.minY + padding
          const x2 = toNode.position.x - bounds.minX + padding
          const y2 = toNode.position.y - bounds.minY + padding
          
          svg += `  <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="edge"/>\\n`
        }
      }
    }

    // Add nodes
    for (const node of matrix.nodes) {
      const x = node.position.x - bounds.minX + padding
      const y = node.position.y - bounds.minY + padding
      const radius = 8
      
      svg += `  <circle cx="${x}" cy="${y}" r="${radius}" class="node"/>\\n`
      if (node.label) {
        svg += `  <text x="${x}" y="${y + radius + 15}" class="label">${node.label}</text>\\n`
      }
    }

    svg += '</svg>'

    return {
      content: svg,
      filename: `matrix-${matrix.id}-${timestamp}.svg`,
      mimeType: 'image/svg+xml'
    }
  }

  private static calculateMatrixBounds(matrix: ChiralityMatrix) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity

    for (const node of matrix.nodes) {
      minX = Math.min(minX, node.position.x)
      minY = Math.min(minY, node.position.y)
      maxX = Math.max(maxX, node.position.x)
      maxY = Math.max(maxY, node.position.y)
    }

    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY
    }
  }
}

// Utility function to trigger download
export function downloadFile(
  content: string | Blob, 
  filename: string, 
  mimeType: string
): void {
  const blob = typeof content === 'string' 
    ? new Blob([content], { type: mimeType })
    : content

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Convenience export functions
export const exportUtils = {
  async exportChat(
    messages: StreamMessage[],
    format: ExportOptions['format'] = 'json',
    options: Partial<ExportOptions> = {}
  ) {
    const result = await ChatExporter.exportMessages(messages, { format, ...options })
    downloadFile(result.content, result.filename, result.mimeType)
  },

  async exportMatrix(
    matrix: ChiralityMatrix,
    canvas?: HTMLCanvasElement,
    format: MatrixExportOptions['format'] = 'json',
    options: Partial<MatrixExportOptions> = {}
  ) {
    const result = await MatrixExporter.exportMatrix(matrix, canvas, { format, ...options })
    downloadFile(result.content, result.filename, result.mimeType)
  }
}