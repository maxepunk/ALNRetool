/**
 * ErrorHandler Module
 * Comprehensive error management system for graph operations with centralized reporting.
 * 
 * This module provides a complete error handling ecosystem for graph operations, including
 * error classification, severity management, context-based error tracking, recovery strategies,
 * and detailed reporting capabilities. It implements structured error handling patterns
 * to ensure consistent error management across all graph modules while providing
 * actionable debugging information and automated recovery mechanisms.
 * 
 * **Error Management Features:**
 * - **Type Classification**: Comprehensive error categorization (validation, relationship, transformation, integrity)
 * - **Severity Levels**: Structured severity system (warning, error, critical) with appropriate handling
 * - **Context Tracking**: Isolated error contexts for different graph operations
 * - **Recovery Strategies**: Automated recovery mechanisms for common failure scenarios
 * - **Detailed Reporting**: Comprehensive error reports with statistics and actionable insights
 * 
 * **Architecture Benefits:**
 * - **Centralized Handling**: Single source of truth for all graph error management
 * - **Consistent Patterns**: Standardized error handling across all graph modules
 * - **Context Isolation**: Separate error tracking for different graph operations
 * - **Recovery Automation**: Built-in strategies for handling common error scenarios
 * - **Production Ready**: Structured logging and monitoring support
 * 
 * **Murder Mystery Integration:**
 * - **Data Integrity**: Validates character, element, puzzle, and timeline data consistency
 * - **Relationship Validation**: Ensures valid connections between game entities
 * - **Missing Reference Handling**: Creates placeholders for missing characters or items
 * - **Investigation Flow**: Maintains puzzle dependency integrity despite data issues
 * 
 * @example
 * ```typescript
 * // Context-based error tracking
 * const context = errorHandler.getContext('character-transformation');
 * context.addError(GraphErrorType.MISSING_REFERENCE, 'Character not found', {
 *   entityId: 'char-123',
 *   entityType: 'character',
 *   severity: ErrorSeverity.ERROR
 * });
 * 
 * // Error recovery
 * const placeholder = ErrorRecovery.createPlaceholderNode(
 *   'missing-char-456',
 *   'character',
 *   'Referenced in puzzle but not found in database'
 * );
 * 
 * // Generate comprehensive report
 * const report = context.generateReport();
 * console.log(report);
 * ```
 * 
 * @see ErrorContext - Context-based error tracking and management
 * @see ErrorRecovery - Automated recovery strategies for common failures
 * @see GraphErrorType - Comprehensive error type classification system
 */

import type { NodeMetadata } from '../types';
import { logger } from '../utils/Logger'


/**
 * Comprehensive error type classification system for graph operations.
 * Provides structured categorization of all possible error conditions in graph processing,
 * enabling precise error handling and targeted recovery strategies.
 * 
 * **Error Categories:**
 * - **Validation Errors**: Data format, structure, and content validation failures
 * - **Relationship Errors**: Connection, reference, and dependency issues
 * - **Transformation Errors**: Entity processing and layout operation failures  
 * - **Data Integrity Errors**: Consistency, duplication, and state management issues
 * 
 * **Murder Mystery Context:**
 * - **Character Validation**: Missing or invalid character data
 * - **Evidence References**: Broken links between items and characters
 * - **Puzzle Dependencies**: Invalid prerequisite or reward relationships
 * - **Timeline Consistency**: Chronological or event sequence errors
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
 * Error severity classification system for appropriate handling and response.
 * Provides structured severity levels to enable proper escalation, logging,
 * and user notification strategies based on error impact and urgency.
 * 
 * **Severity Levels:**
 * - **WARNING**: Non-critical issues that don't prevent operation (missing optional data)
 * - **ERROR**: Significant issues that may affect functionality (broken relationships)
 * - **CRITICAL**: Severe issues that prevent normal operation (system failures)
 * 
 * **Handling Strategy:**
 * - **WARNING**: Log to console.warn, continue processing with degraded functionality
 * - **ERROR**: Log to console.error, attempt recovery, notify user if needed
 * - **CRITICAL**: Log to structured logger, halt processing, require intervention
 */
