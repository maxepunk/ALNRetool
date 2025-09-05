/**
 * MSW Handlers for Testing Partial Update Scenarios
 * 
 * These handlers simulate the Notion API's behavior of returning
 * only the properties that were included in the update request.
 */

import { http, HttpResponse } from 'msw';
import type { Character, Element, Puzzle, TimelineEvent } from '@/types/notion/app';

const API_BASE = 'http://localhost:3001/api';

// Store simulated database state
const mockDatabase = {
  characters: new Map<string, Character>(),
  elements: new Map<string, Element>(),
  puzzles: new Map<string, Puzzle>(),
  timeline: new Map<string, TimelineEvent>()
};

// Initialize with test data
mockDatabase.characters.set('char-partial-1', {
  id: 'char-partial-1',
  name: 'Alice',
  entityType: 'character',
  type: 'Player',
  tier: 'Core',
  ownedElementIds: ['elem-1', 'elem-2'],
  associatedElementIds: ['elem-3'],
  characterPuzzleIds: ['puzzle-1'],
  eventIds: ['event-1'],
  connections: [],
  primaryAction: 'Investigating',
  characterLogline: 'The detective',
  overview: 'Main character',
  emotionTowardsCEO: 'Suspicious'
});

mockDatabase.elements.set('elem-partial-1', {
  id: 'elem-partial-1',
  name: 'Key Item',
  entityType: 'element',
  type: 'Physical',
  category: 'Evidence',
  description: 'An important clue',
  ownerId: 'char-1',
  containerId: 'elem-2',
  contentIds: ['elem-3', 'elem-4'],
  timelineEventId: 'timeline-1',
  requiredForPuzzleIds: ['puzzle-1'],
  rewardedByPuzzleIds: ['puzzle-2'],
  containerPuzzleId: 'puzzle-3',
  associatedCharacterIds: ['char-1', 'char-2'],
  puzzleChain: []
});

