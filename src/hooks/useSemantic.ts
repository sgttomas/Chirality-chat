import { useMutation, useQuery } from '@tanstack/react-query'
import { semanticService, type SemanticQuery, type SemanticResponse, type ChiralityAnalysis } from '@/lib/services'

export function useSemanticSearch() {
  return useMutation({
    mutationFn: (query: SemanticQuery) => semanticService.search(query),
  })
}

export function useChiralityAnalysis() {
  return useMutation({
    mutationFn: (structure: string) => semanticService.analyzeChirality(structure),
  })
}

export function useKnowledgeGraph(entityId: string | null) {
  return useQuery({
    queryKey: ['knowledge-graph', entityId],
    queryFn: () => semanticService.getKnowledgeGraph(entityId!),
    enabled: !!entityId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}

export function useGraphQL() {
  return useMutation({
    mutationFn: ({ query, variables }: { query: string; variables?: Record<string, unknown> }) =>
      semanticService.graphql(query, variables),
  })
}