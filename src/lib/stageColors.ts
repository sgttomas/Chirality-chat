// Consistent stage colors across all components

export type StageColorVariant = 'default' | 'processing' | 'blue' | 'purple' | 'gold' | 'green' | 'red'

export const STAGE_COLORS: Record<string, StageColorVariant> = {
  // Phase-1 stages
  axiom: 'default',
  axiomatic_truncation: 'default',
  context_loaded: 'processing',
  sum: 'blue',
  element_wise: 'blue',
  interpretation: 'gold',
  final_resolved: 'green',
  error: 'red',
  
  // Phase-2 document stages
  doc_context_loaded: 'processing',
  doc_propose: 'processing',
  doc_consolidate: 'blue',
  doc_interpret: 'gold',
  doc_finalize: 'green',
  
  // Iteration stages
  iter_context_loaded: 'processing',
  iter_update: 'blue',
  iter_convergence: 'gold',
  
  // Special stages
  draft: 'processing',
  review: 'gold',
  approved: 'green',
  rejected: 'red'
}

/**
 * Get color variant for a stage, with special handling for product stages
 */
export function getStageColor(stage?: string | null): StageColorVariant {
  if (!stage) return 'default'
  
  // Handle product stages (product:k=0, product:k=1, etc.)
  if (stage.startsWith('product:')) return 'purple'
  
  return STAGE_COLORS[stage] || 'default'
}

/**
 * Get hex color value for a stage (for canvas rendering)
 */
export function getStageHexColor(stage?: string | null): string {
  const variant = getStageColor(stage)
  
  const hexColors: Record<StageColorVariant, string> = {
    default: '#e5e7eb',
    processing: '#3b82f6',
    blue: '#1e40af',
    purple: '#7c3aed',
    gold: '#f59e0b',
    green: '#10b981',
    red: '#ef4444'
  }
  
  return hexColors[variant]
}

/**
 * Get CSS class names for stage styling (for Ant Design compatibility)
 */
export function getStageCssClass(stage?: string | null): string {
  const variant = getStageColor(stage)
  
  const cssClasses: Record<StageColorVariant, string> = {
    default: 'bg-gray-100 text-gray-800',
    processing: 'bg-blue-100 text-blue-800',
    blue: 'bg-blue-200 text-blue-900',
    purple: 'bg-purple-100 text-purple-800',
    gold: 'bg-yellow-100 text-yellow-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800'
  }
  
  return cssClasses[variant]
}

/**
 * Get badge color for Ant Design Badge/Tag components
 */
export function getStageBadgeColor(stage?: string | null): string {
  const variant = getStageColor(stage)
  
  const badgeColors: Record<StageColorVariant, string> = {
    default: 'default',
    processing: 'processing',
    blue: 'blue',
    purple: 'purple',
    gold: 'gold',
    green: 'green',
    red: 'red'
  }
  
  return badgeColors[variant]
}

/**
 * Get readable stage display name
 */
export function getStageDisplayName(stage?: string | null): string {
  if (!stage) return 'Unknown'
  
  const displayNames: Record<string, string> = {
    axiom: 'Axiom',
    axiomatic_truncation: 'Axiomatic Truncation',
    context_loaded: 'Context Loaded',
    sum: 'Sum',
    element_wise: 'Element-wise',
    interpretation: 'Interpretation',
    final_resolved: 'Final Resolved',
    error: 'Error',
    
    doc_context_loaded: 'Doc Context Loaded',
    doc_propose: 'Doc Propose',
    doc_consolidate: 'Doc Consolidate', 
    doc_interpret: 'Doc Interpret',
    doc_finalize: 'Doc Finalize',
    
    iter_context_loaded: 'Iter Context Loaded',
    iter_update: 'Iter Update',
    iter_convergence: 'Iter Convergence',
    
    draft: 'Draft',
    review: 'Under Review',
    approved: 'Approved',
    rejected: 'Rejected'
  }
  
  // Handle product stages
  if (stage.startsWith('product:')) {
    const kMatch = stage.match(/product:k=(\d+)/)
    if (kMatch) {
      return `Product k=${kMatch[1]}`
    }
    return 'Product'
  }
  
  return displayNames[stage] || stage.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

/**
 * Check if a stage represents a completed state
 */
export function isStageComplete(stage?: string | null): boolean {
  if (!stage) return false
  return ['final_resolved', 'doc_finalize', 'approved'].includes(stage)
}

/**
 * Check if a stage represents an error state
 */
export function isStageError(stage?: string | null): boolean {
  if (!stage) return false
  return ['error', 'rejected'].includes(stage)
}

/**
 * Get all available stage colors for legend display
 */
export function getAllStageColors(): Array<{ stage: string; color: StageColorVariant; hex: string; display: string }> {
  return Object.entries(STAGE_COLORS).map(([stage, color]) => ({
    stage,
    color,
    hex: getStageHexColor(stage),
    display: getStageDisplayName(stage)
  }))
}

/**
 * Get progress percentage for a stage (0-100)
 */
export function getStageProgress(stage?: string | null): number {
  if (!stage) return 0
  
  const progressMap: Record<string, number> = {
    axiom: 10,
    context_loaded: 25,
    doc_context_loaded: 25,
    sum: 50,
    element_wise: 50,
    doc_propose: 40,
    doc_consolidate: 60,
    interpretation: 75,
    doc_interpret: 75,
    final_resolved: 100,
    doc_finalize: 100,
    approved: 100,
    error: 0,
    rejected: 0
  }
  
  if (stage.startsWith('product:')) return 50
  
  return progressMap[stage] || 30
}