# ALNRetool Developer Onboarding Guide

Welcome to the ALNRetool project! This guide will help you get up and running quickly, understand the codebase structure, and start contributing effectively.

## Quick Start (5 minutes)

### Prerequisites
- Node.js 18+ and npm
- Git
- A code editor (VSCode recommended)
- Access to Notion workspace (request from team lead)

### Initial Setup

1. **Clone and Install**
```bash
git clone https://github.com/maxepunk/ALNRetool.git
cd ALNRetool
npm install
```

2. **Configure Environment**
```bash
cp .env.example .env
# Edit .env with your credentials (see team lead for values)
```

3. **Run Development Servers**
```bash
npm run dev
# Frontend: http://localhost:5173
# Backend: http://localhost:3001
```

4. **Verify Setup**
```bash
npm run test:quick  # Runs smoke tests
```

## Project Overview

ALNRetool is a visualization and editing tool for the "About Last Night" murder mystery game. It transforms Notion databases into interactive graphs, helping designers understand puzzle dependencies and character interactions.

### Key Features
- **3 Visualization Views**: Puzzle Focus, Character Journey, Content Status
- **Inline Editing**: Update Notion data without leaving the tool
- **Real-time Sync**: Changes reflect immediately in Notion
- **Smart Filtering**: By act, status, character tier

### Architecture at a Glance

```
[Notion Databases] ←→ [Express API Proxy] ←→ [React Frontend]
                            ↓                        ↓
                     [Rate Limiting]          [React Flow Graphs]
                     [Authentication]         [TanStack Query]
                     [Cache Layer]            
                     [Validation]
```

## Development Workflow

### Daily Development

1. **Check Project Status**
```bash
cat docs/PROJECT_STATUS.md  # See current sprint progress
```

2. **Pull Latest Changes**
```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
```

3. **Start Development**
```bash
npm run dev  # Starts both frontend and backend
```

4. **Before Committing**

Our project uses automated pre-commit hooks to ensure code quality. These hooks run automatically when you commit, but you can also run the checks manually:

```bash
npm run lint       # Fix any linting issues
npm run typecheck  # Ensure TypeScript is happy
npm test          # Run smoke tests
```

**Pre-commit Hook Details:**
- Located at `.git/hooks/pre-commit` (already configured and working)
- Runs ESLint, TypeScript checks, and zen:precommit validation
- Prevents commits if any check fails
- Automatically set up during project initialization

If pre-commit hooks fail, you'll see which check failed and can fix the issues before retrying.

5. **Commit with Conventional Commits**
```bash
npx cz  # Interactive commit helper
# OR manually: git commit -m "feat(scope): description"
```

### Common Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both frontend and backend servers |
| `npm run dev:client` | Start only frontend (Vite) |
| `npm run dev:server` | Start only backend (Express) |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Check TypeScript types |
| `npm test` | Run smoke test suite |
| `npm run test:integration` | Run integration test suite |

### Testing

We maintain multiple test suites:
- **Smoke Tests** (`npm test`): Quick health checks using mock data
- **Unit Tests** (`npm run test:run`): Vitest tests for React Query hooks and components (504 passing, 5 skipped)
- **Integration Tests** (`npm run test:integration`): Full Notion API validation (23 tests)
- **CI/CD Pipeline**: Automated GitHub Actions workflow on every push

#### Running Integration Tests
```bash
npm run test:integration  # Uses real Notion credentials from .env
# Expected: 23/23 tests passing (100% success rate)
```

#### Test Data Requirements

Integration tests require actual data in your Notion databases:
- At least one Character with name, type, and tier
- At least one Element with SF_ patterns in Description/Text
- At least one Puzzle with puzzle elements
- At least one Timeline event with a date

#### Adding Test Data

1. Open your Notion workspace
2. Add a test Element with this description:
```
Test element for integration testing.
SF_RFID: [TEST-001]
SF_ValueRating: [3]
SF_MemoryType: [Personal]
SF_Group: [Test Items]
```

