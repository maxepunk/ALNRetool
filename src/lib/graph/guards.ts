/**
 * Runtime Type Guards for Graph Entities
 * Separated from types.ts to maintain clean type/runtime boundary
 * per our architecture principle of no mixed exports
 */

import type { GraphNode, NotionEntity, EntityType } from './types';

/**
 * Type guard to check if a node has an error state
 */
export function hasError(node: GraphNode): boolean {
  return node.data.metadata.errorState !== undefined;
}

/**
 * Type guard to check entity type
 */
export function isEntityType<T extends NotionEntity>(
  entity: NotionEntity,
  type: EntityType
): entity is T {
  switch (type) {
    case 'character':
      return 'tier' in entity;
    case 'element':
      return 'basicType' in entity;
    case 'puzzle':
      return 'puzzleElementIds' in entity;
    case 'timeline':
      return 'date' in entity;
    default:
      return false;
  }
}