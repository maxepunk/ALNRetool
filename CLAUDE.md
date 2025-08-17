# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Context

ALNRetool is a visualization and editing tool for "About Last Night," a 20-40 player murder mystery game. It enables puzzle and narrative designers to visualize and edit game content stored in Notion databases through interactive graph interfaces.

## Essential Planning Documents - Navigation Guide

### Product Requirements Document (alnretool-prd.md)
**Size**: ~25K lines | **When to read**: Understanding features, user requirements, or design decisions

**Quick Navigation by Section:**
- **Lines 1-50**: Executive summary and project overview
- **Lines 100-300**: User personas and their needs (Critical for UI/UX decisions)
- **Lines 400-800**: Core feature specifications for each view
  - Puzzle Focus View: ~Line 450
  - Character Journey View: ~Line 550  
  - Content Status View: ~Line 650
- **Lines 900-1200**: Technical requirements and constraints
- **Lines 1300-1600**: Notion database schema (Critical for data work)
- **Lines 1700-2000**: SF_ pattern specifications
- **Lines 2100-2400**: Success metrics and MVP definition

**When to reference PRD:**
- Implementing new features → Check feature specifications section
- Working with Notion data → Review database schema section
- Making UI decisions → Consult user personas section
- Determining scope → Check MVP definition section

### Development Action Plan (alnretool-action-plan.md)
**Size**: ~46K lines | **When to read**: Understanding timeline, sprint goals, or implementation order

**Quick Navigation by Sprint:**
- **Sprint 1 (Weeks 1-2)**: Lines 100-500 - Foundation & data layer
- **Sprint 2 (Weeks 3-4)**: Lines 600-1000 - Puzzle Focus View  
- **Sprint 3 (Weeks 5-6)**: Lines 1100-1500 - Character & Status Views
- **Sprint 4 (Weeks 7-8)**: Lines 1600-2000 - Production polish

**Key Implementation Details:**
- **Daily Task Breakdowns**: Each sprint has day-by-day tasks
- **Technical Decisions**: Lines 2100-2500 - Architecture choices explained
- **Risk Mitigation**: Lines 2600-2800 - Common pitfalls and solutions
- **Testing Strategy**: Lines 2900-3200 - What to test and when

**When to reference Action Plan:**
- Starting new sprint work → Read that sprint's section
- Estimating tasks → Check daily breakdowns
- Making architecture decisions → Review technical decisions section
- Planning tests → Consult testing strategy

### Reading Strategy for AI Assistants

**For Quick Tasks**: Don't read entire files. Use specific line ranges above.

**For Feature Implementation**: 
1. Read relevant sprint section in action-plan
2. Read corresponding feature spec in PRD
3. Check current progress in docs/PROJECT_STATUS.md

**For Bug Fixes**: Usually not needed unless understanding original intent

**For Architecture Changes**: 
1. Read technical requirements in PRD (lines 900-1200)
2. Review technical decisions in action-plan (lines 2100-2500)
3. Check current implementation in code

## Key Technical Context

### Architecture Overview
- **Frontend**: React 18 + TypeScript + Vite + TanStack Query + React Flow
- **Backend**: Express.js proxy server for Notion API authentication
- **Data Flow**: Frontend → Express API → Notion API → Transform → Cache → Response

### High-Level Code Architecture

#### State Management Pattern
- **React Query**: All server state managed via TanStack Query hooks in `src/hooks/`
- **Local State**: Component-level state for UI interactions
- **Graph State**: React Flow manages node/edge state internally with Zustand
- **No Global Store**: Intentionally avoiding Redux/Context for simplicity

#### Data Transformation Pipeline
```
1. Notion API Response (server/services/notion.ts)
   ↓ Raw Notion blocks
2. Backend Transform (server/services/transformers.ts)
   ↓ Normalized entities
3. API Response with Caching (5-minute TTL via node-cache)
   ↓ JSON over HTTP
4. Frontend React Query (src/hooks/useNotion*.ts)
   ↓ Cached & deduplicated
5. Graph Transformers (src/lib/graph/transformers/)
   ↓ Nodes & edges
6. Layout Engine (src/lib/graph/layouts.ts using Dagre)
   ↓ Positioned nodes
7. React Flow Rendering
```

