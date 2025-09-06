# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ALNRetool is a visualization and editing tool for the "About Last Night" murder mystery game. It provides an interactive graph interface for managing characters, puzzles, story elements, and timeline events stored in Notion databases.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, React Flow (@xyflow/react), Zustand, TanStack Query v5
- **Backend**: Express.js v5, TypeScript, Notion API client
- **Testing**: Vitest, Playwright, MSW for API mocking
- **Styling**: Tailwind CSS v4, Framer Motion

## Development Commands

```bash
# Development
npm run dev                # Start both client (port 5173) and server (port 3001)
npm run dev:client         # Start only Vite client
npm run dev:server         # Start only Express server

# Building
npm run build              # Build both client and server
npm start                  # Start production server

# Code Quality
npm run lint               # Run ESLint
npm run typecheck          # Run TypeScript type checking

# Testing
npm test                   # Run tests in watch mode
npm run test:run           # Run all tests once with 4GB memory allocation
npm run test:coverage      # Run with coverage (80% threshold enforced)

# Run Specific Tests
npx vitest run src/components/CreatePanel.test.tsx    # Single file
npx vitest src/hooks/mutations                        # Pattern match

# Batch Testing (runs without coverage for speed)
npm run test:batch:components   # Test all components
npm run test:batch:hooks        # Test all hooks
npm run test:batch:lib          # Test all lib modules
npm run test:batch:all          # Run all batches sequentially

# E2E Testing
npm run test:e2e           # Run Playwright tests
npm run test:e2e:ui        # Interactive UI mode
npm run test:e2e:debug     # Debug E2E tests
npm run test:e2e:headed    # Run with visible browser

# Integration & Smoke Tests
npm run test:smoke         # Quick health check
npm run test:integration   # Full integration suite
```

## Intentional Design Patterns (DO NOT "FIX")

These patterns may appear problematic but are deliberate architectural decisions:

1. **Multiple API Calls in Inverse Relations**: The `updateInverseRelations` function creates many Notion API calls in parallel. This is SAFE because all calls go through the Bottleneck-limited client (3 req/sec).

2. **Throwing Errors on Delta Failures**: Delta generation failures intentionally crash the request to ensure cache consistency. The primary operation succeeded, but we fail loudly to prevent UI inconsistencies.

## Critical Architecture Patterns

### 1. MutationPipelineV3 Pattern
All entity mutations use a unified `useEntityMutation` hook with:
- Optimistic updates via `pendingMutationCount` on nodes/edges
- Atomic rollback through snapshot restoration
- Concurrent mutation safety for same entity
- React Query v5 lifecycle (onMutate/onError/onSettled)

```typescript
// Location: src/hooks/mutations/entityMutations.ts
const mutation = useEntityMutation({
  entityType: 'character',
  mutationType: 'UPDATE',
  onSuccess: (data) => { /* handle success */ }
});
```

### 2. Graph State Management
- **Nodes**: Character, Element, Puzzle, Timeline nodes with unique visual representations
- **Edges**: Relationship edges with optimistic state tracking
- **Filtering**: Multi-tier filter system with depth controls
- **Layout**: Dagre layout with force simulation for positioning

### 3. Query Key Patterns
Standardized query keys for cache management:
```typescript
['graph', 'full']                   // Full graph data
['characters', 'all']                // All entities of type
['character', id]                    // Single entity
['synthesized', characterId]        // Synthesized relationships
```

### 4. Transform Pipeline
Data flows through pure transform functions:
```
Notion API → Raw Data → Transform → App Types → Graph Nodes → UI
```
Each transform has single responsibility, no merge logic in transforms.

## Critical Gotchas

### TypeScript Compilation
**NEVER** use `npx tsc` directly on files - it uses wrong config and shows phantom errors:
```bash
# ❌ WRONG - Will show false errors
npx tsc --noEmit src/hooks/mutations/entityMutations.ts

# ✅ CORRECT
npm run typecheck
```

### Test Execution Memory
Tests require 4GB memory allocation:
```bash
# Already configured in npm run test:run
NODE_OPTIONS='--max-old-space-size=4096' vitest run
```

