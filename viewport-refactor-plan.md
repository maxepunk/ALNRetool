# Viewport Management Refactor Plan

## Executive Summary
**Goal**: Eliminate 4 competing viewport management systems, implement intelligent initial positioning, and provide predictable user control.

**Current State**: 
- 4 competing systems causing race conditions
- ~400 lines of complex code
- Auto-fits on every state change (poor UX)
- Shows all 200+ nodes initially (overwhelming)

**Target State**:
- Single unified system (~100 lines)
- Shows 10-20 most connected nodes initially  
- Auto-fits only on major changes (>50% nodes)
- User-controlled viewport with persistence

---

## Implementation Plan

### Phase 1: Analysis & Baseline Documentation
**Status**: [ ] Not Started | [X] In Progress | [ ] Complete

#### Tasks:
- [X] Map all viewport management code paths
- [X] Identify dependencies and conflicts
- [ ] Document current behavior (screenshots/video)
- [ ] Calculate graph metrics (typical node count, connection distribution)
- [ ] Create git branch for safe rollback

#### Validation Checkpoint 1.1:
- [ ] Confirmed all 4 viewport systems identified
- [ ] Dependencies mapped (only GraphView.tsx affected)
- [ ] Baseline metrics recorded

#### Discoveries:
- ViewportController uses useViewportManager internally (double-fitting)
- Race conditions between 100ms, 200ms, 300ms delays
- No tests depend on viewport behavior directly

#### Decision Log:
- DECIDED: Remove all auto-fitting except major changes
- DECIDED: Use connection density for initial view relevance
- DECIDED: Keep navigation history unchanged

---

### Phase 2: Remove Redundant Viewport Systems
**Status**: [ ] Not Started | [ ] In Progress | [ ] Complete

#### Tasks:
- [ ] Delete ViewportController component from GraphView.tsx (lines 110-152)
- [ ] Remove useViewportManager import and usage from GraphView.tsx
- [ ] Delete useViewportManager function from useGraphState.ts (lines 158-350)
- [ ] Simplify useGraphViewport - remove debouncing (lines 94-129)
- [ ] Run TypeScript check to catch broken imports

#### Code Removal Checklist:
```typescript
// GraphView.tsx - Remove these:
- import { useViewportManager } from '@/hooks/useGraphState'
- <ViewportController ... /> component
- manualViewportControls variable

// useGraphState.ts - Remove these:
- export function useViewportManager() { ... } // lines 158-350
- debounceTimeoutRef and related debouncing logic
- priority-based viewport management
```

#### Validation Checkpoint 2.1:
- [ ] TypeScript compilation successful
- [ ] No errors in browser console
- [ ] Graph still renders (even if viewport is wrong)

#### Expected Issues:
- UnifiedToolbar might reference removed viewport controls
- Need to preserve zoom button functionality

---

### Phase 3: Implement Smart Initial View
**Status**: [ ] Not Started | [ ] In Progress | [ ] Complete

#### Tasks:
- [ ] Create getInitialViewNodes utility function
- [ ] Add viewport persistence to sessionStorage
- [ ] Implement mount-only viewport positioning
- [ ] Add mobile detection for node count (10 vs 20)

#### Implementation:
```typescript
// New file: src/lib/graph/viewportUtils.ts
export function getInitialViewNodes(
  nodes: Node[], 
  edges: Edge[], 
  isMobile: boolean
): string[] {
  // 1. Try sessionStorage first
  const saved = sessionStorage.getItem('graph-viewport');
  if (saved) {
    const viewport = JSON.parse(saved);
    // Return viewport, not node IDs for saved state
    return viewport;
  }
  
  // 2. Calculate connection density
  const connections = new Map<string, number>();
  edges.forEach(edge => {
    connections.set(edge.source, (connections.get(edge.source) || 0) + 1);
    connections.set(edge.target, (connections.get(edge.target) || 0) + 1);
  });
  
  // 3. Sort by connections and return top N
  const sorted = [...nodes].sort((a, b) => 
    (connections.get(b.id) || 0) - (connections.get(a.id) || 0)
  );
  
  const count = isMobile ? 10 : 20;
  return sorted.slice(0, count).map(n => n.id);
}

export function saveViewport(viewport: Viewport) {
  sessionStorage.setItem('graph-viewport', JSON.stringify(viewport));
}
```

#### Validation Checkpoint 3.1:
- [ ] Initial load shows ~20 nodes (not 200+)
- [ ] High-connectivity nodes are centered
- [ ] Mobile shows fewer nodes (~10)

#### Validation Checkpoint 3.2:
- [ ] Viewport persists across page refresh
- [ ] Saved viewport restored correctly

---

### Phase 4: Add Smart Auto-Fit & User Controls
**Status**: [ ] Not Started | [ ] In Progress | [ ] Complete

#### Tasks:
- [ ] Implement conditional auto-fit (>50% node change)
- [ ] Add "Show All" button to UnifiedToolbar
- [ ] Connect manual zoom controls
- [ ] Add viewport save on user interaction

