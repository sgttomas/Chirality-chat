'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getMCPClient } from '@/lib/mcp/client'
import type { 
  MCPServer, 
  MCPTool, 
  MCPToolCall, 
  MCPToolResult,
  MCPConnectionConfig,
  MCPMessage
} from '@/lib/mcp/types'

export interface UseMCPClientOptions {
  autoConnect?: boolean
  onServerAdded?: (server: MCPServer) => void
  onServerRemoved?: (server: MCPServer) => void
  onToolsDiscovered?: (server: MCPServer, tools: MCPTool[]) => void
  onServerError?: (server: MCPServer, error: unknown) => void
}

export function useMCPClient(options: UseMCPClientOptions = {}) {
  const [servers, setServers] = useState<MCPServer[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const clientRef = useRef(getMCPClient())

  // Update servers state when client changes
  const refreshServers = useCallback(() => {
    const currentServers = clientRef.current.getAllServers()
    setServers([...currentServers])
  }, [])

  useEffect(() => {
    const client = clientRef.current

    // Event handlers
    const handleServerAdded = (server: MCPServer) => {
      refreshServers()
      options.onServerAdded?.(server)
    }

    const handleServerRemoved = (server: MCPServer) => {
      refreshServers()
      options.onServerRemoved?.(server)
    }

    const handleServerStatusChanged = (server: MCPServer) => {
      refreshServers()
    }

    const handleToolsDiscovered = (server: MCPServer, tools: MCPTool[]) => {
      refreshServers()
      options.onToolsDiscovered?.(server, tools)
    }

    const handleServerError = (server: MCPServer, error: unknown) => {
      refreshServers()
      options.onServerError?.(server, error)
      setError(`Server ${server.name}: ${error}`)
    }

    // Register event listeners
    client.on('serverAdded', handleServerAdded)
    client.on('serverRemoved', handleServerRemoved)
    client.on('serverStatusChanged', handleServerStatusChanged)
    client.on('toolsDiscovered', handleToolsDiscovered)
    client.on('serverError', handleServerError)

    // Initial refresh
    refreshServers()

    return () => {
      client.off('serverAdded', handleServerAdded)
      client.off('serverRemoved', handleServerRemoved)
      client.off('serverStatusChanged', handleServerStatusChanged)
      client.off('toolsDiscovered', handleToolsDiscovered)
      client.off('serverError', handleServerError)
    }
  }, [refreshServers, options])

  // Server management functions
  const addServer = useCallback(async (config: MCPConnectionConfig): Promise<MCPServer> => {
    setIsLoading(true)
    setError(null)

    try {
      const server = await clientRef.current.addServer(config)
      return server
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add server'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const removeServer = useCallback(async (serverId: string): Promise<void> => {
    setIsLoading(true)
    setError(null)

    try {
      await clientRef.current.removeServer(serverId)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove server'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const reconnectServer = useCallback(async (serverId: string): Promise<void> => {
    setIsLoading(true)
    setError(null)

    try {
      await clientRef.current.reconnectServer(serverId)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reconnect server'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const reconnectAllServers = useCallback(async (): Promise<void> => {
    setIsLoading(true)
    setError(null)

    try {
      await clientRef.current.reconnectAllServers()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reconnect servers'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Tool execution
  const callTool = useCallback(async (
    serverId: string,
    toolName: string,
    args: Record<string, unknown>
  ): Promise<MCPToolResult> => {
    setError(null)
    
    try {
      return await clientRef.current.callTool(serverId, toolName, args)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Tool call failed'
      setError(errorMessage)
      throw err
    }
  }, [])

  // Computed values
  const connectedServers = servers.filter(s => s.status === 'connected')
  const availableTools = connectedServers.flatMap(server => 
    server.tools.map(tool => ({ ...tool, serverId: server.id, serverName: server.name }))
  )

  const getServer = useCallback((serverId: string) => {
    return clientRef.current.getServer(serverId)
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    // State
    servers,
    connectedServers,
    availableTools,
    isLoading,
    error,

    // Actions
    addServer,
    removeServer,
    reconnectServer,
    reconnectAllServers,
    callTool,
    getServer,
    clearError,

    // Utilities
    client: clientRef.current
  }
}