Objective (from Step 1)

  Identify all codebase locations that use entity mutation hooks to ensure the unified hook solution is comprehensively applied, preventing partial fixes that could leave some code paths with the bug or inefficiency.

  Validated Context (from Steps 4-7)

  - All mutation hook consumers identified: CreatePanel, DetailPanel, useEntitySave, plus 4 test files and 2 test mock files
  - createEntityMutation factory already exists and generates all current hooks
  - EntityType, MutationType, Entity types already defined and exported
  - No Rules of Hooks violations with our approach
  - Cache key unification will fix the bug without breaking features
  - Delete mutations also need to be included in the update

   Complete Step-by-Step Action Plan

  STEP 1: Fix Cache Key & Add Unified Hook

  File: src/hooks/mutations/entityMutations.ts

  1. Remove viewStore import (line 46):
  // DELETE: import { useViewStore } from '@/stores/viewStore';
  2. Fix cache key (lines 204-209):
  // DELETE lines 204-206:
  // const currentViewType = useViewStore.getState().currentViewType;
  // const queryKey = ['graph', 'complete', currentViewType];
  // console.log('[DEBUG] Mutation queryKey:', queryKey, 'view:', currentViewType);

  // REPLACE WITH (line 204):
  const queryKey = ['graph', 'complete'];
  3. Export factory & add unified hook (after line 194, before existing hooks):
  // Export the factory for the unified hook
  export { createEntityMutation };

  // Unified hook that replaces all 18 individual hooks
  export function useEntityMutation(
    entityType: EntityType,
    mutationType: MutationType,
    options?: MutationOptions
  ) {
    return createEntityMutation(entityType, mutationType)(options);
  }
  4. DELETE all individual hooks (lines 842-926):
    - Delete ALL 18 export statements from line 842 to 926

  STEP 2: Clean Mutations Index

  File: src/hooks/mutations/index.ts

  Replace ENTIRE file content with:
  /**
   * Entity Mutation Hooks
   * Provides a unified hook for all entity mutations
   */

  export {
    useEntityMutation,
    createEntityMutation,
    type EntityType,
    type MutationType,
    type Entity,
    type ParentRelationMetadata
  } from './entityMutations';

  STEP 3: Update CreatePanel

  File: src/components/CreatePanel.tsx

  1. Update import (line 10):
  // DELETE:
  import {
    useCreateCharacter,
    useCreateElement,
    useCreatePuzzle,
    useCreateTimelineEvent
  } from '@/hooks/mutations';

  // REPLACE WITH:
  import { useEntityMutation } from '@/hooks/mutations';
  2. Replace hook usage (lines 31-40):
  // DELETE lines 31-40:
  const createCharacter = useCreateCharacter();
  const createElement = useCreateElement();
  const createPuzzle = useCreatePuzzle();
  const createTimelineEvent = useCreateTimelineEvent();

  const createMutation =
    entityType === 'character' ? createCharacter :
    entityType === 'element' ? createElement :
    entityType === 'puzzle' ? createPuzzle :
    createTimelineEvent;

  // REPLACE WITH:
  const createMutation = useEntityMutation(entityType, 'create');

  STEP 4: Update DetailPanel

  File: src/components/DetailPanel.tsx

  1. Update imports (lines 106-109):
  // DELETE:
  import {
    useUpdateCharacter,
    useUpdateElement,
    useUpdatePuzzle,
    useUpdateTimelineEvent,
    useDeleteCharacter,
    useDeleteElement,
    useDeletePuzzle,
    useDeleteTimelineEvent
  } from '@/hooks/mutations';

  // REPLACE WITH:
  import { useEntityMutation } from '@/hooks/mutations';
  2. Replace update hooks (lines 311-314):
  // DELETE:
  const updateCharacter = useUpdateCharacter();
  const updateElement = useUpdateElement();
  const updatePuzzle = useUpdatePuzzle();
  const updateTimeline = useUpdateTimelineEvent();

  // REPLACE WITH:
  const updateMutation = useEntityMutation(entityType, 'update');
  3. Replace delete hooks (find where delete hooks are used):
  // REPLACE all delete hook usages with:
  const deleteMutation = useEntityMutation(entityType, 'delete');

  STEP 5: Update useEntitySave

  File: src/hooks/useEntitySave.ts

  1. Update imports (line 40):
  // DELETE:
  import {
    useUpdateCharacter,
    useUpdateElement,
    useUpdatePuzzle,
    useUpdateTimelineEvent
  } from '@/hooks/mutations';

  // REPLACE WITH:
  import { useEntityMutation, type EntityType } from '@/hooks/mutations';
  2. Replace hook usage (lines 86-89):
  // DELETE the switch statement for mutation selection
  // REPLACE WITH dynamic hook based on entityType from formData

  STEP 6: Update Test Mocks

  File: src/components/CreatePanel.test.tsx
  // Update mock (lines 19-35):
  vi.mock('@/hooks/mutations', () => ({
    useEntityMutation: vi.fn((entityType, mutationType) => ({
      mutateAsync:
        entityType === 'character' ? mockCreateCharacter :
        entityType === 'element' ? mockCreateElement :
        entityType === 'puzzle' ? mockCreatePuzzle :
        mockCreateTimeline,
      isPending: false
    }))
  }));

  File: src/hooks/useEntitySave.test.ts
  // Update mock similarly to use useEntityMutation

  STEP 7: Update Integration Tests

  File: src/test/integration/entity-mutations-behavior.test.tsx
  1. Update all imports to use useEntityMutation
  2. Change all 9 occurrences of ['graph', 'complete', 'test-view'] to ['graph', 'complete']
  3. Update renderHook calls:
  const { result } = renderHook(
    () => useEntityMutation('character', 'create'),
    { wrapper }
  );

  File: src/hooks/mutations/bug7.test.ts
  1. Update to use useEntityMutation('element', 'delete')
  2. Update cache keys

  STEP 8: Test & Verify

  npm run typecheck
  npm run test:run
  npm run dev  # Check console logs reduced from 164 to ~4

  This plan removes ~100 lines of redundant code and creates a single, maintainable API!