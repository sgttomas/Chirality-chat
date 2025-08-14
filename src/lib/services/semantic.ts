import { apiClient } from '../api'

export interface SemanticQuery {
  query: string
  context?: string[]
  options?: {
    maxResults?: number
    threshold?: number
    includeMetadata?: boolean
  }
}

export interface SemanticResult {
  id: string
  content: string
  score: number
  metadata?: {
    source?: string
    timestamp?: string
    [key: string]: unknown
  }
}

export interface SemanticResponse {
  results: SemanticResult[]
  totalCount: number
  query: string
  processingTime: number
}

export interface ChiralityAnalysis {
  structure: string
  chirality: 'R' | 'S' | 'achiral' | 'meso'
  confidence: number
  reasoning: string
  metadata?: {
    stereoCenters?: number
    symmetryElements?: string[]
    [key: string]: unknown
  }
}

export class SemanticService {
  // REST endpoints
  async search(query: SemanticQuery): Promise<SemanticResponse> {
    return apiClient.post<SemanticResponse>('/api/search', query)
  }

  async analyzeChirality(structure: string): Promise<ChiralityAnalysis> {
    return apiClient.post<ChiralityAnalysis>('/api/chirality/analyze', { structure })
  }

  async getKnowledgeGraph(entityId: string): Promise<unknown> {
    return apiClient.get(`/api/knowledge-graph/${entityId}`)
  }

  // GraphQL endpoint (for feature flag support)
  async graphql(query: string, variables?: Record<string, unknown>): Promise<unknown> {
    return apiClient.post('/graphql', { query, variables })
  }
}

export const semanticService = new SemanticService()