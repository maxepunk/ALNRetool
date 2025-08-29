# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Context

ALNRetool is a visualization and editing tool for "About Last Night," a 20-40 player murder mystery game. It enables puzzle and narrative designers to visualize and edit game content stored in Notion databases through interactive graph interfaces with React Flow.

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

#### Unit & Integration Tests (Vitest)
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

#### E2E Tests (Playwright)
```bash
# Install Playwright
npm install --save-dev @playwright/test
npx playwright install

# Run E2E tests
npx playwright test                    # Run all tests
npx playwright test --headed           # Run in headed mode
npx playwright test --ui               # Interactive UI mode
npx playwright test --debug            # Debug mode
npx playwright test --trace on         # With trace for debugging

# Run specific tests
npx playwright test graph-editing      # Run tests matching name
npx playwright test tests/e2e/specific.spec.ts  # Run specific file
npx playwright test -g "should edit"   # Run tests matching title

# Generate code
npx playwright codegen http://localhost:5173  # Record actions to generate test code

# View reports
npx playwright show-report             # View HTML report
npx playwright show-trace trace.zip    # View trace file
```

### Running Single Tests
```bash
# Run specific test file
npx vitest run src/components/graph/GraphView.test.tsx

# Run tests matching pattern
npx vitest run -t "should handle node selection"

# Run tests with specific reporter
npx vitest run --reporter=json > test-results.json

# Run tests for a specific directory with coverage
npx vitest run src/hooks --coverage
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

### Entity Creation System (NEW)
The app uses a portal-based creation flow with dedicated components:

```
src/components/
├── CreatePanel.tsx           # Main creation form component
├── CreatePanelPortal.tsx     # Portal wrapper for z-index management
├── EntityCreationModal.tsx   # Modal container for creation
└── graph/
    └── FloatingActionButton.tsx  # FAB for triggering creation

src/stores/
└── creationStore.ts          # Zustand store for creation state

