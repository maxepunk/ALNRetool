# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Context

ALNRetool is a visualization and editing tool for "About Last Night," a 20-40 player murder mystery game. It enables puzzle and narrative designers to visualize and edit game content stored in Notion databases through interactive graph interfaces with React Flow.

**REFACTORING STATUS**: Major architectural refactoring completed (39% total code reduction from 280→172 files). Phase E cleanup complete. See Architecture_Cleanup.md for details.
**CURRENT FOCUS**: Production-ready codebase with streamlined architecture and full functionality.

## Key Technical Context

### Architecture Overview
- **Frontend**: React 18 + TypeScript + Vite + TanStack Query v5 + React Flow (@xyflow/react)
- **Backend**: Express.js v5 proxy server for Notion API authentication
- **Data Flow**: Frontend → Express API → Notion API → Transform → Cache → Response
- **Graph System**: Modular architecture with dependency injection via GraphContext
- **Layout Engine**: Pure Dagre with semantic edge-based positioning, async layout algorithms
- **State Management**: Zustand for filters/UI, React Query for server state

### Data Transformation Pipeline (Simplified Post-Refactor)
```
1. Notion API Response (server/services/notion.ts)
   ↓ Raw Notion blocks
2. Backend Transform (server/services/notionPropertyMappers.ts)
   ↓ Normalized entities with bidirectional relations
3. API Response with Caching (5-minute TTL via node-cache)
   ↓ JSON over HTTP with CacheCoordinator invalidation
4. Frontend React Query (src/hooks/generic/useEntityData.ts)
   ↓ Cached & deduplicated with optimistic updates
5. Direct Entity Processing (src/lib/graph/relationships.ts & patterns.ts)
   ↓ Nodes & edges without transformer abstraction
6. Layout Engine (src/lib/graph/layout/dagre.ts)
   ↓ Pure Dagre positioning
7. React Flow Rendering with custom node types
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

### Simplified Graph Architecture (Post-Refactor)
```
src/lib/graph/
├── edges.ts              # Edge creation and weight rules (critical business logic)
├── relationships.ts      # Entity relationship processing
├── patterns.ts          # Graph pattern detection
├── layouts.ts           # Layout algorithms interface
├── types.ts             # TypeScript type definitions
├── guards.ts            # Type guards for runtime checks
├── cache/
│   ├── index.ts         # Cache management
│   └── LayoutCache.ts   # Layout-specific caching
└── layout/
    └── dagre.ts         # Pure Dagre layout implementation
```

### View Configuration System
```
src/lib/viewConfigs.ts    # Declarative view configurations
src/hooks/useViewConfig.ts # Hook for accessing view configs
```
- New views can be created in ~10 minutes by adding config objects
- No need for complex module registration or transformers

#### Creating a New View (Quick Guide)
1. Add view config to `src/lib/viewConfigs.ts`:
```typescript
'my-view': {
  name: 'My Custom View',
  description: 'Description here',
  filters: { entityTypes: ['puzzle', 'character'] },
  layout: { algorithm: 'dagre', direction: 'LR' },
  display: { nodeSize: 'medium' }
}
```
2. View automatically available in UI without additional code

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

### Required Environment Variables
```env
# Notion Configuration (Required)
NOTION_API_KEY=your_notion_integration_token

# Database IDs (Optional - defaults provided)
NOTION_DB_CHARACTERS=18c2f33d-583f-8060-a6ab-de32ff06bca2
NOTION_DB_ELEMENTS=18c2f33d-583f-8020-91bc-d84c7dd94306
NOTION_DB_PUZZLES=1b62f33d-583f-80cc-87cf-d7d6c4b0b265
NOTION_DB_TIMELINE=1b52f33d-583f-80de-ae5a-d20020c120dd

# Optional Configuration
PORT=3001
CACHE_TTL_SECONDS=300
API_RATE_LIMIT_MAX=100
ADMIN_KEY=optional_admin_key
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
- Network-simplex algorithm for minimal edge crossings
- Configuration in `dagre.ts`:
  - rankSeparation: 300px (horizontal spacing)
  - nodeSeparation: 100px (vertical spacing)

