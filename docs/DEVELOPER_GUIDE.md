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

### Integration Testing

We maintain two test suites:
- **Smoke Tests** (`npm test`): Quick health checks using mock data
- **Integration Tests** (`npm run test:integration`): Full Notion API validation

#### Running Integration Tests
```bash
npm run test:integration  # Uses real Notion credentials from .env
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
│   │   └── notion.ts      # Notion proxy endpoints
│   ├── middleware/        # Express middleware
│   │   ├── auth.ts        # API key authentication
│   │   └── errorHandler.ts # Global error handling
│   └── services/          # Business logic
│       └── notion.ts      # Notion client wrapper
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
- Run smoke tests before pushing
- Test with empty Notion databases
- Verify error states display correctly
- Check responsive design at 1024px+

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