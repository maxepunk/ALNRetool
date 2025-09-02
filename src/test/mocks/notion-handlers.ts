// Complete MSW v2 mock infrastructure for edge mutation testing
import { http, HttpResponse } from 'msw';
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
} from '@/types/notion/app';
import type { GraphData, GraphNode, GraphEdge } from '@/lib/graph/types';

// Type-safe mock database structure
interface MockDb {
  characters: (Character & { version: number })[];
  elements: (Element & { version: number })[];
  puzzles: (Puzzle & { version: number })[];
  timeline: (TimelineEvent & { version: number })[];
}

// Stateful database instance
let db: MockDb;

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
      descriptionSolution: 'Test solution',
      puzzleElementIds: [],
      lockedItemId: undefined,
      ownerId: undefined,
      rewardIds: [],
      parentItemId: undefined,
      subPuzzleIds: [],
      storyReveals: [],
      timing: ['Act 1' as Act],
      narrativeThreads: [],
      assetLink: undefined,
      // Note: characterIds is not a standard Puzzle field but used in tests
      // @ts-ignore - Test field not in type
      version: 1
    }
  ],
  timeline: []
});

/**
 * Reset database to initial state
 * Must be called in beforeEach hooks for test isolation
 */
export const resetDb = () => {
  db = getInitialDbState();
  idCounters = {
    character: 100,
    element: 100,
    puzzle: 100,
    timeline: 100
  };
};

// Initialize on load
resetDb();

/**
 * Generates complete GraphData from current database state
 * Critical for verifying edge mutations after operations
 */
const generateGraphData = (): GraphData => {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // Generate nodes for all entities
  db.characters.forEach(char => {
    nodes.push({
      id: char.id,
      type: 'characterNode',
      position: { x: 0, y: 0 },
      data: {
        label: char.name,
        metadata: {
          entityType: 'character' as any,
          entityId: char.id,
          originalData: char
        },
        entity: char
      }
    });
  });

  db.elements.forEach(elem => {
    nodes.push({
      id: elem.id,
      type: 'elementNode',
      position: { x: 0, y: 0 },
      data: {
        label: elem.name,
        metadata: {
          entityType: 'element' as any,
          entityId: elem.id,
          originalData: elem
        },
        entity: elem
      }
    });
  });

  db.puzzles.forEach(puzzle => {
    nodes.push({
      id: puzzle.id,
      type: 'puzzleNode',
      position: { x: 0, y: 0 },
      data: {
        label: puzzle.name,
        metadata: {
          entityType: 'puzzle' as any,
          entityId: puzzle.id,
          originalData: puzzle
        },
        entity: puzzle
      }
    });
  });

  db.timeline.forEach(event => {
    nodes.push({
      id: event.id,
      type: 'timelineNode',
      position: { x: 0, y: 0 },
      data: {
        label: event.name,
        metadata: {
          entityType: 'timeline' as any,
          entityId: event.id,
          originalData: event
        },
        entity: event
      }
    });
  });

  // Generate edges from relationships
  
  // Character ownership of elements
  db.characters.forEach(char => {
    char.ownedElementIds?.forEach(elemId => {
      edges.push({
        id: `e::${char.id}::ownedElementIds::${elemId}`,
        source: char.id,
        target: elemId,
        data: {
          relationshipType: 'ownership' as any,
          weight: 0.9
        }
      });
    });

    // Character puzzle relationships
    char.characterPuzzleIds?.forEach(puzzleId => {
      edges.push({
        id: `e::${char.id}::characterPuzzleIds::${puzzleId}`,
        source: char.id,
        target: puzzleId,
        data: {
          relationshipType: 'puzzle' as any,
          weight: 0.8
        }
      });
    });
  });

  // Puzzle relationships (DO NOT generate character edges here - already done above)
  db.puzzles.forEach(puzzle => {
    // Puzzle element requirements
    puzzle.puzzleElementIds?.forEach(elemId => {
      edges.push({
        id: `e::${puzzle.id}::puzzleElementIds::${elemId}`,
        source: puzzle.id,
        target: elemId,
        data: {
          relationshipType: 'requirement' as any,
          weight: 0.7
        }
      });
    });

    // Puzzle rewards
    puzzle.rewardIds?.forEach(rewardId => {
      edges.push({
        id: `e::${puzzle.id}::rewardIds::${rewardId}`,
        source: puzzle.id,
        target: rewardId,
        data: {
          relationshipType: 'reward' as any,
          weight: 0.6
        }
      });
    });
  });

  // Element relationships
  db.elements.forEach(elem => {
    // Element container relationships
    if (elem.containerId) {
      edges.push({
        id: `e::${elem.containerId}::contains::${elem.id}`,
        source: elem.containerId,
        target: elem.id,
        data: {
          relationshipType: 'container' as any,
          weight: 0.8
        }
      });
    }

    // Element timeline connections
    if (elem.timelineEventId) {
      edges.push({
        id: `e::${elem.id}::timeline::${elem.timelineEventId}`,
        source: elem.id,
        target: elem.timelineEventId,
        data: {
          relationshipType: 'timeline' as any,
          weight: 0.5
        }
      });
    }
  });

  // Timeline event relationships
  db.timeline.forEach(event => {
    event.charactersInvolvedIds?.forEach(charId => {
      edges.push({
        id: `e::${event.id}::characters::${charId}`,
        source: event.id,
        target: charId,
        data: {
          relationshipType: 'timeline' as any,
          weight: 0.6
        }
      });
    });

    event.memoryEvidenceIds?.forEach(elemId => {
      edges.push({
        id: `e::${event.id}::evidence::${elemId}`,
        source: event.id,
        target: elemId,
        data: {
          relationshipType: 'timeline' as any,
          weight: 0.5
        }
      });
    });
  });

  return {
    nodes,
    edges,
    metadata: {
      metrics: {
        startTime: Date.now(),
        endTime: Date.now(),
        duration: 0,
        nodeCount: nodes.length,
        edgeCount: edges.length
      },
      viewType: 'full-network' as any,
      timestamp: new Date().toISOString()
    }
  };
};

