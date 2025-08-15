/**
 * Serialization utilities for converting between different data formats
 * in the Chirality Framework pipeline
 */

import type { Triple, DS, SP, X, M } from '@/chirality-core/contracts'

/**
 * Serialize a Triple object to a string format suitable for the LLM chat interface
 * This follows the standard format expected by parseCellValue
 */
export function serializeTriple<T>(triple: Triple<T>): string {
  // The standard format is a JSON string containing the triple structure
  // with text, terms_used, and warnings fields
  return JSON.stringify({
    text: triple.text,
    terms_used: triple.terms_used || [],
    warnings: triple.warnings || []
  })
}

/**
 * Serialize document data for display in the UI
 * Converts complex nested structures to readable format
 */
export function serializeDocumentForDisplay(doc: any): string {
  if (typeof doc === 'string') {
    return doc
  }
  
  if (doc?.text) {
    // It's already a Triple, serialize it
    return serializeTriple(doc)
  }
  
  // For other objects, use standard JSON serialization
  return JSON.stringify(doc, null, 2)
}

/**
 * Convert GraphQL response format to Triple format
 */
export function graphqlToTriple<T>(graphqlData: any): Triple<T> | null {
  if (!graphqlData) return null
  
  // GraphQL responses might have different structure
  // Convert to standard Triple format
  return {
    text: graphqlData.content || graphqlData.text || graphqlData,
    terms_used: graphqlData.terms || graphqlData.terms_used || [],
    warnings: graphqlData.warnings || []
  }
}

/**
 * Convert Python tuple format to Triple format
 * Python sends tuples as arrays: [text, terms, warnings]
 */
export function tupleToTriple<T>(tuple: any[]): Triple<T> | null {
  if (!Array.isArray(tuple) || tuple.length < 1) return null
  
  return {
    text: tuple[0],
    terms_used: tuple[1] || [],
    warnings: tuple[2] || []
  }
}

/**
 * Smart serialization that detects format and converts appropriately
 */
export function smartSerialize(data: any): string {
  // Already a string
  if (typeof data === 'string') {
    return data
  }
  
  // Array (tuple format from Python)
  if (Array.isArray(data)) {
    const triple = tupleToTriple(data)
    return triple ? serializeTriple(triple) : JSON.stringify(data)
  }
  
  // Object with Triple structure
  if (data?.text !== undefined && data?.terms_used !== undefined) {
    return serializeTriple(data)
  }
  
  // GraphQL-like structure
  if (data?.content || data?.value) {
    const triple = graphqlToTriple(data)
    return triple ? serializeTriple(triple) : JSON.stringify(data)
  }
  
  // Default JSON serialization
  return JSON.stringify(data)
}

/**
 * Format rules for LLM-ready strings
 */
export function formatForLLM(data: any): string {
  const serialized = smartSerialize(data)
  
  // Apply formatting rules:
  // 1. Remove excessive whitespace
  // 2. Ensure valid JSON structure
  // 3. Add proper escaping
  
  try {
    const parsed = JSON.parse(serialized)
    return JSON.stringify(parsed) // Re-stringify to ensure consistency
  } catch {
    // If not valid JSON, return as-is
    return serialized
  }
}