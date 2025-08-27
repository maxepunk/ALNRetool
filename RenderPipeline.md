Plan for Entity Creation Issues

     Phase 1: Fix Critical Node Selection Issue (5 mins)

     File: src/components/CreatePanelPortal.tsx

     1. Fix the node ID format (line 83):
     onSuccess={async (entity) => {
       // Close panel first for smooth transition
       closeCreatePanel();
       
       // Small delay to ensure graph has processed the new entity
       setTimeout(() => {
         // Use correct node ID (just entity.id, not composite)
         const { setSelectedNode, setFocusedNode } = useFilterStore.getState();
         setSelectedNode(entity.id);
         setFocusedNode(entity.id);
       }, 100);
     }}

     Phase 2: Fix Parent Entity Cache Updates (10 mins)

     File: src/hooks/mutations/entityMutations.ts

     1. In the onSuccess handler for create mutations (line ~115), add parent cache update:
     if (mutationType === 'create') {
       // ... existing entity cache updates ...
       
       // If created with parent relation, update parent's cache
       const parentRelation = (variables as any)?._parentRelation;
       if (parentRelation) {
         const parentQueryKey = getQueryKeyForType(parentRelation.parentType as EntityType);
         queryClient.setQueryData<any[]>(parentQueryKey, (old) => {
           if (!old) return old;
           return old.map(item => {
             if (item.id === parentRelation.parentId) {
               const updated = { ...item };
               const field = parentRelation.fieldKey;
               const currentValue = updated[field];
               
               // Add new entity ID to parent's relation field
               if (Array.isArray(currentValue)) {
                 updated[field] = [...currentValue, entity.id];
               } else {
                 updated[field] = entity.id;
               }
               return updated;
             }
             return item;
           });
         });
         
         // Also update individual parent cache
         queryClient.setQueryData(
           [...parentQueryKey, parentRelation.parentId], 
           (old: any) => {
             if (!old) return old;
             const updated = { ...old };
             const field = parentRelation.fieldKey;
             const currentValue = updated[field];
             
             if (Array.isArray(currentValue)) {
               updated[field] = [...currentValue, entity.id];
             } else {
               updated[field] = entity.id;
             }
             return updated;
           }
         );
       }
     }

     Phase 3: Fix Response Wrapping (10 mins)

     File: src/hooks/mutations/entityMutations.ts

     1. Remove manual response wrapping (lines 103-107):
     // Instead of:
     return {
       data: result as T,
       message: `${entityType} ${mutationType}d successfully`
     };

     // Just return:
     return result as T;

     2. Update the mutation type signature to expect raw entity:
     return useMutation<T, MutationError, Partial<T> & ParentRelationMetadata>({
       // ... rest of mutation config
       onSuccess: async (entity, variables) => {
         // Use entity directly, not response.data
         const entityQueryKey = getQueryKeyForType(entityType);
         // ... rest of onSuccess
       }
     });

     3. Update CreatePanel.tsx (line 167) to handle raw entity:
     // Change from:
     onSuccess?.(result.data);
     // To:
     onSuccess?.(result);

     Phase 4: Consolidate Mutation Systems (15 mins)

     File: src/components/DetailPanel.tsx

     1. Remove old mutation imports (around line 30):
     // Remove these:
     // import { useUpdateCharacter, useUpdateElement, useUpdatePuzzle, useUpdateTimeline } from '@/hooks/mutations';

     2. Add new unified import:
     import { useEntityMutation } from '@/hooks/mutations/entityMutations';

     3. Replace the mutation hook usage (around line 225-240):
     // Remove the entire useMemo block and individual hooks
     // Replace with:
     const mutation = useEntityMutation(entityType as EntityType, 'update');

     Phase 5: Clean Up (5 mins)

     1. Remove console.log statements from src/stores/creationStore.ts (lines 81, 91)
     2. Verify TypeScript compilation:
     npx tsc --noEmit

     3. Test the flow:
     - Open detail panel for any entity
     - Click + to add a relation
     - Create new entity
     - Verify parent updates immediately
     - Verify new entity is selected in graph

     Summary

     This plan fixes the critical issues preventing entity creation from working properly:
     1. Corrects node ID format for auto-selection
     2. Implements missing parent cache updates for atomic creation
     3. Fixes response format handling to prevent double-wrapping
     4. Consolidates to single mutation system for consistency
     5. Adds proper timing for auto-selection to avoid race conditions

     Total implementation time: ~45 minutes