## CI/CD Pipeline

### GitHub Actions Workflow

The project uses GitHub Actions for continuous integration, running on every push and pull request.

#### Workflow Jobs

1. **Test Job** - Main validation suite
   - ESLint code quality checks
   - TypeScript type checking (client & server)
   - Vitest unit tests (212 tests)
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

For integration tests to run in CI, add these secrets to your repository:

1. Go to Settings → Secrets and variables → Actions
2. Add the following secrets:
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

## Code Organization

### Directory Structure
```
ALNRetool/
├── src/                    # React frontend
│   ├── components/         # React components
│   │   ├── nodes/         # Custom React Flow nodes
│   │   └── views/         # Main view components
│   ├── hooks/             # Custom React hooks
│   ├── services/          # API client code
│   ├── types/             # TypeScript types
│   │   └── notion/        # Notion-specific types
│   │       ├── raw.ts     # Raw Notion API types
│   │       ├── app.ts     # Clean app types
│   │       └── transforms.ts # Data transformers
│   └── utils/             # Helper functions
│
├── server/                 # Express backend
│   ├── index.ts           # Server entry point
│   ├── routes/            # API routes
│   │   ├── notion.ts      # Notion proxy endpoints
│   │   └── cache.ts       # Cache management endpoints
│   ├── middleware/        # Express middleware
│   │   ├── auth.ts        # API key authentication
│   │   ├── validation.ts  # Input validation
│   │   └── errorHandler.ts # Global error handling
│   └── services/          # Business logic
│       ├── notion.ts      # Notion client wrapper
│       └── cache.ts       # Cache service (node-cache)
│
├── docs/                   # Documentation
├── scripts/               # Utility scripts
│   └── smoke-test.ts      # API test suite
└── dist/                  # Build output (gitignored)
```

### Key Design Decisions

1. **3-File Type System**: Instead of 8+ type files, we use:
   - `raw.ts`: Exact Notion API response types
   - `app.ts`: Clean, UI-friendly types
   - `transforms.ts`: Functions to convert raw → app

2. **Express Proxy Pattern**: 
   - Hides Notion API key from frontend
   - Handles rate limiting centrally
   - Provides consistent error responses

3. **Bottleneck Rate Limiting**:
   - 340ms between Notion API calls
   - Prevents 429 errors from Notion
   - Transparent queuing for users

4. **Server-Side Caching**:
   - 5-minute TTL matches React Query frontend
   - Reduces Notion API calls by 70-80%
   - Cache bypass via `X-Cache-Bypass: true` header
   - Management endpoints for stats and clearing

5. **Input Validation**:
   - Pagination limits enforced (1-100)
   - Consistent error codes for bad requests
   - Prevents invalid Notion API calls

## Understanding the Data Model

### Game Structure
- **Characters**: Players and NPCs with tier-based importance
- **Elements**: Physical items, documents, and RFID memory tokens
- **Puzzles**: Challenges that unlock elements and reveal story
- **Timeline**: Backstory events players discover through gameplay

### Key Relationships
```
Character --owns--> Element --required for--> Puzzle --reveals--> Timeline Event
    ^                              |
    |                              v
    +--------connects via----- shared events
```

### SF_ Pattern System
Elements contain metadata in their description:
```
SF_RFID: ABC123              # Unique identifier
SF_ValueRating: 4            # 1-5 importance
SF_MemoryType: Business      # Personal/Business/Technical
SF_Group: Financial Records  # Collection bonus category
```

## Common Development Tasks

### Adding a New API Endpoint

1. **Define Route** in `server/routes/notion.ts`:
```typescript
router.get('/newentity', async (req, res) => {
  try {
    const databaseId = process.env.NOTION_NEWENTITY_DB;
    if (!databaseId) {
      return res.status(500).json({ 
        statusCode: 500, 
        code: 'CONFIG_ERROR', 
        message: 'NewEntity database ID not configured' 
      });
    }
    
    const pages = await fetchAllPages(databaseId);
    const entities = pages.map(transformNewEntity);
    
    res.json({
      data: entities,
      nextCursor: null,
      hasMore: false
    });
  } catch (error) {
    handleNotionError(error, res);
  }
});
```

