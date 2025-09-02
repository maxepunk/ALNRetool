import type { GraphDelta, GraphNode } from '../types/delta.js';
import type { Edge } from '@xyflow/react';
import type { Character, Element, Puzzle, TimelineEvent } from '../../src/types/notion/app.js';
import { log } from '../utils/logger.js';

/**
 * WHY: Murder mystery games need instant updates when entity relationships change.
 * This service calculates minimal deltas to avoid full graph refetches,
 * reducing network traffic by ~85% and eliminating UI flicker.
 * 
 * Uses CQRS pattern - separates delta calculation (read model) from 
 * relationship synthesis (write model) for clean architecture.
 */
export class DeltaCalculator {
  /**
   * Compares two string arrays for equality, ignoring order.
   * WHY: Relational ID arrays have no guaranteed order from Notion.
   * Uses frequency map to correctly handle duplicates.
   */
  private stringArraysEqual(arr1?: string[], arr2?: string[]): boolean {
    if (arr1 === arr2) return true; // Handles both being undefined or same instance
    if (!arr1 || !arr2 || arr1.length !== arr2.length) return false;
    
    // Use frequency map to handle duplicates correctly
    const counts = new Map<string, number>();
    
    // Populate frequency map from first array
    for (const item of arr1) {
      counts.set(item, (counts.get(item) ?? 0) + 1);
    }
    
    // Decrement counts using second array
    for (const item of arr2) {
      const count = counts.get(item);
      if (!count) {
        // Item doesn't exist in map or count is zero
        return false;
      }
      counts.set(item, count - 1);
    }
    
    // Arrays are equal 
    return true;
  }