export const partialUpdateHandlers = [
  // Character partial update
  http.put(`${API_BASE}/notion/characters/:id`, async ({ params, request }) => {
    const id = params.id as string;
    const body = await request.json() as Partial<Character>;
    
    const existing = mockDatabase.characters.get(id);
    if (!existing) {
      return HttpResponse.json(
        { error: 'Character not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Simulate Notion's behavior: only return updated fields
    const partialResponse: Partial<Character> = {
      id,
      entityType: 'character'
    };

    // Only include fields that were in the update request
    Object.keys(body).forEach(key => {
      if (key in body) {
        (partialResponse as any)[key] = (body as any)[key];
      }
    });

    // If relationship fields weren't updated, they won't be in the response
    // This simulates the issue we're fixing
    const response = {
      ...partialResponse,
      delta: {
        type: 'UPDATE' as const,
        entityId: id,
        entityType: 'character',
        changes: body
      }
    };

    // Update the mock database with the merged result
    // (simulating what our server should do)
    mockDatabase.characters.set(id, { ...existing, ...body });

    return HttpResponse.json(response);
  }),

  // Element partial update
  http.put(`${API_BASE}/notion/elements/:id`, async ({ params, request }) => {
    const id = params.id as string;
    const body = await request.json() as Partial<Element>;
    
    const existing = mockDatabase.elements.get(id);
    if (!existing) {
      return HttpResponse.json(
        { error: 'Element not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Simulate partial response
    const partialResponse: Partial<Element> = {
      id,
      entityType: 'element'
    };

    Object.keys(body).forEach(key => {
      if (key in body) {
        (partialResponse as any)[key] = (body as any)[key];
      }
    });

    const response = {
      ...partialResponse,
      delta: {
        type: 'UPDATE' as const,
        entityId: id,
        entityType: 'element',
        changes: body
      }
    };

    mockDatabase.elements.set(id, { ...existing, ...body });

    return HttpResponse.json(response);
  }),

  // Puzzle partial update
  http.put(`${API_BASE}/notion/puzzles/:id`, async ({ params, request }) => {
    const id = params.id as string;
    const body = await request.json() as Partial<Puzzle>;
    
    const existing = mockDatabase.puzzles.get(id);
    if (!existing) {
      // Create a basic puzzle for testing
      const newPuzzle: Puzzle = {
        id,
        name: 'Test Puzzle',
        entityType: 'puzzle',
        act: 'Act1',
        puzzleType: 'Logic',
        puzzleElementIds: [],
        lockedItemId: null,
        ownerId: null,
        rewardIds: [],
        parentItemId: null,
        subPuzzleIds: [],
        storyReveals: [],
        timing: [],
        narrativeThreads: []
      };
      mockDatabase.puzzles.set(id, newPuzzle);
    }

    const partialResponse: Partial<Puzzle> = {
      id,
      entityType: 'puzzle'
    };

    Object.keys(body).forEach(key => {
      if (key in body) {
        (partialResponse as any)[key] = (body as any)[key];
      }
    });

    const response = {
      ...partialResponse,
      delta: {
        type: 'UPDATE' as const,
        entityId: id,
        entityType: 'puzzle',
        changes: body
      }
    };

    const current = mockDatabase.puzzles.get(id)!;
    mockDatabase.puzzles.set(id, { ...current, ...body });

    return HttpResponse.json(response);
  }),

  // Timeline partial update  
  http.put(`${API_BASE}/notion/timeline/:id`, async ({ params, request }) => {
    const id = params.id as string;
    const body = await request.json() as Partial<TimelineEvent>;
    
    const existing = mockDatabase.timeline.get(id);
    if (!existing) {
      const newEvent: TimelineEvent = {
        id,
        description: 'Test Event',
        entityType: 'timeline',
        date: new Date().toISOString(),
        charactersInvolvedIds: [],
        memoryEvidenceIds: [],
        memTypes: [],
        notes: ''
      };
      mockDatabase.timeline.set(id, newEvent);
    }

    const partialResponse: Partial<TimelineEvent> = {
      id,
      entityType: 'timeline'
    };

    Object.keys(body).forEach(key => {
      if (key in body) {
        (partialResponse as any)[key] = (body as any)[key];
      }
    });

    const response = {
      ...partialResponse,
      delta: {
        type: 'UPDATE' as const,
        entityId: id,
        entityType: 'timeline',
        changes: body
      }
    };

    const current = mockDatabase.timeline.get(id)!;
    mockDatabase.timeline.set(id, { ...current, ...body });

    return HttpResponse.json(response);
  }),

  // Handler to get full entity data (simulating what our server should do internally)
  http.get(`${API_BASE}/notion/characters/:id`, ({ params }) => {
    const id = params.id as string;
    const character = mockDatabase.characters.get(id);
    
    if (!character) {
      return HttpResponse.json(
        { error: 'Character not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return HttpResponse.json(character);
  }),

  http.get(`${API_BASE}/notion/elements/:id`, ({ params }) => {
    const id = params.id as string;
    const element = mockDatabase.elements.get(id);
    
    if (!element) {
      return HttpResponse.json(
        { error: 'Element not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return HttpResponse.json(element);
  })
];

// Helper to reset mock database for tests
export function resetPartialUpdateMocks() {
  mockDatabase.characters.clear();
  mockDatabase.elements.clear();
  mockDatabase.puzzles.clear();
  mockDatabase.timeline.clear();
  
  // Re-initialize with test data
  mockDatabase.characters.set('char-partial-1', {
    id: 'char-partial-1',
    name: 'Alice',
    entityType: 'character',
    type: 'Player',
    tier: 'Core',
    ownedElementIds: ['elem-1', 'elem-2'],
    associatedElementIds: ['elem-3'],
    characterPuzzleIds: ['puzzle-1'],
    eventIds: ['event-1'],
    connections: [],
    primaryAction: 'Investigating',
    characterLogline: 'The detective',
    overview: 'Main character',
    emotionTowardsCEO: 'Suspicious'
  });
}