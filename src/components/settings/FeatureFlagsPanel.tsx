'use client'

import { Card, CardHeader, CardContent } from '@/components/ui'
import { useFeatureFlags } from '@/lib/feature-flags'

export function FeatureFlagsPanel() {
  const { flags, updateFlag, resetFlags } = useFeatureFlags()

  const flagDescriptions = {
    useGraphQL: 'Use GraphQL API instead of REST endpoints',
    enableMatrixVisualization: 'Enable matrix visualization components (Phase 3)',
    enableMCPIntegration: 'Enable Model Context Protocol integration (Phase 4)',
    enableAdvancedAnalytics: 'Enable advanced analytics and telemetry',
    debugMode: 'Enable debug mode with detailed logging',
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Feature Flags</h3>
          <button
            onClick={resetFlags}
            className="text-sm text-gray-600 hover:text-gray-800 underline"
          >
            Reset to defaults
          </button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {Object.entries(flags).map(([key, value]) => (
          <div key={key} className="flex items-start justify-between">
            <div className="flex-1">
              <label htmlFor={key} className="block text-sm font-medium text-gray-900 cursor-pointer">
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </label>
              <p className="text-sm text-gray-600 mt-1">
                {flagDescriptions[key as keyof typeof flagDescriptions]}
              </p>
            </div>
            <div className="ml-4">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  id={key}
                  type="checkbox"
                  className="sr-only peer"
                  checked={value}
                  onChange={(e) => updateFlag(key as keyof typeof flags, e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        ))}
        
        <div className="border-t pt-4 text-xs text-gray-500">
          Feature flags are persisted locally and control experimental features.
          Changes take effect immediately.
        </div>
      </CardContent>
    </Card>
  )
}