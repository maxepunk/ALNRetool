/**
 * Tests for Partial Update Handling
 * 
 * Verifies that partial updates from the API properly preserve
 * relationship fields that weren't included in the update.
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { partialUpdateHandlers, resetPartialUpdateMocks } from '@/test/mocks/handlers/partialUpdate';
import { DeltaCacheUpdater, type CachedGraphData, type CacheUpdateContext } from './updaters';
import type { Character, Element } from '@/types/notion/app';
import type { GraphDelta } from '../../../server/types/delta';

// Setup MSW server once for all tests
const server = setupServer(...partialUpdateHandlers);

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'bypass' });
});

afterAll(() => {
  server.close();
});

beforeEach(() => {
  resetPartialUpdateMocks();
});

describe('Partial Update Cache Handling', () => {
  let queryClient: QueryClient;
  let cacheUpdater: DeltaCacheUpdater;
  const QUERY_KEY = ['graph', 'complete', 'test-view'];

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
    cacheUpdater = new DeltaCacheUpdater();
  });

  describe('Character Updates', () => {
    it('should preserve relationship arrays when updating only name', async () => {
      // Set up initial cache with a character
      const initialData: CachedGraphData = {
        nodes: [{
          id: 'char-partial-1',
          type: 'character',
          position: { x: 100, y: 100 },
          data: {
            label: 'Alice',
            entity: {
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
            } as Character,
            metadata: {
              entityType: 'character'
            }
          }
        }],
        edges: [],
        metadata: {
          lastFetch: Date.now(),
          version: 1
        }
      };

      queryClient.setQueryData(QUERY_KEY, initialData);

      // Simulate a partial update delta (only name changed)
      const delta: GraphDelta = {
        type: 'UPDATE',
        entityId: 'char-partial-1',
        entityType: 'character',
        changes: {
          name: 'Alice Updated'
        }
      };

      // Apply the delta with the server's merged response
      // In production, this would come from the server with proper merge
      const serverResponse: Character = {
        id: 'char-partial-1',
        name: 'Alice Updated',
        entityType: 'character',
        type: 'Player',
        tier: 'Core',
        ownedElementIds: ['elem-1', 'elem-2'], // Preserved by server merge
        associatedElementIds: ['elem-3'], // Preserved by server merge
        characterPuzzleIds: ['puzzle-1'], // Preserved by server merge
        eventIds: ['event-1'], // Preserved by server merge
        connections: [],
        primaryAction: 'Investigating',
        characterLogline: 'The detective',
        overview: 'Main character',
        emotionTowardsCEO: 'Suspicious'
      };

      // Update cache using the correct method signature
      const context: CacheUpdateContext<Character> = {
        queryClient,
        queryKey: QUERY_KEY,
        delta,
        operation: 'update',
        entity: serverResponse
      };
      
      cacheUpdater.update(context);
      
      // Verify the cache was updated correctly
      const updatedData = queryClient.getQueryData(QUERY_KEY) as CachedGraphData;
      const updatedNode = updatedData.nodes.find(n => n.id === 'char-partial-1');
      const updatedEntity = updatedNode?.data.entity as Character;

      // Name should be updated
      expect(updatedEntity.name).toBe('Alice Updated');
      
      // Relationships should be preserved
      expect(updatedEntity.ownedElementIds).toEqual(['elem-1', 'elem-2']);
      expect(updatedEntity.associatedElementIds).toEqual(['elem-3']);
      expect(updatedEntity.characterPuzzleIds).toEqual(['puzzle-1']);
      expect(updatedEntity.eventIds).toEqual(['event-1']);
      
      // Other fields should also be preserved
      expect(updatedEntity.primaryAction).toBe('Investigating');
      expect(updatedEntity.characterLogline).toBe('The detective');
    });

    it('should handle explicit clearing of arrays', () => {
      const initialData: CachedGraphData = {
        nodes: [{
          id: 'char-partial-1',
          type: 'character',
          position: { x: 100, y: 100 },
          data: {
            label: 'Alice',
            entity: {
              id: 'char-partial-1',
              name: 'Alice',
              entityType: 'character',
              type: 'Player',
              tier: 'Core',
              ownedElementIds: ['elem-1', 'elem-2'],
              associatedElementIds: ['elem-3'],
              characterPuzzleIds: ['puzzle-1'],
              eventIds: [],
              connections: [],
              primaryAction: '',
              characterLogline: '',
              overview: '',
              emotionTowardsCEO: 'Neutral'
            } as Character,
            metadata: {
              entityType: 'character'
            }
          }
        }],
        edges: [],
        metadata: {
          lastFetch: Date.now(),
          version: 1
        }
      };

      queryClient.setQueryData(QUERY_KEY, initialData);

      // Delta that explicitly clears an array
      const delta: GraphDelta = {
        type: 'UPDATE',
        entityId: 'char-partial-1',
        entityType: 'character',
        changes: {
          ownedElementIds: [] // Explicitly clearing
        }
      };

      const serverResponse: Character = {
        id: 'char-partial-1',
        name: 'Alice',
        entityType: 'character',
        type: 'Player',
        tier: 'Core',
        ownedElementIds: [], // Should be empty
        associatedElementIds: ['elem-3'], // Should be preserved
        characterPuzzleIds: ['puzzle-1'], // Should be preserved
        eventIds: [],
        connections: [],
        primaryAction: '',
        characterLogline: '',
        overview: '',
        emotionTowardsCEO: 'Neutral'
      };

      const context2: CacheUpdateContext<Character> = {
        queryClient,
        queryKey: QUERY_KEY,
        delta,
        operation: 'update',
        entity: serverResponse,
        strategy: 'delta'
      };
      
      cacheUpdater.update(context2);

      const updatedData = queryClient.getQueryData(QUERY_KEY) as CachedGraphData;
      const updatedNode = updatedData.nodes.find(n => n.id === 'char-partial-1');
      const updatedEntity = updatedNode?.data.entity as Character;

      // Explicitly cleared array should be empty
      expect(updatedEntity.ownedElementIds).toEqual([]);
      
      // Other arrays should be preserved
      expect(updatedEntity.associatedElementIds).toEqual(['elem-3']);
      expect(updatedEntity.characterPuzzleIds).toEqual(['puzzle-1']);
    });
  });

  describe('Element Updates', () => {
    it('should preserve complex relationships when updating description', () => {
      const initialData: CachedGraphData = {
        nodes: [{
          id: 'elem-partial-1',
          type: 'element',
          position: { x: 200, y: 200 },
          data: {
            label: 'Key Item',
            entity: {
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
            } as Element,
            metadata: {
              entityType: 'element'
            }
          }
        }],
        edges: [],
        metadata: {
          lastFetch: Date.now(),
          version: 1
        }
      };

      queryClient.setQueryData(QUERY_KEY, initialData);

      // Update only description
      const delta: GraphDelta = {
        type: 'UPDATE',
        entityId: 'elem-partial-1',
        entityType: 'element',
        changes: {
          description: 'Updated description'
        }
      };

      const serverResponse: Element = {
        id: 'elem-partial-1',
        name: 'Key Item',
        entityType: 'element',
        type: 'Physical',
        category: 'Evidence',
        description: 'Updated description', // Changed
        ownerId: 'char-1', // Preserved
        containerId: 'elem-2', // Preserved
        contentIds: ['elem-3', 'elem-4'], // Preserved
        timelineEventId: 'timeline-1', // Preserved
        requiredForPuzzleIds: ['puzzle-1'], // Preserved
        rewardedByPuzzleIds: ['puzzle-2'], // Preserved
        containerPuzzleId: 'puzzle-3', // Preserved
        associatedCharacterIds: ['char-1', 'char-2'], // Preserved
        puzzleChain: []
      };

      cacheUpdater.update(
        queryClient,
        QUERY_KEY,
        delta,
        { entity: serverResponse }
      );

      const updatedData = queryClient.getQueryData(QUERY_KEY) as CachedGraphData;
      const updatedNode = updatedData.nodes.find(n => n.id === 'elem-partial-1');
      const updatedEntity = updatedNode?.data.entity as Element;

      // Description should be updated
      expect(updatedEntity.description).toBe('Updated description');
      
      // All relationships should be preserved
      expect(updatedEntity.ownerId).toBe('char-1');
      expect(updatedEntity.containerId).toBe('elem-2');
      expect(updatedEntity.contentIds).toEqual(['elem-3', 'elem-4']);
      expect(updatedEntity.timelineEventId).toBe('timeline-1');
      expect(updatedEntity.requiredForPuzzleIds).toEqual(['puzzle-1']);
      expect(updatedEntity.rewardedByPuzzleIds).toEqual(['puzzle-2']);
      expect(updatedEntity.containerPuzzleId).toBe('puzzle-3');
      expect(updatedEntity.associatedCharacterIds).toEqual(['char-1', 'char-2']);
    });
  });

  describe('Edge Cases', () => {
    it('should handle updates to non-existent nodes gracefully', async () => {
      const initialData: CachedGraphData = {
        nodes: [],
        edges: [],
        metadata: {
          lastFetch: Date.now(),
          version: 1
        }
      };

      queryClient.setQueryData(QUERY_KEY, initialData);

      const delta: GraphDelta = {
        type: 'UPDATE',
        entityId: 'non-existent',
        entityType: 'character',
        changes: {
          name: 'Ghost'
        }
      };

      const result = await cacheUpdater.update(
        queryClient,
        QUERY_KEY,
        delta,
        { entity: { id: 'non-existent', name: 'Ghost' } as any }
      );

      // Should handle gracefully without crashing
      expect(result.success).toBe(true);
      
      const data = queryClient.getQueryData(QUERY_KEY) as CachedGraphData;
      // No node should be added for non-existent update
      expect(data.nodes.length).toBe(0);
    });

    it('should preserve node position and metadata during entity updates', () => {
      const initialData: CachedGraphData = {
        nodes: [{
          id: 'char-partial-1',
          type: 'character',
          position: { x: 150, y: 250 }, // Custom position
          data: {
            label: 'Alice',
            entity: {
              id: 'char-partial-1',
              name: 'Alice',
              entityType: 'character',
              type: 'Player',
              tier: 'Core',
              ownedElementIds: [],
              associatedElementIds: [],
              characterPuzzleIds: [],
              eventIds: [],
              connections: [],
              primaryAction: '',
              characterLogline: '',
              overview: '',
              emotionTowardsCEO: 'Neutral'
            } as Character,
            metadata: {
              entityType: 'character',
              customField: 'preserved' // Custom metadata
            }
          }
        }],
        edges: [],
        metadata: {
          lastFetch: Date.now(),
          version: 1
        }
      };

      queryClient.setQueryData(QUERY_KEY, initialData);

      const delta: GraphDelta = {
        type: 'UPDATE',
        entityId: 'char-partial-1',
        entityType: 'character',
        changes: {
          name: 'Alice Updated'
        }
      };

      const serverResponse: Character = {
        id: 'char-partial-1',
        name: 'Alice Updated',
        entityType: 'character',
        type: 'Player',
        tier: 'Core',
        ownedElementIds: [],
        associatedElementIds: [],
        characterPuzzleIds: [],
        eventIds: [],
        connections: [],
        primaryAction: '',
        characterLogline: '',
        overview: '',
        emotionTowardsCEO: 'Neutral'
      };

      cacheUpdater.update(
        queryClient,
        QUERY_KEY,
        delta,
        { entity: serverResponse }
      );

      const updatedData = queryClient.getQueryData(QUERY_KEY) as CachedGraphData;
      const updatedNode = updatedData.nodes.find(n => n.id === 'char-partial-1');

      // Position should be preserved
      expect(updatedNode?.position).toEqual({ x: 150, y: 250 });
      
      // Custom metadata should be preserved
      expect(updatedNode?.data.metadata.customField).toBe('preserved');
      
      // Entity should be updated
      expect((updatedNode?.data.entity as Character).name).toBe('Alice Updated');
    });
  });
});