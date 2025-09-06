/**
 * Entity Merge Utility
 * 
 * Handles merging of partial Notion API responses with existing entity data.
 * This solves the issue where Notion API returns only updated properties,
 * causing loss of unchanged relationship fields.
 * 
 * WHY: Notion's pages.update endpoint returns only the properties that were 
 * included in the update request. When we update just 'name', the response 
 * contains only 'name' - not the complete page. Our transform functions then
 * create entities with empty arrays for missing relationship fields.
 * 
 * @module server/utils/entityMerger
 */

import type { 
  Character, 
  Element, 
  Puzzle, 
  TimelineEvent 
} from '../../src/types/notion/app.js';

// Union type for all entity types
export type Entity = Character | Element | Puzzle | TimelineEvent;

/**
 * Merges a partial entity update with the existing complete entity.
 * 
 * Strategy: Simple field-by-field copy
 * - Start with complete old entity
 * - Overwrite with any non-undefined fields from partial
 * - Arrays are replaced wholesale (empty array means explicitly cleared)
 * 
 * @param oldEntity - The complete entity before update
 * @param partialEntity - The transformed entity from Notion's partial response  
 * @returns Complete merged entity with all fields preserved
 * 
 * @example
 * // User updates only the name
 * const oldEntity = { id: '1', name: 'Old', relationships: ['a', 'b'] };
 * const partial = { id: '1', name: 'New', relationships: [] }; // empty from transform
 * const merged = mergeEntityUpdate(oldEntity, partial);
 * // Result: { id: '1', name: 'New', relationships: ['a', 'b'] }
 */
export function mergeEntityUpdate<T extends Entity>(
  oldEntity: T,
  partialEntity: Partial<T>
): T {
  // Start with a deep copy of the old entity
  const merged = { ...oldEntity };
  
  // Only update fields that are explicitly defined in the partial
  for (const key in partialEntity) {
    const newValue = partialEntity[key];
    
    // Skip undefined values - these weren't in Notion's response
    if (newValue === undefined) {
      continue;
    }
    
    // For arrays, we need to determine if empty means "cleared" or "not included"
    // Since our transforms now return empty arrays for missing fields,
    // we need to be smart about this
    if (Array.isArray(newValue) && Array.isArray(oldEntity[key])) {
      // If the array is empty, it could mean:
      // 1. The field was explicitly cleared (user removed all items)
      // 2. The field wasn't in Notion's response (our transform returned [])
      // 
      // Without the original Notion response, we can't tell the difference.
      // For safety, preserve non-empty arrays when new is empty.
      if (newValue.length === 0 && (oldEntity[key] as any[]).length > 0) {
        // Keep old value - likely not in response
        continue;
      }
    }
    
    // Update the field
    merged[key] = newValue as T[Extract<keyof T, string>];
  }
  
  return merged;
}

/**
 * Smart merge that knows about entity structure.
 * Uses knowledge of which fields are relationships to make better decisions.
 * 
 * @param oldEntity - The complete entity before update
 * @param partialEntity - The transformed entity from Notion's partial response
 * @param updatePayload - The original update request (what user actually changed)
 * @returns Complete merged entity
 */
export function smartMergeEntityUpdate<T extends Entity>(
  oldEntity: T,
  partialEntity: Partial<T>,
  updatePayload?: Record<string, any>
): T {
  const merged = { ...oldEntity };
  
  for (const key in partialEntity) {
    const newValue = partialEntity[key];
    const oldValue = oldEntity[key];
    
    // Skip undefined
    if (newValue === undefined) {
      continue;
    }
    
    // For relationship fields (arrays ending in 'Ids' or known rollups)
    const isRelationshipField = 
      key.endsWith('Ids') || 
      key === 'connections' || 
      key === 'narrativeThreads' ||
      key === 'storyReveals' ||
      key === 'timing' ||
      key === 'memTypes' ||
      key === 'puzzleChain';
    
    if (isRelationshipField && Array.isArray(newValue) && Array.isArray(oldValue)) {
      // If the new array is empty and old had data
      if (newValue.length === 0 && oldValue.length > 0) {
        // Check if this field was explicitly in the update request
        if (updatePayload && !(key in updatePayload)) {
          // Field wasn't updated by user - preserve old value
          continue;
        }
      }
    }
    
    // For single relationship fields
    const isSingleRelationship = 
      key === 'ownerId' || 
      key === 'containerId' ||
      key === 'timelineEventId' ||
      key === 'containerPuzzleId' ||
      key === 'lockedItemId' ||
      key === 'parentItemId';
    
    if (isSingleRelationship) {
      // If new is undefined/null and old had value
      if (!newValue && oldValue) {
        // Check if explicitly cleared
        if (updatePayload && !(key in updatePayload)) {
          // Not in update - preserve old
          continue;
        }
      }
    }
    
    // Update the field
    merged[key] = newValue as T[Extract<keyof T, string>];
  }
  
  return merged;
}

/**
 * Validates that a merge operation preserved critical data.
 * 
 * @param oldEntity - Entity before update
 * @param merged - Entity after merge  
 * @param updatePayload - Original update request
 * @returns Array of validation warnings (empty if valid)
 */
export function validateMerge<T extends Entity>(
  oldEntity: T,
  merged: T,
  updatePayload?: Record<string, any>
): string[] {
  const issues: string[] = [];
  
  // Check each field
  for (const key in oldEntity) {
    const oldValue = oldEntity[key];
    const mergedValue = merged[key];
    
    // Check array fields
    if (Array.isArray(oldValue) && Array.isArray(mergedValue)) {
      // Data loss detection
      if (oldValue.length > 0 && mergedValue.length === 0) {
        // Was this field in the update?
        if (updatePayload && !(key in updatePayload)) {
          issues.push(
            `Warning: ${String(key)} was cleared (${oldValue.length} → 0) ` +
            `but wasn't in update request`
          );
        }
      }
    }
    
    // Check single values
    if (oldValue && !mergedValue && typeof oldValue === 'string') {
      if (updatePayload && !(key in updatePayload)) {
        issues.push(
          `Warning: ${String(key)} was cleared but wasn't in update request`
        );
      }
    }
  }
  
  return issues;
}