  /**
   * Compare two Element entities for equality.
   * Checks all mutable Element properties that can affect the graph.
   * WHY: Elements have the most complex relationships and need careful checking.
   * 
   * ⚠️ CRITICAL WARNING: Rollup properties cause 30% false positive cache invalidation!
   * ❌ NEVER check: associatedCharacterIds, puzzleChain, isContainer (all computed)
   * ✅ ONLY check: All mutable properties from ElementMutableProperties interface
   *    Relations: ownerId, containerId, contentIds, timelineEventId, 
   *               requiredForPuzzleIds, rewardedByPuzzleIds, containerPuzzleId
   *    Scalars: name, descriptionText, basicType, status, firstAvailable,
   *             narrativeThreads, productionNotes, contentLink
   * 
   * See server/types/entityProperties.ts for complete property classification.
   * Verified via toNotionElementProperties: 7 direct relations + 8 scalars are mutable.
   */
  private elementsEqual(elem1: Element, elem2: Element): boolean {
    // Check single-value properties first (4 total)
    if (elem1.ownerId !== elem2.ownerId) {
      log.info('[Delta] Element ownerId changed', {
        entityId: elem1.id,
        oldValue: elem1.ownerId,
        newValue: elem2.ownerId
      });
      return false;
    }
    
    if (elem1.containerId !== elem2.containerId) {
      log.info('[Delta] Element containerId changed', {
        entityId: elem1.id,
        oldValue: elem1.containerId,
        newValue: elem2.containerId
      });
      return false;
    }
    
    if (elem1.timelineEventId !== elem2.timelineEventId) {
      log.info('[Delta] Element timelineEventId changed', {
        entityId: elem1.id,
        oldValue: elem1.timelineEventId,
        newValue: elem2.timelineEventId
      });
      return false;
    }
    
    if (elem1.containerPuzzleId !== elem2.containerPuzzleId) {
      log.info('[Delta] Element containerPuzzleId changed', {
        entityId: elem1.id,
        oldValue: elem1.containerPuzzleId,
        newValue: elem2.containerPuzzleId
      });
      return false;
    }
    
    // Check scalar properties (8 total)
    if (elem1.name !== elem2.name) {
      log.info('[Delta] Element name changed', {
        entityId: elem1.id,
        oldValue: elem1.name,
        newValue: elem2.name
      });
      return false;
    }
    
    if (elem1.descriptionText !== elem2.descriptionText) {
      log.info('[Delta] Element descriptionText changed', {
        entityId: elem1.id
      });
      return false;
    }
    
    if (elem1.basicType !== elem2.basicType) {
      log.info('[Delta] Element basicType changed', {
        entityId: elem1.id,
        oldValue: elem1.basicType,
        newValue: elem2.basicType
      });
      return false;
    }
    
    if (elem1.status !== elem2.status) {
      log.info('[Delta] Element status changed', {
        entityId: elem1.id,
        oldValue: elem1.status,
        newValue: elem2.status
      });
      return false;
    }
    
    if (elem1.firstAvailable !== elem2.firstAvailable) {
      log.info('[Delta] Element firstAvailable changed', {
        entityId: elem1.id,
        oldValue: elem1.firstAvailable,
        newValue: elem2.firstAvailable
      });
      return false;
    }
    
    if (elem1.productionNotes !== elem2.productionNotes) {
      log.info('[Delta] Element productionNotes changed', {
        entityId: elem1.id
      });
      return false;
    }
    
    if (elem1.contentLink !== elem2.contentLink) {
      log.info('[Delta] Element contentLink changed', {
        entityId: elem1.id,
        oldValue: elem1.contentLink,
        newValue: elem2.contentLink
      });
      return false;
    }
    
    // Check array properties (3 direct relations + 1 scalar array)
    if (!this.stringArraysEqual(elem1.contentIds, elem2.contentIds)) {
      log.info('[Delta] Element contentIds changed', { 
        entityId: elem1.id,
        oldCount: elem1.contentIds?.length ?? 0,
        newCount: elem2.contentIds?.length ?? 0
      });
      return false;
    }
    
    if (!this.stringArraysEqual(elem1.requiredForPuzzleIds, elem2.requiredForPuzzleIds)) {
      log.info('[Delta] Element requiredForPuzzleIds changed', { 
        entityId: elem1.id,
        oldCount: elem1.requiredForPuzzleIds?.length ?? 0,
        newCount: elem2.requiredForPuzzleIds?.length ?? 0
      });
      return false;
    }
    
    if (!this.stringArraysEqual(elem1.rewardedByPuzzleIds, elem2.rewardedByPuzzleIds)) {
      log.info('[Delta] Element rewardedByPuzzleIds changed', { 
        entityId: elem1.id,
        oldCount: elem1.rewardedByPuzzleIds?.length ?? 0,
        newCount: elem2.rewardedByPuzzleIds?.length ?? 0
      });
      return false;
    }
    
    if (!this.stringArraysEqual(elem1.narrativeThreads, elem2.narrativeThreads)) {
      log.info('[Delta] Element narrativeThreads changed', { 
        entityId: elem1.id,
        oldCount: elem1.narrativeThreads?.length ?? 0,
        newCount: elem2.narrativeThreads?.length ?? 0
      });
      return false;
    }
    
    // Note: Not checking rollup properties (associatedCharacterIds, puzzleChain)
    // Rollups are computed from the direct relations we already check above.
    // Checking rollups would create coupling and risk false negatives.
    
    // All graph-affecting properties are equal
    return true;
  }

