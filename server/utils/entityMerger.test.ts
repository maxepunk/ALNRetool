/**
 * Test suite for entityMerger partial update fix
 * Verifies that empty arrays from transforms don't overwrite existing data
 */

import { describe, it, expect } from 'vitest';
import { smartMergeEntityUpdate } from './entityMerger';
import type { Character, Element, Puzzle } from '../../src/types/notion/app';

describe('EntityMerger - Partial Update Fix', () => {
  
  describe('smartMergeEntityUpdate with requestBody detection', () => {
    
    it('should preserve arrays when field was not in request', () => {
      // GIVEN: Existing character with relationships
      const existing: Character = {
        id: 'char-1',
        name: 'Alice',
        entityType: 'character',
        type: 'NPC',
        tier: 'Core',
        ownedElementIds: ['elem-1', 'elem-2'],
        associatedElementIds: ['elem-3'],
        characterPuzzleIds: ['puzzle-1'],
        eventIds: ['event-1', 'event-2'],
        connections: ['char-2', 'char-3'],
        primaryAction: 'Investigating',
        characterLogline: 'The detective',
        overview: 'Complex backstory',
        emotionTowardsCEO: 'Suspicious'
      };

      // WHEN: Transform returns empty arrays for missing fields
      const partialFromTransform: Partial<Character> = {
        id: 'char-1',
        name: 'Alice Johnson',
        entityType: 'character',
        // These are empty because they weren't in Notion's response
        ownedElementIds: [],
        associatedElementIds: [],
        characterPuzzleIds: [],
        eventIds: [],
        connections: [],
        // Empty strings from missing text fields
        primaryAction: '',
        characterLogline: '',
        overview: '',
        emotionTowardsCEO: ''
      };

      // AND: User only sent name in request
      const requestBody = { name: 'Alice Johnson' };

      // THEN: Merge should preserve all arrays and text
      const result = smartMergeEntityUpdate(existing, partialFromTransform, requestBody);
      
      expect(result.name).toBe('Alice Johnson'); // Updated
      expect(result.ownedElementIds).toEqual(['elem-1', 'elem-2']); // Preserved!
      expect(result.associatedElementIds).toEqual(['elem-3']); // Preserved!
      expect(result.characterPuzzleIds).toEqual(['puzzle-1']); // Preserved!
      expect(result.eventIds).toEqual(['event-1', 'event-2']); // Preserved!
      expect(result.connections).toEqual(['char-2', 'char-3']); // Preserved!
      expect(result.primaryAction).toBe('Investigating'); // Preserved!
      expect(result.characterLogline).toBe('The detective'); // Preserved!
      expect(result.overview).toBe('Complex backstory'); // Preserved!
      expect(result.emotionTowardsCEO).toBe('Suspicious'); // Preserved!
    });

    it('should clear arrays when explicitly set in request', () => {
      // GIVEN: Existing element with relationships
      const existing: Element = {
        id: 'elem-1',
        name: 'Memory Card',
        entityType: 'element',
        descriptionText: 'Important item',
        sfPatterns: {},
        basicType: 'Memory Token (Audio)',
        ownerId: 'char-1',
        containerId: 'elem-2',
        contentIds: ['elem-3', 'elem-4'],
        timelineEventId: 'event-1',
        status: 'Ready for Playtest',
        firstAvailable: 'Act 1',
        requiredForPuzzleIds: ['puzzle-1', 'puzzle-2'],
        rewardedByPuzzleIds: ['puzzle-3'],
        containerPuzzleId: undefined,
        narrativeThreads: ['Murder', 'Betrayal'],
        associatedCharacterIds: ['char-1'],
        puzzleChain: [],
        productionNotes: '',
        filesMedia: [],
        contentLink: undefined,
        isContainer: false
      };

      // WHEN: User explicitly clears requiredForPuzzleIds
      const partialFromTransform: Partial<Element> = {
        id: 'elem-1',
        requiredForPuzzleIds: [], // User cleared this
        rewardedByPuzzleIds: [], // Not in request
      };

      const requestBody = { 
        requiredForPuzzleIds: [] // User explicitly sent empty array
      };

      // THEN: Only the explicitly cleared field should be empty
      const result = smartMergeEntityUpdate(existing, partialFromTransform, requestBody);
      
      expect(result.requiredForPuzzleIds).toEqual([]); // Cleared as requested
      expect(result.rewardedByPuzzleIds).toEqual(['puzzle-3']); // Preserved!
    });

    it('should handle field name variations (Id vs no Id)', () => {
      // GIVEN: Existing puzzle with relationships
      const existing: Puzzle = {
        id: 'puzzle-1',
        name: 'The Safe',
        entityType: 'puzzle',
        descriptionSolution: 'Use combination',
        puzzleElementIds: ['elem-1'],
        lockedItemId: 'elem-2',
        ownerId: 'char-1',
        rewardIds: ['elem-3'],
        parentItemId: 'puzzle-2',
        subPuzzleIds: ['puzzle-3'],
        storyReveals: ['reveal-1'],
        timing: [],
        narrativeThreads: ['Murder'],
        assetLink: undefined
      };

      // WHEN: Request uses field name without 'Id' suffix
      const partialFromTransform: Partial<Puzzle> = {
        id: 'puzzle-1',
        ownerId: 'char-2', // Updated
        lockedItemId: undefined, // Not in request, should preserve
        parentItemId: undefined, // Not in request, should preserve
      };

      const requestBody = { 
        owner: 'char-2' // Note: 'owner' not 'ownerId'
      };

      // THEN: Should recognize 'owner' maps to 'ownerId'
      const result = smartMergeEntityUpdate(existing, partialFromTransform, requestBody);
      
      expect(result.ownerId).toBe('char-2'); // Updated
      expect(result.lockedItemId).toBe('elem-2'); // Preserved!
      expect(result.parentItemId).toBe('puzzle-2'); // Preserved!
    });

    it('should handle null/undefined single relationships', () => {
      // GIVEN: Element with owner
      const existing: Element = {
        id: 'elem-1',
        name: 'Item',
        entityType: 'element',
        descriptionText: '',
        sfPatterns: {},
        basicType: 'Prop',
        ownerId: 'char-1',
        containerId: 'elem-2',
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
        isContainer: false
      };

      // WHEN: Transform returns null but user didn't clear it
      const partialFromTransform: Partial<Element> = {
        id: 'elem-1',
        name: 'Updated Item',
        ownerId: undefined, // Transform couldn't find it
        containerId: undefined, // Transform couldn't find it
      };

      const requestBody = { name: 'Updated Item' };

      // THEN: Should preserve existing relationships
      const result = smartMergeEntityUpdate(existing, partialFromTransform, requestBody);
      
      expect(result.name).toBe('Updated Item'); // Updated
      expect(result.ownerId).toBe('char-1'); // Preserved!
      expect(result.containerId).toBe('elem-2'); // Preserved!
    });

    it('should clear single relationship when explicitly set to null', () => {
      // GIVEN: Element with owner
      const existing: Element = {
        id: 'elem-1',
        name: 'Item',
        entityType: 'element',
        descriptionText: '',
        sfPatterns: {},
        basicType: 'Prop',
        ownerId: 'char-1',
        containerId: 'elem-2',
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
        isContainer: false
      };

      // WHEN: User explicitly clears owner
      const partialFromTransform: Partial<Element> = {
        id: 'elem-1',
        ownerId: undefined, // Set to undefined (which smartMerge will treat as null)
        containerId: undefined, // Not in request
      };

      const requestBody = { ownerId: null };

      // THEN: Only ownerId should be cleared
      const result = smartMergeEntityUpdate(existing, partialFromTransform, requestBody);
      
      expect(result.ownerId).toBeUndefined(); // Cleared as requested
      expect(result.containerId).toBe('elem-2'); // Preserved!
    });

    it('should handle common field name mappings', () => {
      // GIVEN: Character with text fields
      const existing: Character = {
        id: 'char-1',
        name: 'Alice',
        entityType: 'character',
        type: 'NPC',
        tier: 'Core',
        ownedElementIds: [],
        associatedElementIds: [],
        characterPuzzleIds: [],
        eventIds: [],
        connections: [],
        primaryAction: 'Investigating',
        characterLogline: 'The detective',
        overview: 'Complex backstory',
        emotionTowardsCEO: 'Suspicious'
      };

      // WHEN: Request uses shortened field names
      const partialFromTransform: Partial<Character> = {
        id: 'char-1',
        characterLogline: 'The investigator',
        emotionTowardsCEO: 'Neutral',
        primaryAction: '', // Not in request
        overview: '', // Not in request
      };

      const requestBody = { 
        logline: 'The investigator',
        emotion: 'Neutral'
      };

      // THEN: Should recognize field mappings
      const result = smartMergeEntityUpdate(existing, partialFromTransform, requestBody);
      
      expect(result.characterLogline).toBe('The investigator'); // Updated
      expect(result.emotionTowardsCEO).toBe('Neutral'); // Updated
      expect(result.primaryAction).toBe('Investigating'); // Preserved!
      expect(result.overview).toBe('Complex backstory'); // Preserved!
    });

    it('should preserve data when no requestBody provided (backward compatibility)', () => {
      // GIVEN: Existing character
      const existing: Character = {
        id: 'char-1',
        name: 'Alice',
        entityType: 'character',
        type: 'NPC',
        tier: 'Core',
        ownedElementIds: ['elem-1'],
        associatedElementIds: [],
        characterPuzzleIds: [],
        eventIds: [],
        connections: [],
        primaryAction: 'Investigating',
        characterLogline: '',
        overview: '',
        emotionTowardsCEO: ''
      };

      // WHEN: Called without requestBody (legacy code path)
      const partialFromTransform: Partial<Character> = {
        id: 'char-1',
        name: 'Alice Johnson',
        ownedElementIds: [],
      };

      // THEN: Should still preserve arrays (fallback behavior)
      const result = smartMergeEntityUpdate(existing, partialFromTransform, undefined);
      
      expect(result.name).toBe('Alice Johnson');
      expect(result.ownedElementIds).toEqual(['elem-1']); // Preserved even without requestBody
    });
  });
});