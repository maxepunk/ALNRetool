/**
 * Inverse Relation Handler Service
 * 
 * Handles bidirectional relations in Notion where editing one side
 * requires updating the other side. Specifically handles Element fields
 * that are inverse relations of Puzzle fields.
 */

import { notion } from './notion.js';
import { cacheService } from './cache.js';
import type { NotionPage } from '../../src/types/notion/raw.js';
import type { Element, Puzzle } from '../../src/types/notion/app.js';
import { transformElement, transformPuzzle } from '../../src/types/notion/transforms.js';

interface InverseRelationConfig {
  targetEntity: 'puzzles' | 'characters' | 'elements' | 'timeline';
  targetField: string;
  targetNotionProperty: string;
}

interface UpdateOperation {
  type: 'updatePuzzle' | 'updateElement';
  id: string;
  updates: Record<string, any>;
}

export class InverseRelationHandler {
  /**
   * Map of entity types to their inverse relation fields
   */
  private readonly relationMap: Record<string, Record<string, InverseRelationConfig>> = {
    elements: {
      requiredForPuzzleIds: {
        targetEntity: 'puzzles',
        targetField: 'puzzleElementIds',
        targetNotionProperty: 'Puzzle Elements'
      },
      rewardedByPuzzleIds: {
        targetEntity: 'puzzles',
        targetField: 'rewardIds',
        targetNotionProperty: 'Rewards'
      }
    }
  };

