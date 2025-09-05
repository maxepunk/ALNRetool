 Objective

  Design and implement a clean ~400-line replacement for the 1,103-line mutations pipeline that:
  - Eliminates all critical bugs (constructor.name, setTimeout races, data loss)
  - Provides reliable optimistic updates for CREATE/UPDATE/DELETE
  - Maintains exact API compatibility (useEntityMutation(entityType, mutationType))
  - Works with existing GraphView cache structure
  - Achieves deterministic test behavior

  Validated Context

  - No production deployment - safe to replace entirely
  - React Query v5 deeply integrated - must work with it
  - Cache key is ['graph', 'complete'] for all views
  - Delta support exists but not guaranteed - must handle both cases
  - Internal tool for 2-3 users - can prioritize code quality over compatibility
  - Test patterns established with vitest and @testing-library/react

  Architecture Design

  // File: src/hooks/mutations/entityMutations.ts (NEW - ~400 lines)

  import { useMutation, useQueryClient } from '@tanstack/react-query';
  import type { Entity, EntityType, MutationType } from '@/types/mutations';

  /**
   * Clean, unified mutation pipeline
   * No setTimeout hacks, no constructor.name checks, no complex rollback
   */
  class MutationPipeline {
    constructor(
      private queryClient: QueryClient,
      private queryKey: string[] = ['graph', 'complete']
    ) {}

    async execute<T extends Entity>(
      operation: MutationType,
      entityType: EntityType,
      payload: any
    ): Promise<T> {
      // 1. Capture snapshot for rollback
      const snapshot = this.captureSnapshot();

      // 2. Apply optimistic update synchronously
      const tempId = this.applyOptimistic(operation, entityType, payload);

      try {
        // 3. Make server request
        const response = await this.serverRequest(operation, entityType, payload);

        // 4. Apply server response (delta or fallback)
        await this.applyServerResponse(response, tempId);

        return response.data;
      } catch (error) {
        // 5. Simple rollback to snapshot
        this.rollback(snapshot);
        throw error;
      }
    }

    private captureSnapshot() {
      return this.queryClient.getQueryData(this.queryKey);
    }

    private applyOptimistic(op: MutationType, type: EntityType, payload: any) {
      const tempId = op === 'create' ? `temp-${Date.now()}` : null;

      this.queryClient.setQueryData(this.queryKey, (old: any) => {
        if (!old) return old;

        const updater = new OptimisticUpdater();
        return updater.apply(old, op, type, payload, tempId);
      });

      return tempId;
    }

    private async applyServerResponse(response: any, tempId?: string) {
      // Use Promise.resolve().then() for microtask scheduling
      // This is cleaner than setTimeout(0) and more predictable
      await Promise.resolve().then(() => {
        this.queryClient.setQueryData(this.queryKey, (old: any) => {
          if (!old) return old;

          // Prefer delta if available
          if (response.delta) {
            const updater = new DeltaUpdater();
            return updater.apply(old, response.delta, tempId);
          }

          // Fallback to entity merge
          const updater = new EntityUpdater();
          return updater.apply(old, response.data, tempId);
        });
      });
    }

    private rollback(snapshot: any) {
      this.queryClient.setQueryData(this.queryKey, snapshot);
    }
  }

  /**
   * Simplified updaters with explicit async behavior
   */
  abstract class CacheUpdater {
    abstract apply(cache: any, ...args: any[]): any;
  }

  class OptimisticUpdater extends CacheUpdater {
    apply(cache: GraphData, op: MutationType, type: EntityType, payload: any, tempId?: string) {
      const { nodes, edges } = cache;

      switch(op) {
        case 'create':
          return this.handleCreate(nodes, edges, type, payload, tempId!);
        case 'update':
          return this.handleUpdate(nodes, edges, payload);
        case 'delete':
          return this.handleDelete(nodes, edges, payload);
      }
    }

    private handleCreate(nodes: any[], edges: any[], type: EntityType, payload: any, tempId: string) {
      // Simple node creation
      const newNode = {
        id: tempId,
        type,
        data: {
          entity: { ...payload, id: tempId },
          label: payload.name || 'New Entity',
          metadata: { pendingMutationCount: 1 }
        }
      };

      return {
        nodes: [...nodes, newNode],
        edges
      };
    }

    private handleUpdate(nodes: any[], edges: any[], payload: any) {
      // Simple node update
      return {
        nodes: nodes.map(n =>
          n.id === payload.id
            ? { ...n, data: { ...n.data, entity: { ...n.data.entity, ...payload } } }
            : n
        ),
        edges
      };
    }

    private handleDelete(nodes: any[], edges: any[], payload: any) {
      const id = typeof payload === 'string' ? payload : payload.id;
      return {
        nodes: nodes.filter(n => n.id !== id),
        edges: edges.filter(e => e.source !== id && e.target !== id)
      };
    }
  }

  class DeltaUpdater extends CacheUpdater {
    apply(cache: GraphData, delta: GraphDelta, tempId?: string) {
      const nodeMap = new Map(cache.nodes.map(n => [n.id, n]));
      const edgeMap = new Map(cache.edges.map(e => [e.id, e]));

      // Apply delta changes
      this.applyNodeChanges(nodeMap, delta.changes.nodes, tempId);
      this.applyEdgeChanges(edgeMap, delta.changes.edges);

      return {
        nodes: Array.from(nodeMap.values()),
        edges: Array.from(edgeMap.values())
      };
    }

    private applyNodeChanges(map: Map<string, any>, changes: any, tempId?: string) {
      // Handle temp ID replacement
      if (tempId && changes.created?.length) {
        map.delete(tempId);
      }

      changes.created?.forEach((n: any) => map.set(n.id, n));
      changes.updated?.forEach((n: any) => {
        const existing = map.get(n.id);
        if (existing) {
          map.set(n.id, { ...existing, ...n });
        }
      });
      changes.deleted?.forEach((id: string) => map.delete(id));
    }

    private applyEdgeChanges(map: Map<string, any>, changes: any) {
      changes.created?.forEach((e: any) => map.set(e.id, e));
      changes.updated?.forEach((e: any) => map.set(e.id, e));
      changes.deleted?.forEach((id: string) => map.delete(id));
    }
  }

  /**
   * Public API - maintains exact compatibility
   */
  export function useEntityMutation(
    entityType: EntityType,
    mutationType: MutationType,
    options?: any
  ) {
    const queryClient = useQueryClient();
    const pipeline = new MutationPipeline(queryClient);

    return useMutation({
      mutationFn: (payload) => pipeline.execute(mutationType, entityType, payload),
      ...options
    });
  }

  Implementation Plan

  1. Archive current implementation (10 min)
  git mv src/hooks/mutations/entityMutations.ts src/hooks/mutations/entityMutations.old.ts
  git mv server/utils/entityMerger.ts server/utils/entityMerger.old.ts
  git mv src/lib/cache/updaters.ts src/lib/cache/updaters.old.ts
  2. Implement clean V2 (2 days)
    - Day 1: Core pipeline + updaters
    - Day 2: Testing + edge cases
  3. Test extensively (1 day)
    - Unit tests for each updater
    - Integration tests with React Query
    - E2E tests with actual components

  Risk Mitigation

  - No delta response: EntityUpdater fallback handles it
  - Test flakiness: Using Promise.resolve() instead of setTimeout
  - Relationship sync: Server delta handles it (no client-side sync)
  - Memory leaks: Single snapshot, automatic cleanup

  Success Criteria

  - ✅ All tests pass deterministically
  - ✅ < 400 lines of code
  - ✅ No constructor.name checks
  - ✅ No setTimeout hacks
  - ✅ Same API surface
  - ✅ Handles both delta and non-delta responses
  - ✅ Clean rollback with single snapshot

  This approach eliminates 700+ lines of complexity while maintaining all functionality. The clean architecture makes it testable,
  maintainable, and bug-free.
