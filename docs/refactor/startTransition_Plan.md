Implementation Plan: Pure React 18 Solution for Race Condition

  Overview

  This is a CLEAN implementation with NO compromises, NO workarounds, and NO technical
  debt. We're fixing the optimistic update race condition using React 18's
  startTransition.

  ---
  Phase 1: Clean Slate Preparation

  Step 1: Create Branch and Backup

  git checkout -b fix/race-condition-react18-clean
  git stash  # Save any uncommitted work

  Step 2: Remove ALL Technical Debt

  File: src/hooks/mutations/entityMutations.ts
  - DELETE lines 368-376 (entire 50ms delay block)
  - DELETE line 341 (optimisticStartTime: Date.now())
  - DELETE lines 341-342 (OPTIMISTIC FIX comment)

  File: src/types/mutations.ts
  - DELETE line 54 (optimisticStartTime?: number;)

  Step 3: Verify Clean State

  npm run typecheck  # Must pass
  npm run lint       # Must pass

  ---
  Phase 2: Implement React 18 Solution

  Step 4: Add React 18 Import

  // At top of entityMutations.ts
  import { startTransition } from 'react';

  Step 5: Implement startTransition in onSuccess

  onSuccess: async (data, variables, context) => {
    const ctx = context as MutationContext;
    const responseData: any = data && typeof data === 'object' ? data : {};
    const hasDelta = responseData.delta;

    if (hasDelta) {
      // React 18: Ensure optimistic update renders before applying delta
      startTransition(() => {
        try {
          const strategy = determineCacheStrategy(responseData.delta, false);
          const updater = getCacheUpdater(strategy);

          const updateContext: CacheUpdateContext = {
            queryClient,
            queryKey: ctx.queryKey,
            strategy,
            entity: responseData.data,
            delta: responseData.delta,
            operation: mutationType as 'create' | 'update' | 'delete',
            tempId: ctx.tempId,
            previousState: ctx.previousGraphData
          };

          updater.update(updateContext);
          console.log(`[Delta] Applied with React 18 startTransition`);
        } catch (error) {
          console.warn(`[Delta] Failed to apply, using fallback:`, error);
          applySelectiveUpdate(ctx, responseData.data);
        }
      });
    } else {
      console.warn(`[Delta] Missing. Using selective update.`);
      startTransition(() => {
        applySelectiveUpdate(ctx, responseData.data);
      });
    }

    // Toast and callbacks outside startTransition
    const entityName = responseData.data?.name || variables?.name;
    toast.success(`${mutationType === 'create' ? 'Created' : 'Updated'} ${entityName}`);
    options?.onSuccess?.(data, variables, context);
  }

  Step 6: Add AbortController Support

  // In MutationContext interface
  interface MutationContext {
    abortController: AbortController;
    // ... existing fields
  }

  // In onMutate
  const abortController = new AbortController();

  // In mutationFn - pass signal to API calls
  const response = await apiModule.create(payload, {
    signal: abortController.signal
  });

  // Add onSettled for cleanup
  onSettled: (data, error, variables, context) => {
    const ctx = context as MutationContext;
    ctx?.abortController?.abort();
    options?.onSettled?.(data, error, variables, context);
  }

  Step 7: Implement Selective Field Updates

  function applySelectiveUpdate(ctx: MutationContext, entity: any) {
    queryClient.setQueryData(ctx.queryKey, (oldData: any) => {
      if (!oldData) return oldData;

      const nodes = [...oldData.nodes];
      const nodeIndex = nodes.findIndex(n => n.id === entity.id || n.id === ctx.tempId);

      if (nodeIndex !== -1) {
        const oldNode = nodes[nodeIndex];
        nodes[nodeIndex] = {
          ...oldNode,
          data: {
            ...oldNode.data,
            entity: { ...oldNode.data.entity, ...entity },
            label: entity.name || oldNode.data.label,
            metadata: {
              ...oldNode.data.metadata,
              isOptimistic: false
            }
          }
        };
      }

      return { ...oldData, nodes };
    });
  }

  ---
  Phase 3: Testing & Validation

  Step 8: Update Existing Tests

  File: src/test/integration/entity-mutations-behavior.test.tsx
  - Remove ALL delay(50) calls
  - Update expectations to check for isOptimistic: true immediately
  - No artificial waits or delays

  Step 9: Create Race Condition Tests

  New File: src/hooks/mutations/entityMutations.race.test.ts
  describe('Race Condition Tests', () => {
    test('handles 0ms server response correctly', async () => {
      // Mock immediate response
      // Verify optimistic state renders
      // Verify final state is correct
    });

    test('handles rapid successive mutations', async () => {
      // Fire multiple mutations
      // All should show optimistic states
    });

    test('cleans up on component unmount', async () => {
      // Start mutation
      // Unmount immediately
      // No console errors
    });
  });

  Step 10: Manual Testing Protocol

  1. Start dev server: npm run dev
  2. Test CREATE - must see immediate visual feedback
  3. Test UPDATE - must see immediate change
  4. Test DELETE - must see immediate removal
  5. Check console for any errors

  ---
  Phase 4: Documentation & Final Cleanup

  Step 11: Add Documentation Header

  /**
   * Entity Mutation Factory with React 18 Race Condition Solution
   * 
   * Solution: React 18's startTransition
   * - onMutate sets optimistic data synchronously
   * - Server may respond in same event loop tick
   * - startTransition delays cache updates
   * - React renders optimistic state first (guaranteed)
   * - Then processes server response
   * 
   * NO artificial delays, NO workarounds, NO technical debt.
   */

  Step 12: Final Validation Checklist

  [ ] All 50ms delays removed
  [ ] startTransition wraps ALL cache updates
  [ ] AbortController prevents memory leaks
  [ ] Selective updates preserve data integrity
  [ ] Tests pass without artificial delays
  [ ] No TypeScript errors
  [ ] No console errors during manual testing
  [ ] CHANGELOG.md updated

  Step 13: Commit

  git add -A
  git commit -m "fix: implement React 18 startTransition for optimistic update race 
  condition

  - Remove all 50ms delay workarounds
  - Use startTransition to ensure optimistic renders
  - Add AbortController for proper cleanup
  - Implement selective field updates
  - Add comprehensive race condition tests

  This is a CLEAN solution with zero technical debt."

  ---
  Key Implementation Points

  What We're Doing

  - Using React 18's startTransition to guarantee optimistic updates render first
  - Adding proper cleanup with AbortController
  - Implementing selective field updates to preserve flags
  - Creating comprehensive tests without workarounds

  What We're NOT Doing

  - NO 50ms delays anywhere
  - NO hybrid solutions
  - NO fallback workarounds
  - NO technical debt

  Success Criteria

  - Optimistic updates ALWAYS visible (even with 0ms server response)
  - Clean, maintainable code
  - All tests pass without artificial delays
  - No memory leaks