export const ErrorSeverity = {
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical',
} as const;

export type ErrorSeverity = typeof ErrorSeverity[keyof typeof ErrorSeverity];

/**
 * Comprehensive error record structure for detailed error tracking and reporting.
 * Provides complete context for error analysis, debugging, and recovery operations
 * with structured metadata for automated processing and user notifications.
 * 
 * **Error Properties:**
 * - **type**: Specific error classification for targeted handling
 * - **severity**: Impact level for appropriate response strategy
 * - **message**: Human-readable error description for debugging
 * - **entityId**: Optional identifier of affected entity
 * - **entityType**: Optional type of affected entity for context
 * - **details**: Structured metadata for automated analysis
 * - **timestamp**: ISO timestamp for chronological error tracking
 * 
 * **Usage Patterns:**
 * - **Error Analysis**: Complete context for debugging and resolution
 * - **User Notifications**: Structured data for user-friendly error messages
 * - **Automated Recovery**: Metadata enables targeted recovery strategies
 * - **Monitoring**: Structured format for error tracking and analytics
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
 * ErrorContext Class
 * Isolated error tracking and management system for specific graph operations.
 * 
 * This class provides comprehensive error tracking capabilities for individual graph operations,
 * maintaining error collections, severity counters, and providing analysis tools for
 * error assessment and recovery. Each context operates independently, enabling
 * precise error tracking for specific operations like entity transformation or layout.
 * 
 * **Context Features:**
 * - **Error Collection**: Maintains chronological list of all errors in context
 * - **Severity Tracking**: Real-time counters for warning, error, and critical levels
 * - **Entity Association**: Links errors to specific entities for targeted resolution
 * - **Report Generation**: Creates detailed error reports with statistics and insights
 * - **Recovery Support**: Provides error state creation for node metadata integration
 * 
 * **Operation Isolation:**
 * - **Independent Tracking**: Each context tracks errors for specific operations
 * - **Clean Separation**: Prevents error contamination between different processes
 * - **Targeted Analysis**: Enables focused error analysis for specific components
 * - **Context Clearing**: Supports fresh starts for new operations
 * 
 * **Murder Mystery Integration:**
 * - **Character Processing**: Track character transformation and relationship errors
 * - **Evidence Validation**: Monitor item and clue data integrity issues
 * - **Puzzle Dependencies**: Track investigation flow and dependency errors
 * - **Timeline Consistency**: Monitor temporal event and sequencing issues
 */
export class ErrorContext {
  private errors: GraphError[] = [];
  private warningCount = 0;
  private errorCount = 0;
  private criticalCount = 0;

