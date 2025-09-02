# H6 Implementation Plan: Granular Cache Invalidation

## Architecture Overview
```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Client    │────▶│  PUT Handler │────▶│  Synthesizer│
│  (mutation) │     │              │     │             │
└─────────────┘     └──────┬───────┘     └──────┬──────┘
                           │                     │
                           ▼                     ▼
                    ┌──────────────┐      ┌─────────────┐
                    │ Delta Calc   │◀─────│  New State  │
                    │  (compare)   │      └─────────────┘
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ Return Delta │
                    │  to Client   │
                    └──────────────┘
```

## Phase 1: Server Delta Infrastructure

### Task 1: Create Delta Types
**File**: `/server/types/delta.ts` (NEW)
**Code**:
```typescript
export interface GraphDelta {
  entity: any;
  changes: {
    nodes: {
      updated: any[];
      created: any[];
      deleted: string[];
    };
    edges: {
      created: any[];
      deleted: string[];
    };
  };
}

export interface DeltaCalculatorResult {
  delta: GraphDelta;
  performanceMs: number;
}
```
**Verification**: `npx tsc server/types/delta.ts --noEmit`
**Dependencies**: None

### Task 2: Create Delta Calculator Service
**File**: `/server/services/deltaCalculator.ts` (NEW)
**Code**:
```typescript
import type { GraphDelta } from '../types/delta.js';

export class DeltaCalculator {
  calculateGraphDelta(
    oldNodes: any[], 
    newNodes: any[],
    oldEdges: any[],
    newEdges: any[],
    updatedEntity: any
  ): GraphDelta {
    const start = performance.now();
    
    // Node changes
    const nodeChanges = {
      updated: [] as any[],
      created: [] as any[],
      deleted: [] as string[]
    };
    
    // Find updated and new nodes
    const oldNodeMap = new Map(oldNodes.map(n => [n.id, n]));
    const newNodeMap = new Map(newNodes.map(n => [n.id, n]));
    
    for (const [id, newNode] of newNodeMap) {
      const oldNode = oldNodeMap.get(id);
      if (!oldNode) {
        nodeChanges.created.push(newNode);
      } else if (JSON.stringify(oldNode) !== JSON.stringify(newNode)) {
        nodeChanges.updated.push(newNode);
      }
    }
    
    // Find deleted nodes
    for (const [id, _] of oldNodeMap) {
      if (!newNodeMap.has(id)) {
        nodeChanges.deleted.push(id);
      }
    }
    
    // Edge changes
    const edgeChanges = {
      created: [] as any[],
      deleted: [] as string[]
    };
    
    const oldEdgeSet = new Set(oldEdges.map(e => e.id));
    const newEdgeSet = new Set(newEdges.map(e => e.id));
    
    // New edges
    for (const edge of newEdges) {
      if (!oldEdgeSet.has(edge.id)) {
        edgeChanges.created.push(edge);
      }
    }
    
    // Deleted edges
    for (const edge of oldEdges) {
      if (!newEdgeSet.has(edge.id)) {
        edgeChanges.deleted.push(edge.id);
      }
    }
    
    console.log(`Delta calculation took ${performance.now() - start}ms`);
    
    return {
      entity: updatedEntity,
      changes: {
        nodes: nodeChanges,
        edges: edgeChanges
      }
    };
  }
}

export const deltaCalculator = new DeltaCalculator();
```
**Verification**: `npx tsc server/services/deltaCalculator.ts --noEmit`
**Dependencies**: Task 1

### Task 3: Create Graph State Capturer
**File**: `/server/services/graphStateCapture.ts` (NEW)
**Code**:
```typescript
import { graphBuilder } from './graphBuilder.js';
import { cacheService } from './cache.js';

export async function captureGraphState(entityId: string, entityType: string) {
  // Try cache first
  const cacheKey = `graph_state_${entityType}_${entityId}`;
  const cached = cacheService.get(cacheKey);
  if (cached) return cached;
  
  // Build current graph state
  const graphData = await graphBuilder.buildCompleteGraph();
  
  // Extract relevant portion
  const relevantNodes = graphData.nodes.filter(n => 
    n.id === entityId || 
    n.data?.connections?.includes(entityId)
  );
  
  const relevantEdges = graphData.edges.filter(e =>
    e.source === entityId ||
    e.target === entityId ||
    relevantNodes.some(n => n.id === e.source || n.id === e.target)
  );
  
  const state = { nodes: relevantNodes, edges: relevantEdges };
  cacheService.set(cacheKey, state, 60); // 1 minute TTL
  
  return state;
}
```
**Verification**: `npx tsc server/services/graphStateCapture.ts --noEmit`
**Dependencies**: Task 1, Task 2

