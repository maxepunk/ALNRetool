/**
 * EntityTransformer Module
 * Handles transformation of Notion entities into graph nodes
 */

import type { 
  Character, 
  Element, 
  Puzzle, 
  TimelineEvent 
} from '@/types/notion/app';
import type {
  GraphNode,
  EntityType,
  EntityTransformer as IEntityTransformer,
  NotionData
} from '../types';

import { CharacterTransformer } from './transformers/CharacterTransformer';
import { ElementTransformer } from './transformers/ElementTransformer';
import { PuzzleTransformer } from './transformers/PuzzleTransformer';
import { TimelineTransformer } from './transformers/TimelineTransformer';
import { buildLookupMaps } from '../relationships';

export class EntityTransformer implements IEntityTransformer {
  private characterTransformer = new CharacterTransformer();
  private elementTransformer = new ElementTransformer();
  private puzzleTransformer = new PuzzleTransformer();
  private timelineTransformer = new TimelineTransformer();

  /**
   * Transform character entities to graph nodes
   */
  transformCharacters(characters: Character[]): GraphNode[] {
    return this.characterTransformer.transformMultiple(characters);
  }

  /**
   * Transform element entities to graph nodes
   */
  transformElements(elements: Element[]): GraphNode[] {
    return this.elementTransformer.transformMultiple(elements);
  }

  /**
   * Transform puzzle entities to graph nodes
   */
  transformPuzzles(puzzles: Puzzle[]): GraphNode[] {
    return this.puzzleTransformer.transformMultiple(puzzles);
  }

  /**
   * Transform timeline entities to graph nodes
   */
  transformTimeline(timeline: TimelineEvent[]): GraphNode[] {
    return this.timelineTransformer.transformMultiple(timeline);
  }

  /**
   * Transform all entities with optional filtering
   */
  transformEntities(data: NotionData, excludeTypes?: EntityType[]): GraphNode[] {
    console.group('Transforming entities to nodes');
    
    // Build complete lookup maps for enrichment
    const lookupMaps = buildLookupMaps(
      data.characters,
      data.elements,
      data.puzzles,
      data.timeline
    );
    
    const allNodes: GraphNode[] = [];
    
    // Transform each entity type unless excluded
    if (!excludeTypes?.includes('character')) {
      allNodes.push(...this.characterTransformer.transformMultiple(data.characters));
    }
    
    if (!excludeTypes?.includes('element')) {
      const elementNodes = this.elementTransformer.transformMultiple(data.elements);
      // Enrich element nodes with timeline and other metadata
      const enrichedElementNodes = elementNodes.map(node => 
        this.elementTransformer.enrichNode(node, lookupMaps)
      );
      allNodes.push(...enrichedElementNodes);
    }
    
    if (!excludeTypes?.includes('puzzle')) {
      allNodes.push(...this.puzzleTransformer.transformMultiple(data.puzzles));
    }
    
    if (!excludeTypes?.includes('timeline')) {
      allNodes.push(...this.timelineTransformer.transformMultiple(data.timeline));
    }
    
    // Calculate metrics
    const metrics = {
      total: allNodes.length,
      byType: {
        character: data.characters.length,
        element: data.elements.length,
        puzzle: data.puzzles.length,
        timeline: data.timeline.length,
      },
      withErrors: allNodes.filter(n => n.data.metadata.errorState).length,
      withSFPatterns: allNodes.filter(n => n.data.metadata.sfPatterns).length,
    };
    
    console.log('Node transformation complete:', metrics);
    console.groupEnd();
    
    return allNodes;
  }
}

// Export singleton instance
export const entityTransformer = new EntityTransformer();