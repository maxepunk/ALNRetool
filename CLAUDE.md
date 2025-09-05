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

# E2E Testing
npm run test:e2e           # Run Playwright tests
npm run test:e2e:debug     # Debug E2E tests
```

## Critical Architecture Patterns

### 1. Entity CRUD Flow
The system uses a factory pattern for consistent entity handling:
```
UI Component → useMutation hook → API client → Express router → Notion API
                    ↓                              ↓
            Optimistic Update              Entity Transform
                    ↓                              ↓
            Cache Update ← ← ← ← ← ← Server Response
```

**Key Files**:
- `/server/routes/notion/createEntityRouter.ts` - Factory that generates all CRUD endpoints
- `/src/hooks/mutations/entityMutations.ts` - Frontend mutation factory with optimistic updates
- `/src/types/notion/transforms.ts` - Pure transform functions (Notion → App entities)

### 2. Optimistic Updates & React 18 Batching

**Critical Issue**: React 18's automatic batching causes race conditions with fast server responses.

**Solution**: We use `setTimeout(0)` to create task boundaries between optimistic and server updates. This is architecturally correct - it leverages JavaScript's event loop to ensure optimistic updates render before server data arrives.

See detailed explanation in `/src/hooks/mutations/entityMutations.ts` lines 9-39.

### 3. Notion API Partial Response Handling

**Problem**: Notion's update endpoint returns only the properties sent in the request, not the complete entity.

**Solution**: The `smartMergeEntityUpdate` function in `/server/utils/entityMerger.ts` preserves unmodified fields by:
1. Fetching the complete entity before update
2. Applying partial updates from Notion's response
3. Intelligently merging to prevent data loss

### 4. Graph Visualization Pipeline

```
Notion Data → Backend Transform → Graph Builder → React Flow Nodes
                    ↓                   ↓              ↓
              Entity Objects      Relationships    Visual Graph
                                       ↓
                              Relationship Synthesizer
                              (Bidirectional Resolution)
```

**State Management**: Direct management in GraphView component (centralized state was abandoned in Sprint 2 to avoid React Flow conflicts).

### 5. Dual Caching Strategy

**Server Cache** (node-cache, 5min TTL):
- Reduces Notion API calls
- Handles rate limiting (100 req/min)
- Located in `/server/services/cache.ts`

**Client Cache** (TanStack Query):
- Optimistic updates
- Background refetching
- Stale-while-revalidate pattern

### 6. Filter & Visibility System

Three-layer filtering architecture:
1. **Data Filtering** (`filterStore.ts`) - Which entities to include
2. **Visibility Calculation** (`useGraphVisibility.ts`) - Depth-based visibility
3. **Layout Engine** (`useGraphLayout.ts`) - Dagre positioning

**Important**: Depth filtering ONLY applies when a node is selected.

## Critical Gotchas

### TypeScript Compilation
**NEVER** use `npx tsc` directly on files - it uses wrong config and shows phantom errors:
```bash
# ❌ WRONG - Will show false errors
npx tsc --noEmit src/hooks/mutations/entityMutations.ts

# ✅ CORRECT
npm run typecheck
```

### Known Issues
- **UPDATE mutations are currently broken** - Under active development
- **Auth middleware** requires Origin header to be localhost in development

### Environment Variables
Required in `.env`:
```bash
NOTION_API_KEY=your-token
NOTION_CHARACTERS_DB=database-id
NOTION_ELEMENTS_DB=database-id
NOTION_PUZZLES_DB=database-id
NOTION_TIMELINE_DB=database-id
```

## Key Architectural Decisions

1. **Factory Pattern for Routers**: All entity routers generated from single factory for consistency
2. **Pure Transform Functions**: Transforms have single responsibility - no merge logic
3. **Graph Context Pattern**: `GraphDataContext` provides entity lookup across all nodes
4. **Relationship Types**: ROLLUP vs RELATION fields require different update strategies
5. **Breaking Changes OK**: Internal tool for 2-3 users - prioritize code quality over stability

## Testing Philosophy

Three-tier approach:
1. **Behavioral Tests**: Contract specifications independent of implementation
2. **Unit Tests**: Realistic inputs matching runtime conditions  
3. **Integration Tests**: Full flow through MSW handlers

Test files use `.test.ts(x)` extension and run in isolated forks for safety.

## Current Work Tracking

- Active development: See `updateMutationFixes.md`
- Change history: See `CHANGELOG.md`