/**
 * Base Transformer Class
 * Provides shared functionality for all entity transformers
 * Addresses code duplication identified in Phase 2
 * 
 * This abstract class serves as the foundation for all entity-specific transformers,
 * providing common functionality for validation, metadata creation, and node generation.
 * Subclasses must implement entity-specific metadata creation while inheriting
 * shared transformation logic.
 * 
 * @example
 * ```typescript
 * class CharacterTransformer extends BaseTransformer<Character> {
 *   protected entityType = 'character' as const;
 *   protected nodeType = 'characterNode';
 *   
 *   protected createMetadata(entity: Character, errors: string[]): NodeMetadata {
 *     // Entity-specific metadata creation
 *   }
 * }
 * ```
 * 
 * @see CharacterTransformer - Character entity transformer
 * @see PuzzleTransformer - Puzzle entity transformer
 * @see ElementTransformer - Element entity transformer
 * @see TimelineTransformer - Timeline entity transformer
 */

import { log } from '@/utils/logger';
import type { 
  GraphNode, 
  NodeMetadata, 
  EntityType,
  VisualHints 
} from '../types';

/**
 * Default position for all nodes (will be overridden by layout).
 * Shared constant to avoid duplication across transformers.
 * All nodes start at origin and are repositioned by layout algorithms.
 */
export const DEFAULT_POSITION = { x: 0, y: 0 } as const;

/**
 * Base validation error messages.
 * Standardized error messages for consistent validation feedback.
 */
export const VALIDATION_ERRORS = {
  MISSING_ID: 'Missing entity ID',
  MISSING_NAME: 'Missing entity name',
  MISSING_TYPE: 'Missing entity type',
  INVALID_TYPE: 'Invalid entity type',
  INVALID_DATA: 'Invalid entity data',
} as const;

/**
 * Abstract base class for entity transformers.
 * Provides common functionality to reduce code duplication.
 * 
 * @typeParam T - Entity type that must have at least id and name properties
 */
export abstract class BaseTransformer<T extends { id: string; name: string }> {
  /** Entity type identifier for metadata */
  protected abstract entityType: EntityType;
  /** Node type for React Flow rendering */
  protected abstract nodeType: string;

  /**
   * Validate entity has required fields.
   * Can be overridden for entity-specific validation.
   * 
   * @param entity - Entity to validate
   * @returns Array of validation error messages (empty if valid)
   * 
   * @remarks
   * Base implementation checks for id and name.
   * Subclasses can override to add entity-specific validation.
   * 
   * Complexity: O(1) - Fixed field checks
   */
  protected validateEntity(entity: T): string[] {
    const errors: string[] = [];
    
    if (!entity.id) {
      errors.push(VALIDATION_ERRORS.MISSING_ID);
    }
    
    if (!entity.name) {
      errors.push(VALIDATION_ERRORS.MISSING_NAME);
    }
    
    return errors;
  }

  /**
   * Generate label for node display.
   * Can be overridden for entity-specific label generation.
   * 
   * @param entity - Entity to generate label for
   * @returns Display label string
   * 
   * @remarks
   * Defaults to entity name or "Unknown [type]" if name is missing
   */
  protected generateLabel(entity: T): string {
    return entity.name || `Unknown ${this.entityType}`;
  }

  /**
   * Create error metadata for validation failures.
   * 
   * @param errors - Array of error messages
   * @returns Error state object or undefined if no errors
   * 
   * @remarks
   * Returns undefined for empty error arrays to avoid unnecessary metadata
   */
  protected createErrorMetadata(errors: string[]): NodeMetadata['errorState'] {
    if (errors.length === 0) return undefined;
    
    return {
      hasError: true,
      type: 'validation_error',
      message: errors.join('; '),
    };
  }

  /**
   * Create base metadata for a node.
   * Combines entity type, original data, visual hints, and error state.
   * 
   * @param entity - Source entity
   * @param errors - Validation errors if any
   * @param visualHints - Optional visual styling hints
   * @returns Complete base metadata object
   * 
   * @remarks
   * This method creates the foundation metadata that all nodes share.
   * Entity-specific metadata is added by subclass implementations.
   */
  protected createBaseMetadata(
    entity: T,
    errors: string[] = [],
    visualHints?: VisualHints
  ): NodeMetadata {
    const metadata: NodeMetadata = {
      entityType: this.entityType,
      originalData: entity as any,
    };

    // Only add entityId if it exists
    if (entity.id) {
      metadata.entityId = entity.id;
    }

    if (visualHints) {
      metadata.visualHints = visualHints;
    }

    const errorState = this.createErrorMetadata(errors);
    if (errorState) {
      metadata.errorState = errorState;
    }

    return metadata;
  }

