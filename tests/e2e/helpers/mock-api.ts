import type { Page, Route } from '@playwright/test';
import type { 
  Character, 
  Element, 
  Puzzle, 
  TimelineEvent,
  CharacterType,
  CharacterTier,
  ElementBasicType,
  ElementStatus,
  Act
} from '../../../src/types/notion/app';
import type { GraphData, GraphNode, GraphEdge } from '../../../src/lib/graph/types';

/**
 * Mock API helper for Playwright e2e tests
 * 
 * This helper sets up API route mocking using Playwright's built-in route handlers.
 * It provides the same test data that MSW handlers use, enabling consistent testing
 * between unit tests and e2e tests.
 */

// Type-safe mock database structure
interface MockDb {
  characters: (Character & { version: number })[];
  elements: (Element & { version: number })[];
  puzzles: (Puzzle & { version: number })[];
  timeline: (TimelineEvent & { version: number })[];
}

// Deterministic ID counters for reliable testing
let idCounters = {
  character: 100,
  element: 100,
  puzzle: 100,
  timeline: 100
};

/**
 * Initial database state with test fixtures
 * Aligns with test scenarios in edge-mutations.spec.ts
 */
const getInitialDbState = (): MockDb => ({
  characters: [
    {
      id: 'character-test-1',
      name: 'Test Character 1',
      type: 'NPC' as CharacterType,
      tier: 'Secondary' as CharacterTier,
      ownedElementIds: ['element-test-1'],
      associatedElementIds: [],
      characterPuzzleIds: [],
      eventIds: [],
      connections: [],
      primaryAction: 'Test action',
      characterLogline: 'Test logline',
      overview: 'Test overview',
      emotionTowardsCEO: 'Neutral',
      version: 1
    },
    {
      id: 'character-test-2',
      name: 'Test Character 2',
      type: 'Player' as CharacterType,
      tier: 'Core' as CharacterTier,
      ownedElementIds: [],
      associatedElementIds: [],
      characterPuzzleIds: [],
      eventIds: [],
      connections: [],
      primaryAction: 'Test action 2',
      characterLogline: 'Test logline 2',
      overview: 'Test overview 2',
      emotionTowardsCEO: 'Positive',
      version: 1
    }
  ],
  elements: [
    {
      id: 'element-test-1',
      name: 'Test Element',
      descriptionText: 'Test description',
      sfPatterns: {},
      basicType: 'Prop' as ElementBasicType,
      ownerId: 'character-test-1',
      containerId: undefined,
      contentIds: [],
      timelineEventId: undefined,
      status: 'Done' as ElementStatus,
      firstAvailable: 'Act 1' as Act,
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
      version: 1
    }
  ],
  puzzles: [
    {
      id: 'puzzle-test-1',
      name: 'Test Puzzle',
      descriptionText: 'Test puzzle description',
      solution: 'Test solution',
      descriptionSolution: 'Test solution description',
      hints: [],
      associatedCharacterIds: [],
      subPuzzleIds: [],
      requiredElementIds: [],
      rewardedElementIds: [],
      sourceEventIds: [],
      containerElementId: undefined,
      timing: [],
      narrativeThreads: [],
      version: 1
    }
  ],
  timeline: []
});

// Stateful database instance
let db: MockDb = getInitialDbState();

/**
 * Reset the mock database to initial state
 */
export function resetMockDb() {
  db = getInitialDbState();
  idCounters = {
    character: 100,
    element: 100,
    puzzle: 100,
    timeline: 100
  };
}

/**
 * Generate graph data from the current database state
 */
function generateGraphData(): GraphData {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // Add character nodes
  db.characters.forEach(char => {
    nodes.push({
      id: char.id,
      type: 'character',
      position: { x: 0, y: 0 }, // Layout will be calculated client-side
      data: {
        label: char.name,
        metadata: {},
        entity: char
      }
    });

    // Add edges for owned elements
    char.ownedElementIds?.forEach(elementId => {
      edges.push({
        id: `e::${char.id}::ownedElementIds::${elementId}`,
        source: char.id,
        target: elementId,
        type: 'ownership',
        data: {
          relationshipType: 'ownership' as const,
          metadata: { field: 'ownedElementIds' }
        }
      });
    });
  });

  // Add element nodes
  db.elements.forEach(elem => {
    nodes.push({
      id: elem.id,
      type: 'element',
      position: { x: 0, y: 0 },
      data: {
        label: elem.name,
        metadata: {},
        entity: elem
      }
    });
  });

  // Add puzzle nodes
  db.puzzles.forEach(puzzle => {
    nodes.push({
      id: puzzle.id,
      type: 'puzzle',
      position: { x: 0, y: 0 },
      data: {
        label: puzzle.name,
        metadata: {},
        entity: puzzle
      }
    });

    // Add edges for character relationships
    puzzle.associatedCharacterIds?.forEach(charId => {
      edges.push({
        id: `e::${puzzle.id}::associatedCharacterIds::${charId}`,
        source: puzzle.id,
        target: charId,
        type: 'association',
        data: {
          relationshipType: 'association' as const,
          metadata: { field: 'associatedCharacterIds' }
        }
      });
    });
  });

  return { nodes, edges };
}

