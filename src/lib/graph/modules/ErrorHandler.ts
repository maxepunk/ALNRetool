/**
 * Centralized Error Handler Module
 * Consolidates error handling patterns across the graph module
 * Reduces duplication and provides consistent error reporting
 */

import type { NodeMetadata } from '../types';

/**
 * Error types for graph operations
 */
export const GraphErrorType = {
  // Validation errors
  VALIDATION_ERROR: 'validation_error',
  MISSING_DATA: 'missing_data',
  INVALID_DATA: 'invalid_data',
  
  // Relationship errors
  MISSING_REFERENCE: 'missing_reference',
  CIRCULAR_DEPENDENCY: 'circular_dependency',
  BROKEN_RELATIONSHIP: 'broken_relationship',
  
  // Transformation errors
  TRANSFORMATION_FAILED: 'transformation_failed',
  LAYOUT_FAILED: 'layout_failed',
  
  // Data integrity errors
  ORPHAN_NODE: 'orphan_node',
  DUPLICATE_ID: 'duplicate_id',
  INCONSISTENT_STATE: 'inconsistent_state',
} as const;

export type GraphErrorType = typeof GraphErrorType[keyof typeof GraphErrorType];

/**
 * Error severity levels
 */
export const ErrorSeverity = {
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical',
} as const;

export type ErrorSeverity = typeof ErrorSeverity[keyof typeof ErrorSeverity];

/**
 * Graph error interface
 */
export interface GraphError {
  type: GraphErrorType;
  severity: ErrorSeverity;
  message: string;
  entityId?: string;
  entityType?: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

/**
 * Error context for tracking errors during operations
 */
export class ErrorContext {
  private errors: GraphError[] = [];
  private warningCount = 0;
  private errorCount = 0;
  private criticalCount = 0;

  /**
   * Add an error to the context
   */
  public addError(
    type: GraphErrorType,
    message: string,
    options?: {
      severity?: ErrorSeverity;
      entityId?: string;
      entityType?: string;
      details?: Record<string, unknown>;
    }
  ): void {
    const severity = options?.severity || ErrorSeverity.ERROR;
    
    const error: GraphError = {
      type,
      severity,
      message,
      entityId: options?.entityId,
      entityType: options?.entityType,
      details: options?.details,
      timestamp: new Date().toISOString(),
    };

    this.errors.push(error);
    
    // Update counters
    switch (severity) {
      case ErrorSeverity.WARNING:
        this.warningCount++;
        break;
      case ErrorSeverity.ERROR:
        this.errorCount++;
        break;
      case ErrorSeverity.CRITICAL:
        this.criticalCount++;
        break;
    }

    // Log based on severity
    this.logError(error);
  }

  /**
   * Add multiple validation errors
   */
  public addValidationErrors(
    entityId: string,
    entityType: string,
    errors: string[]
  ): void {
    errors.forEach(error => {
      this.addError(
        GraphErrorType.VALIDATION_ERROR,
        error,
        {
          severity: ErrorSeverity.WARNING,
          entityId,
          entityType,
        }
      );
    });
  }

  /**
   * Add missing reference error
   */
  public addMissingReference(
    sourceId: string,
    targetId: string,
    relationshipType: string
  ): void {
    this.addError(
      GraphErrorType.MISSING_REFERENCE,
      `Missing ${relationshipType} reference: ${sourceId} -> ${targetId}`,
      {
        severity: ErrorSeverity.ERROR,
        details: {
          sourceId,
          targetId,
          relationshipType,
        },
      }
    );
  }

  /**
   * Get all errors
   */
  public getErrors(): GraphError[] {
    return this.errors;
  }

  /**
   * Get errors by severity
   */
  public getErrorsBySeverity(severity: ErrorSeverity): GraphError[] {
    return this.errors.filter(error => error.severity === severity);
  }

  /**
   * Get errors by type
   */
  public getErrorsByType(type: GraphErrorType): GraphError[] {
    return this.errors.filter(error => error.type === type);
  }

  /**
   * Get error summary
   */
  public getSummary(): {
    total: number;
    warnings: number;
    errors: number;
    critical: number;
    byType: Record<string, number>;
  } {
    const byType: Record<string, number> = {};
    
    this.errors.forEach(error => {
      byType[error.type] = (byType[error.type] || 0) + 1;
    });

    return {
      total: this.errors.length,
      warnings: this.warningCount,
      errors: this.errorCount,
      critical: this.criticalCount,
      byType,
    };
  }

  /**
   * Check if there are any critical errors
   */
  public hasCriticalErrors(): boolean {
    return this.criticalCount > 0;
  }

  /**
   * Clear all errors
   */
  public clear(): void {
    this.errors = [];
    this.warningCount = 0;
    this.errorCount = 0;
    this.criticalCount = 0;
  }

  /**
   * Create error state for node metadata
   */
  public createNodeErrorState(entityId: string): NodeMetadata['errorState'] | undefined {
    const entityErrors = this.errors.filter(error => error.entityId === entityId);
    
    if (entityErrors.length === 0) {
      return undefined;
    }

    // Get the most severe error
    const criticalError = entityErrors.find(e => e.severity === ErrorSeverity.CRITICAL);
    const error = criticalError || entityErrors.find(e => e.severity === ErrorSeverity.ERROR);
    const warning = error || entityErrors[0];

    return {
      hasError: true,
      type: warning?.type || 'unknown_error',
      message: entityErrors.map(e => e.message).join('; '),
      missingEntities: this.extractMissingEntities(entityErrors),
    };
  }