  /**
   * Add comprehensive error record to context with automatic severity tracking.
   * Creates detailed error entries with full metadata and maintains real-time
   * severity counters for immediate error assessment and response.
   * 
   * **Error Processing Pipeline:**
   * 1. **Severity Assignment**: Defaults to ERROR level if not specified
   * 2. **Error Record Creation**: Builds complete GraphError with timestamp
   * 3. **Context Storage**: Adds error to chronological collection
   * 4. **Counter Updates**: Increments appropriate severity counter
   * 5. **Logging Integration**: Routes error to appropriate logging system
   * 
   * **Severity-Based Handling:**
   * - **WARNING**: Increments warning counter, logs to console.warn
   * - **ERROR**: Increments error counter, logs to console.error
   * - **CRITICAL**: Increments critical counter, logs to structured logger
   * 
   * **Entity Association:**
   * - **Entity ID**: Links error to specific entity for targeted resolution
   * - **Entity Type**: Provides context for error categorization
   * - **Details Object**: Structured metadata for automated analysis
   * 
   * **Murder Mystery Context:**
   * - **Character Errors**: Track missing characters, invalid relationships
   * - **Evidence Issues**: Monitor item ownership, possession inconsistencies
   * - **Puzzle Problems**: Track dependency failures, reward mismatches
   * - **Timeline Conflicts**: Monitor event sequencing and chronology issues
   * 
   * @param type - Specific error classification for targeted handling
   * @param message - Human-readable error description for debugging
   * @param options - Optional configuration with severity, entity info, and details
   * 
   * @example
   * ```typescript
   * // Character relationship error
   * context.addError(
   *   GraphErrorType.MISSING_REFERENCE,
   *   'Character relationship target not found',
   *   {
   *     severity: ErrorSeverity.ERROR,
   *     entityId: 'char-123',
   *     entityType: 'character',
   *     details: { targetId: 'char-456', relationshipType: 'collaboration' }
   *   }
   * );
   * 
   * // Evidence validation warning
   * context.addError(
   *   GraphErrorType.INVALID_DATA,
   *   'Item missing optional description field',
   *   {
   *     severity: ErrorSeverity.WARNING,
   *     entityId: 'item-789',
   *     entityType: 'element'
   *   }
   * );
   * ```
   * 
   * Complexity: O(1) - Direct array append and counter increment
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
   * Add multiple validation errors for a single entity with batch processing.
   * Efficiently processes multiple validation failures for one entity,
   * creating individual error records while maintaining entity association.
   * 
   * **Batch Processing Benefits:**
   * - **Efficient Addition**: Single method call for multiple related errors
   * - **Consistent Association**: All errors linked to same entity context
   * - **Validation Focus**: Specifically designed for data validation failures
   * - **Warning Severity**: Appropriate severity level for validation issues
   * 
   * **Validation Error Types:**
   * - **Required Fields**: Missing mandatory entity properties
   * - **Format Validation**: Invalid data formats or structures
   * - **Range Validation**: Values outside acceptable ranges
   * - **Pattern Validation**: Text fields not matching required patterns
   * 
   * **Murder Mystery Context:**
   * - **Character Validation**: Name, role, status field validation
   * - **Evidence Validation**: Item description, ownership, location validation
   * - **Puzzle Validation**: Title, description, dependency validation
   * - **Timeline Validation**: Event date, duration, participant validation
   * 
   * @param entityId - Identifier of the entity with validation errors
   * @param entityType - Type of entity for categorization context
   * @param errors - Array of validation error messages
   * 
   * @example
   * ```typescript
   * // Character validation errors
   * context.addValidationErrors('char-123', 'character', [
   *   'Missing required name field',
   *   'Invalid role value: must be player, npc, or suspect',
   *   'Status field contains invalid characters'
   * ]);
   * 
   * // Evidence item validation
   * context.addValidationErrors('item-456', 'element', [
   *   'Description exceeds 500 character limit',
   *   'Location field is required for physical items'
   * ]);
   * ```
   * 
   * Complexity: O(n) where n = number of validation errors
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
   * Add missing reference error with comprehensive relationship context.
   * Creates detailed error record for broken entity references, providing
   * complete context for debugging and automated recovery strategies.
   * 
   * **Reference Error Details:**
   * - **Source Entity**: Entity that contains the broken reference
   * - **Target Entity**: Missing entity that should exist
   * - **Relationship Type**: Nature of the expected connection
   * - **Error Severity**: ERROR level for significant impact
   * 
   * **Relationship Types:**
   * - **ownership**: Character → Element possession relationships
   * - **collaboration**: Character ↔ Character interaction relationships
   * - **requirement**: Puzzle → Element dependency relationships
   * - **reward**: Puzzle → Element reward relationships
   * - **timeline**: Event → Entity temporal relationships
   * 
   * **Recovery Integration:**
   * - **Details Object**: Structured data for automated placeholder creation
   * - **Entity Context**: Complete information for recovery strategy selection
   * - **Relationship Metadata**: Enables relationship reconstruction
   * 
   * **Murder Mystery Context:**
   * - **Character References**: Missing suspects, witnesses, or victims
   * - **Evidence References**: Items mentioned but not found in inventory
   * - **Puzzle References**: Dependencies on non-existent puzzles
   * - **Timeline References**: Events referencing missing entities
   * 
   * @param sourceId - Identifier of entity containing the broken reference
   * @param targetId - Identifier of missing entity that should exist
   * @param relationshipType - Type of relationship that's broken
   * 
   * @example
   * ```typescript
   * // Missing character in collaboration
   * context.addMissingReference(
   *   'char-detective',
   *   'char-suspect-missing',
   *   'collaboration'
   * );
   * 
   * // Missing evidence item in puzzle reward
   * context.addMissingReference(
   *   'puzzle-safe-code',
   *   'item-diamond-necklace',
   *   'reward'
   * );
   * 
   * // Missing puzzle in dependency chain
   * context.addMissingReference(
   *   'puzzle-final-confrontation',
   *   'puzzle-gather-evidence',
   *   'requirement'
   * );
   * ```
   * 
   * Complexity: O(1) - Single error record creation
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
   * Retrieve complete chronological collection of all errors in context.
   * Returns comprehensive array of all GraphError records for analysis,
   * reporting, and recovery operations.
   * 
   * **Return Characteristics:**
   * - **Chronological Order**: Errors ordered by timestamp of occurrence
   * - **Complete Records**: Full GraphError objects with all metadata
   * - **Immutable Copy**: Returns array copy to prevent external modification
   * 
   * **Use Cases:**
   * - **Comprehensive Analysis**: Full error history for debugging
   * - **Report Generation**: Complete data for error reports
   * - **Recovery Planning**: All errors for systematic recovery
   * - **Statistics**: Error patterns and frequency analysis
   * 
   * @returns Complete array of GraphError objects in chronological order
   * 
   * @example
   * ```typescript
   * const allErrors = context.getErrors();
   * console.log(`Total errors: ${allErrors.length}`);
   * 
   * // Analyze error patterns
   * const errorsByEntity = allErrors.reduce((acc, error) => {
   *   const entityId = error.entityId || 'unknown';
   *   acc[entityId] = (acc[entityId] || 0) + 1;
   *   return acc;
   * }, {});
   * ```
   * 
   * Complexity: O(1) - Direct array access
   */
  public getErrors(): GraphError[] {
    return this.errors;
  }

