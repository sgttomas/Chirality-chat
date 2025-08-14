'use client'

import type { MCPConnectionConfig, MCPServer } from './types'

// Predefined MCP server configurations for common tools
export const WELL_KNOWN_SERVERS: MCPConnectionConfig[] = [
  {
    serverId: 'filesystem',
    name: 'File System Tools',
    command: 'npx',
    args: ['@modelcontextprotocol/server-filesystem', '/path/to/files'],
    env: {},
    autoReconnect: true,
    timeout: 10000
  },
  {
    serverId: 'brave-search',
    name: 'Brave Search',
    command: 'npx',
    args: ['@modelcontextprotocol/server-brave-search'],
    env: {
      BRAVE_API_KEY: process.env.BRAVE_API_KEY || ''
    },
    autoReconnect: true,
    timeout: 10000
  },
  {
    serverId: 'sqlite',
    name: 'SQLite Database',
    command: 'npx',
    args: ['@modelcontextprotocol/server-sqlite', '/path/to/database.db'],
    env: {},
    autoReconnect: true,
    timeout: 10000
  },
  {
    serverId: 'git',
    name: 'Git Operations',
    command: 'npx',
    args: ['@modelcontextprotocol/server-git'],
    env: {},
    autoReconnect: true,
    timeout: 10000
  }
]

// Server discovery and management utilities
export class MCPDiscoveryService {
  private discoveredServers: Map<string, MCPConnectionConfig> = new Map()
  private serverHealth: Map<string, boolean> = new Map()

  constructor() {
    // Initialize with well-known servers
    WELL_KNOWN_SERVERS.forEach(server => {
      this.discoveredServers.set(server.serverId, server)
    })
  }

  // Get all discovered server configurations
  getDiscoveredServers(): MCPConnectionConfig[] {
    return Array.from(this.discoveredServers.values())
  }

  // Get server configuration by ID
  getServerConfig(serverId: string): MCPConnectionConfig | undefined {
    return this.discoveredServers.get(serverId)
  }

  // Add a custom server configuration
  addCustomServer(config: MCPConnectionConfig): void {
    this.discoveredServers.set(config.serverId, config)
  }

  // Remove a server configuration
  removeServerConfig(serverId: string): void {
    this.discoveredServers.delete(serverId)
    this.serverHealth.delete(serverId)
  }

  // Discover servers in common locations
  async discoverLocalServers(): Promise<MCPConnectionConfig[]> {
    const discoveredConfigs: MCPConnectionConfig[] = []

    try {
      // Check for MCP servers in package.json scripts
      const packageJsonConfigs = await this.discoverFromPackageJson()
      discoveredConfigs.push(...packageJsonConfigs)

      // Check for .mcp directory configuration
      const mcpDirConfigs = await this.discoverFromMCPDirectory()
      discoveredConfigs.push(...mcpDirConfigs)

      // Check environment variables for server configs
      const envConfigs = this.discoverFromEnvironment()
      discoveredConfigs.push(...envConfigs)

    } catch (error) {
      console.warn('Server discovery failed:', error)
    }

    // Update discovered servers map
    discoveredConfigs.forEach(config => {
      this.discoveredServers.set(config.serverId, config)
    })

    return discoveredConfigs
  }

  // Discover servers from package.json scripts
  private async discoverFromPackageJson(): Promise<MCPConnectionConfig[]> {
    try {
      // In a real implementation, we would read package.json
      // For now, return empty array as we can't access filesystem in browser
      return []
    } catch {
      return []
    }
  }

  // Discover servers from .mcp directory
  private async discoverFromMCPDirectory(): Promise<MCPConnectionConfig[]> {
    try {
      // In a real implementation, we would read .mcp/config.json
      // For now, return empty array as we can't access filesystem in browser
      return []
    } catch {
      return []
    }
  }

