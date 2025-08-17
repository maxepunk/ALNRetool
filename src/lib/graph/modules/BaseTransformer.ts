/**
 * Base Transformer Class
 * Provides shared functionality for all entity transformers
 * Addresses code duplication identified in Phase 2
 */

import type { 
  GraphNode, 
  NodeMetadata, 
  EntityType,
  VisualHints 
} from '../types';

/**
 * Default position for all nodes (will be overridden by layout)
 * Shared constant to avoid duplication across transformers
 */
export const DEFAULT_POSITION = { x: 0, y: 0 } as const;

/**
 * Base validation error messages
 */
export const VALIDATION_ERRORS = {
  MISSING_ID: 'Missing entity ID',
  MISSING_NAME: 'Missing entity name',
  MISSING_TYPE: 'Missing entity type',
  INVALID_TYPE: 'Invalid entity type',
  INVALID_DATA: 'Invalid entity data',
} as const;

/**
 * Abstract base class for entity transformers
 * Provides common functionality to reduce code duplication
 */
export abstract class BaseTransformer<T extends { id: string; name: string }> {
  protected abstract entityType: EntityType;
  protected abstract nodeType: string;

  /**
   * Validate entity has required fields
   * Can be overridden for entity-specific validation
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
   * Generate label for node
   * Can be overridden for entity-specific label generation
   */
  protected generateLabel(entity: T): string {
    return entity.name || `Unknown ${this.entityType}`;
  }

  /**
   * Create error metadata for validation failures
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
   * Create base metadata for a node
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
   * Transform a single entity into a graph node
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
      console.warn(`${this.entityType} node ${entity.id} has validation errors:`, errors);
    }
    
    return node;
  }

  /**
   * Transform multiple entities
   */
  public transformMultiple(entities: T[]): GraphNode<T>[] {
    const nodes: GraphNode<T>[] = [];
    
    entities.forEach((entity) => {
      // Skip null/undefined entities
      if (!entity) {
        console.warn(`Skipping null/undefined ${this.entityType} entity`);
        return;
      }
      
      try {
        const node = this.transform(entity);
        if (node) {
          nodes.push(node);
        } else {
          console.error(`Failed to transform ${this.entityType} ${entity?.id || 'unknown'}`);
        }
      } catch (error) {
        console.error(`Error transforming ${this.entityType} ${entity?.id || 'unknown'}:`, error);
      }
    });
    
    return this.sortNodes(nodes);
  }

  /**
   * Abstract method to be implemented by subclasses
   * Creates entity-specific metadata
   */
  protected abstract createMetadata(entity: T, errors: string[]): NodeMetadata;

  /**
   * Sort nodes (can be overridden for entity-specific sorting)
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
 * Utility class for common transformation operations
 */
export class TransformationUtils {
  /**
   * Calculate importance score based on connections
   */
  static calculateImportanceScore(
    primaryCount: number = 0,
    secondaryCount: number = 0,
    tertiaryCount: number = 0
  ): number {
    return (primaryCount * 10) + (secondaryCount * 5) + (tertiaryCount * 2);
  }

  /**
   * Generate type-based CSS class name
   */
  static getTypeClass(type: string | undefined, prefix: string): string {
    if (!type) return `${prefix}-unknown`;
    return `${prefix}-${type.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  }

  /**
   * Generate status-based CSS class name
   */
  static getStatusClass(status: string | undefined, prefix = 'status'): string {
    if (!status) return `${prefix}-unknown`;
    return `${prefix}-${status.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  }

  /**
   * Safely get array length
   */
  static getArrayLength(arr: unknown[] | undefined | null): number {
    return Array.isArray(arr) ? arr.length : 0;
  }

  /**
   * Create a display label with optional count
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
   * Check if entity has significant connections
   */
  static hasSignificantConnections(
    counts: number[],
    threshold = 3
  ): boolean {
    return counts.some(count => count >= threshold);
  }
}

/**
 * Shared edge creation utilities
 */
export class EdgeCreationUtils {
  /**
   * Create a unique edge ID
   */
  static createEdgeId(
    source: string,
    target: string,
    relationshipType: string
  ): string {
    return `${relationshipType}-${source}-${target}`;
  }

  /**
   * Check if edge already exists
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
   * Create edge style based on relationship type
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
   * Determine if edge should be animated
   */
  static shouldAnimateEdge(relationshipType: string): boolean {
    const animatedTypes = ['reward', 'chain'];
    return animatedTypes.includes(relationshipType);
  }
}

/**
 * Shared validation utilities
 */
export class ValidationUtils {
  /**
   * Validate ID format
   */
  static isValidId(id: unknown): boolean {
    return typeof id === 'string' && id.length > 0;
  }

  /**
   * Validate name
   */
  static isValidName(name: unknown): boolean {
    return typeof name === 'string' && name.length > 0;
  }

  /**
   * Validate enum value
   */
  static isValidEnumValue<T extends string>(
    value: unknown,
    validValues: readonly T[]
  ): value is T {
    return typeof value === 'string' && validValues.includes(value as T);
  }

  /**
   * Batch validate multiple fields
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