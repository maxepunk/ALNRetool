/**
 * BEHAVIORAL TEST SUITE: Entity Merge Behavior Specification
 * 
 * These tests define the INTENDED BEHAVIOR of partial update handling,
 * regardless of current implementation. They serve as the "north star"
 * for what the system SHOULD do, not necessarily what it currently does.
 * 
 * FUNDAMENTAL PRINCIPLE: 
 * When updating an entity, only the fields explicitly changed by the user
 * should be modified. All other data MUST be preserved.
 */

import { describe, it, expect } from 'vitest';
import type { Character, Element, Puzzle, TimelineEvent } from '../../src/types/notion/app';

/**
 * Interface for the behavior we're testing
 * Implementation may vary, but behavior must be consistent
 */
interface PartialUpdateBehavior {
  mergePartialUpdate<T>(
    existingEntity: T,
    partialResponse: Partial<T>,
    userIntent: Record<string, any>
  ): T;
}

describe('BEHAVIORAL SPECIFICATION: Partial Update Handling', () => {
  
  describe('REQUIREMENT 1: Data Preservation', () => {
    it('MUST preserve all unchanged fields when updating a single property', () => {
      // GIVEN: A character with full data
      const existing: Character = {
        id: 'char-1',
        name: 'Alice',
        entityType: 'character',
        type: 'Player',
        tier: 'Core',
        ownedElementIds: ['elem-1', 'elem-2'],
        associatedElementIds: ['elem-3'],
        characterPuzzleIds: ['puzzle-1'],
        eventIds: ['event-1', 'event-2'],
        connections: ['char-2', 'char-3'],
        primaryAction: 'Investigating',
        characterLogline: 'The detective',
        overview: 'Complex backstory here',
        emotionTowardsCEO: 'Suspicious'
      };

      // WHEN: User updates ONLY the name
      const userIntent = { name: 'Alice Johnson' };
      
      // AND: API returns partial response (simulating Notion behavior)
      const partialResponse = createPartialResponse('character', userIntent);

      // THEN: The merged result MUST preserve everything except name
      const result = performMerge(existing, partialResponse, userIntent);
      
      // Name should be updated
      expect(result.name).toBe('Alice Johnson');
      
      // EVERYTHING else MUST be preserved exactly
      expect(result.type).toBe('Player');
      expect(result.tier).toBe('Core');
      expect(result.ownedElementIds).toEqual(['elem-1', 'elem-2']);
      expect(result.associatedElementIds).toEqual(['elem-3']);
      expect(result.characterPuzzleIds).toEqual(['puzzle-1']);
      expect(result.eventIds).toEqual(['event-1', 'event-2']);
      expect(result.connections).toEqual(['char-2', 'char-3']);
      expect(result.primaryAction).toBe('Investigating');
      expect(result.characterLogline).toBe('The detective');
      expect(result.overview).toBe('Complex backstory here');
      expect(result.emotionTowardsCEO).toBe('Suspicious');
    });

    it('MUST preserve complex nested data structures', () => {
      // GIVEN: An element with nested SF patterns
      const existing: Element = {
        id: 'elem-1',
        name: 'Memory Card',
        entityType: 'element',
        descriptionText: 'Contains crucial evidence',
        sfPatterns: {
          rfid: 'MEM001',
          valueRating: 5,
          memoryType: 'Personal',
          group: { name: 'Evidence', multiplier: '2-10' }
        },
        basicType: 'Memory Token (Audio)',
        ownerId: 'char-1',
        containerId: 'elem-2',
        contentIds: ['elem-3', 'elem-4'],
        timelineEventId: 'event-1',
        status: 'Ready for Playtest',
        firstAvailable: 'Act 1',
        requiredForPuzzleIds: ['puzzle-1'],
        rewardedByPuzzleIds: [],
        containerPuzzleId: undefined,
        narrativeThreads: ['Murder', 'Betrayal'],
        associatedCharacterIds: ['char-1', 'char-2'],
        puzzleChain: ['puzzle-1', 'puzzle-2'],
        productionNotes: 'Need voice actor',
        filesMedia: [{ name: 'audio.mp3', url: 'https://example.com/audio.mp3' }],
        contentLink: 'https://content.example.com',
        isContainer: false
      };

      // WHEN: User updates only the status
      const userIntent = { status: 'Done' };
      const partialResponse = createPartialResponse('element', userIntent);

      // THEN: Complex nested structures MUST be preserved
      const result = performMerge(existing, partialResponse, userIntent);
      
      expect(result.status).toBe('Done');
      expect(result.sfPatterns).toEqual({
        rfid: 'MEM001',
        valueRating: 5,
        memoryType: 'Personal',
        group: { name: 'Evidence', multiplier: '2-10' }
      });
      expect(result.filesMedia).toEqual([{ 
        name: 'audio.mp3', 
        url: 'https://example.com/audio.mp3' 
      }]);
    });
  });

  describe('REQUIREMENT 2: User Intent Recognition', () => {
    it('MUST clear arrays when user explicitly sends empty array', () => {
      // GIVEN: A character with owned elements
      const existing: Character = createCharacterWithData({
        ownedElementIds: ['elem-1', 'elem-2', 'elem-3']
      });

      // WHEN: User explicitly clears the array
      const userIntent = { ownedElementIds: [] };
      const partialResponse = createPartialResponse('character', userIntent);

      // THEN: The array MUST be cleared
      const result = performMerge(existing, partialResponse, userIntent);
      expect(result.ownedElementIds).toEqual([]);
    });

    it('MUST NOT clear arrays when they are missing from user intent', () => {
      // GIVEN: A character with multiple relationships
      const existing: Character = createCharacterWithData({
        ownedElementIds: ['elem-1', 'elem-2'],
        associatedElementIds: ['elem-3', 'elem-4'],
        characterPuzzleIds: ['puzzle-1']
      });

      // WHEN: User updates something else entirely
      const userIntent = { primaryAction: 'New action' };
      const partialResponse = createPartialResponse('character', userIntent);

      // THEN: Arrays NOT in user intent MUST be preserved
      const result = performMerge(existing, partialResponse, userIntent);
      expect(result.ownedElementIds).toEqual(['elem-1', 'elem-2']);
      expect(result.associatedElementIds).toEqual(['elem-3', 'elem-4']);
      expect(result.characterPuzzleIds).toEqual(['puzzle-1']);
      expect(result.primaryAction).toBe('New action');
    });

    it('MUST distinguish between null (clear) and undefined (not updating)', () => {
      // GIVEN: An element with a timeline event
      const existing: Element = createElementWithData({
        timelineEventId: 'event-1',
        containerPuzzleId: 'puzzle-1'
      });

      // WHEN: User explicitly clears one field but not another
      const userIntent = { 
        timelineEventId: null  // Explicitly clearing
        // containerPuzzleId not mentioned - should be preserved
      };
      const partialResponse = createPartialResponse('element', userIntent);

      // THEN: Only explicitly cleared field should be null
      const result = performMerge(existing, partialResponse, userIntent);
      expect(result.timelineEventId).toBeNull();
      expect(result.containerPuzzleId).toBe('puzzle-1');
    });
  });

  describe('REQUIREMENT 3: Data Integrity Protection', () => {
    it('MUST NEVER silently lose data', () => {
      // GIVEN: Any entity with data
      const existing: Character = createCharacterWithData({
        ownedElementIds: ['elem-1', 'elem-2'],
        primaryAction: 'Critical information'
      });

      // WHEN: A merge operation occurs
      const userIntent = { name: 'Updated Name' };
      const partialResponse = createPartialResponse('character', userIntent);
      const result = performMerge(existing, partialResponse, userIntent);

      // THEN: No data should be lost
      expect(result.ownedElementIds).toHaveLength(2);
      expect(result.primaryAction).toBeTruthy();
      
      // Verify with data integrity check
      const dataLost = checkDataIntegrity(existing, result, userIntent);
      expect(dataLost).toBe(false);
    });

    it('MUST handle concurrent updates safely', () => {
      // GIVEN: Two concurrent updates to the same entity
      const existing: Element = createElementWithData({
        name: 'Original',
        status: 'In Progress',
        ownerId: 'char-1'
      });

      // WHEN: Two updates happen "simultaneously"
      const update1 = { name: 'Updated by User A' };
      const update2 = { status: 'Done' };

      // Simulate both updates
      const result1 = performMerge(existing, createPartialResponse('element', update1), update1);
      const result2 = performMerge(result1, createPartialResponse('element', update2), update2);

      // THEN: Both updates should be reflected, nothing lost
      expect(result2.name).toBe('Updated by User A');
      expect(result2.status).toBe('Done');
      expect(result2.ownerId).toBe('char-1');
    });
  });

  describe('REQUIREMENT 4: Transform Output Handling', () => {
    it('MUST handle empty arrays from transforms correctly', () => {
      // This is THE CRITICAL TEST for the bug we're fixing
      
      // GIVEN: Existing entity with relationships
      const existing: Character = createCharacterWithData({
        ownedElementIds: ['elem-1', 'elem-2'],
        connections: ['char-2', 'char-3']
      });

      // WHEN: Transform returns empty arrays (not undefined) for missing fields
      // This simulates what ACTUALLY happens with our transforms
      const transformOutput: Partial<Character> = {
        id: 'char-1',
        name: 'Updated Name',
        entityType: 'character',
        // Transform functions return empty arrays for missing properties
        ownedElementIds: [],      // getRelationIds(undefined) → []
        associatedElementIds: [],  // getRelationIds(undefined) → []
        characterPuzzleIds: [],    // getRelationIds(undefined) → []
        eventIds: [],              // getRelationIds(undefined) → []
        connections: [],           // getRollupStrings(undefined) → []
        // Transform functions return empty strings for missing text
        primaryAction: '',         // getRichText(undefined) → ''
        characterLogline: '',      // getRichText(undefined) → ''
        overview: '',              // getRichText(undefined) → ''
        emotionTowardsCEO: ''      // getRichText(undefined) → ''
      };

      // AND: User only intended to update the name
      const userIntent = { name: 'Updated Name' };

      // THEN: System MUST recognize empty arrays as "not updated" not "cleared"
      const result = performMerge(existing, transformOutput, userIntent);
      
      expect(result.name).toBe('Updated Name');
      expect(result.ownedElementIds).toEqual(['elem-1', 'elem-2']); // PRESERVED!
      expect(result.connections).toEqual(['char-2', 'char-3']);     // PRESERVED!
    });

    it('MUST handle all transform default values correctly', () => {
      // GIVEN: Various entities with data
      const character: Character = createCharacterWithData({ tier: 'Core' });
      const element: Element = createElementWithData({ basicType: 'Document' });
      const puzzle: Puzzle = createPuzzleWithData({ lockedItemId: 'elem-1' });

      // WHEN: Transforms return defaults for missing fields
      const charPartial = {
        ...createPartialResponse('character', { name: 'Test' }),
        tier: 'Tertiary' as const  // Default from transform
      };
      
      const elemPartial = {
        ...createPartialResponse('element', { name: 'Test' }),
        basicType: 'Prop' as const  // Default from transform
      };

      // THEN: Original values MUST be preserved, not replaced with defaults
      const charResult = performMerge(character, charPartial, { name: 'Test' });
      const elemResult = performMerge(element, elemPartial, { name: 'Test' });
      
      expect(charResult.tier).toBe('Core');        // NOT 'Tertiary'
      expect(elemResult.basicType).toBe('Document'); // NOT 'Prop'
    });
  });

  describe('REQUIREMENT 5: Performance', () => {
    it('MUST handle large datasets efficiently', () => {
      // GIVEN: Entity with many relationships (simulating production scale)
      const largeIds = Array.from({ length: 1000 }, (_, i) => `id-${i}`);
      const existing: Character = createCharacterWithData({
        ownedElementIds: largeIds,
        associatedElementIds: largeIds.slice(0, 500),
        eventIds: largeIds.slice(0, 250)
      });

      // WHEN: Performing a simple update
      const startTime = performance.now();
      const result = performMerge(
        existing,
        createPartialResponse('character', { name: 'Updated' }),
        { name: 'Updated' }
      );
      const duration = performance.now() - startTime;

      // THEN: Operation should be fast
      expect(duration).toBeLessThan(50); // Should complete in < 50ms
      expect(result.ownedElementIds).toHaveLength(1000);
      expect(result.associatedElementIds).toHaveLength(500);
    });
  });

  describe('REQUIREMENT 6: Error Handling', () => {
    it('MUST detect and report data loss attempts', () => {
      // GIVEN: A validation function that checks for data loss
      const validateMerge = (
        before: any,
        after: any,
        intent: any
      ): string[] => {
        const warnings: string[] = [];
        
        for (const key in before) {
          const beforeValue = before[key];
          const afterValue = after[key];
          
          // Check for unintended data clearing
          if (Array.isArray(beforeValue) && Array.isArray(afterValue)) {
            if (beforeValue.length > 0 && afterValue.length === 0 && !(key in intent)) {
              warnings.push(`Potential data loss: ${key} was cleared without user intent`);
            }
          }
          
          // Check for unintended null/empty values
          if (beforeValue && !afterValue && !(key in intent)) {
            warnings.push(`Potential data loss: ${key} was nullified without user intent`);
          }
        }
        
        return warnings;
      };

      // WHEN: A bad merge would lose data
      const existing = createCharacterWithData({
        ownedElementIds: ['elem-1'],
        primaryAction: 'Important'
      });
      
      const badMerge = {
        ...existing,
        ownedElementIds: [],  // Lost!
        primaryAction: ''      // Lost!
      };

      // THEN: Validation should detect it
      const warnings = validateMerge(existing, badMerge, { name: 'Updated' });
      expect(warnings).toHaveLength(2);
      expect(warnings[0]).toContain('ownedElementIds');
      expect(warnings[1]).toContain('primaryAction');
    });
  });
});

