/**
 * Worker Message Validation
 * Validates and sanitizes messages sent to and from Web Workers
 */

import type { 
  WorkerMessage, 
  WorkerError, 
  WorkerProgress
} from './types';

export interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitized?: WorkerMessage | WorkerError | WorkerProgress;
}

/**
 * Validate incoming worker message
 */
export function validateIncomingMessage(data: unknown): ValidationResult {
  // Check if data exists
  if (!data || typeof data !== 'object') {
    return {
      valid: false,
      error: 'Invalid message: expected object'
    };
  }

  // Check message type
  const validTypes = ['init', 'tick', 'complete', 'error', 'cancel'];
  const msg = data as any;
  if (!msg.type || !validTypes.includes(msg.type)) {
    return {
      valid: false,
      error: `Invalid message type: ${msg.type}`
    };
  }

  // Type-specific validation
  switch (msg.type) {
    case 'init':
      return validateInitMessage(msg);
    case 'tick':
      return validateTickMessage(msg);
    case 'complete':
      return validateCompleteMessage(msg);
    case 'error':
      return validateErrorMessage(msg);
    case 'cancel':
      return { valid: true, sanitized: msg as WorkerMessage };
    default:
      return {
        valid: false,
        error: `Unknown message type: ${msg.type}`
      };
  }
}

/**
 * Validate init message
 */
function validateInitMessage(data: any): ValidationResult {
  // Check for required fields
  if (!Array.isArray(data.nodes)) {
    return {
      valid: false,
      error: 'Init message requires nodes array'
    };
  }

  if (!Array.isArray(data.edges)) {
    return {
      valid: false,
      error: 'Init message requires edges array'
    };
  }

  // Validate nodes
  for (const node of data.nodes) {
    if (!node || typeof node !== 'object') {
      return {
        valid: false,
        error: 'Invalid node: expected object'
      };
    }
    if (!node.id || typeof node.id !== 'string') {
      return {
        valid: false,
        error: 'Invalid node: missing or invalid id'
      };
    }
  }

  // Validate edges
  for (const edge of data.edges) {
    if (!edge || typeof edge !== 'object') {
      return {
        valid: false,
        error: 'Invalid edge: expected object'
      };
    }
    if (!edge.source || typeof edge.source !== 'string') {
      return {
        valid: false,
        error: 'Invalid edge: missing or invalid source'
      };
    }
    if (!edge.target || typeof edge.target !== 'string') {
      return {
        valid: false,
        error: 'Invalid edge: missing or invalid target'
      };
    }
  }

  // Validate config if present
  if (data.config && typeof data.config !== 'object') {
    return {
      valid: false,
      error: 'Invalid config: expected object'
    };
  }

  // Sanitize config values
  const sanitizedConfig = sanitizeConfig(data.config || {} as Record<string, unknown>);

  return {
    valid: true,
    sanitized: {
      type: data.type as 'start' | 'tick' | 'complete' | 'error' | 'progress',
      nodes: data.nodes,
      edges: data.edges,
      config: sanitizedConfig
    } as WorkerMessage
  };
}

/**
 * Validate tick message
 */
function validateTickMessage(data: any): ValidationResult {
  // Check progress
  if (data.progress !== undefined) {
    if (typeof data.progress !== 'number' || 
        data.progress < 0 || 
        data.progress > 100 || 
        !isFinite(data.progress)) {
      return {
        valid: false,
        error: 'Invalid progress: expected number between 0 and 100'
      };
    }
  }

  // Check nodes if present
  if (data.nodes !== undefined && !Array.isArray(data.nodes)) {
    return {
      valid: false,
      error: 'Invalid nodes: expected array'
    };
  }

  return {
    valid: true,
    sanitized: {
      type: data.type as 'start' | 'tick' | 'complete' | 'error' | 'progress',
      progress: data.progress,
      nodes: data.nodes
    } as WorkerProgress
  };
}

/**
 * Validate complete message
 */
