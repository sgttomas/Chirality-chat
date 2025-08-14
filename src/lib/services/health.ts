import { apiClient } from '../api'

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: string
  services: {
    database: ServiceHealth
    neo4j: ServiceHealth
    api: ServiceHealth
  }
  metadata?: {
    version?: string
    uptime?: number
    [key: string]: unknown
  }
}

export interface ServiceHealth {
  status: 'healthy' | 'unhealthy' | 'degraded'
  responseTime?: number
  lastChecked: string
  error?: string
}

export class HealthService {
  async getHealth(): Promise<HealthStatus> {
    return apiClient.get<HealthStatus>('/health')
  }

  async getServiceHealth(serviceName: string): Promise<ServiceHealth> {
    return apiClient.get<ServiceHealth>(`/health/${serviceName}`)
  }
}

export const healthService = new HealthService()