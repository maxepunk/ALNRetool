/**
 * Centralized logging service for the graph module
 * Provides environment-aware logging with configurable thresholds
 */

export const LogLevel = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
} as const;

export type LogLevel = typeof LogLevel[keyof typeof LogLevel];

interface LogContext {
  module?: string
  operation?: string
  entityId?: string
  entityType?: string
  [key: string]: any
}

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: LogContext
  data?: any
}

class Logger {
  private static instance: Logger
  private threshold: LogLevel
  private isDevelopment: boolean
  private isTest: boolean
  private logs: LogEntry[] = []
  private maxLogEntries = 1000

  private constructor() {
    this.isDevelopment = import.meta.env?.DEV === true || import.meta.env?.MODE === 'development'
    this.isTest = import.meta.env?.MODE === 'test'
    this.threshold = this.isDevelopment ? LogLevel.DEBUG : LogLevel.ERROR
    
    // In test environment, reduce log storage to prevent memory leaks
    if (this.isTest) {
      this.maxLogEntries = 100
    }
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  setThreshold(level: LogLevel): void {
    this.threshold = level
  }

  getThreshold(): LogLevel {
    return this.threshold
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.threshold
  }

  private getLevelName(level: LogLevel): string {
    switch (level) {
      case LogLevel.ERROR: return 'ERROR'
      case LogLevel.WARN: return 'WARN'
      case LogLevel.INFO: return 'INFO'
      case LogLevel.DEBUG: return 'DEBUG'
      default: return 'UNKNOWN'
    }
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const levelName = this.getLevelName(level)
    const contextStr = context 
      ? ` [${Object.entries(context)
          .filter(([_, v]) => v !== undefined)
          .map(([k, v]) => `${k}:${v}`)
          .join(' ')}]`
      : ''
    return `[${levelName}]${contextStr} ${message}`
  }

  private createLogEntry(level: LogLevel, message: string, context?: LogContext, data?: any): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      data
    }
  }

  private storeLog(entry: LogEntry): void {
    // Skip storing logs in test environment to prevent memory leaks
    if (this.isTest) return
    
    this.logs.push(entry)
    if (this.logs.length > this.maxLogEntries) {
      this.logs.shift() // Remove oldest entry
    }
  }

  private output(level: LogLevel, formattedMessage: string, data?: any): void {
    // In test environment, only output errors to reduce noise
    if (this.isTest && level !== LogLevel.ERROR) return
    
    if (!this.isDevelopment && !this.isTest) return

    switch (level) {
      case LogLevel.ERROR:
        console.error(formattedMessage, data !== undefined ? data : '')
        break
      case LogLevel.WARN:
        console.warn(formattedMessage, data !== undefined ? data : '')
        break
      case LogLevel.INFO:
        console.info(formattedMessage, data !== undefined ? data : '')
        break
      case LogLevel.DEBUG:
        console.debug(formattedMessage, data !== undefined ? data : '')
        break
    }
  }

  log(level: LogLevel, message: string, context?: LogContext, data?: any): void {
    if (!this.shouldLog(level)) return

    const entry = this.createLogEntry(level, message, context, data)
    this.storeLog(entry)

    const formattedMessage = this.formatMessage(level, message, context)
    this.output(level, formattedMessage, data)
  }

  error(message: string, context?: LogContext, error?: Error): void {
    this.log(LogLevel.ERROR, message, context, error)
  }

  warn(message: string, context?: LogContext, data?: any): void {
    this.log(LogLevel.WARN, message, context, data)
  }

  info(message: string, context?: LogContext, data?: any): void {
    this.log(LogLevel.INFO, message, context, data)
  }

  debug(message: string, context?: LogContext, data?: any): void {
    this.log(LogLevel.DEBUG, message, context, data)
  }

  /**
   * Performance logging helper
   */
  startTimer(label: string): () => void {
    const startTime = performance.now()
    
    return () => {
      const duration = performance.now() - startTime
      this.debug(`${label} completed`, 
        { operation: 'performance' }, 
        { duration: `${duration.toFixed(2)}ms` }
      )
    }
  }

  /**
   * Group related logs together
   */
  group(label: string, fn: () => void): void {
    if (!this.isDevelopment || !this.shouldLog(LogLevel.DEBUG)) {
      fn()
      return
    }

    console.group(label)
    try {
      fn()
    } finally {
      console.groupEnd()
    }
  }

  /**
   * Get recent logs for debugging
   */
  getRecentLogs(count = 100, level?: LogLevel): LogEntry[] {
    let filtered = this.logs
    if (level !== undefined) {
      filtered = this.logs.filter(log => log.level === level)
    }
    return filtered.slice(-count)
  }

  /**
   * Clear stored logs
   */
  clearLogs(): void {
    this.logs = []
  }

  /**
   * Export logs for debugging
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }

  /**
   * Reset logger instance (for testing)
   */
  static reset(): void {
    if (Logger.instance) {
      Logger.instance.clearLogs()
      Logger.instance = null as any
    }
  }
}

// Export singleton instance
export const logger = Logger.getInstance()

// Export convenience functions
export const logError = (message: string, context?: LogContext, error?: Error) => 
  logger.error(message, context, error)

export const logWarn = (message: string, context?: LogContext, data?: any) => 
  logger.warn(message, context, data)

export const logInfo = (message: string, context?: LogContext, data?: any) => 
  logger.info(message, context, data)

export const logDebug = (message: string, context?: LogContext, data?: any) => 
  logger.debug(message, context, data)

export const logTimer = (label: string) => 
  logger.startTimer(label)

export const logGroup = (label: string, fn: () => void) => 
  logger.group(label, fn)