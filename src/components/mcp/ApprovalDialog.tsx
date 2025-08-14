'use client'

import { useState } from 'react'
import { Card, CardHeader, CardContent, Button, Badge } from '@/components/ui'
import type { MCPApprovalFlow } from '@/lib/mcp/types'
import { MCPRiskAssessment } from '@/lib/mcp/approval'

interface ApprovalDialogProps {
  approval: MCPApprovalFlow
  onApprove: (remember?: boolean) => void
  onReject: (remember?: boolean) => void
  onCancel: () => void
  isVisible: boolean
}

export function ApprovalDialog({ 
  approval, 
  onApprove, 
  onReject, 
  onCancel, 
  isVisible 
}: ApprovalDialogProps) {
  const [rememberDecision, setRememberDecision] = useState(false)

  if (!isVisible) return null

  const { toolCall, riskLevel, riskFactors } = approval
  const riskLevelText = MCPRiskAssessment.formatRiskLevel(riskLevel)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Tool Execution Approval</h2>
            <Badge 
              variant={riskLevel === 'high' ? 'destructive' : riskLevel === 'medium' ? 'warning' : 'default'}
              className="text-sm"
            >
              {riskLevelText}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Tool information */}
          <div className="space-y-2">
            <h3 className="font-medium">Tool Details</h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Tool Name:</span>
                <span className="font-mono text-sm">{toolCall.toolName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Server:</span>
                <Badge variant="secondary" size="sm">{toolCall.serverId}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Requested:</span>
                <span className="text-sm text-gray-600">
                  {toolCall.timestamp.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Arguments */}
          {Object.keys(toolCall.arguments).length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium">Arguments</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="text-sm whitespace-pre-wrap overflow-x-auto">
                  {JSON.stringify(toolCall.arguments, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Risk factors */}
          {riskFactors.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium">Risk Factors</h3>
              <div className="space-y-1">
                {riskFactors.map((factor, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded"
                  >
                    <span className="text-yellow-600">⚠️</span>
                    <span className="text-sm text-yellow-800">{factor}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Security warning for high-risk tools */}
          {riskLevel === 'high' && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-red-600 text-lg">🚨</span>
                <span className="font-medium text-red-800">High Risk Tool</span>
              </div>
              <p className="text-sm text-red-700">
                This tool has been identified as high-risk and could potentially:
              </p>
              <ul className="text-sm text-red-700 mt-1 ml-4 list-disc">
                <li>Modify files or system settings</li>
                <li>Execute arbitrary commands</li>
                <li>Access sensitive information</li>
                <li>Make network requests</li>
              </ul>
              <p className="text-sm text-red-700 mt-2 font-medium">
                Only approve if you trust this action and understand the consequences.
              </p>
            </div>
          )}

          {/* Remember decision option */}
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <input
              type="checkbox"
              id="rememberDecision"
              checked={rememberDecision}
              onChange={(e) => setRememberDecision(e.target.checked)}
              className="w-4 h-4 text-blue-600"
            />
            <label 
              htmlFor="rememberDecision" 
              className="text-sm text-blue-800 cursor-pointer"
            >
              Remember this decision for the tool "{toolCall.toolName}"
            </label>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 justify-end">
            <Button
              variant="ghost"
              onClick={onCancel}
            >
              Cancel
            </Button>
            
            <Button
              variant="destructive"
              onClick={() => onReject(rememberDecision)}
            >
              Reject
              {rememberDecision && ' & Block'}
            </Button>
            
            <Button
              onClick={() => onApprove(rememberDecision)}
              className="bg-green-600 hover:bg-green-700"
            >
              Approve
              {rememberDecision && ' & Remember'}
            </Button>
          </div>

          {/* Additional warnings */}
          <div className="text-xs text-gray-500 text-center">
            <p>
              By approving this tool execution, you acknowledge that you understand 
              the potential risks and take responsibility for the consequences.
            </p>
            {rememberDecision && (
              <p className="mt-1 font-medium">
                Your decision will be remembered and applied to future invocations of this tool.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}