// Safe JSON parsing for cell values with proper TypeScript typing

// Import and re-export core types from prompt contracts for consistency
import type { DS, SP, X, Z, M, LlmTriple } from './prompt/llmContracts'
export type { DS, SP, X, Z, M, LlmTriple }

// Additional types for iteration matrices (W/U/N)
export interface W {
  artifact: string
  from_version: string
  to_version: string
  change: string
  reason?: string
  evidence?: string[]
  impact?: string
}

export interface U {
  round: number
  convergence: number
  open_issues: string[]
  escalations?: string[]
  confidence: number
  next_actions: string[]
}

export interface N {
  inputs: string[]
  outputs: string[]
  features: string[]
  embeddings_ref?: string
  labels: string[]
  provenance: string[]
}

/**
 * Safely parse cell value as JSON with fallback handling
 * Handles both raw JSON strings and the LLM triple format
 */
export function parseCellValue<T = unknown>(value?: string | null): LlmTriple<T> | null {
  if (!value) return null
  
  // Handle empty or whitespace-only values
  const trimmed = value.trim()
  if (!trimmed) return null
  
  // Find JSON boundaries
  const firstBrace = trimmed.indexOf('{')
  const lastBrace = trimmed.lastIndexOf('}')
  
  if (firstBrace < 0 || lastBrace < 0 || lastBrace <= firstBrace) {
    // Not JSON format, return as plain text
    return {
      text: trimmed as T,
      terms_used: [],
      warnings: ['Not in JSON format']
    }
  }
  
  try {
    const jsonStr = trimmed.slice(firstBrace, lastBrace + 1)
    const obj = JSON.parse(jsonStr)
    
    // Check if it's already in LLM triple format
    if (typeof obj === 'object' && obj !== null && 
        'text' in obj && 'terms_used' in obj && 'warnings' in obj) {
      return obj as LlmTriple<T>
    }
    
    // Assume it's the payload directly
    return {
      text: obj as T,
      terms_used: [],
      warnings: []
    }
  } catch (error) {
    console.warn('Failed to parse cell value as JSON:', error)
    return {
      text: trimmed as T,
      terms_used: [],
      warnings: [`JSON parse error: ${error instanceof Error ? error.message : 'Unknown error'}`]
    }
  }
}

/**
 * Type-safe parsers for specific document types
 */
export function parseDS(value?: string | null): LlmTriple<DS> | null {
  return parseCellValue<DS>(value)
}

export function parseSP(value?: string | null): LlmTriple<SP> | null {
  return parseCellValue<SP>(value)
}

export function parseX(value?: string | null): LlmTriple<X> | null {
  return parseCellValue<X>(value)
}

export function parseZ(value?: string | null): LlmTriple<Z> | null {
  return parseCellValue<Z>(value)
}

export function parseM(value?: string | null): LlmTriple<M> | null {
  return parseCellValue<M>(value)
}

export function parseW(value?: string | null): LlmTriple<W> | null {
  return parseCellValue<W>(value)
}

export function parseU(value?: string | null): LlmTriple<U> | null {
  return parseCellValue<U>(value)
}

export function parseN(value?: string | null): LlmTriple<N> | null {
  return parseCellValue<N>(value)
}

/**
 * Validate that a parsed payload has required fields for a given type
 */
export function validateDS(payload: any): payload is DS {
  return typeof payload?.data_field === 'string'
}

export function validateSP(payload: any): payload is SP {
  return typeof payload?.step === 'string'
}

export function validateX(payload: any): payload is X {
  return typeof payload?.heading === 'string' && typeof payload?.narrative === 'string'
}

export function validateZ(payload: any): payload is Z {
  return typeof payload?.item === 'string'
}

export function validateM(payload: any): payload is M {
  return typeof payload?.statement === 'string'
}

export function validateW(payload: any): payload is W {
  return typeof payload?.artifact === 'string' && 
         typeof payload?.from_version === 'string' && 
         typeof payload?.to_version === 'string'
}

export function validateU(payload: any): payload is U {
  return typeof payload?.round === 'number' && 
         typeof payload?.convergence === 'number'
}

export function validateN(payload: any): payload is N {
  return Array.isArray(payload?.inputs) && Array.isArray(payload?.outputs)
}