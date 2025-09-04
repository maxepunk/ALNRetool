# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ALNRetool is a visualization and editing tool for the "About Last Night" murder mystery game. It provides an interactive graph interface for managing characters, puzzles, story elements, and timeline events stored in Notion databases.

## Technical Documentation (READ to update your memory on MOST RECENT best practices)
- /docs/REACT_QUERY_V5_REACT_18.md

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, React Flow (@xyflow/react), Zustand, TanStack Query
- **Backend**: Express.js v5, TypeScript, Notion API client
- **Testing**: Vitest, Playwright, MSW for API mocking
- **Styling**: Tailwind CSS v4, Framer Motion
- **Data**: Notion API as primary database

## CRITICAL Considerations
- This is an INTERNAL TOOL. It will only be used by 2-3 users.
- IMPORTANT: THIS TOOL IS NOT IN PRODUCTION. **YOU CAN MAKE BREAKING CHANGES TO IMPROVE CODE QUALITY EFFICIENTLY**
- Relationship handling between ROLLUP and RELATIONSHIP and TWO WAY RELATIONSHIP fields in Notion each need specific handling for CRUD operations. 
- ALWAYS use FULL filepaths for TOOL CALLS.

## Currently working on: 
General Code Quality & UX Improvements.
 
## Changes recorded at: 
CHANGELOG.md


## CRITICAL: TypeScript Error Checking

**WARNING**: Never use `npx tsc` directly on individual files! This will give false errors.
- ❌ **WRONG**: `npx tsc --noEmit src/hooks/mutations/entityMutations.ts` 
- ✅ **CORRECT**: `npm run typecheck`

The direct tsc command uses default ES5 target and lacks path mappings, creating phantom syntax errors that don't exist with the project's actual configuration. This has caused hours of wasted debugging time chasing non-existent brace mismatches.

## Key Development Commands

```bash
# Development
npm run dev                # Start both client (port 5173) and server (port 3001) concurrently
npm run dev:client         # Start only Vite client
npm run dev:server         # Start only Express server with hot reload

# Building
npm run build              # Build both client and server for production
npm run build:client       # Build client only
npm run build:server       # Build server only
npm start                  # Start production server

# Testing
npm test                   # Run tests in watch mode
npm run test:run           # Run all tests once with increased memory
npm run test:coverage      # Run tests with coverage report
npm run test:ui            # Open Vitest UI
npm run test:integration   # Run integration tests
npm run test:smoke         # Run smoke tests

# Test Batches (for large test suites)
npm run test:batch:components  # Test components only
npm run test:batch:hooks       # Test hooks only  
npm run test:batch:lib         # Test lib utilities only

# Code Quality
npm run lint               # Run ESLint
npm run typecheck          # Run TypeScript type checking for both client and server
```

## Running a Single Test

```bash
# Run a specific test file
npx vitest run src/components/CreatePanel.test.tsx
npx vitest run src/hooks/useGraphState.test.ts

# Run tests in watch mode for a specific pattern
npx vitest src/hooks/mutations

# Run with Playwright for E2E
npm run test:e2e:edges
```

## Architecture Overview

