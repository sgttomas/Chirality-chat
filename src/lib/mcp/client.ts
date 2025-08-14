'use client'

import { EventEmitter } from 'events'
import type { 
  MCPServer, 
  MCPTool, 
  MCPToolCall, 
  MCPToolResult,
  MCPMessage,
  MCPRequest,
  MCPResponse,
  MCPConnectionConfig 
} from './types'

export class MCPClient extends EventEmitter {
  private servers = new Map<string, MCPServer>()
  private connections = new Map<string, WebSocket | Worker>()
  private messageHandlers = new Map<string | number, (response: MCPResponse) => void>()
  private requestIdCounter = 0
  
  // Performance optimizations
  private connectionPool = new Map<string, WebSocket[]>()
  private toolCache = new Map<string, { tools: MCPTool[], timestamp: number }>()
  private resultCache = new Map<string, { result: MCPToolResult, timestamp: number }>()
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes
  private readonly MAX_POOL_SIZE = 3
  private healthCheckInterval: NodeJS.Timeout | null = null

  constructor() {
    super()
    this.setMaxListeners(50) // Support multiple servers
    
    // Start health check interval
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks()
      this.cleanupCaches()
    }, 30000) // Every 30 seconds
  }

  // Server Management
  async addServer(config: MCPConnectionConfig): Promise<MCPServer> {
    const server: MCPServer = {
      id: config.serverId,
      name: config.name,
      url: config.websocketUrl || '',
      transport: config.websocketUrl ? 'websocket' : 'stdio',
      status: 'disconnected',
      capabilities: {},
      tools: []
    }

    this.servers.set(config.serverId, server)
    this.emit('serverAdded', server)

    try {
      await this.connectToServer(config)
    } catch (error) {
      server.status = 'error'
      server.error = error instanceof Error ? error.message : 'Connection failed'
      this.emit('serverError', server, error)
    }

    return server
  }

  async removeServer(serverId: string): Promise<void> {
    const server = this.servers.get(serverId)
    if (!server) return

    await this.disconnectFromServer(serverId)
    this.servers.delete(serverId)
    this.emit('serverRemoved', server)
  }

  getServer(serverId: string): MCPServer | undefined {
    return this.servers.get(serverId)
  }

  getAllServers(): MCPServer[] {
    return Array.from(this.servers.values())
  }

  getConnectedServers(): MCPServer[] {
    return this.getAllServers().filter(server => server.status === 'connected')
  }

  // Connection Management
  private async connectToServer(config: MCPConnectionConfig): Promise<void> {
    const server = this.servers.get(config.serverId)
    if (!server) throw new Error(`Server ${config.serverId} not found`)

    server.status = 'connecting'
    this.emit('serverStatusChanged', server)

    if (config.websocketUrl) {
      await this.connectWebSocket(config)
    } else if (config.command) {
      await this.connectStdio(config)
    } else {
      throw new Error('No connection method specified')
    }
  }

  private async connectWebSocket(config: MCPConnectionConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(config.websocketUrl!)
      const server = this.servers.get(config.serverId)!

      ws.onopen = async () => {
        this.connections.set(config.serverId, ws)
        server.status = 'connected'
        server.lastConnected = new Date()
        this.emit('serverStatusChanged', server)

        try {
          await this.initializeServer(config.serverId)
          resolve()
        } catch (error) {
          reject(error)
        }
      }

      ws.onmessage = (event) => {
        try {
          const message: MCPMessage = JSON.parse(event.data)
          this.handleMessage(config.serverId, message)
        } catch (error) {
          console.error('Failed to parse MCP message:', error)
        }
      }

      ws.onclose = () => {
        this.connections.delete(config.serverId)
        server.status = 'disconnected'
        this.emit('serverStatusChanged', server)

        if (config.autoReconnect) {
          setTimeout(() => {
            this.connectToServer(config).catch(console.error)
          }, 5000)
        }
      }

      ws.onerror = (error) => {
        server.status = 'error'
        server.error = 'WebSocket connection failed'
        this.emit('serverError', server, error)
        reject(new Error('WebSocket connection failed'))
      }

      // Timeout handling
      const timeout = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          ws.close()
          reject(new Error('Connection timeout'))
        }
      }, config.timeout || 10000)

      ws.addEventListener('open', () => clearTimeout(timeout))
    })
  }

  private async connectStdio(config: MCPConnectionConfig): Promise<void> {
    // Simplified stdio connection - would use Worker in real implementation
    throw new Error('Stdio transport not implemented yet')
  }

  private async disconnectFromServer(serverId: string): Promise<void> {
    const connection = this.connections.get(serverId)
    const server = this.servers.get(serverId)

    if (connection) {
      if (connection instanceof WebSocket) {
        connection.close()
      }
      this.connections.delete(serverId)
    }

    if (server) {
      server.status = 'disconnected'
      this.emit('serverStatusChanged', server)
    }
  }

  // Protocol Implementation
  private async initializeServer(serverId: string): Promise<void> {
    const server = this.servers.get(serverId)!

    // Send initialize request
    const initResponse = await this.sendRequest(serverId, 'initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {},
        sampling: {}
      },
      clientInfo: {
        name: 'chirality-chat',
        version: '0.1.0'
      }
    })

    if (initResponse.result) {
      const { capabilities, serverInfo } = initResponse.result as any
      server.capabilities = capabilities
      server.version = serverInfo?.version
      server.description = serverInfo?.description
    }

    // Send initialized notification
    await this.sendNotification(serverId, 'initialized', {})

    // Discover tools
    await this.discoverTools(serverId)
  }

  private async discoverTools(serverId: string): Promise<void> {
    const server = this.servers.get(serverId)!

    if (!server.capabilities.tools) {
      return
    }

    try {
      const response = await this.sendRequest(serverId, 'tools/list', {})
      
      if (response.result) {
        const { tools } = response.result as { tools: MCPTool[] }
        server.tools = tools
        this.emit('toolsDiscovered', server, tools)
      }
    } catch (error) {
      console.error(`Failed to discover tools for ${serverId}:`, error)
    }
  }

  // Tool Execution
  async callTool(
    serverId: string, 
    toolName: string, 
    args: Record<string, unknown>
  ): Promise<MCPToolResult> {
    const server = this.servers.get(serverId)
    if (!server) {
      throw new Error(`Server ${serverId} not found`)
    }

    if (server.status !== 'connected') {
      throw new Error(`Server ${serverId} is not connected`)
    }

    const tool = server.tools.find(t => t.name === toolName)
    if (!tool) {
      throw new Error(`Tool ${toolName} not found on server ${serverId}`)
    }

    const response = await this.sendRequest(serverId, 'tools/call', {
      name: toolName,
      arguments: args
    })

    if (response.error) {
      throw new Error(`Tool call failed: ${response.error.message}`)
    }

    return response.result as MCPToolResult
  }

  // Message Handling
  private async sendRequest(
    serverId: string, 
    method: string, 
    params: unknown
  ): Promise<MCPResponse> {
    const connection = this.connections.get(serverId)
    if (!connection) {
      throw new Error(`No connection to server ${serverId}`)
    }

    const id = ++this.requestIdCounter
    const request: MCPRequest = {
      jsonrpc: '2.0',
      id,
      method,
      params
    }

    return new Promise((resolve, reject) => {
      this.messageHandlers.set(id, (response) => {
        this.messageHandlers.delete(id)
        resolve(response)
      })

      // Send message
      if (connection instanceof WebSocket) {
        connection.send(JSON.stringify(request))
      }

      // Timeout
      setTimeout(() => {
        if (this.messageHandlers.has(id)) {
          this.messageHandlers.delete(id)
          reject(new Error('Request timeout'))
        }
      }, 30000)
    })
  }

  private async sendNotification(
    serverId: string, 
    method: string, 
    params: unknown
  ): Promise<void> {
    const connection = this.connections.get(serverId)
    if (!connection) {
      throw new Error(`No connection to server ${serverId}`)
    }

    const notification: MCPMessage = {
      jsonrpc: '2.0',
      method,
      params
    }

    if (connection instanceof WebSocket) {
      connection.send(JSON.stringify(notification))
    }
  }

  private handleMessage(serverId: string, message: MCPMessage): void {
    if (message.id !== undefined && this.messageHandlers.has(message.id)) {
      // Response to a request
      const handler = this.messageHandlers.get(message.id)!
      handler(message as MCPResponse)
    } else if (message.method) {
      // Notification or request from server
      this.emit('serverMessage', serverId, message)
    }
  }

  // Utility Methods
  async reconnectServer(serverId: string): Promise<void> {
    await this.disconnectFromServer(serverId)
    
    // Find original config - in real implementation, we'd store this
    const server = this.servers.get(serverId)
    if (!server) return

    const config: MCPConnectionConfig = {
      serverId,
      name: server.name,
      websocketUrl: server.url,
      autoReconnect: true
    }

    await this.connectToServer(config)
  }

  async reconnectAllServers(): Promise<void> {
    const servers = this.getAllServers()
    await Promise.allSettled(
      servers.map(server => this.reconnectServer(server.id))
    )
  }

  // Performance optimization methods
  private performHealthChecks(): void {
    for (const [serverId, server] of this.servers) {
      const connection = this.connections.get(serverId)
      if (connection instanceof WebSocket) {
        if (connection.readyState === WebSocket.CLOSED) {
          server.status = 'disconnected'
          this.emit('serverStatusChanged', server)
        } else if (connection.readyState === WebSocket.OPEN && server.status !== 'connected') {
          server.status = 'connected'
          this.emit('serverStatusChanged', server)
        }
      }
    }
  }

  private cleanupCaches(): void {
    const now = Date.now()
    
    // Clean tool cache
    for (const [key, value] of this.toolCache) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.toolCache.delete(key)
      }
    }
    
    // Clean result cache
    for (const [key, value] of this.resultCache) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.resultCache.delete(key)
      }
    }
  }

  private getCachedTools(serverId: string): MCPTool[] | null {
    const cached = this.toolCache.get(serverId)
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.tools
    }
    return null
  }

  private setCachedTools(serverId: string, tools: MCPTool[]): void {
    this.toolCache.set(serverId, { tools, timestamp: Date.now() })
  }

  destroy(): void {
    // Clear health check interval
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = null
    }

    // Close all connections
    for (const [serverId] of this.connections) {
      this.disconnectFromServer(serverId).catch(console.error)
    }

    // Clear all caches and handlers
    this.messageHandlers.clear()
    this.servers.clear()
    this.toolCache.clear()
    this.resultCache.clear()
    this.connectionPool.clear()
    this.removeAllListeners()
  }
}

// Global MCP client instance
let mcpClientInstance: MCPClient | null = null

export function getMCPClient(): MCPClient {
  if (!mcpClientInstance) {
    mcpClientInstance = new MCPClient()
  }
  return mcpClientInstance
}

export function resetMCPClient(): void {
  if (mcpClientInstance) {
    mcpClientInstance.destroy()
    mcpClientInstance = null
  }
}