#### Key Architectural Decisions

**Why Express Proxy?**
- Notion API requires server-side auth (API key security)
- Enables response caching to reduce API calls
- Provides rate limiting and CORS control
- Allows data pre-processing before client

**Why React Flow over D3?**
- Built-in pan/zoom, node dragging, minimap
- React-native integration (no imperative DOM)
- Extensible with custom nodes/edges
- Better performance for interactive graphs

**Why TanStack Query over RTK Query?**
- Lighter weight (no Redux dependency)
- Superior cache invalidation patterns
- Built-in optimistic updates
- Better TypeScript inference

**Testing Strategy Layers**
1. **Unit Tests**: Component logic, transformers, utilities
2. **Integration Tests**: API endpoints with real Notion
3. **MSW Mocks**: Frontend tests with mocked API responses
4. **Smoke Tests**: Quick validation without real API

### Important Patterns

#### Pure Dagre Layout (Sprint 2 Refactor - January 17, 2025)
- **Replaced**: Complex hybrid `puzzleCentricLayout.ts` with simple `pureDagreLayout.ts`
- **Strategy**: Natural edge flow creates semantic positioning
  - Requirements flow INTO puzzles (element→puzzle edges)
  - Rewards flow OUT OF puzzles (puzzle→element edges)
  - This creates automatic left-to-right layout without manual positioning
- **Algorithm**: Network-simplex for minimal edge crossings
- **Configuration**: LR direction, 300px rank separation, fractional ranks enabled

#### TypeScript Configuration
- **Frontend**: `tsconfig.app.json` - ESNext modules, React JSX, path aliases
- **Backend**: `tsconfig.server.json` - CommonJS output for Node.js
- **Path Alias**: `@/*` maps to `src/*` (use in frontend imports)
- **Strict Mode**: All strict checks enabled including `noUncheckedIndexedAccess`

#### Vite Configuration
- **Proxy**: `/api` routes proxy to `localhost:3001` in dev
- **Build Output**: `dist/client/` for frontend, `dist/server/` for backend
- **Test Environment**: `happy-dom` for fast unit tests
- **Test Setup**: `src/test/setup.ts` for global test configuration
- **Coverage Thresholds**: 80% for branches, functions, lines, statements
- **Optimizations**: React Flow excluded from pre-bundling for compatibility
- **Circular Dependencies**: Warnings suppressed in Rollup config

#### Environment Variables
- **Production**: NEVER load dotenv - use platform environment variables only
- **Development**: Load from .env file
- **Test**: Load from .env.test if exists, otherwise .env

```typescript
// Correct pattern in server/index.ts
if (process.env.NODE_ENV !== 'production') {
  config(); // Only load dotenv in dev/test
}
```

#### API Response Structure
```typescript
interface APIResponse<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}
```

#### Error Handling
Always use `asyncHandler` wrapper for Express routes:
```typescript
router.get('/endpoint', asyncHandler(async (req: Request, res: Response) => {
  // Implementation
}));
```

### Notion Database IDs
- Characters: `18c2f33d-583f-8060-a6ab-de32ff06bca2`
- Elements: `18c2f33d-583f-8020-91bc-d84c7dd94306`
- Puzzles: `1b62f33d-583f-80cc-87cf-d7d6c4b0b265`
- Timeline: `1b52f33d-583f-80de-ae5a-d20020c120dd`

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

## Development Workflow

### Making Changes
1. **Check existing patterns**: Look at neighboring files before implementing
2. **Follow conventions**: Use existing libraries, don't introduce new ones without need
3. **Test your changes**: Run `npm test` and `npm run typecheck`
4. **Use conventional commits**: `npx cz` for commit messages

### Common Tasks

#### Adding a New API Endpoint
1. Add route handler in `server/routes/notion.ts`
2. Use `asyncHandler` wrapper
3. Add TypeScript types in `src/types/notion/`
4. Add React Query hook in `src/hooks/`
5. Add MSW handler in `src/test/mocks/handlers.ts`