## Phase 2: Integration with Handlers

### Task 4: Import Delta Services
**File**: `/server/routes/notion/createEntityRouter.ts`
**Line**: 10 (after imports)
**Code**:
```typescript
// OLD: (no delta imports)

// NEW:
import { deltaCalculator } from '../../services/deltaCalculator.js';
import { captureGraphState } from '../../services/graphStateCapture.js';
import type { GraphDelta } from '../../types/delta.js';
```
**Verification**: `grep -n "deltaCalculator" server/routes/notion/createEntityRouter.ts`
**Dependencies**: Tasks 1-3

### Task 5: Capture Old State Before Mutation
**File**: `/server/routes/notion/createEntityRouter.ts`  
**Line**: 373 (in PUT handler, after let oldData)
**Code**:
```typescript
// OLD:
let oldData: any = null;

// NEW:
let oldData: any = null;
let oldGraphState: any = null;

// Capture graph state for delta calculation
try {
  oldGraphState = await captureGraphState(req.params.id, config.entityName);
} catch (error) {
  log.warn('Failed to capture old graph state', { 
    entityId: req.params.id,
    error: error instanceof Error ? error.message : String(error)
  });
}
```
**Verification**: `grep -n "oldGraphState" server/routes/notion/createEntityRouter.ts`
**Dependencies**: Task 4

### Task 6: Calculate Delta After Mutation
**File**: `/server/routes/notion/createEntityRouter.ts`
**Line**: 409-430 (replace cache invalidation)
**Code**:
```typescript
// OLD (lines 409-430):
// Invalidate caches for this entity
cacheService.invalidatePattern(`${config.entityName}_${req.params.id}`);
cacheService.invalidatePattern(`${config.entityName}:*`);
// Invalidate graph cache to ensure graph reflects updates
cacheService.invalidatePattern('graph_complete*');
// ... more invalidation
res.json(transformed);

// NEW:
// Calculate delta if we have old state
let response: any = transformed;

if (oldGraphState) {
  try {
    // Get new graph state
    const newGraphState = await captureGraphState(req.params.id, config.entityName);
    
    // Calculate delta
    const delta = deltaCalculator.calculateGraphDelta(
      oldGraphState.nodes,
      newGraphState.nodes,
      oldGraphState.edges,
      newGraphState.edges,
      transformed
    );
    
    response = delta;
    
    // Only invalidate entity-specific cache
    cacheService.invalidatePattern(`${config.entityName}_${req.params.id}`);
  } catch (error) {
    log.error('Delta calculation failed, falling back to full invalidation', {
      entityId: req.params.id,
      error: error instanceof Error ? error.message : String(error)
    });
    // Fallback to old behavior
    cacheService.invalidatePattern('graph_complete*');
  }
} else {
  // No old state, fall back to invalidation
  cacheService.invalidatePattern('graph_complete*');
}

res.json(response);
```
**Verification**: Run server and check PUT response contains `changes` field
**Dependencies**: Tasks 4-5

## Phase 3: Client-Side Application

### Task 7: Update Mutation Response Type
**File**: `/src/hooks/mutations/entityMutations.ts`
**Line**: 50 (add interface)
**Code**:
```typescript
// NEW (add after imports):
interface DeltaResponse {
  entity: any;
  changes?: {
    nodes: {
      updated: any[];
      created: any[];
      deleted: string[];
    };
    edges: {
      created: any[];
      deleted: string[];
    };
  };
}
```
**Verification**: `npx tsc --noEmit`
**Dependencies**: None

