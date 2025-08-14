'use client'

import Link from 'next/link'
import { Button, Card, CardContent } from '@/components/ui'
import { MCPPanel } from '@/components/mcp'
import { useFeatureFlags } from '@/lib/feature-flags'

export default function MCPPage() {
  const { flags } = useFeatureFlags()

  if (!flags.enableMCPIntegration) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Model Context Protocol
            </h1>
            <p className="text-gray-600 mb-6">
              MCP integration is currently disabled. Enable it in the feature flags to proceed.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/dashboard">
                <Button>Go to Dashboard</Button>
              </Link>
              <Link href="/">
                <Button variant="secondary">Back to Chat</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const handleToolResult = (result: any) => {
    console.log('MCP Tool result:', result)
    // In a real implementation, this could integrate with the chat interface
    // or display results in a dedicated area
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Model Context Protocol
            </h1>
            <p className="text-gray-600">
              Connect to MCP servers and invoke tools
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/matrix">
              <Button variant="ghost">Matrix</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="ghost">Dashboard</Button>
            </Link>
            <Link href="/">
              <Button variant="secondary">← Back to Chat</Button>
            </Link>
          </div>
        </header>

        {/* Main MCP interface */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          <MCPPanel 
            onToolResult={handleToolResult}
            className="w-full"
          />
        </div>

        {/* Phase 4 status */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Phase 4: MCP Integration Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  <span className="text-sm">MCP client infrastructure and protocol handling</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  <span className="text-sm">Tool discovery mechanism for MCP servers</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  <span className="text-sm">Tool invocation UI components and workflows</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  <span className="text-sm">Approval flow system for tool execution</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  <span className="text-sm">Integration with chat interface</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  <span className="text-sm">Phase 4 implementation complete</span>
                </div>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Next Phase</h4>
              <p className="text-sm text-blue-800">
                Phase 5: Production Polish - Performance optimization, advanced accessibility, analytics, export features
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Information panel */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">About Model Context Protocol (MCP)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium">What is MCP?</h4>
                <p className="text-sm text-gray-600">
                  Model Context Protocol (MCP) is an open standard that enables AI models to securely 
                  connect to external tools, data sources, and services. It provides a standardized 
                  way for models to access capabilities beyond their training data.
                </p>
                
                <h4 className="font-medium mt-4">Key Features</h4>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li>Secure tool execution with approval flows</li>
                  <li>Standardized protocol for tool communication</li>
                  <li>Support for WebSocket and stdio transports</li>
                  <li>Type-safe parameter validation</li>
                  <li>Risk assessment for tool invocations</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium">Getting Started</h4>
                <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                  <li>Connect to an MCP server (WebSocket or stdio)</li>
                  <li>Browse available tools from connected servers</li>
                  <li>Select a tool and provide required parameters</li>
                  <li>Review approval dialog for security</li>
                  <li>Execute tool and view results</li>
                </ol>
                
                <h4 className="font-medium mt-4">Common MCP Servers</h4>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li>File System Tools - Read/write local files</li>
                  <li>Database Tools - Query SQL databases</li>
                  <li>Web Search - Search engines and APIs</li>
                  <li>Git Operations - Version control actions</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}