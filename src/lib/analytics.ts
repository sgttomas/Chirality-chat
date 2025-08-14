/**
 * Privacy-focused analytics and usage tracking for chirality-chat
 * Collects anonymous usage patterns to improve the application
 */

interface AnalyticsEvent {
  category: string
  action: string
  label?: string
  value?: number
  timestamp: number
  sessionId: string
  userId?: string
  metadata?: Record<string, any>
}

interface SessionInfo {
  sessionId: string
  startTime: number
  lastActivity: number
  pageViews: string[]
  interactions: number
}

interface UsageMetrics {
  // Chat metrics
  messagesPerSession: number
  averageMessageLength: number
  streamingUsage: number
  
  // Matrix metrics
  matrixViews: number
  matrixInteractions: number
  zoomOperations: number
  
  // MCP metrics
  mcpConnections: number
  toolInvocations: number
  
  // Performance metrics
  averageLoadTime: number
  renderPerformance: {
    fps: number
    frameTime: number
  }
  
  // Feature usage
  featureUsage: Record<string, number>
}

class AnalyticsService {
  private events: AnalyticsEvent[] = []
  private session: SessionInfo
  private enabled = true
  private batchSize = 10
  private flushInterval = 30000 // 30 seconds
  private maxStorageEvents = 1000

  constructor() {
    this.session = this.initializeSession()
    this.loadStoredEvents()
    this.startPeriodicFlush()
    this.setupBeforeUnload()
  }

  private initializeSession(): SessionInfo {
    const sessionId = this.generateSessionId()
    return {
      sessionId,
      startTime: Date.now(),
      lastActivity: Date.now(),
      pageViews: [],
      interactions: 0
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private loadStoredEvents(): void {
    try {
      const stored = localStorage.getItem('chirality_analytics_events')
      if (stored) {
        this.events = JSON.parse(stored).slice(-this.maxStorageEvents)
      }
    } catch (error) {
      console.warn('Failed to load stored analytics events:', error)
    }
  }

  private saveEvents(): void {
    try {
      const eventsToStore = this.events.slice(-this.maxStorageEvents)
      localStorage.setItem('chirality_analytics_events', JSON.stringify(eventsToStore))
    } catch (error) {
      console.warn('Failed to save analytics events:', error)
    }
  }

  private startPeriodicFlush(): void {
    setInterval(() => {
      this.flush()
    }, this.flushInterval)
  }

  private setupBeforeUnload(): void {
    window.addEventListener('beforeunload', () => {
      this.trackEvent('session', 'end', undefined, Date.now() - this.session.startTime)
      this.flush(true) // Synchronous flush
    })
  }

  // Core tracking methods
  trackEvent(
    category: string, 
    action: string, 
    label?: string, 
    value?: number,
    metadata?: Record<string, any>
  ): void {
    if (!this.enabled) return

    const event: AnalyticsEvent = {
      category,
      action,
      label,
      value,
      timestamp: Date.now(),
      sessionId: this.session.sessionId,
      metadata
    }

    this.events.push(event)
    this.session.lastActivity = Date.now()
    this.session.interactions++

    // Auto-flush if batch size reached
    if (this.events.length >= this.batchSize) {
      this.flush()
    }

    this.saveEvents()
  }

  trackPageView(page: string): void {
    this.session.pageViews.push(page)
    this.trackEvent('navigation', 'page_view', page)
  }

  trackError(error: Error, context?: string): void {
    this.trackEvent('error', 'javascript_error', context, undefined, {
      message: error.message,
      stack: error.stack?.substring(0, 500), // Limit stack trace length
      url: window.location.href
    })
  }

  trackPerformance(metric: string, duration: number): void {
    this.trackEvent('performance', metric, undefined, duration)
  }

  trackFeatureUsage(feature: string, action: string = 'use'): void {
    this.trackEvent('feature', action, feature)
  }

  // Specific tracking methods for chirality-chat features
  trackChatMessage(messageLength: number, isStreaming: boolean): void {
    this.trackEvent('chat', 'message_sent', undefined, messageLength, {
      streaming: isStreaming
    })
  }

  trackMatrixInteraction(action: string, details?: any): void {
    this.trackEvent('matrix', action, undefined, undefined, details)
  }

  trackMCPAction(action: string, serverId?: string, toolName?: string): void {
    this.trackEvent('mcp', action, serverId, undefined, {
      toolName
    })
  }

  trackSearchQuery(query: string, resultsCount: number): void {
    this.trackEvent('search', 'query', undefined, resultsCount, {
      queryLength: query.length
    })
  }

  trackExport(type: 'chat' | 'matrix', format: string): void {
    this.trackEvent('export', type, format)
  }

  // Analytics aggregation
  getSessionMetrics(): SessionInfo & { duration: number } {
    return {
      ...this.session,
      duration: Date.now() - this.session.startTime
    }
  }

  getUsageMetrics(): UsageMetrics {
    const chatEvents = this.events.filter(e => e.category === 'chat')
    const matrixEvents = this.events.filter(e => e.category === 'matrix')
    const mcpEvents = this.events.filter(e => e.category === 'mcp')
    const performanceEvents = this.events.filter(e => e.category === 'performance')

    const messageLengths = chatEvents
      .filter(e => e.action === 'message_sent' && e.value)
      .map(e => e.value!)

    const featureUsage: Record<string, number> = {}
    this.events
      .filter(e => e.category === 'feature')
      .forEach(e => {
        if (e.label) {
          featureUsage[e.label] = (featureUsage[e.label] || 0) + 1
        }
      })

    return {
      messagesPerSession: chatEvents.filter(e => e.action === 'message_sent').length,
      averageMessageLength: messageLengths.length > 0 
        ? messageLengths.reduce((a, b) => a + b, 0) / messageLengths.length 
        : 0,
      streamingUsage: chatEvents.filter(e => e.metadata?.streaming).length,
      
      matrixViews: matrixEvents.filter(e => e.action === 'view').length,
      matrixInteractions: matrixEvents.filter(e => e.action !== 'view').length,
      zoomOperations: matrixEvents.filter(e => e.action === 'zoom').length,
      
      mcpConnections: mcpEvents.filter(e => e.action === 'connect').length,
      toolInvocations: mcpEvents.filter(e => e.action === 'tool_call').length,
      
      averageLoadTime: this.calculateAverageMetric(performanceEvents, 'load_time'),
      renderPerformance: {
        fps: this.calculateAverageMetric(performanceEvents, 'fps'),
        frameTime: this.calculateAverageMetric(performanceEvents, 'frame_time')
      },
      
      featureUsage
    }
  }

  private calculateAverageMetric(events: AnalyticsEvent[], metricName: string): number {
    const values = events
      .filter(e => e.action === metricName && e.value !== undefined)
      .map(e => e.value!)
    
    return values.length > 0 
      ? values.reduce((a, b) => a + b, 0) / values.length 
      : 0
  }

  // Data export for analysis
  exportData(): {
    events: AnalyticsEvent[]
    session: SessionInfo
    metrics: UsageMetrics
  } {
    return {
      events: this.events,
      session: this.session,
      metrics: this.getUsageMetrics()
    }
  }

  // Privacy controls
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    if (!enabled) {
      this.clearData()
    }
  }

  clearData(): void {
    this.events = []
    try {
      localStorage.removeItem('chirality_analytics_events')
    } catch (error) {
      console.warn('Failed to clear analytics data:', error)
    }
  }

  // Data transmission (placeholder - would integrate with analytics service)
  private async flush(synchronous = false): Promise<void> {
    if (this.events.length === 0) return

    const eventsToSend = [...this.events]
    this.events = []

    try {
      // In a real implementation, this would send to an analytics service
      // For now, we just log the events (in development) or store them
      if (process.env.NODE_ENV === 'development') {
        console.log('Analytics flush:', {
          events: eventsToSend.length,
          session: this.session,
          metrics: this.getUsageMetrics()
        })
      }

      // Simulate async request (in production, would be actual HTTP request)
      if (!synchronous) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }

    } catch (error) {
      console.warn('Failed to flush analytics events:', error)
      // Re-add events to queue for retry
      this.events.unshift(...eventsToSend)
    }
  }
}