### Task 8: Apply Delta to Cache
**File**: `/src/hooks/mutations/entityMutations.ts`
**Line**: 190-210 (in onSuccess, replace invalidation)
**Code**:
```typescript
// OLD:
// Invalidate graph to reflect relationship changes
await queryClient.invalidateQueries({ 
  queryKey: ['graph', 'complete'] 
});

// NEW:
// Apply delta if available, otherwise invalidate
const result = data as DeltaResponse;
if (result.changes) {
  queryClient.setQueryData(['graph', 'complete'], (old: any) => {
    if (!old) return old;
    
    const newNodes = [...old.nodes];
    const newEdges = [...old.edges];
    
    // Apply node updates
    result.changes!.nodes.updated.forEach(node => {
      const idx = newNodes.findIndex(n => n.id === node.id);
      if (idx >= 0) newNodes[idx] = node;
    });
    
    // Add new nodes
    result.changes!.nodes.created.forEach(node => {
      if (!newNodes.find(n => n.id === node.id)) {
        newNodes.push(node);
      }
    });
    
    // Remove deleted nodes
    result.changes!.nodes.deleted.forEach(nodeId => {
      const idx = newNodes.findIndex(n => n.id === nodeId);
      if (idx >= 0) newNodes.splice(idx, 1);
    });
    
    // Apply edge changes
    result.changes!.edges.created.forEach(edge => {
      if (!newEdges.find(e => e.id === edge.id)) {
        newEdges.push(edge);
      }
    });
    
    result.changes!.edges.deleted.forEach(edgeId => {
      const idx = newEdges.findIndex(e => e.id === edgeId);
      if (idx >= 0) newEdges.splice(idx, 1);
    });
    
    return { ...old, nodes: newNodes, edges: newEdges };
  });
} else {
  // Fallback to invalidation
  await queryClient.invalidateQueries({ 
    queryKey: ['graph', 'complete'] 
  });
}
```
**Verification**: Make an update and verify no graph refetch in Network tab
**Dependencies**: Task 7

### Task 9: Update Entity Cache with Delta
**File**: `/src/hooks/mutations/entityMutations.ts`
**Line**: 175 (in onSuccess, update entity cache)
**Code**:
```typescript
// OLD:
queryClient.setQueryData([entityType, data.id], data);

// NEW:
const deltaData = (data as DeltaResponse).entity || data;
queryClient.setQueryData([entityType, deltaData.id], deltaData);
```
**Verification**: Entity detail panel shows updated data
**Dependencies**: Task 7

## Phase 4: Testing & Verification

### Task 10: Create Delta Calculator Unit Test
**File**: `/server/services/deltaCalculator.test.ts` (NEW)
**Code**:
```typescript
import { describe, it, expect } from 'vitest';
import { deltaCalculator } from './deltaCalculator';

describe('DeltaCalculator', () => {
  it('detects node updates', () => {
    const oldNodes = [{ id: '1', name: 'Old' }];
    const newNodes = [{ id: '1', name: 'New' }];
    
    const delta = deltaCalculator.calculateGraphDelta(
      oldNodes, newNodes, [], [], { id: '1' }
    );
    
    expect(delta.changes.nodes.updated).toHaveLength(1);
    expect(delta.changes.nodes.updated[0].name).toBe('New');
  });
  
  it('detects edge creation and deletion', () => {
    const oldEdges = [{ id: 'e1', source: '1', target: '2' }];
    const newEdges = [{ id: 'e2', source: '1', target: '3' }];
    
    const delta = deltaCalculator.calculateGraphDelta(
      [], [], oldEdges, newEdges, { id: '1' }
    );
    
    expect(delta.changes.edges.deleted).toContain('e1');
    expect(delta.changes.edges.created).toHaveLength(1);
  });
  
  it('calculates in under 100ms for 1000 nodes', () => {
    const nodes = Array.from({ length: 1000 }, (_, i) => ({
      id: `n${i}`,
      data: { value: Math.random() }
    }));
    
    const start = performance.now();
    deltaCalculator.calculateGraphDelta(
      nodes, nodes, [], [], { id: 'test' }
    );
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(100);
  });
});
```
**Verification**: `npm test deltaCalculator.test.ts`
**Dependencies**: Tasks 1-2

