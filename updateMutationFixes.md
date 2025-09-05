Complete Cleanup & Fix Plan

     Problem Summary

     Root Cause Identified: Notion API returns only the properties we send in the update request. When we update just name, the response contains only name - not the complete page. Our transform functions then create entities with empty arrays for missing relationship fields, corrupting the cache.

     Current State Analysis

     1. Transform functions contaminated: Have inline merge logic violating single responsibility
     2. Dead code: entityMerger.ts created but never used
     3. Silent failures: When oldData fetch fails, we continue with data loss
     4. Working but messy: Current inline approach works but is unmaintainable

     Phase 1: Clean Technical Debt (Remove the Mess)

     1.1 Revert Transform Functions to Pure Mappers
     - File: /src/types/notion/transforms.ts
     - Remove ALL existingEntity parameters and conditional logic
     - Each transform becomes pure: NotionPage → Entity
     - Example fix for transformCharacter:
     // FROM (contaminated with merge logic):
     ownedElementIds: props[CharacterProperties.OWNED_ELEMENTS] !== undefined 
       ? getRelationIds(props[CharacterProperties.OWNED_ELEMENTS])
       : existingEntity?.ownedElementIds || [],

     // TO (pure transform):
     ownedElementIds: getRelationIds(props[CharacterProperties.OWNED_ELEMENTS]) || [],

     1.2 Remove Dead Code
     - Delete /server/utils/entityMerger.ts (unused, untested)
     - Remove relationshipFields from router configs (if unused)
     - Remove validateUpdate callbacks if not providing value

     Phase 2: Implement Proper Solution

     2.1 Create Tested Merge Utility
     - File: /server/utils/entityMerger.ts (NEW, properly tested)
     export function mergeEntityUpdate<T extends Entity>(
       oldEntity: T,
       partialUpdate: Partial<T>
     ): T {
       // Only overwrite fields present in partialUpdate
       // Preserve all fields not in the update
       const merged = { ...oldEntity };
       
       for (const key in partialUpdate) {
         if (partialUpdate[key] !== undefined) {
           merged[key] = partialUpdate[key];
         }
       }
       
       return merged;
     }

     2.2 Fix Update Flow in createEntityRouter
     - File: /server/routes/notion/createEntityRouter.ts
     - Line ~668-710 area

     // ALWAYS fetch old data for updates (required for merge)
     let oldData: any = null;
     if (config.inverseRelations || config.validateUpdate || true) { // Always for updates
       try {
         const oldPage = await notion.pages.retrieve({ 
           page_id: req.params.id 
         }) as NotionPage;
         oldData = config.transform(oldPage); // Pure transform
       } catch (error) {
         // FAIL the request - no silent data loss
         throw new AppError(
           500, 
           'FETCH_OLD_DATA_FAILED',
           'Unable to fetch current data for safe update'
         );
       }
     }

     // Update via Notion API
     const properties = config.toNotionProps!(req.body);
     const response = await notion.pages.update({
       page_id: req.params.id,
       properties
     }) as NotionPage;

     // Transform response (pure, no merge)
     const partialTransformed = config.transform(response);

     // Merge with old data to get complete entity
     const transformed = mergeEntityUpdate(oldData, partialTransformed);

     Phase 3: Add Safety & Testing

     3.1 Integration Tests
     - File: /src/test/integration/partial-update.test.ts (NEW)
     - Test each entity type with partial updates
     - Verify relationships preserved
     - Test error cases (oldData fetch failure)

     3.2 Unit Tests for Merge
     - File: /server/utils/entityMerger.test.ts (NEW)
     - Test merge with various partial updates
     - Edge cases: null, undefined, empty arrays
     - Type safety for each entity type

     Phase 4: Performance Optimization

     4.1 Conditional Old Data Fetching
     - Only fetch if updating relationships or computed fields
     - Track which fields trigger partial responses
     - Skip fetch for scalar-only updates (future optimization)

     4.2 Cache Old Data Within Request
     - If fetched for inverse relations, reuse for merge
     - Avoid duplicate API calls

     Phase 5: Documentation

     5.1 Document Why
     - Add comment explaining Notion's behavior
     - Document merge strategy  
     - Warn about performance impact

     Success Criteria

     ✅ Transform functions are pure (single responsibility restored)
     ✅ Merge happens in router using dedicated utility
     ✅ No silent data loss (request fails if oldData unavailable)
     ✅ Full test coverage for merge scenarios
     ✅ Clear documentation of Notion API behavior

     Implementation Order

     1. Clean: Revert transforms (remove existingEntity logic)
     2. Test: Create entityMerger with full test suite
     3. Fix: Update router to use merge utility
     4. Verify: Integration tests for partial updates
     5. Document: Explain the solution

     Risk Mitigation

     - Each step independently testable
     - Current working code preserved until new solution verified
     - Can rollback transforms independently of router changes
     - Performance impact measured before/after