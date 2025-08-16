'use client'

// Enhanced orchestrator client with proper auth and API base handling

// ---- Commands ---------------------------------------------------------------
export type GenerateCommand = 'generate-c' | 'generate-f' | 'generate-d' | 'verify-stages'
export type Command = GenerateCommand | 'push-axioms'

// ---- API call args your backend expects (MUTABLE) ---------------------------
export interface JobArgs {
  api_base?: string
  rows?: number[] | string
  cols?: number[] | string
  spec?: string
  model?: string
  ufo_propose?: boolean
  dry_run?: boolean
  stop_on_error?: boolean
  log_json?: boolean
  station?: string
  matrix?: string
}

// ---- Preset args (READONLY at authoring time) -------------------------------
type GridArgsRO = {
  rows: ReadonlyArray<number>
  cols: ReadonlyArray<number>
  dry_run?: boolean
  ufo_propose?: boolean
}

type PushAxiomsArgs = { spec: string }

// ---- The discriminated union by `command` -----------------------------------
export type Preset =
  | { command: GenerateCommand; args: GridArgsRO }
  | { command: 'push-axioms';   args: PushAxiomsArgs }

export interface JobResponse {
  jobId: string
}

export interface JobStatus {
  id: string
  status: 'running' | 'completed' | 'failed'
  logs?: any[]
  startedAt?: string
  endedAt?: string
  exitCode?: number
}

export interface SystemMetrics {
  activeJobs: number
  completedJobs: number
  failedJobs: number
  totalJobs: number
  uptime: number
}

export class OrchestratorClient {
  private baseUrl: string
  private authToken?: string
  private apiBase: string

  constructor(
    orchestratorUrl?: string,
    authToken?: string
  ) {
    // Use NEXT_PUBLIC_ environment variables for client-side access
    this.baseUrl = orchestratorUrl || process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:3001'
    this.authToken = authToken || (typeof window === 'undefined' ? process.env.ORCHESTRATOR_TOKEN : undefined)
    
    // Derive API base from GraphQL URL, ensuring no /graphql suffix
    const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:8080/graphql'
    this.apiBase = graphqlUrl.replace('/graphql', '')
  }

  /**
   * Build normalized arguments for CLI execution
   */
  buildArgs(args: JobArgs): JobArgs {
    const normalized: JobArgs = {
      // Always include API base derived from GraphQL URL
      api_base: args.api_base || this.apiBase,
      
      // Normalize arrays to comma-separated strings for CLI
      rows: Array.isArray(args.rows) ? args.rows.join(',') : args.rows,
      cols: Array.isArray(args.cols) ? args.cols.join(',') : args.cols,
      
      // Pass through other args
      ...args
    }

    // Remove undefined values
    Object.keys(normalized).forEach(key => {
      if (normalized[key as keyof JobArgs] === undefined) {
        delete normalized[key as keyof JobArgs]
      }
    })

    return normalized
  }

