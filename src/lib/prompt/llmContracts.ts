// LLM contracts and types for Chirality Framework prompt generation

export type DS = { 
  data_field: string; 
  units?: string; 
  type?: string; 
  source_refs?: string[]; 
  notes?: string[] 
}

export type SP = { 
  step: string; 
  purpose?: string; 
  inputs?: string[]; 
  outputs?: string[]; 
  preconditions?: string[]; 
  postconditions?: string[]; 
  refs?: string[] 
}

export type X = { 
  heading: string; 
  narrative: string; 
  precedents?: string[]; 
  successors?: string[]; 
  context_notes?: string[]; 
  refs?: string[] 
}

export type Z = { 
  item: string; 
  rationale?: string; 
  acceptance_criteria?: string; 
  evidence?: string[]; 
  severity?: 'Low' | 'Medium' | 'High'; 
  refs?: string[] 
}

export type M = { 
  statement: string; 
  justification?: string; 
  trace_back?: string[]; 
  assumptions?: string[]; 
  residual_risk?: string[] 
}

export type LlmTriple<T> = { 
  text: T; 
  terms_used: string[]; 
  warnings: string[] 
}

export type DocKind = 'DS' | 'SP' | 'X' | 'M' | 'Z'

export interface ValleyMeta { 
  name: string; 
  version?: string 
}

export interface StationMeta { 
  name: string; 
  index?: number 
}

export interface MatrixMeta { 
  name: string; 
  rowLabels?: string[]; 
  colLabels?: string[] 
}

export interface LabelPair { 
  rowLabel: string; 
  colLabel: string 
}

export interface TraceMeta { 
  phase: string; 
  promptHash?: string; 
  modelId?: string; 
  latencyMs?: number; 
  createdAt?: string 
}

export interface OntologyEntity { 
  curie: string; 
  label?: string 
}

export interface OntologyPack { 
  jsonldContext?: Record<string, unknown>; 
  entities?: OntologyEntity[] 
}

export interface CellContext {
  valley: ValleyMeta
  station: StationMeta
  matrix: MatrixMeta
  labels: LabelPair
  stage?: string | null
  traces?: TraceMeta[]
  anchors?: { id: string; kind?: string; text: string }[]
  ontologies?: OntologyPack
}

export interface UpstreamContext {
  problemStatement: string
  initialVector: string[]           // short high-signal tokens
  cRowSummary?: string              // for DS
  dSummary?: string                 // for SP
  dsCore?: string                   // for X/M
  spCore?: string                   // for X/M
  xCore?: string                    // for M
  anchors?: string[]                // optional
}

export interface BuiltPrompt {
  system: string
  user: string
}