src/hooks/mutations/
├── create.ts                 # Core creation mutation hooks
├── entityMutations.ts        # Entity-specific mutations
└── updateRelationship.ts     # Relationship update mutations
```

#### Creation Flow
1. User clicks FloatingActionButton or uses keyboard shortcut
2. EntityCreationModal opens via portal (managed z-index)
3. CreatePanel renders form based on entity type
4. Mutations handled via TanStack Query with optimistic updates
5. Cache invalidation via CacheCoordinator

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
- **Z-Index Management**: Centralized in `src/config/zIndex.ts`

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
├── mutations/            # Mutation hooks (expanded)
│   ├── index.ts         # Barrel export
│   ├── create.ts        # Creation mutations
│   ├── entityMutations.ts # Entity-specific mutations
│   └── updateRelationship.ts # Relationship updates
├── detail-panel/         # Detail panel specific hooks
│   └── useEntityForm.ts  # Form state management
├── graph/                # Graph-specific hooks
│   ├── useFilteredEntities.ts # Entity filtering logic
│   ├── useGraphRelationships.ts # Relationship processing
│   ├── useGraphVisibility.ts # Visibility state
│   └── useLayoutEngine.ts # Layout calculations
├── useEntitySave.ts      # Save coordination hook
├── useGraphLayout.ts     # Layout management
├── useViewConfig.ts      # View configuration access
├── useFilterSelectors.ts # Filter state selectors
├── useCacheSync.ts       # Cache synchronization
└── useDebounce.ts        # Debouncing utility
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

#### Backend Cache Strategy
- **node-cache**: 5-minute TTL (configurable via `CACHE_TTL_SECONDS`)
- **Surgical Invalidation**: Pattern-based cache invalidation using entity IDs
  ```javascript
  // Good: Surgical invalidation
  cacheService.invalidatePattern(`*_${entityId}`);
  cacheService.invalidatePattern(`${entityType}_*`);
  
  // Bad: Nuclear invalidation (NEVER DO THIS)
  // cacheService.invalidatePattern('*:*'); // This nukes entire cache!
  ```

#### Frontend Cache Patterns (React Query)
- **Optimistic Updates**: Immediate UI updates with rollback on error
- **Surgical Cache Updates**: Update specific entities without broad invalidation
  ```typescript
  // Update specific entity in list cache
  queryClient.setQueryData(
    queryKeys.characters(),
    (old: Character[] = []) => 
      old.map(c => c.id === character.id ? character : c)
  );
  
  // Update individual entity cache
  queryClient.setQueryData(
    queryKeys.character(character.id),
    character
  );
  ```

#### Cache Coordination
- **CacheCoordinator**: Manages intelligent cache invalidation across related entities
- **updateRelatedEntities**: Updates bidirectional relationships in cache
- **removeEntityFromCaches**: Cleanly removes entity from all relevant caches

#### Best Practices
1. **Never use global invalidation** - Always target specific patterns
2. **Update, don't invalidate** - Prefer surgical updates over invalidation
3. **Batch related updates** - Use Promise.all for parallel fetching
4. **Handle missing entities gracefully** - Don't crash on missing references

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
- **Field Registry**: Metadata-driven field configurations in `src/config/fieldRegistry.ts`
- **Bidirectional Relations**: Server-side InverseRelationHandler (needs integration fixes)

#### Adding Custom Field Types
1. Define field metadata in `src/config/fieldRegistry.ts`
2. Create editor component in `src/components/field-editors/`
3. Register in `FieldEditor.tsx` component switch
4. Add TypeScript types to entity interfaces
5. Update backend property mappers if needed

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
10. **Watch z-index conflicts** - use centralized `src/config/zIndex.ts` for layering

## Current Development Status

**Post-Refactor Status (pre-simplification-backup branch)**:
- ✅ Completed: 39% total code reduction (172 files from 280)
- ✅ Functional: All core features working including field editing and entity creation
- ✅ Phase A-E Complete: Save functionality, cache invalidation, user feedback, cleanup
- ✅ Production-ready with streamlined architecture

**Known Issues**:
- ~98 TypeScript compilation errors (non-blocking, build works with --no-verify)
- Inverse relation handler bypass in some mutation flows
- Sequential entity fetching performance (N+1 queries)

**Active Development (entity-creation-feature branch)**:
- Entity creation system implementation
- Mutation hook consolidation
- Creation flow optimization

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

### Testing Entity Creation
1. Click the floating action button (bottom-right)
2. Or use keyboard shortcut (Ctrl/Cmd + N)
3. Select entity type and fill form
4. Submit creates entity in Notion with optimistic UI update

### Adding New Entity Fields
1. Update field registry in `src/config/fieldRegistry.ts`
2. Add field editor component if custom type needed
3. Update TypeScript types in `src/types/`
4. Update backend property mappers in `server/services/notionPropertyMappers.ts`
5. Cache invalidation handled automatically via CacheCoordinator

### Debugging Graph Issues
- Enable React Query DevTools (already configured)
- Check Network tab for API calls to `/api/[entity-type]`
- Use React Flow's built-in debugging: `window.__REACT_FLOW_STORE__`
- Graph state in Zustand: check `src/stores/filterStore.ts`
- Creation state: check `src/stores/creationStore.ts`

## MCP (Model Context Protocol) Servers Configuration

### Actually Configured MCP Servers (from .mcp.json)

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

#### 2. Context7 MCP - Library Documentation
```javascript
// Get up-to-date docs for libraries used in the project
mcp__context7__resolve-library-id({libraryName: "react-flow"})
mcp__context7__get-library-docs({context7CompatibleLibraryID: "/xyflow/react-flow"})
```

#### 3. Tavily MCP - Web Search & Content Extraction
```javascript
// Search for documentation and best practices
mcp__tavily__tavily-search({query: "React Flow custom node types"})
mcp__tavily__tavily-extract({urls: ["https://reactflow.dev/..."]})
```

#### 4. Notion MCP - Direct Database Operations
```javascript
// Query and update Notion databases directly
mcp__notion__notion_query_database({database_id: "18c2f33d-583f-8060-a6ab-de32ff06bca2"})
mcp__notion__notion_retrieve_page({page_id: "..."})
mcp__notion__notion_update_page_properties({page_id: "...", properties: {...}})
```
**⚠️ Warning**: Direct Notion updates bypass cache invalidation. Prefer Express API for mutations.

#### 5. Playwright Testing - Browser Automation
Instead of using Playwright MCP directly, create test scripts following Playwright best practices:

**Setup Playwright Tests**:
```bash
npm install --save-dev @playwright/test
npx playwright install  # Install browsers
```

**Create test file `tests/e2e/graph-editing.spec.ts`**:
```typescript
import { test, expect } from '@playwright/test';

test.describe('Graph Editing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    // Wait for graph to load
    await page.waitForSelector('.react-flow__node');
  });

  test('should edit node properties', async ({ page }) => {
    // Click on a character node
    await page.click('.react-flow__node-characterNode');
    
    // Verify detail panel opens
    await expect(page.locator('.detail-panel')).toBeVisible();
    
    // Edit the name field
    await page.fill('input[name="name"]', 'Updated Character');
    
    // Save changes
    await page.click('button:has-text("Save")');
    
    // Verify success toast or feedback
    await expect(page.locator('.toast-success')).toBeVisible();
  });

  test('should create new entity', async ({ page }) => {
    // Click FAB
    await page.click('.floating-action-button');
    
    // Select entity type
    await page.selectOption('select[name="type"]', 'character');
    
    // Fill form
    await page.fill('input[name="name"]', 'New Character');
    
    // Submit
    await page.click('button:has-text("Create")');
    
    // Verify new node appears
    await expect(page.locator('.react-flow__node:has-text("New Character")')).toBeVisible();
  });
});
```

**Key Selectors for ALNRetool**:
- `.react-flow__node` - Graph nodes
- `.react-flow__node-characterNode` - Character nodes specifically
- `.detail-panel` - Detail panel container
- `.filter-panel input` - Filter inputs
- `.floating-action-button` - Creation trigger
- `.create-panel` - Creation form

**Run tests**:
```bash
# Run in headed mode for debugging
npx playwright test --headed

