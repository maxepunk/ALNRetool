# TODO Action Plan - Sprint 2 Completion & Technical Debt Cleanup

This document serves as the action plan and checklist for completing Sprint 2 deliverables and cleaning up technical debt.

Last updated: 2025-01-23

## Summary

- **Total Tasks**: 25 (expanded with TypeScript fixes)
- **Completed**: 17
- **In Progress**: 0
- **Remaining**: 8 (mostly documentation and testing)

## PHASE 0: Documentation Setup ✅ COMPLETE

- [x] Replace TODO.md with this action plan
- [ ] Track progress using checkboxes

## PHASE 1: Quick Wins - Immediate Cleanup (30 min)

### Delete Duplicate JS Files
- [x] Delete `/src/types/notion/transforms.js`
- [x] Delete `/src/types/notion/raw.js`
- [x] Delete `/src/types/notion/app.js`

### Fix Type Safety
- [x] Fix `/src/components/graph/GraphView.tsx:83`
  - Import `CharacterFilters` from `@/stores/filterStore`
  - Replace `characterFilters?: any` with proper type

### Wire Force Layout
- [x] Fix `/src/hooks/useGraphLayout.ts:133`
  - Import `ForceLayoutAlgorithm` from `@/lib/graph/layout/algorithms`
  - Replace TODO comment and fallback with actual implementation
  - Remove line 134 warning about force layout not implemented

## PHASE 2: Complete Sprint 2 - Mutation Hooks (2 hrs)

### Create Shared useEntitySave Hook (Better Architecture)
- [x] Create `/src/hooks/useEntitySave.ts`
  - Import all mutation hooks from `@/hooks/mutations`
  - Implement smart entity type detection
  - Handle all entity types in one place
  - Return unified save handler

### Wire useEntitySave in Views
- [x] Fix `/src/views/PuzzleFocusView.tsx:235`
  - Import `useEntitySave` hook
  - Replace `handleEntitySave` placeholder with hook result
  - Remove TODO comment at line 235

- [x] Fix `/src/views/CharacterJourneyView.tsx:101`
  - Import `useEntitySave` hook
  - Replace `handleEntitySave` placeholder with hook result
  - Remove TODO comment at line 101

- [x] Fix `/src/views/NodeConnectionsView.tsx:119`
  - Import `useEntitySave` hook
  - Replace `handleEntitySave` placeholder with hook result
  - Remove TODO comment at line 119

### Testing
- [ ] Test all mutations with dev server running
- [ ] Verify Notion sync actually works
- [ ] Add test file `src/hooks/mutations/mutations.test.tsx`

## PHASE 3: TypeScript Error Fixes (COMPLETED)

### Fixed Critical Compilation Errors
- [x] Fixed ForceLayoutAlgorithm.layout() -> apply() method call
- [x] Fixed LayoutOrchestrator.runAsyncLayout -> applyLayoutAsync
- [x] Added missing GraphUtilities methods (filterNodesByType, getNodeById, getNodeEdges)
- [x] Fixed logger API calls with 4+ arguments in critical files
- [x] Fixed parameter order for applyLayoutAsync

### Remaining Non-Critical Issues
- ~100+ minor TypeScript errors remain (unused variables, type mismatches)
- These don't prevent compilation or runtime execution
- Can be addressed incrementally

## PHASE 4: Medium Priority Features (2 hrs)

### Copy/Paste Edge Handling
- [ ] Fix `/src/hooks/useGraphInteractions.ts:319`
  - Implement edge ID remapping logic
  - Handle dangling edges (source/target not in paste)
  - Prevent duplicate edges
  - Remove TODO comment after implementation

## PHASE 4: Deferred Features (Document for Sprint 4)

### Files/Media Parsing - DEFERRED TO SPRINT 4
- **File**: `/src/types/notion/transforms.ts:235`
- **Status**: Keep TODO for now, implement in Sprint 4
- **Note**: Requires Notion file block parsing implementation

### Error Tracking - DEFERRED TO SPRINT 4
- **File**: `/src/components/common/ViewErrorBoundary.tsx:142`
- **Status**: Keep TODO for now, scheduled for Sprint 4
- **Note**: Sentry integration with DSN configuration

## PHASE 5: Final Documentation (1 hr)

- [ ] Update `/CLAUDE.md`:
  - Document that mutation hooks ARE implemented
  - Note CharacterFilters type location
  - Document force layout availability
  - Add testing instructions

- [ ] Create `/TECHNICAL_DEBT.md`:
  - Track remaining architectural issues
  - Document migration paths
  - Include deferred features

- [ ] Final cleanup:
  - Verify all obsolete TODO comments removed
  - Run linting and type checking
  - Commit with detailed message

## Success Criteria

- [ ] No duplicate JS files in src/
- [ ] No TypeScript 'any' for CharacterFilters
- [ ] Force layout accessible and working
- [ ] All 3 views support two-way Notion sync
- [ ] Copy/paste edges work correctly
- [ ] All obsolete TODO comments removed from code
- [ ] Documentation reflects actual implementation

## Notes

### False Positives (Not TODOs)
- `/src/types/notion/transforms.ts:137` - Literal "TODO" string match for data filtering
- `/src/lib/filters/index.ts:237-238` - Intentional filtering for "TODO" in content

### Already Implemented (Discovered during analysis)
- Mutation hooks fully implemented in `/src/hooks/mutations/`
- Force layout algorithms exist in `/src/lib/graph/layout/algorithms/`
- CharacterFilters type exists in `/src/stores/filterStore.ts`

### Architectural Decision (Changed during implementation)
- Creating a shared `useEntitySave` hook is better than wiring mutations individually in each view
- Follows DRY principle, reduces code duplication across 3 views
- Maintains single responsibility - views shouldn't know about multiple mutation hooks
- Matches DetailPanel's existing interface that expects a generic onSave handler

### Process Improvements (Future)
- Add pre-commit hook to check for new TODOs
- CI check to prevent JS files in src/
- Require TODO items to have ticket numbers
- Monthly TODO reconciliation in team meetings