#### Working with React Flow
1. Custom nodes go in `src/components/nodes/`
2. Graph transformations in `src/lib/graph/transformers/`
3. Layout logic in `src/lib/graph/pureDagreLayout.ts` (pure Dagre approach)
4. Layout orchestration in `src/lib/graph/layouts.ts` (view-specific configurations)

**React Flow Node Types**:
- `puzzleNode`: Diamond-shaped nodes for puzzles with dependency indicators
- `characterNode`: Green nodes for characters with role badges
- `elementNode`: Purple nodes for story elements
- `timelineNode`: Orange nodes for timeline events
- `group`: Container nodes for puzzle chains (puzzle-focus view)

**Edge Types**:
- `dependency`: Solid arrow for puzzle dependencies
- `reward`: Dashed arrow for puzzle rewards
- `relation`: Dotted line for character relationships
- `chain`: Extra-weighted edges for puzzle chains

**Layout Algorithm (Pure Dagre)**: 
- Direction: Left-to-right (`LR`) for puzzle-focus view
- Natural edge flow creates semantic positioning
- Requirements flow INTO puzzles, rewards flow OUT
- Network-simplex algorithm for minimal edge crossings
- Fractional ranks support dual-role elements
- Configuration in `applyPureDagreLayout()`:
  - rankSeparation: 300px (horizontal spacing between columns)
  - nodeSeparation: 100px (vertical spacing within columns)
  - puzzleSpacing: 300px (extra spacing for chains)
  - optimizeEdgeCrossings: true (network-simplex)

#### Debugging Production Issues
1. Check environment variables are set in platform (not .env file)
2. Verify CORS configuration matches deployment URL
3. Check server logs for startup validation messages
4. Test health endpoint: `/api/health`

## Debugging Utilities

### Debug Scripts (in scripts/)
```bash
tsx scripts/debug-notion-data.ts      # Inspect raw Notion API responses
tsx scripts/debug-missing-fields.ts   # Check for missing entity references
tsx scripts/test-single-endpoint.ts   # Test individual API endpoints
tsx scripts/analyze-process-tree.ts   # Debug process management issues
tsx scripts/inspect-notion-data.ts    # Detailed entity inspection
```

### Performance Testing
```bash
tsx scripts/test-timeline-performance.ts  # Timeline endpoint benchmarking
npm run test:coverage                    # Generate coverage reports
```

## Deployment Notes

### Render.com Deployment
- Environment variables set in Render dashboard (not .env files)
- Build command: `npm install && npm run build`
- Start command: `npm start`
- Health check: `/healthz`

### Critical Production Settings
1. NODE_ENV must be "production"
2. All NOTION_* environment variables must be set
3. FRONTEND_URL should match deployment domain
4. dotenv must NOT load in production

## Common Pitfalls to Avoid

1. **Don't load dotenv in production** - causes environment variable override issues
2. **Don't expose Notion API key to frontend** - always proxy through Express
3. **Don't skip asyncHandler** - unhandled promise rejections crash the server
4. **Don't use relative imports** - use path aliases (`@/*` for src)
5. **Don't commit .env files** - they're gitignored for a reason

## Current Development Status

- **Sprint 1**: ✅ Complete - Foundation, API integration, data layer
- **Sprint 2**: 🚧 In Progress - React Flow visualization with pure Dagre layout
  - ✅ Pure Dagre layout implementation (January 17, 2025)
  - ✅ Natural edge flow for semantic positioning
  - ✅ Requirements→Puzzles→Rewards horizontal flow
  - 🚧 Details panel and mutations pending
  - 🚧 Experimental compound layout work in scripts/
- **Sprint 3**: 📋 Planned - Character journey view
- **Sprint 4**: 📋 Planned - Production polish

See [docs/PROJECT_STATUS.md](./docs/PROJECT_STATUS.md) for detailed status.

## Getting Help

- Main documentation: [README.md](./README.md)
- API reference: [docs/API.md](./docs/API.md)
- Deployment guide: [DEPLOYMENT.md](./DEPLOYMENT.md)
- Test strategy: [docs/TESTING_STRATEGY.md](./docs/TESTING_STRATEGY.md)