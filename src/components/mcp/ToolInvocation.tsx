'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardContent, Button, Input, Badge } from '@/components/ui'
import type { MCPTool, MCPProperty, MCPToolResult } from '@/lib/mcp/types'
import { useMCPClient } from '@/hooks/useMCPClient'

interface ToolInvocationProps {
  tool: MCPTool & { serverId: string; serverName: string }
  onResult?: (result: MCPToolResult) => void
  onError?: (error: string) => void
}

export function ToolInvocation({ tool, onResult, onError }: ToolInvocationProps) {
  const { callTool, isLoading } = useMCPClient()
  const [arguments_, setArguments] = useState<Record<string, unknown>>({})
  const [result, setResult] = useState<MCPToolResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)

  // Reset state when tool changes
  useEffect(() => {
    setArguments({})
    setResult(null)
    setError(null)
  }, [tool.name, tool.serverId])

  const handleArgumentChange = (name: string, value: unknown) => {
    setArguments(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const validateArguments = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []
    const required = tool.inputSchema.required || []

    // Check required parameters
    for (const reqParam of required) {
      if (!(reqParam in arguments_) || arguments_[reqParam] === '' || arguments_[reqParam] == null) {
        errors.push(`${reqParam} is required`)
      }
    }

    // Type validation would go here in a more complete implementation
    // For now, we'll just check for basic presence

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  const handleInvoke = async () => {
    setError(null)
    setResult(null)

    const validation = validateArguments()
    if (!validation.isValid) {
      setError(validation.errors.join(', '))
      return
    }

    setIsExecuting(true)

    try {
      const toolResult = await callTool(tool.serverId, tool.name, arguments_)
      setResult(toolResult)
      onResult?.(toolResult)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Tool invocation failed'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsExecuting(false)
    }
  }

  const renderArgumentInput = (name: string, property: MCPProperty, isRequired: boolean) => {
    const value = arguments_[name] || ''

    switch (property.type) {
      case 'string':
        if (property.enum) {
          return (
            <select
              value={value as string}
              onChange={(e) => handleArgumentChange(name, e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              required={isRequired}
            >
              <option value="">Select an option...</option>
              {property.enum.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          )
        }
        return (
          <Input
            type="text"
            value={value as string}
            onChange={(e) => handleArgumentChange(name, e.target.value)}
            placeholder={property.description || `Enter ${name}...`}
            required={isRequired}
          />
        )

      case 'number':
        return (
          <Input
            type="number"
            value={value as string}
            onChange={(e) => handleArgumentChange(name, parseFloat(e.target.value) || '')}
            placeholder={property.description || `Enter ${name}...`}
            required={isRequired}
          />
        )

      case 'boolean':
        return (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => handleArgumentChange(name, e.target.checked)}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-sm">{property.description || name}</span>
          </div>
        )

      case 'array':
        return (
          <textarea
            value={Array.isArray(value) ? JSON.stringify(value, null, 2) : ''}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value || '[]')
                handleArgumentChange(name, parsed)
              } catch {
                // Invalid JSON, keep as string for now
                handleArgumentChange(name, e.target.value)
              }
            }}
            placeholder={`Enter JSON array for ${name}...`}
            className="w-full p-2 border border-gray-300 rounded-md min-h-[80px]"
            required={isRequired}
          />
        )

      case 'object':
        return (
          <textarea
            value={typeof value === 'object' && value !== null ? JSON.stringify(value, null, 2) : ''}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value || '{}')
                handleArgumentChange(name, parsed)
              } catch {
                // Invalid JSON, keep as string for now
                handleArgumentChange(name, e.target.value)
              }
            }}
            placeholder={`Enter JSON object for ${name}...`}
            className="w-full p-2 border border-gray-300 rounded-md min-h-[100px]"
            required={isRequired}
          />
        )

      default:
        return (
          <Input
            type="text"
            value={String(value)}
            onChange={(e) => handleArgumentChange(name, e.target.value)}
            placeholder={property.description || `Enter ${name}...`}
            required={isRequired}
          />
        )
    }
  }

  return (
    <div className="space-y-4">
      {/* Tool header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{tool.name}</h3>
              <p className="text-sm text-gray-600">{tool.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" size="sm">
                {tool.serverName}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Arguments form */}
      {tool.inputSchema.properties && Object.keys(tool.inputSchema.properties).length > 0 && (
        <Card>
          <CardHeader>
            <h4 className="font-medium">Parameters</h4>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(tool.inputSchema.properties).map(([name, property]) => {
              const isRequired = tool.inputSchema.required?.includes(name) || false
              return (
                <div key={name} className="space-y-2">
                  <label className="block">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">
                        {name}
                        {isRequired && <span className="text-red-500">*</span>}
                      </span>
                      <Badge variant="default" size="sm">
                        {property.type}
                      </Badge>
                    </div>
                    {property.description && (
                      <div className="text-xs text-gray-600 mb-2">
                        {property.description}
                      </div>
                    )}
                    {renderArgumentInput(name, property, isRequired)}
                  </label>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <Button
          onClick={handleInvoke}
          disabled={isExecuting || isLoading}
          className="flex-1"
        >
          {isExecuting ? 'Invoking...' : 'Invoke Tool'}
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setArguments({})
            setResult(null)
            setError(null)
          }}
          disabled={isExecuting}
        >
          Clear
        </Button>
      </div>

      {/* Error display */}
      {error && (
        <Card className="border-red-200">
          <CardContent className="p-4 bg-red-50">
            <div className="text-sm text-red-700">
              <strong>Error:</strong> {error}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Result display */}
      {result && (
        <Card className="border-green-200">
          <CardHeader>
            <h4 className="font-medium text-green-800">Tool Result</h4>
          </CardHeader>
          <CardContent className="bg-green-50">
            {result.content.map((content, index) => (
              <div key={index} className="mb-3 last:mb-0">
                {content.type === 'text' && content.text && (
                  <div className="font-mono text-sm whitespace-pre-wrap bg-white p-3 rounded border">
                    {content.text}
                  </div>
                )}
                {content.type === 'image' && content.data && (
                  <div className="space-y-2">
                    <div className="text-xs text-gray-600">
                      Image ({content.mimeType})
                    </div>
                    <img
                      src={`data:${content.mimeType};base64,${content.data}`}
                      alt="Tool result"
                      className="max-w-full h-auto rounded border"
                    />
                  </div>
                )}
                {content.type === 'resource' && (
                  <div className="space-y-2">
                    <div className="text-xs text-gray-600">
                      Resource ({content.mimeType})
                    </div>
                    <div className="font-mono text-sm bg-white p-3 rounded border">
                      {content.data || content.text}
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {result.isError && (
              <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded">
                <div className="text-sm text-red-700">
                  This result contains an error from the tool.
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}