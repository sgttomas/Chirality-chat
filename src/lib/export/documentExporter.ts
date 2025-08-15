// Document export utilities for DS/SP/X/Z/M matrices

import { parseCellValue, type DS, type SP, type X, type Z, type M } from '@/lib/parseCellValue'
import { guard } from '@/lib/prompt/validators'
import { formatDSTableMarkdown, formatBundleMarkdown } from '@/lib/prompt/formatters.table'
import { formatSPMarkdown, formatXMarkdown, formatMMarkdown } from '@/lib/prompt/formatters'

export interface ExportOptions {
  format: 'markdown' | 'json' | 'csv' | 'bundle'
  includeMetadata?: boolean
  includeWarnings?: boolean
  title?: string
  useTableFormat?: boolean  // For DS: use table format instead of default
}

export interface DocumentCell {
  row: number
  col: number
  labels: {
    rowLabel: string
    colLabel: string
  }
  value: string
  meta?: {
    createdAt?: string
    modelId?: string
    version?: number
  }
}

export class DocumentExporter {
  
  static exportDS(cells: DocumentCell[], options: ExportOptions): string {
    if (options.format === 'json') {
      return this.exportDSAsJSON(cells, options)
    }
    if (options.format === 'csv') {
      return this.exportDSAsCSV(cells, options)
    }
    if (options.useTableFormat) {
      return this.exportDSAsTableMarkdown(cells, options)
    }
    return this.exportDSAsMarkdown(cells, options)
  }

  static exportSP(cells: DocumentCell[], options: ExportOptions): string {
    if (options.format === 'json') {
      return this.exportSPAsJSON(cells, options)
    }
    if (options.format === 'csv') {
      return this.exportSPAsCSV(cells, options)
    }
    return this.exportSPAsMarkdown(cells, options)
  }

  static exportX(cells: DocumentCell[], options: ExportOptions): string {
    if (options.format === 'json') {
      return this.exportXAsJSON(cells, options)
    }
    return this.exportXAsMarkdown(cells, options)
  }

  static exportZ(cells: DocumentCell[], options: ExportOptions): string {
    if (options.format === 'json') {
      return this.exportZAsJSON(cells, options)
    }
    if (options.format === 'csv') {
      return this.exportZAsCSV(cells, options)
    }
    return this.exportZAsMarkdown(cells, options)
  }

  static exportM(cells: DocumentCell[], options: ExportOptions): string {
    if (options.format === 'json') {
      return this.exportMAsJSON(cells, options)
    }
    return this.exportMAsMarkdown(cells, options)
  }

  // DS Markdown Export
  private static exportDSAsMarkdown(cells: DocumentCell[], options: ExportOptions): string {
    const title = options.title || 'Data Sheet'
    let markdown = `# ${title}\n\n`
    
    if (options.includeMetadata) {
      markdown += `*Generated on ${new Date().toLocaleString()}*\n\n`
    }

    markdown += '| Data Field | Units | Type | Source Refs | Notes |\n'
    markdown += '|------------|-------|------|-------------|-------|\n'

    cells.forEach(cell => {
      const triple = parseCellValue<DS>(cell.value)
      if (!triple || !guard.DS(triple.text)) {
        markdown += `| ${cell.labels.rowLabel} | - | Invalid | - | Data not available |\n`
        return
      }

      const ds = triple.text
      const refs = ds.source_refs?.join(', ') || '-'
      const notes = ds.notes?.join('; ') || '-'
      
      markdown += `| ${ds.data_field} | ${ds.units || '-'} | ${ds.type || '-'} | ${refs} | ${notes} |\n`
      
      if (options.includeWarnings && triple.warnings.length > 0) {
        markdown += `| | | ⚠️ ${triple.warnings.join(', ')} | | |\n`
      }
    })

    return markdown
  }