2. **Add Transform Function** in `src/types/notion/transforms.ts`
3. **Update Types** in `src/types/notion/app.ts`
4. **Add Environment Variable** to `.env` and `.env.example`
5. **Update API Documentation** in `docs/API.md`
6. **Add Smoke Test** in `scripts/smoke-test.ts`

### Modifying React Flow Nodes

1. **Create/Edit Node Component** in `src/components/nodes/`
2. **Register Node Type** in view component:
```typescript
const nodeTypes = {
  character: CharacterNode,
  element: ElementNode,
  puzzle: PuzzleNode,
  // Add your new node type here
};
```
3. **Style with CSS Module** in same directory

### Updating Notion Field Mappings

1. **Check Notion Schema** - Field names must match exactly
2. **Update Raw Type** in `src/types/notion/raw.ts`
3. **Update App Type** in `src/types/notion/app.ts`
4. **Update Transform** in `src/types/notion/transforms.ts`
5. **Test with Real Data** using smoke tests

## Debugging Tips

### Common Issues and Solutions

1. **"401 Unauthorized" Error**
   - Check `X-API-Key` header is being sent
   - Verify `API_KEY` in `.env` matches what frontend sends

2. **"500 Config Error" from Endpoints**
   - Missing Notion database ID in `.env`
   - Check spelling matches exactly (e.g., `NOTION_CHARACTERS_DB`)

3. **Empty Data Arrays**
   - Verify Notion integration has access to databases
   - Check database IDs are correct (32-char format)
   - Ensure no filters blocking data in Notion

4. **CORS Errors**
   - Frontend must run on `http://localhost:5173`
   - Check `NODE_ENV` is set to `development`

5. **Rate Limit Errors**
   - Bottleneck should prevent these
   - If occurring, check `minTime: 340` in `server/services/notion.ts`

### Debugging Tools

```bash
# Check server logs
npm run dev:server  # Watch console output

# Test specific endpoint
curl -X GET http://localhost:3001/api/notion/characters \
  -H "X-API-Key: your-key" | jq

# Inspect Notion API directly
# Use Notion's API explorer: https://developers.notion.com/reference

# Run specific smoke test
# Edit scripts/smoke-test.ts to focus on one suite
```

## React Query Development Patterns

### Data Fetching Layer Architecture

Our frontend uses TanStack Query for all data fetching with a well-defined architecture:

#### Query Client Configuration
```typescript
// Pre-configured in src/lib/queryClient.ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,  // 5 minutes - data stays fresh
      gcTime: 10 * 60 * 1000,    // 10 minutes - memory cleanup
      retry: 3,                   // Automatic retries
      refetchOnWindowFocus: false,
    },
  },
});
```

#### Using Data Hooks
```typescript
// All hooks support both paginated and listAll methods
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

#### Error Boundary Pattern
```typescript
// Always wrap data-fetching components
import { QueryErrorBoundary } from '@/components/QueryErrorBoundary';

<QueryErrorBoundary>
  <CharacterList />
</QueryErrorBoundary>
```

#### Available Hooks
- `useCharacters.listAll()` / `useCharacters.paginated(params)`
- `useElements.listAll()` / `useElements.paginated(params)`
- `usePuzzles.listAll()` / `usePuzzles.paginated(params)`
- `useTimeline.listAll()` / `useTimeline.paginated(params)`

#### Query Key Patterns
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

// Usage in hooks
useQuery({
  queryKey: queryKeys.characters.list({ limit: 20 }),
  queryFn: () => api.characters.list({ limit: 20 }),
});
```

