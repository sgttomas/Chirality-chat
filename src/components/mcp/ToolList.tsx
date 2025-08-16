'use client'

import { useState } from 'react'
import { Card, CardHeader, CardContent, Button, Badge, Input } from '@/components/ui'
import type { MCPServer, MCPTool } from '@/lib/mcp/types'
import { useMCPClient } from '@/hooks/useMCPClient'

interface ToolListProps {
  selectedServerId?: string
  onToolSelect?: (tool: MCPTool & { serverId: string; serverName: string }) => void
  selectedToolName?: string
}

export function ToolList({ selectedServerId, onToolSelect, selectedToolName }: ToolListProps) {
  const { servers, availableTools } = useMCPClient()
  const [filter, setFilter] = useState('')
  const [showOnlySelected, setShowOnlySelected] = useState(false)

  // Filter tools based on selected server and search filter
  const filteredTools = availableTools.filter(tool => {
    const matchesServer = !showOnlySelected || !selectedServerId || tool.serverId === selectedServerId
    const matchesFilter = !filter || 
      tool.name.toLowerCase().includes(filter.toLowerCase()) ||
      tool.description.toLowerCase().includes(filter.toLowerCase())
    
    return matchesServer && matchesFilter
  })

  // Group tools by server
  const toolsByServer = filteredTools.reduce((acc, tool) => {
    if (!acc[tool.serverId]) {
      acc[tool.serverId] = {
        server: servers.find(s => s.id === tool.serverId)!,
        tools: []
      }
    }
    acc[tool.serverId].tools.push(tool)
    return acc
  }, {} as Record<string, { server: MCPServer; tools: typeof filteredTools }>)

  const formatPropertyType = (property: any): string => {
    if (property.type === 'array' && property.items) {
      return `${property.type}<${formatPropertyType(property.items)}>`
    }
    if (property.enum) {
      return `enum(${property.enum.slice(0, 3).join(', ')}${property.enum.length > 3 ? '...' : ''})`
    }
    return property.type
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Available Tools</h3>
        <div className="text-sm text-gray-600">
          {filteredTools.length} tool{filteredTools.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Input
          placeholder="Filter tools..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="flex-1"
        />
        {selectedServerId && (
          <Button
            variant={showOnlySelected ? "default" : "ghost"}
            size="sm"
            onClick={() => setShowOnlySelected(!showOnlySelected)}
          >
            Selected Server Only
          </Button>
        )}
      </div>

      {/* Tools grouped by server */}
      <div className="space-y-4">
        {Object.keys(toolsByServer).length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              {filter ? 'No tools match your filter.' : 'No tools available. Connect to MCP servers to see their tools.'}
            </CardContent>
          </Card>
        ) : (
          Object.values(toolsByServer).map(({ server, tools }) => (
            <div key={server.id}>
              {/* Server header */}
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-2 h-2 rounded-full ${
                  server.status === 'connected' ? 'bg-green-500' : 'bg-gray-400'
                }`} />
                <h4 className="text-sm font-medium text-gray-700">{server.name}</h4>
                <Badge variant="default" size="sm">
                  {tools.length} tool{tools.length !== 1 ? 's' : ''}
                </Badge>
              </div>

              {/* Tools from this server */}
              <div className="space-y-2 ml-4">
                {tools.map((tool) => (
                  <Card
                    key={`${tool.serverId}-${tool.name}`}
                    className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                      selectedToolName === tool.name ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => onToolSelect?.(tool)}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        {/* Tool header */}
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium">{tool.name}</h5>
                          <Badge variant="secondary" size="sm">
                            {tool.serverId}
                          </Badge>
                        </div>

                        {/* Tool description */}
                        <p className="text-sm text-gray-600">{tool.description}</p>

                        {/* Input schema summary */}
                        {tool.inputSchema.properties && Object.keys(tool.inputSchema.properties).length > 0 && (
                          <div className="space-y-1">
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Parameters
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(tool.inputSchema.properties).map(([name, property]) => (
                                <Badge
                                  key={name}
                                  variant="default"
                                  size="sm"
                                  className={`text-xs ${
                                    tool.inputSchema.required?.includes(name) 
                                      ? 'border-red-300 text-red-700 bg-red-50' 
                                      : 'border-gray-300'
                                  }`}
                                >
                                  {name}: {formatPropertyType(property)}
                                  {tool.inputSchema.required?.includes(name) && '*'}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Required parameters note */}
                        {tool.inputSchema.required && tool.inputSchema.required.length > 0 && (
                          <div className="text-xs text-red-600">
                            * Required parameters: {tool.inputSchema.required.join(', ')}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Help text */}
      {filteredTools.length > 0 && (
        <div className="text-xs text-gray-500 text-center">
          Click on a tool to view details and invoke it
        </div>
      )}
    </div>
  )
}