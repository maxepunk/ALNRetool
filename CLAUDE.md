# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Context

ALNRetool is a visualization and editing tool for "About Last Night," a 20-40 player murder mystery game. It enables puzzle and narrative designers to visualize and edit game content stored in Notion databases through interactive graph interfaces.

## Key Technical Context

### Architecture Overview
- **Frontend**: React 18 + TypeScript + Vite + TanStack Query + React Flow
- **Backend**: Express.js proxy server for Notion API authentication
- **Data Flow**: Frontend → Express API → Notion API → Transform → Cache → Response
- **Graph System**: Modular architecture with BaseTransformer pattern
- **Layout Engine**: Pure Dagre with semantic edge-based positioning

### Data Transformation Pipeline
```
1. Notion API Response (server/services/notion.ts)
   ↓ Raw Notion blocks
2. Backend Transform (server/services/transformers.ts)
   ↓ Normalized entities
3. API Response with Caching (5-minute TTL via node-cache)
   ↓ JSON over HTTP
4. Frontend React Query (src/hooks/)
   ↓ Cached & deduplicated
5. Graph Transformers (src/lib/graph/modules/)
   ↓ Nodes & edges
6. Layout Engine (src/lib/graph/layout/dagre.ts)
   ↓ Positioned nodes
7. React Flow Rendering
```

## Common Development Commands

### Core Development
```bash
npm run dev              # Start both frontend (5173) and backend (3001)
npm run dev:client       # Frontend only (Vite on port 5173)
npm run dev:server       # Backend only (Express on port 3001)
npm run build           # Build for production
npm start               # Start production server
```

### Testing Commands
```bash
npm test                # Run tests in watch mode
npm run test:run        # Run all unit tests once
npm run test:ui         # Open Vitest UI
npm run test:coverage   # Generate coverage report
npm run test:integration # Integration tests (requires .env)
npm run test:smoke      # Quick smoke test
npm run test:quick      # Fast test without real API key
npm run typecheck       # TypeScript validation
npm run lint            # ESLint validation
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

### Modular Graph Architecture
```
src/lib/graph/
├── index.ts                      # Public API facade
├── layout/
│   └── dagre.ts                  # Pure Dagre layout
├── modules/
│   ├── BaseTransformer.ts        # Abstract base for all transformers
│   ├── EntityTransformer.ts      # Entity-to-node transformations
│   ├── GraphBuilder.ts           # Node/edge assembly
│   ├── EdgeBuilder.ts            # Smart edge creation with weighting
│   ├── ErrorHandler.ts           # Error management
│   ├── LayoutOrchestrator.ts     # Layout coordination
│   ├── LayoutQualityMetrics.ts   # Layout quality measurement
│   ├── VirtualEdgeInjector.ts    # Virtual edge handling
│   └── ElementClusterer.ts       # Post-layout clustering
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
- **React Query**: All server state via TanStack Query hooks in `src/hooks/`
- **Local State**: Component-level state for UI interactions
- **Graph State**: React Flow manages node/edge state internally with Zustand
- **No Global Store**: Intentionally avoiding Redux/Context for simplicity

### Hook Organization
```
src/hooks/
├── generic/              # Generic reusable patterns
│   └── useEntityData.ts  # Base hook for entity fetching
├── mutations/            # Mutation hooks
├── detail-panel/         # Detail panel specific hooks
├── useCharacters.ts      # Entity-specific hooks
├── useElements.ts
├── usePuzzles.ts
└── useTimeline.ts
```

### Environment Variables
- **Production**: NEVER load dotenv - use platform environment variables only
- **Development**: Load from .env file
- **Test**: Load from .env.test if exists, otherwise .env

```typescript
// Correct pattern in server/index.ts
if (process.env.NODE_ENV !== 'production') {
  config(); // Only load dotenv in dev/test
}
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
Always use `asyncHandler` wrapper for Express routes:
```typescript
router.get('/endpoint', asyncHandler(async (req: Request, res: Response) => {
  // Implementation
}));
```

## Notion Database IDs
- Characters: `18c2f33d-583f-8060-a6ab-de32ff06bca2`
- Elements: `18c2f33d-583f-8020-91bc-d84c7dd94306`
- Puzzles: `1b62f33d-583f-80cc-87cf-d7d6c4b0b265`
- Timeline: `1b52f33d-583f-80de-ae5a-d20020c120dd`

## Vite Configuration
- **Proxy**: `/api` routes proxy to `localhost:3001` in dev
- **Build Output**: `dist/client/` for frontend, `dist/server/` for backend
- **Test Environment**: `happy-dom` for fast unit tests
- **Coverage Thresholds**: 80% for branches, functions, lines, statements
- **Optimizations**: React Flow excluded from pre-bundling for compatibility
- **Circular Dependencies**: Warnings suppressed in Rollup config

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
- Natural edge flow creates semantic positioning
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
tsx scripts/analyze-process-tree.ts   # Debug process management issues
tsx scripts/test-timeline-performance.ts  # Timeline endpoint benchmarking
```

## Common Pitfalls to Avoid

1. **Don't load dotenv in production** - causes environment variable override issues
2. **Don't expose Notion API key to frontend** - always proxy through Express
3. **Don't skip asyncHandler** - unhandled promise rejections crash the server
4. **Don't use relative imports** - use path aliases (`@/*` for src)
5. **Don't use TypeScript enums** - use const objects for erasableSyntaxOnly compatibility
6. **Don't create monolithic modules** - split into focused, single-responsibility files
7. **Don't duplicate transformation logic** - extend BaseTransformer for new entity types

## Current Development Status

- **Sprint 1**: ✅ Complete - Foundation, API integration, data layer
- **Sprint 2**: 🚧 In Progress (~75% Complete) - React Flow visualization
  - ✅ Graph module refactoring complete
  - ✅ Pure Dagre layout with virtual edge injection
  - ✅ DetailPanel with two-way Notion sync
  - ✅ Visual enhancements with glassmorphism
  - 🚧 Remaining: Additional mutations and polish
- **Sprint 3**: 📋 Planned - Character journey view
- **Sprint 4**: 📋 Planned - Production polish

See [docs/PROJECT_STATUS.md](./docs/PROJECT_STATUS.md) for detailed status.