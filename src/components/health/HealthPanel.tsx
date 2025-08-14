'use client'

import { Card, CardHeader, CardContent, Button } from '@/components/ui'
import { HealthIndicator } from './HealthIndicator'
import { useHealth } from '@/hooks/useHealth'

interface HealthPanelProps {
  compact?: boolean
}

export function HealthPanel({ compact = false }: HealthPanelProps) {
  const { data: health, isLoading, isError, error, refetch } = useHealth()

  if (isError) {
    return (
      <Card className={compact ? 'p-3' : ''}>
        <div className="flex items-center justify-between">
          <div className="text-red-600 text-sm">
            Health check failed: {error instanceof Error ? error.message : 'Unknown error'}
          </div>
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card className={compact ? 'p-3' : ''}>
        <div className="text-gray-500 text-sm">Checking system health...</div>
      </Card>
    )
  }

  if (!health) {
    return (
      <Card className={compact ? 'p-3' : ''}>
        <div className="text-gray-500 text-sm">No health data available</div>
      </Card>
    )
  }

  const overallStatusColor = 
    health.status === 'healthy' ? 'text-green-600' : 
    health.status === 'degraded' ? 'text-yellow-600' : 
    'text-red-600'

  if (compact) {
    return (
      <Card className="p-3">
        <div className="flex items-center justify-between">
          <div className={`text-sm font-medium ${overallStatusColor}`}>
            System: {health.status}
          </div>
          <div className="flex gap-3">
            <HealthIndicator health={health.services.database} serviceName="DB" compact />
            <HealthIndicator health={health.services.neo4j} serviceName="Neo4j" compact />
            <HealthIndicator health={health.services.api} serviceName="API" compact />
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">System Health</h3>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${overallStatusColor}`}>
              Overall: {health.status}
            </span>
            <Button variant="ghost" size="sm" onClick={() => refetch()}>
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <HealthIndicator health={health.services.database} serviceName="Database" />
          <HealthIndicator health={health.services.neo4j} serviceName="Neo4j" />
          <HealthIndicator health={health.services.api} serviceName="API Server" />
        </div>
        
        {health.metadata && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">System Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              {health.metadata.version && (
                <div>Version: {health.metadata.version}</div>
              )}
              {health.metadata.uptime && (
                <div>Uptime: {Math.floor(health.metadata.uptime / 3600)}h {Math.floor((health.metadata.uptime % 3600) / 60)}m</div>
              )}
              <div>Last updated: {new Date(health.timestamp).toLocaleString()}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}