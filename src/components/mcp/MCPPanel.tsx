'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardContent, Button, Badge, Input } from '@/components/ui'
import { ServerList } from './ServerList'
import { ToolList } from './ToolList'
import { ToolInvocation } from './ToolInvocation'
import { ApprovalDialog } from './ApprovalDialog'
import { useMCPClient } from '@/hooks/useMCPClient'
import { getMCPDiscoveryService } from '@/lib/mcp/discovery'
import { getMCPApprovalManager, initializeDefaultApprovalRules } from '@/lib/mcp/approval'
import { CHIRALITY_MCP_TOOLS, ChiralityMCPTools } from '@/lib/mcp/chirality-tools'
import type { 
  MCPServer, 
  MCPTool, 
  MCPToolCall, 
  MCPApprovalFlow, 
  MCPConnectionConfig 
} from '@/lib/mcp/types'

interface MCPPanelProps {
  onToolResult?: (result: any) => void
  className?: string
}

export function MCPPanel({ onToolResult, className }: MCPPanelProps) {
  const { 
    servers, 
    connectedServers, 
    availableTools, 
    addServer, 
    isLoading, 
    error,
    clearError 
  } = useMCPClient()

  const [selectedServer, setSelectedServer] = useState<MCPServer | null>(null)
  const [selectedTool, setSelectedTool] = useState<(MCPTool & { serverId: string; serverName: string }) | null>(null)
  const [activeTab, setActiveTab] = useState<'servers' | 'tools' | 'invocation'>('servers')
  const [approvalFlow, setApprovalFlow] = useState<MCPApprovalFlow | null>(null)
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [chiralityTools] = useState(() => new ChiralityMCPTools())

  // Initialize default approval rules and Chirality tools on component mount
  useEffect(() => {
    initializeDefaultApprovalRules()
    
    // Add virtual Chirality server with built-in tools
    const chiralityServer: MCPConnectionConfig = {
      serverId: 'chirality-local',
      name: 'Chirality Framework'
    }
    
    // Add the server with tools
    addServer(chiralityServer).then((server) => {
      // Manually set the tools since it's a local server
      server.tools = CHIRALITY_MCP_TOOLS
      server.status = 'connected'
    }).catch(console.error)
  }, [addServer])

  // Auto-select first connected server
  useEffect(() => {
    if (connectedServers.length > 0 && !selectedServer) {
      setSelectedServer(connectedServers[0])
    }
  }, [connectedServers, selectedServer])

  // Switch to tools tab when server is selected
  const handleServerSelect = (server: MCPServer) => {
    setSelectedServer(server)
    setActiveTab('tools')
  }

  // Switch to invocation tab when tool is selected
  const handleToolSelect = (tool: MCPTool & { serverId: string; serverName: string }) => {
    setSelectedTool(tool)
    setActiveTab('invocation')
  }

  // Handle tool result with approval flow
  const handleToolResult = (result: any) => {
    onToolResult?.(result)
    // Could show success message or integrate with chat
  }

  const handleToolError = (error: string) => {
    console.error('Tool execution error:', error)
    // Could show error message or integrate with chat
  }

  // Add a sample server for demo purposes
  const handleAddSampleServer = async () => {
    const config: MCPConnectionConfig = {
      serverId: 'demo-server',
      name: 'Demo MCP Server',
      websocketUrl: 'ws://localhost:8080/mcp',
      autoReconnect: true,
      timeout: 10000
    }

    try {
      await addServer(config)
    } catch (error) {
      console.error('Failed to add demo server:', error)
    }
  }

  // Handle approval flow
  const handleApproval = (approve: boolean, remember?: boolean) => {
    if (approvalFlow) {
      const manager = getMCPApprovalManager()
      
      if (remember) {
        const toolName = approvalFlow.toolCall.toolName
        if (approve) {
          manager.addAutoApprovalRule(toolName)
        } else {
          manager.blockTool(toolName)
        }
      }

      // Continue with tool execution if approved
      if (approve) {
        // In a real implementation, this would continue the tool execution
        console.log('Tool execution approved:', approvalFlow.toolCall)
      } else {
        console.log('Tool execution rejected:', approvalFlow.toolCall)
      }

      setApprovalFlow(null)
      setShowApprovalDialog(false)
    }
  }

  return (
    <div className={`space-y-4 ${className || ''}`}>
      {/* Header with tab navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Model Context Protocol</h2>
            <div className="flex items-center gap-2">
              <Badge variant="default" size="sm">
                {connectedServers.length} connected
              </Badge>
              <Badge variant="default" size="sm">
                {availableTools.length} tools
              </Badge>
            </div>
          </div>
          
          {/* Tab navigation */}
          <div className="flex gap-1 border-b">
            <Button
              variant={activeTab === 'servers' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('servers')}
            >
              Servers
            </Button>
            <Button
              variant={activeTab === 'tools' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('tools')}
              disabled={connectedServers.length === 0}
            >
              Tools
            </Button>
            <Button
              variant={activeTab === 'invocation' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('invocation')}
              disabled={!selectedTool}
            >
              Invoke
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Error display */}
      {error && (
        <Card className="border-red-200">
          <CardContent className="p-4 bg-red-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-red-700">
                <strong>Error:</strong> {error}
              </div>
              <Button size="sm" variant="ghost" onClick={clearError}>
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab content */}
      {activeTab === 'servers' && (
        <div className="space-y-4">
          <ServerList
            onServerSelect={handleServerSelect}
            selectedServerId={selectedServer?.id}
          />
          
          {/* Quick actions */}
          <Card>
            <CardHeader>
              <h3 className="font-medium">Quick Actions</h3>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={handleAddSampleServer}
                disabled={isLoading}
              >
                Add Demo Server
              </Button>
              
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  const discovery = getMCPDiscoveryService()
                  discovery.discoverLocalServers().then(configs => {
                    console.log('Discovered servers:', configs)
                  })
                }}
                disabled={isLoading}
              >
                Discover Local Servers
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'tools' && (
        <ToolList
          selectedServerId={selectedServer?.id}
          onToolSelect={handleToolSelect}
          selectedToolName={selectedTool?.name}
        />
      )}

      {activeTab === 'invocation' && selectedTool && (
        <ToolInvocation
          tool={selectedTool}
          onResult={handleToolResult}
          onError={handleToolError}
        />
      )}

      {/* Getting started message */}
      {connectedServers.length === 0 && activeTab === 'servers' && (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="space-y-4">
              <div className="text-gray-500">
                <h3 className="font-medium mb-2">No MCP Servers Connected</h3>
                <p className="text-sm">
                  Connect to MCP servers to access their tools and capabilities.
                </p>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>Getting Started:</strong></p>
                <ol className="list-decimal list-inside space-y-1 text-left max-w-md mx-auto">
                  <li>Add a demo server to try it out</li>
                  <li>Or discover servers running locally</li>
                  <li>Configure WebSocket or stdio connections</li>
                  <li>Browse available tools</li>
                  <li>Invoke tools with parameters</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approval dialog */}
      {approvalFlow && (
        <ApprovalDialog
          approval={approvalFlow}
          onApprove={(remember) => handleApproval(true, remember)}
          onReject={(remember) => handleApproval(false, remember)}
          onCancel={() => {
            setApprovalFlow(null)
            setShowApprovalDialog(false)
          }}
          isVisible={showApprovalDialog}
        />
      )}
    </div>
  )
}