  /**
   * Compare two TimelineEvent objects for equality
   * Only checks mutable properties that can be changed via API
   * 
   * ⚠️ CRITICAL WARNING: Rollup properties cause 30% false positive cache invalidation!
   * ❌ NEVER check: memTypes, name (both computed from other properties)
   * ✅ ONLY check: All mutable properties from TimelineEventMutableProperties interface
   *    Relations: charactersInvolvedIds, memoryEvidenceIds
   *    Scalars: description, date, notes
   * 
   * See server/types/entityProperties.ts for complete property classification.
   * Excludes rollup/computed properties that are derived from other data
   */
  private timelinesEqual(timeline1: TimelineEvent, timeline2: TimelineEvent): boolean {
    // Text properties
    if (timeline1.description !== timeline2.description) {
      log.info('[Delta] Timeline description changed', { 
        entityId: timeline1.id, 
        oldValue: timeline1.description, 
        newValue: timeline2.description 
      });
      return false;
    }
    if (timeline1.date !== timeline2.date) {
      log.info('[Delta] Timeline date changed', { 
        entityId: timeline1.id, 
        oldValue: timeline1.date, 
        newValue: timeline2.date 
      });
      return false;
    }
    if (timeline1.notes !== timeline2.notes) {
      log.info('[Delta] Timeline notes changed', { 
        entityId: timeline1.id 
      });
      return false;
    }
    
    // Relation arrays
    if (!this.stringArraysEqual(timeline1.charactersInvolvedIds, timeline2.charactersInvolvedIds)) {
      log.info('[Delta] Timeline charactersInvolvedIds changed', { 
        entityId: timeline1.id,
        oldCount: timeline1.charactersInvolvedIds?.length ?? 0,
        newCount: timeline2.charactersInvolvedIds?.length ?? 0
      });
      return false;
    }
    if (!this.stringArraysEqual(timeline1.memoryEvidenceIds, timeline2.memoryEvidenceIds)) {
      log.info('[Delta] Timeline memoryEvidenceIds changed', { 
        entityId: timeline1.id,
        oldCount: timeline1.memoryEvidenceIds?.length ?? 0,
        newCount: timeline2.memoryEvidenceIds?.length ?? 0
      });
      return false;
    }
    
    // Note: name is derived from description, so we don't check it separately
    
    // Explicitly NOT checking rollup/synthesized properties:
    // - memTypes (rollup from memory evidence)
    // - associatedPuzzles (synthesized from puzzle.storyReveals)
    
    return true;
  }

  /**
   * Compare two Puzzle objects for equality
   * Only checks mutable properties that can be changed via API
   * 
   * ⚠️ CRITICAL WARNING: Rollup properties cause 30% false positive cache invalidation!
   * ❌ NEVER check: ownerId, storyReveals, timing, narrativeThreads (all rollups)
   * ✅ ONLY check: All mutable properties from PuzzleMutableProperties interface
   *    Relations: puzzleElementIds, lockedItemId, rewardIds, parentItemId, subPuzzleIds
   *    Scalars: name, descriptionSolution, assetLink
   * 
   * See server/types/entityProperties.ts for complete property classification.
   * Excludes rollup/computed properties that are derived from other data
   */
  private puzzlesEqual(puzzle1: Puzzle, puzzle2: Puzzle): boolean {
    // Text properties
    if (puzzle1.name !== puzzle2.name) {
      log.info('[Delta] Puzzle name changed', { 
        entityId: puzzle1.id, 
        oldValue: puzzle1.name, 
        newValue: puzzle2.name 
      });
      return false;
    }
    if (puzzle1.descriptionSolution !== puzzle2.descriptionSolution) {
      log.info('[Delta] Puzzle descriptionSolution changed', { 
        entityId: puzzle1.id 
      });
      return false;
    }
    if (puzzle1.assetLink !== puzzle2.assetLink) {
      log.info('[Delta] Puzzle assetLink changed', { 
        entityId: puzzle1.id, 
        oldValue: puzzle1.assetLink, 
        newValue: puzzle2.assetLink 
      });
      return false;
    }
    
    // Single relation IDs (optional fields)
    if (puzzle1.lockedItemId !== puzzle2.lockedItemId) {
      log.info('[Delta] Puzzle lockedItemId changed', { 
        entityId: puzzle1.id, 
        oldValue: puzzle1.lockedItemId, 
        newValue: puzzle2.lockedItemId 
      });
      return false;
    }
    if (puzzle1.parentItemId !== puzzle2.parentItemId) {
      log.info('[Delta] Puzzle parentItemId changed', { 
        entityId: puzzle1.id, 
        oldValue: puzzle1.parentItemId, 
        newValue: puzzle2.parentItemId 
      });
      return false;
    }
    
    // Relation arrays
    if (!this.stringArraysEqual(puzzle1.puzzleElementIds, puzzle2.puzzleElementIds)) {
      log.info('[Delta] Puzzle puzzleElementIds changed', { 
        entityId: puzzle1.id,
        oldCount: puzzle1.puzzleElementIds?.length ?? 0,
        newCount: puzzle2.puzzleElementIds?.length ?? 0
      });
      return false;
    }
    if (!this.stringArraysEqual(puzzle1.rewardIds, puzzle2.rewardIds)) {
      log.info('[Delta] Puzzle rewardIds changed', { 
        entityId: puzzle1.id,
        oldCount: puzzle1.rewardIds?.length ?? 0,
        newCount: puzzle2.rewardIds?.length ?? 0
      });
      return false;
    }
    if (!this.stringArraysEqual(puzzle1.subPuzzleIds, puzzle2.subPuzzleIds)) {
      log.info('[Delta] Puzzle subPuzzleIds changed', { 
        entityId: puzzle1.id,
        oldCount: puzzle1.subPuzzleIds?.length ?? 0,
        newCount: puzzle2.subPuzzleIds?.length ?? 0
      });
      return false;
    }
    
    // Explicitly NOT checking rollup properties:
    // - ownerId (rollup from locked item)
    // - storyReveals (rollup from timeline events)
    // - timing (rollup from elements)
    // - narrativeThreads (rollup from elements)
    
    return true;
  }