  /**
   * Transform a single entity into a graph node.
   * Main transformation method that orchestrates validation and node creation.
   * 
   * @param entity - Entity to transform
   * @returns Graph node or null if transformation fails
   * 
   * @remarks
   * - Validates entity before transformation
   * - Logs warnings for validation errors but still creates node
   * - Delegates metadata creation to subclass implementation
   * 
   * Complexity: O(1) - Single entity transformation
   */
  public transform(entity: T): GraphNode<T> | null {
    // Validate entity
    const errors = this.validateEntity(entity);
    
    // Get entity-specific metadata
    const metadata = this.createMetadata(entity, errors);
    
    // Create the node
    const node: GraphNode<T> = {
      id: entity.id,
      type: this.nodeType,
      position: DEFAULT_POSITION,
      data: {
        entity,
        label: this.generateLabel(entity),
        metadata,
      },
    };
    
    // Log warnings if there are errors
    if (errors.length > 0) {
      log.warn('Entity validation errors', {
        entityType: this.entityType,
        entityId: entity.id,
        errors
      });
    }
    
    return node;
  }

  /**
   * Transform multiple entities into graph nodes.
   * Batch transformation with error handling and sorting.
   * 
   * @param entities - Array of entities to transform
   * @returns Array of successfully transformed nodes (sorted)
   * 
   * @remarks
   * - Skips null/undefined entities with warning
   * - Catches and logs transformation errors per entity
   * - Sorts final node array by label
   * 
   * Complexity: O(n log n) where n = number of entities (due to sorting)
   */
  public transformMultiple(entities: T[]): GraphNode<T>[] {
    const nodes: GraphNode<T>[] = [];
    
    entities.forEach((entity) => {
      // Skip null/undefined entities
      if (!entity) {
        log.warn('Skipping null/undefined entity', {
          entityType: this.entityType
        });
        return;
      }
      
      try {
        const node = this.transform(entity);
        if (node) {
          nodes.push(node);
        } else {
          log.error('Failed to transform entity', {
            entityType: this.entityType,
            entityId: entity?.id || 'unknown'
          });
        }
      } catch (error) {
        log.error('Error transforming entity', {
          entityType: this.entityType,
          entityId: entity?.id || 'unknown',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    });
    
    return this.sortNodes(nodes);
  }

  /**
   * Abstract method to be implemented by subclasses.
   * Creates entity-specific metadata.
   * 
   * @param entity - Entity to create metadata for
   * @param errors - Validation errors from validateEntity
   * @returns Complete metadata object for the node
   * 
   * @remarks
   * Subclasses should call createBaseMetadata and add entity-specific fields
   */
  protected abstract createMetadata(entity: T, errors: string[]): NodeMetadata;

  /**
   * Sort nodes for consistent ordering.
   * Can be overridden for entity-specific sorting.
   * 
   * @param nodes - Array of nodes to sort
   * @returns Sorted array of nodes
   * 
   * @remarks
   * Default implementation sorts alphabetically by label (case-insensitive)
   * 
   * Complexity: O(n log n) - JavaScript sort algorithm
   */
  protected sortNodes(nodes: GraphNode<T>[]): GraphNode<T>[] {
    // Default: sort by name
    return nodes.sort((a, b) => {
      const aName = a.data.label.toLowerCase();
      const bName = b.data.label.toLowerCase();
      return aName.localeCompare(bName);
    });
  }
}

/**
 * Utility class for common transformation operations.
 * Static methods for calculations and formatting used across transformers.
 */
export class TransformationUtils {
  /**
   * Calculate importance score based on connection counts.
   * Weighted scoring system for node importance.
   * 
   * @param primaryCount - Number of primary connections (weight: 10)
   * @param secondaryCount - Number of secondary connections (weight: 5)  
   * @param tertiaryCount - Number of tertiary connections (weight: 2)
   * @returns Calculated importance score
   * 
   * @example
   * ```typescript
   * const score = TransformationUtils.calculateImportanceScore(3, 5, 10);
   * // Returns: 3*10 + 5*5 + 10*2 = 75
   * ```
   * 
   * Complexity: O(1)
   */
  static calculateImportanceScore(
    primaryCount: number = 0,
    secondaryCount: number = 0,
    tertiaryCount: number = 0
  ): number {
    return (primaryCount * 10) + (secondaryCount * 5) + (tertiaryCount * 2);
  }

  /**
   * Generate type-based CSS class name.
   * Converts type to kebab-case CSS class.
   * 
   * @param type - Type string to convert
   * @param prefix - CSS class prefix
   * @returns CSS class name
   * 
   * @example
   * ```typescript
   * getTypeClass('MyType', 'node') // Returns: 'node-my-type'
   * getTypeClass(undefined, 'node') // Returns: 'node-unknown'
   * ```
   */
  static getTypeClass(type: string | undefined, prefix: string): string {
    if (!type) return `${prefix}-unknown`;
    return `${prefix}-${type.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  }

  /**
   * Generate status-based CSS class name.
   * Converts status to kebab-case CSS class.
   * 
   * @param status - Status string to convert
   * @param prefix - CSS class prefix (defaults to 'status')
   * @returns CSS class name
   */
  static getStatusClass(status: string | undefined, prefix = 'status'): string {
    if (!status) return `${prefix}-unknown`;
    return `${prefix}-${status.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  }

  /**
   * Safely get array length.
   * Handles undefined/null arrays gracefully.
   * 
   * @param arr - Array or potentially undefined/null value
   * @returns Array length or 0 for non-arrays
   * 
   * Complexity: O(1)
   */
  static getArrayLength(arr: unknown[] | undefined | null): number {
    return Array.isArray(arr) ? arr.length : 0;
  }

  /**
   * Create a display label with optional count suffix.
   * Appends count when above threshold.
   * 
   * @param base - Base label text
   * @param count - Number of items
   * @param threshold - Minimum count to show suffix (default: 5)
   * @param suffix - Count suffix text (default: 'items')
   * @returns Label with or without count
   * 
   * @example
   * ```typescript
   * createLabelWithCount('Puzzles', 3) // Returns: 'Puzzles'
   * createLabelWithCount('Puzzles', 10) // Returns: 'Puzzles (10 items)'
   * ```
   */
  static createLabelWithCount(
    base: string,
    count: number,
    threshold = 5,
    suffix = 'items'
  ): string {
    if (count > threshold) {
      return `${base} (${count} ${suffix})`;
    }
    return base;
  }

  /**
   * Check if entity has significant connections.
   * Determines if any connection count meets threshold.
   * 
   * @param counts - Array of connection counts
   * @param threshold - Minimum count for significance (default: 3)
   * @returns True if any count meets threshold
   * 
   * Complexity: O(n) where n = counts.length
   */
  static hasSignificantConnections(
    counts: number[],
    threshold = 3
  ): boolean {
    return counts.some(count => count >= threshold);
  }
}

/**
 * Shared edge creation utilities.
 * Static methods for edge ID generation, validation, and styling.
 */
export class EdgeCreationUtils {
  /**
   * Create a unique edge ID.
   * Combines relationship type and node IDs for uniqueness.
   * 
   * @param source - Source node ID
   * @param target - Target node ID
   * @param relationshipType - Type of relationship
   * @returns Unique edge identifier
   * 
   * @example
   * ```typescript
   * createEdgeId('node1', 'node2', 'requires')
   * // Returns: 'requires-node1-node2'
   * ```
   */
  static createEdgeId(
    source: string,
    target: string,
    relationshipType: string
  ): string {
    return `${relationshipType}-${source}-${target}`;
  }

  /**
   * Check if edge already exists in edge array.
   * Prevents duplicate edge creation.
   * 
   * @param edges - Existing edges array
   * @param source - Source node ID
   * @param target - Target node ID
   * @param relationshipType - Type of relationship
   * @returns True if edge exists
   * 
   * Complexity: O(n) where n = edges.length
   */
  static edgeExists(
    edges: Array<{ id: string }>,
    source: string,
    target: string,
    relationshipType: string
  ): boolean {
    const edgeId = this.createEdgeId(source, target, relationshipType);
    return edges.some(edge => edge.id === edgeId);
  }

  /**
   * Create edge style based on relationship type.
   * Returns CSS properties for edge rendering.
   * 
   * @param relationshipType - Type of relationship
   * @param isBroken - Whether edge represents broken connection
   * @returns Style object with stroke, width, and dash properties
   * 
   * @remarks
   * Predefined styles for: requirement, reward, ownership, chain,
   * timeline, collaboration, owner, container.
   * Broken edges are rendered in red with dashed lines.
   * 
   * Complexity: O(1) - Object lookup
   */
  static getEdgeStyle(relationshipType: string, isBroken = false): Record<string, any> {
    const baseStyles: Record<string, any> = {
      requirement: {
        stroke: '#dc2626',
        strokeWidth: 2,
        strokeDasharray: 'none',
      },
      reward: {
        stroke: '#10b981',
        strokeWidth: 2,
        strokeDasharray: '5,5',
      },
      ownership: {
        stroke: '#3b82f6',
        strokeWidth: 2,
        strokeDasharray: 'none',
      },
      chain: {
        stroke: '#8b5cf6',
        strokeWidth: 3,
        strokeDasharray: 'none',
      },
      timeline: {
        stroke: '#f59e0b',
        strokeWidth: 2,
        strokeDasharray: '3,3',
      },
      collaboration: {
        stroke: '#ec4899',
        strokeWidth: 2,
        strokeDasharray: '4,2',
      },
      owner: {
        stroke: '#3b82f6',
        strokeWidth: 2,
        strokeDasharray: 'none',
      },
      container: {
        stroke: '#6b7280',
        strokeWidth: 1.5,
        strokeDasharray: '8,4',
      },
    };

    const style = baseStyles[relationshipType] || {
      stroke: '#6b7280',
      strokeWidth: 1,
      strokeDasharray: 'none',
    };

    // Modify style if edge is broken
    if (isBroken) {
      style.stroke = '#ef4444';
      style.strokeDasharray = '10,5';
      style.opacity = 0.5;
    }

    return style;
  }

  /**
   * Determine if edge should be animated.
   * Certain relationship types have animated edges.
   * 
   * @param relationshipType - Type of relationship
   * @returns True if edge should animate
   * 
   * @remarks
   * Currently animates: reward, chain relationships
   */
  static shouldAnimateEdge(relationshipType: string): boolean {
    const animatedTypes = ['reward', 'chain'];
    return animatedTypes.includes(relationshipType);
  }
}

/**
 * Shared validation utilities.
 * Static methods for common validation operations.
 */
export class ValidationUtils {
  /**
   * Validate ID format.
   * Checks for non-empty string.
   * 
   * @param id - Value to validate as ID
   * @returns True if valid ID format
   * 
   * Complexity: O(1)
   */
  static isValidId(id: unknown): boolean {
    return typeof id === 'string' && id.length > 0;
  }

  /**
   * Validate name field.
   * Checks for non-empty string.
   * 
   * @param name - Value to validate as name
   * @returns True if valid name
   * 
   * Complexity: O(1)
   */
  static isValidName(name: unknown): boolean {
    return typeof name === 'string' && name.length > 0;
  }

  /**
   * Validate enum value.
   * Type-safe enum validation.
   * 
   * @typeParam T - Enum type
   * @param value - Value to validate
   * @param validValues - Array of valid enum values
   * @returns True if value is in valid values (with type predicate)
   * 
   * @example
   * ```typescript
   * const STATUS = ['active', 'inactive'] as const;
   * if (isValidEnumValue(value, STATUS)) {
   *   // value is typed as 'active' | 'inactive'
   * }
   * ```
   * 
   * Complexity: O(n) where n = validValues.length
   */
  static isValidEnumValue<T extends string>(
    value: unknown,
    validValues: readonly T[]
  ): value is T {
    return typeof value === 'string' && validValues.includes(value as T);
  }

  /**
   * Batch validate multiple required fields.
   * Checks for presence of all required fields.
   * 
   * @param entity - Object to validate
   * @param requiredFields - Array of required field names
   * @returns Array of error messages for missing fields
   * 
   * @example
   * ```typescript
   * const errors = validateFields(entity, ['id', 'name', 'type']);
   * // Returns: ['Missing required field: name'] if name is missing
   * ```
   * 
   * Complexity: O(n) where n = requiredFields.length
   */
  static validateFields(
    entity: Record<string, unknown>,
    requiredFields: string[]
  ): string[] {
    const errors: string[] = [];
    
    requiredFields.forEach(field => {
      if (!entity[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    });
    
    return errors;
  }
}