  // SP Markdown Export
  private static exportSPAsMarkdown(cells: DocumentCell[], options: ExportOptions): string {
    const title = options.title || 'Standard Procedure'
    let markdown = `# ${title}\n\n`
    
    if (options.includeMetadata) {
      markdown += `*Generated on ${new Date().toLocaleString()}*\n\n`
    }

    cells.forEach((cell, index) => {
      const triple = parseCellValue<SP>(cell.value)
      if (!triple || !guard.SP(triple.text)) {
        markdown += `## Step ${index + 1}: ${cell.labels.rowLabel}\n\n*Data not available*\n\n`
        return
      }

      const sp = triple.text
      
      markdown += `## Step ${index + 1}: ${sp.step}\n\n`
      
      if (sp.purpose) {
        markdown += `**Purpose:** ${sp.purpose}\n\n`
      }

      if (sp.inputs?.length) {
        markdown += `**Inputs:**\n${sp.inputs.map(i => `- ${i}`).join('\n')}\n\n`
      }

      if (sp.outputs?.length) {
        markdown += `**Outputs:**\n${sp.outputs.map(o => `- ${o}`).join('\n')}\n\n`
      }

      if (sp.preconditions?.length) {
        markdown += `**Preconditions:**\n${sp.preconditions.map(p => `- ${p}`).join('\n')}\n\n`
      }

      if (sp.postconditions?.length) {
        markdown += `**Postconditions:**\n${sp.postconditions.map(p => `- ${p}`).join('\n')}\n\n`
      }

      if (sp.refs?.length) {
        markdown += `**References:** ${sp.refs.join(', ')}\n\n`
      }

      if (options.includeWarnings && triple.warnings.length > 0) {
        markdown += `> ⚠️ **Warnings:** ${triple.warnings.join(', ')}\n\n`
      }

      markdown += '---\n\n'
    })

    return markdown
  }

  // X Markdown Export
  private static exportXAsMarkdown(cells: DocumentCell[], options: ExportOptions): string {
    const title = options.title || 'Guidance Document'
    let markdown = `# ${title}\n\n`
    
    if (options.includeMetadata) {
      markdown += `*Generated on ${new Date().toLocaleString()}*\n\n`
    }

    cells.forEach(cell => {
      const triple = parseCellValue<X>(cell.value)
      if (!triple || !guard.X(triple.text)) {
        markdown += `## ${cell.labels.rowLabel}\n\n*Content not available*\n\n`
        return
      }

      const x = triple.text
      
      markdown += `## ${x.heading}\n\n`
      markdown += `${x.narrative}\n\n`

      if (x.precedents?.length) {
        markdown += `**Precedents:** ${x.precedents.join(', ')}\n\n`
      }

      if (x.successors?.length) {
        markdown += `**Successors:** ${x.successors.join(', ')}\n\n`
      }

      if (x.context_notes?.length) {
        markdown += `**Context Notes:**\n${x.context_notes.map(n => `- ${n}`).join('\n')}\n\n`
      }

      if (x.refs?.length) {
        markdown += `**References:** ${x.refs.join(', ')}\n\n`
      }

      if (options.includeWarnings && triple.warnings.length > 0) {
        markdown += `> ⚠️ **Warnings:** ${triple.warnings.join(', ')}\n\n`
      }
    })

    return markdown
  }

  // Z Markdown Export
  private static exportZAsMarkdown(cells: DocumentCell[], options: ExportOptions): string {
    const title = options.title || 'Checklist'
    let markdown = `# ${title}\n\n`
    
    if (options.includeMetadata) {
      markdown += `*Generated on ${new Date().toLocaleString()}*\n\n`
    }

    cells.forEach((cell, index) => {
      const triple = parseCellValue<Z>(cell.value)
      if (!triple || !guard.Z(triple.text)) {
        markdown += `- [ ] **${cell.labels.rowLabel}** - *Data not available*\n\n`
        return
      }

      const z = triple.text
      const severityEmoji = {
        'Low': '🟢',
        'Medium': '🟡', 
        'High': '🟠',
        'Critical': '🔴'
      }[z.severity || 'Low'] || '⚪'

      markdown += `- [ ] **${z.item}** ${severityEmoji}\n\n`
      
      if (z.rationale) {
        markdown += `  *Rationale:* ${z.rationale}\n\n`
      }

      if (z.acceptance_criteria) {
        markdown += `  *Acceptance Criteria:* ${z.acceptance_criteria}\n\n`
      }

      if (z.evidence?.length) {
        markdown += `  *Evidence:* ${z.evidence.join('; ')}\n\n`
      }

      if (options.includeWarnings && triple.warnings.length > 0) {
        markdown += `  > ⚠️ ${triple.warnings.join(', ')}\n\n`
      }
    })

    return markdown
  }