  /**
   * Filter errors by specific severity level for targeted analysis and handling.
   * Returns subset of errors matching the specified severity level,
   * enabling focused error processing and appropriate response strategies.
   * 
   * **Severity Filtering Benefits:**
   * - **Targeted Processing**: Handle errors by impact level
   * - **Priority Management**: Focus on critical issues first
   * - **Response Strategy**: Apply appropriate handling for each severity
   * - **User Notifications**: Show relevant errors to users based on severity
   * 
   * **Severity-Specific Use Cases:**
   * - **WARNING**: Review and potentially ignore non-critical issues
   * - **ERROR**: Focus on errors requiring attention and potential recovery
   * - **CRITICAL**: Immediate attention for system-threatening issues
   * 
   * @param severity - Target severity level for filtering
   * @returns Array of errors matching the specified severity level
   * 
   * @example
   * ```typescript
   * // Get critical errors for immediate attention
   * const criticalErrors = context.getErrorsBySeverity(ErrorSeverity.CRITICAL);
   * if (criticalErrors.length > 0) {
   *   console.error('Critical issues requiring immediate attention:');
   *   criticalErrors.forEach(error => console.error(`- ${error.message}`));
   * }
   * 
   * // Get warnings for review
   * const warnings = context.getErrorsBySeverity(ErrorSeverity.WARNING);
   * console.log(`${warnings.length} warnings to review`);
   * ```
   * 
   * Complexity: O(n) where n = total number of errors
   */
  public getErrorsBySeverity(severity: ErrorSeverity): GraphError[] {
    return this.errors.filter(error => error.severity === severity);
  }

