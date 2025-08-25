/**
 * Centralized performance monitoring service
 * Prevents timer collisions and provides consistent performance tracking
 */

import { logger, LogLevel } from './Logger'

interface PerformanceEntry {
  label: string
  startTime: number
  endTime?: number
  duration?: number
  metadata?: Record<string, any>
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private activeTimers: Map<string, PerformanceEntry> = new Map()
  private completedEntries: PerformanceEntry[] = []
  private maxEntries = 500
  private isDevelopment: boolean

  private constructor() {
    this.isDevelopment = import.meta.env?.DEV === true
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  /**
   * Generate unique timer ID to prevent collisions
   */
  private generateTimerId(label: string): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substr(2, 9)
    return `${label}-${timestamp}-${random}`
  }

  /**
   * Start a performance timer with automatic collision prevention
   */
  startTimer(label: string, metadata?: Record<string, any>): string {
    const timerId = this.generateTimerId(label)
    
    const entry: PerformanceEntry = {
      label,
      startTime: performance.now(),
      metadata
    }

    this.activeTimers.set(timerId, entry)

    if (this.isDevelopment) {
      console.time(timerId)
    }

    return timerId
  }

  /**
   * End a performance timer and log the results
   */
  endTimer(timerId: string): number | null {
    const entry = this.activeTimers.get(timerId)
    
    if (!entry) {
      logger.warn('Timer not found', { operation: 'performance', timerId })
      return null
    }

    entry.endTime = performance.now()
    entry.duration = entry.endTime - entry.startTime

    if (this.isDevelopment) {
      console.timeEnd(timerId)
    }

    // Store completed entry
    this.completedEntries.push(entry)
    if (this.completedEntries.length > this.maxEntries) {
      this.completedEntries.shift()
    }

    // Remove from active timers
    this.activeTimers.delete(timerId)

    // Log the performance data
    logger.debug(
      `Performance: ${entry.label}`,
      { 
        operation: 'performance',
        ...entry.metadata
      },
      {
        duration: `${entry.duration.toFixed(2)}ms`,
        startTime: entry.startTime,
        endTime: entry.endTime
      }
    )

    return entry.duration
  }

  /**
   * Measure a synchronous operation
   */
  measure<T>(label: string, fn: () => T, metadata?: Record<string, any>): T {
    const timerId = this.startTimer(label, metadata)
    try {
      const result = fn()
      return result
    } finally {
      this.endTimer(timerId)
    }
  }

  /**
   * Measure an asynchronous operation
   */
  async measureAsync<T>(
    label: string, 
    fn: () => Promise<T>, 
    metadata?: Record<string, any>
  ): Promise<T> {
    const timerId = this.startTimer(label, metadata)
    try {
      const result = await fn()
      return result
    } finally {
      this.endTimer(timerId)
    }
  }

  /**
   * Get active timers (for debugging)
   */
  getActiveTimers(): string[] {
    return Array.from(this.activeTimers.keys())
  }

  /**
   * Get performance statistics
   */
  getStatistics(label?: string): {
    count: number
    total: number
    average: number
    min: number
    max: number
  } | null {
    const entries = label
      ? this.completedEntries.filter(e => e.label === label)
      : this.completedEntries

    if (entries.length === 0) return null

    const durations = entries
      .filter(e => e.duration !== undefined)
      .map(e => e.duration!)

    if (durations.length === 0) return null

    const total = durations.reduce((sum, d) => sum + d, 0)
    const average = total / durations.length
    const min = Math.min(...durations)
    const max = Math.max(...durations)

    return {
      count: durations.length,
      total,
      average,
      min,
      max
    }
  }

  /**
   * Clear a stuck timer
   */
  clearTimer(timerId: string): void {
    if (this.activeTimers.has(timerId)) {
      this.activeTimers.delete(timerId)
      logger.debug('Cleared stuck timer', { operation: 'performance', timerId })
    }
  }

  /**
   * Clear all active timers
   */
  clearAllTimers(): void {
    const count = this.activeTimers.size
    this.activeTimers.clear()
    if (count > 0) {
      logger.debug(`Cleared ${count} active timers`, { operation: 'performance' })
    }
  }

  /**
   * Get recent performance entries
   */
  getRecentEntries(count = 50): PerformanceEntry[] {
    return this.completedEntries.slice(-count)
  }

  /**
   * Export performance data for analysis
   */
  exportData(): string {
    const data = {
      active: Array.from(this.activeTimers.entries()).map(([id, entry]) => ({
        id,
        ...entry
      })),
      completed: this.completedEntries,
      statistics: {
        overall: this.getStatistics(),
        byLabel: Array.from(
          new Set(this.completedEntries.map(e => e.label))
        ).reduce((acc, label) => {
          acc[label] = this.getStatistics(label)
          return acc
        }, {} as Record<string, any>)
      }
    }
    return JSON.stringify(data, null, 2)
  }

  /**
   * Reset all performance data
   */
  reset(): void {
    this.activeTimers.clear()
    this.completedEntries = []
    logger.debug('Performance monitor reset', { operation: 'performance' })
  }

  /**
   * Reset monitor instance (for testing)
   */
  static reset(): void {
    if (PerformanceMonitor.instance) {
      PerformanceMonitor.instance.reset()
      PerformanceMonitor.instance = null as any
    }
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance()

// Export convenience functions
export const startTimer = (label: string, metadata?: Record<string, any>) =>
  performanceMonitor.startTimer(label, metadata)

export const endTimer = (timerId: string) =>
  performanceMonitor.endTimer(timerId)

export const measure = <T>(label: string, fn: () => T, metadata?: Record<string, any>) =>
  performanceMonitor.measure(label, fn, metadata)

export const measureAsync = <T>(
  label: string,
  fn: () => Promise<T>,
  metadata?: Record<string, any>
) => performanceMonitor.measureAsync(label, fn, metadata)

export const getPerformanceStats = (label?: string) =>
  performanceMonitor.getStatistics(label)