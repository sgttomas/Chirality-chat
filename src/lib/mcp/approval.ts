'use client'

import type { MCPTool, MCPToolCall, MCPApprovalFlow } from './types'
import { storage } from '@/lib/storage'

// Risk assessment for tool calls
export class MCPRiskAssessment {
  static assessToolRisk(tool: MCPTool, args: Record<string, unknown>): {
    riskLevel: 'low' | 'medium' | 'high'
    riskFactors: string[]
    requiresApproval: boolean
  } {
    const riskFactors: string[] = []
    let riskLevel: 'low' | 'medium' | 'high' = 'low'

    // High-risk tool patterns
    const highRiskTools = [
      'execute', 'run', 'shell', 'command', 'bash', 'cmd',
      'delete', 'remove', 'destroy', 'drop',
      'write', 'create', 'modify', 'update',
      'install', 'uninstall', 'download'
    ]

    const mediumRiskTools = [
      'read', 'list', 'search', 'query', 'fetch', 'get'
    ]

    // Check tool name for risk indicators
    const toolNameLower = tool.name.toLowerCase()
    
    if (highRiskTools.some(risk => toolNameLower.includes(risk))) {
      riskLevel = 'high'
      riskFactors.push(`High-risk tool: ${tool.name}`)
    } else if (mediumRiskTools.some(risk => toolNameLower.includes(risk))) {
      riskLevel = 'medium'
      riskFactors.push(`Medium-risk tool: ${tool.name}`)
    }

    // Check arguments for sensitive patterns
    const sensitivePatterns = [
      'password', 'secret', 'key', 'token', 'credential',
      'admin', 'root', 'sudo', 'system', 'config'
    ]

    for (const [argName, argValue] of Object.entries(args)) {
      const argStr = String(argValue).toLowerCase()
      const nameStr = argName.toLowerCase()

      if (sensitivePatterns.some(pattern => 
        nameStr.includes(pattern) || argStr.includes(pattern)
      )) {
        riskLevel = riskLevel === 'low' ? 'medium' : 'high'
        riskFactors.push(`Sensitive argument: ${argName}`)
      }

      // Check for file system paths
      if (typeof argValue === 'string' && (
        argValue.includes('/') || argValue.includes('\\') || 
        argValue.includes('..') || argValue.includes('~')
      )) {
        if (riskLevel === 'low') riskLevel = 'medium'
        riskFactors.push(`File system path detected: ${argName}`)
      }

      // Check for URLs
      if (typeof argValue === 'string' && 
          (argValue.startsWith('http://') || argValue.startsWith('https://'))
      ) {
        if (riskLevel === 'low') riskLevel = 'medium'
        riskFactors.push(`External URL detected: ${argName}`)
      }
    }

    // Default to requiring approval for medium and high risk
    const requiresApproval = riskLevel !== 'low'

    return { riskLevel, riskFactors, requiresApproval }
  }

  static formatRiskLevel(level: 'low' | 'medium' | 'high'): string {
    switch (level) {
      case 'low': return '🟢 Low Risk'
      case 'medium': return '🟡 Medium Risk'
      case 'high': return '🔴 High Risk'
    }
  }
}

// Approval flow management
export class MCPApprovalManager {
  private approvalRules: Map<string, (tool: MCPTool, args: Record<string, unknown>) => boolean> = new Map()
  private autoApprovedTools: Set<string> = new Set()
  private blockedTools: Set<string> = new Set()

  constructor() {
    this.loadSavedRules()
  }

  // Add auto-approval rule for a tool
  addAutoApprovalRule(
    toolName: string, 
    rule?: (tool: MCPTool, args: Record<string, unknown>) => boolean
  ): void {
    if (rule) {
      this.approvalRules.set(toolName, rule)
    } else {
      this.autoApprovedTools.add(toolName)
    }
    this.saveRules()
  }

  // Remove auto-approval rule
  removeAutoApprovalRule(toolName: string): void {
    this.approvalRules.delete(toolName)
    this.autoApprovedTools.delete(toolName)
    this.saveRules()
  }

  // Block a tool from execution
  blockTool(toolName: string): void {
    this.blockedTools.add(toolName)
    this.saveRules()
  }

  // Unblock a tool
  unblockTool(toolName: string): void {
    this.blockedTools.delete(toolName)
    this.saveRules()
  }