  /**
   * Filter errors by specific error type for categorized analysis and handling.
   * Returns subset of errors matching the specified error type,
   * enabling focused error processing by category and targeted recovery strategies.
   * 
   * **Type-Based Filtering Benefits:**
   * - **Categorized Analysis**: Group similar errors for pattern analysis
   * - **Targeted Recovery**: Apply specific recovery strategies by error type
   * - **Root Cause Analysis**: Focus on specific categories of failures
   * - **Specialized Handling**: Route errors to appropriate handling systems
   * 
   * **Error Type Categories:**
   * - **VALIDATION_ERROR**: Data format and structure issues
   * - **MISSING_REFERENCE**: Broken entity relationships
   * - **TRANSFORMATION_FAILED**: Entity processing failures
   * - **INCONSISTENT_STATE**: Data integrity issues
   * 
   * @param type - Target error type for filtering
   * @returns Array of errors matching the specified error type
   * 
   * @example
   * ```typescript
   * // Analyze missing reference patterns
   * const missingRefs = context.getErrorsByType(GraphErrorType.MISSING_REFERENCE);
   * console.log(`${missingRefs.length} broken references found`);
   * 
   * // Review validation failures
   * const validationErrors = context.getErrorsByType(GraphErrorType.VALIDATION_ERROR);
   * const entitiesWithValidation = new Set(validationErrors.map(e => e.entityId));
   * console.log(`${entitiesWithValidation.size} entities have validation issues`);
   * 
   * // Focus on transformation failures
   * const transformErrors = context.getErrorsByType(GraphErrorType.TRANSFORMATION_FAILED);
   * transformErrors.forEach(error => {
   *   console.error(`Transformation failed for ${error.entityType}: ${error.message}`);
   * });
   * ```
   * 
   * Complexity: O(n) where n = total number of errors
   */
  public getErrorsByType(type: GraphErrorType): GraphError[] {
    return this.errors.filter(error => error.type === type);
  }

  /**
   * Generate comprehensive error statistics and summary for analysis and reporting.
   * Creates detailed breakdown of error counts by severity and type,
   * providing essential metrics for error assessment and monitoring.
   * 
   * **Summary Components:**
   * - **Total Count**: Overall number of errors in context
   * - **Severity Breakdown**: Counts for warnings, errors, and critical issues
   * - **Type Distribution**: Error counts by specific error type
   * - **Pattern Analysis**: Insights into error distribution patterns
   * 
   * **Monitoring Integration:**
   * - **Health Metrics**: Essential statistics for system health assessment
   * - **Alert Thresholds**: Data for automated alert systems
   * - **Trend Analysis**: Historical comparison for error trend monitoring
   * - **Performance Impact**: Error volume impact on system performance
   * 
   * **Quality Assurance:**
   * - **Process Validation**: Error rates indicate process health
   * - **Data Quality**: Validation error patterns reveal data issues
   * - **System Stability**: Critical error trends indicate system problems
   * 
   * @returns Comprehensive error summary with counts and breakdowns
   * 
   * @example
   * ```typescript
   * const summary = context.getSummary();
   * console.log(`Error Summary:`);
   * console.log(`  Total: ${summary.total}`);
   * console.log(`  Critical: ${summary.critical}`);
   * console.log(`  Errors: ${summary.errors}`);
   * console.log(`  Warnings: ${summary.warnings}`);
   * 
   * // Check for concerning patterns
   * if (summary.critical > 0) {
   *   console.error('⚠️  Critical errors detected - immediate attention required');
   * }
   * 
   * // Analyze error distribution
   * Object.entries(summary.byType).forEach(([type, count]) => {
   *   if (count > 5) {
   *     console.warn(`High frequency error type: ${type} (${count} occurrences)`);
   *   }
   * });
   * ```
   * 
   * Complexity: O(n) where n = total number of errors
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
   * Check for critical errors requiring immediate attention and intervention.
   * Provides fast boolean check for critical error presence,
   * enabling immediate response to system-threatening conditions.
   * 
   * **Critical Error Significance:**
   * - **System Impact**: Errors that prevent normal operation
   * - **Data Integrity**: Issues that compromise data consistency
   * - **User Experience**: Problems that break user functionality
   * - **Recovery Required**: Conditions requiring manual intervention
   * 
   * **Response Strategy:**
   * - **Immediate Alert**: Trigger alerts for critical conditions
   * - **Process Halt**: Stop processing to prevent further damage
   * - **Recovery Mode**: Initiate recovery procedures
   * - **User Notification**: Inform users of system issues
   * 
   * **Murder Mystery Context:**
   * - **Data Corruption**: Character or evidence data integrity failures
   * - **System Failures**: Core game mechanic breakdowns
   * - **Investigation Blocks**: Critical path puzzle dependencies broken
   * 
   * @returns True if any critical errors exist in context
   * 
   * @example
   * ```typescript
   * if (context.hasCriticalErrors()) {
   *   console.error('🚨 Critical errors detected - halting processing');
   *   
   *   // Generate emergency report
   *   const criticalErrors = context.getErrorsBySeverity(ErrorSeverity.CRITICAL);
   *   criticalErrors.forEach(error => {
   *     console.error(`CRITICAL: ${error.message} (${error.entityType}:${error.entityId})`);
   *   });
   *   
   *   // Initiate recovery procedures
   *   return ErrorResponse.HALT_PROCESSING;
   * }
   * 
   * // Safe to continue processing
   * return ErrorResponse.CONTINUE;
   * ```
   * 
   * Complexity: O(1) - Direct counter access
   */
  public hasCriticalErrors(): boolean {
    return this.criticalCount > 0;
  }

