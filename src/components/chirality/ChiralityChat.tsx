'use client'

import React, { useState } from 'react'
import { Card, CardHeader, CardContent, Button, Input } from '@/components/ui'
import { DocumentBuilder } from '@/components/document'
import { SemanticMatrixViewer } from '@/components/matrix/SemanticMatrixViewer'
import { PipelineMonitor } from '@/components/pipeline'
import { startJob, buildArgs } from '@/lib/orchestratorClient'
import { parseCellValue, type DS, type SP, type X, type M } from '@/lib/parseCellValue'
import { formatBundleMarkdown } from '@/lib/prompt/formatters.table'
import { useQuery } from '@tanstack/react-query'

interface ChiralityChatProps {
  className?: string
}

interface ProblemStatement {
  text: string
  initialVector: string[]
}

export function ChiralityChat({ className }: ChiralityChatProps) {
  const [problemStatement, setProblemStatement] = useState('')
  const [initialVector, setInitialVector] = useState<string[]>([])
  const [currentStep, setCurrentStep] = useState<'input' | 'phase1' | 'phase2' | 'results'>('input')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationLogs, setGenerationLogs] = useState<string[]>([])
  const [useCore, setUseCore] = useState(true) // Use Chirality Core by default

  // Get Phase-1 matrices status
  const { data: phase1Status } = useQuery({
    queryKey: ['phase1Status'],
    queryFn: async () => {
      // Check if C, F, D matrices have data
      const response = await fetch('/api/neo4j/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query_type: 'get_phase1_status' })
      })
      return response.json()
    },
    enabled: currentStep !== 'input',
    refetchInterval: 5000
  })

  // Get Phase-2 document synthesis status
  const { data: phase2Status } = useQuery({
    queryKey: ['phase2Status'],
    queryFn: async () => {
      const response = await fetch('/api/neo4j/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query_type: 'get_document_synthesis' })
      })
      return response.json()
    },
    enabled: currentStep === 'phase2' || currentStep === 'results',
    refetchInterval: 5000
  })

  const handleStartPhase1 = async () => {
    if (!problemStatement.trim()) {
      alert('Please enter a problem statement')
      return
    }

    setIsGenerating(true)
    setCurrentStep('phase1')
    setGenerationLogs(['Starting Phase-1: Problem Analysis...'])

    try {
      // Step 1: Push axioms
      const axiomJob = await startJob('push-axioms', buildArgs({
        spec: 'NORMATIVE_Chirality_Framework_14.2.1.1.txt'
      }))
      setGenerationLogs(prev => [...prev, `✓ Axioms pushed (${axiomJob.jobId})`])

      // Step 2: Generate Requirements (C matrix)
      const cJob = await startJob('generate-c', buildArgs({
        rows: '0,1,2',
        cols: '0,1,2,3',
        ufo_propose: true,
        log_json: true
      }))
      setGenerationLogs(prev => [...prev, `✓ Generating Requirements matrix (${cJob.jobId})`])

      // Step 3: Generate Objectives (F matrix)
      const fJob = await startJob('generate-f', buildArgs({
        rows: '0,1,2',
        cols: '0,1,2,3',
        ufo_propose: true,
        log_json: true
      }))
      setGenerationLogs(prev => [...prev, `✓ Generating Objectives matrix (${fJob.jobId})`])

      // Step 4: Generate Solution Objectives (D matrix)
      const dJob = await startJob('generate-d', buildArgs({
        rows: '0,1,2',
        cols: '0,1,2,3',
        ufo_propose: true,
        log_json: true
      }))
      setGenerationLogs(prev => [...prev, `✓ Generating Solution Objectives matrix (${dJob.jobId})`])

      setGenerationLogs(prev => [...prev, '✅ Phase-1 complete! Ready for Phase-2 Document Synthesis'])
    } catch (error) {
      setGenerationLogs(prev => [...prev, `❌ Error: ${error}`])
    } finally {
      setIsGenerating(false)
    }
  }

  // NEW: Generate documents using Chirality Core (graph-free)
  const handleGenerateWithCore = async () => {
    if (!problemStatement.trim()) {
      alert('Please enter a problem statement')
      return
    }

    setIsGenerating(true)
    setCurrentStep('phase2')
    setGenerationLogs(['Using Chirality Core (graph-free) for document generation...'])

    try {
      // Set the problem in Core
      await fetch('/api/core/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem: {
            title: 'User Defined Problem',
            statement: problemStatement,
            initialVector: initialVector.length > 0 ? initialVector : ['analysis', 'solution', 'implementation']
          }
        })
      })
      setGenerationLogs(prev => [...prev, '✓ Problem statement set in Chirality Core'])

      // Generate DS
      setGenerationLogs(prev => [...prev, '⏳ Generating Data Sheet (DS)...'])
      const dsResponse = await fetch('/api/core/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'DS' })
      })
      const dsResult = await dsResponse.json()
      setGenerationLogs(prev => [...prev, `✓ DS generated in ${(dsResult.latencyMs/1000).toFixed(1)}s`])

      // Generate SP
      setGenerationLogs(prev => [...prev, '⏳ Generating Procedural Checklist (SP)...'])
      const spResponse = await fetch('/api/core/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'SP' })
      })
      const spResult = await spResponse.json()
      setGenerationLogs(prev => [...prev, `✓ SP generated in ${(spResult.latencyMs/1000).toFixed(1)}s`])

      // Generate X
      setGenerationLogs(prev => [...prev, '⏳ Generating Solution Template (X)...'])
      const xResponse = await fetch('/api/core/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'X' })
      })
      const xResult = await xResponse.json()
      setGenerationLogs(prev => [...prev, `✓ X generated in ${(xResult.latencyMs/1000).toFixed(1)}s`])

      // Generate M
      setGenerationLogs(prev => [...prev, '⏳ Generating Guidance (M)...'])
      const mResponse = await fetch('/api/core/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'M' })
      })
      const mResult = await mResponse.json()
      setGenerationLogs(prev => [...prev, `✓ M generated in ${(mResult.latencyMs/1000).toFixed(1)}s`])

      setGenerationLogs(prev => [...prev, '', '✅ All 4 documents generated successfully!'])
      setCurrentStep('results')
    } catch (error) {
      setGenerationLogs(prev => [...prev, `❌ Error: ${error}`])
    } finally {
      setIsGenerating(false)
    }
  }

  const handleStartPhase2 = async () => {
    setIsGenerating(true)
    setCurrentStep('phase2')
    setGenerationLogs(prev => [...prev, '', 'Starting Phase-2: Document Synthesis...'])

    try {
      // Generate the 4 core documents: DS → SP → X → M
      
      // Step 1: Data Sheet (DS)
      const dsJob = await startJob('generate-ds', buildArgs({
        rows: '0,1,2',
        cols: '0,1,2,3',
        log_json: true
      }))
      setGenerationLogs(prev => [...prev, `✓ Generating Data Sheet (${dsJob.jobId})`])

      // Step 2: Standard Procedure (SP)
      const spJob = await startJob('generate-sp', buildArgs({
        rows: '0,1,2',
        cols: '0,1,2,3',
        log_json: true
      }))
      setGenerationLogs(prev => [...prev, `✓ Generating Standard Procedure (${spJob.jobId})`])

      // Step 3: Guidance Document (X)
      const xJob = await startJob('generate-x', buildArgs({
        rows: '0,1,2',
        cols: '0,1,2,3',
        log_json: true
      }))
      setGenerationLogs(prev => [...prev, `✓ Generating Guidance Document (${xJob.jobId})`])

      // Step 4: Solution Statements (M)
      const mJob = await startJob('generate-m', buildArgs({
        rows: '0,1,2',
        cols: '0,1,2,3',
        log_json: true
      }))
      setGenerationLogs(prev => [...prev, `✓ Generating Solution Statements (${mJob.jobId})`])

      setGenerationLogs(prev => [...prev, '✅ Phase-2 complete! Documents ready for review'])
      setCurrentStep('results')
    } catch (error) {
      setGenerationLogs(prev => [...prev, `❌ Error: ${error}`])
    } finally {
      setIsGenerating(false)
    }
  }

  const handleExportAll = async () => {
    if (!phase2Status?.matrices) return

    try {
      // Get all document matrices
      const dsMatrix = phase2Status.matrices.find((m: any) => m.name === 'DS')
      const spMatrix = phase2Status.matrices.find((m: any) => m.name === 'SP')
      const xMatrix = phase2Status.matrices.find((m: any) => m.name === 'X')
      const mMatrix = phase2Status.matrices.find((m: any) => m.name === 'M')

      // Parse first cell of each matrix for export
      const dsTriple = dsMatrix?.cells?.[0] ? parseCellValue<DS>(dsMatrix.cells[0].value) : null
      const spTriple = spMatrix?.cells?.[0] ? parseCellValue<SP>(spMatrix.cells[0].value) : null
      const xTriple = xMatrix?.cells?.[0] ? parseCellValue<X>(xMatrix.cells[0].value) : null
      const mTriple = mMatrix?.cells?.[0] ? parseCellValue<M>(mMatrix.cells[0].value) : null

      // Create bundle markdown
      const bundleMd = formatBundleMarkdown({
        ds: dsTriple,
        sp: spTriple,
        x: xTriple,
        m: mTriple,
        formatSP: (t) => `**Step**: ${t.text.step}\n\n**Purpose**: ${t.text.purpose}\n\n**Inputs**: ${t.text.inputs?.join(', ')}\n\n**Outputs**: ${t.text.outputs?.join(', ')}`,
        formatX: (t) => `# ${t.text.heading}\n\n${t.text.narrative}`,
        formatM: (t) => `**Statement**: ${t.text.statement}\n\n**Justification**: ${t.text.justification}`
      })

      // Download as markdown
      const blob = new Blob([bundleMd], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `chirality-solution-${new Date().toISOString().split('T')[0]}.md`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    }
  }

  const addInitialVectorToken = () => {
    const token = prompt('Add initial vector token:')?.trim()
    if (token && !initialVector.includes(token)) {
      setInitialVector(prev => [...prev, token])
    }
  }

  const removeToken = (index: number) => {
    setInitialVector(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className={`max-w-6xl mx-auto p-6 space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-bold text-gray-900">Chirality Framework</h1>
          <p className="text-gray-600">
            Problem Statement → 4 Documents (Data Template, Procedural Checklist, Solution Template, Guidance)
          </p>
        </CardHeader>
      </Card>

      {/* Step 1: Problem Statement Input */}
      {currentStep === 'input' && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Step 1: Define Problem Statement</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Problem Statement
              </label>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-md"
                rows={4}
                placeholder="Describe the problem you want to solve using the Chirality Framework..."
                value={problemStatement}
                onChange={(e) => setProblemStatement(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Initial Vector (optional orientation tokens)
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {initialVector.map((token, index) => (
                  <span
                    key={index}
                    className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm cursor-pointer"
                    onClick={() => removeToken(index)}
                  >
                    {token} ×
                  </span>
                ))}
              </div>
              <Button variant="secondary" onClick={addInitialVectorToken}>
                + Add Token
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <input 
                  type="checkbox" 
                  id="useCore"
                  checked={useCore}
                  onChange={(e) => setUseCore(e.target.checked)}
                />
                <label htmlFor="useCore" className="text-sm text-gray-600">
                  Use Chirality Core (graph-free, recommended)
                </label>
              </div>
              
              <Button 
                onClick={useCore ? handleGenerateWithCore : handleStartPhase1}
                disabled={!problemStatement.trim() || isGenerating}
                className="w-full"
              >
                {isGenerating ? 'Generating Documents...' : 
                 useCore ? 'Generate 4 Documents (DS→SP→X→M)' : 'Start Phase-1: Problem Analysis'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generation Logs */}
      {currentStep !== 'input' && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Generation Progress</h2>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 text-gray-100 p-4 rounded font-mono text-sm max-h-48 overflow-y-auto">
              {generationLogs.map((log, index) => (
                <div key={index} className="mb-1">{log}</div>
              ))}
              {isGenerating && (
                <div className="text-blue-400 animate-pulse">● Processing...</div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Phase-1 Status */}
      {currentStep === 'phase1' && phase1Status && !isGenerating && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Phase-1 Complete</h2>
          </CardHeader>
          <CardContent>
            <p className="text-green-600 mb-4">✅ Problem analysis complete. Ready for document synthesis.</p>
            <Button onClick={handleStartPhase2} className="w-full">
              Start Phase-2: Document Synthesis
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Phase-2 Results: The 4 Documents */}
      {currentStep === 'results' && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <h2 className="text-xl font-semibold">Generated Documents</h2>
              <Button onClick={handleExportAll} variant="secondary">
                Export All as Markdown
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-green-600 mb-4">
                ✅ All 4 documents generated successfully!
              </p>
            </CardContent>
          </Card>

          {/* Document Builder with Matrix View */}
          <DocumentBuilder className="w-full" />

          {/* Matrix Visualization */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Semantic Matrix View</h3>
            </CardHeader>
            <CardContent>
              <SemanticMatrixViewer 
                stationName="Document Synthesis"
                matrixName="DS"
                includeOntologies={true}
              />
            </CardContent>
          </Card>

          {/* Pipeline Monitor */}
          <PipelineMonitor />
        </div>
      )}

      {/* Reset Button */}
      {currentStep !== 'input' && !isGenerating && (
        <Card>
          <CardContent className="text-center">
            <Button 
              variant="secondary" 
              onClick={() => {
                setCurrentStep('input')
                setProblemStatement('')
                setInitialVector([])
                setGenerationLogs([])
              }}
            >
              Start New Problem
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}