function validateCompleteMessage(data: any): ValidationResult {
  // Check nodes
  if (!Array.isArray(data.nodes)) {
    return {
      valid: false,
      error: 'Complete message requires nodes array'
    };
  }

  // Validate node positions
  for (const node of data.nodes) {
    if (!node || typeof node !== 'object') {
      return {
        valid: false,
        error: 'Invalid node in complete message'
      };
    }
    if (!node.id || typeof node.id !== 'string') {
      return {
        valid: false,
        error: 'Invalid node: missing id'
      };
    }
    if (!node.position || typeof node.position !== 'object') {
      return {
        valid: false,
        error: 'Invalid node: missing position'
      };
    }
    if (!isFinite(node.position.x) || !isFinite(node.position.y)) {
      return {
        valid: false,
        error: 'Invalid node position: non-finite values'
      };
    }
  }

  return {
    valid: true,
    sanitized: data as WorkerMessage
  };
}

/**
 * Validate error message
 */
function validateErrorMessage(data: any): ValidationResult {
  if (!data.error || typeof data.error !== 'string') {
    return {
      valid: false,
      error: 'Error message requires error string'
    };
  }

  return {
    valid: true,
    sanitized: {
      type: 'error' as const,
      message: (data.error as string).substring(0, 1000) // Limit error message length
    } as WorkerError
  };
}

/**
 * Sanitize configuration values
 */
function sanitizeConfig(config: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  
  // Numeric bounds
  const numericFields = {
    chargeStrength: { min: -10000, max: -100, default: -1500 },
    linkDistance: { min: 50, max: 1000, default: 150 },
    linkStrength: { min: 0.01, max: 1, default: 0.2 },
    centerStrength: { min: 0, max: 1, default: 0.05 },
    collisionRadius: { min: 10, max: 500, default: 80 },
    iterations: { min: 10, max: 2000, default: 400 },
    alphaMin: { min: 0.0001, max: 0.1, default: 0.001 },
    alphaDecay: { min: 0.001, max: 0.1, default: 0.0228 },
    velocityDecay: { min: 0.1, max: 0.9, default: 0.4 },
    width: { min: 100, max: 10000, default: 2000 },
    height: { min: 100, max: 10000, default: 1500 }
  };

  // Validate and clamp numeric fields
  for (const [field, bounds] of Object.entries(numericFields)) {
    const value = config[field];
    if (value !== undefined) {
      if (typeof value === 'number' && isFinite(value)) {
        sanitized[field] = Math.max(bounds.min, Math.min(bounds.max, value));
      } else {
        sanitized[field] = bounds.default;
      }
    }
  }

  // Validate object fields
  if (config.nodeStrengthByType && typeof config.nodeStrengthByType === 'object') {
    const nodeStrengthByType: Record<string, number> = {};
    for (const [key, value] of Object.entries(config.nodeStrengthByType as Record<string, unknown>)) {
      if (typeof key === 'string' && typeof value === 'number' && isFinite(value)) {
        nodeStrengthByType[key] = Math.max(0.1, Math.min(10, value));
      }
    }
    sanitized.nodeStrengthByType = nodeStrengthByType;
  }

  if (config.nodeSizeByType && typeof config.nodeSizeByType === 'object') {
    const nodeSizeByType: Record<string, number> = {};
    for (const [key, value] of Object.entries(config.nodeSizeByType as Record<string, unknown>)) {
      if (typeof key === 'string' && typeof value === 'number' && isFinite(value)) {
        nodeSizeByType[key] = Math.max(0.1, Math.min(10, value));
      }
    }
    sanitized.nodeSizeByType = nodeSizeByType;
  }

  return sanitized;
}

/**
 * Validate outgoing worker message
 */
export function validateOutgoingMessage(message: WorkerMessage): ValidationResult {
  return validateIncomingMessage(message);
}

/**
 * Create safe error message
 */
export function createSafeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Sanitize error message to prevent XSS
    return error.message.replace(/[<>]/g, '').substring(0, 500);
  }
  if (typeof error === 'string') {
    return error.replace(/[<>]/g, '').substring(0, 500);
  }
  return 'An unknown error occurred';
}