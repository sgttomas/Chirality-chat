'use client'

import React from 'react'
import { Badge } from '@/components/ui'

interface OntologyEntity {
  curie: string
  label?: string
  scope?: string
  description?: string
}

interface OntologyChipsProps {
  entities?: OntologyEntity[]
  maxVisible?: number
  showScope?: boolean
  className?: string
}

export function OntologyChips({ 
  entities, 
  maxVisible = 8, 
  showScope = false,
  className 
}: OntologyChipsProps) {
  if (!entities?.length) return null

  const visibleEntities = entities.slice(0, maxVisible)
  const hiddenCount = entities.length - maxVisible

  return (
    <div className={`flex flex-wrap gap-1 ${className || ''}`}>
      {visibleEntities.map((entity) => (
        <OntologyChip 
          key={entity.curie} 
          entity={entity} 
          showScope={showScope}
        />
      ))}
      {hiddenCount > 0 && (
        <Badge variant="default" className="text-xs">
          +{hiddenCount} more
        </Badge>
      )}
    </div>
  )
}

interface OntologyChipProps {
  entity: OntologyEntity
  showScope?: boolean
}

function OntologyChip({ entity, showScope }: OntologyChipProps) {
  const [showTooltip, setShowTooltip] = React.useState(false)
  
  // Extract namespace from CURIE
  const [namespace] = entity.curie.split(':')
  const displayText = showScope && entity.scope 
    ? `${entity.curie} (${entity.scope})`
    : entity.curie

  const getNamespaceColor = (ns: string): string => {
    switch (ns.toLowerCase()) {
      case 'ufo': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'bfo': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'owl': return 'bg-green-100 text-green-800 border-green-200'
      case 'rdf': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'rdfs': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'dc': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'foaf': return 'bg-indigo-100 text-indigo-800 border-indigo-200'
      case 'skos': return 'bg-pink-100 text-pink-800 border-pink-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="relative">
      <div
        className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border cursor-help transition-all duration-200 hover:shadow-md ${getNamespaceColor(namespace)}`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {displayText}
      </div>
      
      {showTooltip && (entity.label || entity.description) && (
        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg max-w-xs">
          <div className="font-medium mb-1">
            {entity.label || entity.curie}
          </div>
          {entity.description && (
            <div className="text-gray-300 text-xs leading-tight">
              {entity.description}
            </div>
          )}
          {entity.scope && (
            <div className="text-gray-400 text-xs mt-1">
              Scope: {entity.scope}
            </div>
          )}
          {/* Tooltip arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  )
}

// Specialized chips for common ontology types
export function UFOChips({ entities, ...props }: Omit<OntologyChipsProps, 'entities'> & { entities?: OntologyEntity[] }) {
  const ufoEntities = entities?.filter(e => e.curie.startsWith('UFO:'))
  return <OntologyChips entities={ufoEntities} {...props} />
}

export function BFOChips({ entities, ...props }: Omit<OntologyChipsProps, 'entities'> & { entities?: OntologyEntity[] }) {
  const bfoEntities = entities?.filter(e => e.curie.startsWith('BFO:'))
  return <OntologyChips entities={bfoEntities} {...props} />
}

// Ontology legend for displaying all available ontologies
export function OntologyLegend({ entities }: { entities: OntologyEntity[] }) {
  const namespaces = [...new Set(entities.map(e => e.curie.split(':')[0]))]
  
  return (
    <div className="bg-gray-50 border rounded-lg p-3">
      <h4 className="text-sm font-medium text-gray-700 mb-2">Ontology Namespaces</h4>
      <div className="flex flex-wrap gap-2">
        {namespaces.map(ns => {
          const count = entities.filter(e => e.curie.startsWith(ns + ':')).length
          return (
            <div key={ns} className="flex items-center space-x-1">
              <div className={`w-3 h-3 rounded ${getNamespaceColor(ns).split(' ')[0]}`} />
              <span className="text-xs font-medium">{ns}</span>
              <span className="text-xs text-gray-500">({count})</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Helper to get namespace colors (exported for reuse)
function getNamespaceColor(ns: string): string {
  switch (ns.toLowerCase()) {
    case 'ufo': return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'bfo': return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'owl': return 'bg-green-100 text-green-800 border-green-200'
    case 'rdf': return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'rdfs': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'dc': return 'bg-gray-100 text-gray-800 border-gray-200'
    case 'foaf': return 'bg-indigo-100 text-indigo-800 border-indigo-200'
    case 'skos': return 'bg-pink-100 text-pink-800 border-pink-200'
    default: return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}