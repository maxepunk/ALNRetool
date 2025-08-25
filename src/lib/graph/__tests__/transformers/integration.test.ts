/**
 * Integration tests for graph transformers with real Notion data
 * Tests the complete transformation pipeline from API to React Flow nodes
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { buildGraphData, createGraphContext, type GraphContext } from '../../index';
import type { NotionData } from '../../index';

// Mock data that matches actual Notion schema from PRD
const mockNotionData: NotionData = {
  characters: [
    {
      id: 'char-1',
      name: 'Sofia Martinez',
      type: 'Player',
      tier: 'Core',
      ownedElementIds: ['elem-1', 'elem-2'],
      associatedElementIds: ['elem-3'],
      characterPuzzleIds: ['puzzle-1'],
      eventIds: ['timeline-1'],
      connections: [],
      primaryAction: 'Investigate the CEO death',
      characterLogline: 'Ambitious startup founder with a secret',
      overview: 'Full character background...',
      emotionTowardsCEO: 'Suspicious of Victoria, protective of Kai',
    },
  ],
  elements: [
    {
      id: 'elem-1',
      name: "Sofia's Phone",
      descriptionText: 'SF_RFID: [SOFIA-001]\nSF_ValueRating: [4]\nSF_MemoryType: [Personal]\nSF_Group: [Tech Evidence (x3)]',
      sfPatterns: { rfid: 'SOFIA-001', valueRating: 4, memoryType: 'Personal', group: { name: 'Tech Evidence', multiplier: '3' } },
      basicType: 'Memory Token (Audio)',
      ownerId: 'char-1',
      containerId: undefined,
      contentIds: [],
      timelineEventId: 'timeline-1',
      status: 'Done',
      firstAvailable: 'Act 1',
      requiredForPuzzleIds: ['puzzle-1'],
      rewardedByPuzzleIds: [],
      containerPuzzleId: undefined,
      narrativeThreads: ['Murder Mystery', 'Tech Conspiracy'],
      associatedCharacterIds: ['char-1'],
      puzzleChain: [],
      productionNotes: 'RFID tag embedded',
      filesMedia: [],
      contentLink: undefined,
      isContainer: false,
    },
    {
      id: 'elem-2',
      name: 'Locked Safe',
      descriptionText: 'Contains important evidence',
      sfPatterns: { rfid: '', valueRating: 1, memoryType: 'Personal', group: { name: '', multiplier: '1' } },
      basicType: 'Prop',
      ownerId: 'char-1',
      containerId: undefined,
      contentIds: ['elem-3'],
      timelineEventId: undefined,
      status: 'In development',
      firstAvailable: 'Act 2',
      requiredForPuzzleIds: [],
      rewardedByPuzzleIds: ['puzzle-1'],
      containerPuzzleId: 'puzzle-1',
      narrativeThreads: [],
      associatedCharacterIds: [],
      puzzleChain: ['puzzle-1'],
      productionNotes: '',
      filesMedia: [],
      contentLink: undefined,
      isContainer: true,
    },
    {
      id: 'elem-3',
      name: 'Contract Document',
      descriptionText: '',
      sfPatterns: { rfid: '', valueRating: 1, memoryType: 'Personal', group: { name: '', multiplier: '1' } },
      basicType: 'Document',
      ownerId: undefined,
      containerId: 'elem-2',
      contentIds: [],
      timelineEventId: 'timeline-2',
      status: 'Idea/Placeholder',
      firstAvailable: null,
      requiredForPuzzleIds: [],
      rewardedByPuzzleIds: [],
      containerPuzzleId: undefined,
      narrativeThreads: ['Business Deal'],
      associatedCharacterIds: ['char-1'],
      puzzleChain: [],
      productionNotes: '',
      filesMedia: [],
      contentLink: undefined,
      isContainer: false,
    },
  ],
  puzzles: [
    {
      id: 'puzzle-1',
      name: 'Safe Combination Puzzle',
      descriptionSolution: 'Players must find the combination from multiple clues',
      puzzleElementIds: ['elem-1'],
      lockedItemId: 'elem-2',
      ownerId: 'char-1',
      rewardIds: ['elem-2'],
      parentItemId: undefined,
      subPuzzleIds: [],
      storyReveals: ['timeline-2'],
      timing: ['Act 1', 'Act 2'],
      narrativeThreads: ['Murder Mystery'],
      assetLink: undefined,
    },
  ],
  timeline: [
    {
      id: 'timeline-1',
      name: 'CEO announces layoffs',
      description: 'CEO announces layoffs',
      date: '2023-06-15',
      charactersInvolvedIds: ['char-1'],
      memoryEvidenceIds: ['elem-1'],
      memTypes: ['Memory Token (Audio)'],
      notes: 'Key backstory event',
      lastEditedTime: '2024-01-01T00:00:00Z',
    },
    {
      id: 'timeline-2',
      name: 'Secret contract signed',
      description: 'Secret contract signed',
      date: '2023-07-01',
      charactersInvolvedIds: ['char-1'],
      memoryEvidenceIds: ['elem-3'],
      memTypes: ['Document'],
      notes: '',
      lastEditedTime: '2024-01-01T00:00:00Z',
    },
  ],
};

describe('Graph Transformer Integration', () => {
  let context: GraphContext;

  beforeEach(() => {
    context = createGraphContext();
  });

  afterEach(() => {
    if (context) {
      context.dispose();
      context = null as any;
    }
  });

  describe('Full transformation pipeline', () => {
    it('should transform complete Notion data to React Flow graph', () => {
      const graph = buildGraphData(mockNotionData, {}, context);

      // Verify nodes were created
      expect(graph.nodes).toHaveLength(7); // 1 char + 3 elements + 1 puzzle + 2 timeline
      
      // Verify node types
      const nodeTypes = graph.nodes.map(n => n.data.metadata.entityType);
      expect(nodeTypes).toContain('character');
      expect(nodeTypes).toContain('element');
      expect(nodeTypes).toContain('puzzle');
      expect(nodeTypes).toContain('timeline');
    });

    it('should preserve SF_ patterns in element nodes', () => {
      const graph = buildGraphData(mockNotionData, {}, context);
      
      const sofiaPhone = graph.nodes.find(n => n.id === 'elem-1');
      expect(sofiaPhone).toBeDefined();
      expect(sofiaPhone?.data.metadata.sfPatterns).toBeDefined();
      expect(sofiaPhone?.data.metadata.sfPatterns?.rfid).toBe('SOFIA-001');
      expect(sofiaPhone?.data.metadata.sfPatterns?.valueRating).toBe(4);
      expect(sofiaPhone?.data.metadata.sfPatterns?.memoryType).toBe('Personal');
    });

    it('should create correct relationships as edges', () => {
      const graph = buildGraphData(mockNotionData, {}, context);
      
      // Check ownership edge
      const ownershipEdge = graph.edges.find(e => 
        e.source === 'char-1' && 
        e.target === 'elem-1' && 
        e.data?.relationshipType === 'ownership'
      );
      expect(ownershipEdge).toBeDefined();
      
      // Check requirement edge (puzzle -> element as per the actual implementation)
      const requirementEdge = graph.edges.find(e => 
        e.source === 'puzzle-1' && 
        e.target === 'elem-1' && 
        e.data?.relationshipType === 'requirement'
      );
      expect(requirementEdge).toBeDefined();
    });

    it('should apply correct status colors to elements', () => {
      const graph = buildGraphData(mockNotionData, {}, context);
      
      const doneElement = graph.nodes.find(n => n.id === 'elem-1');
      expect(doneElement?.data.metadata.visualHints?.color).toBe('#10b981'); // Green for Done
      
      const inDevElement = graph.nodes.find(n => n.id === 'elem-2');
      expect(inDevElement?.data.metadata.visualHints?.color).toBe('#eab308'); // Yellow for In development
      
      const ideaElement = graph.nodes.find(n => n.id === 'elem-3');
      expect(ideaElement?.data.metadata.visualHints?.color).toBe('#9ca3af'); // Gray for Idea/Placeholder
    });

    it('should identify container elements correctly', () => {
      const graph = buildGraphData(mockNotionData, {}, context);
      
      const lockedSafe = graph.nodes.find(n => n.id === 'elem-2');
      expect(lockedSafe?.data.metadata.visualHints?.size).toBe('medium'); // Containers are medium size
      
      const regularElement = graph.nodes.find(n => n.id === 'elem-3');
      expect(regularElement?.data.metadata.visualHints?.size).toBe('small'); // Regular elements are small
    });

    it('should handle view-specific filtering', () => {
      // Puzzle Focus View - only puzzle-related nodes and edges
      const puzzleGraph = buildGraphData(mockNotionData, {
        viewType: 'puzzle-focus',
        nodeId: 'puzzle-1',
        maxDepth: 2
      }, context);
      
      // Should have puzzle and related elements
      const nodeTypes = puzzleGraph.nodes.map(n => n.type);
      expect(nodeTypes).toContain('puzzle');
      expect(nodeTypes).toContain('element');
      
      // Character Journey View - character-focused
      const characterGraph = buildGraphData(mockNotionData, {
        viewType: 'character-journey',
        nodeId: 'char-1'
      }, context);
      
      // Should have character and related entities
      const charNodeTypes = characterGraph.nodes.map(n => n.type);
      expect(charNodeTypes).toContain('character');
      expect(charNodeTypes).toContain('element');
      expect(charNodeTypes).toContain('timeline');
    });



    it('should generate correct labels for nodes', () => {
      const graph = buildGraphData(mockNotionData, {}, context);
      
      const characterNode = graph.nodes.find(n => n.id === 'char-1');
      expect(characterNode?.data.label).toBe('Sofia Martinez');
      
      const memoryTokenNode = graph.nodes.find(n => n.id === 'elem-1');
      expect(memoryTokenNode?.data.label).toBe("[MT] Sofia's Phone");
      
      const puzzleNode = graph.nodes.find(n => n.id === 'puzzle-1');
      expect(puzzleNode?.data.label).toBe('Safe Combination Puzzle (Act 1)'); // Includes timing
    });

    it('should track transformation metrics', () => {
      const graph = buildGraphData(mockNotionData, {}, context);
      
      expect(graph.metadata).toBeDefined();
      expect(graph.metadata?.metrics).toBeDefined();
      
      if (graph.metadata?.metrics) {
        expect(graph.metadata.metrics.nodeCount).toBe(7);
        expect(graph.metadata.metrics.edgeCount).toBe(6);
        expect(graph.metadata.metrics.duration).toBeGreaterThan(0);
        // layoutMetrics is optional and added by LayoutOrchestrator if layout is applied
        // Not all graph builds apply layout immediately
      }
    });
  });
});