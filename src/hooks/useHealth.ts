import { useQuery } from '@tanstack/react-query'
import { healthService, type HealthStatus, type ServiceHealth } from '@/lib/services'

export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => healthService.getHealth(),
    refetchInterval: 30000, // Poll every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  })
}

export function useServiceHealth(serviceName: string) {
  return useQuery({
    queryKey: ['health', serviceName],
    queryFn: () => healthService.getServiceHealth(serviceName),
    refetchInterval: 30000,
    staleTime: 10000,
  })
}