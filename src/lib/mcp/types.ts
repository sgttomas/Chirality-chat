// MCP Types and Interfaces

export interface MCPServer {
  id: string
  name: string
  description?: string
  version?: string
  url: string
  transport: 'stdio' | 'websocket' | 'sse'
  status: 'connected' | 'disconnected' | 'connecting' | 'error'
  capabilities: MCPCapabilities
  tools: MCPTool[]
  lastConnected?: Date
  error?: string
}

export interface MCPCapabilities {
  tools?: boolean
  resources?: boolean
  prompts?: boolean
  sampling?: boolean
}

export interface MCPTool {
  name: string
  description: string
  inputSchema: {
    type: 'object'
    properties: Record<string, MCPProperty>
    required?: string[]
  }
}

export interface MCPProperty {
  type: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object'
  description?: string
  required?: boolean
  items?: MCPProperty
  minimum?: number
  maximum?: number
  enum?: string[]
  properties?: Record<string, MCPProperty>
}

export interface MCPToolCall {
  id: string
  serverId: string
  toolName: string
  arguments: Record<string, unknown>
  status: 'pending' | 'approved' | 'rejected' | 'executing' | 'completed' | 'failed'
  timestamp: Date
  approvedBy?: string
  result?: MCPToolResult
  error?: string
}

export interface MCPToolResult {
  content: Array<{
    type: 'text' | 'image' | 'resource'
    text?: string
    data?: string
    mimeType?: string
  }>
  isError?: boolean
}

export interface MCPConnectionConfig {
  serverId: string
  name: string
  command?: string
  args?: string[]
  env?: Record<string, string>
  websocketUrl?: string
  autoReconnect?: boolean
  timeout?: number
}

// MCP Protocol Messages
export interface MCPMessage {
  jsonrpc: '2.0'
  id?: string | number
  method?: string
  params?: unknown
  result?: unknown
  error?: {
    code: number
    message: string
    data?: unknown
  }
}

export interface MCPRequest extends MCPMessage {
  method: string
  params?: unknown
}

export interface MCPResponse extends MCPMessage {
  result?: unknown
  error?: {
    code: number
    message: string
    data?: unknown
  }
}

// UI State Types
export interface MCPUIState {
  selectedServer: string | null
  showApprovalDialog: boolean
  pendingToolCall: MCPToolCall | null
  toolCallHistory: MCPToolCall[]
  serverFilter: string
  showOnlyConnected: boolean
}

export interface MCPApprovalFlow {
  toolCall: MCPToolCall
  requiresApproval: boolean
  autoApprove: boolean
  riskLevel: 'low' | 'medium' | 'high'
  riskFactors: string[]
}