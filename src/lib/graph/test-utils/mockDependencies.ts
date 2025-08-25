/**
 * Mock Dependencies for Strategy Testing
 * 
 * Provides mock implementations of all strategy dependencies
 * for isolated unit testing.
 */

import { vi } from 'vitest';
import type { StrategyDependencies } from '../core/ViewStrategy.interface';
import type { EntityTransformer } from '../modules/EntityTransformer';
import type { EdgeResolver } from '../modules/EdgeResolver';
import type { GraphFilterer } from '../modules/GraphFilterer';
import type { TraversalEngine } from '../modules/TraversalEngine';
import type { LayoutOrchestrator } from '../modules/LayoutOrchestrator';
import type { Character, Element, Puzzle, TimelineEvent } from '@/types/notion/app';
import type { NotionData } from '../types';
import { createMockNode, createMockEdge } from './mockFactories';

/**
 * Create mock EntityTransformer
 */
export function createMockEntityTransformer(): EntityTransformer {
  return {
    transformCharacters: vi.fn((characters: Character[]) => 
      characters.map((char: Character) => createMockNode({
        id: char.id,
        type: 'character',
        data: {
          label: char.name,
          type: 'character',
          id: char.id,
          entity: char,
          metadata: { entityType: 'character' }
        }
      }))
    ),
    transformElements: vi.fn((elements: Element[]) =>
      elements.map((elem: Element) => createMockNode({
        id: elem.id,
        type: 'element',
        data: {
          label: elem.name,
          type: 'element',
          id: elem.id,
          entity: elem,
          metadata: { entityType: 'element' }
        }
      }))
    ),
    transformPuzzles: vi.fn((puzzles: Puzzle[]) =>
      puzzles.map((puzzle: Puzzle) => createMockNode({
        id: puzzle.id,
        type: 'puzzle',
        data: {
          label: puzzle.name,
          type: 'puzzle',
          id: puzzle.id,
          entity: puzzle,
          metadata: { entityType: 'puzzle' }
        }
      }))
    ),
    transformTimeline: vi.fn((events: TimelineEvent[]) =>
      events.map((event: TimelineEvent) => createMockNode({
        id: event.id,
        type: 'timeline',
        data: {
          label: event.name,
          type: 'timeline',
          id: event.id,
          entity: event,
          metadata: { entityType: 'timeline' }
        }
      }))
    ),
    transformAll: vi.fn((data: NotionData) => {
      const nodes = [];
      if (data.characters) {
        nodes.push(...data.characters.map((c: Character) => createMockNode({
          id: c.id,
          type: 'character',
          data: { label: c.name, type: 'character', id: c.id, entity: c, metadata: { entityType: 'character' } }
        })));
      }
      if (data.elements) {
        nodes.push(...data.elements.map((e: Element) => createMockNode({
          id: e.id,
          type: 'element',
          data: { label: e.name, type: 'element', id: e.id, entity: e, metadata: { entityType: 'element' } }
        })));
      }
      if (data.puzzles) {
        nodes.push(...data.puzzles.map((p: Puzzle) => createMockNode({
          id: p.id,
          type: 'puzzle',
          data: { label: p.name, type: 'puzzle', id: p.id, entity: p, metadata: { entityType: 'puzzle' } }
        })));
      }
      if (data.timeline) {
        nodes.push(...data.timeline.map((t: TimelineEvent) => createMockNode({
          id: t.id,
          type: 'timeline',
          data: { label: t.name, type: 'timeline', id: t.id, entity: t, metadata: { entityType: 'timeline' } }
        })));
      }
      return nodes;
    })
  } as EntityTransformer;
}

/**
 * Create mock EdgeResolver
 */