### Frontend Structure
- **src/components/**: React components organized by feature
  - `graph/`: Graph visualization components (nodes, edges, views)
  - `sidebar/`: Filter and navigation panels
  - `field-editors/`: Form field components for entity editing
  - `ui/`: Reusable UI components
  
- **src/hooks/**: Custom React hooks
  - `graph/`: Graph-specific hooks (visibility, layout)
  - `mutations/`: Data mutation hooks with TanStack Query
  - `detail-panel/`: Entity form management

- **src/services/**: API clients and data services
  - `api.ts`: Main API client with request batching
  - `graphApi.ts`: Graph-specific API endpoints

- **src/stores/**: Zustand state stores
  - `filterStore.ts`: Filter and visibility state
  - `creationStore.ts`: Entity creation state
  - `uiStore.ts`: UI preferences

- **src/lib/graph/**: Graph utilities and algorithms
  - `nodeCreators.ts`: Node factory functions
  - `filtering.ts`: Entity filtering logic
  - `layout/`: Layout algorithms (Dagre)

### Backend Structure
- **server/routes/**: Express route handlers
  - `notion/`: Entity-specific routes (characters, elements, puzzles, timeline)
  - `graph.ts`: Graph data endpoints
  - `cache.ts`: Cache management endpoints

- **server/services/**:
  - `notion.ts`: Notion API client wrapper
  - `cache.ts`: In-memory caching with TTL
  - `graphBuilder.ts`: Graph data transformation
  - `relationshipSynthesizer.ts`: Bidirectional relationship resolution

- **server/middleware/**:
  - `auth.ts`: API key authentication
  - `validation.ts`: Request validation
  - `errorHandler.ts`: Centralized error handling

## Environment Variables

Required for server (copy `.env.example` to `.env`):
```bash
NOTION_API_KEY=your-notion-integration-token
NOTION_CHARACTERS_DB=database-id
NOTION_ELEMENTS_DB=database-id  
NOTION_PUZZLES_DB=database-id
NOTION_TIMELINE_DB=database-id
API_KEY=optional-api-key-for-auth
PORT=3001
NODE_ENV=development|production
```
**IMPORTANT: In Dev, Auth Middleware REQUIRES Origin to be set as Localhost**

## API Endpoints

Main endpoints (all prefixed with `/api`):
- `GET /api/health` - Health check (no auth)
- `GET /api/notion/characters` - Fetch characters with filtering
- `GET /api/notion/elements` - Fetch story elements
- `GET /api/notion/puzzles` - Fetch puzzles
- `GET /api/notion/timeline` - Fetch timeline events
- `GET /api/graph/data` - Get complete graph data with relationships
- `PUT /api/notion/{entity}/:id` - Update entity properties
- `GET /api/cache/stats` - Cache statistics
- `POST /api/cache/clear` - Clear cache

All endpoints support:
- Cursor-based pagination (`cursor`, `limit` params)
- Filtering by various properties
- Caching with 5-minute TTL
- Rate limiting (100 req/min)

## Testing Approach

- **Unit Tests**: Use Vitest with happy-dom for component and hook testing
- **Integration Tests**: Test API endpoints with real Notion API calls
- **E2E Tests**: Playwright tests in `tests/e2e/`
- **Mocks**: MSW handlers in `src/test/mocks/` for API simulation
- **Coverage**: Minimum 80% coverage thresholds enforced
- **Test Environment**: Tests run in parallel with fork pool isolation for speed and safety

## Key Libraries & Patterns

- **React Flow**: Graph visualization with custom nodes/edges
- **TanStack Query**: Server state management with caching
- **Zustand**: Client state management
- **Dagre**: Graph layout algorithm
- **Bottleneck**: Rate limiting for Notion API calls
- **Node-cache**: Server-side caching

## Common Patterns

1. **Entity Types**: `Character`, `Element`, `Puzzle`, `TimelineEvent`
2. **Node Types**: Each entity has corresponding React Flow node component
3. **Mutations**: Use `entityMutations` factory for CRUD operations
4. **Caching**: Both client (React Query) and server (node-cache) caching
5. **Error Handling**: Centralized error boundaries and API error handler

## Performance Considerations

- Request batching for parallel API calls
- Memoization in graph calculations
- Virtual rendering for large graphs
- Progressive loading with pagination
- Optimistic updates for better UX

## Build Configuration

- **TypeScript**: Uses project references with separate configs for app (`tsconfig.app.json`) and server (`tsconfig.server.json`)
- **Path Aliases**: `@/*` maps to `src/*` for cleaner imports
- **Vite**: Configured with tree-shaking, source maps, and dependency optimization
- **Test Isolation**: Each test file runs in its own fork for safety
- **Coverage Requirements**: 80% minimum coverage for branches, functions, lines, and statements