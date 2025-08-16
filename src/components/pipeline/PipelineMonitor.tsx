'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardHeader, CardContent, Button, Badge } from '@/components/ui'

interface LogEntry {
  event: string
  timestamp: string
  station?: string
  matrix?: string
  row?: number
  col?: number
  stage?: string
  version?: number
  deduped?: boolean
  latencyMs?: number
  message?: string
  exitCode?: number
}

interface JobStatus {
  id: string
  status: 'running' | 'completed' | 'failed'
  logs: LogEntry[]
}

interface PipelineMonitorProps {
  orchestratorUrl?: string
  className?: string
}

const STAGE_COLORS: Record<string, string> = {
  axiom: '#52c41a',
  context_loaded: '#1890ff',
  'product:k=0': '#722ed1',
  'product:k=1': '#722ed1', 
  'product:k=2': '#722ed1',
  'product:k=3': '#722ed1',
  sum: '#fa8c16',
  element_wise: '#fa8c16',
  interpretation: '#13c2c2',
  final_resolved: '#52c41a',
  error: '#f5222d',
}

export function PipelineMonitor({ 
  orchestratorUrl = 'http://localhost:3001',
  className 
}: PipelineMonitorProps) {
  const [jobs, setJobs] = useState<JobStatus[]>([])
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [showAllJobs, setShowAllJobs] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)
  const logsEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  // Fetch job status and metrics
  const fetchMetrics = async () => {
    try {
      const response = await fetch(`${orchestratorUrl}/api/orchestrate/metrics`)
      if (response.ok) {
        const data = await response.json()
        
        // Get recent jobs
        const recentJobsResponse = await fetch(`${orchestratorUrl}/api/orchestrate/status`)
        if (recentJobsResponse.ok) {
          const statusData = await recentJobsResponse.json()
          setJobs(prev => {
            const newJobs = statusData.recentJobs || []
            // Merge with existing jobs, keeping local state
            const merged = [...newJobs]
            prev.forEach(existingJob => {
              if (!merged.find(j => j.id === existingJob.id)) {
                merged.push(existingJob)
              }
            })
            return merged.slice(0, 10) // Keep last 10 jobs
          })
        }
        
        setIsConnected(true)
      } else {
        setIsConnected(false)
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error)
      setIsConnected(false)
    }
  }

  // Connect to job logs via SSE
  const connectToJobLogs = (jobId: string) => {
    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    setSelectedJobId(jobId)
    setLogs([])
    
    const eventSource = new EventSource(`${orchestratorUrl}/api/orchestrate/logs/${jobId}`)
    eventSourceRef.current = eventSource
    
    eventSource.onopen = () => {
      console.log('Connected to job logs:', jobId)
    }
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        setLogs(prev => [...prev, { ...data, timestamp: data.timestamp || new Date().toISOString() }])
        
        // Update job status based on log events
        if (data.event === 'job_complete' || data.event === 'job_error') {
          setJobs(prev => prev.map(job => 
            job.id === jobId 
              ? { ...job, status: data.event === 'job_complete' ? 'completed' : 'failed' }
              : job
          ))
        }
      } catch (error) {
        console.error('Failed to parse log event:', error)
      }
    }
    
    eventSource.onerror = (error) => {
      console.error('EventSource failed:', error)
      eventSource.close()
    }
  }

  // Disconnect from logs
  const disconnectFromLogs = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    setSelectedJobId(null)
    setLogs([])
  }

  // Stop a job
  const stopJob = async (jobId: string) => {
    try {
      const response = await fetch(`${orchestratorUrl}/api/orchestrate/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId })
      })
      
      if (response.ok) {
        setJobs(prev => prev.map(job => 
          job.id === jobId 
            ? { ...job, status: 'failed' }
            : job
        ))
      }
    } catch (error) {
      console.error('Failed to stop job:', error)
    }
  }

  // Format log entry for display
  const formatLogEntry = (log: LogEntry) => {
    if (log.event === 'stage_write') {
      const dedup = log.deduped ? ' (deduped)' : ''
      const latency = log.latencyMs ? ` ${log.latencyMs}ms` : ''
      return `${log.station}/${log.matrix}[${log.row},${log.col}] ${log.stage} → v${log.version}${dedup}${latency}`
    }
    if (log.event === 'job_complete') {
      return `Job completed successfully (exit code: ${log.exitCode || 0})`
    }
    if (log.event === 'job_error') {
      return `Job failed (exit code: ${log.exitCode || 1})`
    }
    return log.message || JSON.stringify(log)
  }

  // Get log entry color
  const getLogColor = (log: LogEntry) => {
    if (log.event === 'stage_write' && log.stage) {
      return STAGE_COLORS[log.stage] || '#6b7280'
    }
    if (log.event === 'job_complete') return '#10b981'
    if (log.event === 'job_error') return '#ef4444'
    if (log.event === 'progress') return '#3b82f6'
    return '#6b7280'
  }

  // Initialize polling
  useEffect(() => {
    fetchMetrics()
    const interval = setInterval(fetchMetrics, 5000) // Poll every 5 seconds
    return () => clearInterval(interval)
  }, [orchestratorUrl])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [])

  const runningJobs = jobs.filter(job => job.status === 'running')
  const recentJobs = jobs.slice(0, showAllJobs ? undefined : 5)

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Pipeline Monitor</h3>
            <p className="text-sm text-gray-600 mt-1">
              Real-time pipeline execution monitoring
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-600">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
            
            {selectedJobId && (
              <Button
                size="sm"
                variant="default"
                onClick={disconnectFromLogs}
              >
                Disconnect
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Running Jobs */}
        {runningJobs.length > 0 && (
          <div className="mb-6">
            <h4 className="font-medium text-gray-800 mb-3">Active Jobs</h4>
            <div className="space-y-2">
              {runningJobs.map(job => (
                <div key={job.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border">
                  <div>
                    <div className="font-medium text-blue-800">
                      Job {job.id.substring(0, 8)}...
                    </div>
                    <Badge variant="default">Running</Badge>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => connectToJobLogs(job.id)}
                      disabled={selectedJobId === job.id}
                    >
                      {selectedJobId === job.id ? 'Watching' : 'Watch Logs'}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => stopJob(job.id)}
                    >
                      Stop
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Jobs */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-800">Recent Jobs</h4>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowAllJobs(!showAllJobs)}
            >
              {showAllJobs ? 'Show Less' : 'Show All'}
            </Button>
          </div>
          
          <div className="space-y-2">
            {recentJobs.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No recent jobs</p>
            ) : (
              recentJobs.map(job => (
                <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                  <div>
                    <div className="font-medium text-gray-800">
                      Job {job.id.substring(0, 8)}...
                    </div>
                    <Badge variant={
                      job.status === 'completed' ? 'default' :
                      job.status === 'failed' ? 'destructive' : 'secondary'
                    }>
                      {job.status}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => connectToJobLogs(job.id)}
                    disabled={selectedJobId === job.id}
                  >
                    {selectedJobId === job.id ? 'Watching' : 'View Logs'}
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live Logs */}
        {selectedJobId && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-800">
                Live Logs - Job {selectedJobId.substring(0, 8)}...
              </h4>
              <Badge variant="secondary">
                {logs.length} entries
              </Badge>
            </div>
            
            <div className="bg-gray-900 text-gray-100 rounded-lg p-4 max-h-64 overflow-y-auto font-mono text-sm">
              {logs.length === 0 ? (
                <div className="text-gray-400">Waiting for log entries...</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="flex items-start space-x-2 mb-1">
                    <span className="text-gray-500 text-xs">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span 
                      className="px-2 py-0.5 rounded text-xs font-medium"
                      style={{ 
                        backgroundColor: getLogColor(log),
                        color: 'white'
                      }}
                    >
                      {log.event}
                    </span>
                    <span className="flex-1 text-gray-100">
                      {formatLogEntry(log)}
                    </span>
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}