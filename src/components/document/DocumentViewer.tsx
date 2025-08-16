'use client'

import React from 'react'
import { Badge } from '@/components/ui'
import { parseCellValue, validateDS, validateSP, validateX, validateZ, validateM, validateW, validateU, validateN, type DS, type SP, type X, type Z, type M, type W, type U, type N } from '@/lib/parseCellValue'

interface DocumentViewerProps {
  matrix: string
  title: string
  data: any[]
  viewMode: 'table' | 'markdown' | 'json'
}

export function DocumentViewer({ matrix, title, data, viewMode }: DocumentViewerProps) {
  if (data.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-lg font-medium mb-2">No {title} Data</p>
        <p className="text-sm">
          Run the Phase-2 pipeline to generate {matrix} matrix content.
        </p>
      </div>
    )
  }

  if (viewMode === 'json') {
    return (
      <div className="p-4">
        <pre className="bg-gray-50 border rounded p-4 text-sm overflow-auto max-h-96">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <h4 className="text-md font-semibold text-gray-800">{title}</h4>
        <p className="text-sm text-gray-600">{data.length} entries</p>
      </div>

      {matrix === 'DS' && <DataSheetView data={data} />}
      {matrix === 'SP' && <ProcedureView data={data} />}
      {matrix === 'X' && <GuidanceView data={data} />}
      {matrix === 'Z' && <ChecklistView data={data} />}
      {matrix === 'M' && <SolutionView data={data} />}
      {matrix === 'W' && <DeltaView data={data} />}
      {matrix === 'U' && <SynthesisView data={data} />}
      {matrix === 'N' && <LearningView data={data} />}
    </div>
  )
}

