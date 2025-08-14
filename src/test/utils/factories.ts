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
    type: 'Player',
    tier: 'Core',
    ownedElements: [],
    associatedElements: [],
    characterPuzzles: [],
    events: [],
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
    description: 'Test element description',
    basicType: 'Prop',
    owner: null,
    container: null,
    contents: [],
    timelineEvent: null,
    status: 'Idea/Placeholder',
    firstAvailable: null,
    requiredFor: [],
    rewardedBy: [],
    containerPuzzle: null,
    narrativeThreads: [],
    associatedCharacters: [],
    puzzleChain: [],
    notes: '',
    isContainer: false,
    sfPattern: null,
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
    description: 'Test puzzle description',
    elements: [],
    lockedItem: null,
    owner: [],
    rewards: [],
    parentItem: null,
    subPuzzles: [],
    storyReveals: [],
    timing: [],
    narrativeThreads: [],
    assetLink: null,
    ...overrides,
  }
}

/**
 * Create a mock Timeline Event
 */
export function createMockTimelineEvent(overrides?: Partial<TimelineEvent>): TimelineEvent {
  const id = `timeline-${idCounter++}`
  return {
    id,
    description: `Timeline Event ${id}`,
    date: new Date().toISOString(),
    charactersInvolved: [],
    memory: [],
    memType: [],
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
    owner: 'sofia',
  })

  const element2 = createMockElement({
    id: 'safe-contents',
    name: 'Safe Contents',
    basicType: 'Document',
  })

  const puzzle = createMockPuzzle({
    id: 'hidden-safe',
    name: 'Hidden Safe',
    description: 'A combination lock puzzle',
    elements: ['keycard'],
    rewards: ['safe-contents'],
    owner: ['sofia'],
  })

  const timelineEvent = createMockTimelineEvent({
    id: 'ceo-meeting',
    description: 'Secret CEO Meeting',
    charactersInvolved: ['sofia', 'victoria'],
    memory: ['safe-contents'],
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