/**
 * Update bidirectional relationships when entities are modified
 * Handles both additions AND removals of relationships
 */
const updateRelationships = (
  entityType: 'character' | 'element' | 'puzzle' | 'timeline',
  entityId: string,
  body: any,
  oldEntity?: any
) => {
  // Handle character puzzle relationships (bidirectional)
  if (entityType === 'character' && body.characterPuzzleIds !== undefined) {
    const oldPuzzleIds = oldEntity?.characterPuzzleIds ?? [];
    const newPuzzleIds = body.characterPuzzleIds ?? [];

    // Add new relationships
    newPuzzleIds.forEach((puzzleId: string) => {
      if (!oldPuzzleIds.includes(puzzleId)) {
        const puzzle = db.puzzles.find(p => p.id === puzzleId);
        if (puzzle) {
          (puzzle as any).characterIds = [...((puzzle as any).characterIds ?? []), entityId];
        }
      }
    });

    // Remove old relationships
    oldPuzzleIds.forEach((puzzleId: string) => {
      if (!newPuzzleIds.includes(puzzleId)) {
        const puzzle = db.puzzles.find(p => p.id === puzzleId);
        if (puzzle) {
          (puzzle as any).characterIds = ((puzzle as any).characterIds ?? []).filter((cId: string) => cId !== entityId);
        }
      }
    });
  }

  // Handle element ownership changes (bidirectional)
  if (entityType === 'element' && body.ownerId !== undefined) {
    const oldOwnerId = oldEntity?.ownerId;
    const newOwnerId = body.ownerId;

    // Remove from old owner
    if (oldOwnerId && oldOwnerId !== newOwnerId) {
      const oldOwner = db.characters.find(c => c.id === oldOwnerId);
      if (oldOwner) {
        oldOwner.ownedElementIds = oldOwner.ownedElementIds.filter(id => id !== entityId);
      }
    }

    // Add to new owner
    if (newOwnerId && newOwnerId !== oldOwnerId) {
      const newOwner = db.characters.find(c => c.id === newOwnerId);
      if (newOwner && !newOwner.ownedElementIds.includes(entityId)) {
        newOwner.ownedElementIds.push(entityId);
      }
    }
  }

  // Handle character owned elements (reverse relationship)
  if (entityType === 'character' && body.ownedElementIds !== undefined) {
    const oldElementIds = oldEntity?.ownedElementIds ?? [];
    const newElementIds = body.ownedElementIds ?? [];

    // Update element ownership
    oldElementIds.forEach((elemId: string) => {
      if (!newElementIds.includes(elemId)) {
        const elem = db.elements.find(e => e.id === elemId);
        if (elem) elem.ownerId = undefined;
      }
    });

    newElementIds.forEach((elemId: string) => {
      if (!oldElementIds.includes(elemId)) {
        const elem = db.elements.find(e => e.id === elemId);
        if (elem) elem.ownerId = entityId;
      }
    });
  }

  // Handle puzzle-character relationships (initiated from puzzle)
  if (entityType === 'puzzle' && (body as any).characterIds !== undefined) {
    const oldCharIds = (oldEntity as any)?.characterIds ?? [];
    const newCharIds = (body as any).characterIds ?? [];

    // Add puzzle to new characters
    newCharIds.forEach((charId: string) => {
      if (!oldCharIds.includes(charId)) {
        const char = db.characters.find(c => c.id === charId);
        if (char && !char.characterPuzzleIds.includes(entityId)) {
          char.characterPuzzleIds = [...char.characterPuzzleIds, entityId];
        }
      }
    });

    // Remove puzzle from old characters
    oldCharIds.forEach((charId: string) => {
      if (!newCharIds.includes(charId)) {
        const char = db.characters.find(c => c.id === charId);
        if (char) {
          char.characterPuzzleIds = char.characterPuzzleIds.filter(pId => pId !== entityId);
        }
      }
    });
  }

  // Handle timeline-character relationships (initiated from timeline)
  if (entityType === 'timeline' && body.charactersInvolvedIds !== undefined) {
    const oldCharIds = oldEntity?.charactersInvolvedIds ?? [];
    const newCharIds = body.charactersInvolvedIds ?? [];

    // Add event to new characters
    newCharIds.forEach((charId: string) => {
      if (!oldCharIds.includes(charId)) {
        const char = db.characters.find(c => c.id === charId);
        if (char && !char.eventIds.includes(entityId)) {
          char.eventIds = [...char.eventIds, entityId];
        }
      }
    });

    // Remove event from old characters
    oldCharIds.forEach((charId: string) => {
      if (!newCharIds.includes(charId)) {
        const char = db.characters.find(c => c.id === charId);
        if (char) {
          char.eventIds = char.eventIds.filter(eId => eId !== entityId);
        }
      }
    });
  }

  // Handle character-timeline relationships (initiated from character)
  if (entityType === 'character' && body.eventIds !== undefined) {
    const oldEventIds = oldEntity?.eventIds ?? [];
    const newEventIds = body.eventIds ?? [];

    // Add character to new timeline events
    newEventIds.forEach((eventId: string) => {
      if (!oldEventIds.includes(eventId)) {
        const event = db.timeline.find(t => t.id === eventId);
        if (event && !event.charactersInvolvedIds.includes(entityId)) {
          event.charactersInvolvedIds = [...event.charactersInvolvedIds, entityId];
        }
      }
    });

    // Remove character from old timeline events
    oldEventIds.forEach((eventId: string) => {
      if (!newEventIds.includes(eventId)) {
        const event = db.timeline.find(t => t.id === eventId);
        if (event) {
          event.charactersInvolvedIds = event.charactersInvolvedIds.filter(cId => cId !== entityId);
        }
      }
    });
  }
};