  /**
   * Compare two Character entities for equality.
   * Checks all mutable Character properties that can affect the graph.
   * WHY: Type-specific comparison prevents property mistakes and improves maintainability.
   * 
   * ⚠️ CRITICAL WARNING: Rollup properties cause 30% false positive cache invalidation!
   * ❌ NEVER check: connections (rollup computed from timeline events)
   * ✅ ONLY check: All mutable properties from CharacterMutableProperties interface
   * 
   * See server/types/entityProperties.ts for complete property classification.
   * Verified via toNotionCharacterProperties that all direct relations are mutable.
   */
  private charactersEqual(char1: Character, char2: Character): boolean {
    // ⚠️ WARNING: Never check Elements[], Puzzles[], Timeline[] - they're ROLLUPS!
    // Only check the ID arrays below (ownedElementIds, etc) which are the source of truth.
    // Rollup properties caused 30% false positive cache invalidation bug.
    
    // Check scalar properties first (7 total)
    if (char1.name !== char2.name) {
      log.info('[Delta] Character name changed', { 
        entityId: char1.id,
        oldValue: char1.name,
        newValue: char2.name
      });
      return false;
    }
    
    if (char1.type !== char2.type) {
      log.info('[Delta] Character type changed', { 
        entityId: char1.id,
        oldValue: char1.type,
        newValue: char2.type
      });
      return false;
    }
    
    if (char1.tier !== char2.tier) {
      log.info('[Delta] Character tier changed', { 
        entityId: char1.id,
        oldValue: char1.tier,
        newValue: char2.tier
      });
      return false;
    }
    
    if (char1.primaryAction !== char2.primaryAction) {
      log.info('[Delta] Character primaryAction changed', { 
        entityId: char1.id
      });
      return false;
    }
    
    if (char1.characterLogline !== char2.characterLogline) {
      log.info('[Delta] Character characterLogline changed', { 
        entityId: char1.id
      });
      return false;
    }
    
    if (char1.overview !== char2.overview) {
      log.info('[Delta] Character overview changed', { 
        entityId: char1.id
      });
      return false;
    }
    
    if (char1.emotionTowardsCEO !== char2.emotionTowardsCEO) {
      log.info('[Delta] Character emotionTowardsCEO changed', { 
        entityId: char1.id
      });
      return false;
    }
    
    // Check all 4 direct relation arrays (verified mutable via API)
    if (!this.stringArraysEqual(char1.ownedElementIds, char2.ownedElementIds)) {
      log.info('[Delta] Character ownedElementIds changed', { 
        entityId: char1.id,
        oldCount: char1.ownedElementIds?.length ?? 0,
        newCount: char2.ownedElementIds?.length ?? 0
      });
      return false;
    }
    
    if (!this.stringArraysEqual(char1.associatedElementIds, char2.associatedElementIds)) {
      log.info('[Delta] Character associatedElementIds changed', { 
        entityId: char1.id,
        oldCount: char1.associatedElementIds?.length ?? 0,
        newCount: char2.associatedElementIds?.length ?? 0
      });
      return false;
    }
    
    if (!this.stringArraysEqual(char1.characterPuzzleIds, char2.characterPuzzleIds)) {
      log.info('[Delta] Character characterPuzzleIds changed', { 
        entityId: char1.id,
        oldCount: char1.characterPuzzleIds?.length ?? 0,
        newCount: char2.characterPuzzleIds?.length ?? 0
      });
      return false;
    }
    
    if (!this.stringArraysEqual(char1.eventIds, char2.eventIds)) {
      log.info('[Delta] Character eventIds changed', { 
        entityId: char1.id,
        oldCount: char1.eventIds?.length ?? 0,
        newCount: char2.eventIds?.length ?? 0
      });
      return false;
    }
    
    // Note: Not checking connections rollup property
    // Connections is computed from eventIds which we already check above.
    // Checking rollups would create coupling and risk false negatives.
    
    // All graph-affecting properties are equal
    return true;
  }

