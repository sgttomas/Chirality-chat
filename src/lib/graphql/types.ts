// Core GraphQL types matching the backend schema

export interface Cell {
  matrixKey: string
  row: number
  col: number
  labels: {
    rowLabel: string
    colLabel: string
  }
  stages: CellStage[]
  latestStage?: CellStage
  ontologies?: Ontology[]
}

export interface CellStage {
  stage: string
  value: string
  modelId?: string
  promptHash?: string
  latencyMs?: number
  warnings?: string[]
  meta?: string
  createdAt: string
  contentHash?: string
  version?: number
}

export interface Matrix {
  name: string
  title: string
  matrixKey: string
  stationName: string
  createdAt: string
  axes: Axis[]
  cells: Cell[]
}

export interface Station {
  name: string
  index: number
  createdAt: string
  matrices: Matrix[]
}

export interface Axis {
  kind: 'ROW' | 'COL'
  labels: AxisLabel[]
}

export interface AxisLabel {
  index: number
  value: string
}

export interface Ontology {
  curie: string
  label: string
  scope: string
  description?: string
  bindings?: OntologyBinding[]
}

export interface OntologyBinding {
  stationName?: string
  matrixName?: string
  axisKind?: string
}

// UFO Claims
export interface UfoClaim {
  id: string
  stationName: string
  matrixName: string
  row: number
  col: number
  claimType: string
  claimText: string
  evidence?: string
  confidence?: number
  status: 'pending' | 'approved' | 'rejected'
  reviewerId?: string
  createdAt: string
  updatedAt: string
}

// Pipeline and system types
export interface PipelineJob {
  id: string
  command: string
  status: 'running' | 'completed' | 'failed'
  startedAt: string
  endedAt?: string
  exitCode?: number
}

export interface PipelineStatus {
  isRunning: boolean
  currentJob?: PipelineJob
  recentJobs: PipelineJob[]
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  neo4j: {
    connected: boolean
    version?: string
  }
  services: {
    graphql: boolean
    neo4j: boolean
    openai: boolean
  }
}

// Document Synthesis types (Phase-2)
export interface DocumentSynthesisMatrix {
  DS: DocumentData  // Data Sheet
  SP: ProcedureData // Standard Procedure
  X: GuidanceData   // Guidance Document
  Z: ChecklistData  // Checklist
  M: SolutionData   // Solution Statements
  W?: DeltaData     // Iteration Deltas
  U?: SynthesisData // Cycle Synthesis
  N?: LearningData  // Learning Traces
}

// Type alias for matrix keys
export type MatrixKey = keyof DocumentSynthesisMatrix

export interface DocumentData {
  dataField: string
  units: string
  type: string
  sourceRefs: string[]
  notes: string
}

export interface ProcedureData {
  step: string
  purpose: string
  inputs: string[]
  outputs: string[]
  preconditions: string[]
  postconditions: string[]
  refs: string[]
}

export interface GuidanceData {
  heading: string
  narrative: string
  precedents: string[]
  successors: string[]
  contextNotes: string[]
  refs: string[]
}

export interface ChecklistData {
  item: string
  rationale: string
  acceptanceCriteria: string
  evidence: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  refs: string[]
}

export interface SolutionData {
  statement: string
  justification: string
  traceBack: string[]
  assumptions: string[]
  residualRisk: string
}

export interface DeltaData {
  artifact: string
  fromVersion: string
  toVersion: string
  change: string
  reason: string
  evidence: string
  impact: string
}

export interface SynthesisData {
  round: number
  convergence: number
  openIssues: string[]
  escalations: string[]
  confidence: number
  nextActions: string[]
}

export interface LearningData {
  inputs: string[]
  outputs: string[]
  features: string[]
  embeddingsRef: string
  labels: string[]
  provenance: string[]
}

// Search and discovery
export interface SearchResult {
  matrixKey: string
  row: number
  col: number
  labels: {
    rowLabel: string
    colLabel: string
  }
  latestStage: CellStage
  relevanceScore: number
}

// GraphQL response types
export interface PullCellResponse {
  pullCell: Cell
}

export interface UpsertCellStageResponse {
  upsertCellStage: {
    success: boolean
    deduped: boolean
    version: number
    contentHash: string
  }
}

export interface GetStationsResponse {
  stations: Station[]
}

export interface GetMatrixOverviewResponse {
  matrix: Matrix
}

export interface SearchCellsResponse {
  searchCells: SearchResult[]
}

export interface GetUfoClaimsResponse {
  ufoClaims: UfoClaim[]
}

export interface CreateUfoClaimResponse {
  createUfoClaim: {
    id: string
    status: string
    createdAt: string
  }
}

export interface GetPipelineStatusResponse {
  pipelineStatus: PipelineStatus
}

export interface HealthCheckResponse {
  health: HealthStatus
}

// Query variables
export interface PullCellVariables {
  stationName: string
  matrixName: string
  row: number
  col: number
  includeOntologies?: boolean
}

export interface UpsertCellStageVariables {
  stationName: string
  matrixName: string
  row: number
  col: number
  stage: string
  value: string
  modelId?: string
  promptHash?: string
  labels?: string
  meta?: string
}

export interface GetMatrixOverviewVariables {
  stationName: string
  matrixName: string
}

export interface SearchCellsVariables {
  query: string
  stationName?: string
  matrixName?: string
  stage?: string
}

export interface CreateUfoClaimVariables {
  stationName: string
  matrixName: string
  row: number
  col: number
  claimType: string
  claimText: string
  evidence?: string
  confidence?: number
}