  /**
   * Get request headers with auth if configured
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`
    }

    return headers
  }

  /**
   * Handle fetch with error checking
   */
  private async fetchWithErrorHandling(url: string, options?: RequestInit): Promise<Response> {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options?.headers
        }
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      return response
    } catch (error) {
      console.error('Orchestrator request failed:', error)
      throw error
    }
  }

  /**
   * Start a pipeline job
   */
  async startJob(command: string, args: JobArgs): Promise<JobResponse> {
    const normalizedArgs = this.buildArgs(args)
    
    console.log('Starting job:', { command, args: normalizedArgs })
    
    const response = await this.fetchWithErrorHandling(`${this.baseUrl}/api/orchestrate/run`, {
      method: 'POST',
      body: JSON.stringify({
        cmd: command,
        args: normalizedArgs
      })
    })

    return await response.json()
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId?: string): Promise<JobStatus | SystemMetrics> {
    const url = jobId 
      ? `${this.baseUrl}/api/orchestrate/status?jobId=${jobId}`
      : `${this.baseUrl}/api/orchestrate/metrics`
    
    const response = await this.fetchWithErrorHandling(url)
    return await response.json()
  }

  /**
   * Stop a running job
   */
  async stopJob(jobId: string): Promise<{ success: boolean; message: string }> {
    const response = await this.fetchWithErrorHandling(`${this.baseUrl}/api/orchestrate/stop`, {
      method: 'POST',
      body: JSON.stringify({ jobId })
    })

    return await response.json()
  }

  /**
   * Get system metrics
   */
  async getMetrics(): Promise<SystemMetrics> {
    const response = await this.fetchWithErrorHandling(`${this.baseUrl}/api/orchestrate/metrics`)
    return await response.json()
  }

  /**
   * Create SSE connection for job logs
   */
  createLogStream(jobId: string): EventSource {
    const url = `${this.baseUrl}/api/orchestrate/logs/${jobId}`
    
    // EventSource doesn't support custom headers, so auth must be via query param if needed
    const authUrl = this.authToken 
      ? `${url}?token=${encodeURIComponent(this.authToken)}`
      : url
    
    return new EventSource(authUrl)
  }

  /**
   * Test connection to orchestrator
   */
  async healthCheck(): Promise<{ healthy: boolean; version?: string; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/orchestrate/metrics`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      if (!response.ok) {
        return { healthy: false, error: `HTTP ${response.status}` }
      }

      const data = await response.json()
      return { 
        healthy: true, 
        version: data.version || 'unknown'
      }
    } catch (error) {
      return { 
        healthy: false, 
        error: error instanceof Error ? error.message : 'Connection failed'
      }
    }
  }
}

// Singleton instance
let orchestratorClient: OrchestratorClient | null = null

export function getOrchestratorClient(): OrchestratorClient {
  if (!orchestratorClient) {
    orchestratorClient = new OrchestratorClient()
  }
  return orchestratorClient
}

// Helper functions for common operations
export async function startJob(command: string, args: JobArgs): Promise<JobResponse> {
  return getOrchestratorClient().startJob(command, args)
}

export function buildArgs(args: JobArgs): JobArgs {
  return getOrchestratorClient().buildArgs(args)
}

export async function getJobStatus(jobId?: string): Promise<JobStatus | SystemMetrics> {
  return getOrchestratorClient().getJobStatus(jobId)
}

export async function stopJob(jobId: string): Promise<{ success: boolean; message: string }> {
  return getOrchestratorClient().stopJob(jobId)
}

export function createLogStream(jobId: string): EventSource {
  return getOrchestratorClient().createLogStream(jobId)
}

// ---- JOB_PRESETS typed & checked (keeps your literal values) ----------------
export const JOB_PRESETS = {
  'Test Single Cell': {
    command: 'generate-c',
    args: { rows: [0], cols: [0], dry_run: true }
  },
  'Test Row 0': {
    command: 'generate-c',
    args: { rows: [0], cols: [0, 1, 2, 3], dry_run: true }
  },
  'Full Requirements': {
    command: 'generate-c',
    args: { rows: [0, 1, 2], cols: [0, 1, 2, 3], ufo_propose: true }
  },
  'Generate Objectives': {
    command: 'generate-f',
    args: { rows: [0, 1, 2], cols: [0, 1, 2, 3], ufo_propose: true }
  },
  'Complete Solution': {
    command: 'generate-d',
    args: { rows: [0, 1, 2], cols: [0, 1, 2, 3], ufo_propose: true }
  },
  'Push Axioms': {
    command: 'push-axioms',
    args: { spec: 'NORMATIVE_Chirality_Framework_14.2.1.1.txt' }
  },
  'Verify All Stages': {
    command: 'verify-stages',
    args: { rows: [0, 1, 2], cols: [0, 1, 2, 3] }
  }
} as const satisfies Record<string, Preset>;

// ---- Adapter to convert Preset → JobArgs ------------------------------------
export function toMutableArgs(preset: Preset): JobArgs {
  switch (preset.command) {
    case 'push-axioms':
      return { spec: preset.args.spec };

    // All grid-like generators use rows/cols
    case 'generate-c':
    case 'generate-f':
    case 'generate-d':
    case 'verify-stages':
      return {
        rows: [...preset.args.rows],
        cols: [...preset.args.cols],
        ...(preset.args.dry_run ? { dry_run: true } : {}),
        ...(preset.args.ufo_propose ? { ufo_propose: true } : {})
      };
  }
}

export type JobPresetName = keyof typeof JOB_PRESETS