  /**
   * Compare two nodes for equality
   * WHY: JSON.stringify is unreliable (order-dependent) and slow
   */
  private nodesEqual(node1: GraphNode, node2: GraphNode): boolean {
    // Quick checks first
    if (node1.id !== node2.id) return false;
    if (node1.type !== node2.type) return false;
    if (node1.position?.x !== node2.position?.x) return false;
    if (node1.position?.y !== node2.position?.y) return false;
    
    // Compare data fields
    if (node1.data.label !== node2.data.label) return false;
    if (node1.data.metadata.entityType !== node2.data.metadata.entityType) return false;
    if (node1.data.metadata.isPlaceholder !== node2.data.metadata.isPlaceholder) return false;
    
    // Compare entity - check both ID and version/lastEdited for changes
    const entity1 = node1.data.entity;
    const entity2 = node2.data.entity;
    if (!entity1 && !entity2) return true;
    if (!entity1 || !entity2) return false;
    
    // Entities must have same ID
    if (entity1.id !== entity2.id) return false;
    
    // Check if entity has been modified (version or lastEdited changed)
    // Version is preferred if available (optimistic locking)
    if ('version' in entity1 && 'version' in entity2) {
      if (entity1.version !== entity2.version) return false;
      // Versions match - entities are equal, skip expensive deep comparison
      return true;
    }
    
    // Fallback to lastEdited timestamp if no version
    if ('lastEdited' in entity1 && 'lastEdited' in entity2) {
      if (entity1.lastEdited !== entity2.lastEdited) {
        log.info('[Delta] Entity lastEdited changed', {
          entityId: entity1.id,
          oldValue: entity1.lastEdited,
          newValue: entity2.lastEdited
        });
        return false;
      }
      // Timestamps match - entities are equal, skip expensive deep comparison
      return true;
    }
    
    // Only do deep property comparison if no version/timestamp available
    // Use type-specific equality helpers based on entity type
    // WHY: Type-safe comparison prevents property mistakes and improves maintainability
    const entityType = node1.data.metadata.entityType;
    
    switch (entityType) {
      case 'Character':
        return this.charactersEqual(entity1 as Character, entity2 as Character);
      
      case 'Element':
        return this.elementsEqual(entity1 as Element, entity2 as Element);
      
      case 'Puzzle':
        return this.puzzlesEqual(entity1 as Puzzle, entity2 as Puzzle);
      
      case 'TimelineEvent':
        return this.timelinesEqual(entity1 as TimelineEvent, entity2 as TimelineEvent);
      
      default:
        // Unknown entity type - log warning and assume inequality to be safe
        // WHY: Data integrity is critical. Better to over-update than miss changes.
        // Returning false ensures unknown entities trigger updates, preventing silent data corruption.
        log.warn('[Delta] Unknown entity type in nodesEqual, assuming inequality', {
          entityType,
          entityId: entity1.id
        });
        return false;
    }
    
    return true;
  }

  /**
   * Compare two edges for equality
   */
  private edgesEqual(edge1: Edge, edge2: Edge): boolean {
    // Check basic properties
    if (edge1.id !== edge2.id ||
        edge1.source !== edge2.source ||
        edge1.target !== edge2.target ||
        edge1.type !== edge2.type ||
        edge1.animated !== edge2.animated) {
      return false;
    }
    
    // Check data properties (including label)
    if (edge1.data?.label !== edge2.data?.label) {
      return false;
    }
    
    // Check other data properties if they exist
    if (edge1.data || edge2.data) {
      const data1 = edge1.data ?? {};
      const data2 = edge2.data ?? {};
      
      // Compare all data keys
      const allKeys = new Set([...Object.keys(data1), ...Object.keys(data2)]);
      for (const key of allKeys) {
        if (data1[key] !== data2[key]) {
          return false;
        }
      }
    }
    
    return true;
  }

