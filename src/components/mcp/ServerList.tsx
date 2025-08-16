'use client'

import { useState } from 'react'
import { Card, CardHeader, CardContent, Button, Badge, Input } from '@/components/ui'
import type { MCPServer } from '@/lib/mcp/types'
import { useMCPClient } from '@/hooks/useMCPClient'

interface ServerListProps {
  onServerSelect?: (server: MCPServer) => void
  selectedServerId?: string
}

export function ServerList({ onServerSelect, selectedServerId }: ServerListProps) {
  const { servers, connectedServers, reconnectServer, removeServer, isLoading } = useMCPClient()
  const [filter, setFilter] = useState('')
  const [showOnlyConnected, setShowOnlyConnected] = useState(false)

  const filteredServers = servers.filter(server => {
    const matchesFilter = !filter || 
      server.name.toLowerCase().includes(filter.toLowerCase()) ||
      server.id.toLowerCase().includes(filter.toLowerCase())
    
    const matchesStatus = !showOnlyConnected || server.status === 'connected'
    
    return matchesFilter && matchesStatus
  })

  const getStatusColor = (status: MCPServer['status']) => {
    switch (status) {
      case 'connected': return 'bg-green-500'
      case 'connecting': return 'bg-yellow-500'
      case 'disconnected': return 'bg-gray-500'
      case 'error': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status: MCPServer['status']) => {
    switch (status) {
      case 'connected': return 'Connected'
      case 'connecting': return 'Connecting...'
      case 'disconnected': return 'Disconnected'
      case 'error': return 'Error'
      default: return 'Unknown'
    }
  }

  return (
    <div className="space-y-4">
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">MCP Servers</h3>
        <div className="text-sm text-gray-600">
          {connectedServers.length}/{servers.length} connected
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Input
          placeholder="Filter servers..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="flex-1"
        />
        <Button
          variant={showOnlyConnected ? "default" : "ghost"}
          size="sm"
          onClick={() => setShowOnlyConnected(!showOnlyConnected)}
        >
          Connected Only
        </Button>
      </div>

      {/* Server list */}
      <div className="space-y-2">
        {filteredServers.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              {filter ? 'No servers match your filter.' : 'No MCP servers configured.'}
            </CardContent>
          </Card>
        ) : (
          filteredServers.map((server) => (
            <Card 
              key={server.id}
              className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                selectedServerId === server.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => onServerSelect?.(server)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Status indicator */}
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(server.status)}`} />
                    
                    <div>
                      <h4 className="font-medium">{server.name}</h4>
                      <div className="text-sm text-gray-600 flex items-center gap-2">
                        <span>{server.id}</span>
                        <Badge variant="secondary" size="sm">
                          {server.transport}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Tool count */}
                    {server.tools.length > 0 && (
                      <Badge variant="default" size="sm">
                        {server.tools.length} tool{server.tools.length !== 1 ? 's' : ''}
                      </Badge>
                    )}

                    {/* Status badge */}
                    <Badge 
                      variant={server.status === 'connected' ? 'default' : 'secondary'}
                      size="sm"
                    >
                      {getStatusText(server.status)}
                    </Badge>

                    {/* Actions */}
                    <div className="flex gap-1">
                      {server.status === 'disconnected' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            reconnectServer(server.id)
                          }}
                          disabled={isLoading}
                        >
                          Connect
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeServer(server.id)
                        }}
                        disabled={isLoading}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Error message */}
                {server.error && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                    {server.error}
                  </div>
                )}

                {/* Description */}
                {server.description && (
                  <div className="mt-2 text-sm text-gray-600">
                    {server.description}
                  </div>
                )}

                {/* Connection info */}
                {server.lastConnected && (
                  <div className="mt-2 text-xs text-gray-500">
                    Last connected: {server.lastConnected.toLocaleString()}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Summary */}
      {servers.length > 0 && (
        <div className="text-xs text-gray-500 text-center">
          Total tools available: {connectedServers.reduce((sum, server) => sum + server.tools.length, 0)}
        </div>
      )}
    </div>
  )
}