/**
 * @module logger
 * @description Browser-safe logging utility with automatic sensitive data redaction
 * 
 * This module provides a unified logging interface that works in both browser and Node.js
 * environments. It automatically redacts sensitive information like API keys, passwords,
 * and tokens before logging to prevent accidental exposure in logs.
 * 
 * @example
 * ```typescript
 * import { log } from '@/utils/logger';
 * 
 * // Basic logging
 * log.info('User logged in', { userId: 123 });
 * log.error('API call failed', { error: err });
 * 
 * // Sensitive data is automatically redacted
 * log.debug('API request', { 
 *   apiKey: 'secret_12345' // Will be logged as '[REDACTED_SECRET]'
 * });
 * ```
 */

// Logger removed in Phase 3

/**
 * Sensitive data patterns for automatic redaction
 * Each pattern identifies sensitive information that should be hidden in logs
 */
const SENSITIVE_PATTERNS = [
  { pattern: /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi, replacement: 'Bearer [REDACTED]' },
  { pattern: /secret_[A-Za-z0-9_\-]+/gi, replacement: '[REDACTED_SECRET]' },
  { pattern: /ntn_[A-Za-z0-9_\-]+/gi, replacement: '[REDACTED_NOTION_KEY]' },
  { pattern: /api[_\-]?key[\s:=]+["']?[A-Za-z0-9\-._]+["']?/gi, replacement: 'api_key=[REDACTED]' },
  { pattern: /token[\s:=]+["']?[A-Za-z0-9\-._]+["']?/gi, replacement: 'token=[REDACTED]' },
  { pattern: /password[\s:=]+["']?[^"'\s]+["']?/gi, replacement: 'password=[REDACTED]' },
  { pattern: /https?:\/\/[^:]+:[^@]+@/gi, replacement: 'https://[REDACTED_CREDENTIALS]@' },
];

/**
 * Redacts sensitive data from a string message
 * 
 * @param {string} message - The message to redact
 * @returns {string} Message with sensitive data replaced by redaction markers
 * 
 * @complexity O(n * p) where n is message length and p is number of patterns
 * 
 * @example
 * ```typescript
 * redactSensitiveData('Bearer token123') // Returns: 'Bearer [REDACTED]'
 * redactSensitiveData('api_key=abc123') // Returns: 'api_key=[REDACTED]'
 * ```
 */
function redactSensitiveData(message: string): string {
  let redacted = message;
  // Apply each sensitive pattern sequentially
  for (const { pattern, replacement } of SENSITIVE_PATTERNS) {
    redacted = redacted.replace(pattern, replacement);
  }
  return redacted;
}

/**
 * Recursively redacts sensitive data from objects, arrays, and strings
 * 
 * @param {any} obj - The object to redact (can be any type)
 * @returns {any} Object with sensitive data redacted
 * 
 * @complexity O(n) where n is total number of properties in nested structure
 * 
 * @flow
 * 1. String → Apply redaction patterns
 * 2. Array → Recursively redact each element
 * 3. Object → Check keys for sensitive names, recursively redact values
 * 4. Primitives → Return as-is
 * 
 * @example
 * ```typescript
 * redactObject({ apiKey: 'secret123', data: 'safe' })
 * // Returns: { apiKey: '[REDACTED]', data: 'safe' }
 * ```
 */
export function redactObject(obj: any): any {
  if (typeof obj === 'string') {
    return redactSensitiveData(obj);
  }
  
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(redactObject);
  }
  
  if (typeof obj === 'object') {
    const redacted: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Redact entire value for sensitive keys
      if (/key|token|secret|password/i.test(key)) {
        redacted[key] = '[REDACTED]';
      } else {
        redacted[key] = redactObject(value);
      }
    }
    return redacted;
  }
  
  return obj;
}

/**
 * Browser-safe logger implementation
 * 
 * Provides logging methods that work in both browser and Node.js environments.
 * Automatically redacts sensitive data and respects environment settings.
 * In production, only errors and warnings are logged to reduce noise.
 * 
 * @class BrowserLogger
 * 
 * @example
 * ```typescript
 * const logger = new BrowserLogger();
 * console.info('Application started');
 * console.error('Database connection failed', { host: 'localhost' });
 * ```
 */
class BrowserLogger {
  /**
   * Determines if running in development mode
   * Uses Vite's import.meta.env.DEV flag when available
   */
  private isDevelopment = typeof import.meta !== 'undefined' && import.meta.env?.DEV;
  
  /**
   * Logs error messages with automatic redaction
   * 
   * @param {string} message - The error message to log
   * @param {...any} args - Additional arguments to log
   * 
   * @flow Delegates to graphLogger with [ERROR] prefix after redacting sensitive data
   */
  error(message: string, ...args: any[]) {
    if (this.isDevelopment || typeof import.meta === 'undefined') {
      console.error(`[ERROR]: ${redactSensitiveData(message)}`, undefined, ...args.map(redactObject));
    }
  }
  
  /**
   * Logs warning messages with automatic redaction
   * 
   * @param {string} message - The warning message to log
   * @param {...any} args - Additional arguments to log
   * 
   * @flow Delegates to graphLogger with [WARN] prefix after redacting sensitive data
   */
  warn(message: string, ...args: any[]) {
    if (this.isDevelopment || typeof import.meta === 'undefined') {
      console.warn(`[WARN]: ${redactSensitiveData(message)}`, undefined, ...args.map(redactObject));
    }
  }
  
  /**
   * Logs informational messages with automatic redaction
   * Only logs in development mode to reduce production noise
   * 
   * @param {string} message - The info message to log
   * @param {...any} args - Additional arguments to log
   * 
   * @flow Delegates to graphLogger with [INFO] prefix after redacting sensitive data
   */
  info(message: string, ...args: any[]) {
    if (this.isDevelopment || typeof import.meta === 'undefined') {
      console.info(`[INFO]: ${redactSensitiveData(message)}`, undefined, ...args.map(redactObject));
    }
  }
  
  /**
   * Logs debug messages with automatic redaction
   * Only logs in development mode for detailed debugging
   * 
   * @param {string} message - The debug message to log
   * @param {...any} args - Additional arguments to log
   * 
   * @flow Uses console.debug directly for browser compatibility
   */
  debug(message: string, ...args: any[]) {
    if (this.isDevelopment || typeof import.meta === 'undefined') {
      console.debug(`[DEBUG]: ${redactSensitiveData(message)}`, ...args.map(redactObject));
    }
  }
  
  /**
   * Logs verbose messages with automatic redaction
   * Only logs in development mode for maximum detail
   * 
   * @param {string} message - The verbose message to log
   * @param {...any} args - Additional arguments to log
   * 
   * @flow Delegates to console.debug with [VERBOSE] prefix
   */
  verbose(message: string, ...args: any[]) {
    if (this.isDevelopment || typeof import.meta === 'undefined') {
      console.debug(`[VERBOSE]: ${redactSensitiveData(message)}`, undefined, ...args.map(redactObject));
    }
  }
}

/**
 * Singleton instance of the browser-safe logger
 * @constant {BrowserLogger}
 */
const browserLogger = new BrowserLogger();

/**
 * Unified logger interface for consistent logging across the application
 * @constant {BrowserLogger}
 */
const logger = browserLogger;

/**
 * Convenience logging methods that match the console API
 * Provides a familiar interface for developers used to console.log patterns
 * 
 * @namespace log
 * 
 * @property {Function} error - Log error messages
 * @property {Function} warn - Log warning messages
 * @property {Function} info - Log informational messages
 * @property {Function} debug - Log debug messages
 * @property {Function} verbose - Log verbose messages
 * 
 * @example
 * ```typescript
 * import { log } from '@/utils/logger';
 * 
 * log.error('Database connection failed', { error: err });
 * log.info('User action', { action: 'login', userId: 123 });
 * log.debug('Cache miss', { key: 'user:123' });
 * ```
 */
export const log = {
  error: (message: string, ...args: any[]) => browserLogger.error(message, ...args),
  warn: (message: string, ...args: any[]) => browserLogger.warn(message, ...args),
  info: (message: string, ...args: any[]) => browserLogger.info(message, ...args),
  debug: (message: string, ...args: any[]) => browserLogger.debug(message, ...args),
  verbose: (message: string, ...args: any[]) => browserLogger.verbose(message, ...args),
};

/**
 * Default export for compatibility with modules expecting a logger instance
 * @exports logger
 */
export default logger;