// MSW Handlers
export const notionHandlers = [
  // ===== GRAPH DATA ENDPOINT =====
  http.get('*/api/graph/data', () => {
    return HttpResponse.json(generateGraphData());
  }),

  // ===== CHARACTER ENDPOINTS =====
  http.get('*/api/notion/characters', () => {
    return HttpResponse.json({
      data: db.characters,
      hasMore: false,
      nextCursor: null
    });
  }),

  http.post('*/api/notion/characters', async ({ request }) => {
    const body = await request.json() as Partial<Character>;
    const newId = `char-${idCounters.character++}`;
    
    const newCharacter: Character & { version: number } = {
      // Set defaults first, then override with body values
      id: newId,
      name: body.name || 'New Character',
      lastEdited: new Date().toISOString(),
      type: (body.type || 'NPC') as CharacterType,
      tier: (body.tier || 'Tertiary') as CharacterTier,
      ownedElementIds: body.ownedElementIds || [],
      associatedElementIds: body.associatedElementIds || [],
      characterPuzzleIds: body.characterPuzzleIds || [],
      eventIds: body.eventIds || [],
      connections: body.connections || [],
      primaryAction: body.primaryAction || '',
      characterLogline: body.characterLogline || '',
      overview: body.overview || '',
      emotionTowardsCEO: body.emotionTowardsCEO || '',
      version: 1
    };
    
    db.characters.push(newCharacter);
    updateRelationships('character', newId, body);
    
    return HttpResponse.json(newCharacter, { status: 201 });
  }),

  http.put('*/api/notion/characters/:id', async ({ params, request }) => {
    const { id } = params as { id: string };
    const body = await request.json() as Partial<Character>;
    const charIndex = db.characters.findIndex(c => c.id === id);

    if (charIndex === -1) {
      return HttpResponse.json({ error: 'Character not found' }, { status: 404 });
    }

    // Version control check
    const currentVersion = (db.characters[charIndex] as any).version ?? 1;
    const clientVersion = request.headers.get('If-Match');
    if (clientVersion && parseInt(clientVersion) !== currentVersion) {
      return HttpResponse.json({ error: 'Version mismatch' }, { status: 409 });
    }

    const oldCharacter = { ...db.characters[charIndex] };
    const current = db.characters[charIndex]!;
    
    // Merge updates with current, preserving required fields
    const updatedCharacter: Character & { version: number } = {
      ...current,
      ...body,
      id: id, // Always preserve ID
      version: currentVersion + 1
    };
    
    // Ensure required fields are never undefined
    if (!updatedCharacter.name) updatedCharacter.name = current.name;
    if (!updatedCharacter.type) updatedCharacter.type = current.type;
    if (!updatedCharacter.tier) updatedCharacter.tier = current.tier;
    
    db.characters[charIndex] = updatedCharacter;

    updateRelationships('character', id, body, oldCharacter);
    return HttpResponse.json(db.characters[charIndex]);
  }),

  http.delete('*/api/notion/characters/:id', ({ params }) => {
    const { id } = params as { id: string };
    const initialLength = db.characters.length;
    db.characters = db.characters.filter(c => c.id !== id);

    // Clean up relationships
    db.puzzles.forEach(p => {
      (p as any).characterIds = ((p as any).characterIds || []).filter((cId: string) => cId !== id);
    });
    db.elements.forEach(e => {
      if (e.ownerId === id) e.ownerId = undefined;
      e.associatedCharacterIds = e.associatedCharacterIds.filter(cId => cId !== id);
    });

    if (db.characters.length < initialLength) {
      return new HttpResponse(null, { status: 204 });
    }
    return HttpResponse.json({ error: 'Character not found' }, { status: 404 });
  }),

  // ===== ELEMENT ENDPOINTS =====
  http.get('*/api/notion/elements', () => {
    return HttpResponse.json({
      data: db.elements,
      hasMore: false,
      nextCursor: null
    });
  }),

  http.post('*/api/notion/elements', async ({ request }) => {
    const body = await request.json() as Partial<Element>;
    const newId = `elem-${idCounters.element++}`;
    
    const newElement: Element & { version: number } = {
      // Set defaults first, then override with body values
      id: newId,
      name: body.name || 'New Element',
      lastEdited: new Date().toISOString(),
      descriptionText: body.descriptionText || '',
      sfPatterns: body.sfPatterns || {},
      basicType: (body.basicType || 'Prop') as ElementBasicType,
      ownerId: body.ownerId || undefined,
      containerId: body.containerId || undefined,
      contentIds: body.contentIds || [],
      timelineEventId: body.timelineEventId || undefined,
      status: (body.status || 'Idea/Placeholder') as ElementStatus,
      firstAvailable: body.firstAvailable || null,
      requiredForPuzzleIds: body.requiredForPuzzleIds || [],
      rewardedByPuzzleIds: body.rewardedByPuzzleIds || [],
      containerPuzzleId: body.containerPuzzleId || undefined,
      narrativeThreads: body.narrativeThreads || [],
      associatedCharacterIds: body.associatedCharacterIds || [],
      puzzleChain: body.puzzleChain || [],
      productionNotes: body.productionNotes || '',
      filesMedia: body.filesMedia || [],
      contentLink: body.contentLink || undefined,
      isContainer: body.isContainer || false,
      version: 1
    };
    
    db.elements.push(newElement);
    updateRelationships('element', newId, body);
    
    return HttpResponse.json(newElement, { status: 201 });
  }),

  http.put('*/api/notion/elements/:id', async ({ params, request }) => {
    const { id } = params as { id: string };
    const body = await request.json() as Partial<Element>;
    const elemIndex = db.elements.findIndex(e => e.id === id);

    if (elemIndex === -1) {
      return HttpResponse.json({ error: 'Element not found' }, { status: 404 });
    }

    // Version control check
    const currentVersion = (db.elements[elemIndex] as any).version ?? 1;
    const clientVersion = request.headers.get('If-Match');
    if (clientVersion && parseInt(clientVersion) !== currentVersion) {
      return HttpResponse.json({ error: 'Version mismatch' }, { status: 409 });
    }

    const oldElement = { ...db.elements[elemIndex] };
    const current = db.elements[elemIndex]!;
    
    // Merge updates with current, preserving required fields
    const updatedElement: Element & { version: number } = {
      ...current,
      ...body,
      id: current.id, // Always preserve ID
      version: currentVersion + 1
    };
    
    // Ensure required fields are never undefined
    if (!updatedElement.name) updatedElement.name = current.name;
    if (!updatedElement.descriptionText) updatedElement.descriptionText = current.descriptionText;
    if (!updatedElement.basicType) updatedElement.basicType = current.basicType;
    if (!updatedElement.status) updatedElement.status = current.status;
    
    db.elements[elemIndex] = updatedElement;

    updateRelationships('element', id, body, oldElement);
    return HttpResponse.json(db.elements[elemIndex]);
  }),

  http.delete('*/api/notion/elements/:id', ({ params }) => {
    const { id } = params as { id: string };
    const initialLength = db.elements.length;
    db.elements = db.elements.filter(e => e.id !== id);

    // Clean up relationships
    db.characters.forEach(c => {
      c.ownedElementIds = c.ownedElementIds.filter(eId => eId !== id);
      c.associatedElementIds = c.associatedElementIds.filter(eId => eId !== id);
    });
    db.puzzles.forEach(p => {
      p.puzzleElementIds = p.puzzleElementIds.filter(eId => eId !== id);
      p.rewardIds = p.rewardIds.filter(rId => rId !== id);
    });

    if (db.elements.length < initialLength) {
      return new HttpResponse(null, { status: 204 });
    }
    return HttpResponse.json({ error: 'Element not found' }, { status: 404 });
  }),

  // ===== PUZZLE ENDPOINTS =====
  http.get('*/api/notion/puzzles', () => {
    return HttpResponse.json({
      data: db.puzzles,
      hasMore: false,
      nextCursor: null
    });
  }),

  http.post('*/api/notion/puzzles', async ({ request }) => {
    const body = await request.json() as Partial<Puzzle>;
    const newId = `puzzle-${idCounters.puzzle++}`;
    
    const newPuzzle: Puzzle & { version: number } = {
      // Set defaults first, then override with body values
      id: newId,
      name: body.name || 'New Puzzle',
      lastEdited: new Date().toISOString(),
      descriptionSolution: body.descriptionSolution || '',
      puzzleElementIds: body.puzzleElementIds || [],
      lockedItemId: body.lockedItemId || undefined,
      ownerId: body.ownerId || undefined,
      rewardIds: body.rewardIds || [],
      parentItemId: body.parentItemId || undefined,
      subPuzzleIds: body.subPuzzleIds || [],
      storyReveals: body.storyReveals || [],
      timing: body.timing || [],
      narrativeThreads: body.narrativeThreads || [],
      assetLink: body.assetLink || undefined,
      version: 1
    };
    
    db.puzzles.push(newPuzzle);
    updateRelationships('puzzle', newId, body);
    
    return HttpResponse.json(newPuzzle, { status: 201 });
  }),

  http.put('*/api/notion/puzzles/:id', async ({ params, request }) => {
    const { id } = params as { id: string };
    const body = await request.json() as Partial<Puzzle>;
    const puzzleIndex = db.puzzles.findIndex(p => p.id === id);

    if (puzzleIndex === -1) {
      return HttpResponse.json({ error: 'Puzzle not found' }, { status: 404 });
    }

    // Version control check
    const currentVersion = (db.puzzles[puzzleIndex] as any).version ?? 1;
    const clientVersion = request.headers.get('If-Match');
    if (clientVersion && parseInt(clientVersion) !== currentVersion) {
      return HttpResponse.json({ error: 'Version mismatch' }, { status: 409 });
    }

    // Capture old state for relationship updates
    const oldPuzzle = { ...db.puzzles[puzzleIndex] };
    const current = db.puzzles[puzzleIndex]!;

    // Merge updates with current, preserving required fields
    const updatedPuzzle: Puzzle & { version: number } = {
      ...current,
      ...body,
      id: current.id, // Always preserve ID
      version: currentVersion + 1
    };
    
    // Ensure required fields are never undefined
    if (!updatedPuzzle.name) updatedPuzzle.name = current.name;
    
    db.puzzles[puzzleIndex] = updatedPuzzle;

    // Use centralized relationship update logic
    updateRelationships('puzzle', id, body, oldPuzzle);

    return HttpResponse.json(db.puzzles[puzzleIndex]);
  }),

  http.delete('*/api/notion/puzzles/:id', ({ params }) => {
    const { id } = params as { id: string };
    const initialLength = db.puzzles.length;
    
    // Remove puzzle from database
    db.puzzles = db.puzzles.filter(p => p.id !== id);
    
    // Clean up relationships
    // Remove puzzle from all characters' characterPuzzleIds
    db.characters.forEach(c => {
      c.characterPuzzleIds = c.characterPuzzleIds.filter(pId => pId !== id);
    });
    
    // Remove puzzle from all elements' requiredForPuzzleIds and rewardedByPuzzleIds
    db.elements.forEach(e => {
      e.requiredForPuzzleIds = e.requiredForPuzzleIds.filter(pId => pId !== id);
      e.rewardedByPuzzleIds = e.rewardedByPuzzleIds.filter(pId => pId !== id);
      if (e.containerPuzzleId === id) {
        e.containerPuzzleId = undefined;
      }
    });
    
    // Remove puzzle from other puzzles' subPuzzleIds
    db.puzzles.forEach(p => {
      p.subPuzzleIds = p.subPuzzleIds.filter(spId => spId !== id);
      if (p.parentItemId === id) {
        p.parentItemId = undefined;
      }
    });

    if (db.puzzles.length < initialLength) {
      return new HttpResponse(null, { status: 204 });
    }
    return HttpResponse.json({ error: 'Puzzle not found' }, { status: 404 });
  }),

  // ===== TIMELINE ENDPOINTS =====
  http.get('*/api/notion/timeline', () => {
    return HttpResponse.json({
      data: db.timeline,
      hasMore: false,
      nextCursor: null
    });
  }),

  http.post('*/api/notion/timeline', async ({ request }) => {
    const body = await request.json() as Partial<TimelineEvent>;
    const newId = `timeline-${idCounters.timeline++}`;
    
    const newEvent: TimelineEvent & { version: number } = {
      // Set defaults first, then override with body values
      id: newId,
      name: body.name || 'New Timeline Event',
      lastEdited: new Date().toISOString(),
      description: body.description || '',
      date: body.date || new Date().toISOString(),
      charactersInvolvedIds: body.charactersInvolvedIds || [],
      memoryEvidenceIds: body.memoryEvidenceIds || [],
      memTypes: body.memTypes || [],
      notes: body.notes || '',
      lastEditedTime: new Date().toISOString(),
      associatedPuzzles: body.associatedPuzzles || [],
      version: 1
    };
    
    db.timeline.push(newEvent);
    updateRelationships('timeline', newId, body);
    
    return HttpResponse.json(newEvent, { status: 201 });
  }),

  http.put('*/api/notion/timeline/:id', async ({ params, request }) => {
    const { id } = params as { id: string };
    const body = await request.json() as Partial<TimelineEvent>;
    const eventIndex = db.timeline.findIndex(t => t.id === id);

    if (eventIndex === -1) {
      return HttpResponse.json({ error: 'Timeline event not found' }, { status: 404 });
    }

    // Version control check
    const currentVersion = (db.timeline[eventIndex] as any).version ?? 1;
    const clientVersion = request.headers.get('If-Match');
    if (clientVersion && parseInt(clientVersion) !== currentVersion) {
      return HttpResponse.json({ error: 'Version mismatch' }, { status: 409 });
    }

    // Capture old state for relationship updates
    const oldEvent = { ...db.timeline[eventIndex] };
    const current = db.timeline[eventIndex]!;

    // Merge updates with current, preserving required fields
    const updatedEvent: TimelineEvent & { version: number } = {
      ...current,
      ...body,
      id: current.id, // Always preserve ID
      lastEditedTime: new Date().toISOString(),
      version: currentVersion + 1
    };
    
    // Ensure required fields are never undefined
    if (!updatedEvent.name) updatedEvent.name = current.name;
    
    db.timeline[eventIndex] = updatedEvent;

    // Use centralized relationship update logic
    updateRelationships('timeline', id, body, oldEvent);

    return HttpResponse.json(db.timeline[eventIndex]);
  }),

  http.delete('*/api/notion/timeline/:id', ({ params }) => {
    const { id } = params as { id: string };
    const initialLength = db.timeline.length;
    
    // Remove timeline event from database
    db.timeline = db.timeline.filter(t => t.id !== id);
    
    // Clean up relationships
    // Remove timeline event from elements' timelineEventId
    db.elements.forEach(e => {
      if (e.timelineEventId === id) {
        e.timelineEventId = undefined;
      }
    });
    
    // Remove timeline event from characters' eventIds
    db.characters.forEach(c => {
      c.eventIds = c.eventIds.filter(eId => eId !== id);
    });
    
    // Remove from puzzles' storyReveals
    db.puzzles.forEach(p => {
      p.storyReveals = p.storyReveals.filter(srId => srId !== id);
    });

    if (db.timeline.length < initialLength) {
      return new HttpResponse(null, { status: 204 });
    }
    return HttpResponse.json({ error: 'Timeline event not found' }, { status: 404 });
  }),

  // ===== ERROR SIMULATION ENDPOINTS =====
  // For testing error handling - can trigger 500 errors on demand
  http.post('*/api/notion/trigger-error', () => {
    return HttpResponse.json({ error: 'Internal server error' }, { status: 500 });
  })
];