### Task 11: Create E2E Performance Test
**File**: `/tests/e2e/delta-performance.spec.ts` (NEW)
**Code**:
```typescript
import { test, expect } from '@playwright/test';

test('applies delta without graph refetch', async ({ page }) => {
  let graphFetches = 0;
  
  // Monitor graph API calls
  await page.route('**/api/graph/data', async route => {
    graphFetches++;
    await route.continue();
  });
  
  // Load page (initial fetch)
  await page.goto('/');
  await page.waitForSelector('[data-testid^="node-"]');
  expect(graphFetches).toBe(1);
  
  // Make an update
  await page.click('[data-testid="node-char-1"]');
  await page.fill('[name="name"]', 'Updated Name');
  await page.click('[data-testid="save-button"]');
  
  // Wait for update to complete
  await page.waitForResponse(resp => 
    resp.url().includes('/api/notion/characters') && 
    resp.status() === 200
  );
  
  // Verify no additional graph fetch
  await page.waitForTimeout(1000);
  expect(graphFetches).toBe(1); // Still only initial
  
  // Verify UI updated
  await expect(page.locator('[data-testid="node-char-1"]'))
    .toContainText('Updated Name');
});

test('measures >80% network reduction', async ({ page }) => {
  let totalBytes = 0;
  
  await page.route('**/*', async route => {
    const response = await route.fetch();
    const body = await response.body();
    totalBytes += body.length;
    await route.fulfill({ response });
  });
  
  // Baseline: Force full refetch
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('use_delta', 'false');
  });
  await page.click('[data-testid="refresh"]');
  const baselineBytes = totalBytes;
  
  // Test: Use delta
  totalBytes = 0;
  await page.evaluate(() => {
    localStorage.setItem('use_delta', 'true');
  });
  await page.click('[data-testid="node-char-1"]');
  await page.fill('[name="name"]', 'Delta Test');
  await page.click('[data-testid="save-button"]');
  
  const deltaBytes = totalBytes;
  const reduction = (1 - deltaBytes / baselineBytes) * 100;
  
  expect(reduction).toBeGreaterThan(80);
  console.log(`Network reduction: ${reduction.toFixed(1)}%`);
});
```
**Verification**: `npm run test:e2e delta-performance.spec.ts`
**Dependencies**: Tasks 1-9

### Task 12: Update Integration Test
**File**: `/src/hooks/mutations/entityMutations.test.ts`
**Line**: Add new test at end
**Code**:
```typescript
describe('Delta Application', () => {
  it('applies delta without invalidating graph', async () => {
    const mockDelta = {
      entity: { id: 'char-1', name: 'Updated' },
      changes: {
        nodes: { 
          updated: [{ id: 'char-1', name: 'Updated' }],
          created: [],
          deleted: []
        },
        edges: { created: [], deleted: [] }
      }
    };
    
    mockUpdateCharacter.mockResolvedValue(mockDelta);
    
    const { result } = renderHook(() => useUpdateCharacter());
    
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const setDataSpy = vi.spyOn(queryClient, 'setQueryData');
    
    await act(async () => {
      await result.current.mutateAsync({ 
        id: 'char-1', 
        name: 'Updated' 
      });
    });
    
    // Should apply delta, not invalidate
    expect(setDataSpy).toHaveBeenCalledWith(
      ['graph', 'complete'],
      expect.any(Function)
    );
    expect(invalidateSpy).not.toHaveBeenCalledWith({
      queryKey: ['graph', 'complete']
    });
  });
});
```
**Verification**: `npm test entityMutations.test.ts`
**Dependencies**: Tasks 7-9

## Success Metrics

| Metric | Target | Verification |
|--------|--------|--------------|
| Graph refetches after mutation | 0 | E2E test Task 11 |
| Network traffic reduction | >80% | Performance test Task 11 |
| Delta calculation time | <100ms | Unit test Task 10 |
| Existing tests pass | 100% | `npm test` |
| No visual glitches | None | Manual testing |

## Rollback Plan

If issues arise, revert by:
1. Remove delta calculation from PUT handler (Task 6)
2. Restore cache invalidation patterns
3. Remove client-side delta application (Task 8)

Feature flag option: Check `process.env.USE_DELTA_UPDATES` to toggle behavior.