### API Rate Limiting (NO ACTION NEEDED)
**IMPORTANT**: Inverse relation updates in `createEntityRouter` may appear to make many API calls, but they're automatically protected by Bottleneck rate limiting. Do NOT add additional rate limiting or worry about hitting Notion's limits - this is already handled in `server/services/notion.ts`.

### Delta Generation Failures are INTENTIONAL
When you see `throw new Error('Delta generation failed')` in `createEntityRouter.ts`, this is BY DESIGN. The comment "CHANGED: Make delta failures visible instead of silent" indicates this was a deliberate choice to prevent silent cache inconsistencies. Do NOT change this to return success with error indicators.

### Known Issues
- **Auth middleware** requires Origin header to be localhost in development
- **React Flow** excluded from optimizeDeps to avoid bundling issues
- **Circular dependencies** warnings from React Flow are suppressed (expected)

## Environment Variables
Required in `.env`:
```bash
NOTION_API_KEY=your-token            # Notion integration token
NOTION_CHARACTERS_DB=database-id     # Characters database ID
NOTION_ELEMENTS_DB=database-id       # Elements database ID  
NOTION_PUZZLES_DB=database-id        # Puzzles database ID
NOTION_TIMELINE_DB=database-id       # Timeline database ID
```

## Key Architectural Decisions

1. **Factory Pattern for Routers**: All entity routers generated from `createEntityRouter` factory for consistency
2. **Pure Transform Functions**: Transforms have single responsibility - no merge logic
3. **Relationship Types**: ROLLUP vs RELATION fields from Notion require different update strategies
4. **Breaking Changes OK**: Internal tool for 2-3 users - prioritize code quality over backward compatibility
5. **Optimistic Updates**: All mutations show immediate UI feedback with automatic rollback on failure
6. **Unified Counter Approach**: Single `pendingMutationCount` pattern for tracking optimistic state
7. **Automatic Rate Limiting**: Notion API calls are automatically rate-limited via Bottleneck (3 req/sec) in `server/services/notion.ts`
8. **Intentional Delta Failures**: Delta generation errors intentionally fail requests for visibility (not silent degradation)
9. **Inverse Relations Protected**: Bidirectional updates in `createEntityRouter` use the same rate-limited client

## Testing Philosophy

Three-tier approach:
1. **Behavioral Tests**: Contract specifications independent of implementation
2. **Unit Tests**: Realistic inputs matching runtime conditions  
3. **Integration Tests**: Full flow through MSW handlers

Test files use `.test.ts(x)` extension and run in isolated forks for safety.

### Coverage Requirements
- 80% minimum for branches, functions, lines, and statements
- Coverage reports in text, JSON, and HTML formats
- Build fails if thresholds not met

## File Organization

```
src/
├── components/         # UI components (graph, filters, panels)
├── hooks/             # Custom React hooks
│   └── mutations/     # Mutation hooks with optimistic updates
├── lib/               # Core business logic
│   └── graph/         # Graph construction and layout
├── services/          # API clients and external services
├── stores/            # Zustand state stores
├── types/             # TypeScript type definitions
│   └── notion/        # Notion API types and transforms
└── test/              # Test utilities and mocks

server/
├── routes/            # Express route handlers
│   └── notion/        # Entity-specific routers
├── services/          # Backend services (cache, Notion client)
└── utils/             # Server utilities
```

## Current Work Tracking

- Active development: See recent commits in git log
- Change history: See `docs/CHANGELOG.md`
- Architecture details: See `docs/ARCHITECTURE.md`

## Development Tips

1. **Always run typecheck before committing** - catches issues ESLint misses
2. **Use factory patterns** - When adding new entity types, extend existing factories
3. **Test optimistic updates** - Ensure pendingMutationCount is properly managed
4. **Watch for race conditions** - Multiple mutations on same entity need careful handling
5. **Profile performance** - Graph with 100+ nodes should remain responsive

## Precommit Validation Notes

When running precommit validation, be aware that external tools may flag the following as issues when they are actually intentional:

- **"API rate limiting risk"** - Already handled by Bottleneck in `server/services/notion.ts`
- **"Delta generation failures"** - Intentionally fail requests for visibility
- **"Too many Promise.allSettled calls"** - Rate limited by Bottleneck, safe to run in parallel

Always verify against this document before making "fixes" to these patterns.