  /**
   * Extract missing entity IDs from errors
   */
  private extractMissingEntities(errors: GraphError[]): string[] {
    const missingIds: Set<string> = new Set();
    
    errors
      .filter(e => e.type === GraphErrorType.MISSING_REFERENCE)
      .forEach(e => {
        if (e.details?.targetId) {
          missingIds.add(e.details.targetId as string);
        }
      });
    
    return Array.from(missingIds);
  }

  /**
   * Log error based on severity
   */
  private logError(error: GraphError): void {
    const prefix = `[Graph ${error.severity.toUpperCase()}]`;
    const message = `${prefix} ${error.message}`;
    
    switch (error.severity) {
      case ErrorSeverity.WARNING:
        console.warn(message, error.details);
        break;
      case ErrorSeverity.ERROR:
        console.error(message, error.details);
        break;
      case ErrorSeverity.CRITICAL:
        console.error(`🚨 ${message}`, error.details);
        break;
    }
  }

  /**
   * Generate error report
   */
  public generateReport(): string {
    if (this.errors.length === 0) {
      return 'No errors detected';
    }

    const summary = this.getSummary();
    const lines: string[] = [
      '=== Graph Error Report ===',
      `Total Issues: ${summary.total}`,
      `  Critical: ${summary.critical}`,
      `  Errors: ${summary.errors}`,
      `  Warnings: ${summary.warnings}`,
      '',
      'Issues by Type:',
    ];

    Object.entries(summary.byType).forEach(([type, count]) => {
      lines.push(`  ${type}: ${count}`);
    });

    if (this.criticalCount > 0) {
      lines.push('', '⚠️ CRITICAL ERRORS:');
      this.getErrorsBySeverity(ErrorSeverity.CRITICAL).forEach(error => {
        lines.push(`  - ${error.message} (${error.entityId || 'N/A'})`);
      });
    }

    return lines.join('\n');
  }
}

/**
 * Global error handler singleton
 */
class GlobalErrorHandler {
  private static instance: GlobalErrorHandler;
  private contexts: Map<string, ErrorContext> = new Map();

  private constructor() {}

  public static getInstance(): GlobalErrorHandler {
    if (!GlobalErrorHandler.instance) {
      GlobalErrorHandler.instance = new GlobalErrorHandler();
    }
    return GlobalErrorHandler.instance;
  }

  /**
   * Get or create an error context
   */
  public getContext(name: string): ErrorContext {
    if (!this.contexts.has(name)) {
      this.contexts.set(name, new ErrorContext());
    }
    return this.contexts.get(name)!;
  }

  /**
   * Clear a specific context
   */
  public clearContext(name: string): void {
    this.contexts.get(name)?.clear();
  }

  /**
   * Clear all contexts
   */
  public clearAll(): void {
    this.contexts.forEach(context => context.clear());
    this.contexts.clear();
  }

  /**
   * Get combined summary from all contexts
   */
  public getGlobalSummary(): Record<string, ReturnType<ErrorContext['getSummary']>> {
    const summary: Record<string, ReturnType<ErrorContext['getSummary']>> = {};
    
    this.contexts.forEach((context, name) => {
      summary[name] = context.getSummary();
    });
    
    return summary;
  }
}

// Export singleton instance
export const errorHandler = GlobalErrorHandler.getInstance();

/**
 * Error recovery strategies
 */
export class ErrorRecovery {
  /**
   * Try to recover from missing references by creating placeholder nodes
   */
  public static createPlaceholderNode(
    id: string,
    entityType: string,
    reason: string
  ): any {
    return {
      id,
      type: 'placeholder',
      position: { x: 0, y: 0 },
      data: {
        label: `Missing ${entityType}`,
        metadata: {
          entityType,
          entityId: id,
          isPlaceholder: true,
          errorState: {
            hasError: true,
            type: GraphErrorType.MISSING_REFERENCE,
            message: reason,
          },
        },
      },
    };
  }

  /**
   * Attempt to fix circular dependencies
   */
  public static breakCircularDependency(
    edges: any[],
    cycle: string[]
  ): any[] {
    // Find and remove the edge that creates the cycle
    const lastNode = cycle[cycle.length - 1];
    const firstNode = cycle[0];
    
    return edges.filter(edge => 
      !(edge.source === lastNode && edge.target === firstNode)
    );
  }

  /**
   * Validate and sanitize node data
   */
  public static sanitizeNodeData(node: any): any {
    // Ensure required fields exist
    if (!node.id) {
      node.id = `generated-${Date.now()}-${Math.random()}`;
    }
    
    if (!node.position) {
      node.position = { x: 0, y: 0 };
    }
    
    if (!node.data) {
      node.data = {
        label: 'Unknown',
        metadata: {
          entityType: 'unknown',
          entityId: node.id,
        },
      };
    }
    
    return node;
  }
}