export function createMockEdgeResolver(): EdgeResolver {
  return {
    clearCache: vi.fn(),
    createCharacterEdges: vi.fn((character: Character, charactersArray: Character[], includedNodeIds: Set<string>) => {
      const edges = [];
      if (character.connections) {
        character.connections.forEach((targetId: string) => {
          if (includedNodeIds && includedNodeIds.has && includedNodeIds.has(targetId)) {
            edges.push(createMockEdge({
              id: `${character.id}-${targetId}`,
              source: character.id,
              target: targetId,
              type: 'relation',
              data: { relationshipType: 'relation' as const, weight: 1, label: 'connected' }
            }));
          }
        });
      }
      return edges;
    }),
    createElementEdges: vi.fn((element: Element, includedNodeIds: Set<string>) => {
      const edges = [];
      if (element.ownerId) {
        if (includedNodeIds && includedNodeIds.has && includedNodeIds.has(element.ownerId)) {
          edges.push(createMockEdge({
            id: `${element.id}-${element.ownerId}`,
            source: element.id,
            target: element.ownerId,
            type: 'ownership',
            data: { relationshipType: 'ownership' as const, weight: 1, label: 'owned by' }
          }));
        }
      }
      return edges;
    }),
    createPuzzleEdges: vi.fn((puzzle: Puzzle, includedNodeIds: Set<string>) => {
      const edges = [];
      
      // Sub-puzzle edges
      if (puzzle.subPuzzleIds) {
        puzzle.subPuzzleIds.forEach((subId: string) => {
          if (includedNodeIds && includedNodeIds.has && includedNodeIds.has(subId)) {
            edges.push(createMockEdge({
              id: `${puzzle.id}-${subId}`,
              source: puzzle.id,
              target: subId,
              type: 'hierarchy',
              data: { relationshipType: 'hierarchy' as const, weight: 2, label: 'contains' }
            }));
          }
        });
      }
      
      // Parent puzzle edges (reverse of sub-puzzle)
      if (puzzle.parentItemId) {
        if (includedNodeIds && includedNodeIds.has && includedNodeIds.has(puzzle.parentItemId)) {
          edges.push(createMockEdge({
            id: `${puzzle.parentItemId}-${puzzle.id}`,
            source: puzzle.parentItemId,
            target: puzzle.id,
            type: 'hierarchy',
            data: { relationshipType: 'dependency' as const, weight: 2, label: 'contains' }
          }));
        }
      }
      
      // Reward edges
      if (puzzle.rewardIds) {
        puzzle.rewardIds.forEach((rewardId: string) => {
          if (includedNodeIds && includedNodeIds.has && includedNodeIds.has(rewardId)) {
            edges.push(createMockEdge({
              id: `${puzzle.id}-reward-${rewardId}`,
              source: puzzle.id,
              target: rewardId,
              type: 'reward',
              data: { relationshipType: 'reward' as const, weight: 1, label: 'rewards' }
            }));
          }
        });
      }
      
      return edges;
    }),
    createTimelineEdges: vi.fn((event: TimelineEvent, includedNodeIds: Set<string>) => {
      const edges = [];
      if (event.charactersInvolvedIds) {
        event.charactersInvolvedIds.forEach((charId: string) => {
          if (includedNodeIds && includedNodeIds.has && includedNodeIds.has(charId)) {
            edges.push(createMockEdge({
              id: `${event.id}-${charId}`,
              source: event.id,
              target: charId,
              type: 'participation',
              data: { relationshipType: 'timeline' as const, weight: 1, label: 'involves' }
            }));
          }
        });
      }
      return edges;
    }),
    resolveAllEdges: vi.fn((data: NotionData, includedNodeIds: Set<string>) => []),
    deduplicateEdges: vi.fn((edges: any[]) => edges)
  } as EdgeResolver;
}

/**
 * Create mock GraphFilterer
 */
export function createMockGraphFilterer(): GraphFilterer {
  return {
    filterByDepth: vi.fn((nodeId: string, nodeType: string, data: NotionData, maxDepth: number) => {
      // Simple mock implementation that includes the node and immediate connections
      const included = new Set<string>();
      included.add(nodeId);
      
      // Add some connected nodes based on type
      if (nodeType === 'puzzle' && data.puzzles) {
        const puzzle = data.puzzles.find((p: Puzzle) => p.id === nodeId);
        if (puzzle) {
          puzzle.subPuzzleIds?.forEach((id: string) => included.add(id));
          puzzle.rewardIds?.forEach((id: string) => included.add(id));
          puzzle.puzzleElementIds?.forEach((id: string) => included.add(id));
        }
      }
      
      return included;
    }),
    filterByStatus: vi.fn((nodes: any[], statusFilter: any) => nodes),
    filterByDateRange: vi.fn((nodes: any[], dateRange: any) => nodes),
    filterByCharacterType: vi.fn((nodes: any[], types: any) => nodes),
    applyFilters: vi.fn((nodes: any[], options: any) => nodes)
  } as GraphFilterer;
}

/**
 * Create mock TraversalEngine
 */
export function createMockTraversalEngine(): TraversalEngine {
  return {
    traverse: vi.fn((edges: any[], startId: string, options?: any) => ({
      visitedNodes: new Set<string>([startId]),
      paths: new Map<string, string[]>([[startId, [startId]]]),
      depths: new Map<string, number>([[startId, 0]]),
      order: [startId],
      nodesProcessed: 1
    })),
    findPath: vi.fn((edges: any[], startId: string, endId: string) => null),
    findAllPaths: vi.fn((edges: any[], startId: string, endId: string) => []),
    detectCycles: vi.fn((edges: any[]) => []),
    getConnectedComponents: vi.fn((edges: any[]) => []),
    buildAdjacencyList: vi.fn((edges: any[]) => new Map()),
    clearCache: vi.fn()
  } as unknown as TraversalEngine;
}

/**
 * Create mock LayoutOrchestrator
 */
export function createMockLayoutOrchestrator(): LayoutOrchestrator {
  return {
    layout: vi.fn(async (nodes: any[], edges: any[], options?: any) => {
      // Simple mock layout - just returns nodes with positions
      return {
        nodes: nodes.map((node: any, i: number) => ({
          ...node,
          position: { x: i * 100, y: i * 50 }
        })),
        edges
      };
    }),
    setAlgorithm: vi.fn(),
    getAlgorithm: vi.fn(() => 'dagre'),
    getMetrics: vi.fn(() => ({
      nodeOverlap: 0,
      edgeCrossings: 0,
      aspectRatio: 1,
      edgeLengthVariance: 0,
      nodeDensity: 0.5
    }))
  } as LayoutOrchestrator;
}

/**
 * Create all mock dependencies
 */
export function createMockDependencies(): StrategyDependencies {
  return {
    entityTransformer: createMockEntityTransformer(),
    edgeResolver: createMockEdgeResolver(),
    graphFilterer: createMockGraphFilterer(),
    traversalEngine: createMockTraversalEngine(),
    layoutOrchestrator: createMockLayoutOrchestrator()
  };
}