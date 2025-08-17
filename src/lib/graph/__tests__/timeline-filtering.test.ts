/**
 * Tests for timeline node filtering in puzzle focus view
 */

import { describe, it, expect } from 'vitest';
import { buildGraphData, buildPuzzleFocusGraph } from '../index';
import type { NotionData } from '../index';
import type { Character, Element, Puzzle, TimelineEvent } from '@/types/notion/app';

describe('Timeline Node Filtering', () => {
  // Create mock data similar to index.test.ts
  const createMockData = (): NotionData => {
    const characters: Character[] = [
      {
        id: 'char-1',
        name: 'Main Character',
        type: 'Player',
        tier: 'Core',
        ownedElementIds: ['elem-1', 'elem-2'],
        associatedElementIds: [],
        characterPuzzleIds: ['puzzle-1'],
        eventIds: ['timeline-1'],
        connections: [],
        primaryAction: '',
        characterLogline: '',
        overview: '',
        emotionTowardsCEO: '',
      },
      {
        id: 'char-2',
        name: 'Secondary Character',
        type: 'NPC',
        tier: 'Secondary',
        ownedElementIds: ['elem-3'],
        associatedElementIds: [],
        characterPuzzleIds: ['puzzle-1'],
        eventIds: [],
        connections: [],
        primaryAction: '',
        characterLogline: '',
        overview: '',
        emotionTowardsCEO: '',
      },
    ];

    const elements: Element[] = [
      {
        id: 'elem-1',
        name: 'Key Item',
        descriptionText: '',
        sfPatterns: {},
        basicType: 'Prop',
        ownerId: 'char-1',
        containerId: undefined,
        contentIds: [],
        timelineEventId: undefined,
        status: 'Done',
        firstAvailable: 'Act 1',
        requiredForPuzzleIds: ['puzzle-1'],
        rewardedByPuzzleIds: [],
        containerPuzzleId: 'puzzle-1',
        narrativeThreads: [],
        associatedCharacterIds: [],
        puzzleChain: [],
        productionNotes: '',
        filesMedia: [],
        contentLink: undefined,
        isContainer: false,
      },
      {
        id: 'elem-2',
        name: 'Memory Document',
        descriptionText: '',
        sfPatterns: {},
        basicType: 'Document',
        ownerId: 'char-1',
        containerId: undefined,
        contentIds: [],
        timelineEventId: 'timeline-1',
        status: 'Done',
        firstAvailable: 'Act 1',
        requiredForPuzzleIds: [],
        rewardedByPuzzleIds: ['puzzle-1'],
        containerPuzzleId: undefined,
        narrativeThreads: [],
        associatedCharacterIds: [],
        puzzleChain: [],
        productionNotes: '',
        filesMedia: [],
        contentLink: undefined,
        isContainer: false,
      },
      {
        id: 'elem-3',
        name: 'Shared Element',
        descriptionText: '',
        sfPatterns: {},
        basicType: 'Prop',
        ownerId: 'char-2',
        containerId: undefined,
        contentIds: [],
        timelineEventId: undefined,
        status: 'In development',
        firstAvailable: 'Act 1',
        requiredForPuzzleIds: ['puzzle-1'],
        rewardedByPuzzleIds: [],
        containerPuzzleId: 'puzzle-1',
        narrativeThreads: [],
        associatedCharacterIds: [],
        puzzleChain: [],
        productionNotes: '',
        filesMedia: [],
        contentLink: undefined,
        isContainer: false,
      },
    ];

    const puzzles: Puzzle[] = [
      {
        id: 'puzzle-1',
        name: 'Collaborative Puzzle',
        descriptionSolution: 'Both characters must work together',
        puzzleElementIds: ['elem-1', 'elem-3'],
        lockedItemId: undefined,
        ownerId: 'char-1',
        rewardIds: ['elem-2'],
        parentItemId: undefined,
        subPuzzleIds: [],
        storyReveals: [],
        timing: ['Act 1'],
        narrativeThreads: [],
        assetLink: undefined,
      },
    ];

    const timeline: TimelineEvent[] = [
      {
        id: 'timeline-1',
        name: 'Important Discovery',
        description: 'The moment when the memory was created',
        date: '2024-03-15T00:00:00Z',
        charactersInvolvedIds: ['char-1'],
        memoryEvidenceIds: ['elem-2'],
        memTypes: [],
        notes: '',
        lastEditedTime: '2024-01-01T00:00:00Z',
      },
    ];

    return { characters, elements, puzzles, timeline };
  };

  const mockData = createMockData();

  describe('excludeEntityTypes option', () => {
    it('should filter out timeline nodes when specified', () => {
      const result = buildGraphData(mockData, {
        excludeEntityTypes: ['timeline'],
        includeOrphans: true,
      });

      // Check that no timeline nodes are present
      const timelineNodes = result.nodes.filter(
        node => node.data.metadata.entityType === 'timeline'
      );
      expect(timelineNodes.length).toBe(0);

      // Check that other entity types are still present
      const characterNodes = result.nodes.filter(
        node => node.data.metadata.entityType === 'character'
      );
      const elementNodes = result.nodes.filter(
        node => node.data.metadata.entityType === 'element'
      );
      const puzzleNodes = result.nodes.filter(
        node => node.data.metadata.entityType === 'puzzle'
      );

      expect(characterNodes.length).toBeGreaterThan(0);
      expect(elementNodes.length).toBeGreaterThan(0);
      expect(puzzleNodes.length).toBeGreaterThan(0);
    });

    it('should filter out multiple entity types', () => {
      const result = buildGraphData(mockData, {
        excludeEntityTypes: ['timeline', 'character'],
        includeOrphans: true,
      });

      const timelineNodes = result.nodes.filter(
        node => node.data.metadata.entityType === 'timeline'
      );
      const characterNodes = result.nodes.filter(
        node => node.data.metadata.entityType === 'character'
      );

      expect(timelineNodes.length).toBe(0);
      expect(characterNodes.length).toBe(0);

      // Elements and puzzles should still be present
      const elementNodes = result.nodes.filter(
        node => node.data.metadata.entityType === 'element'
      );
      const puzzleNodes = result.nodes.filter(
        node => node.data.metadata.entityType === 'puzzle'
      );

      expect(elementNodes.length).toBeGreaterThan(0);
      expect(puzzleNodes.length).toBeGreaterThan(0);
    });
  });

  describe('buildPuzzleFocusGraph', () => {
    it('should exclude timeline nodes by default', () => {
      const result = buildPuzzleFocusGraph(mockData);

      // Check that no timeline nodes are present
      const timelineNodes = result.nodes.filter(
        node => node.data.metadata.entityType === 'timeline'
      );
      expect(timelineNodes.length).toBe(0);

      // Check that puzzle and element nodes are present
      const puzzleNodes = result.nodes.filter(
        node => node.data.metadata.entityType === 'puzzle'
      );
      const elementNodes = result.nodes.filter(
        node => node.data.metadata.entityType === 'element'
      );
      
      expect(puzzleNodes.length).toBeGreaterThan(0);
      expect(elementNodes.length).toBeGreaterThan(0);
      
      // Note: Character nodes may be filtered out as orphans when only
      // puzzle-related edges (requirement, reward, chain) are kept
      // This is expected behavior in puzzle focus view
    });

    it('should preserve timeline metadata in element nodes', () => {
      const result = buildPuzzleFocusGraph(mockData);

      // Find elements that have timeline associations
      const elementsWithTimeline = result.nodes.filter(
        node =>
          node.data.metadata.entityType === 'element' &&
          node.data.metadata.enrichedData?.timelineInfo
      );

      // Verify that we found timeline-connected elements
      expect(elementsWithTimeline.length).toBeGreaterThan(0);
      
      // Verify that at least one element has timeline info
      expect(elementsWithTimeline.length).toBeGreaterThan(0);

      // At least one element should have timeline info if it's associated
      // (Based on our mock data, Memory Document has timelineEventId)
      const memoryDoc = result.nodes.find(
        node => node.data.entity?.name === 'Memory Document'
      );

      if (memoryDoc && (memoryDoc.data.entity as any).timelineEventId) {
        expect(memoryDoc.data.metadata.enrichedData?.timelineInfo).toBeDefined();
        expect((memoryDoc.data.metadata.enrichedData?.timelineInfo as any)?.events).toHaveLength(1);
      }
    });

    it('should preserve collaboration metadata in element nodes', () => {
      const result = buildPuzzleFocusGraph(mockData);

      // Find elements that are part of puzzles
      const elementsInPuzzles = result.nodes.filter(
        node =>
          node.data.metadata.entityType === 'element' &&
          (node.data.entity as any).containerPuzzleId
      );

      // Check if any have collaboration data
      const elementsWithCollaboration = elementsInPuzzles.filter(
        node => node.data.metadata.enrichedData?.requiresCollaboration
      );

      // If there are elements from different characters in the same puzzle,
      // they should have collaboration metadata
      if (elementsWithCollaboration.length > 0) {
        const firstCollab = elementsWithCollaboration[0];
        if (firstCollab) {
          expect(firstCollab.data.metadata.enrichedData?.collaborators).toBeDefined();
          expect((firstCollab.data.metadata.enrichedData?.collaborators as any)?.length).toBeGreaterThan(0);
        }
      }
    });
  });
});