  // M Markdown Export
  private static exportMAsMarkdown(cells: DocumentCell[], options: ExportOptions): string {
    const title = options.title || 'Solution Statements'
    let markdown = `# ${title}\n\n`
    
    if (options.includeMetadata) {
      markdown += `*Generated on ${new Date().toLocaleString()}*\n\n`
    }

    cells.forEach((cell, index) => {
      const triple = parseCellValue<M>(cell.value)
      if (!triple || !guard.M(triple.text)) {
        markdown += `## Solution ${index + 1}\n\n*Content not available*\n\n`
        return
      }

      const m = triple.text
      
      markdown += `## Solution ${index + 1}: ${m.statement}\n\n`
      
      if (m.justification) {
        markdown += `**Justification:** ${m.justification}\n\n`
      }

      if (m.trace_back?.length) {
        markdown += `**Trace Back:**\n${m.trace_back.map(t => `- ${t}`).join('\n')}\n\n`
      }

      if (m.assumptions?.length) {
        markdown += `**Assumptions:**\n${m.assumptions.map(a => `- ${a}`).join('\n')}\n\n`
      }

      if (m.residual_risk?.length) {
        markdown += `**Residual Risk:**\n${m.residual_risk.map(r => `- ${r}`).join('\n')}\n\n`
      }

      if (options.includeWarnings && triple.warnings.length > 0) {
        markdown += `> ⚠️ **Warnings:** ${triple.warnings.join(', ')}\n\n`
      }

      markdown += '---\n\n'
    })

    return markdown
  }

  // JSON Export Methods
  private static exportDSAsJSON(cells: DocumentCell[], options: ExportOptions): string {
    const data = {
      type: 'DS',
      title: options.title || 'Data Sheet',
      generated: new Date().toISOString(),
      entries: cells.map(cell => {
        const triple = parseCellValue<DS>(cell.value)
        return {
          row: cell.row,
          col: cell.col,
          labels: cell.labels,
          valid: triple ? guard.DS(triple.text) : false,
          data: triple?.text || null,
          warnings: options.includeWarnings ? (triple?.warnings || []) : undefined,
          meta: options.includeMetadata ? cell.meta : undefined
        }
      })
    }
    return JSON.stringify(data, null, 2)
  }

  private static exportSPAsJSON(cells: DocumentCell[], options: ExportOptions): string {
    const data = {
      type: 'SP',
      title: options.title || 'Standard Procedure',
      generated: new Date().toISOString(),
      entries: cells.map(cell => {
        const triple = parseCellValue<SP>(cell.value)
        return {
          row: cell.row,
          col: cell.col,
          labels: cell.labels,
          valid: triple ? guard.SP(triple.text) : false,
          data: triple?.text || null,
          warnings: options.includeWarnings ? (triple?.warnings || []) : undefined,
          meta: options.includeMetadata ? cell.meta : undefined
        }
      })
    }
    return JSON.stringify(data, null, 2)
  }

  private static exportXAsJSON(cells: DocumentCell[], options: ExportOptions): string {
    const data = {
      type: 'X',
      title: options.title || 'Guidance Document',
      generated: new Date().toISOString(),
      entries: cells.map(cell => {
        const triple = parseCellValue<X>(cell.value)
        return {
          row: cell.row,
          col: cell.col,
          labels: cell.labels,
          valid: triple ? guard.X(triple.text) : false,
          data: triple?.text || null,
          warnings: options.includeWarnings ? (triple?.warnings || []) : undefined,
          meta: options.includeMetadata ? cell.meta : undefined
        }
      })
    }
    return JSON.stringify(data, null, 2)
  }