function DataSheetView({ data }: { data: any[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-200">
        <thead>
          <tr className="bg-gray-50">
            <th className="border border-gray-200 px-4 py-2 text-left">Data Field</th>
            <th className="border border-gray-200 px-4 py-2 text-left">Units</th>
            <th className="border border-gray-200 px-4 py-2 text-left">Type</th>
            <th className="border border-gray-200 px-4 py-2 text-left">Source Refs</th>
            <th className="border border-gray-200 px-4 py-2 text-left">Notes</th>
          </tr>
        </thead>
        <tbody>
          {data.map((cell, index) => {
            const triple = parseCellValue<DS>(cell.value)
            
            if (!triple) {
              return (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-4 py-2 font-medium">
                    {cell.labels?.rowLabel || '—'}
                  </td>
                  <td className="border border-gray-200 px-4 py-2 text-gray-400" colSpan={4}>
                    No structured payload yet
                  </td>
                </tr>
              )
            }

            const ds = triple.text
            const isValid = validateDS(ds)
            
            return (
              <tr key={index} className="hover:bg-gray-50">
                <td className="border border-gray-200 px-4 py-2 font-medium">
                  {isValid ? ds.data_field : cell.labels?.rowLabel || '—'}
                  {(triple?.warnings?.length ?? 0) > 0 && (
                    <div className="text-xs text-yellow-600 mt-1">
                      {triple?.warnings?.length ?? 0} warning{(triple?.warnings?.length ?? 0) > 1 ? 's' : ''}
                    </div>
                  )}
                </td>
                <td className="border border-gray-200 px-4 py-2">
                  {isValid ? (ds.units || '—') : '—'}
                </td>
                <td className="border border-gray-200 px-4 py-2">
                  {isValid ? (
                    <Badge variant={ds.type === 'required' ? 'destructive' : 'secondary'}>
                      {ds.type || 'unknown'}
                    </Badge>
                  ) : (
                    <Badge variant="default">Invalid</Badge>
                  )}
                </td>
                <td className="border border-gray-200 px-4 py-2">
                  {isValid ? (ds.source_refs?.join(', ') || '—') : '—'}
                </td>
                <td className="border border-gray-200 px-4 py-2 text-sm">
                  {isValid ? (ds.notes?.join('; ') || '—') : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function ProcedureView({ data }: { data: any[] }) {
  return (
    <div className="space-y-4">
      {data.map((cell, index) => {
        const triple = parseCellValue<SP>(cell.value)
        const sp = triple?.text
        const isValid = sp && validateSP(sp)
        
        return (
          <div key={index} className="border rounded-lg p-4 bg-white">
            <div className="flex items-start justify-between mb-3">
              <h5 className="font-semibold text-gray-800">
                Step {index + 1}: {isValid ? sp.step : (cell.labels?.rowLabel || 'Invalid')}
              </h5>
              <div className="flex items-center space-x-2">
                <Badge variant="default">
                  Variable
                </Badge>
                {(triple?.warnings?.length ?? 0) > 0 && (
                  <Badge variant="destructive">
                    {triple?.warnings?.length ?? 0} warning{(triple?.warnings?.length ?? 0) > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            </div>
            
            {!isValid ? (
              <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded p-3">
                No structured payload yet or invalid format
              </div>
            ) : (
              <>
                <p className="text-gray-700 mb-3">{sp.purpose || '—'}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h6 className="font-medium text-gray-600 mb-1">Inputs</h6>
                    <ul className="list-disc list-inside space-y-1">
                      {sp.inputs?.map((input: string, i: number) => (
                        <li key={i} className="text-gray-700">{input}</li>
                      )) || <li className="text-gray-500">None specified</li>}
                    </ul>
                  </div>
                  
                  <div>
                    <h6 className="font-medium text-gray-600 mb-1">Outputs</h6>
                    <ul className="list-disc list-inside space-y-1">
                      {sp.outputs?.map((output: string, i: number) => (
                        <li key={i} className="text-gray-700">{output}</li>
                      )) || <li className="text-gray-500">None specified</li>}
                    </ul>
                  </div>
                  
                  <div>
                    <h6 className="font-medium text-gray-600 mb-1">Preconditions</h6>
                    <ul className="list-disc list-inside space-y-1">
                      {sp.preconditions?.map((pre: string, i: number) => (
                        <li key={i} className="text-gray-700">{pre}</li>
                      )) || <li className="text-gray-500">None specified</li>}
                    </ul>
                  </div>
                  
                  <div>
                    <h6 className="font-medium text-gray-600 mb-1">Postconditions</h6>
                    <ul className="list-disc list-inside space-y-1">
                      {sp.postconditions?.map((post: string, i: number) => (
                        <li key={i} className="text-gray-700">{post}</li>
                      )) || <li className="text-gray-500">None specified</li>}
                    </ul>
                  </div>
                </div>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}

function ChecklistView({ data }: { data: any[] }) {
  type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'secondary' | 'destructive'
  const getSeverityColor = (severity?: string): BadgeVariant => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'destructive'
      case 'high': return 'destructive' 
      case 'medium': return 'warning'
      case 'low': return 'secondary'
      default: return 'default'
    }
  }

  return (
    <div className="space-y-3">
      {data.map((cell, index) => {
        const triple = parseCellValue<Z>(cell.value)
        const z = triple?.text
        const isValid = z && validateZ(z)
        
        return (
          <div key={index} className="border rounded-lg p-4 bg-white">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  className="h-4 w-4 text-blue-600 rounded border-gray-300"
                  defaultChecked={false}
                />
                <h5 className="font-medium text-gray-800">
                  {isValid ? z.item : (cell.labels?.rowLabel || 'Invalid')}
                </h5>
                {(triple?.warnings?.length ?? 0) > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {triple?.warnings?.length ?? 0} warning{(triple?.warnings?.length ?? 0) > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              <Badge variant={getSeverityColor(isValid ? z.severity : 'unknown')}>
                {isValid ? (z.severity || 'Unknown') : 'Invalid'}
              </Badge>
            </div>
            
            {!isValid ? (
              <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded p-3">
                No structured payload yet or invalid format
              </div>
            ) : (
              <>
                <p className="text-gray-700 text-sm mb-2">{z.rationale || '—'}</p>
                
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Acceptance Criteria: </span>
                    <span className="text-gray-700">{z.acceptance_criteria || '—'}</span>
                  </div>
                  
                  <div>
                    <span className="font-medium text-gray-600">Evidence: </span>
                    <span className="text-gray-700">{z.evidence?.join(', ') || '—'}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}

function SolutionView({ data }: { data: any[] }) {
  return (
    <div className="space-y-4">
      {data.map((cell, index) => {
        const triple = parseCellValue<M>(cell.value)
        const m = triple?.text
        const isValid = m && validateM(m)
        
        return (
          <div key={index} className="border rounded-lg p-4 bg-white">
            <div className="flex items-start justify-between mb-3">
              <h5 className="font-semibold text-gray-800">
                Solution {index + 1}: {isValid ? m.statement : (cell.labels?.rowLabel || 'Invalid')}
              </h5>
              {(triple?.warnings?.length ?? 0) > 0 && (
                <Badge variant="destructive">
                  {triple?.warnings?.length ?? 0} warning{(triple?.warnings?.length ?? 0) > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            
            {!isValid ? (
              <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded p-3">
                No structured payload yet or invalid format
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <div>
                  <h6 className="font-medium text-gray-600 mb-1">Justification</h6>
                  <p className="text-gray-700">{m.justification || '—'}</p>
                </div>
                
                <div>
                  <h6 className="font-medium text-gray-600 mb-1">Trace Back</h6>
                  <ul className="list-disc list-inside space-y-1">
                    {m.trace_back?.map((trace: string, i: number) => (
                      <li key={i} className="text-gray-700">{trace}</li>
                    )) || <li className="text-gray-500">No trace back available</li>}
                  </ul>
                </div>
                
                <div>
                  <h6 className="font-medium text-gray-600 mb-1">Assumptions</h6>
                  <ul className="list-disc list-inside space-y-1">
                    {m.assumptions?.map((assumption: string, i: number) => (
                      <li key={i} className="text-gray-700">{assumption}</li>
                    )) || <li className="text-gray-500">No assumptions listed</li>}
                  </ul>
                </div>
                
                <div>
                  <h6 className="font-medium text-gray-600 mb-1">Residual Risk</h6>
                  <ul className="list-disc list-inside space-y-1">
                    {m.residual_risk?.map((risk: string, i: number) => (
                      <li key={i} className="text-gray-700">{risk}</li>
                    )) || <li className="text-gray-500">No residual risk identified</li>}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function GuidanceView({ data }: { data: any[] }) {
  return (
    <div className="prose max-w-none">
      {data.map((cell, index) => {
        const triple = parseCellValue<X>(cell.value)
        const x = triple?.text
        const isValid = x && validateX(x)
        
        return (
          <div key={index} className="mb-6 pb-4 border-b border-gray-200 last:border-b-0">
            <div className="flex items-start justify-between mb-3">
              <h5 className="text-lg font-semibold text-gray-800">
                {isValid ? x.heading : (cell.labels?.rowLabel || 'Invalid')}
              </h5>
              {(triple?.warnings?.length ?? 0) > 0 && (
                <Badge variant="destructive">
                  {triple?.warnings?.length ?? 0} warning{(triple?.warnings?.length ?? 0) > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            
            {!isValid ? (
              <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded p-3">
                No structured payload yet or invalid format
              </div>
            ) : (
              <>
                <div className="text-gray-700 mb-4 whitespace-pre-line">
                  {x.narrative || 'No content available'}
                </div>
                
                {(x.precedents?.length || x.successors?.length) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h6 className="font-medium text-gray-600 mb-2">Precedents</h6>
                      <ul className="list-disc list-inside space-y-1">
                        {x.precedents?.map((prec: string, i: number) => (
                          <li key={i} className="text-gray-700">{prec}</li>
                        )) || <li className="text-gray-500">None listed</li>}
                      </ul>
                    </div>
                    
                    <div>
                      <h6 className="font-medium text-gray-600 mb-2">Successors</h6>
                      <ul className="list-disc list-inside space-y-1">
                        {x.successors?.map((succ: string, i: number) => (
                          <li key={i} className="text-gray-700">{succ}</li>
                        )) || <li className="text-gray-500">None listed</li>}
                      </ul>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}

function DeltaView({ data }: { data: any[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-200">
        <thead>
          <tr className="bg-gray-50">
            <th className="border border-gray-200 px-4 py-2 text-left">Artifact</th>
            <th className="border border-gray-200 px-4 py-2 text-left">Version</th>
            <th className="border border-gray-200 px-4 py-2 text-left">Change</th>
            <th className="border border-gray-200 px-4 py-2 text-left">Impact</th>
            <th className="border border-gray-200 px-4 py-2 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {data.map((cell, index) => {
            const triple = parseCellValue<W>(cell.value)
            const w = triple?.text
            const isValid = w && validateW(w)
            
            return (
              <tr key={index} className="hover:bg-gray-50">
                <td className="border border-gray-200 px-4 py-2 font-medium">
                  {isValid ? w.artifact : (cell.labels?.rowLabel || 'Invalid')}
                  {(triple?.warnings?.length ?? 0) > 0 && (
                    <div className="text-xs text-yellow-600 mt-1">
                      {triple?.warnings?.length ?? 0} warning{(triple?.warnings?.length ?? 0) > 1 ? 's' : ''}
                    </div>
                  )}
                </td>
                <td className="border border-gray-200 px-4 py-2">
                  <Badge variant="default">
                    {isValid ? `${w.from_version} → ${w.to_version}` : 'Invalid'}
                  </Badge>
                </td>
                <td className="border border-gray-200 px-4 py-2">
                  {isValid ? (w.change || '—') : '—'}
                </td>
                <td className="border border-gray-200 px-4 py-2">
                  {isValid ? (w.impact || '—') : '—'}
                </td>
                <td className="border border-gray-200 px-4 py-2">
                  <Badge variant={isValid ? 'secondary' : 'destructive'}>
                    {isValid ? 'Valid' : 'Invalid'}
                  </Badge>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function SynthesisView({ data }: { data: any[] }) {
  return (
    <div className="space-y-4">
      {data.map((cell, index) => {
        const triple = parseCellValue<U>(cell.value)
        const u = triple?.text
        const isValid = u && validateU(u)
        
        return (
          <div key={index} className="border rounded-lg p-4 bg-white">
            <div className="flex items-center justify-between mb-3">
              <h5 className="font-semibold text-gray-800">
                Round {isValid ? u.round : (index + 1)} Synthesis
              </h5>
              <div className="flex items-center space-x-2">
                {(triple?.warnings?.length ?? 0) > 0 && (
                  <Badge variant="destructive">
                    {triple?.warnings?.length ?? 0} warning{(triple?.warnings?.length ?? 0) > 1 ? 's' : ''}
                  </Badge>
                )}
                {isValid ? (
                  <>
                    <Badge variant={u.convergence >= 0.8 ? 'default' : 'destructive'}>
                      Convergence: {(u.convergence * 100).toFixed(1)}%
                    </Badge>
                    <Badge variant="default">
                      Confidence: {(u.confidence * 100).toFixed(1)}%
                    </Badge>
                  </>
                ) : (
                  <Badge variant="destructive">Invalid</Badge>
                )}
              </div>
            </div>
            
            {!isValid ? (
              <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded p-3">
                No structured payload yet or invalid format
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h6 className="font-medium text-gray-600 mb-2">Open Issues</h6>
                  <ul className="list-disc list-inside space-y-1">
                    {u.open_issues?.map((issue: string, i: number) => (
                      <li key={i} className="text-gray-700">{issue}</li>
                    )) || <li className="text-gray-500">No open issues</li>}
                  </ul>
                </div>
                
                <div>
                  <h6 className="font-medium text-gray-600 mb-2">Next Actions</h6>
                  <ul className="list-disc list-inside space-y-1">
                    {u.next_actions?.map((action: string, i: number) => (
                      <li key={i} className="text-gray-700">{action}</li>
                    )) || <li className="text-gray-500">No actions required</li>}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function LearningView({ data }: { data: any[] }) {
  return (
    <div className="space-y-4">
      {data.map((cell, index) => {
        const triple = parseCellValue<N>(cell.value)
        const n = triple?.text
        const isValid = n && validateN(n)
        
        return (
          <div key={index} className="border rounded-lg p-4 bg-white">
            <div className="flex items-start justify-between mb-3">
              <h5 className="font-semibold text-gray-800">
                Learning Trace {index + 1}
              </h5>
              {(triple?.warnings?.length ?? 0) > 0 && (
                <Badge variant="destructive">
                  {triple?.warnings?.length ?? 0} warning{(triple?.warnings?.length ?? 0) > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            
            {!isValid ? (
              <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded p-3">
                No structured payload yet or invalid format
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <h6 className="font-medium text-gray-600 mb-1">Inputs</h6>
                  <ul className="list-disc list-inside space-y-1">
                    {n.inputs?.map((input: string, i: number) => (
                      <li key={i} className="text-gray-700">{input}</li>
                    )) || <li className="text-gray-500">None</li>}
                  </ul>
                </div>
                
                <div>
                  <h6 className="font-medium text-gray-600 mb-1">Outputs</h6>
                  <ul className="list-disc list-inside space-y-1">
                    {n.outputs?.map((output: string, i: number) => (
                      <li key={i} className="text-gray-700">{output}</li>
                    )) || <li className="text-gray-500">None</li>}
                  </ul>
                </div>
                
                <div>
                  <h6 className="font-medium text-gray-600 mb-1">Features</h6>
                  <ul className="list-disc list-inside space-y-1">
                    {n.features?.map((feature: string, i: number) => (
                      <li key={i} className="text-gray-700">{feature}</li>
                    )) || <li className="text-gray-500">None</li>}
                  </ul>
                </div>
              </div>
            )}
            
            {isValid && n.embeddings_ref && (
              <div className="mt-3 text-sm">
                <span className="font-medium text-gray-600">Embeddings Reference: </span>
                <code className="bg-gray-100 px-2 py-1 rounded text-xs">{n.embeddings_ref}</code>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}