/**
 * Set up API mocking for a Playwright page
 * @param page - The Playwright page to set up mocking for
 */
export async function setupApiMocking(page: Page) {
  // Reset database state for each test
  resetMockDb();

  // Mock graph data endpoint
  await page.route('**/api/graph/data', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: generateGraphData()
      })
    });
  });

  // Mock character GET endpoints
  await page.route('**/api/notion/characters', async (route: Route) => {
    const url = new URL(route.request().url());
    const id = url.pathname.split('/').pop();

    if (id && id !== 'characters') {
      // Single character request
      const character = db.characters.find(c => c.id === id);
      if (character) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: character })
        });
      } else {
        await route.fulfill({ status: 404 });
      }
    } else {
      // List characters
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: db.characters,
          nextCursor: null,
          hasMore: false
        })
      });
    }
  });

  // Mock character POST (create) endpoint
  await page.route('**/api/notion/characters', async (route: Route) => {
    if (route.request().method() === 'POST') {
      const body = await route.request().postDataJSON();
      const newCharacter: Character & { version: number } = {
        id: `character-${idCounters.character++}`,
        ...body,
        version: 1
      };
      db.characters.push(newCharacter);

      // Update puzzle relationships if creating from puzzle
      if (body.puzzleId) {
        const puzzle = db.puzzles.find(p => p.id === body.puzzleId);
        if (puzzle) {
          puzzle.associatedCharacterIds = [...(puzzle.associatedCharacterIds || []), newCharacter.id];
        }
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: newCharacter })
      });
    } else {
      await route.continue();
    }
  });

  // Mock puzzle GET/PUT endpoints
  await page.route('**/api/notion/puzzles/**', async (route: Route) => {
    const id = route.request().url().split('/').pop();
    const puzzle = db.puzzles.find(p => p.id === id);

    if (route.request().method() === 'GET') {
      if (puzzle) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: puzzle })
        });
      } else {
        await route.fulfill({ status: 404 });
      }
    } else if (route.request().method() === 'PUT') {
      if (puzzle) {
        const updates = await route.request().postDataJSON();
        Object.assign(puzzle, updates);
        puzzle.version++;

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: puzzle })
        });
      } else {
        await route.fulfill({ status: 404 });
      }
    } else {
      await route.continue();
    }
  });

  // Mock element PUT endpoints
  await page.route('**/api/notion/elements/**', async (route: Route) => {
    const id = route.request().url().split('/').pop();
    const element = db.elements.find(e => e.id === id);

    if (route.request().method() === 'PUT' && element) {
      const updates = await route.request().postDataJSON();
      
      // Handle owner change
      if (updates.ownerId && updates.ownerId !== element.ownerId) {
        // Remove from old owner
        const oldOwner = db.characters.find(c => c.id === element.ownerId);
        if (oldOwner) {
          oldOwner.ownedElementIds = oldOwner.ownedElementIds.filter(eId => eId !== element.id);
        }
        
        // Add to new owner
        const newOwner = db.characters.find(c => c.id === updates.ownerId);
        if (newOwner) {
          newOwner.ownedElementIds = [...(newOwner.ownedElementIds || []), element.id];
        }
      }

      Object.assign(element, updates);
      element.version++;

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: element })
      });
    } else {
      await route.continue();
    }
  });

  // Mock DELETE endpoints for characters
  await page.route('**/api/notion/characters/**', async (route: Route) => {
    if (route.request().method() === 'DELETE') {
      const id = route.request().url().split('/').pop();
      const index = db.characters.findIndex(c => c.id === id);
      
      if (index !== -1) {
        db.characters.splice(index, 1);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      } else {
        await route.fulfill({ status: 404 });
      }
    } else {
      await route.continue();
    }
  });
}

/**
 * Helper to simulate server errors for specific endpoints
 */
export async function simulateServerError(page: Page, endpoint: string, status = 500) {
  await page.route(`**${endpoint}`, async (route: Route) => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Server error' })
    });
  });
}

/**
 * Helper to simulate network delays
 */
export async function simulateNetworkDelay(page: Page, delayMs: number) {
  await page.route('**/api/**', async (route: Route) => {
    await new Promise(resolve => setTimeout(resolve, delayMs));
    await route.continue();
  });
}