#### Testing with MSW
```typescript
// Mock Service Worker set up in src/mocks/
// Tests use real component rendering with mocked API calls
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

render(
  <QueryClientProvider client={queryClient}>
    <CharacterList />
  </QueryClientProvider>
);

expect(screen.getByText('Loading...')).toBeInTheDocument();
```

## Best Practices

### Code Style
- Use TypeScript strict mode
- Follow ESLint rules (auto-fixable with `npm run lint`)
- Use conventional commits for clear history
- Keep functions small and focused

### Performance
- React Flow: Virtualize graphs >100 nodes
- Debounce user input by 300ms
- Use React.memo for node components
- Cache Notion data with TanStack Query

### Security
- Never commit `.env` files
- Keep Notion API key server-side only
- Validate all user inputs before Notion calls
- Use TypeScript for type safety

### Testing

#### Test Suite Overview (As of Jan 15, 2025)
- **Total Tests**: 509 (504 passing, 5 skipped)
- **Success Rate**: 99.0%
- **Test Coverage**: ~90% for critical paths

#### Test Structure
```bash
# Unit Tests (Vitest)
npm run test:run      # 504/509 passing

# Integration Tests (Real Notion API)  
npm run test:integration  # 23/23 passing (100%)

# Quick Smoke Test
npm test             # Basic health check
```

#### Skipped Tests
- 5 AppLayout tests for navigation features planned for Sprint 2
- These tests are correctly deferred and not blocking MVP

#### Testing Best Practices
- Run tests before committing: `npm run test:run`
- Verify integration after backend changes: `npm run test:integration`
- Test with real Notion data when possible
- Always test error states and loading states
- Mock external dependencies with MSW
- Use test utilities from `src/test/utils/`

#### Writing New Tests
```typescript
// Use centralized test utilities
import { renderWithProviders } from '@/test/utils/test-utils'
import { mockCharacters } from '@/test/mocks/data/characters'

// Test component with all providers
const { container } = renderWithProviders(
  <YourComponent />,
  { initialEntries: ['/path'] }
)
```

#### Pre-commit Testing
The project has automated pre-commit hooks that run:
- ESLint checks
- TypeScript type checking  
- Located in `.git/hooks/pre-commit`
- Use `--no-verify` to bypass in emergencies

## Getting Help

### Resources
1. **Project Documentation**
   - `README.md` - Project overview
   - `docs/API.md` - API reference
   - `docs/PROJECT_STATUS.md` - Current sprint status
   - `alnretool-prd.md` - Product requirements
   - `alnretool-action-plan.md` - Development timeline

2. **External Documentation**
   - [React Flow](https://reactflow.dev/docs)
   - [Notion API](https://developers.notion.com)
   - [TanStack Query](https://tanstack.com/query)
   - [Express.js](https://expressjs.com)

3. **Team Communication**
   - Slack: #alnretool-dev
   - GitHub Issues for bugs/features
   - Weekly sync meetings (Fridays 2pm)

### Common Gotchas

1. **Notion Pagination**: We fetch all pages internally, so response may be slow for large databases
2. **UUID Format**: Database IDs must include hyphens (e.g., `18c2f33d-583f-8060-a6ab-de32ff06bca2`)
3. **Environment Variables**: Loaded only on server start - restart after changes
4. **TypeScript Paths**: Use `@/` for `src/` imports (configured in Vite and TypeScript)
5. **Build Order**: Server TypeScript builds to `dist/`, client to `dist/client/`

## Next Steps

1. **Explore the Codebase**
   - Read through existing view components
   - Understand the data flow from Notion → Transform → UI
   - Try modifying a simple component

2. **Run the Smoke Tests**
   - Understand what each test validates
   - Try adding a new test case

3. **Make a Small Change**
   - Fix a typo in documentation
   - Add a helpful comment
   - Submit your first PR!

4. **Join the Conversation**
   - Introduce yourself in Slack
   - Ask questions - we're here to help!
   - Share ideas for improvements

Welcome to the team! We're excited to have you contributing to ALNRetool. 🎉