# Run with UI mode for better debugging
npx playwright test --ui

# Run with trace for CI debugging
npx playwright test --trace on
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

### Testing Workflow Examples for ALNRetool

#### Example 1: Create End-to-End Test Script
```typescript
// tests/e2e/full-workflow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Full Graph Editing Workflow', () => {
  test('complete editing workflow', async ({ page }) => {
    // 1. Navigate to app
    await page.goto('http://localhost:5173');
    
    // 2. Wait for graph to load
    await page.waitForSelector('.react-flow__node');
    
    // 3. Take screenshot for visual regression
    await expect(page).toHaveScreenshot('initial-graph.png');
    
    // 4. Click on a character node
    await page.click('.react-flow__node-characterNode');
    
    // 5. Edit properties
    const nameInput = page.locator('input[name="name"]');
    await nameInput.clear();
    await nameInput.fill('Updated Character');
    
    // 6. Save changes
    await page.click('button:has-text("Save")');
    
    // 7. Check for console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    
    // 8. Verify no errors occurred
    expect(consoleErrors).toHaveLength(0);
    
    // 9. Verify changes persisted (check node text updated)
    await expect(page.locator('.react-flow__node:has-text("Updated Character")')).toBeVisible();
  });
});
```

#### Example 2: Create Page Object Model for Better Maintainability
```typescript
// tests/pages/GraphPage.ts
import { Page, Locator } from '@playwright/test';

export class GraphPage {
  readonly page: Page;
  readonly graphCanvas: Locator;
  readonly detailPanel: Locator;
  readonly fab: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.graphCanvas = page.locator('.react-flow');
    this.detailPanel = page.locator('.detail-panel');
    this.fab = page.locator('.floating-action-button');
    this.saveButton = page.locator('button:has-text("Save")');
  }

  async goto() {
    await this.page.goto('http://localhost:5173');
    await this.page.waitForSelector('.react-flow__node');
  }

  async selectNode(nodeType: string) {
    await this.page.click(`.react-flow__node-${nodeType}`);
    await this.detailPanel.waitFor({ state: 'visible' });
  }

  async editField(fieldName: string, value: string) {
    const input = this.page.locator(`input[name="${fieldName}"]`);
    await input.clear();
    await input.fill(value);
  }

  async save() {
    await this.saveButton.click();
    // Wait for save to complete (adjust based on your app's behavior)
    await this.page.waitForResponse(resp => resp.url().includes('/api/') && resp.status() === 200);
  }
}

// tests/e2e/using-page-object.spec.ts
import { test, expect } from '@playwright/test';
import { GraphPage } from '../pages/GraphPage';

test('edit character using page object', async ({ page }) => {
  const graphPage = new GraphPage(page);
  
  await graphPage.goto();
  await graphPage.selectNode('characterNode');
  await graphPage.editField('name', 'New Name');
  await graphPage.save();
  
  // Verify the change
  await expect(page.locator('.react-flow__node:has-text("New Name")')).toBeVisible();
});
```

#### Example 3: Playwright Configuration Best Practices
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

#### Example 4: Test Data Management
```typescript
// tests/fixtures/test-data.ts
export const testEntities = {
  character: {
    name: 'Test Character',
    type: 'NPC',
    description: 'A test character for E2E tests',
  },
  puzzle: {
    name: 'Test Puzzle',
    difficulty: 'Medium',
    solution: 'Test solution',
  },
  element: {
    name: 'Test Element',
    category: 'Clue',
    details: 'Test element details',
  },
};

// tests/e2e/data-driven.spec.ts
import { test, expect } from '@playwright/test';
import { testEntities } from '../fixtures/test-data';

for (const [entityType, data] of Object.entries(testEntities)) {
  test(`should create ${entityType}`, async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.click('.floating-action-button');
    await page.selectOption('select[name="type"]', entityType);
    
    for (const [field, value] of Object.entries(data)) {
      await page.fill(`input[name="${field}"]`, value.toString());
    }
    
    await page.click('button:has-text("Create")');
    await expect(page.locator(`.react-flow__node:has-text("${data.name}")`)).toBeVisible();
  });
}
```

