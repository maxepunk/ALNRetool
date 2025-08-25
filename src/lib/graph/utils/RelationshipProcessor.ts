/**
 * RelationshipProcessor Utility Module
 * 
 * Consolidates relationship processing logic across the graph system.
 * Provides consistent handling of entity relationships, edge creation,
 * and bidirectional connections.
 */

import { log } from '@/utils/logger';
import type {
  Character,
  Element,
  Puzzle,
  TimelineEvent
} from '@/types/notion/app';
import type { GraphEdge, RelationshipType } from '../types';

/**
 * Configuration for relationship processing
 */
export interface RelationshipConfig {
  /**
   * Whether to create bidirectional edges for relationships
   */
  createBidirectional?: boolean;
  
  /**
   * Filter nodes by this set of IDs
   */
  includedNodeIds?: Set<string>;
  
  /**
   * Minimum weight threshold for edges
   */
  minWeight?: number;
}

/**
 * Extended relationship types including graph-specific types
 */
export type ExtendedRelationshipType = RelationshipType | 'chain' | 'dependency' | 'relation';

/**
 * Relationship metadata
 */
export interface RelationshipMetadata {
  type: ExtendedRelationshipType;
  source: string;
  target: string;
  label?: string;
  weight?: number;
  bidirectional?: boolean;
  metadata?: Record<string, any>;
}

/**
 * Utility class for processing entity relationships
 */
export class RelationshipProcessor {
  private config: RelationshipConfig;
  private processedRelationships = new Set<string>();

  constructor(config: RelationshipConfig = {}) {
    this.config = {
      createBidirectional: true,
      minWeight: 0,
      ...config
    };
  }

  /**
   * Clear the processed relationships cache
   */
  clearCache(): void {
    this.processedRelationships.clear();
  }

  /**
   * Generate a unique key for a relationship
   */
  private getRelationshipKey(
    source: string, 
    target: string, 
    type: ExtendedRelationshipType
  ): string {
    return `${type}:${source}:${target}`;
  }

  /**
   * Check if a relationship has already been processed
   */
  private isProcessed(
    source: string, 
    target: string, 
    type: ExtendedRelationshipType
  ): boolean {
    const key = this.getRelationshipKey(source, target, type);
    const reverseKey = this.getRelationshipKey(target, source, type);
    return this.processedRelationships.has(key) || 
           (this.config.createBidirectional === true && this.processedRelationships.has(reverseKey));
  }

  /**
   * Mark a relationship as processed
   */
  private markProcessed(
    source: string, 
    target: string, 
    type: ExtendedRelationshipType
  ): void {
    const key = this.getRelationshipKey(source, target, type);
    this.processedRelationships.add(key);
  }

  /**
   * Check if a node should be included based on filter
   */
  private shouldIncludeNode(nodeId: string): boolean {
    if (!this.config.includedNodeIds) return true;
    return this.config.includedNodeIds.has(nodeId);
  }

  /**
   * Calculate edge weight based on relationship type
   */
  calculateEdgeWeight(type: ExtendedRelationshipType): number {
    const weights: Record<string, number> = {
      'requirement': 10,
      'reward': 8,
      'ownership': 6,
      'chain': 15,
      'timeline': 5,
      'collaboration': 4,
      'owner': 6,
      'container': 3,
      'dependency': 10,
      'relation': 4,
      'puzzle-grouping': 12,
      'virtual-dependency': 7
    };
    return weights[type] || 1;
  }

  /**
   * Process character relationships
   */
  processCharacterRelationships(
    character: Character,
    allCharacters: Character[]
  ): RelationshipMetadata[] {
    const relationships: RelationshipMetadata[] = [];

    // Process character connections
    character.connections?.forEach(targetId => {
      if (!this.shouldIncludeNode(targetId)) return;
      if (this.isProcessed(character.id, targetId, 'relation')) return;

      const targetCharacter = allCharacters.find(c => c.id === targetId);
      if (!targetCharacter) return;

      relationships.push({
        type: 'relation',
        source: character.id,
        target: targetId,
        label: `${character.name} ↔ ${targetCharacter.name}`,
        weight: this.calculateEdgeWeight('relation'),
        bidirectional: true,
        metadata: {
          bidirectional: true
        }
      });

      this.markProcessed(character.id, targetId, 'relation');
    });

    // Process owned elements
    character.ownedElementIds?.forEach(elementId => {
      if (!this.shouldIncludeNode(elementId)) return;
      if (this.isProcessed(character.id, elementId, 'ownership')) return;

      relationships.push({
        type: 'ownership',
        source: character.id,
        target: elementId,
        label: 'owns',
        weight: this.calculateEdgeWeight('ownership'),
        bidirectional: false
      });

      this.markProcessed(character.id, elementId, 'ownership');
    });

    return relationships;
  }

