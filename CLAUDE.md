# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ALNRetool is a visualization and editing tool for the "About Last Night" murder mystery game. It provides an interactive graph interface for managing characters, puzzles, story elements, and timeline events stored in Notion databases.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, React Flow (@xyflow/react), Zustand, TanStack Query v5
- **Backend**: Express.js v5, TypeScript, Notion API client with Bottleneck rate limiting
- **Testing**: Vitest (unit/integration), Playwright (E2E), MSW for API mocking
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
npm run lint               # Run ESLint with type-aware rules
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

# Schema Management
npm run schema:fetch       # Fetch latest Notion database schemas
```

## Critical Architecture Patterns

### 1. MutationPipelineV3 Pattern
All entity mutations use a unified `useEntityMutation` hook with:
- Optimistic updates via `pendingMutationCount` on nodes/edges
- Atomic rollback through snapshot restoration
- Concurrent mutation safety using unique mutation IDs
- React Query v5 lifecycle (onMutate/onError/onSettled)

```typescript
// Location: src/hooks/mutations/entityMutations.ts
const mutation = useEntityMutation({
  entityType: 'character',
  mutationType: 'UPDATE',
  onSuccess: (data) => { /* handle success */ }
});
```

### 2. Factory Pattern for Entity Routers
All entity routers are generated from `createEntityRouter` factory:
- Consistent REST endpoints across all entity types
- Automatic caching with configurable TTL
- Inverse relation updates for bidirectional relationships
- Delta generation for optimistic UI updates

### 3. Graph State Management
- **Nodes**: Character, Element, Puzzle, Timeline nodes with unique visual representations
- **Edges**: Relationship edges with optimistic state tracking
- **Filtering**: Multi-tier filter system with depth controls (acts 1-3, focus mode)
- **Layout**: Dagre layout with force simulation for positioning

### 4. Query Key Patterns
Standardized query keys for cache management:
```typescript
['graph', 'full']                   // Full graph data
['characters', 'all']                // All entities of type
['character', id]                    // Single entity
['synthesized', characterId]        // Synthesized relationships
```

### 5. Transform Pipeline
Data flows through pure transform functions:
```
Notion API → Raw Data → Transform → App Types → Graph Nodes → UI
```
Each transform has single responsibility, no merge logic in transforms.

### 6. Store Architecture (Zustand)
- **filterStore**: Multi-layer filtering with acts, depth, and focus mode
- **viewStore**: Graph viewport and zoom state
- **creationStore**: UI state for entity creation panels
- **uiStore**: General UI state (sidepanel, tooltips)

## Intentional Design Patterns (DO NOT "FIX")

1. **Multiple API Calls in Inverse Relations**: The `updateInverseRelations` function creates many Notion API calls in parallel. This is SAFE because all calls go through the Bottleneck-limited client (3 req/sec).

2. **Throwing Errors on Delta Failures**: Delta generation failures intentionally crash the request to ensure cache consistency. The primary operation succeeded, but we fail loudly to prevent UI inconsistencies.

3. **Breaking Changes OK**: Internal tool for 2-3 users - prioritize code quality over backward compatibility.

4. **React Flow Excluded from optimizeDeps**: React Flow is excluded from Vite's dependency optimization to avoid bundling issues. Circular dependency warnings from React Flow are expected and suppressed.

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

### API Rate Limiting
Notion API calls are automatically rate-limited via Bottleneck (3 req/sec) in `server/services/notion.ts`. Do NOT add additional rate limiting.

### Delta Generation Failures
When you see `throw new Error('Delta generation failed')` in `createEntityRouter.ts`, this is BY DESIGN to prevent silent cache inconsistencies.

### ESLint Security Rule
Direct `process.env` access is forbidden in server code (except server/config/*). Use the centralized config module from `server/config/index.js` for all environment variables.

### Vitest Pool Configuration
Tests run in forked processes with isolation for safety. Maximum 4 parallel processes configured to balance speed and memory usage.

## Environment Variables
Required in `.env`:
```bash
NOTION_API_KEY=your-token            # Notion integration token
NOTION_CHARACTERS_DB=database-id     # Characters database ID
NOTION_ELEMENTS_DB=database-id       # Elements database ID  
NOTION_PUZZLES_DB=database-id        # Puzzles database ID
NOTION_TIMELINE_DB=database-id       # Timeline database ID

# Optional
PORT=3001                            # Server port (default: 3001)
NODE_ENV=development                 # Environment (development/production)
API_KEY=your-api-key                 # API authentication key
CACHE_TTL=300                        # Cache TTL in seconds (default: 300)
ADMIN_KEY=admin-key                 # Required for cache clear in production
FRONTEND_URL=https://domain.com     # Production frontend URL for CORS
```

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
│   └── notion/        # Entity-specific routers via createEntityRouter factory
├── services/          # Backend services (cache, Notion client)
├── config/            # Centralized configuration (only place process.env allowed)
└── utils/             # Server utilities

scripts/               # Utility scripts for testing and debugging
tests/
└── e2e/              # Playwright E2E tests
```

## Testing Philosophy

Three-tier approach:
1. **Behavioral Tests**: Contract specifications independent of implementation
2. **Unit Tests**: Realistic inputs matching runtime conditions  
3. **Integration Tests**: Full flow through MSW handlers

Coverage requirements: 80% minimum for branches, functions, lines, and statements.

## Playwright E2E Configuration

- Runs with `npm run test:e2e`
- Chromium by default, slow-network variant for testing degraded conditions
- 1920x1080 viewport for consistent graph rendering
- Automatic server startup with 2-minute timeout
- Video/screenshot capture on failure

## Development Tips

1. **Always run typecheck before committing** - catches issues ESLint misses
2. **Use factory patterns** - When adding new entity types, extend existing factories
3. **Test optimistic updates** - Ensure pendingMutationCount is properly managed
4. **Watch for race conditions** - Multiple mutations on same entity need careful handling
5. **Profile performance** - Graph with 100+ nodes should remain responsive
6. **Use batch testing** - Run specific test suites without coverage for speed during development
7. **Respect rate limits** - All Notion API calls automatically throttled to 3 req/sec