  // Discover servers from environment variables
  private discoverFromEnvironment(): MCPConnectionConfig[] {
    const configs: MCPConnectionConfig[] = []

    // Check for MCP_SERVERS environment variable
    const mcpServersEnv = process.env.MCP_SERVERS
    if (mcpServersEnv) {
      try {
        const serverConfigs = JSON.parse(mcpServersEnv)
        if (Array.isArray(serverConfigs)) {
          configs.push(...serverConfigs)
        }
      } catch (error) {
        console.warn('Failed to parse MCP_SERVERS environment variable:', error)
      }
    }

    return configs
  }

  // Health check for server configurations
  async checkServerHealth(serverId: string): Promise<boolean> {
    const config = this.discoveredServers.get(serverId)
    if (!config) return false

    try {
      // For stdio servers, check if command exists
      if (config.command) {
        // In browser environment, we can't actually check command availability
        // This would be implemented differently in a Node.js environment
        return true
      }

      // For WebSocket servers, try to connect
      if (config.websocketUrl) {
        return await this.checkWebSocketHealth(config.websocketUrl)
      }

      return false
    } catch (error) {
      console.warn(`Health check failed for server ${serverId}:`, error)
      return false
    }
  }

  private async checkWebSocketHealth(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      const ws = new WebSocket(url)
      const timeout = setTimeout(() => {
        ws.close()
        resolve(false)
      }, 5000)

      ws.onopen = () => {
        clearTimeout(timeout)
        ws.close()
        resolve(true)
      }

      ws.onerror = () => {
        clearTimeout(timeout)
        resolve(false)
      }
    })
  }

  // Get recommended servers based on context
  getRecommendedServers(context?: {
    hasFileSystem?: boolean
    hasDatabase?: boolean
    hasGitRepo?: boolean
    needsSearch?: boolean
  }): MCPConnectionConfig[] {
    const recommendations: MCPConnectionConfig[] = []

    if (context?.hasFileSystem) {
      const fsServer = this.discoveredServers.get('filesystem')
      if (fsServer) recommendations.push(fsServer)
    }

    if (context?.hasDatabase) {
      const sqliteServer = this.discoveredServers.get('sqlite')
      if (sqliteServer) recommendations.push(sqliteServer)
    }

    if (context?.hasGitRepo) {
      const gitServer = this.discoveredServers.get('git')
      if (gitServer) recommendations.push(gitServer)
    }

    if (context?.needsSearch) {
      const searchServer = this.discoveredServers.get('brave-search')
      if (searchServer) recommendations.push(searchServer)
    }

    // If no context provided, return common servers
    if (!context) {
      return WELL_KNOWN_SERVERS.slice(0, 2) // Return first 2 as defaults
    }

    return recommendations
  }

  // Validate server configuration
  validateServerConfig(config: MCPConnectionConfig): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (!config.serverId?.trim()) {
      errors.push('Server ID is required')
    }

    if (!config.name?.trim()) {
      errors.push('Server name is required')
    }

    if (!config.command && !config.websocketUrl) {
      errors.push('Either command or websocket URL must be specified')
    }

    if (config.websocketUrl && !this.isValidWebSocketUrl(config.websocketUrl)) {
      errors.push('Invalid WebSocket URL format')
    }

    if (config.timeout && (config.timeout < 1000 || config.timeout > 60000)) {
      errors.push('Timeout must be between 1000ms and 60000ms')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  private isValidWebSocketUrl(url: string): boolean {
    try {
      const parsed = new URL(url)
      return parsed.protocol === 'ws:' || parsed.protocol === 'wss:'
    } catch {
      return false
    }
  }
}

// Global discovery service instance
let discoveryServiceInstance: MCPDiscoveryService | null = null

export function getMCPDiscoveryService(): MCPDiscoveryService {
  if (!discoveryServiceInstance) {
    discoveryServiceInstance = new MCPDiscoveryService()
  }
  return discoveryServiceInstance
}