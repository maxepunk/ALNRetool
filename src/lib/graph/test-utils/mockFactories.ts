/**
 * Mock Factories for Graph Testing
 * 
 * Provides consistent test data generators for all graph-related tests.
 * Ensures type safety and reduces boilerplate in test files.
 */

import type { 
  Character, 
  Element, 
  Puzzle, 
  TimelineEvent,
  NotionData,
  GraphNode,
  GraphEdge
} from '../types';

/**
 * Create a mock character entity
 */
export function createMockCharacter(overrides?: Partial<Character>): Character {
  return {
    id: 'char-1',
    name: 'Test Character',
    type: 'Player',
    tier: 'Core',
    ownedElementIds: [],
    associatedElementIds: [],
    characterPuzzleIds: [],
    eventIds: [],
    connections: [],
    primaryAction: 'Test action',
    characterLogline: 'Test character logline',
    overview: 'Test overview',
    emotionTowardsCEO: 'Neutral',
    ...overrides
  } satisfies Character;
}

/**
 * Create a mock element entity
 */
export function createMockElement(overrides?: Partial<Element>): Element {
  return {
    id: 'elem-1',
    name: 'Test Element',
    descriptionText: 'A test element',
    sfPatterns: {},
    basicType: 'Document',
    ownerId: undefined,
    containerId: undefined,
    contentIds: [],
    timelineEventId: undefined,
    status: 'Idea/Placeholder',
    firstAvailable: 'Act 1',
    requiredForPuzzleIds: [],
    rewardedByPuzzleIds: [],
    containerPuzzleId: undefined,
    narrativeThreads: [],
    associatedCharacterIds: [],
    puzzleChain: [],
    productionNotes: '',
    filesMedia: [],
    contentLink: undefined,
    isContainer: false,
    ...overrides
  } satisfies Element;
}

/**
 * Create a mock puzzle entity
 */
export function createMockPuzzle(overrides?: Partial<Puzzle>): Puzzle {
  return {
    id: 'puzzle-1',
    name: 'Test Puzzle',
    descriptionSolution: 'A test puzzle solution',
    puzzleElementIds: [],
    lockedItemId: undefined,
    ownerId: undefined,
    rewardIds: [],
    parentItemId: undefined,
    subPuzzleIds: [],
    storyReveals: [],
    timing: ['Act 1'],
    narrativeThreads: [],
    assetLink: undefined,
    ...overrides
  } satisfies Puzzle;
}

/**
 * Create a mock timeline event
 */
export function createMockTimelineEvent(overrides?: Partial<TimelineEvent>): TimelineEvent {
  return {
    id: 'timeline-1',
    name: 'Test Event',
    description: 'A test timeline event',
    lastEdited: new Date().toISOString(),
    date: '2024-01-01',
    charactersInvolvedIds: [],
    memoryEvidenceIds: [],
    memTypes: [],
    notes: '',
    lastEditedTime: new Date().toISOString(),
    ...overrides
  } satisfies TimelineEvent;
}

/**
 * Create mock NotionData with default entities
 */
export function createMockNotionData(overrides?: Partial<NotionData>): NotionData {
  return {
    characters: [
      createMockCharacter({ id: 'char-1', name: 'Alice', connections: ['char-2'] }),
      createMockCharacter({ id: 'char-2', name: 'Bob', connections: ['char-1'] })
    ],
    elements: [
      createMockElement({ id: 'elem-1', name: 'Document A', ownerId: 'char-1' }),
      createMockElement({ id: 'elem-2', name: 'Document B', ownerId: 'char-2' })
    ],
    puzzles: [
      createMockPuzzle({ 
        id: 'puzzle-1', 
        name: 'Main Puzzle',
        subPuzzleIds: ['puzzle-2'],
        rewardIds: ['elem-1'],
        ownerId: 'char-1'
      }),
      createMockPuzzle({ 
        id: 'puzzle-2', 
        name: 'Sub Puzzle',
        parentItemId: 'puzzle-1'
      })
    ],
    timeline: [
      createMockTimelineEvent({ 
        id: 'timeline-1', 
        name: 'Event 1',
        date: '2024-01-01',
        charactersInvolvedIds: ['char-1']
      })
    ],
    ...overrides
  };
}

/**
 * Create a mock graph node
 */
export function createMockNode(overrides?: Partial<GraphNode>): GraphNode {
  return {
    id: 'node-1',
    type: 'character',
    position: { x: 0, y: 0 },
    data: {
      label: 'Test Node',
      metadata: {
        entityType: 'character' as const,
        entityId: 'char-1'
      },
      entity: createMockCharacter()
    },
    ...overrides
  };
}

/**
 * Create a mock graph edge
 */
export function createMockEdge(overrides?: Partial<GraphEdge>): GraphEdge {
  return {
    id: 'edge-1',
    source: 'node-1',
    target: 'node-2',
    type: 'relation',
    data: {
      relationshipType: 'requirement' as const,
      weight: 1,
      label: 'relates to'
    },
    ...overrides
  };
}

/**
 * Create a complex puzzle hierarchy for testing
 */
export function createPuzzleHierarchy(): NotionData {
  return createMockNotionData({
    puzzles: [
      createMockPuzzle({ 
        id: 'puzzle-root',
        name: 'Root Puzzle',
        subPuzzleIds: ['puzzle-a', 'puzzle-b'],
        rewardIds: ['elem-reward-1'],
        puzzleElementIds: ['elem-1', 'elem-2']
      }),
      createMockPuzzle({ 
        id: 'puzzle-a',
        name: 'Puzzle A',
        parentItemId: 'puzzle-root',
        subPuzzleIds: ['puzzle-a1', 'puzzle-a2']
      }),
      createMockPuzzle({ 
        id: 'puzzle-b',
        name: 'Puzzle B',
        parentItemId: 'puzzle-root'
      }),
      createMockPuzzle({ 
        id: 'puzzle-a1',
        name: 'Puzzle A1',
        parentItemId: 'puzzle-a'
      }),
      createMockPuzzle({ 
        id: 'puzzle-a2',
        name: 'Puzzle A2',
        parentItemId: 'puzzle-a'
      })
    ],
    elements: [
      createMockElement({ id: 'elem-1', name: 'Element 1', requiredForPuzzleIds: ['puzzle-root'] }),
      createMockElement({ id: 'elem-2', name: 'Element 2', requiredForPuzzleIds: ['puzzle-root'] }),
      createMockElement({ id: 'elem-reward-1', name: 'Reward 1', rewardedByPuzzleIds: ['puzzle-root'] })
    ]
  });
}

/**
 * Create a character relationship network for testing
 */
export function createCharacterNetwork(): NotionData {
  return createMockNotionData({
    characters: [
      createMockCharacter({ 
        id: 'char-main',
        name: 'Main Character',
        connections: ['char-friend', 'char-rival'],
        characterPuzzleIds: ['puzzle-1'],
        ownedElementIds: ['elem-1']
      }),
      createMockCharacter({ 
        id: 'char-friend',
        name: 'Friend',
        connections: ['char-main', 'char-ally']
      }),
      createMockCharacter({ 
        id: 'char-rival',
        name: 'Rival',
        connections: ['char-main']
      }),
      createMockCharacter({ 
        id: 'char-ally',
        name: 'Ally',
        connections: ['char-friend']
      })
    ]
  });
}