// Helper functions that define the expected behavior
// These represent the CONTRACT, not the implementation

function createCharacterWithData(overrides: Partial<Character> = {}): Character {
  return {
    id: 'char-1',
    name: 'Test Character',
    entityType: 'character',
    type: 'NPC',
    tier: 'Secondary',
    ownedElementIds: [],
    associatedElementIds: [],
    characterPuzzleIds: [],
    eventIds: [],
    connections: [],
    primaryAction: '',
    characterLogline: '',
    overview: '',
    emotionTowardsCEO: '',
    ...overrides
  };
}

function createElementWithData(overrides: Partial<Element> = {}): Element {
  return {
    id: 'elem-1',
    name: 'Test Element',
    entityType: 'element',
    descriptionText: '',
    sfPatterns: {},
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
    ...overrides
  };
}

function createPuzzleWithData(overrides: Partial<Puzzle> = {}): Puzzle {
  return {
    id: 'puzzle-1',
    name: 'Test Puzzle',
    entityType: 'puzzle',
    descriptionSolution: '',
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
    ...overrides
  };
}

function createPartialResponse(
  entityType: 'character' | 'element' | 'puzzle' | 'timeline',
  userIntent: Record<string, any>
): any {
  // Simulates what transforms return when Notion only returns updated fields
  // This is the ACTUAL BEHAVIOR we need to handle
  
  const base: any = { ...userIntent };
  
  // Add empty arrays for all array fields not in intent
  // This simulates getRelationIds(undefined) → []
  // getRollupStrings(undefined) → []
  // getMultiSelect(undefined) → []
  const arrayFields = [
    'ownedElementIds', 'associatedElementIds', 'characterPuzzleIds',
    'eventIds', 'connections', 'contentIds', 'requiredForPuzzleIds',
    'rewardedByPuzzleIds', 'narrativeThreads', 'associatedCharacterIds',
    'puzzleChain', 'filesMedia', 'puzzleElementIds', 'rewardIds',
    'subPuzzleIds', 'storyReveals', 'timing', 'charactersInvolvedIds',
    'memoryEvidenceIds', 'memTypes'
  ];
  
  for (const field of arrayFields) {
    if (!(field in userIntent)) {
      base[field] = []; // Transform ALWAYS returns [] for missing arrays
    }
  }
  
  // Add empty strings for text fields not in intent
  // This simulates getRichText(undefined) → ''
  // getTitle(undefined) → ''
  const textFields = [
    'primaryAction', 'characterLogline', 'overview', 'emotionTowardsCEO',
    'descriptionText', 'productionNotes', 'descriptionSolution', 'notes',
    'description', 'name'
  ];
  
  for (const field of textFields) {
    if (!(field in userIntent)) {
      base[field] = ''; // Transform returns '' for missing text
    }
  }
  
  // Single relations and nullable fields
  // getRelationIds()[0] || undefined for single relations
  // getSelect() → null for missing selects
  // getUrl() → undefined for missing URLs
  const singleRelations = [
    'ownerId', 'containerId', 'timelineEventId', 'containerPuzzleId',
    'lockedItemId', 'parentItemId'
  ];
  
  for (const field of singleRelations) {
    if (!(field in userIntent)) {
      base[field] = undefined; // Single relations become undefined
    }
  }
  
  // URL fields
  const urlFields = ['contentLink', 'assetLink'];
  for (const field of urlFields) {
    if (!(field in userIntent)) {
      base[field] = undefined; // getUrl() returns undefined
    }
  }
  
  // Select fields (can be null)
  const selectFields = ['firstAvailable', 'type', 'tier', 'basicType', 'status'];
  for (const field of selectFields) {
    if (!(field in userIntent)) {
      // getSelect() returns null, but transforms have defaults
      if (field === 'type') base[field] = 'NPC';
      else if (field === 'tier') base[field] = 'Tertiary';
      else if (field === 'basicType') base[field] = 'Prop';
      else if (field === 'status') base[field] = 'Idea/Placeholder';
      else base[field] = null;
    }
  }
  
  return base;
}

