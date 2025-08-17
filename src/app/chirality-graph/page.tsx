'use client'

import React, { useState, useEffect } from 'react'

interface DocumentState {
  DS?: any
  SP?: any
  X?: any
  M?: any
}

interface CFMatrix {
  id: string
  kind: string
  name: string
  createdAt: string
}

interface CFNode {
  id: string
  term: string
  station: string
}

export default function ChiralityGraphUI() {
  const [problemStatement, setProblemStatement] = useState('')
  const [initialVector, setInitialVector] = useState<string[]>([])
  const [documents, setDocuments] = useState<DocumentState>({})
  const [isGenerating, setIsGenerating] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [currentView, setCurrentView] = useState<'DS' | 'SP' | 'X' | 'M'>('DS')
  const [graphMetadata, setGraphMetadata] = useState<{matrices: CFMatrix[], nodes: CFNode[]}>({matrices: [], nodes: []})
  const [graphEnabled, setGraphEnabled] = useState(false)

  // Load existing state on mount
  const loadExistingState = async () => {
    try {
      const response = await fetch('/api/core/state')
      const data = await response.json()
      if (data.problem?.statement) {
        setProblemStatement(data.problem.statement)
        setInitialVector(data.problem.initialVector || [])
      }
      if (data.finals) {
        setDocuments(data.finals)
      }
    } catch (error) {
      console.error('Failed to load existing state:', error)
    }
  }

  // Load CF14 graph metadata
  const loadGraphMetadata = async () => {
    try {
      // Check if graph is enabled first
      const healthResponse = await fetch('/api/v1/graph/health')
      const healthData = await healthResponse.json()
      
      if (healthData.status === 'healthy' || healthData.graph_enabled) {
        setGraphEnabled(true)
        
        // Fetch CF14 matrices
        const matricesResponse = await fetch('/api/v1/graph/graphql', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer dev-super-secret',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            query: `{
              cfMatrices(limit: 10) {
                id
                kind
                name
                createdAt
              }
            }`
          })
        })
        
        if (matricesResponse.ok) {
          const matricesData = await matricesResponse.json()
          if (matricesData.data?.cfMatrices) {
            // Fetch sample CF nodes
            const nodesResponse = await fetch('/api/v1/graph/graphql', {
              method: 'POST',
              headers: {
                'Authorization': 'Bearer dev-super-secret',
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                query: `{
                  cfSearch(term: "", limit: 20) {
                    id
                    term
                    station
                  }
                }`
              })
            })
            
            let nodes = []
            if (nodesResponse.ok) {
              const nodesData = await nodesResponse.json()
              nodes = nodesData.data?.cfSearch || []
            }
            
            setGraphMetadata({
              matrices: matricesData.data.cfMatrices,
              nodes: nodes
            })
          }
        }
      }
    } catch (error) {
      console.error('Failed to load graph metadata:', error)
      setGraphEnabled(false)
    }
  }

  // Load state and graph metadata on mount
  useEffect(() => {
    loadExistingState()
    loadGraphMetadata()
  }, [])

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`])
  }

  // Generate enhanced system prompt with CF14 metadata
  const generateEnhancedSystemPrompt = () => {
    let prompt = `You are generating documents for the Chirality Framework.

Problem: ${problemStatement}
`

    if (graphMetadata.matrices.length > 0 || graphMetadata.nodes.length > 0) {
      prompt += `
--- CF14 Semantic Context ---
Available CF14 matrices for context:
${graphMetadata.matrices.map(m => `- ${m.kind} matrix (${m.name}): ${m.id}`).join('\n')}

Relevant semantic concepts from CF14:
${graphMetadata.nodes.slice(0, 10).map(n => `- ${n.term} (station: ${n.station})`).join('\n')}

Use this CF14 semantic context to inform your document generation. Consider how the problem relates to these established semantic concepts and matrices.
--- End CF14 Context ---
`
    }

    return prompt
  }

  const generateDocuments = async (useTwoPass = false) => {
    if (!problemStatement.trim()) {
      alert('Please enter a problem statement')
      return
    }

    setIsGenerating(true)
    setDocuments({})
    setLogs([])
    
    try {
      // Step 1: Set the problem with enhanced system prompt
      addLog('Setting problem statement with CF14 context...')
      
      const enhancedPrompt = generateEnhancedSystemPrompt()
      addLog(`📊 Using CF14 context: ${graphMetadata.matrices.length} matrices, ${graphMetadata.nodes.length} nodes`)
      
      const stateResponse = await fetch('/api/core/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem: {
            title: 'Graph-Enhanced Problem',
            statement: problemStatement,
            initialVector: initialVector.length > 0 ? initialVector : ['analysis', 'solution', 'implementation'],
            systemPrompt: enhancedPrompt // Include the enhanced prompt
          }
        })
      })
      
      if (!stateResponse.ok) throw new Error('Failed to set problem')
      addLog('✓ Problem statement set with CF14 semantic context')

      if (useTwoPass) {
        // Use the new two-pass orchestration endpoint
        addLog('Starting graph-enhanced two-pass generation...')
        const orchestrateResponse = await fetch('/api/core/orchestrate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        })
        
        const data = await orchestrateResponse.json()
        
        if (data.error) {
          throw new Error(data.error)
        }
        
        // Add all logs from the orchestration
        data.logs.forEach((log: string) => addLog(log))
        
        // Set the final refined documents
        setDocuments(data.pass2)
        
        addLog(`✅ Graph-enhanced two-pass generation complete in ${data.totalTimeSeconds}s!`)
      } else {
        // Original single-pass generation with graph context
        // Step 2: Generate DS
        addLog('Generating Data Sheet (DS) with CF14 context...')
        const dsResponse = await fetch('/api/core/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kind: 'DS' })
        })
        const dsData = await dsResponse.json()
        if (dsData.error) {
          addLog(`⚠️ DS generation failed: ${dsData.error}`)
          setDocuments(prev => ({ ...prev, DS: { text: { error: dsData.error }, terms_used: [], warnings: [dsData.error] } }))
        } else {
          setDocuments(prev => ({ ...prev, DS: dsData.triple }))
          addLog(`✓ DS generated in ${((dsData.latencyMs || 0)/1000).toFixed(1)}s`)
        }

        // Step 3: Generate SP
        addLog('Generating Procedural Checklist (SP) with CF14 context...')
        const spResponse = await fetch('/api/core/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kind: 'SP' })
        })
        const spData = await spResponse.json()
        if (spData.error) {
          addLog(`⚠️ SP generation failed: ${spData.error}`)
          setDocuments(prev => ({ ...prev, SP: { text: { error: spData.error }, terms_used: [], warnings: [spData.error] } }))
        } else {
          setDocuments(prev => ({ ...prev, SP: spData.triple }))
          addLog(`✓ SP generated in ${((spData.latencyMs || 0)/1000).toFixed(1)}s`)
        }

        // Step 4: Generate X
        addLog('Generating Solution Template (X) with CF14 context...')
        const xResponse = await fetch('/api/core/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kind: 'X' })
        })
        const xData = await xResponse.json()
        if (xData.error) {
          addLog(`⚠️ X generation failed: ${xData.error}`)
          setDocuments(prev => ({ ...prev, X: { text: { error: xData.error }, terms_used: [], warnings: [xData.error] } }))
        } else {
          setDocuments(prev => ({ ...prev, X: xData.triple }))
          addLog(`✓ X generated in ${((xData.latencyMs || 0)/1000).toFixed(1)}s`)
        }

        // Step 5: Generate M
        addLog('Generating Guidance (M) with CF14 context...')
        const mResponse = await fetch('/api/core/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kind: 'M' })
        })
        const mData = await mResponse.json()
        if (mData.error) {
          addLog(`⚠️ M generation failed: ${mData.error}`)
          setDocuments(prev => ({ ...prev, M: { text: { error: mData.error }, terms_used: [], warnings: [mData.error] } }))
        } else {
          setDocuments(prev => ({ ...prev, M: mData.triple }))
          addLog(`✓ M generated in ${((mData.latencyMs || 0)/1000).toFixed(1)}s`)
        }

        addLog('✅ All graph-enhanced documents generated successfully!')
      }
      
    } catch (error) {
      addLog(`❌ Error: ${error}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const exportDocuments = () => {
    const exportData = {
      problem: problemStatement,
      initialVector,
      documents,
      graphMetadata,
      timestamp: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chirality-graph-documents-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const addToken = () => {
    const token = prompt('Enter token:')
    if (token && !initialVector.includes(token)) {
      setInitialVector(prev => [...prev, token])
    }
  }

  const removeToken = (index: number) => {
    setInitialVector(prev => prev.filter((_, i) => i !== index))
  }

  const clearAllDocuments = async () => {
    if (!confirm('Are you sure you want to clear all documents and problem state? This cannot be undone.')) {
      return
    }
    
    try {
      const response = await fetch('/api/core/state', {
        method: 'DELETE'
      })
      
      if (response.ok) {
        // Clear local state
        setProblemStatement('')
        setInitialVector([])
        setDocuments({})
        setLogs(['✅ All documents and state cleared'])
      } else {
        addLog('❌ Failed to clear state')
      }
    } catch (error) {
      console.error('Error clearing state:', error)
      addLog('❌ Error clearing state')
    }
  }

  const renderDocument = (doc: any, type: string) => {
    if (!doc) return <div className="text-gray-500">No {type} document generated yet</div>
    
    const { text, terms_used, warnings } = doc
    
    // Handle error case
    if (text?.error) {
      return (
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <h3 className="font-semibold text-red-800 mb-2">Generation Error</h3>
          <p className="text-red-600">{text.error}</p>
        </div>
      )
    }
    
    return (
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="font-semibold mb-2">Content</h3>
          {type === 'DS' && text && (
            <div className="space-y-2">
              <p><strong>Data Field:</strong> {text.data_field}</p>
              <p><strong>Type:</strong> {text.type || 'Not specified'}</p>
              <p><strong>Units:</strong> {text.units || 'Not specified'}</p>
              {text.source_refs && <p><strong>Sources:</strong> {Array.isArray(text.source_refs) ? text.source_refs.join(', ') : text.source_refs}</p>}
              {text.notes && <p><strong>Notes:</strong> {text.notes}</p>}
            </div>
          )}
          {type === 'SP' && text && (
            <div className="space-y-2">
              <p><strong>Step:</strong> {text.step}</p>
              <p><strong>Purpose:</strong> {text.purpose}</p>
              {text.inputs && <p><strong>Inputs:</strong> {Array.isArray(text.inputs) ? text.inputs.join(', ') : text.inputs}</p>}
              {text.outputs && <p><strong>Outputs:</strong> {Array.isArray(text.outputs) ? text.outputs.join(', ') : text.outputs}</p>}
              {text.preconditions && <p><strong>Preconditions:</strong> {Array.isArray(text.preconditions) ? text.preconditions.join(', ') : text.preconditions}</p>}
              {text.postconditions && <p><strong>Postconditions:</strong> {Array.isArray(text.postconditions) ? text.postconditions.join(', ') : text.postconditions}</p>}
            </div>
          )}
          {type === 'X' && text && (
            <div className="space-y-2">
              <p><strong>Heading:</strong> {text.heading}</p>
              <p><strong>Narrative:</strong> {text.narrative}</p>
              {text.precedents && <p><strong>Precedents:</strong> {text.precedents}</p>}
              {text.successors && <p><strong>Successors:</strong> {text.successors}</p>}
              {text.context_notes && <p><strong>Context:</strong> {text.context_notes}</p>}
            </div>
          )}
          {type === 'M' && text && (
            <div className="space-y-2">
              <p><strong>Statement:</strong> {text.statement}</p>
              <p><strong>Justification:</strong> {text.justification}</p>
              {text.assumptions && <p><strong>Assumptions:</strong> {Array.isArray(text.assumptions) ? text.assumptions.join(', ') : text.assumptions}</p>}
              {text.residual_risk && <p><strong>Residual Risk:</strong> {Array.isArray(text.residual_risk) ? text.residual_risk.join(', ') : text.residual_risk}</p>}
            </div>
          )}
        </div>
        
        {terms_used && terms_used.length > 0 && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Terms Used</h3>
            <div className="flex flex-wrap gap-2">
              {terms_used.map((term: string, i: number) => (
                <span key={i} className="bg-blue-200 px-2 py-1 rounded text-sm">
                  {term}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {warnings && warnings.length > 0 && (
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Warnings</h3>
            <ul className="list-disc list-inside">
              {warnings.map((warning: string, i: number) => (
                <li key={i} className="text-yellow-800">{warning}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Chirality Graph-Enhanced UI</h1>
          <p className="text-gray-600 mt-2">
            Document generation enhanced with CF14 semantic matrix context (DS→SP→X→M)
          </p>
          <div className="mt-4 p-3 bg-purple-50 rounded-lg">
            <p className="text-purple-800 text-sm">
              🔗 This UI integrates CF14 semantic metadata from Neo4j to enhance document generation
            </p>
          </div>
          
          {/* Graph Status */}
          <div className="mt-4 p-3 rounded-lg">
            {graphEnabled ? (
              <div className="bg-green-50">
                <p className="text-green-800 text-sm">
                  ✅ Graph integration active: {graphMetadata.matrices.length} CF14 matrices, {graphMetadata.nodes.length} semantic nodes
                </p>
              </div>
            ) : (
              <div className="bg-yellow-50">
                <p className="text-yellow-800 text-sm">
                  ⚠️ Graph integration unavailable - falling back to standard generation
                </p>
              </div>
            )}
          </div>
        </div>

        {/* CF14 Context Preview */}
        {graphEnabled && graphMetadata.matrices.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Available CF14 Context</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium mb-2">Semantic Matrices ({graphMetadata.matrices.length})</h3>
                <div className="space-y-1">
                  {graphMetadata.matrices.slice(0, 5).map(matrix => (
                    <div key={matrix.id} className="text-sm bg-blue-50 p-2 rounded">
                      <strong>{matrix.kind}</strong>: {matrix.name}
                    </div>
                  ))}
                  {graphMetadata.matrices.length > 5 && (
                    <div className="text-sm text-gray-500">...and {graphMetadata.matrices.length - 5} more</div>
                  )}
                </div>
              </div>
              <div>
                <h3 className="font-medium mb-2">Semantic Concepts ({graphMetadata.nodes.length})</h3>
                <div className="flex flex-wrap gap-1">
                  {graphMetadata.nodes.slice(0, 10).map(node => (
                    <span key={node.id} className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {node.term}
                    </span>
                  ))}
                  {graphMetadata.nodes.length > 10 && (
                    <span className="text-xs text-gray-500">+{graphMetadata.nodes.length - 10} more</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Input Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Problem Definition</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Problem Statement
              </label>
              <textarea
                className="w-full p-3 border rounded-lg"
                rows={4}
                placeholder="Describe the problem you want to solve..."
                value={problemStatement}
                onChange={(e) => setProblemStatement(e.target.value)}
                disabled={isGenerating}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Initial Vector (optional tokens for context)
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {initialVector.map((token, i) => (
                  <span
                    key={i}
                    className="bg-blue-100 px-3 py-1 rounded-full text-sm cursor-pointer hover:bg-blue-200"
                    onClick={() => !isGenerating && removeToken(i)}
                  >
                    {token} ×
                  </span>
                ))}
                <button
                  onClick={addToken}
                  disabled={isGenerating}
                  className="px-3 py-1 border-2 border-dashed border-gray-300 rounded-full text-sm hover:border-gray-400"
                >
                  + Add Token
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => generateDocuments(false)}
                disabled={isGenerating || !problemStatement.trim()}
                className={`flex-1 py-3 rounded-lg font-medium ${
                  isGenerating || !problemStatement.trim()
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isGenerating ? 'Generating...' : '📊 Single Pass + CF14 Context'}
              </button>
              <button
                onClick={() => generateDocuments(true)}
                disabled={isGenerating || !problemStatement.trim()}
                className={`flex-1 py-3 rounded-lg font-medium ${
                  isGenerating || !problemStatement.trim()
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {isGenerating ? 'Generating...' : '🔄 Two-Pass + CF14 Enhancement'}
              </button>
            </div>
          </div>
        </div>

        {/* Progress Logs */}
        {logs.length > 0 && (
          <div className="bg-black text-green-400 rounded-lg p-4 mb-6 font-mono text-sm max-h-48 overflow-y-auto">
            {logs.map((log, i) => (
              <div key={i}>{log}</div>
            ))}
          </div>
        )}

        {/* Document Viewer */}
        {Object.keys(documents).length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Generated Documents</h2>
              <div className="flex gap-2">
                <button
                  onClick={clearAllDocuments}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Clear All Documents
                </button>
                <button
                  onClick={exportDocuments}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Export All Documents
                </button>
              </div>
            </div>

            {/* Document Tabs */}
            <div className="flex space-x-2 mb-6 border-b">
              {(['DS', 'SP', 'X', 'M'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setCurrentView(type)}
                  className={`px-4 py-2 font-medium ${
                    currentView === type
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  } ${!documents[type] ? 'opacity-50' : ''}`}
                  disabled={!documents[type]}
                >
                  {type === 'DS' && 'Data Sheet'}
                  {type === 'SP' && 'Procedural Checklist'}
                  {type === 'X' && 'Solution Template'}
                  {type === 'M' && 'Guidance'}
                  {documents[type] && ' ✓'}
                </button>
              ))}
            </div>

            {/* Document Content */}
            <div className="mt-4">
              {renderDocument(documents[currentView], currentView)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}