  private static exportZAsJSON(cells: DocumentCell[], options: ExportOptions): string {
    const data = {
      type: 'Z',
      title: options.title || 'Checklist',
      generated: new Date().toISOString(),
      entries: cells.map(cell => {
        const triple = parseCellValue<Z>(cell.value)
        return {
          row: cell.row,
          col: cell.col,
          labels: cell.labels,
          valid: triple ? guard.Z(triple.text) : false,
          data: triple?.text || null,
          warnings: options.includeWarnings ? (triple?.warnings || []) : undefined,
          meta: options.includeMetadata ? cell.meta : undefined
        }
      })
    }
    return JSON.stringify(data, null, 2)
  }

  private static exportMAsJSON(cells: DocumentCell[], options: ExportOptions): string {
    const data = {
      type: 'M',
      title: options.title || 'Solution Statements',
      generated: new Date().toISOString(),
      entries: cells.map(cell => {
        const triple = parseCellValue<M>(cell.value)
        return {
          row: cell.row,
          col: cell.col,
          labels: cell.labels,
          valid: triple ? guard.M(triple.text) : false,
          data: triple?.text || null,
          warnings: options.includeWarnings ? (triple?.warnings || []) : undefined,
          meta: options.includeMetadata ? cell.meta : undefined
        }
      })
    }
    return JSON.stringify(data, null, 2)
  }

  // CSV Export Methods (for tabular data)
  private static exportDSAsCSV(cells: DocumentCell[], options: ExportOptions): string {
    let csv = 'Row,Column,Data Field,Units,Type,Source Refs,Notes'
    if (options.includeWarnings) csv += ',Warnings'
    csv += '\n'

    cells.forEach(cell => {
      const triple = parseCellValue<DS>(cell.value)
      if (!triple || !guard.DS(triple.text)) {
        csv += `${cell.row},${cell.col},"${cell.labels.rowLabel}",,,,"Data not available"`
        if (options.includeWarnings) csv += ','
        csv += '\n'
        return
      }

      const ds = triple.text
      const refs = (ds.source_refs || []).join('; ')
      const notes = (ds.notes || []).join('; ')
      const warnings = options.includeWarnings ? triple.warnings.join('; ') : ''
      
      csv += `${cell.row},${cell.col},"${ds.data_field}","${ds.units || ''}","${ds.type || ''}","${refs}","${notes}"`
      if (options.includeWarnings) csv += `,"${warnings}"`
      csv += '\n'
    })

    return csv
  }

  private static exportSPAsCSV(cells: DocumentCell[], options: ExportOptions): string {
    let csv = 'Row,Column,Step,Purpose,Inputs,Outputs,Preconditions,Postconditions,Refs'
    if (options.includeWarnings) csv += ',Warnings'
    csv += '\n'

    cells.forEach(cell => {
      const triple = parseCellValue<SP>(cell.value)
      if (!triple || !guard.SP(triple.text)) {
        csv += `${cell.row},${cell.col},"${cell.labels.rowLabel}",,,,,,"Data not available"`
        if (options.includeWarnings) csv += ','
        csv += '\n'
        return
      }

      const sp = triple.text
      const inputs = (sp.inputs || []).join('; ')
      const outputs = (sp.outputs || []).join('; ')
      const preconditions = (sp.preconditions || []).join('; ')
      const postconditions = (sp.postconditions || []).join('; ')
      const refs = (sp.refs || []).join('; ')
      const warnings = options.includeWarnings ? triple.warnings.join('; ') : ''
      
      csv += `${cell.row},${cell.col},"${sp.step}","${sp.purpose || ''}","${inputs}","${outputs}","${preconditions}","${postconditions}","${refs}"`
      if (options.includeWarnings) csv += `,"${warnings}"`
      csv += '\n'
    })

    return csv
  }