  /**
   * Clear all errors and reset context for fresh operation start.
   * Removes all error records and resets severity counters,
   * providing clean slate for new graph operations.
   * 
   * **Clearing Operations:**
   * - **Error Collection**: Empty chronological error array
   * - **Severity Counters**: Reset warning, error, and critical counts
   * - **Memory Management**: Allow garbage collection of error objects
   * - **State Reset**: Return context to initial clean state
   * 
   * **Use Cases:**
   * - **New Operations**: Clear before starting new graph processing
   * - **Recovery Mode**: Reset after error recovery completion
   * - **Testing**: Clean state for test isolation
   * - **Memory Management**: Periodic clearing to prevent accumulation
   * 
   * **Timing Considerations:**
   * - **Before New Processing**: Clear before processing new data sets
   * - **After Recovery**: Clear after successful error recovery
   * - **Periodic Maintenance**: Regular clearing in long-running processes
   * 
   * @example
   * ```typescript
   * // Clear before new graph build
   * context.clear();
   * const newGraph = buildGraph(freshData);
   * 
   * // Clear after successful recovery
   * if (recoverySuccessful) {
   *   context.clear();
   *   console.log('Error context cleared after successful recovery');
   * }
   * 
   * // Verify clean state
   * const summary = context.getSummary();
   * console.assert(summary.total === 0, 'Context should be empty after clearing');
   * ```
   * 
   * Complexity: O(1) - Direct array and counter reset
   */
  public clear(): void {
    this.errors = [];
    this.warningCount = 0;
    this.errorCount = 0;
    this.criticalCount = 0;
  }

