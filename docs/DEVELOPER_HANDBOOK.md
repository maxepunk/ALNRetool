# Developer Handbook

This handbook contains practical guidance for developers working on ALNRetool. For getting started, see the [README](../README.md).

## Table of Contents
- [Architecture Decisions](#architecture-decisions)
- [Common Development Tasks](#common-development-tasks)
- [React Query Patterns](#react-query-patterns)
- [Debugging Guide](#debugging-guide)
- [CI/CD Pipeline](#cicd-pipeline)
- [Common Gotchas](#common-gotchas)

## Architecture Decisions

### 3-File Type System
Instead of 8+ type files, we use a simplified architecture:
- `raw.ts`: Exact Notion API response types
- `app.ts`: Clean, UI-friendly types
- `transforms.ts`: Functions to convert raw → app

### Graph Layout System (Pure Dagre)
**As of Sprint 2 (January 17, 2025)**, we use a pure Dagre layout approach:
- **Single-phase algorithm** replacing complex hybrid layouts
- **Natural edge flow** creates semantic positioning (requirements→puzzles→rewards)
- **Network-simplex algorithm** for minimal edge crossings
- **Fractional ranks** support dual-role elements (reward from one puzzle, requirement for another)

Key files:
- `src/lib/graph/pureDagreLayout.ts`: Core layout algorithm with semantic ranking
- `src/lib/graph/index.ts`: Main graph builder orchestration
- `src/lib/graph/transformers/`: Entity-specific transformers
- `src/lib/graph/relationships.ts`: Edge resolution with integrity checking

#### Usage Example
```typescript
import { buildGraphData } from '@/lib/graph';

// Build a puzzle-focused graph with pure Dagre layout
const graphData = buildGraphData(notionData, {
  viewType: 'puzzle-focus',          // Triggers pure Dagre layout
  filterRelationships: ['requirement', 'reward', 'chain'],
  includeOrphans: false,
  enableIntegrityChecking: true
});
```

#### Layout Configuration
```typescript
// Pure Dagre configuration for puzzle-focus view
{
  direction: 'LR',              // Left-to-right flow
  rankSeparation: 300,          // Horizontal spacing between columns
  nodeSeparation: 100,          // Vertical spacing within columns
  puzzleSpacing: 300,           // Extra spacing for puzzle chains
  elementSpacing: 100,          // Standard element spacing
  useFractionalRanks: true,     // Enable for dual-role elements
  optimizeEdgeCrossings: true,  // Use network-simplex algorithm
}
```

#### How It Works
1. **Natural Edge Flow**: The layout leverages existing edge directions
   - Requirement edges: `element → puzzle` (elements flow into puzzles)
   - Reward edges: `puzzle → element` (puzzles flow to reward elements)
   - Chain edges: `puzzle → puzzle` (sequential puzzle progression)

2. **Semantic Ranking**: Dagre automatically positions nodes based on edge flow
   - Requirements naturally appear left of puzzles
   - Puzzles form the central column
   - Rewards appear right of puzzles
   - No manual positioning required

3. **Edge Weight Optimization**: Different relationship types have different weights
   - Chain edges: weight=100 (strongest, keeps puzzles aligned)
   - Requirement/Reward edges: weight=10 (moderate strength)
   - Other relationships: weight=1 (default)

### Express Proxy Pattern
- Hides Notion API key from frontend
- Handles rate limiting centrally (340ms between calls)
- Provides consistent error responses
- Enables server-side caching

### Server-Side Caching Strategy
- 5-minute TTL matches React Query frontend
- Reduces Notion API calls by 70-80%
- Cache bypass via `X-Cache-Bypass: true` header
- Management endpoints for stats and clearing

### Input Validation Middleware
- Pagination limits enforced (1-100)
- Consistent error codes for bad requests
- Prevents invalid Notion API calls
- Runs before authentication for fast failure

## Common Development Tasks

### Adding a New API Endpoint

1. **Define Route** in `server/routes/notion.ts`:
```typescript
router.get('/newentity', asyncHandler(async (req: Request, res: Response) => {
  const databaseId = process.env.NOTION_NEWENTITY_DB;
  if (!databaseId) {
    throw new AppError(500, 'CONFIG_ERROR', 'NewEntity database ID not configured');
  }
  
  const pages = await fetchAllPages(databaseId);
  const entities = pages.map(transformNewEntity);
  
  res.json({
    data: entities,
    nextCursor: null,
    hasMore: false
  });
}));
```

2. **Add Transform Function** in `src/types/notion/transforms.ts`
3. **Update Types** in `src/types/notion/app.ts`
4. **Add Environment Variable** to `.env` and `.env.example`
5. **Update API Documentation** in `docs/API.md`
6. **Add Integration Test** in `scripts/integration-test.ts`

### Creating Custom React Flow Nodes

1. **Create Node Component** in `src/components/nodes/`:
```typescript
export const CustomNode: React.FC<NodeProps<CustomData>> = ({ data }) => {
  return (
    <div className={styles.customNode}>
      <Handle type="target" position={Position.Top} />
      {/* Node content */}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};
```

2. **Register Node Type** in view component:
```typescript
const nodeTypes = {
  character: CharacterNode,
  element: ElementNode,
  puzzle: PuzzleNode,
  custom: CustomNode, // Add here
};
```

3. **Style with CSS Module** in same directory

### Working with Graph Layouts

The graph system uses pure Dagre layout with semantic ranking:

1. **Build a Graph** with specific view type:
```typescript
import { buildGraphData } from '@/lib/graph';

const graphData = buildGraphData(notionData, {
  viewType: 'puzzle-focus',  // Determines layout strategy
  filterRelationships: ['requirement', 'reward'],
  includeOrphans: false
});
```

2. **Customize Layout Parameters**:
```typescript
// In src/lib/graph/index.ts applyLayout function
return applyPureDagreLayout(nodes, edges, {
  direction: 'LR',              // Left-to-right flow
  rankSeparation: 300,          // Horizontal spacing
  nodeSeparation: 100,          // Vertical spacing
  optimizeEdgeCrossings: true,  // Use network-simplex
});
```

3. **Natural Edge Flow Pattern**:
- Requirements flow INTO puzzles (element→puzzle edges)
- Rewards flow OUT OF puzzles (puzzle→element edges)
- This creates: requirements (left) → puzzles (center) → rewards (right)

### Updating Notion Field Mappings

1. **Check Notion Schema** - Field names must match exactly
2. **Update Raw Type** in `src/types/notion/raw.ts`
3. **Update App Type** in `src/types/notion/app.ts`
4. **Update Transform** in `src/types/notion/transforms.ts`
5. **Test with Integration Tests**: `npm run test:integration`

## React Query Patterns

### Query Client Configuration
```typescript
// Pre-configured in src/lib/queryClient.ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,  // 5 minutes
      gcTime: 10 * 60 * 1000,    // 10 minutes
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
});
```

### Using Data Hooks
```typescript
import { useCharacters } from '@/hooks/useCharacters';

function CharacterList() {
  // Get all characters at once
  const { data, isLoading, error } = useCharacters.listAll();
  
  // Or use paginated approach
  const paginated = useCharacters.paginated({ limit: 20 });
  
  if (isLoading) return <CharacterSkeleton />;
  if (error) throw error; // Caught by QueryErrorBoundary
  
  return <div>{/* render characters */}</div>;
}
```

### Query Key Patterns
```typescript
// Centralized in src/lib/queryKeys.ts
const queryKeys = {
  characters: {
    all: ['characters'] as const,
    lists: () => [...queryKeys.characters.all, 'list'] as const,
    list: (params: CharacterListParams) => 
      [...queryKeys.characters.lists(), params] as const,
  },
};
```

### Testing with MSW
```typescript
// Tests use real component rendering with mocked API calls
import { renderWithProviders } from '@/test/utils/test-utils';

const { container } = renderWithProviders(
  <YourComponent />,
  { initialEntries: ['/path'] }
);
```

## Debugging Guide

### Common Issues and Solutions

#### "401 Unauthorized" Error
- Check `X-API-Key` header is being sent
- Verify `NOTION_API_KEY` in `.env` matches
- In production, same-origin requests don't need API key

#### "500 Config Error" from Endpoints
- Missing Notion database ID in `.env`
- Check spelling matches exactly (e.g., `NOTION_CHARACTERS_DB` not `NOTION_CHARACTER_DB_ID`)

#### Empty Data Arrays
- Verify Notion integration has access to databases
- Check database IDs are correct (32-char format with hyphens)
- Ensure no filters blocking data in Notion

#### CORS Errors
- Frontend must run on `http://localhost:5173` in development
- Check `NODE_ENV` is set correctly
- In production, verify `FRONTEND_URL` is set

#### Rate Limit Errors
- Bottleneck should prevent these (340ms spacing)
- If occurring, check `minTime` in `server/services/notion.ts`

### Debugging Tools
```bash
# Check server logs
npm run dev:server  # Watch console output

# Test specific endpoint
curl -X GET http://localhost:3001/api/notion/characters \
  -H "X-API-Key: your-key" | jq

# Run specific integration test
npm run test:integration -- --grep "characters"

# Check cache status
curl -X GET http://localhost:3001/api/cache/stats \
  -H "X-API-Key: your-key"
```

## CI/CD Pipeline

### GitHub Actions Workflow

The project uses GitHub Actions for continuous integration, running on every push and pull request.

#### Workflow Jobs

1. **Test Job** - Main validation suite
   - ESLint code quality checks
   - TypeScript type checking (client & server)
   - Vitest unit tests (504+ tests)
   - Production build verification
   - Bundle size monitoring (2MB limit)
   - Build artifact uploads (7-day retention)

2. **Integration Job** - Notion API testing
   - Runs after main tests pass
   - Uses GitHub Secrets for API keys
   - Gracefully skips on forks without secrets
   - Validates all 4 Notion endpoints

3. **Quality Job** - Code metrics
   - TypeScript test coverage reporting
   - Console.log detection in production code
   - TODO/FIXME/HACK comment tracking

4. **Summary Job** - Final status report

#### Setting Up GitHub Secrets

For integration tests to run in CI:

1. Go to Settings → Secrets and variables → Actions
2. Add these secrets:
   - `NOTION_API_KEY`: Your Notion integration token
   - `NOTION_CHARACTERS_DB`: Characters database ID
   - `NOTION_ELEMENTS_DB`: Elements database ID
   - `NOTION_PUZZLES_DB`: Puzzles database ID
   - `NOTION_TIMELINE_DB`: Timeline database ID

#### CI Status

View CI runs at: https://github.com/maxepunk/ALNRetool/actions

The workflow runs on:
- Push to `main`, `develop`, or `feature/**` branches
- All pull requests to `main` or `develop`
- Concurrent runs are automatically cancelled

## Common Gotchas

### Environment Variables
- **Production**: NEVER loads .env files - uses platform variables only
- **Development**: Loads from .env file
- **Restart Required**: Server must restart after .env changes

### Notion Pagination
- We fetch all pages internally (no cursor needed)
- Response may be slow for large databases
- Consider implementing true pagination in Sprint 3

### UUID Format
- Database IDs must include hyphens
- Example: `18c2f33d-583f-8060-a6ab-de32ff06bca2`
- Without hyphens, Notion API returns 400 error

### TypeScript Paths
- Use `@/` for `src/` imports
- Configured in both Vite and TypeScript configs
- Tests use same path aliases

### Build Order
- Server TypeScript builds to `dist/`
- Client builds to `dist/client/`
- Production serves client from `dist/client/`

### React Flow Performance
- Virtualize graphs with >100 nodes
- Use React.memo for custom node components
- Debounce user interactions by 300ms

## Sprint 2: Search & Filter Implementation

### Filter Architecture (January 2025)

The filtering system is implemented entirely client-side to avoid React Flow state conflicts:

#### Components
- **GraphControls**: Main filter UI panel with collapsible interface
  - Location: `src/components/graph/GraphControls.tsx`
  - Features: Search, Act filter, Puzzle selector, minimize/restore
  - Uses shadcn/ui components with glassmorphism styling

#### State Management
```typescript
interface FilterState {
  searchTerm: string;
  selectedActs: Set<string>;
  selectedPuzzleId: string | null;
}
```

- Stored in sessionStorage for persistence
- Applied BEFORE passing data to React Flow
- No useGraphFilters hook - direct state management in GraphView

#### Filtering Algorithm
1. **Search Filter**: Fuzzy text matching on node labels
   - Includes connected nodes for context
   - Case-insensitive substring matching
   
2. **Act Filter**: Matches elements by firstAvailable property
   - Elements filtered by firstAvailable field
   - Puzzles filtered by timing array
   - Includes all connected nodes

3. **Puzzle Isolation**: Recursive dependency traversal
   - Finds all upstream and downstream dependencies
   - Uses bidirectional edge traversal

#### Key Implementation Details
```typescript
// Apply filters BEFORE React Flow state initialization
const filteredGraphData = useMemo(() => {
  let filteredNodes = [...graphData.nodes];
  // Apply search, act, and puzzle filters
  // ...
  return { nodes: filteredNodes, edges: filteredEdges };
}, [graphData, filterState]);

// Pass filtered data to useGraphState
const { nodes, edges } = useGraphState({
  initialGraphData: filteredGraphData
});
```

#### Node Type Fix (Critical Bug)
The transformers output node types as:
- `'element'` not `'elementNode'`
- `'puzzle'` not `'puzzleNode'`
- `'character'` not `'characterNode'`

This mismatch caused filtering to fail silently.

#### UI Features
- **Collapsible Panel**: Save screen space with animated transitions
- **Active Filter Badges**: Visual indicators of applied filters
- **Clear Filters**: One-click reset with count badges
- **Responsive Design**: Mobile-friendly with touch support

---

For more information:
- [README](../README.md) - Getting started
- [API Documentation](./API.md) - Endpoint reference
- [Deployment Guide](../DEPLOYMENT.md) - Production deployment
- [Project Status](./PROJECT_STATUS.md) - Current sprint progress