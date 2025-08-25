# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Context

ALNRetool is a visualization and editing tool for "About Last Night," a 20-40 player murder mystery game. It enables puzzle and narrative designers to visualize and edit game content stored in Notion databases through interactive graph interfaces with React Flow.

**WE ARE CURRENTLY REFACTORING THE WHOLE CODEBASE PER @Architecture_Cleanup.md.** 
**We are currently starting Phase 1.**
**Update @Architecture_Cleanup.md after each step of work to ensure it remains accurate, HONEST, and up-to-date ALWAYS.**

## Key Technical Context

### Architecture Overview
- **Frontend**: React 18 + TypeScript + Vite + TanStack Query v5 + React Flow (@xyflow/react)
- **Backend**: Express.js v5 proxy server for Notion API authentication
- **Data Flow**: Frontend → Express API → Notion API → Transform → Cache → Response
- **Graph System**: Modular architecture with dependency injection via GraphContext
- **Layout Engine**: Pure Dagre with semantic edge-based positioning, async layout algorithms
- **State Management**: Zustand for filters/UI, React Query for server state

### Data Transformation Pipeline
```
1. Notion API Response (server/services/notion.ts)
   ↓ Raw Notion blocks
2. Backend Transform (server/services/notionPropertyMappers.ts)
   ↓ Normalized entities with bidirectional relations
3. API Response with Caching (5-minute TTL via node-cache)
   ↓ JSON over HTTP
4. Frontend React Query (src/hooks/generic/useEntityData.ts)
   ↓ Cached & deduplicated
5. Graph Transformers (src/lib/graph/modules/transformers/)
   ↓ Nodes & edges via BaseTransformer pattern
6. Layout Engine (src/lib/graph/layout/dagre.ts)
   ↓ Positioned nodes with virtual edge injection
7. React Flow Rendering
```

## Common Development Commands

### Core Development
```bash
npm run dev              # Start both frontend (5173) and backend (3001)
npm run dev:client       # Frontend only (Vite on port 5173)
npm run dev:server       # Backend only (Express on port 3001)
npm run build           # Build for production (client + server)
npm start               # Start production server (NODE_ENV=production)
```

### Testing Commands
```bash
npm test                # Run tests in watch mode
npm run test:run        # Run all unit tests once (with increased memory)
npm run test:ui         # Open Vitest UI
npm run test:coverage   # Generate coverage report
npm run test:integration # Integration tests (requires .env)
npm run test:smoke      # Quick smoke test
npm run test:quick      # Fast test without real API key
npm run typecheck       # TypeScript validation
npm run lint            # ESLint validation

# Batch testing for CI/memory management
npm run test:batch:components  # Test components only
npm run test:batch:hooks      # Test hooks only
npm run test:batch:lib        # Test lib only
npm run test:batch:all        # Run all batches sequentially
```

### Running Single Tests
```bash
# Run specific test file
npx vitest run src/components/graph/GraphView.test.tsx

# Run tests matching pattern
npx vitest run -t "should handle node selection"

# Debug a specific test
npx vitest --inspect-brk src/lib/graph/transformers.test.ts
```

### Commit Convention
```bash
npx cz                  # Interactive commit with conventional format
```

## Important Patterns

### Modular Graph Architecture with Dependency Injection
```
src/lib/graph/
├── GraphContext.ts                # Dependency injection container
├── core/
│   ├── GraphOrchestrator.ts      # Main orchestrator with strategy pattern
│   └── ViewStrategy.interface.ts  # Strategy interfaces
├── layout/
│   ├── BaseLayoutAlgorithm.ts    # Abstract base for layout algorithms
│   ├── LayoutAlgorithmRegistry.ts # Lazy-loading registry
│   ├── algorithms/               # Individual algorithm implementations
│   └── dagre.ts                  # Pure Dagre layout (default)
├── modules/
│   ├── BaseTransformer.ts        # Abstract base for all transformers
│   ├── EntityTransformer.ts      # Entity-to-node transformations
│   ├── GraphBuilder.ts           # Node/edge assembly
│   ├── EdgeResolver.ts           # Smart edge creation with weighting
│   ├── GraphFilterer.ts          # Filter operations
│   ├── TraversalEngine.ts        # Graph traversal utilities
│   ├── LayoutOrchestrator.ts     # Layout coordination with async support
│   ├── VirtualEdgeInjector.ts    # Virtual edge handling
│   └── transformers/              # Entity-specific transformers
│       ├── CharacterTransformer.ts
│       ├── ElementTransformer.ts
│       ├── PuzzleTransformer.ts
│       └── TimelineTransformer.ts
```

### TypeScript Configuration
- **Frontend**: `tsconfig.app.json` - ESNext modules, React JSX, path aliases
- **Backend**: `tsconfig.server.json` - CommonJS output for Node.js
- **Path Alias**: `@/*` maps to `src/*` (use in frontend imports)
- **Strict Mode**: All strict checks enabled including `noUncheckedIndexedAccess`

### CSS Architecture
- **Tailwind CSS v4**: Primary styling with `@tailwindcss/postcss` plugin
- **shadcn/ui Components**: UI primitives from `@/components/ui/*`
- **Global Styles**: Animation keyframes in `src/index.css`
- **No CSS Modules**: Migrated to Tailwind utilities

### State Management Pattern
- **React Query**: All server state via TanStack Query v5 hooks in `src/hooks/`
- **Zustand**: Filter state and UI state in `src/stores/`
- **React Flow**: Internal node/edge state with Zustand
- **No Redux/Context**: Intentionally avoiding for simplicity