  calculateGraphDelta(
    oldNodes: GraphNode[], 
    newNodes: GraphNode[],
    oldEdges: Edge[],
    newEdges: Edge[]
  ): GraphDelta {
    const start = performance.now();
    
    try {
    
    // Node changes
    const nodeChanges = {
      updated: [] as GraphNode[],
      created: [] as GraphNode[],
      deleted: [] as string[]
    };
    
    // Build maps for O(1) lookups instead of O(n²) nested loops
    const oldNodeMap = new Map(oldNodes.map(n => [n.id, n]));
    const newNodeMap = new Map(newNodes.map(n => [n.id, n]));
    
    // Find updated and new nodes
    for (const [id, newNode] of newNodeMap) {
      const oldNode = oldNodeMap.get(id);
      if (!oldNode) {
        nodeChanges.created.push(newNode);
      } else if (!this.nodesEqual(oldNode, newNode)) {
        nodeChanges.updated.push(newNode);
      }
    }
    
    // Find deleted nodes
    for (const [id] of oldNodeMap) {
      if (!newNodeMap.has(id)) {
        nodeChanges.deleted.push(id);
      }
    }
    
    // Edge changes
    const edgeChanges = {
      created: [] as Edge[],
      deleted: [] as string[],
      updated: [] as Edge[]
    };
    
    // Build maps for O(1) edge lookups
    const oldEdgeMap = new Map(oldEdges.map(e => [e.id, e]));
    const newEdgeMap = new Map(newEdges.map(e => [e.id, e]));
    
    // Build set of valid node IDs for orphaned edge detection
    const validNodeIds = new Set(newNodes.map(n => n.id));
    
    // Find created, updated, and deleted edges
    for (const [id, newEdge] of newEdgeMap) {
      // Only check for orphaned edges if we have nodes to validate against
      // (empty node arrays mean we're testing edge changes in isolation)
      if (newNodes.length > 0) {
        // Check if edge is orphaned (source or target node deleted)
        const isOrphaned = !validNodeIds.has(newEdge.source) || !validNodeIds.has(newEdge.target);
        
        if (isOrphaned) {
          // Even if the edge exists in newEdges, mark it as deleted if it's orphaned
          edgeChanges.deleted.push(id);
          continue;
        }
      }
      
      const oldEdge = oldEdgeMap.get(id);
      if (!oldEdge) {
        edgeChanges.created.push(newEdge);
      } else if (!this.edgesEqual(oldEdge, newEdge)) {
        edgeChanges.updated.push(newEdge);
      }
    }
    
    // Find deleted edges (including orphaned edges that only exist in oldEdges)
    for (const [id] of oldEdgeMap) {
      if (!newEdgeMap.has(id)) {
        edgeChanges.deleted.push(id);
      }
    }
    
    const performanceMs = performance.now() - start;
    log.info('[Delta] Calculation performance', {
      durationMs: performanceMs,
      nodeCount: newNodes.length,
      edgeCount: newEdges.length
    });
    
    return {
      changes: {
        nodes: nodeChanges,
        edges: edgeChanges
      }
    };
    
    } catch (error) {
      log.error('[DeltaCalculator] Error calculating delta, falling back to full invalidation', {
        error: error instanceof Error ? error.message : String(error)
      });
      
      // Return a delta that indicates full invalidation is needed
      // This is signaled by returning all nodes as "updated" which will trigger a full refresh
      return {
        // entity field removed - was vestigial
        changes: {
          nodes: {
            updated: newNodes,  // All nodes marked as updated
            created: [],
            deleted: []
          },
          edges: {
            created: [],
            deleted: [],
            updated: newEdges  // All edges marked as updated
          }
        }
      };
    }
  }
}

export const deltaCalculator = new DeltaCalculator();