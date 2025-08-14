'use client'

import { Button } from '@/components/ui'
import type { RenderOptions } from '@/lib/matrix/types'

interface MatrixControlsProps {
  options: RenderOptions
  onOptionsChange: (options: Partial<RenderOptions>) => void
  onZoomToFit: () => void
  onResetView: () => void
  onClearSelection: () => void
  selectedCount: number
  onExport?: (format: 'json' | 'png' | 'svg') => void
}

export function MatrixControls({
  options,
  onOptionsChange,
  onZoomToFit,
  onResetView,
  onClearSelection,
  selectedCount,
  onExport
}: MatrixControlsProps) {
  return (
    <div className="flex items-center gap-2 p-2 bg-white border rounded-lg shadow-sm">
      {/* View controls */}
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={onZoomToFit}>
          Fit
        </Button>
        <Button variant="ghost" size="sm" onClick={onResetView}>
          Reset
        </Button>
        {selectedCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onClearSelection}>
            Clear ({selectedCount})
          </Button>
        )}
      </div>

      <div className="w-px h-6 bg-gray-300" />

      {/* Display options */}
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1 text-sm">
          <input
            type="checkbox"
            checked={options.showGrid}
            onChange={(e) => onOptionsChange({ showGrid: e.target.checked })}
            className="rounded"
          />
          Grid
        </label>

        <label className="flex items-center gap-1 text-sm">
          <input
            type="checkbox"
            checked={options.showLabels}
            onChange={(e) => onOptionsChange({ showLabels: e.target.checked })}
            className="rounded"
          />
          Labels
        </label>

        <label className="flex items-center gap-1 text-sm">
          <input
            type="checkbox"
            checked={options.highlightStereocenters}
            onChange={(e) => onOptionsChange({ highlightStereocenters: e.target.checked })}
            className="rounded"
          />
          Stereocenters
        </label>
      </div>

      <div className="w-px h-6 bg-gray-300" />

      {/* Color scheme */}
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-600">Color:</label>
        <select
          value={options.colorScheme}
          onChange={(e) => onOptionsChange({ colorScheme: e.target.value as RenderOptions['colorScheme'] })}
          className="text-sm border rounded px-2 py-1"
        >
          <option value="default">Elements</option>
          <option value="chirality">Chirality</option>
          <option value="heatmap">Heatmap</option>
        </select>
      </div>

      <div className="w-px h-6 bg-gray-300" />

      {/* Opacity */}
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-600">Opacity:</label>
        <input
          type="range"
          min="0.1"
          max="1"
          step="0.1"
          value={options.opacity}
          onChange={(e) => onOptionsChange({ opacity: parseFloat(e.target.value) })}
          className="w-16"
        />
        <span className="text-xs text-gray-500 w-8">
          {Math.round(options.opacity * 100)}%
        </span>
      </div>
    </div>
  )
}