### Hook Organization
```
src/hooks/
├── generic/              # Generic reusable patterns
│   └── useEntityData.ts  # Base hook with EntityAPI interface
├── mutations/            # Mutation hooks
├── detail-panel/         # Detail panel specific hooks
├── useCharacters.ts      # Entity-specific hooks
├── useElements.ts
├── usePuzzles.ts
└── useTimeline.ts
```

### Environment Configuration
- **Production**: Uses platform environment variables directly
- **Development**: Loads from `.env` file via dotenv
- **Test**: Loads from `.env.test` if exists, otherwise `.env`
- **Config Module**: All env vars accessed through `server/config/index.ts`

```typescript
// Server config is centralized and frozen
import config from './config/index.js';
// config.notionApiKey, config.port, config.features, etc.
```

### API Response Structure
```typescript
interface APIResponse<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}
```

### Error Handling
- **Express Routes**: Use `asyncHandler` wrapper (defined in middleware)
- **Frontend**: Error boundaries at component and graph levels
- **Logging**: Winston logger with redacted sensitive values

## Notion Database IDs (from config)
- Characters: `18c2f33d-583f-8060-a6ab-de32ff06bca2`
- Elements: `18c2f33d-583f-8020-91bc-d84c7dd94306`
- Puzzles: `1b62f33d-583f-80cc-87cf-d7d6c4b0b265`
- Timeline: `1b52f33d-583f-80de-ae5a-d20020c120dd`

## Vite Configuration
- **Proxy**: `/api` routes proxy to `localhost:3001` in dev
- **Build Output**: `dist/client/` for frontend, `dist/server/` for backend
- **Test Environment**: `happy-dom` for fast unit tests
- **Coverage Thresholds**: 80% for all metrics
- **Optimizations**: React Flow excluded from pre-bundling, circular dependency warnings suppressed
- **Test Pool**: Fork-based parallel execution with 4 max workers

## React Flow Configuration
**Node Types**:
- `puzzleNode`: Diamond-shaped nodes for puzzles
- `characterNode`: Green nodes for characters
- `elementNode`: Purple nodes for story elements
- `timelineNode`: Orange nodes for timeline events
- `group`: Container nodes for puzzle chains

**Edge Types**:
- `dependency`: Solid arrow for puzzle dependencies
- `reward`: Dashed arrow for puzzle rewards
- `relation`: Dotted line for character relationships
- `chain`: Extra-weighted edges for puzzle chains

**Layout Algorithm (Pure Dagre)**:
- Direction: Left-to-right (`LR`)
- Virtual edge injection for semantic positioning
- Network-simplex algorithm for minimal edge crossings
- Configuration in `LayoutOrchestrator`:
  - rankSeparation: 300px (horizontal spacing)
  - nodeSeparation: 100px (vertical spacing)

## Debug Scripts (in scripts/)
```bash
tsx scripts/debug-notion-data.ts      # Inspect raw Notion API responses
tsx scripts/debug-missing-fields.ts   # Check for missing entity references
tsx scripts/test-single-endpoint.ts   # Test individual API endpoints
tsx scripts/test-synthesized-endpoint.ts # Test bidirectional synthesis
tsx scripts/test-timeline-performance.ts # Timeline endpoint benchmarking
tsx scripts/smoke-test.ts             # Quick health check
tsx scripts/integration-test.ts       # Full integration test
```

## Key Features & Configurations

### Cache Management
- **Backend Cache**: node-cache with 5-minute TTL (configurable via `CACHE_TTL_SECONDS`)
- **Frontend Cache**: React Query with stale time and cache time
- **Cache Invalidation**: Available via `/api/cache` endpoints with admin key

### Rate Limiting
- **API Rate Limit**: Configurable via env vars (default: 100 requests/minute)
- **Notion Throttling**: Bottleneck library for API request management
- **CSRF Protection**: Token-based protection for mutations

### Async Layout System
- **Lazy Loading**: Layout algorithms loaded on-demand via LayoutAlgorithmRegistry
- **Web Workers**: Optional support for offloading layout calculations
- **Progress Tracking**: LayoutProgress interface for UI feedback

### Filter System
- **Multi-dimensional Filters**: Character, puzzle, content, and graph depth filters
- **Server-side Support**: Hybrid filtering with cache coordination
- **Active Filter Summary**: Visual display of applied filters

## Common Pitfalls to Avoid

1. **Don't import from barrel exports in tests** - causes circular dependency issues
2. **Don't use TypeScript enums** - use const objects for erasableSyntaxOnly compatibility
3. **Don't skip asyncHandler** - unhandled promise rejections crash the server
4. **Don't expose Notion API key to frontend** - always proxy through Express
5. **Don't create monolithic modules** - use BaseTransformer pattern for new entity types
6. **Don't duplicate transformation logic** - extend existing transformers
7. **Use absolute imports** - `@/*` for src files, not relative paths
8. **Check config module first** - all env vars should go through `server/config/index.ts`

## Current Development Status

**Refactor/Big-Bang-Editing-Pipeline Branch** (Current):
- ✅ Phase 1: Frontend consolidation - 43% code reduction
- ✅ Phase 2: Backend standardization with inverse relations
- ✅ Phase 3: Cache coordination with version management
- 🚧 Next: Character journey improvements and production deployment

See git log for recent commits and changes.