  /**
   * Process Element updates, handling inverse relations
   */
  async processElementUpdate(
    elementId: string,
    updates: Partial<Element>
  ): Promise<{ 
    element?: Element; 
    puzzlesUpdated?: string[];
    errors?: Array<{ operation: string; error: string }> 
  }> {
    const { directUpdates, inverseUpdates } = this.separateUpdates('elements', updates);
    const operations: UpdateOperation[] = [];
    const errors: Array<{ operation: string; error: string }> = [];
    
    // Handle inverse relations first to get the current state
    if (Object.keys(inverseUpdates).length > 0) {
      // Fetch current element state
      const currentElement = await this.fetchElement(elementId);
      if (!currentElement) {
        throw new Error(`Element ${elementId} not found`);
      }
      
      // Generate operations for each inverse relation field
      for (const [field, newValue] of Object.entries(inverseUpdates)) {
        const config = this.relationMap.elements[field];
        if (!config) continue;
        
        const currentValue = (currentElement as any)[field] || [];
        const ops = await this.generateInverseOperations(
          elementId,
          field,
          currentValue,
          newValue as string[],
          config
        );
        operations.push(...ops);
      }
    }
    
    // Execute all operations
    const results = await this.executeOperations(operations, elementId, directUpdates);
    
    // Process results
    let updatedElement: Element | undefined;
    const updatedPuzzleIds: string[] = [];
    
    for (const result of results) {
      if (result.status === 'fulfilled') {
        if (result.value.type === 'element') {
          updatedElement = result.value.data as Element;
        } else if (result.value.type === 'puzzle') {
          updatedPuzzleIds.push(result.value.id);
        }
      } else {
        errors.push({
          operation: 'update',
          error: result.reason?.message || 'Unknown error'
        });
      }
    }
    
    // Invalidate caches
    this.invalidateCaches(elementId, updatedPuzzleIds);
    
    return {
      element: updatedElement,
      puzzlesUpdated: updatedPuzzleIds,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Separate direct updates from inverse relation updates
   */
  private separateUpdates(
    entityType: string,
    updates: Record<string, any>
  ): { directUpdates: Record<string, any>; inverseUpdates: Record<string, any> } {
    const directUpdates: Record<string, any> = {};
    const inverseUpdates: Record<string, any> = {};
    
    const inverseFields = this.relationMap[entityType] || {};
    
    for (const [key, value] of Object.entries(updates)) {
      if (key in inverseFields) {
        inverseUpdates[key] = value;
      } else {
        directUpdates[key] = value;
      }
    }
    
    return { directUpdates, inverseUpdates };
  }

  /**
   * Fetch current Element from Notion
   */
  private async fetchElement(elementId: string): Promise<Element | null> {
    try {
      const response = await notion.pages.retrieve({ 
        page_id: elementId 
      }) as NotionPage;
      
      return transformElement(response);
    } catch (error) {
      console.error(`Failed to fetch element ${elementId}:`, error);
      return null;
    }
  }

  /**
   * Fetch current Puzzle from Notion
   */
  private async fetchPuzzle(puzzleId: string): Promise<Puzzle | null> {
    try {
      const response = await notion.pages.retrieve({ 
        page_id: puzzleId 
      }) as NotionPage;
      
      return transformPuzzle(response);
    } catch (error) {
      console.error(`Failed to fetch puzzle ${puzzleId}:`, error);
      return null;
    }
  }

  /**
   * Generate operations for inverse relation updates
   */
  private async generateInverseOperations(
    elementId: string,
    field: string,
    currentValue: string[],
    newValue: string[],
    config: InverseRelationConfig
  ): Promise<UpdateOperation[]> {
    const operations: UpdateOperation[] = [];
    
    // Find puzzles to add/remove this element from
    const toAdd = newValue.filter(id => !currentValue.includes(id));
    const toRemove = currentValue.filter(id => !newValue.includes(id));
    
    // Add element to puzzles
    for (const puzzleId of toAdd) {
      const puzzle = await this.fetchPuzzle(puzzleId);
      if (!puzzle) {
        console.warn(`Puzzle ${puzzleId} not found, skipping`);
        continue;
      }
      
      const currentIds = (puzzle as any)[config.targetField] || [];
      if (!currentIds.includes(elementId)) {
        operations.push({
          type: 'updatePuzzle',
          id: puzzleId,
          updates: {
            [config.targetNotionProperty]: {
              relation: [...currentIds, elementId].map(id => ({ id }))
            }
          }
        });
      }
    }
    
    // Remove element from puzzles
    for (const puzzleId of toRemove) {
      const puzzle = await this.fetchPuzzle(puzzleId);
      if (!puzzle) {
        console.warn(`Puzzle ${puzzleId} not found, skipping`);
        continue;
      }
      
      const currentIds = (puzzle as any)[config.targetField] || [];
      const newIds = currentIds.filter((id: string) => id !== elementId);
      
      operations.push({
        type: 'updatePuzzle',
        id: puzzleId,
        updates: {
          [config.targetNotionProperty]: {
            relation: newIds.map((id: string) => ({ id }))
          }
        }
      });
    }
    
    return operations;
  }

  /**
   * Execute all update operations
   */
  private async executeOperations(
    operations: UpdateOperation[],
    elementId: string,
    directElementUpdates: Record<string, any>
  ): Promise<Array<PromiseSettledResult<{ type: string; id: string; data?: any }>>> {
    const promises: Promise<{ type: string; id: string; data?: any }>[] = [];
    
    // Add direct element update if there are any
    if (Object.keys(directElementUpdates).length > 0) {
      // Import the mapper dynamically to avoid circular dependency
      const { toNotionElementProperties } = await import('./notionPropertyMappers.js');
      const properties = toNotionElementProperties(directElementUpdates);
      
      promises.push(
        notion.pages.update({
          page_id: elementId,
          properties
        }).then(response => ({
          type: 'element',
          id: elementId,
          data: transformElement(response as NotionPage)
        }))
      );
    }
    
    // Add puzzle update operations
    for (const op of operations) {
      if (op.type === 'updatePuzzle') {
        promises.push(
          notion.pages.update({
            page_id: op.id,
            properties: op.updates
          }).then(() => ({
            type: 'puzzle',
            id: op.id
          }))
        );
      }
    }
    
    return Promise.allSettled(promises);
  }

  /**
   * Invalidate caches for affected entities
   */
  private invalidateCaches(elementId: string, puzzleIds: string[]): void {
    // Clear element cache
    cacheService.invalidatePattern(`elements_${elementId}`);
    cacheService.invalidatePattern('elements');
    
    // Clear puzzle caches
    for (const puzzleId of puzzleIds) {
      cacheService.invalidatePattern(`puzzles_${puzzleId}`);
    }
    cacheService.invalidatePattern('puzzles');
    
    // Clear synthesized cache
    cacheService.invalidatePattern('synthesized');
  }
}

// Export singleton instance
export const inverseRelationHandler = new InverseRelationHandler();