## Debug Scripts (Essential scripts retained post-refactor)
```bash
tsx scripts/smoke-test.ts             # Quick health check
tsx scripts/integration-test.ts       # Full integration test
# Note: 69+ debug scripts were removed during refactoring as redundant
# Create new debug scripts as needed in scripts/ directory
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

### Layout System (Simplified)
- **Pure Dagre**: Single layout algorithm for consistency
- **Synchronous Processing**: Direct layout calculation without web workers
- **Cache-based Performance**: LayoutCache for position persistence

### Filter System
- **Multi-dimensional Filters**: Character, puzzle, content, and graph depth filters
- **Server-side Support**: Hybrid filtering with cache coordination
- **Active Filter Summary**: Visual display of applied filters
- **Single FilterPanel Component**: Consolidated from 6 separate filter components

### Field Editing System
- **DetailPanel**: Central editing interface with optimistic updates
- **Field Editors**: Type-specific editors in `src/components/field-editors/`
  - BasicFieldEditor (text, number, url, email)
  - RelationFieldEditor (entity relationships with Select/Badge UI)
  - FilesFieldEditor (file upload/display)
  - SelectFieldEditor, MultiSelectFieldEditor, CheckboxFieldEditor
- **Mutation Hooks**: `src/hooks/mutations/` with cache invalidation
- **Field Registry**: Metadata-driven field configurations
- **Bidirectional Relations**: Server-side InverseRelationHandler (needs integration fixes)

## Common Pitfalls to Avoid

1. **Don't import from barrel exports in tests** - causes circular dependency issues
2. **Don't use TypeScript enums** - use const objects for erasableSyntaxOnly compatibility
3. **Don't skip asyncHandler** - unhandled promise rejections crash the server
4. **Don't expose Notion API key to frontend** - always proxy through Express
5. **Don't recreate complex architectures** - use simple viewConfigs pattern for new views
6. **Don't bypass cache invalidation** - ensure CacheCoordinator handles entity updates
7. **Use absolute imports** - `@/*` for src files, not relative paths
8. **Check config module first** - all env vars should go through `server/config/index.ts`
9. **Don't add unnecessary abstractions** - direct entity processing is preferred over transformers

## Current Development Status

**Post-Refactor Status (pre-simplification-backup branch)**:
- ✅ Completed: 39% total code reduction (172 files from 280)
- ✅ Functional: All core features working including field editing
- ✅ Phase A-E Complete: Save functionality, cache invalidation, user feedback, cleanup
- ✅ Production-ready with streamlined architecture

**Known Issues**:
- ~98 TypeScript compilation errors (non-blocking, build works with --no-verify)
- Inverse relation handler bypass in some mutation flows
- Sequential entity fetching performance (N+1 queries)

See Architecture_Cleanup.md for detailed phase history and planned improvements.

## Deployment (Render.com)

Configuration in `render.yaml`:
- **Service Type**: Web service with Node.js runtime
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run start`
- **Health Check**: `/healthz` endpoint
- **Environment Variables** (set in Render dashboard):
  - `NODE_ENV=production`
  - `NOTION_API_KEY` (secret)
  - `NOTION_CHARACTERS_DB`, `NOTION_ELEMENTS_DB`, `NOTION_PUZZLES_DB`, `NOTION_TIMELINE_DB`
  - `API_KEY` for admin endpoints (optional)
- **Auto-deploy**: Disabled by default (enable after testing)

## Quick Development Tips

### Running with Real Data
```bash
# Ensure .env has valid Notion API key and database IDs
npm run dev              # Frontend on :5173, backend on :3001
# Open http://localhost:5173 to see the graph
```

### Testing Mutations
1. Click any node in the graph to open DetailPanel
2. Edit fields and click Save
3. Check console for mutation logs
4. Verify in Notion that changes persisted

### Adding New Entity Fields
1. Update field registry in backend property mappers
2. Add field editor component if custom type needed
3. Update TypeScript types in `src/types/`
4. Cache invalidation handled automatically via CacheCoordinator

### Debugging Graph Issues
- Enable React Query DevTools (already configured)
- Check Network tab for API calls to `/api/[entity-type]`
- Use React Flow's built-in debugging: `window.__REACT_FLOW_STORE__`
- Graph state in Zustand: check `src/stores/filterStore.ts`

## MCP (Model Context Protocol) Tools & Agent Guidelines

### Configured MCP Servers (from .mcp.json)

#### 1. Zen MCP - AI-Powered Code Analysis & Generation
Key tools for development assistance:
- `mcp__zen__chat` - AI collaboration for brainstorming and problem-solving
- `mcp__zen__thinkdeep` - Deep investigation for complex problems
- `mcp__zen__debug` - Root cause analysis for bugs
- `mcp__zen__codereview` - Comprehensive code review
- `mcp__zen__refactor` - Refactoring analysis and suggestions
- `mcp__zen__testgen` - Test generation with edge cases
- `mcp__zen__analyze` - Code analysis for architecture/performance
- `mcp__zen__tracer` - Code tracing and dependency mapping

#### 2. Playwright Generic MCP - Browser Automation Testing
```javascript
// Start dev server first
npm run dev

// Example testing flow:
mcp__playwright-generic__playwright_navigate({url: "http://localhost:5173"})
mcp__playwright-generic__playwright_screenshot({name: "initial-graph"})
mcp__playwright-generic__playwright_click({selector: ".react-flow__node"})
mcp__playwright-generic__playwright_get_visible_text()  // Verify DetailPanel
mcp__playwright-generic__playwright_fill({selector: "input[name='name']", value: "New Name"})
mcp__playwright-generic__playwright_click({selector: "button:has-text('Save')"})
mcp__playwright-generic__playwright_console_logs({type: "error"})
```

**Key Selectors for ALNRetool**:
- `.react-flow__node` - Graph nodes
- `.detail-panel` - Detail panel container
- `.filter-panel input` - Filter inputs

#### 3. Notion MCP - Direct Database Operations
```javascript
// Query and update Notion databases directly
mcp__notion__notion_query_database({database_id: "18c2f33d-583f-8060-a6ab-de32ff06bca2"})
mcp__notion__notion_retrieve_page({page_id: "..."})
mcp__notion__notion_update_page_properties({page_id: "...", properties: {...}})
```
**⚠️ Warning**: Direct Notion updates bypass cache invalidation. Prefer Express API for mutations.

#### 4. Context7 MCP - Library Documentation
```javascript
// Get up-to-date docs for libraries used in the project
mcp__context7__resolve-library-id({libraryName: "react-flow"})
mcp__context7__get-library-docs({context7CompatibleLibraryID: "/xyflow/react-flow"})
```

#### 5. Tavily MCP - Web Search & Content Extraction
```javascript
// Search for documentation and best practices
mcp__tavily__tavily-search({query: "React Flow custom node types"})
mcp__tavily__tavily-extract({urls: ["https://reactflow.dev/..."]})
```

#### 6. Magic MCP - UI Component Generation
```javascript
// Generate UI components with AI
mcp__magic__21st_magic_component_builder({
  searchQuery: "data table",
  absolutePathToCurrentFile: "/path/to/file",
  // ... other params
})
mcp__magic__21st_magic_component_refiner({
  absolutePathToRefiningFile: "/path/to/component.tsx",
  // ... refinement params
})
```

### Agent Tool Usage Guidelines

#### When to Use Task Agent
```bash
# Good: Complex multi-file analysis
Task("Analyze all React Query hooks and list their dependencies")

# Good: Parallel independent operations
Task("Check TypeScript errors in src/components/*")
Task("Count total lines of code in src/lib/graph/*")

# Bad: Sequential dependent operations
❌ Task("Fix the bug we discussed earlier")  # No context
❌ Task("Implement the feature")  # Too vague
```

#### Effective Agent Patterns for ALNRetool

**1. Code Quality Audit**:
```bash
Task("code-quality-auditor", "Review src/components/field-editors/* for:
- TypeScript strict compliance
- Consistent error handling
- React best practices
- Performance optimizations
Write findings to _audit-field-editors.md")
```

**2. Refactoring Analysis**:
```bash
Task("Analyze src/lib/graph/* for:
- Unused exports
- Circular dependencies  
- Opportunities to simplify
- Dead code
Output: List of specific refactoring recommendations")
```

**3. Test Coverage Check**:
```bash
Task("Review test coverage for:
- src/hooks/mutations/*
- src/components/DetailPanel.tsx
- src/lib/graph/relationships.ts
Report which functions lack tests")
```

#### Agent Best Practices for This Codebase

1. **Always provide full paths**: 
   - ✅ `src/components/graph/GraphView.tsx`
   - ❌ `GraphView.tsx`

2. **Specify expected output format**:
   - ✅ "Return as markdown table with columns: File, Issue, Severity"
   - ❌ "Find issues"

3. **Include current state context**:
   - ✅ "The save function currently calls mutateAsync without error handling"
   - ❌ "Fix the save function"

4. **Use agents for discovery, not implementation**:
   - ✅ Task("Find all places where Notion API is called directly")
   - ❌ Task("Refactor all API calls")  # Do this yourself

5. **Batch related searches**:
   ```bash
   # Parallel discovery
   Task("Find all useQuery hooks")
   Task("Find all useMutation hooks")
   Task("Find all custom hooks")
   ```

### MCP + Agent Workflow Examples for ALNRetool

#### Example 1: Testing Graph Editing End-to-End
```javascript
// 1. Start server
Bash("npm run dev")

// 2. Use Playwright MCP to test UI
mcp__playwright-generic__playwright_navigate({url: "http://localhost:5173"})
mcp__playwright-generic__playwright_click({selector: ".react-flow__node-characterNode"})
mcp__playwright-generic__playwright_screenshot({name: "detail-panel-open"})
mcp__playwright-generic__playwright_fill({selector: "input[name='name']", value: "Updated Character"})
mcp__playwright-generic__playwright_click({selector: "button:has-text('Save')"})

// 3. Check for errors
mcp__playwright-generic__playwright_console_logs({type: "error"})

// 4. Verify in Notion (use with caution - prefer API verification)
mcp__notion__notion_retrieve_page({page_id: "character-page-id"})
```

#### Example 2: Comprehensive Code Review with Zen MCP
```javascript
// 1. Deep code review of mutation system
mcp__zen__codereview({
  step: "Review src/hooks/mutations/* for data integrity issues",
  step_number: 1,
  total_steps: 1,
  next_step_required: false,
  findings: "",
  model: "gemini-2.5-pro"
})

// 2. Analyze refactoring opportunities
mcp__zen__refactor({
  step: "Analyze src/lib/graph/* for simplification opportunities",
  refactor_type: "codesmells",
  model: "gemini-2.5-flash"
})

// 3. Get documentation for best practices
mcp__context7__get-library-docs({
  context7CompatibleLibraryID: "/tanstack/query",
  topic: "mutations"
})
```

#### Example 3: Debug Performance Issues
```javascript
// 1. Use Zen to investigate
mcp__zen__debug({
  step: "Graph rendering is slow with 100+ nodes",
  hypothesis: "Layout calculation blocking main thread",
  step_number: 1,
  total_steps: 3,
  next_step_required: true,
  findings: "",
  model: "o3-mini"
})

// 2. Profile with Playwright
mcp__playwright-generic__playwright_evaluate({
  script: "performance.mark('layout-start')"
})
mcp__playwright-generic__playwright_click({selector: ".filter-checkbox"})
mcp__playwright-generic__playwright_evaluate({
  script: "performance.measure('filter-time', 'layout-start'); return performance.getEntriesByType('measure')"
})

// 3. Analyze with Zen
mcp__zen__analyze({
  step: "Analyze src/lib/graph/layout/dagre.ts for performance bottlenecks",
  analysis_type: "performance",
  model: "gemini-2.5-pro"
})
```

#### Example 4: Generate Tests with Zen MCP
```javascript
// Generate comprehensive tests for critical components
mcp__zen__testgen({
  step: "Generate tests for src/components/DetailPanel.tsx",
  findings: "Focus on: save functionality, validation, optimistic updates",
  step_number: 1,
  total_steps: 1,
  next_step_required: false,
  model: "gpt-5"
})
```

#### Example 5: UI Component Enhancement with Magic MCP
```javascript
// Refine existing component UI
mcp__magic__21st_magic_component_refiner({
  absolutePathToRefiningFile: "/home/spide/projects/GitHub/ALNRetool/src/components/FilterPanel.tsx",
  userMessage: "Make the filter panel more intuitive with better visual hierarchy",
  context: "Current panel has all filters at same visual weight"
})

// Generate new component
mcp__magic__21st_magic_component_builder({
  searchQuery: "timeline visualization",
  absolutePathToCurrentFile: "/home/spide/projects/GitHub/ALNRetool/src/components/graph/TimelineView.tsx",
  absolutePathToProjectDirectory: "/home/spide/projects/GitHub/ALNRetool",
  message: "Create a timeline view component for character journeys",
  standaloneRequestQuery: "Timeline component showing character progression through puzzles"
})
```