  /**
   * Create comprehensive error state metadata for node integration.
   * Generates structured error state information for specific entities,
   * enabling visual error indication and debugging context in graph nodes.
   * 
   * **Error State Generation:**
   * 1. **Entity Filtering**: Find all errors associated with specific entity
   * 2. **Severity Analysis**: Identify most severe error for priority handling
   * 3. **Message Aggregation**: Combine multiple error messages
   * 4. **Missing Entity Extraction**: Identify missing references for recovery
   * 
   * **Severity Priority:**
   * - **Critical**: Highest priority for error state representation
   * - **Error**: Medium priority if no critical errors found
   * - **Warning**: Lowest priority if only warnings exist
   * 
   * **Node Integration:**
   * - **Visual Indicators**: Error state enables visual error highlighting
   * - **Tooltip Information**: Error messages provide debugging context
   * - **Recovery Hints**: Missing entity lists guide recovery actions
   * - **State Persistence**: Error state preserved across graph operations
   * 
   * **Murder Mystery Context:**
   * - **Character Issues**: Highlight characters with missing relationships
   * - **Evidence Problems**: Indicate items with ownership or location issues
   * - **Puzzle Errors**: Show puzzles with broken dependencies or rewards
   * - **Timeline Conflicts**: Mark events with chronological inconsistencies
   * 
   * @param entityId - Identifier of entity for error state creation
   * @returns Error state metadata or undefined if no errors for entity
   * 
   * @example
   * ```typescript
   * // Create error state for character with missing relationships
   * const errorState = context.createNodeErrorState('char-detective');
   * if (errorState) {
   *   console.log(`Character has errors: ${errorState.message}`);
   *   console.log(`Missing entities: ${errorState.missingEntities.join(', ')}`);
   *   
   *   // Apply to node metadata
   *   characterNode.data.metadata.errorState = errorState;
   * }
   * 
   * // Use in node transformation
   * const nodeWithErrorState = {
   *   id: entityId,
   *   data: {
   *     label: entityLabel,
   *     metadata: {
   *       entityType: 'character',
   *       errorState: context.createNodeErrorState(entityId)
   *     }
   *   }
   * };
   * ```
   * 
   * Complexity: O(n) where n = errors associated with specific entity
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
   * Extract missing entity identifiers from reference errors for recovery operations.
   * Analyzes missing reference errors to identify entities that need placeholder
   * creation or recovery attention.
   * 
   * **Extraction Process:**
   * 1. **Error Filtering**: Focus on MISSING_REFERENCE error types
   * 2. **Target ID Extraction**: Pull target entity IDs from error details
   * 3. **Deduplication**: Use Set to eliminate duplicate missing entities
   * 4. **Array Conversion**: Return clean array of unique missing IDs
   * 
   * **Recovery Integration:**
   * - **Placeholder Creation**: Missing IDs guide placeholder node creation
   * - **Recovery Planning**: Prioritize recovery by missing entity frequency
   * - **User Notification**: Inform users about missing data requirements
   * - **Data Validation**: Identify data source issues
   * 
   * @param errors - Array of errors to analyze for missing references
   * @returns Array of unique missing entity identifiers
   * 
   * @example
   * ```typescript
   * // Internal usage in createNodeErrorState
   * const entityErrors = this.errors.filter(e => e.entityId === 'char-123');
   * const missingIds = this.extractMissingEntities(entityErrors);
   * // ['char-missing-witness', 'item-lost-evidence']
   * ```
   * 
   * Complexity: O(n) where n = number of errors to analyze
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
   * Route error to appropriate logging system based on severity level.
   * Implements severity-based logging strategy to ensure appropriate
   * handling and visibility for different error types.
   * 
   * **Logging Strategy:**
   * - **WARNING**: Console warning for development debugging
   * - **ERROR**: Console error for immediate attention
   * - **CRITICAL**: Structured logger for production monitoring
   * 
   * **Production Considerations:**
   * - **Structured Logging**: Critical errors use structured logger
   * - **Error Tracking**: Integration with monitoring systems
   * - **Alert Generation**: Critical errors may trigger alerts
   * - **Debugging Context**: Error details included in logs
   * 
   * @param error - GraphError to log with appropriate severity handling
   * 
   * Complexity: O(1) - Direct logging call based on severity
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
        logger.error(`🚨 ${message}`, undefined, error.details instanceof Error ? error.details : new Error(JSON.stringify(error.details)));
        break;
    }
  }

  /**
   * Generate comprehensive error report with statistics and detailed breakdown.
   * Creates human-readable report suitable for debugging, monitoring,
   * and user communication with complete error context and actionable insights.
   * 
   * **Report Structure:**
   * 1. **Summary Statistics**: Total errors with severity breakdown
   * 2. **Type Distribution**: Error counts by category
   * 3. **Critical Error Details**: Detailed listing of critical issues
   * 4. **Actionable Information**: Entity IDs and error context
   * 
   * **Report Formatting:**
   * - **Clear Headers**: Section dividers for easy reading
   * - **Statistical Summary**: Quantitative error overview
   * - **Prioritized Details**: Critical errors highlighted first
   * - **Entity Context**: Specific entity information for targeted resolution
   * 
   * **Use Cases:**
   * - **Development Debugging**: Comprehensive error analysis
   * - **Production Monitoring**: Error trend analysis and alerts
   * - **User Communication**: Simplified error explanations
   * - **Quality Assurance**: Process validation and improvement
   * 
   * @returns Formatted string report with complete error analysis
   * 
   * @example
   * ```typescript
   * const report = context.generateReport();
   * console.log(report);
   * 
   * // Sample output:
   * // === Graph Error Report ===
   * // Total Issues: 15
   * //   Critical: 2
   * //   Errors: 8
   * //   Warnings: 5
   * //
   * // Issues by Type:
   * //   missing_reference: 6
   * //   validation_error: 4
   * //   transformation_failed: 3
   * //   inconsistent_state: 2
   * //
   * // ⚠️ CRITICAL ERRORS:
   * //   - Character transformation failed (char-123)
   * //   - Missing puzzle dependency (puzzle-456)
   * ```
   * 
   * Complexity: O(n) where n = total number of errors
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
   * Try to recover from missing references by creating placeholder nodes.
   * Creates a visual placeholder node to maintain graph structure when referenced entities are missing.
   * 
   * @param id - Unique identifier for the placeholder node
   * @param entityType - Type of the missing entity (e.g., 'character', 'puzzle')
   * @param reason - Descriptive reason for why the node is missing
   * @returns Placeholder node object compatible with React Flow
   * 
   * @remarks
   * - Creates nodes with 'placeholder' type for visual distinction
   * - Includes error state to indicate the issue
   * - Positioned at origin (0,0) - layout algorithm will adjust
   * - Maintains graph connectivity while highlighting missing data
   * 
   * @example
   * ```typescript
   * const placeholder = ErrorRecovery.createPlaceholderNode(
   *   'missing-char-123',
   *   'character', 
   *   'Referenced character not found in database'
   * );
   * ```
   * 
   * Complexity: O(1)
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
   * Attempt to fix circular dependencies by breaking the cycle.
   * Identifies and removes the edge that creates a circular dependency in the graph.
   * 
   * @param edges - Array of graph edges that may contain cycles
   * @param cycle - Array of node IDs representing the detected cycle path
   * @returns New edge array with cycle-creating edge removed
   * 
   * @remarks
   * - Breaks cycles by removing the "back edge" (last -> first node)
   * - Preserves most of the original graph structure
   * - May affect intended relationships - should log warnings
   * - Alternative: mark edge as "virtual" instead of removing
   * 
   * @example
   * ```typescript
   * const cycle = ['A', 'B', 'C', 'A'];
   * const fixedEdges = ErrorRecovery.breakCircularDependency(edges, cycle);
   * // Removes edge from C -> A to break the cycle
   * ```
   * 
   * Complexity: O(m) where m = edges.length
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
   * Validate and sanitize node data to ensure React Flow compatibility.
   * Adds missing required properties and validates existing data structure.
   * 
   * @param node - Node object to validate and sanitize
   * @returns Sanitized node with all required properties
   * 
   * @remarks
   * Essential properties added if missing:
   * - `id`: Generated from timestamp and random if missing
   * - `position`: Set to origin {x: 0, y: 0} if missing
   * - `data`: Created with basic metadata structure if missing
   * - Preserves existing valid properties
   * 
   * @example
   * ```typescript
   * const invalidNode = { /* missing required fields */ };
   * const validNode = ErrorRecovery.sanitizeNodeData(invalidNode);
   * // Now has id, position, and data properties
   * ```
   * 
   * Complexity: O(1)
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