#### Implementation:
```typescript
// In GraphView.tsx
const prevNodeCount = useRef(0);
const hasInitialized = useRef(false);

// Smart auto-fit on major changes
useEffect(() => {
  const change = Math.abs(nodes.length - prevNodeCount.current);
  const threshold = prevNodeCount.current * 0.5;
  
  if (change > threshold && hasInitialized.current) {
    console.log(`Major change detected: ${prevNodeCount.current} → ${nodes.length}`);
    fitView({ padding: 0.2, duration: 400 });
  }
  
  prevNodeCount.current = nodes.length;
}, [nodes.length, fitView]);

// Save viewport on interaction
const handleMoveEnd = useCallback((event, viewport) => {
  saveViewport(viewport);
}, []);
```

#### Validation Checkpoint 4.1:
- [ ] Filtering 200→10 nodes triggers auto-fit
- [ ] Filtering 20→15 nodes does NOT trigger auto-fit
- [ ] "Show All" button fits entire graph
- [ ] Manual zoom controls work

---

### Phase 5: Integration Testing
**Status**: [ ] Not Started | [ ] In Progress | [ ] Complete

#### Test Scenarios:
- [ ] Initial load with 200+ nodes → Shows ~20 nodes
- [ ] Initial load on mobile → Shows ~10 nodes
- [ ] Apply heavy filter (200→5 nodes) → Auto-fits
- [ ] Apply light filter (20→18 nodes) → No auto-fit
- [ ] Select distant node → No auto-fit (manual zoom needed)
- [ ] Use [ and ] navigation → Changes selection, no viewport jump
- [ ] Click "Show All" → Fits entire graph
- [ ] Refresh page → Restores last viewport
- [ ] Clear sessionStorage → Falls back to high-connectivity nodes

#### Automated Test Validation:
```bash
- [ ] npm run typecheck - PASS
- [ ] npm run test:run - PASS
- [ ] npm run test:integration - PASS
- [ ] npm run lint - PASS
```

#### Performance Metrics:
- [ ] Initial render time: ___ms (target: <500ms)
- [ ] Viewport operations smooth at 60fps
- [ ] No console errors or warnings

---

### Phase 6: Cleanup & Documentation
**Status**: [ ] Not Started | [ ] In Progress | [ ] Complete

#### Tasks:
- [ ] Remove all unused imports
- [ ] Delete commented-out code
- [ ] Update inline documentation
- [ ] Document new viewport behavior in README
- [ ] Update CLAUDE.md with new patterns

#### Code Quality Checklist:
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] No unused variables/imports
- [ ] All functions have JSDoc comments
- [ ] Complex logic has inline comments

---

## Progress Tracking

### Lines of Code:
- **Before**: ~400 lines across 4 systems
- **Current**: ___ lines
- **Target**: <100 lines

### Complexity Metrics:
- **Before**: 4 competing useEffects, 3 debounce timers
- **Current**: ___ useEffects, ___ timers
- **Target**: 2 useEffects, 0 timers

### User Experience:
- **Before**: Viewport jumps on every change
- **Current**: ___
- **Target**: Viewport changes only on user action or major filter

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Tests break | Low | Medium | Tests mock fitView, shouldn't break |
| Performance regression | Low | High | Profile before/after |
| Lost viewport on refresh | Medium | Low | SessionStorage persistence |
| Users confused by new behavior | Medium | Medium | Add tooltip for "Show All" |

---

## Decision Log

| Date | Decision | Rationale | Outcome |
|------|----------|-----------|---------|
| Now | Remove all auto-fitting except major changes | Users report fighting against viewport | TBD |
| Now | Use connection density for initial nodes | Most connected = most important | TBD |
| Now | Keep navigation history as-is | Working feature, no issues | TBD |
| Now | 10 nodes mobile, 20 desktop | Screen size constraints | TBD |

---

## Discovery Log

| Phase | Discovery | Impact | Action |
|-------|-----------|--------|--------|
| 1 | ViewportController calls useViewportManager | Double-fitting bug | Remove both |
| 1 | 4 different delay timers competing | Race conditions | Remove all delays |
| 1 | Tests don't depend on viewport | Safe to refactor | Proceed |

---

## Final Validation

### Success Criteria:
- [ ] Single viewport implementation (<100 lines)
- [ ] No race conditions or competing timers
- [ ] Initial view shows 10-20 high-connectivity nodes
- [ ] Auto-fit only on major changes (>50% nodes)
- [ ] "Show All" button for full graph view
- [ ] All tests pass
- [ ] TypeScript compilation succeeds
- [ ] Better UX - no jarring viewport changes
- [ ] Viewport persists across refreshes

### Sign-off:
- [ ] Code reviewed
- [ ] Manually tested all scenarios
- [ ] Performance validated
- [ ] Documentation updated
- [ ] Ready to merge

---

## Notes Section
(Track ongoing thoughts, concerns, and ideas here)

- Consider adding viewport presets (e.g., "Overview", "Detail", "Focus")
- Might want to add animation preferences to settings
- Could add keyboard shortcut for "Show All" (maybe Cmd+0 like browsers?)