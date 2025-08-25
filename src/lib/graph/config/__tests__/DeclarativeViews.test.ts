/**
 * DeclarativeViews.test.ts
 * 
 * Tests for the declarative view configuration system.
 * Validates that declarative configs produce correct graph output.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ViewBuilder } from '../ViewBuilder';
import { TimelineConfig } from '../views/TimelineConfig';
import { NodeConnectionsConfig } from '../views/NodeConnectionsConfig';
import { CharacterJourneyConfig } from '../views/CharacterJourneyConfig';
import { PuzzleFocusConfig } from '../views/PuzzleFocusConfig';
import { EntityTransformer } from '../../modules/EntityTransformer';
import { EdgeResolver } from '../../modules/EdgeResolver';
import { GraphFilterer } from '../../modules/GraphFilterer';
import { TraversalEngine } from '../../modules/TraversalEngine';
import { LayoutOrchestrator } from '../../modules/LayoutOrchestrator';
import type { NotionData } from '../../types';
import type { StrategyDependencies } from '../../core/ViewStrategy.interface';

// Mock data for testing
const mockData = {
  characters: [
    { id: 'char1', name: 'Hero', relationshipIds: ['char2'], ownedElementIds: ['elem1'] },
    { id: 'char2', name: 'Ally', relationshipIds: ['char1'], ownedElementIds: ['elem2'] }
  ],
  elements: [
    { id: 'elem1', name: 'Sword', ownerId: 'char1' },
    { id: 'elem2', name: 'Shield', ownerId: 'char2' }
  ],
  puzzles: [
    { 
      id: 'puzzle1', 
      name: 'Main Quest', 
      subPuzzleIds: ['puzzle2'],
      puzzleElementIds: ['elem1']
    },
    { 
      id: 'puzzle2', 
      name: 'Sub Quest', 
      puzzleElementIds: ['elem1'],
      subPuzzleIds: []
    }
  ],
  timeline: [
    { 
      id: 'event1', 
      name: 'Battle', 
      date: new Date('2024-01-01'),
      charactersInvolvedIds: ['char1']
    },
    { 
      id: 'event2', 
      name: 'Meeting', 
      date: new Date('2024-01-02'),
      charactersInvolvedIds: ['char1', 'char2']
    }
  ]
} as unknown as NotionData;

describe('Declarative View Configurations', () => {
  let deps: StrategyDependencies;
  let viewBuilder: ViewBuilder;

  beforeEach(() => {
    const traversalEngine = new TraversalEngine();
    deps = {
      entityTransformer: new EntityTransformer(),
      edgeResolver: new EdgeResolver(),
      graphFilterer: new GraphFilterer(traversalEngine),
      traversalEngine: traversalEngine,
      layoutOrchestrator: new LayoutOrchestrator(traversalEngine)
    };
    
    viewBuilder = new ViewBuilder(deps);
  });

  describe('TimelineConfig', () => {
    it('should filter timeline events by date range', () => {
      const variables = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-01')
      };

      const result = viewBuilder.build(TimelineConfig, mockData, variables);

      // Should include event1 and char1 (involved in event1)
      expect(result.nodes).toHaveLength(2);
      const nodeIds = result.nodes.map(n => n.id);
      expect(nodeIds).toContain('event1');
      expect(nodeIds).toContain('char1');
      expect(nodeIds).not.toContain('event2');
      expect(nodeIds).not.toContain('char2');

      // Should have edge from event1 to char1
      expect(result.edges).toHaveLength(1);
      expect(result.edges[0]?.source).toBe('event1');
      expect(result.edges[0]?.target).toBe('char1');
    });

    it('should include all events when no date range specified', () => {
      const result = viewBuilder.build(TimelineConfig, mockData, {});

      // Should include both events and both characters
      expect(result.nodes).toHaveLength(4);
      const nodeIds = result.nodes.map(n => n.id);
      expect(nodeIds).toContain('event1');
      expect(nodeIds).toContain('event2');
      expect(nodeIds).toContain('char1');
      expect(nodeIds).toContain('char2');

      // Should have edges from events to characters
      expect(result.edges).toHaveLength(3);
    });
  });

  describe('NodeConnectionsConfig', () => {
    it('should traverse connected nodes using BFS', () => {
      const variables = {
        nodeId: 'char1',
        nodeType: 'character',
        maxDepth: 2,
        maxNodes: 10
      };

      const result = viewBuilder.build(NodeConnectionsConfig, mockData, variables);

      // Should include at least the starting node and direct connections
      expect(result.nodes.length).toBeGreaterThanOrEqual(2);
      const nodeIds = result.nodes.map(n => n.id);
      expect(nodeIds).toContain('char1'); // Starting node
      expect(nodeIds).toContain('elem1'); // Direct connection (owned element)

      // Should have character relationships
      expect(result.edges.length).toBeGreaterThan(0);
    });
  });

  describe('CharacterJourneyConfig', () => {
    it('should include all entities related to a character', () => {
      const variables = {
        characterId: 'char1'
      };

      const result = viewBuilder.build(CharacterJourneyConfig, mockData, variables);

      // Should include the character and related entities
      const nodeIds = result.nodes.map(n => n.id);
      expect(nodeIds).toContain('char1');
      expect(nodeIds).toContain('elem1'); // owned element
      expect(nodeIds).toContain('event1'); // involved in event
      expect(nodeIds).toContain('event2'); // also involved
      
      // Should include puzzles related to owned elements
      expect(nodeIds).toContain('puzzle1');
      expect(nodeIds).toContain('puzzle2');

      // Should have various edge types
      expect(result.edges.length).toBeGreaterThan(0);
    });
  });

  describe('PuzzleFocusConfig', () => {
    it('should traverse puzzle chains', () => {
      const variables = {
        puzzleId: 'puzzle1',
        maxDepth: 3
      };

      const result = viewBuilder.build(PuzzleFocusConfig, mockData, variables);

      const nodeIds = result.nodes.map(n => n.id);

      // Should include puzzle1, its related entities, and sub-puzzle via traversal
      expect(result.nodes).toHaveLength(6);
      expect(nodeIds).toContain('puzzle1');   // Starting puzzle
      expect(nodeIds).toContain('puzzle2');   // Sub-puzzle  
      expect(nodeIds).toContain('elem1');     // Puzzle element
      expect(nodeIds).toContain('char1');     // Element owner
      expect(nodeIds).toContain('event1');    // Timeline events found through traversal
      expect(nodeIds).toContain('event2');    // Timeline events found through traversal

      // Should have multiple edges from traversal
      expect(result.edges.length).toBeGreaterThan(0);
      expect(result.edges[0]?.source).toBe('puzzle1');
      expect(result.edges[0]?.target).toBe('puzzle2');
    });
  });

  describe('Performance', () => {
    it('should handle large datasets efficiently', () => {
      // Create a larger dataset
      const largeData = {
        characters: Array.from({ length: 100 }, (_, i) => ({
          id: `char${i}`,
          name: `Character ${i}`,
          relationshipIds: [],
          ownedElementIds: []
        })),
        elements: [],
        puzzles: [],
        timeline: Array.from({ length: 100 }, (_, i) => ({
          id: `event${i}`,
          name: `Event ${i}`,
          date: new Date(2024, 0, i + 1),
          charactersInvolvedIds: [`char${i % 100}`]
        }))
      } as unknown as NotionData;

      const start = performance.now();
      const result = viewBuilder.build(TimelineConfig, largeData, {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-10')
      });
      const duration = performance.now() - start;

      // Should complete in reasonable time
      expect(duration).toBeLessThan(100); // 100ms
      
      // Should produce correct output
      expect(result.nodes.length).toBeGreaterThan(0);
      expect(result.nodes.length).toBeLessThanOrEqual(20); // 10 events + 10 characters max
    });
  });
});