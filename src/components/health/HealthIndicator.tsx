import { Badge } from '@/components/ui'
import type { ServiceHealth } from '@/lib/services'

interface HealthIndicatorProps {
  health: ServiceHealth
  serviceName: string
  compact?: boolean
}

export function HealthIndicator({ health, serviceName, compact = false }: HealthIndicatorProps) {
  const getStatusColor = (status: ServiceHealth['status']) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800'
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800'
      case 'unhealthy':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: ServiceHealth['status']) => {
    switch (status) {
      case 'healthy':
        return '✓'
      case 'degraded':
        return '⚠'
      case 'unhealthy':
        return '✗'
      default:
        return '?'
    }
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${
          health.status === 'healthy' ? 'bg-green-500' : 
          health.status === 'degraded' ? 'bg-yellow-500' : 
          'bg-red-500'
        }`} />
        <span className="text-sm text-gray-600">{serviceName}</span>
        {health.responseTime && (
          <span className="text-xs text-gray-400">({health.responseTime}ms)</span>
        )}
      </div>
    )
  }

  return (
    <div className="p-3 border rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-gray-900">{serviceName}</h4>
        <Badge className={getStatusColor(health.status)}>
          {getStatusIcon(health.status)} {health.status}
        </Badge>
      </div>
      
      <div className="text-sm text-gray-600 space-y-1">
        <div>Last checked: {new Date(health.lastChecked).toLocaleTimeString()}</div>
        {health.responseTime && (
          <div>Response time: {health.responseTime}ms</div>
        )}
        {health.error && (
          <div className="text-red-600 text-xs mt-2">{health.error}</div>
        )}
      </div>
    </div>
  )
}