  private static exportZAsCSV(cells: DocumentCell[], options: ExportOptions): string {
    let csv = 'Row,Column,Item,Rationale,Acceptance Criteria,Evidence,Severity,Refs'
    if (options.includeWarnings) csv += ',Warnings'
    csv += '\n'

    cells.forEach(cell => {
      const triple = parseCellValue<Z>(cell.value)
      if (!triple || !guard.Z(triple.text)) {
        csv += `${cell.row},${cell.col},"${cell.labels.rowLabel}",,,,,,"Data not available"`
        if (options.includeWarnings) csv += ','
        csv += '\n'
        return
      }

      const z = triple.text
      const evidence = (z.evidence || []).join('; ')
      const refs = (z.refs || []).join('; ')
      const warnings = options.includeWarnings ? triple.warnings.join('; ') : ''
      
      csv += `${cell.row},${cell.col},"${z.item}","${z.rationale || ''}","${z.acceptance_criteria || ''}","${evidence}","${z.severity || ''}","${refs}"`
      if (options.includeWarnings) csv += `,"${warnings}"`
      csv += '\n'
    })

    return csv
  }

  // DS Table Markdown Export (PDF-friendly)
  private static exportDSAsTableMarkdown(cells: DocumentCell[], options: ExportOptions): string {
    const title = options.title || 'Data Sheet'
    let markdown = `# ${title}\n\n`
    
    if (options.includeMetadata) {
      markdown += `*Generated on ${new Date().toLocaleString()}*\n\n`
    }

    cells.forEach((cell, index) => {
      const triple = parseCellValue<DS>(cell.value)
      if (!triple || !guard.DS(triple.text)) {
        markdown += `### ${cell.labels.rowLabel}\n\n*Data not available*\n\n`
        return
      }

      markdown += `### ${cell.labels.rowLabel}\n\n`
      markdown += formatDSTableMarkdown(triple)
      markdown += '\n\n'
    })

    return markdown
  }

  // Bundle Export (DS/SP/X/M in one document)
  static exportBundle(matrices: {
    ds?: DocumentCell[]
    sp?: DocumentCell[]
    x?: DocumentCell[]
    m?: DocumentCell[]
  }, options: ExportOptions): string {
    const title = options.title || 'Document Bundle'
    let markdown = `# ${title}\n\n`
    
    if (options.includeMetadata) {
      markdown += `*Generated on ${new Date().toLocaleString()}*\n\n`
    }

    // Process each matrix type
    const sections: string[] = []

    if (matrices.ds?.length) {
      const dsTriples = matrices.ds
        .map(cell => parseCellValue<DS>(cell.value))
        .filter(t => t && guard.DS(t.text))
      
      if (dsTriples.length > 0) {
        sections.push(`## Data Sheets\n\n${dsTriples.map(t => formatDSTableMarkdown(t!)).join('\n\n---\n\n')}`)
      }
    }

    if (matrices.sp?.length) {
      const spTriples = matrices.sp
        .map(cell => parseCellValue<SP>(cell.value))
        .filter(t => t && guard.SP(t.text))
      
      if (spTriples.length > 0) {
        sections.push(`## Standard Procedures\n\n${spTriples.map(t => formatSPMarkdown(t!)).join('\n\n---\n\n')}`)
      }
    }

    if (matrices.x?.length) {
      const xTriples = matrices.x
        .map(cell => parseCellValue<X>(cell.value))
        .filter(t => t && guard.X(t.text))
      
      if (xTriples.length > 0) {
        sections.push(`## Guidance Documents\n\n${xTriples.map(t => formatXMarkdown(t!)).join('\n\n---\n\n')}`)
      }
    }

    if (matrices.m?.length) {
      const mTriples = matrices.m
        .map(cell => parseCellValue<M>(cell.value))
        .filter(t => t && guard.M(t.text))
      
      if (mTriples.length > 0) {
        sections.push(`## Solution Statements\n\n${mTriples.map(t => formatMMarkdown(t!)).join('\n\n---\n\n')}`)
      }
    }

    return markdown + sections.join('\n\n')
  }
}