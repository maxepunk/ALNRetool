#!/usr/bin/env tsx

/**
 * Test script to verify filter functionality
 * Tests character ownership, puzzle completion status, and last edited filters
 */

import { 
  applyCharacterFilters, 
  applyPuzzleFilters, 
  applyContentFilters,
  derivePuzzleStatus 
} from '../src/lib/filters/index.js';
import type { Character, Element, Puzzle } from '../src/types/notion/app.js';
import type { CharacterFilters, PuzzleFilters, ContentFilters } from '../src/stores/filterStore.js';

// Mock data
const mockElements: Element[] = [
  {
    id: 'elem1',
    name: 'Test Element 1',
    ownerId: 'char1',
    status: 'complete',
    lastEdited: new Date().toISOString(),
    descriptionText: '',
    sfPatterns: {},
    basicType: 'Prop',
    contentIds: [],
    narrativeThreads: [],
    associatedCharacterIds: [],
    puzzleChain: [],
    productionNotes: '',
    filesMedia: [],
    isContainer: false,
    firstAvailable: 'Act 1',
    requiredForPuzzleIds: ['puzzle1'],
    rewardedByPuzzleIds: []
  },
  {
    id: 'elem2',
    name: 'Test Element 2',
    ownerId: 'char2',
    status: 'in-progress',
    lastEdited: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago
    descriptionText: '',
    sfPatterns: {},
    basicType: 'Document',
    contentIds: [],
    narrativeThreads: [],
    associatedCharacterIds: [],
    puzzleChain: [],
    productionNotes: '',
    filesMedia: [],
    isContainer: false,
    firstAvailable: 'Act 2',
    requiredForPuzzleIds: ['puzzle1'],
    rewardedByPuzzleIds: []
  }
];

const mockCharacters: Character[] = [
  {
    id: 'char1',
    name: 'Character 1',
    type: 'Player',
    tier: 'Core',
    ownedElementIds: ['elem1'],
    associatedElementIds: [],
    characterPuzzleIds: [],
    eventIds: [],
    connections: [],
    primaryAction: '',
    characterLogline: '',
    overview: '',
    emotionTowardsCEO: '',
    lastEdited: new Date().toISOString()
  },
  {
    id: 'char2',
    name: 'Character 2',
    type: 'NPC',
    tier: 'Secondary',
    ownedElementIds: ['elem2'],
    associatedElementIds: ['elem1'],
    characterPuzzleIds: ['puzzle1'],
    eventIds: [],
    connections: [],
    primaryAction: '',
    characterLogline: '',
    overview: '',
    emotionTowardsCEO: '',
    lastEdited: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString() // 35 days ago
  }
];

const mockPuzzles: Puzzle[] = [
  {
    id: 'puzzle1',
    name: 'Test Puzzle',
    descriptionSolution: '',
    puzzleElementIds: ['elem1', 'elem2'],
    rewardIds: [],
    subPuzzleIds: [],
    storyReveals: [],
    timing: ['Act 1'],
    narrativeThreads: [],
    lastEdited: new Date().toISOString()
  }
];

// Test character ownership filter
console.log('Testing Character Ownership Filter...');
const charFilters: CharacterFilters = {
  selectedTiers: new Set(),
  ownershipStatus: new Set(['Owned']),
  characterType: 'all',
  selectedCharacterId: null,
  highlightShared: false
};

const filteredChars = applyCharacterFilters(mockCharacters, charFilters, mockElements);
console.log('Characters with "Owned" status:', filteredChars.map(c => c.name));
console.log('Expected: Character 1, Character 2');
console.log('Pass:', filteredChars.length === 2 ? '✓' : '✗');

// Test with "Accessible" filter
charFilters.ownershipStatus = new Set(['Accessible']);
const accessibleChars = applyCharacterFilters(mockCharacters, charFilters, mockElements);
console.log('\nCharacters with "Accessible" status:', accessibleChars.map(c => c.name));
console.log('Expected: Character 2');
console.log('Pass:', accessibleChars.length === 1 && accessibleChars[0].name === 'Character 2' ? '✓' : '✗');

// Test puzzle completion status
console.log('\n\nTesting Puzzle Completion Status...');
const puzzleStatus = derivePuzzleStatus(mockPuzzles[0], mockElements);
console.log('Puzzle status:', puzzleStatus);
console.log('Expected: in-progress (one element complete, one in-progress)');
console.log('Pass:', puzzleStatus === 'in-progress' ? '✓' : '✗');

// Test puzzle filter with completion status
const puzzleFilters: PuzzleFilters = {
  selectedActs: new Set(),
  selectedPuzzleId: null,
  completionStatus: 'incomplete'
};

const filteredPuzzles = applyPuzzleFilters(mockPuzzles, puzzleFilters, mockElements);
console.log('\nPuzzles with "incomplete" status:', filteredPuzzles.map(p => p.name));
console.log('Expected: Test Puzzle');
console.log('Pass:', filteredPuzzles.length === 1 ? '✓' : '✗');

// Test last edited filter
console.log('\n\nTesting Last Edited Filter...');
const contentFilters: ContentFilters = {
  contentStatus: new Set(),
  hasIssues: null,
  lastEditedRange: 'week'
};

const filteredElements = applyContentFilters(mockElements, contentFilters);
console.log('Elements edited in last week:', filteredElements.map(e => e.name));
console.log('Expected: Test Element 1');
console.log('Pass:', filteredElements.length === 1 && filteredElements[0].name === 'Test Element 1' ? '✓' : '✗');

// Test with month range
contentFilters.lastEditedRange = 'month';
const monthFilteredElements = applyContentFilters(mockElements, contentFilters);
console.log('\nElements edited in last month:', monthFilteredElements.map(e => e.name));
console.log('Expected: Test Element 1, Test Element 2');
console.log('Pass:', monthFilteredElements.length === 2 ? '✓' : '✗');

console.log('\n\n=== All filter tests complete ===');