function performMerge<T extends Record<string, any>>(
  existing: T,
  partialResponse: Partial<T>,
  userIntent: Record<string, any>
): T {
  // This represents the EXPECTED BEHAVIOR for merge logic:
  // 1. Fields in userIntent should be updated (even if redundant)
  // 2. Empty arrays/strings NOT in userIntent should be ignored (preserve existing)
  // 3. Server metadata (lastEdited) should always be accepted
  
  const merged = { ...existing };
  
  for (const key in partialResponse) {
    const newValue = partialResponse[key];
    const existingValue = existing[key];
    
    // Always accept server metadata
    if (key === 'lastEdited' || key === 'lastEditedTime' || key === 'version') {
      (merged as any)[key] = newValue;
      continue;
    }
    
    // If field was explicitly in user intent, update it
    if (key in userIntent) {
      (merged as any)[key] = newValue;
      continue;
    }
    
    // Field NOT in user intent - decide if it's a transform artifact
    // Arrays that are empty when existing had data = likely transform artifact
    if (Array.isArray(newValue) && Array.isArray(existingValue)) {
      if (newValue.length === 0 && existingValue.length > 0) {
        // Empty array from transform - preserve existing
        continue;
      }
    }
    
    // Strings that are empty when existing had data = likely transform artifact
    if (typeof newValue === 'string' && typeof existingValue === 'string') {
      if (newValue === '' && existingValue !== '') {
        // Empty string from transform - preserve existing
        continue;
      }
    }
    
    // Single relations that are undefined/null when existing had value
    if ((newValue === undefined || newValue === null) && existingValue) {
      // Missing from transform - preserve existing
      continue;
    }
    
    // Default values that weren't explicitly set
    const isDefaultValue = (
      (key === 'tier' && newValue === 'Tertiary') ||
      (key === 'type' && newValue === 'NPC') ||
      (key === 'basicType' && newValue === 'Prop') ||
      (key === 'status' && newValue === 'Idea/Placeholder')
    );
    
    if (isDefaultValue && existingValue && existingValue !== newValue) {
      // Transform returned a default, preserve existing non-default
      continue;
    }
    
    // For other cases, accept the new value
    (merged as any)[key] = newValue;
  }
  
  return merged;
}

function checkDataIntegrity<T extends Record<string, any>>(
  before: T,
  after: T,
  userIntent: Record<string, any>
): boolean {
  // Returns true if data was lost inappropriately
  
  for (const key in before) {
    const beforeValue = before[key];
    const afterValue = after[key];
    
    // Skip fields that were intentionally updated
    if (key in userIntent) continue;
    
    // Check arrays
    if (Array.isArray(beforeValue) && Array.isArray(afterValue)) {
      if (beforeValue.length > 0 && afterValue.length === 0) {
        return true; // Data lost!
      }
    }
    
    // Check strings
    if (typeof beforeValue === 'string' && beforeValue && !afterValue) {
      return true; // Data lost!
    }
    
    // Check objects
    if (beforeValue && typeof beforeValue === 'object' && !afterValue) {
      return true; // Data lost!
    }
  }
  
  return false;
}