// Global analytics instance
let analyticsInstance: AnalyticsService | null = null

export function getAnalytics(): AnalyticsService {
  if (!analyticsInstance) {
    analyticsInstance = new AnalyticsService()
  }
  return analyticsInstance
}

// Convenience tracking functions
export const analytics = {
  track: (category: string, action: string, label?: string, value?: number, metadata?: any) => 
    getAnalytics().trackEvent(category, action, label, value, metadata),
  
  trackPageView: (page: string) => getAnalytics().trackPageView(page),
  trackError: (error: Error, context?: string) => getAnalytics().trackError(error, context),
  trackPerformance: (metric: string, duration: number) => getAnalytics().trackPerformance(metric, duration),
  trackFeature: (feature: string, action: string = 'use') => getAnalytics().trackFeatureUsage(feature, action),
  
  trackChat: (messageLength: number, isStreaming: boolean) => 
    getAnalytics().trackChatMessage(messageLength, isStreaming),
  
  trackMatrix: (action: string, details?: any) => 
    getAnalytics().trackMatrixInteraction(action, details),
  
  trackMCP: (action: string, serverId?: string, toolName?: string) => 
    getAnalytics().trackMCPAction(action, serverId, toolName),
  
  trackExport: (type: 'chat' | 'matrix', format: string) => 
    getAnalytics().trackExport(type, format),

  getMetrics: () => getAnalytics().getUsageMetrics(),
  getSession: () => getAnalytics().getSessionMetrics(),
  exportData: () => getAnalytics().exportData(),
  
  setEnabled: (enabled: boolean) => getAnalytics().setEnabled(enabled),
  clearData: () => getAnalytics().clearData()
}

// Auto-initialize on import (only in browser)
if (typeof window !== 'undefined') {
  // Delay initialization to avoid blocking
  setTimeout(() => {
    try {
      getAnalytics()
    } catch (error) {
      console.warn('Analytics initialization failed:', error)
    }
  }, 0)
}