  /**
   * Process puzzle relationships
   */
  processPuzzleRelationships(puzzle: Puzzle): RelationshipMetadata[] {
    const relationships: RelationshipMetadata[] = [];

    // Process sub-puzzles (dependencies)
    puzzle.subPuzzleIds?.forEach(subPuzzleId => {
      if (!this.shouldIncludeNode(subPuzzleId)) return;
      if (this.isProcessed(puzzle.id, subPuzzleId, 'dependency')) return;

      relationships.push({
        type: 'dependency',
        source: puzzle.id,
        target: subPuzzleId,
        label: 'depends on',
        weight: this.calculateEdgeWeight('dependency'),
        bidirectional: false
      });

      this.markProcessed(puzzle.id, subPuzzleId, 'dependency');
    });

    // Process puzzle elements (requirements)
    puzzle.puzzleElementIds?.forEach(elementId => {
      if (!this.shouldIncludeNode(elementId)) return;
      if (this.isProcessed(puzzle.id, elementId, 'requirement')) return;

      relationships.push({
        type: 'requirement',
        source: puzzle.id,
        target: elementId,
        label: 'requires',
        weight: this.calculateEdgeWeight('requirement'),
        bidirectional: false
      });

      this.markProcessed(puzzle.id, elementId, 'requirement');
    });

    // Process rewards
    puzzle.rewardIds?.forEach(rewardId => {
      if (!this.shouldIncludeNode(rewardId)) return;
      if (this.isProcessed(puzzle.id, rewardId, 'reward')) return;

      relationships.push({
        type: 'reward',
        source: puzzle.id,
        target: rewardId,
        label: 'rewards',
        weight: this.calculateEdgeWeight('reward'),
        bidirectional: false
      });

      this.markProcessed(puzzle.id, rewardId, 'reward');
    });

    return relationships;
  }

  /**
   * Process element relationships
   */
  processElementRelationships(
    element: Element,
    allPuzzles: Puzzle[]
  ): RelationshipMetadata[] {
    const relationships: RelationshipMetadata[] = [];

    // Process puzzles that require this element
    element.requiredForPuzzleIds?.forEach(puzzleId => {
      if (!this.shouldIncludeNode(puzzleId)) return;
      if (this.isProcessed(element.id, puzzleId, 'requirement')) return;

      const puzzle = allPuzzles.find(p => p.id === puzzleId);
      if (!puzzle) return;

      relationships.push({
        type: 'requirement',
        source: puzzleId,
        target: element.id,
        label: 'requires',
        weight: this.calculateEdgeWeight('requirement'),
        bidirectional: false
      });

      this.markProcessed(puzzleId, element.id, 'requirement');
    });

    // Process puzzles that reward this element
    element.rewardedByPuzzleIds?.forEach(puzzleId => {
      if (!this.shouldIncludeNode(puzzleId)) return;
      if (this.isProcessed(element.id, puzzleId, 'reward')) return;

      const puzzle = allPuzzles.find(p => p.id === puzzleId);
      if (!puzzle) return;

      relationships.push({
        type: 'reward',
        source: puzzleId,
        target: element.id,
        label: 'rewards',
        weight: this.calculateEdgeWeight('reward'),
        bidirectional: false
      });

      this.markProcessed(puzzleId, element.id, 'reward');
    });

    return relationships;
  }

  /**
   * Process timeline relationships
   */
  processTimelineRelationships(event: TimelineEvent): RelationshipMetadata[] {
    const relationships: RelationshipMetadata[] = [];

    // Process characters involved
    event.charactersInvolvedIds?.forEach(characterId => {
      if (!this.shouldIncludeNode(characterId)) return;
      if (this.isProcessed(event.id, characterId, 'timeline')) return;

      relationships.push({
        type: 'timeline',
        source: event.id,
        target: characterId,
        label: 'involves',
        weight: this.calculateEdgeWeight('timeline'),
        bidirectional: false
      });

      this.markProcessed(event.id, characterId, 'timeline');
    });

    return relationships;
  }