#### Example 5: API Mocking for Isolated Testing
```typescript
// tests/e2e/with-mocking.spec.ts
import { test, expect } from '@playwright/test';

test('should handle API errors gracefully', async ({ page }) => {
  // Mock API failure
  await page.route('**/api/characters/*', route => {
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Internal Server Error' }),
    });
  });

  await page.goto('http://localhost:5173');
  await page.click('.react-flow__node-characterNode');
  
  // Try to save
  await page.fill('input[name="name"]', 'Updated Name');
  await page.click('button:has-text("Save")');
  
  // Verify error handling
  await expect(page.locator('.toast-error')).toBeVisible();
  await expect(page.locator('.toast-error')).toContainText('Failed to save');
});

test('should work with mocked successful response', async ({ page }) => {
  // Mock successful API response
  await page.route('**/api/characters', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: [
          { id: '1', name: 'Mocked Character', type: 'NPC' },
        ],
      }),
    });
  });

  await page.goto('http://localhost:5173');
  await expect(page.locator('.react-flow__node:has-text("Mocked Character")')).toBeVisible();
});
```

### Playwright Best Practices for ALNRetool

#### 1. Test Isolation
```typescript
test.describe('Isolated tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clean state for each test
    await page.goto('http://localhost:5173');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });
});
```

#### 2. Use Web-First Assertions
```typescript
// ✅ Good - waits for condition
await expect(page.locator('.detail-panel')).toBeVisible();

// ❌ Bad - checks immediately
const isVisible = await page.locator('.detail-panel').isVisible();
expect(isVisible).toBe(true);
```

#### 3. Avoid Hard Waits
```typescript
// ✅ Good - wait for specific condition
await page.waitForSelector('.react-flow__node');
await page.waitForResponse(resp => resp.url().includes('/api/characters'));

// ❌ Bad - arbitrary wait
await page.waitForTimeout(5000);
```

#### 4. Debugging Techniques
```bash
# Run single test file
npx playwright test tests/e2e/graph-editing.spec.ts

# Debug specific test
npx playwright test --debug tests/e2e/graph-editing.spec.ts:10

# Generate trace for debugging
npx playwright test --trace on

# View test report
npx playwright show-report
```

// 3. Get documentation for best practices
mcp__context7__get-library-docs({
  context7CompatibleLibraryID: "/tanstack/query",
  topic: "mutations"
})
```

#### Example 7: Performance Testing with Playwright
```typescript
// tests/e2e/performance.spec.ts
import { test, expect } from '@playwright/test';

test('should handle large graphs efficiently', async ({ page }) => {
  // Start performance measurement
  await page.goto('http://localhost:5173');
  
  // Measure initial load time
  const loadMetrics = await page.evaluate(() => {
    const perf = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    return {
      domContentLoaded: perf.domContentLoadedEventEnd - perf.domContentLoadedEventStart,
      loadComplete: perf.loadEventEnd - perf.loadEventStart,
    };
  });
  
  expect(loadMetrics.loadComplete).toBeLessThan(3000); // 3 second max
  
  // Measure layout calculation time
  await page.evaluate(() => performance.mark('layout-start'));
  await page.click('.filter-checkbox'); // Trigger re-layout
  
  const layoutTime = await page.evaluate(() => {
    performance.mark('layout-end');
    performance.measure('layout-time', 'layout-start', 'layout-end');
    const measure = performance.getEntriesByName('layout-time')[0];
    return measure.duration;
  });
  
  expect(layoutTime).toBeLessThan(500); // 500ms max for layout
  
  // Check memory usage doesn't exceed threshold
  const memoryUsage = await page.evaluate(() => {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  });
  
  expect(memoryUsage).toBeLessThan(100 * 1024 * 1024); // 100MB max
});

// Use Zen for deeper performance analysis
test('analyze performance bottlenecks', async () => {
  // Create a performance test script that Zen can analyze
  const performanceScript = `
    // tests/performance/analyze-layout.ts
    import { measureLayoutPerformance } from '../utils/performance';
    
    test('layout performance', async () => {
      const metrics = await measureLayoutPerformance();
      console.log('Layout metrics:', metrics);
    });
  `;
  
  // Then use Zen to analyze the results
  // mcp__zen__analyze({
  //   step: "Analyze src/lib/graph/layout/dagre.ts for performance bottlenecks",
  //   analysis_type: "performance",
  //   model: "gemini-2.5-pro"
  // })
});
```

#### Example 8: Generate Tests with Zen MCP
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

// Generate tests for creation flow
mcp__zen__testgen({
  step: "Generate tests for src/components/CreatePanel.tsx",
  findings: "Focus on: form validation, entity creation, error handling",
  step_number: 1,
  total_steps: 1,
  next_step_required: false,
  model: "o3"
})
```
