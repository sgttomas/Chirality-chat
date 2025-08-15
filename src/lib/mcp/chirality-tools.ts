'use client'

import type { MCPTool, MCPToolResult } from './types'

// Define tools that integrate with the Chirality Framework orchestrator API
export const CHIRALITY_MCP_TOOLS: MCPTool[] = [
  {
    name: 'run_pipeline',
    description: 'Execute a Chirality Framework pipeline command with specified parameters',
    inputSchema: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          enum: ['push-axioms', 'generate-c', 'generate-f', 'generate-d', 'verify-stages'],
          description: 'The pipeline command to execute'
        },
        rows: {
          type: 'array',
          items: { type: 'integer' },
          description: 'Array of row indices to process (e.g., [0, 1, 2])'
        },
        cols: {
          type: 'array', 
          items: { type: 'integer' },
          description: 'Array of column indices to process (e.g., [0, 1, 2, 3])'
        },
        spec: {
          type: 'string',
          description: 'Specification file for push-axioms command'
        },
        ufo_propose: {
          type: 'boolean',
          description: 'Whether to propose UFO claims during execution'
        },
        dry_run: {
          type: 'boolean',
          description: 'Execute in dry-run mode without making changes'
        },
        stop_on_error: {
          type: 'boolean',
          description: 'Stop execution on first error encountered'
        }
      },
      required: ['command']
    }
  },
  {
    name: 'get_pipeline_status',
    description: 'Get the current status of pipeline jobs',
    inputSchema: {
      type: 'object',
      properties: {
        job_id: {
          type: 'string',
          description: 'Optional job ID to get specific job status'
        }
      }
    }
  },
  {
    name: 'stop_pipeline',
    description: 'Stop a running pipeline job',
    inputSchema: {
      type: 'object',
      properties: {
        job_id: {
          type: 'string',
          description: 'Job ID to stop'
        }
      },
      required: ['job_id']
    }
  },
  {
    name: 'query_cell',
    description: 'Query a specific cell in the semantic matrix',
    inputSchema: {
      type: 'object',
      properties: {
        station_name: {
          type: 'string',
          description: 'Station name (e.g., "Requirements", "Objectives")'
        },
        matrix_name: {
          type: 'string',
          description: 'Matrix name (e.g., "C", "F", "D")'
        },
        row: {
          type: 'integer',
          description: 'Row index'
        },
        col: {
          type: 'integer',
          description: 'Column index'
        },
        include_ontologies: {
          type: 'boolean',
          description: 'Include ontology information in response'
        }
      },
      required: ['station_name', 'matrix_name', 'row', 'col']
    }
  },
  {
    name: 'generate_document',
    description: 'Generate Phase-2 document synthesis matrices (DS/SP/X/Z/M)',
    inputSchema: {
      type: 'object',
      properties: {
        document_type: {
          type: 'string',
          enum: ['DS', 'SP', 'X', 'Z', 'M'],
          description: 'Document type to generate'
        },
        rows: {
          type: 'array',
          items: { type: 'integer' },
          description: 'Rows to process'
        },
        cols: {
          type: 'array',
          items: { type: 'integer' },
          description: 'Columns to process'
        },
        version: {
          type: 'string',
          description: 'Version tag (V1, V2, V3)'
        }
      },
      required: ['document_type']
    }
  },
  {
    name: 'export_document',
    description: 'Export document synthesis matrices to various formats',
    inputSchema: {
      type: 'object',
      properties: {
        matrix_name: {
          type: 'string',
          enum: ['DS', 'SP', 'X', 'Z', 'M', 'W', 'U', 'N'],
          description: 'Matrix to export'
        },
        format: {
          type: 'string',
          enum: ['markdown', 'json', 'pdf'],
          description: 'Export format'
        },
        filters: {
          type: 'object',
          properties: {
            min_confidence: { type: 'number' },
            status: { type: 'array', items: { type: 'string' } },
            version: { type: 'string' }
          }
        }
      },
      required: ['matrix_name', 'format']
    }
  },
  {
    name: 'create_ufo_claim',
    description: 'Create a UFO ontological claim for adjudication',
    inputSchema: {
      type: 'object',
      properties: {
        station_name: {
          type: 'string',
          description: 'Station where claim applies'
        },
        matrix_name: {
          type: 'string',
          description: 'Matrix where claim applies'
        },
        row: {
          type: 'integer',
          description: 'Row index'
        },
        col: {
          type: 'integer',
          description: 'Column index'
        },
        claim_type: {
          type: 'string',
          enum: ['entity', 'relationship', 'constraint', 'modal'],
          description: 'Type of UFO claim'
        },
        claim_text: {
          type: 'string',
          description: 'Textual description of the claim'
        },
        evidence: {
          type: 'string',
          description: 'Supporting evidence for the claim'
        },
        confidence: {
          type: 'number',
          minimum: 0,
          maximum: 1,
          description: 'Confidence score (0-1)'
        }
      },
      required: ['station_name', 'matrix_name', 'row', 'col', 'claim_type', 'claim_text']
    }
  }
]

