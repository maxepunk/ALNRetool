/**
 * Test data factories for creating mock Notion entities
 */

import type { Character, Element, Puzzle, TimelineEvent } from '@/types/notion/app'

let idCounter = 1

/**
 * Create a mock Character
 */
export function createMockCharacter(overrides?: Partial<Character>): Character {
  const id = `character-${idCounter++}`
  return {
    id,
    name: `Character ${id}`,
    entityType: 'character',
    type: 'Player',
    tier: 'Core',
    ownedElementIds: [],
    associatedElementIds: [],
    characterPuzzleIds: [],
    eventIds: [],
    connections: [],
    primaryAction: 'Test action',
    characterLogline: 'Test logline',
    overview: 'Test overview',
    emotionTowardsCEO: 'Neutral',
    ...overrides,
  }
}

/**
 * Create a mock Element
 */
export function createMockElement(overrides?: Partial<Element>): Element {
  const id = `element-${idCounter++}`
  return {
    id,
    name: `Element ${id}`,
    entityType: 'element',
    descriptionText: 'Test element description',
    sfPatterns: {}, // Empty object for required field
    basicType: 'Prop',
    ownerId: undefined,
    containerId: undefined,
    contentIds: [],
    timelineEventId: undefined,
    status: 'Idea/Placeholder',
    firstAvailable: null,
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
    ...overrides,
  }
}

/**
 * Create a mock Puzzle
 */
export function createMockPuzzle(overrides?: Partial<Puzzle>): Puzzle {
  const id = `puzzle-${idCounter++}`
  return {
    id,
    name: `Puzzle ${id}`,
    entityType: 'puzzle',
    descriptionSolution: 'Test puzzle description',
    puzzleElementIds: [],
    lockedItemId: undefined,
    ownerId: undefined,
    rewardIds: [],
    parentItemId: undefined,
    subPuzzleIds: [],
    storyReveals: [],
    timing: [],
    narrativeThreads: [],
    assetLink: undefined,
    ...overrides,
  }
}

/**
 * Create a mock Timeline Event
 */
export function createMockTimelineEvent(overrides?: Partial<TimelineEvent>): TimelineEvent {
  const id = `timeline-${idCounter++}`
  const description = `Timeline Event ${id}`
  return {
    id,
    name: description, // name is same as description for consistency
    entityType: 'timeline',
    description,
    date: new Date().toISOString(),
    charactersInvolvedIds: [],
    memoryEvidenceIds: [],
    memTypes: [],
    notes: '',
    lastEditedTime: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Create a connected puzzle scenario for testing
 */
export function createMockPuzzleScenario() {
  const character1 = createMockCharacter({
    id: 'sofia',
    name: 'Sofia',
    tier: 'Core',
  })

  const character2 = createMockCharacter({
    id: 'victoria',
    name: 'Victoria',
    tier: 'Secondary',
  })

  const element1 = createMockElement({
    id: 'keycard',
    name: 'Keycard',
    basicType: 'Prop',
    ownerId: 'sofia',
  })

  const element2 = createMockElement({
    id: 'safe-contents',
    name: 'Safe Contents',
    basicType: 'Document',
  })

  const puzzle = createMockPuzzle({
    id: 'hidden-safe',
    name: 'Hidden Safe',
    descriptionSolution: 'A combination lock puzzle',
    puzzleElementIds: ['keycard'],
    rewardIds: ['safe-contents'],
    ownerId: 'sofia',
  })

  const timelineEvent = createMockTimelineEvent({
    id: 'ceo-meeting',
    name: 'Secret CEO Meeting',
    description: 'Secret CEO Meeting',
    charactersInvolvedIds: ['sofia', 'victoria'],
    memoryEvidenceIds: ['safe-contents'],
  })

  return {
    characters: [character1, character2],
    elements: [element1, element2],
    puzzles: [puzzle],
    timeline: [timelineEvent],
  }
}

/**
 * Reset the ID counter for tests
 */
export function resetIdCounter() {
  idCounter = 1
}