  /**
   * Convert relationship metadata to graph edges
   */
  createEdgesFromRelationships(
    relationships: RelationshipMetadata[]
  ): GraphEdge[] {
    const edges: GraphEdge[] = [];

    relationships.forEach(rel => {
      // Skip if weight is below threshold
      if (rel.weight && rel.weight < this.config.minWeight!) {
        return;
      }

      const edge: GraphEdge = {
        id: `${rel.type}-${rel.source}-${rel.target}`,
        source: rel.source,
        target: rel.target,
        type: rel.type,
        data: {
          relationshipType: rel.type as RelationshipType,
          weight: rel.weight || 1,
          label: rel.label,
          metadata: rel.metadata || {}
        }
      };

      edges.push(edge);
    });

    return edges;
  }

  /**
   * Process all relationships for a set of entities
   */
  processAllRelationships(data: {
    characters?: Character[];
    elements?: Element[];
    puzzles?: Puzzle[];
    timeline?: TimelineEvent[];
  }): GraphEdge[] {
    const allRelationships: RelationshipMetadata[] = [];

    // Process character relationships
    data.characters?.forEach(character => {
      const relationships = this.processCharacterRelationships(
        character,
        data.characters || []
      );
      allRelationships.push(...relationships);
    });

    // Process puzzle relationships
    data.puzzles?.forEach(puzzle => {
      const relationships = this.processPuzzleRelationships(puzzle);
      allRelationships.push(...relationships);
    });

    // Process element relationships
    data.elements?.forEach(element => {
      const relationships = this.processElementRelationships(
        element,
        data.puzzles || []
      );
      allRelationships.push(...relationships);
    });

    // Process timeline relationships
    data.timeline?.forEach(event => {
      const relationships = this.processTimelineRelationships(event);
      allRelationships.push(...relationships);
    });

    log.debug('Processed relationships', {
      total: allRelationships.length,
      characters: data.characters?.length || 0,
      puzzles: data.puzzles?.length || 0,
      elements: data.elements?.length || 0,
      timeline: data.timeline?.length || 0
    });

    return this.createEdgesFromRelationships(allRelationships);
  }

  /**
   * Find connected components in a graph
   */
  findConnectedComponents(
    nodeIds: Set<string>,
    relationships: RelationshipMetadata[]
  ): Set<string>[] {
    const adjacencyList = new Map<string, Set<string>>();
    
    // Build adjacency list
    relationships.forEach(rel => {
      if (!adjacencyList.has(rel.source)) {
        adjacencyList.set(rel.source, new Set());
      }
      if (!adjacencyList.has(rel.target)) {
        adjacencyList.set(rel.target, new Set());
      }
      
      adjacencyList.get(rel.source)!.add(rel.target);
      if (rel.bidirectional) {
        adjacencyList.get(rel.target)!.add(rel.source);
      }
    });

    const visited = new Set<string>();
    const components: Set<string>[] = [];

    // DFS to find components
    const dfs = (node: string, component: Set<string>) => {
      visited.add(node);
      component.add(node);
      
      const neighbors = adjacencyList.get(node);
      if (neighbors) {
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor) && nodeIds.has(neighbor)) {
            dfs(neighbor, component);
          }
        }
      }
    };

    // Find all components
    for (const nodeId of nodeIds) {
      if (!visited.has(nodeId)) {
        const component = new Set<string>();
        dfs(nodeId, component);
        if (component.size > 0) {
          components.push(component);
        }
      }
    }

    return components;
  }

  /**
   * Calculate relationship strength between two nodes
   */
  calculateRelationshipStrength(
    nodeId1: string,
    nodeId2: string,
    relationships: RelationshipMetadata[]
  ): number {
    let strength = 0;
    
    relationships.forEach(rel => {
      if ((rel.source === nodeId1 && rel.target === nodeId2) ||
          (rel.source === nodeId2 && rel.target === nodeId1)) {
        strength += rel.weight || 1;
      }
    });

    return strength;
  }
}

// Export singleton instance for convenience
export const relationshipProcessor = new RelationshipProcessor();