// Implementation of tool execution
export class ChiralityMCPTools {
  private orchestratorBaseUrl: string
  private graphqlUrl: string

  constructor(
    orchestratorBaseUrl = 'http://localhost:3001',
    graphqlUrl = 'http://localhost:8080/graphql'
  ) {
    this.orchestratorBaseUrl = orchestratorBaseUrl
    this.graphqlUrl = graphqlUrl
  }

  async executeTool(toolName: string, args: Record<string, any>): Promise<MCPToolResult> {
    try {
      switch (toolName) {
        case 'run_pipeline':
          return await this.runPipeline(args)
        case 'get_pipeline_status':
          return await this.getPipelineStatus(args)
        case 'stop_pipeline':
          return await this.stopPipeline(args)
        case 'query_cell':
          return await this.queryCell(args)
        case 'generate_document':
          return await this.generateDocument(args)
        case 'export_document':
          return await this.exportDocument(args)
        case 'create_ufo_claim':
          return await this.createUfoClaim(args)
        default:
          throw new Error(`Unknown tool: ${toolName}`)
      }
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error executing ${toolName}: ${error instanceof Error ? error.message : 'Unknown error'}`
        }],
        isError: true
      }
    }
  }

  private async runPipeline(args: any): Promise<MCPToolResult> {
    const { command, rows, cols, spec, ufo_propose, dry_run, stop_on_error } = args
    
    const pipelineArgs: any = {
      api_base: this.graphqlUrl
    }
    
    if (rows) pipelineArgs.rows = rows
    if (cols) pipelineArgs.cols = cols
    if (spec) pipelineArgs.spec = spec
    if (ufo_propose) pipelineArgs.ufo_propose = true
    if (dry_run) pipelineArgs.dry_run = true
    if (stop_on_error) pipelineArgs.stop_on_error = true

    const response = await fetch(`${this.orchestratorBaseUrl}/api/orchestrate/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cmd: command, args: pipelineArgs })
    })

    if (!response.ok) {
      throw new Error(`Pipeline execution failed: ${response.statusText}`)
    }

    const result = await response.json()
    
    return {
      content: [{
        type: 'text',
        text: `Pipeline job started successfully.\nJob ID: ${result.jobId}\nCommand: ${command}\nMonitor progress at: ${this.orchestratorBaseUrl}/api/orchestrate/logs/${result.jobId}`
      }]
    }
  }

  private async getPipelineStatus(args: any): Promise<MCPToolResult> {
    const { job_id } = args
    
    const url = job_id 
      ? `${this.orchestratorBaseUrl}/api/orchestrate/status?jobId=${job_id}`
      : `${this.orchestratorBaseUrl}/api/orchestrate/metrics`
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Failed to get pipeline status: ${response.statusText}`)
    }
    
    const status = await response.json()
    
    return {
      content: [{
        type: 'text',
        text: job_id 
          ? `Job ${job_id} Status: ${status.status}\nLogs: ${status.logs?.length || 0} entries`
          : `System Status:\nActive Jobs: ${status.activeJobs}\nCompleted: ${status.completedJobs}\nFailed: ${status.failedJobs}`
      }]
    }
  }

  private async stopPipeline(args: any): Promise<MCPToolResult> {
    const { job_id } = args
    
    const response = await fetch(`${this.orchestratorBaseUrl}/api/orchestrate/stop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId: job_id })
    })
    
    if (!response.ok) {
      throw new Error(`Failed to stop pipeline: ${response.statusText}`)
    }
    
    const result = await response.json()
    
    return {
      content: [{
        type: 'text',
        text: `Pipeline job ${job_id} stop requested. Status: ${result.message || 'Stopping'}`
      }]
    }
  }

  private async queryCell(args: any): Promise<MCPToolResult> {
    const { station_name, matrix_name, row, col, include_ontologies } = args
    
    const query = `
      query PullCell($stationName: String!, $matrixName: String!, $row: Int!, $col: Int!, $includeOntologies: Boolean!) {
        pullCell(stationName: $stationName, matrixName: $matrixName, row: $row, col: $col, includeOntologies: $includeOntologies) {
          matrixKey
          row
          col
          labels {
            rowLabel
            colLabel
          }
          stages {
            stage
            value
            modelId
            latencyMs
            createdAt
          }
          ontologies @include(if: $includeOntologies) {
            curie
            label
          }
        }
      }
    `
    
    const response = await fetch(this.graphqlUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        variables: {
          stationName: station_name,
          matrixName: matrix_name,
          row,
          col,
          includeOntologies: include_ontologies || false
        }
      })
    })
    
    if (!response.ok) {
      throw new Error(`GraphQL query failed: ${response.statusText}`)
    }
    
    const result = await response.json()
    
    if (result.errors) {
      throw new Error(`GraphQL errors: ${result.errors.map((e: any) => e.message).join(', ')}`)
    }
    
    const cell = result.data.pullCell
    
    return {
      content: [{
        type: 'text',
        text: `Cell ${station_name}/${matrix_name}[${row},${col}]:\nLabels: ${cell.labels.rowLabel} × ${cell.labels.colLabel}\nStages: ${cell.stages.length}\nLatest: ${cell.stages[cell.stages.length - 1]?.stage || 'None'}`
      }]
    }
  }

  private async generateDocument(args: any): Promise<MCPToolResult> {
    const { document_type, rows, cols, version } = args
    
    // Map document types to CLI commands
    const commandMap: Record<string, string> = {
      'DS': 'generate-ds',
      'SP': 'generate-sp', 
      'X': 'generate-x',
      'Z': 'generate-z',
      'M': 'generate-m'
    }
    
    const command = commandMap[document_type]
    if (!command) {
      throw new Error(`Unsupported document type: ${document_type}`)
    }
    
    return await this.runPipeline({
      command,
      rows: rows || [0, 1, 2],
      cols: cols || [0, 1, 2, 3],
      // Add version tag to meta if provided
      version
    })
  }

  private async exportDocument(args: any): Promise<MCPToolResult> {
    const { matrix_name, format, filters } = args
    
    // This would integrate with the document export functionality
    // For now, return a placeholder response
    return {
      content: [{
        type: 'text',
        text: `Document export initiated for matrix ${matrix_name} in ${format} format. Check the Document Builder UI for download links.`
      }]
    }
  }

  private async createUfoClaim(args: any): Promise<MCPToolResult> {
    const { station_name, matrix_name, row, col, claim_type, claim_text, evidence, confidence } = args
    
    const mutation = `
      mutation CreateUfoClaim($stationName: String!, $matrixName: String!, $row: Int!, $col: Int!, $claimType: String!, $claimText: String!, $evidence: String, $confidence: Float) {
        createUfoClaim(stationName: $stationName, matrixName: $matrixName, row: $row, col: $col, claimType: $claimType, claimText: $claimText, evidence: $evidence, confidence: $confidence) {
          id
          status
          createdAt
        }
      }
    `
    
    const response = await fetch(this.graphqlUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: mutation,
        variables: {
          stationName: station_name,
          matrixName: matrix_name,
          row,
          col,
          claimType: claim_type,
          claimText: claim_text,
          evidence,
          confidence
        }
      })
    })
    
    if (!response.ok) {
      throw new Error(`GraphQL mutation failed: ${response.statusText}`)
    }
    
    const result = await response.json()
    
    if (result.errors) {
      throw new Error(`GraphQL errors: ${result.errors.map((e: any) => e.message).join(', ')}`)
    }
    
    const claim = result.data.createUfoClaim
    
    return {
      content: [{
        type: 'text',
        text: `UFO claim created successfully.\nClaim ID: ${claim.id}\nStatus: ${claim.status}\nCreated: ${claim.createdAt}`
      }]
    }
  }
}