  // Check if a tool call should be auto-approved
  shouldAutoApprove(tool: MCPTool, args: Record<string, unknown>): boolean {
    // Never auto-approve blocked tools
    if (this.blockedTools.has(tool.name)) {
      return false
    }

    // Check custom rules first
    const customRule = this.approvalRules.get(tool.name)
    if (customRule) {
      try {
        return customRule(tool, args)
      } catch (error) {
        console.error(`Error in approval rule for ${tool.name}:`, error)
        return false
      }
    }

    // Check simple auto-approved tools
    if (this.autoApprovedTools.has(tool.name)) {
      return true
    }

    // Default risk-based approval
    const assessment = MCPRiskAssessment.assessToolRisk(tool, args)
    return assessment.riskLevel === 'low'
  }

  // Create approval flow for a tool call
  createApprovalFlow(toolCall: MCPToolCall, tool: MCPTool): MCPApprovalFlow {
    const assessment = MCPRiskAssessment.assessToolRisk(tool, toolCall.arguments)
    const autoApprove = this.shouldAutoApprove(tool, toolCall.arguments)

    return {
      toolCall,
      requiresApproval: assessment.requiresApproval && !autoApprove,
      autoApprove,
      riskLevel: assessment.riskLevel,
      riskFactors: assessment.riskFactors
    }
  }

  // Get all approval rules for management UI
  getApprovalRules(): {
    autoApproved: string[]
    blocked: string[]
    customRules: string[]
  } {
    return {
      autoApproved: Array.from(this.autoApprovedTools),
      blocked: Array.from(this.blockedTools),
      customRules: Array.from(this.approvalRules.keys())
    }
  }

  // Save rules to storage
  private async saveRules(): Promise<void> {
    try {
      const rules = {
        autoApproved: Array.from(this.autoApprovedTools),
        blocked: Array.from(this.blockedTools),
        // Note: custom rule functions cannot be serialized
        customRules: Array.from(this.approvalRules.keys())
      }
      
      // Use storage adapter to save rules
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('mcp-approval-rules', JSON.stringify(rules))
      }
    } catch (error) {
      console.error('Failed to save approval rules:', error)
    }
  }

  // Load rules from storage
  private async loadSavedRules(): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem('mcp-approval-rules')
        if (saved) {
          const rules = JSON.parse(saved)
          
          if (rules.autoApproved) {
            rules.autoApproved.forEach((tool: string) => {
              this.autoApprovedTools.add(tool)
            })
          }
          
          if (rules.blocked) {
            rules.blocked.forEach((tool: string) => {
              this.blockedTools.add(tool)
            })
          }

          // Custom rules would need to be re-registered by the application
        }
      }
    } catch (error) {
      console.error('Failed to load approval rules:', error)
    }
  }

  // Clear all approval rules
  clearAllRules(): void {
    this.approvalRules.clear()
    this.autoApprovedTools.clear()
    this.blockedTools.clear()
    this.saveRules()
  }
}

// Global approval manager instance
let approvalManagerInstance: MCPApprovalManager | null = null

export function getMCPApprovalManager(): MCPApprovalManager {
  if (!approvalManagerInstance) {
    approvalManagerInstance = new MCPApprovalManager()
  }
  return approvalManagerInstance
}

// Pre-defined safe tools that can be auto-approved
export const SAFE_TOOLS = [
  'list', 'get', 'read', 'search', 'query', 'find',
  'help', 'info', 'describe', 'explain', 'status'
]

// Pre-defined dangerous tools that should always require approval
export const DANGEROUS_TOOLS = [
  'execute', 'run', 'shell', 'command', 'bash',
  'delete', 'remove', 'destroy', 'drop', 'unlink',
  'write', 'create', 'mkdir', 'touch',
  'install', 'uninstall', 'download', 'upload'
]

// Initialize default rules
export function initializeDefaultApprovalRules(): void {
  const manager = getMCPApprovalManager()
  
  // Auto-approve safe tools
  SAFE_TOOLS.forEach(tool => {
    manager.addAutoApprovalRule(tool)
  })
  
  // Block dangerous tools by default
  DANGEROUS_TOOLS.forEach(tool => {
    manager.blockTool(tool)
  })
}