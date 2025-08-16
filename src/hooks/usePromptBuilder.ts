'use client'

import { useState, useCallback } from 'react'
import { buildFromPullCell, guard, type DocKind, type UpstreamContext, type BuiltPrompt } from '@/lib/prompt'
import { parseCellValue, type DS, type SP, type X, type Z, type M } from '@/lib/parseCellValue'

interface UsePromptBuilderOptions {
  onPromptGenerated?: (prompt: BuiltPrompt) => void
  onValidationError?: (errors: string[]) => void
}

interface PromptBuilderResult {
  prompt: BuiltPrompt | null
  isBuilding: boolean
  error: string | null
  buildPrompt: (
    kind: DocKind,
    pullResult: any,
    upstream: UpstreamContext
  ) => Promise<BuiltPrompt>
  validatePayload: (kind: DocKind, value: string) => { 
    valid: boolean
    errors: string[]
    warnings: string[]
    parsed: any
  }
  getUpstreamSummary: (
    stationName: string,
    matrixName: string,
    row?: number
  ) => Promise<string>
}

export function usePromptBuilder(options: UsePromptBuilderOptions = {}): PromptBuilderResult {
  const [prompt, setPrompt] = useState<BuiltPrompt | null>(null)
  const [isBuilding, setIsBuilding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const buildPrompt = useCallback(async (
    kind: DocKind,
    pullResult: any,
    upstream: UpstreamContext
  ): Promise<BuiltPrompt> => {
    setIsBuilding(true)
    setError(null)
    
    try {
      const builtPrompt = buildFromPullCell(kind, pullResult, upstream)
      setPrompt(builtPrompt)
      options.onPromptGenerated?.(builtPrompt)
      return builtPrompt
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to build prompt'
      setError(errorMsg)
      throw err
    } finally {
      setIsBuilding(false)
    }
  }, [options])

  const validatePayload = useCallback((kind: DocKind, value: string) => {
    const errors: string[] = []
    const warnings: string[] = []
    
    // Parse the cell value
    const triple = parseCellValue(value)
    if (!triple) {
      return {
        valid: false,
        errors: ['Could not parse cell value as JSON'],
        warnings: [],
        parsed: null
      }
    }

    // Check triple structure
    if (!guard.triple(triple)) {
      errors.push('Invalid LLM triple structure (missing text, terms_used, or warnings)')
    }

    // Check document-specific validation
    const payload = triple.text
    let payloadValid = false

    switch (kind) {
      case 'DS':
        payloadValid = guard.DS(payload as unknown as any)
        if (!payloadValid) errors.push('Invalid DS payload: missing required data_field')
        break
      case 'SP':
        payloadValid = guard.SP(payload as unknown as any)
        if (!payloadValid) errors.push('Invalid SP payload: missing required step')
        break
      case 'X':
        payloadValid = guard.X(payload as unknown as any)
        if (!payloadValid) errors.push('Invalid X payload: missing required heading or narrative')
        break
      case 'Z':
        payloadValid = guard.Z(payload as unknown as any)
        if (!payloadValid) errors.push('Invalid Z payload: missing required item')
        break
      case 'M':
        payloadValid = guard.M(payload as unknown as any)
        if (!payloadValid) errors.push('Invalid M payload: missing required statement')
        break
    }

    // Add triple warnings to our warnings
    if (triple.warnings?.length > 0) {
      warnings.push(...triple.warnings)
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      parsed: triple
    }
  }, [])

  const getUpstreamSummary = useCallback(async (
    stationName: string,
    matrixName: string,
    row?: number
  ): Promise<string> => {
    try {
      // This would typically call your GraphQL endpoint to get row summary
      const response = await fetch('/api/neo4j/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query_type: 'get_row_summary',
          params: { stationName, matrixName, row }
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to get upstream summary: ${response.statusText}`)
      }

      const result = await response.json()
      return result.summary || `Summary for ${stationName}/${matrixName} row ${row}`
    } catch (err) {
      console.warn('Failed to get upstream summary:', err)
      return `Summary for ${stationName}/${matrixName} row ${row}`
    }
  }, [])

  return {
    prompt,
    isBuilding,
    error,
    buildPrompt,
    validatePayload,
    getUpstreamSummary
  }
}

// Helper hook for specific document types
export function useDocumentPrompts() {
  const promptBuilder = usePromptBuilder()

  const buildDSPrompt = useCallback(async (
    pullResult: any,
    cRowSummary: string,
    problemStatement: string,
    initialVector: string[]
  ) => {
    const upstream: UpstreamContext = {
      problemStatement,
      initialVector,
      cRowSummary
    }
    return promptBuilder.buildPrompt('DS', pullResult, upstream)
  }, [promptBuilder])

  const buildSPPrompt = useCallback(async (
    pullResult: any,
    dsCore: string,
    dSummary: string,
    problemStatement: string,
    initialVector: string[]
  ) => {
    const upstream: UpstreamContext = {
      problemStatement,
      initialVector,
      dsCore,
      dSummary
    }
    return promptBuilder.buildPrompt('SP', pullResult, upstream)
  }, [promptBuilder])

  const buildMPrompt = useCallback(async (
    pullResult: any,
    dsCore: string,
    spCore: string,
    xCore: string,
    problemStatement: string,
    initialVector: string[]
  ) => {
    const upstream: UpstreamContext = {
      problemStatement,
      initialVector,
      dsCore,
      spCore,
      xCore
    }
    return promptBuilder.buildPrompt('M', pullResult, upstream)
  }, [promptBuilder])

  return {
    ...promptBuilder,
    buildDSPrompt,
    buildSPPrompt,
    buildMPrompt
  }
}