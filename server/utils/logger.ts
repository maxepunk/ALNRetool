import winston from 'winston';
import config from '../config/index.js';

// Sensitive patterns to redact
const SENSITIVE_PATTERNS = [
  { pattern: /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi, replacement: 'Bearer [REDACTED]' },
  { pattern: /secret_[A-Za-z0-9_\-]+/gi, replacement: '[REDACTED_SECRET]' },
  { pattern: /ntn_[A-Za-z0-9_\-]+/gi, replacement: '[REDACTED_NOTION_KEY]' },
  { pattern: /api[_\-]?key[\s:=]+["']?[A-Za-z0-9\-._]+["']?/gi, replacement: 'api_key=[REDACTED]' },
  { pattern: /token[\s:=]+["']?[A-Za-z0-9\-._]+["']?/gi, replacement: 'token=[REDACTED]' },
  { pattern: /password[\s:=]+["']?[^"'\s]+["']?/gi, replacement: 'password=[REDACTED]' },
  { pattern: /https?:\/\/[^:]+:[^@]+@/gi, replacement: 'https://[REDACTED_CREDENTIALS]@' },
];

// Redaction function
function redactSensitiveData(message: string): string {
  let redacted = message;
  for (const { pattern, replacement } of SENSITIVE_PATTERNS) {
    redacted = redacted.replace(pattern, replacement);
  }
  return redacted;
}

// Helper function to redact objects
function redactObject(obj: any): any {
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

// Custom format for development
const devFormat = winston.format.printf(({ level, message, timestamp, ...meta }) => {
  const redactedMessage = typeof message === 'string' ? redactSensitiveData(message) : message;
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(redactObject(meta), null, 2)}` : '';
  return `${timestamp} [${level.toUpperCase()}]: ${redactedMessage}${metaStr}`;
});

// Create logger instance with dynamic configuration
function createLogger() {
  // Get config values at runtime to avoid circular dependency
  const nodeEnv = config.nodeEnv;
  const logLevel = config.logLevel;
  
  return winston.createLogger({
    level: logLevel,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      winston.format.json()
    ),
    transports: [
      // Console transport for development
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          devFormat
        ),
        silent: nodeEnv === 'test'
      })
    ]
  });
}

const logger = createLogger();

// Production configuration
const nodeEnv = config.nodeEnv;
if (nodeEnv === 'production') {
  // Remove console transport in production
  logger.clear();
  
  // Add file transport for production
  logger.add(new winston.transports.File({
    filename: 'error.log',
    level: 'error',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  }));
  
  logger.add(new winston.transports.File({
    filename: 'combined.log',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  }));
}

// Export logger instance and helper methods
export default logger;

// Convenience methods that match console API
export const log = {
  error: (message: string, ...args: any[]) => logger.error(redactSensitiveData(message), ...args.map(redactObject)),
  warn: (message: string, ...args: any[]) => logger.warn(redactSensitiveData(message), ...args.map(redactObject)),
  info: (message: string, ...args: any[]) => logger.info(redactSensitiveData(message), ...args.map(redactObject)),
  debug: (message: string, ...args: any[]) => logger.debug(redactSensitiveData(message), ...args.map(redactObject)),
  verbose: (message: string, ...args: any[]) => logger.verbose(redactSensitiveData(message), ...args.map(redactObject)),
};