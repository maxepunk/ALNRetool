/**
 * Tests for Cache Update Utilities
 * 
 * Tests all three cache update strategies:
 * - DeltaCacheUpdater (incremental updates)
 * - OptimisticCacheUpdater (manual updates)
 * - InvalidateCacheUpdater (full refetch)
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import type { GraphDelta } from '../../../server/types/delta';
import type { Character } from '@/types/notion/app';
import { createMockElement } from '@/test/utils/factories';
import {
  DeltaCacheUpdater,
  OptimisticCacheUpdater,
  InvalidateCacheUpdater,
  getCacheUpdater,
  determineCacheStrategy,
  measureCacheUpdate,
  type CachedGraphData,
  type CacheUpdateContext
} from './updaters';

// Mock logger to reduce noise in tests
vi.mock('@/utils/logger', () => ({
  log: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

describe('Cache Updaters', () => {
  let queryClient: QueryClient;
  const QUERY_KEY = ['graph', 'complete', 'test-view'];
  
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
    vi.clearAllMocks();
    // Reset console mocks
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  // Helper to create test entities
  const createTestCharacter = (id: string = 'char-1'): Character => ({
    id,
    name: 'Test Character',
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
    emotionTowardsCEO: 'Neutral'
  });

  // Helper to create test cache data
  const createCacheData = (nodeId: string = 'char-1'): CachedGraphData => ({
    nodes: [{
      id: nodeId,
      type: 'character',
      position: { x: 0, y: 0 },
      data: {
        label: 'Test Character',
        entity: createTestCharacter(nodeId),
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
  });

  describe('DeltaCacheUpdater', () => {
    let updater: DeltaCacheUpdater;
    
    beforeEach(() => {
      updater = new DeltaCacheUpdater();
    });

    describe('CREATE operation with temp IDs', () => {
      it('should replace temp node with real ID from delta', async () => {
        // Setup: Cache with temp node
        const tempId = `temp-${Date.now()}`;
        const realId = 'char-real-1';
        const initialData = createCacheData(tempId);
        queryClient.setQueryData(QUERY_KEY, initialData);

        // Create delta with real entity
        const delta: GraphDelta = {
          changes: {
            nodes: {
              created: [{
                id: realId,
                type: 'character',
                position: { x: 0, y: 0 },
                data: {
                  label: 'Test Character',
                  entity: createTestCharacter(realId),
                  metadata: { entityType: 'character' }
                }
              }],
              updated: [],
              deleted: []
            },
            edges: {
              created: [],
              updated: [],
              deleted: []
            }
          }
        };

        // Execute update
        const createdNode = delta.changes.nodes.created[0]!;
        const nodeEntity = createdNode.data.entity;
        if (!nodeEntity) {
          throw new Error('Test setup error: created node must have entity');
        }
        const context: CacheUpdateContext = {
          queryClient,
          queryKey: QUERY_KEY,
          strategy: 'delta',
          entity: nodeEntity,
          delta,
          tempId,
          operation: 'create',
        };

        await updater.update(context);

        // Verify temp node was replaced
        const updatedData = queryClient.getQueryData(QUERY_KEY) as CachedGraphData;
        expect(updatedData.nodes).toHaveLength(1);
        expect(updatedData.nodes[0]!.id).toBe(realId);
        expect(updatedData.nodes.find(n => n.id === tempId)).toBeUndefined();
        
        // Verify console log was called
        expect(console.log).toHaveBeenCalledWith(
          expect.stringContaining(`[Delta] Replacing temp node ${tempId} with real ID ${realId}`)
        );
      });

      it('should update edges referencing temp ID (simple format)', async () => {
        // Setup: Cache with temp node and edges
        const tempId = `temp-${Date.now()}`;
        const realId = 'char-real-1';
        const otherId = 'char-other';
        
        const initialData: CachedGraphData = {
          nodes: [
            {
              id: tempId,
              type: 'character',
              position: { x: 0, y: 0 },
              data: {
                label: 'Temp Character',
                entity: createTestCharacter(tempId),
                metadata: { entityType: 'character' }
              }
            },
            {
              id: otherId,
              type: 'character',
              position: { x: 100, y: 0 },
              data: {
                label: 'Other Character',
                entity: createTestCharacter(otherId),
                metadata: { entityType: 'character' }
              }
            }
          ],
          edges: [
            {
              id: `e-${tempId}-${otherId}`,
              source: tempId,
              target: otherId,
              type: 'associates'
            },
            {
              id: `e-${otherId}-${tempId}`,
              source: otherId,
              target: tempId,
              type: 'owns'
            }
          ]
        };
        
        queryClient.setQueryData(QUERY_KEY, initialData);

        // Create delta
        const delta: GraphDelta = {
          changes: {
            nodes: {
              created: [{
                id: realId,
                type: 'character',
                position: { x: 0, y: 0 },
                data: {
                  label: 'Real Character',
                  entity: createTestCharacter(realId),
                  metadata: { entityType: 'character' }
                }
              }],
              updated: [],
              deleted: []
            },
            edges: {
              created: [],
              updated: [],
              deleted: []
            }
          }
        };

        // Execute update
        const createdNode = delta.changes.nodes.created[0]!;
        const nodeEntity = createdNode.data.entity;
        if (!nodeEntity) {
          throw new Error('Test setup error: created node must have entity');
        }
        const context: CacheUpdateContext = {
          queryClient,
          queryKey: QUERY_KEY,
          strategy: 'delta',
          entity: nodeEntity,
          delta,
          tempId,
          operation: 'create',
        };

        await updater.update(context);

        // Verify edges were updated
        const updatedData = queryClient.getQueryData(QUERY_KEY) as CachedGraphData;
        expect(updatedData.edges).toHaveLength(2);
        
        // Check first edge
        const edge1 = updatedData.edges.find(e => e.source === realId);
        expect(edge1).toBeDefined();
        expect(edge1!.id).toBe(`e-${realId}-${otherId}`);
        expect(edge1!.target).toBe(otherId);
        
        // Check second edge
        const edge2 = updatedData.edges.find(e => e.target === realId);
        expect(edge2).toBeDefined();
        expect(edge2!.id).toBe(`e-${otherId}-${realId}`);
        expect(edge2!.source).toBe(otherId);
        
        // Verify no edges reference temp ID
        expect(updatedData.edges.find(e => e.source === tempId || e.target === tempId)).toBeUndefined();
      });

      it('should update edges referencing temp ID (field-based format)', async () => {
        // Setup: Cache with temp node and field-based edges
        const tempId = `temp-${Date.now()}`;
        const realId = 'elem-real-1';
        const otherId = 'char-1';
        
        const initialData: CachedGraphData = {
          nodes: [
            {
              id: tempId,
              type: 'element',
              position: { x: 0, y: 0 },
              data: {
                label: 'Temp Element',
                entity: createMockElement({ id: tempId, name: 'Temp Element' }),
                metadata: { entityType: 'element' }
              }
            },
            {
              id: otherId,
              type: 'character',
              position: { x: 100, y: 0 },
              data: {
                label: 'Character',
                entity: createTestCharacter(otherId),
                metadata: { entityType: 'character' }
              }
            }
          ],
          edges: [
            {
              id: `e::${otherId}::ownedElementIds::${tempId}`,
              source: otherId,
              target: tempId,
              type: 'owns',
              data: { fieldKey: 'ownedElementIds' }
            },
            {
              id: `e::${tempId}::ownerId::${otherId}`,
              source: tempId,
              target: otherId,
              type: 'owned_by',
              data: { fieldKey: 'ownerId' }
            }
          ]
        };
        
        queryClient.setQueryData(QUERY_KEY, initialData);

        // Create delta
        const delta: GraphDelta = {
          changes: {
            nodes: {
              created: [{
                id: realId,
                type: 'element',
                position: { x: 0, y: 0 },
                data: {
                  label: 'Real Element',
                  entity: createMockElement({ id: realId, name: 'Real Element' }),
                  metadata: { entityType: 'element' }
                }
              }],
              updated: [],
              deleted: []
            },
            edges: {
              created: [],
              updated: [],
              deleted: []
            }
          }
        };

        // Execute update
        const createdNode = delta.changes.nodes.created[0]!;
        const nodeEntity = createdNode.data.entity;
        if (!nodeEntity) {
          throw new Error('Test setup error: created node must have entity');
        }
        const context: CacheUpdateContext = {
          queryClient,
          queryKey: QUERY_KEY,
          strategy: 'delta',
          entity: nodeEntity,
          delta,
          tempId,
          operation: 'create',
        };

        await updater.update(context);

        // Verify edges were updated with field-based format
        const updatedData = queryClient.getQueryData(QUERY_KEY) as CachedGraphData;
        expect(updatedData.edges).toHaveLength(2);
        
        // Check first edge
        const edge1 = updatedData.edges.find(e => e.source === otherId);
        expect(edge1).toBeDefined();
        expect(edge1!.id).toBe(`e::${otherId}::ownedElementIds::${realId}`);
        expect(edge1!.target).toBe(realId);
        
        // Check second edge
        const edge2 = updatedData.edges.find(e => e.source === realId);
        expect(edge2).toBeDefined();
        expect(edge2!.id).toBe(`e::${realId}::ownerId::${otherId}`);
        expect(edge2!.target).toBe(otherId);
      });
    });

    describe('UPDATE operation', () => {
      it('should apply node updates from delta', async () => {
        // Setup initial cache
        const initialData = createCacheData('char-1');
        queryClient.setQueryData(QUERY_KEY, initialData);

        // Create delta with updated node
        const updatedEntity = createTestCharacter('char-1');
        updatedEntity.name = 'Updated Character';
        
        const delta: GraphDelta = {
          changes: {
            nodes: {
              created: [],
              updated: [{
                id: 'char-1',
                type: 'character',
                position: { x: 0, y: 0 },
                data: {
                  label: 'Updated Character',
                  entity: updatedEntity,
                  metadata: { entityType: 'character' }
                }
              }],
              deleted: []
            },
            edges: {
              created: [],
              updated: [],
              deleted: []
            }
          }
        };

        // Execute update
        const testEntity = updatedEntity; // Use the entity from delta
        const context: CacheUpdateContext = {
          queryClient,
          queryKey: QUERY_KEY,
          strategy: 'delta',
          entity: testEntity,
          delta,
          operation: 'update',
        };

        await updater.update(context);

        // Verify node was updated
        const updatedData = queryClient.getQueryData(QUERY_KEY) as CachedGraphData;
        expect(updatedData.nodes).toHaveLength(1);
        expect(updatedData.nodes[0]!.data.entity.name).toBe('Updated Character');
        expect(updatedData.nodes[0]!.data.label).toBe('Updated Character');
      });

      it('should apply edge updates from delta', async () => {
        // Setup initial cache with edges
        const initialData: CachedGraphData = {
          ...createCacheData('char-1'),
          edges: [{
            id: 'e-char-1-char-2',
            source: 'char-1',
            target: 'char-2',
            type: 'associates'
          }]
        };
        queryClient.setQueryData(QUERY_KEY, initialData);

        // Create delta with updated edge
        const delta: GraphDelta = {
          changes: {
            nodes: {
              created: [],
              updated: [],
              deleted: []
            },
            edges: {
              created: [],
              updated: [{
                id: 'e-char-1-char-2',
                source: 'char-1',
                target: 'char-2',
                type: 'owns' // Changed type
              }],
              deleted: []
            }
          }
        };

        // Execute update
        const testEntity = createTestCharacter();
        const context: CacheUpdateContext = {
          queryClient,
          queryKey: QUERY_KEY,
          strategy: 'delta',
          entity: testEntity,
          delta,
          operation: 'update',
        };

        await updater.update(context);

        // Verify edge was updated
        const updatedData = queryClient.getQueryData(QUERY_KEY) as CachedGraphData;
        expect(updatedData.edges).toHaveLength(1);
        expect(updatedData.edges[0]!.type).toBe('owns');
      });

      it('should preserve unmodified relationships during UPDATE', async () => {
        // Setup entity with relationships
        const initialEntity = createTestCharacter('char-1');
        initialEntity.ownedElementIds = ['elem-1', 'elem-2'];
        initialEntity.associatedElementIds = ['elem-3', 'elem-4'];
        initialEntity.characterPuzzleIds = ['puzzle-1', 'puzzle-2'];
        initialEntity.name = 'Original Name';
        
        const initialData: CachedGraphData = {
          nodes: [{
            id: 'char-1',
            type: 'character',
            position: { x: 0, y: 0 },
            data: {
              label: 'Original Name',
              entity: initialEntity,
              metadata: { entityType: 'character', pendingMutationCount: 0 }
            }
          }],
          edges: [],
          metadata: {
            lastFetch: Date.now(),
            version: 1
          }
        };
        
        queryClient.setQueryData(QUERY_KEY, initialData);
        
        // Update only the name, not relationships
        const updatedEntity = { ...initialEntity };
        updatedEntity.name = 'Updated Name';
        // Note: relationships remain the same
        
        const delta: GraphDelta = {
          changes: {
            nodes: {
              created: [],
              updated: [{
                id: 'char-1',
                type: 'character',
                position: { x: 0, y: 0 },
                data: {
                  label: 'Updated Name',
                  entity: updatedEntity,
                  metadata: { entityType: 'character' }
                }
              }],
              deleted: []
            },
            edges: {
              created: [],
              updated: [],
              deleted: []
            }
          }
        };
        
        const context: CacheUpdateContext = {
          queryClient,
          queryKey: QUERY_KEY,
          strategy: 'delta',
          entity: updatedEntity,
          delta,
          operation: 'update',
        };
        
        await updater.update(context);
        
        const result = queryClient.getQueryData(QUERY_KEY) as CachedGraphData;
        const updatedNode = result.nodes[0]!;
        
        // Verify name was updated
        expect(updatedNode.data.entity.name).toBe('Updated Name');
        expect(updatedNode.data.label).toBe('Updated Name');
        
        // Verify relationships were preserved
        expect(updatedNode.data.entity.ownedElementIds).toEqual(['elem-1', 'elem-2']);
        expect(updatedNode.data.entity.associatedElementIds).toEqual(['elem-3', 'elem-4']);
        expect(updatedNode.data.entity.characterPuzzleIds).toEqual(['puzzle-1', 'puzzle-2']);
        
        // Verify UI state was preserved
        expect(updatedNode.data.metadata.pendingMutationCount).toBe(0);
      });

      it('should handle partial API response with preserved relationships from server merge', async () => {
        // CRITICAL TEST: This validates our server-side fix for partial updates
        // When Notion API returns only updated fields, our server merges with old data
        // The delta should contain the complete entity with preserved relationships
        
        // Setup: Cache with entity that has relationships
        const initialEntity = createTestCharacter('char-1');
        initialEntity.ownedElementIds = ['elem-1', 'elem-2'];
        initialEntity.associatedElementIds = ['elem-3'];
        initialEntity.characterPuzzleIds = ['puzzle-1'];
        initialEntity.name = 'Alice';
        
        const initialData: CachedGraphData = {
          nodes: [{
            id: 'char-1',
            type: 'character',
            position: { x: 0, y: 0 },
            data: {
              label: 'Alice',
              entity: initialEntity,
              metadata: { 
                entityType: 'character',
                pendingMutationCount: 0,
                isFocused: true // UI state to preserve
              }
            }
          }],
          edges: [
            { id: 'e::char-1::ownedElementIds::elem-1', source: 'char-1', target: 'elem-1', type: 'owns' },
            { id: 'e::char-1::ownedElementIds::elem-2', source: 'char-1', target: 'elem-2', type: 'owns' }
          ],
          metadata: { lastFetch: Date.now(), version: 1 }
        };
        
        queryClient.setQueryData(QUERY_KEY, initialData);
        
        // Simulate server response after partial update:
        // Server merged the partial update with old data to preserve relationships
        const mergedEntity = { ...initialEntity, name: 'Alice Updated' };
        
        // Delta from server contains complete entity (thanks to server-side merge)
        const delta: GraphDelta = {
          changes: {
            nodes: {
              created: [],
              updated: [{
                id: 'char-1',
                type: 'character',
                position: { x: 0, y: 0 },
                data: {
                  label: 'Alice Updated',
                  entity: mergedEntity, // Complete entity with preserved relationships
                  metadata: { entityType: 'character' }
                }
              }],
              deleted: []
            },
            edges: {
              created: [],
              updated: [],
              deleted: []
            }
          }
        };
        
        const context: CacheUpdateContext = {
          queryClient,
          queryKey: QUERY_KEY,
          strategy: 'delta',
          entity: mergedEntity,
          delta,
          operation: 'update',
        };
        
        await updater.update(context);
        
        const result = queryClient.getQueryData(QUERY_KEY) as CachedGraphData;
        const updatedNode = result.nodes[0]!;
        
        // Verify the update was applied
        expect(updatedNode.data.entity.name).toBe('Alice Updated');
        
        // CRITICAL: Verify relationships were preserved through server merge
        expect(updatedNode.data.entity.ownedElementIds).toEqual(['elem-1', 'elem-2']);
        expect(updatedNode.data.entity.associatedElementIds).toEqual(['elem-3']);
        expect(updatedNode.data.entity.characterPuzzleIds).toEqual(['puzzle-1']);
        
        // Verify edges remain unchanged
        expect(result.edges).toHaveLength(2);
        expect(result.edges[0]!.id).toBe('e::char-1::ownedElementIds::elem-1');
        expect(result.edges[1]!.id).toBe('e::char-1::ownedElementIds::elem-2');
        
        // Verify UI state was preserved
        expect(updatedNode.data.metadata.isFocused).toBe(true);
        expect(updatedNode.data.metadata.pendingMutationCount).toBe(0);
      });
    });

    describe('DELETE operation', () => {
      it('should remove deleted nodes and edges from cache', async () => {
        // Setup initial cache with multiple nodes and edges
        const initialData: CachedGraphData = {
          nodes: [
            createCacheData('char-1').nodes[0]!,
            createCacheData('char-2').nodes[0]!
          ],
          edges: [{
            id: 'e-char-1-char-2',
            source: 'char-1',
            target: 'char-2',
            type: 'associates'
          }],
          metadata: {
            lastFetch: Date.now(),
            version: 1
          }
        };
        queryClient.setQueryData(QUERY_KEY, initialData);

        // Create delta for deletion
        const delta: GraphDelta = {
          changes: {
            nodes: {
              created: [],
              updated: [],
              deleted: ['char-1']
            },
            edges: {
              created: [],
              updated: [],
              deleted: ['e-char-1-char-2']
            }
          }
        };

        // Execute update
        const testEntity = createTestCharacter();
        const context: CacheUpdateContext = {
          queryClient,
          queryKey: QUERY_KEY,
          strategy: 'delta',
          entity: testEntity,
          delta,
          operation: 'delete',
        };

        await updater.update(context);

        // Verify node and edge were removed
        const updatedData = queryClient.getQueryData(QUERY_KEY) as CachedGraphData;
        expect(updatedData.nodes).toHaveLength(1);
        expect(updatedData.nodes[0]!.id).toBe('char-2');
        expect(updatedData.edges).toHaveLength(0);
      });
    });

    describe('Fallback behavior', () => {
      it('should fallback to invalidation when delta is missing', async () => {
        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
        
        // Setup initial cache
        const initialData = createCacheData('char-1');
        queryClient.setQueryData(QUERY_KEY, initialData);

        // Execute update without delta
        const testEntity = createTestCharacter();
        const context: CacheUpdateContext = {
          queryClient,
          queryKey: QUERY_KEY,
          strategy: 'delta',
          entity: testEntity,
          delta: undefined, // No delta provided
          operation: 'update',
        };

        await updater.update(context);

        // Verify it fell back to invalidation
        expect(console.warn).toHaveBeenCalledWith(
          'No delta available, falling back to invalidation'
        );
        expect(invalidateSpy).toHaveBeenCalled();
      });

      it('should apply delta to filtered view without warnings', async () => {
        // Setup cache with filtered view key
        const filteredKey = ['graph', 'complete', 'characters-only'];
        const initialData = createCacheData('char-1');
        queryClient.setQueryData(filteredKey, initialData);

        // Create delta
        const delta: GraphDelta = {
          changes: {
            nodes: {
              created: [],
              updated: [],
              deleted: []
            },
            edges: {
              created: [],
              updated: [],
              deleted: []
            }
          }
        };

        // Execute update on filtered view
        const testEntity = createTestCharacter();
        const context: CacheUpdateContext = {
          queryClient,
          queryKey: filteredKey,
          strategy: 'delta',
          entity: testEntity,
          delta,
          operation: 'update',
        };

        await updater.update(context);

        // Verify update was applied successfully without warnings
        // DeltaCacheUpdater doesn't warn about filtered views - it applies updates silently
        const updatedData = queryClient.getQueryData(filteredKey) as CachedGraphData;
        expect(updatedData).toBeDefined();
        expect(console.warn).not.toHaveBeenCalled();
      });
    });

    describe('Rollback behavior', () => {
      it('should remove temp node for CREATE rollback', () => {
        const tempId = `temp-${Date.now()}`;
        
        // Setup cache with temp node
        const initialData: CachedGraphData = {
          nodes: [
            createCacheData('existing').nodes[0]!,
            {
              id: tempId,
              type: 'character',
              position: { x: 100, y: 0 },
              data: {
                label: 'Temp Character',
                entity: createTestCharacter(tempId),
                metadata: { entityType: 'character' }
              }
            }
          ],
          edges: [{
            id: `e-existing-${tempId}`,
            source: 'existing',
            target: tempId,
            type: 'associates'
          }]
        };
        queryClient.setQueryData(QUERY_KEY, initialData);

        // Execute rollback for CREATE operation
        const testEntity = createTestCharacter('char-1');
        const context: CacheUpdateContext = {
          queryClient,
          queryKey: QUERY_KEY,
          strategy: 'delta',
          entity: testEntity,
          tempId,
          operation: 'create',
          // No previousState needed for CREATE rollback
        };

        updater.rollback(context);

        // Verify temp node and edges were removed
        const rolledBack = queryClient.getQueryData(QUERY_KEY) as CachedGraphData;
        expect(rolledBack.nodes).toHaveLength(1);
        expect(rolledBack.nodes[0]!.id).toBe('existing');
        expect(rolledBack.edges).toHaveLength(0);
        
        // Should NOT fallback to invalidation for CREATE
        expect(console.warn).not.toHaveBeenCalledWith(
          'Delta rollback without previous state - falling back to invalidation'
        );
      });

      it('should rollback UPDATE/DELETE with previous state', () => {
        const previousState = createCacheData('char-1');
        
        // Modify cache to simulate failed update
        const modifiedData = {
          ...previousState,
          nodes: [{
            ...previousState.nodes[0]!,
            data: {
              ...previousState.nodes[0]!.data,
              label: 'Failed Update'
            }
          }]
        };
        queryClient.setQueryData(QUERY_KEY, modifiedData);

        // Execute rollback with previous state
        const testEntity = createTestCharacter();
        const context: CacheUpdateContext = {
          queryClient,
          queryKey: QUERY_KEY,
          strategy: 'delta',
          entity: testEntity,
          operation: 'update',
          previousState
        };

        updater.rollback(context);

        // Verify cache was restored to previous state
        const rolledBack = queryClient.getQueryData(QUERY_KEY) as CachedGraphData;
        expect(rolledBack.nodes[0]!.data.label).toBe('Test Character');
      });
    });
  });

  describe('OptimisticCacheUpdater', () => {
    let updater: OptimisticCacheUpdater;
    
    beforeEach(() => {
      updater = new OptimisticCacheUpdater();
    });

    it('should replace temp node with real entity on CREATE', async () => {
      const tempId = `temp-${Date.now()}`;
      const realId = 'char-real-1';
      
      // Setup cache with temp node
      const initialData = createCacheData(tempId);
      queryClient.setQueryData(QUERY_KEY, initialData);

      // Execute optimistic update
      const context: CacheUpdateContext = {
        queryClient,
        queryKey: QUERY_KEY,
        strategy: 'optimistic',
        entity: createTestCharacter(realId),
        tempId,
        operation: 'create',
      };

      await updater.update(context);

      // Verify temp node was replaced
      const updatedData = queryClient.getQueryData(QUERY_KEY) as CachedGraphData;
      expect(updatedData.nodes).toHaveLength(1);
      expect(updatedData.nodes[0]!.id).toBe(realId);
      expect(updatedData.nodes[0]!.data.entity.id).toBe(realId);
    });

    it('should update existing node on UPDATE', async () => {
      // Setup initial cache
      const initialData = createCacheData('char-1');
      queryClient.setQueryData(QUERY_KEY, initialData);

      // Create updated entity
      const updatedEntity = createTestCharacter('char-1');
      updatedEntity.name = 'Updated via Optimistic';

      // Execute optimistic update
      const context: CacheUpdateContext = {
        queryClient,
        queryKey: QUERY_KEY,
        strategy: 'optimistic',
        entity: updatedEntity,
        operation: 'update',
      };

      await updater.update(context);

      // Verify node was updated
      const updatedData = queryClient.getQueryData(QUERY_KEY) as CachedGraphData;
      expect(updatedData.nodes[0]!.data.entity.name).toBe('Updated via Optimistic');
    });

    it('should handle DELETE operation (no-op in optimistic)', async () => {
      // Setup initial cache
      const initialData = createCacheData('char-1');
      queryClient.setQueryData(QUERY_KEY, initialData);

      // Execute optimistic delete (should be no-op as it's handled elsewhere)
      const context: CacheUpdateContext = {
        queryClient,
        queryKey: QUERY_KEY,
        strategy: 'optimistic',
        entity: createTestCharacter('char-1'),
        operation: 'delete',
      };

      await updater.update(context);

      // Verify cache is unchanged (DELETE is handled optimistically elsewhere)
      const updatedData = queryClient.getQueryData(QUERY_KEY) as CachedGraphData;
      expect(updatedData).toEqual(initialData);
    });
  });

  describe('InvalidateCacheUpdater', () => {
    let updater: InvalidateCacheUpdater;
    
    beforeEach(() => {
      updater = new InvalidateCacheUpdater();
    });

    it('should invalidate graph queries', async () => {
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
      
      // Execute invalidation
      const context: CacheUpdateContext = {
        queryClient,
        queryKey: ['characters'],
        strategy: 'invalidate',
        entity: createTestCharacter('char-1'),
        operation: 'update',
      };

      await updater.update(context);

      // Verify invalidation was called
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['graph'],
        exact: false,
        refetchType: 'active'
      });
      
      // Verify entity-specific invalidation
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['characters'],
        exact: false
      });
    });

    it('should call update on rollback (no special rollback needed)', () => {
      const updateSpy = vi.spyOn(updater, 'update');
      
      const context: CacheUpdateContext = {
        queryClient,
        queryKey: QUERY_KEY,
        strategy: 'invalidate',
        entity: createTestCharacter('char-1'),
        operation: 'update',
      };

      updater.rollback(context);

      // Verify it just calls update again
      expect(updateSpy).toHaveBeenCalledWith(context);
    });
  });

  describe('Helper Functions', () => {
    describe('getCacheUpdater', () => {
      it('should return DeltaCacheUpdater for delta strategy', () => {
        const updater = getCacheUpdater('delta');
        expect(updater).toBeInstanceOf(DeltaCacheUpdater);
      });

      it('should return OptimisticCacheUpdater for optimistic strategy', () => {
        const updater = getCacheUpdater('optimistic');
        expect(updater).toBeInstanceOf(OptimisticCacheUpdater);
      });

      it('should return InvalidateCacheUpdater for invalidate strategy', () => {
        const updater = getCacheUpdater('invalidate');
        expect(updater).toBeInstanceOf(InvalidateCacheUpdater);
      });

      it('should default to InvalidateCacheUpdater for unknown strategy', () => {
        const updater = getCacheUpdater('unknown' as any);
        expect(updater).toBeInstanceOf(InvalidateCacheUpdater);
      });
    });

    describe('determineCacheStrategy', () => {
      it('should return delta when delta is provided', () => {
        const delta: GraphDelta = {
          changes: {
            nodes: { created: [], updated: [], deleted: [] },
            edges: { created: [], updated: [], deleted: [] }
          }
        };
        
        const strategy = determineCacheStrategy(delta, true);
        expect(strategy).toBe('delta');
      });

      it('should return optimistic when no delta but preferOptimistic is true', () => {
        const strategy = determineCacheStrategy(undefined, true);
        expect(strategy).toBe('optimistic');
      });

      it('should return invalidate when no delta and preferOptimistic is false', () => {
        const strategy = determineCacheStrategy(undefined, false);
        expect(strategy).toBe('invalidate');
      });
    });

    describe('measureCacheUpdate', () => {
      it('should measure update duration', async () => {
        const updater = new InvalidateCacheUpdater();
        
        const testEntity = createTestCharacter();
        const context: CacheUpdateContext = {
          queryClient,
          queryKey: QUERY_KEY,
          strategy: 'invalidate',
          entity: testEntity,
          operation: 'update',
        };

        const duration = await measureCacheUpdate(updater, context);
        
        // Duration should be a positive number
        expect(duration).toBeGreaterThanOrEqual(0);
        expect(duration).toBeLessThan(1000); // Should be fast
      });
    });
  });
});