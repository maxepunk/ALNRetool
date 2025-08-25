/**
 * Centralized configuration module for ALNRetool server
 * All environment variables should be accessed through this module
 */

// Removed logger import to break circular dependency
// Will use console.log for config validation instead

/**
 * Redacts sensitive configuration values before logging
 * Filters out keys matching /key|token|secret/i pattern
 */
function redactSensitiveConfig(config: any): any {
  const sensitivePattern = /key|token|secret/i;
  
  function deepCloneAndRedact(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(deepCloneAndRedact);
    }
    
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (sensitivePattern.test(key)) {
        result[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        result[key] = deepCloneAndRedact(value);
      } else {
        result[key] = value;
      }
    }
    return result;
  }
  
  return deepCloneAndRedact(config);
}

interface Config {
  // Server configuration
  port: number;
  nodeEnv: 'development' | 'test' | 'production';
  logLevel: string;
  
  // Notion API configuration
  notionApiKey: string;
  notionVersion: string;
  
  // Database IDs
  notionDatabaseIds: {
    characters: string;
    elements: string;
    puzzles: string;
    timeline: string;
  };
  
  // API configuration
  apiRateLimit: {
    maxRequests: number;
    windowMs: number;
  };
  
  // Cache configuration
  cacheConfig: {
    ttl: number; // Time to live in seconds
    checkPeriod: number; // Check period in seconds
    maxKeys: number; // Maximum number of cache entries
  };
  
  // CORS configuration
  corsOrigins: string[];
  
  // Session configuration
  sessionSecret: string;
  
  // Admin configuration
  adminKey?: string; // Optional admin key for cache management
  
  // Feature flags
  features: {
    enableWebWorkers: boolean;
    enableCaching: boolean;
    enableRateLimit: boolean;
  };
}

/**
 * Validates that a required environment variable is present
 */
function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

/**
 * Gets an optional environment variable with a default value
 */
function getOptionalEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

/**
 * Parses a boolean environment variable
 */
function getBooleanEnv(key: string, defaultValue: boolean): boolean {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true';
}

/**
 * Parses a number environment variable
 */
function getNumberEnv(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    console.warn(`Invalid number for ${key}: ${value}, using default: ${defaultValue}`);
    return defaultValue;
  }
  return parsed;
}

/**
 * Parses a comma-separated list from environment variable
 */
function getArrayEnv(key: string, defaultValue: string[]): string[] {
  const value = process.env[key];
  if (!value) return defaultValue;
  return value.split(',').map(s => s.trim()).filter(Boolean);
}

/**
 * Load and validate configuration
 * This should be called once at server startup
 */
function loadConfig(): Config {
  // Only load dotenv in non-production environments
  if (process.env.NODE_ENV !== 'production') {
    const { config: loadDotenv } = require('dotenv');
    loadDotenv();
  }
  
  const nodeEnv = (process.env.NODE_ENV || 'development') as Config['nodeEnv'];
  
  // Validate NODE_ENV
  if (!['development', 'test', 'production'].includes(nodeEnv)) {
    throw new Error(`Invalid NODE_ENV: ${nodeEnv}`);
  }
  
  const config: Config = {
    // Server configuration
    port: getNumberEnv('PORT', 3001),
    nodeEnv,
    logLevel: getOptionalEnv('LOG_LEVEL', 'info'),
    
    // Notion API configuration - REQUIRED
    notionApiKey: getRequiredEnv('NOTION_API_KEY'),
    notionVersion: getOptionalEnv('NOTION_VERSION', '2022-06-28'),
    
    // Database IDs with defaults from CLAUDE.md
    notionDatabaseIds: {
      characters: getOptionalEnv('NOTION_DB_CHARACTERS', '18c2f33d-583f-8060-a6ab-de32ff06bca2'),
      elements: getOptionalEnv('NOTION_DB_ELEMENTS', '18c2f33d-583f-8020-91bc-d84c7dd94306'),
      puzzles: getOptionalEnv('NOTION_DB_PUZZLES', '1b62f33d-583f-80cc-87cf-d7d6c4b0b265'),
      timeline: getOptionalEnv('NOTION_DB_TIMELINE', '1b52f33d-583f-80de-ae5a-d20020c120dd'),
    },
    
    // API configuration
    apiRateLimit: {
      maxRequests: getNumberEnv('API_RATE_LIMIT_MAX', 100),
      windowMs: getNumberEnv('API_RATE_LIMIT_WINDOW_MS', 60000), // 1 minute
    },
    
    // Cache configuration
    cacheConfig: {
      ttl: getNumberEnv('CACHE_TTL_SECONDS', 300), // 5 minutes
      checkPeriod: getNumberEnv('CACHE_CHECK_PERIOD_SECONDS', 600), // 10 minutes
      maxKeys: getNumberEnv('CACHE_MAX_KEYS', 1000),
    },
    
    // CORS configuration
    corsOrigins: nodeEnv === 'production' 
      ? getArrayEnv('CORS_ORIGINS', ['https://alnretool.com'])
      : getArrayEnv('CORS_ORIGINS', ['http://localhost:5173', 'http://localhost:3000']),
    
    // Session secret - generate a random one for dev/test if not provided
    sessionSecret: nodeEnv === 'production'
      ? getRequiredEnv('SESSION_SECRET')
      : getOptionalEnv('SESSION_SECRET', 'dev-secret-change-in-production'),
    
    // Admin configuration
    adminKey: process.env.ADMIN_KEY || undefined,
    
    // Feature flags
    features: {
      enableWebWorkers: getBooleanEnv('ENABLE_WEB_WORKERS', true),
      enableCaching: getBooleanEnv('ENABLE_CACHING', true),
      enableRateLimit: getBooleanEnv('ENABLE_RATE_LIMIT', nodeEnv === 'production'),
    },
  };
  
  // Log configuration (sensitive values are automatically redacted)
  console.log('Configuration loaded:', JSON.stringify(redactSensitiveConfig(config), null, 2));
  
  return config;
}

// Load configuration once and export
const config = loadConfig();

// Freeze the config to prevent accidental mutations
Object.freeze(config);
Object.freeze(config.notionDatabaseIds);
Object.freeze(config.apiRateLimit);
Object.freeze(config.cacheConfig);
Object.freeze(config.features);

export default config;

// Named exports for convenience
export const {
  port,
  nodeEnv,
  logLevel,
  notionApiKey,
  notionVersion,
  notionDatabaseIds,
  apiRateLimit,
  cacheConfig,
  corsOrigins,
  sessionSecret,
  adminKey,
  features,
} = config;