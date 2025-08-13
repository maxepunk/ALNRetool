# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ALNRetool is a visualization and editing tool for "About Last Night," a 20-40 player murder mystery game. It enables puzzle and narrative designers to visualize and edit game content stored in Notion databases through interactive graph interfaces.

## Current Project Status - Sprint 1 Foundation

### ✅ COMPLETED: Days 1-4 Implementation

**Days 1-2: Development Environment** - COMPLETE
- Vite React TypeScript project with dual-server architecture
- All core dependencies installed and configured
- TypeScript strict mode with path aliases (`@/*` → `src/*`)
- ESLint + Prettier integration for code quality
- Git repository with conventional commit standards

**Days 3-4: Notion Integration** - COMPLETE
- **Full TypeScript Type System**: 3-file architecture (`raw.ts`, `app.ts`, `transforms.ts`)
- **All 4 API Endpoints**: `/api/notion/{characters,elements,puzzles,timeline}`
- **Security Layer**: API key authentication, CORS restrictions, rate limiting
- **Error Handling**: AsyncHandler pattern prevents server crashes
- **Integration Testing**: 23/23 tests passing (100% success rate)
- **Performance**: Cached responses <50ms, Notion calls <1s, 340ms rate limiting
- **Server-Side Caching**: 5-minute TTL, reduces API calls by 70-80%
- **Input Validation**: Pagination limits (1-100), consistent error codes

**Current Capabilities**:
- Complete Notion database access through secure Express proxy
- Type-safe data transformations with SF_ pattern parsing
- Robust error handling and server stability
- Production-ready authentication and security measures
- Server-side caching with cache management endpoints
- Input validation middleware preventing invalid requests

### 🔄 NEXT: Days 5-10 Remaining Sprint 1 Tasks

**Day 5**: React Query data fetching layer setup
**Days 6-7**: Graph transformation algorithms 
**Days 8-9**: Basic UI scaffold with React Router
**Day 10**: Sprint 1 verification and integration testing

### 📊 Architecture Status

**Backend (100% Complete)**:
- Express server with TypeScript
- Notion API integration with rate limiting
- Security middleware and error handling
- Comprehensive integration test suite (23/23 passing)
- Server-side caching layer (node-cache)
- Input validation middleware

**Frontend (Ready for Development)**:
- Vite development environment configured
- TypeScript strict mode enabled
- Ready for React Query and React Flow integration

## Key Architecture

### Tech Stack
- **Frontend**: React 18 with TypeScript
- **Graph Visualization**: React Flow (for interactive node/edge diagrams)
- **Data Storage**: Notion API (all game data lives in Notion databases)
- **State Management**: TanStack Query (for data fetching, caching, and mutations)
- **Graph Layouts**: Dagre (for automatic graph positioning)
- **Notifications**: React Hot Toast
- **Backend**: Express (API proxy for Notion authentication)

### Core Views (MVP)
1. **Puzzle Focus View**: Interactive puzzle network showing dependencies
2. **Character Journey View**: Character timeline with element connections
3. **Content Status View**: Status dashboard for tracking content completion

### Notion Database Schema

#### Characters Database (`18c2f33d-583f-8060-a6ab-de32ff06bca2`)

| Field | Type | Purpose | Design Implications |
|-------|------|---------|-------------------|
| **Name** | Title | Character identifier | Display name in graphs |
| **Type** | Select (NPC/Player) | Playable vs non-playable | Filter option, visual distinction |
| **Tier** | Select (Core/Secondary/Tertiary) | Narrative importance; Core=5 minimum players | Node importance/size, filter priority |
| **Owned Elements** | Relation (synced with Elements.Owner) | Items character starts with or POV memories | Primary puzzle access paths |
| **Associated Elements** | Relation | Narratively connected items | Secondary connections |
| **Character Puzzles** | Relation | Puzzles this character can access | Direct puzzle connections |
| **Events** | Relation (synced with Timeline.Characters Involved) | Backstory moments involving character | Narrative depth |
| **Connections** | Rollup (Events → Characters, function: unique) | Shared timeline events with others | Social interaction potential |
| **Primary Action** | Rich Text | Core character behavior | Future: personality modeling |
| **Character Logline** | Rich Text | One-line description | Tooltip/summary display |
| **Overview & Key Relationships** | Rich Text | Detailed background | Future: relationship mapping |
| **Emotion towards CEO & others** | Rich Text | Relationship dynamics | Future: emotion network |

**Design Intent**: Ownership is probabilistic - "most likely to possess first." Core tier includes both Players and NPCs critical to the narrative (e.g., Detective).

#### Elements Database (`18c2f33d-583f-8020-91bc-d84c7dd94306`)

| Field | Type | Purpose | Design Implications |
|-------|------|---------|-------------------|
| **Name** | Title | Element identifier | Node labels |
| **Description/Text** | Rich Text | Content + SF_ patterns | Parse for memory values, display content |
| **Basic Type** | Select | Physical manifestation | Icon/color coding |
| | | Options: Set Dressing, Prop, Memory Token (Audio/Video/Image/Audio+Image), Document | Memory tokens are RFID scannable |
| **Owner** | Relation (synced with Characters.Owned Elements) | Who likely possesses first | Access path visualization |
| **Container** | Relation (synced with Elements.Contents) | Physical containment | Nesting visualization |
| **Contents** | Relation (synced with Elements.Container) | What's inside containers | Unlock flow display |
| **Timeline Event** | Relation (synced with Timeline.Memory/Evidence) | What backstory this reveals | Narrative discovery paths |
| **Status** | Status (8 options, 3 groups) | Production readiness | Filter by completion |
| | | **To-do**: Idea/Placeholder | Not started |
| | | **In progress**: in space playtest ready, In development, Writing Complete, Design Complete, Source Prop/print, Ready for Playtest | Active work |
| | | **Complete**: Done | Finished |
| **First Available** | Select (Act 0/1/2/null) | When physically accessible | Temporal filtering |
| **Required For** | Relation (synced with Puzzles.Puzzle Elements) | Puzzles needing this element | Dependency chains |
| **Rewarded By** | Relation (synced with Puzzles.Rewards) | Puzzles that unlock this | Reward paths |
| **Container Puzzle** | Relation (synced with Puzzles.Locked Item) | Puzzle that opens this container | Unlock mechanics |
| **Narrative Threads** | Multi-select (26 options) | Story categories | Future: thread following |
| **Associated Characters** | Rollup (Timeline Event → Characters) | Characters in related events | Connection discovery |
| **Puzzle Chain** | Rollup (Container → Container Puzzle) | Puzzle dependencies | Chain visualization |
| **Production/Puzzle Notes** | Rich Text | Design/fabrication notes | Context for status |
| **Files & media** | Files | Digital assets | Production reference |
| **Content Link** | URL | External resources | Asset management |
| **Container?** | Formula | Whether element is a container | Container identification |
| | | Formula: `not empty(Contents) OR not empty(Container Puzzle)` | True if has contents or is locked |

**SF_ Pattern Structure** (embedded in Description/Text):
```
SF_RFID: [unique identifier]
SF_ValueRating: [1-5] // Narrative importance AND monetary multiplier
SF_MemoryType: [Personal(x1)|Business(x3)|Technical(x5)]
SF_Group: [{Group Name} (x2-10)] // Collection bonuses
```

Currently all are templates marked "Template (Needs to be filled out)"

#### Puzzles Database (`1b62f33d-583f-80cc-87cf-d7d6c4b0b265`)

| Field | Type | Purpose | Design Implications |
|-------|------|---------|-------------------|
| **Puzzle** | Title | Puzzle identifier | Node labels |
| **Description/Solution** | Rich Text | How to solve | Mechanic documentation |
| **Puzzle Elements** | Relation (synced with Elements.Required For) | Required elements | Dependency visualization |
| **Locked Item** | Relation (synced with Elements.Container Puzzle) | Container this opens | Ownership derivation |
| **Owner** | Rollup (Locked Item → Owner, function: show_unique) | Character who "owns" puzzle | Access paths |
| **Rewards** | Relation (synced with Elements.Rewarded By) | Elements gained | Outcome flows |
| **Parent item** | Relation (synced with Puzzles.Sub-Puzzles) | Parent in puzzle chain | Hierarchy display |
| **Sub-Puzzles** | Relation (synced with Puzzles.Parent item) | Children in puzzle chain | Sub-puzzle navigation |
| **Story Reveals** | Rollup (Rewards → Timeline Event, function: show_unique) | Timeline events uncovered | Narrative impact |
| **Timing** | Rollup (Puzzle Elements → First Available, function: show_unique) | When solvable (Act availability) | Temporal constraints |
| **Narrative Threads** | Rollup (Rewards → Narrative Threads, function: show_unique) | Story categories touched | Thread connections |
| **Asset Link** | URL | External documentation | Design reference |

**Key Insight**: Puzzle "ownership" derives from who owns the locked container - creating natural starting points for puzzle chains. No difficulty field exists in the schema.

#### Timeline Database (`1b52f33d-583f-80de-ae5a-d20020c120dd`)

| Field | Type | Purpose | Design Implications |
|-------|------|---------|-------------------|
| **Description** | Title | Event summary | Event labels |
| **Date** | Date | When it happened | Timeline ordering |
| **Characters Involved** | Relation (synced with Characters.Events) | Who was present | Connection building |
| **Memory/Evidence** | Relation (synced with Elements.Timeline Event) | How players learn this | Discovery paths |
| **mem type** | Rollup (Memory/Evidence → Basic Type, function: show_unique) | Type of evidence | Discovery medium |
| **Notes** | Rich Text | Design notes | Context |
| **Last edited time** | Last Edited Time | Modification tracking | Version awareness |

**Design Intent**: Timeline events ARE the backstory. Players experience collective amnesia and rediscover these through elements. The murder is one thread among many mysteries.

## Git Strategy & Development Workflow

### Branch Structure
```
  main (production)
    |
    +-- develop
         |
         +-- feature/sprint-1-foundation
         +-- feature/sprint-2-puzzle-view
         +-- feature/sprint-3-remaining-views
         +-- feature/sprint-4-production
```
### Commit Standards
The project uses Commitizen for standardized commits. Use `npx cz` to create properly formatted commits.

```
  feat(scope): add new feature
  fix(scope): resolve bug
  refactor(scope): improve code
  test(scope): add tests
  docs(scope): update documentation
```
## Development Commands

```bash
# Initial setup
npm install

# Development (runs both client and server concurrently)
npm run dev          # Starts Vite dev server and Express backend
npm run dev:client   # Start only Vite dev server
npm run dev:server   # Start only Express server with hot reload

# Production build
npm run build        # Builds both client and server
npm run build:client # Build only client (Vite)
npm run build:server # Build only server (TypeScript)
npm run start        # Start production server

# Code quality
npm run lint         # ESLint with TypeScript
npm run typecheck    # TypeScript type checking for both client and server

# Testing
npm run test:integration  # Full integration test suite (requires .env)
npm run test:quick       # Quick smoke test with test API key

# Other
npm run preview      # Preview production build locally
```

## Key Development Principles

### React Flow Implementation
- Use controlled flow with `nodes` and `edges` state
- Implement custom node types for each entity (Character, Element, Puzzle)
- Handle node updates via `onNodesChange` callback
- Use `@xyflow/react` for the core React Flow components

### Notion API Integration
- All data mutations go through TanStack Query's `useMutation`
- Implement optimistic updates for better UX
- Handle rate limits gracefully (3 requests/second)
- Cache data aggressively with 5-minute stale time
- Always validate Notion responses against expected schema

### 2-Way Sync Architecture
```typescript
// Example mutation pattern
const updatePuzzle = useMutation({
  mutationFn: async (data) => {
    // 1. Optimistic update
    // 2. Call Notion API
    // 3. Handle success/failure
    // 4. Update local cache
  },
  onError: () => {
    // Rollback optimistic update
    // Show error toast
  }
});
```

### UI/UX Guidelines
- Inline editing: Double-click to edit, click outside to save
- Visual feedback: Highlight nodes on hover, show loading states
- Fail gracefully: Never lose user edits, queue failed updates
- Keyboard shortcuts: Cmd/Ctrl+S to save, Esc to cancel
- Responsive design: Support 1024px minimum width

### Performance Considerations
- Virtualize large graphs (100+ nodes) with React Flow's built-in support
- Debounce search/filter operations by 300ms
- Lazy load character artwork and full text content
- Use React.memo for node components
- Implement pagination for Notion queries (max 100 items)

### Security & Error Handling
- Never expose Notion API token in frontend code
- Route all Notion requests through Express backend
- Validate all user inputs before sending to Notion
- Implement retry logic for failed Notion requests
- Log errors with context for debugging

## Backend Development Patterns

### Caching Architecture

**Server-Side Caching**: Implemented with node-cache to reduce Notion API load
- **5-minute TTL**: Matches React Query frontend cache duration
- **Cache-first pattern**: Check cache → Return if hit → Fetch from Notion on miss
- **Cache key format**: `{endpoint}:{limit}:{cursor}` (e.g., `characters:20:null`)
- **Bypass mechanism**: `X-Cache-Bypass: true` header forces fresh data
- **Response headers**: `X-Cache-Hit: true/false` indicates cache status
- **Management endpoints**: `/api/cache/stats`, `/api/cache/clear`, `/api/cache/clear/:endpoint`

**Performance Impact**:
- Cached responses: <50ms (vs 200-3000ms for Notion API)
- Notion API calls reduced by 70-80% for repeated requests
- Rate limiting preserved for actual Notion calls only

### Input Validation

**Pagination Validation**: Applied to all Notion endpoints
- **Limit**: Must be between 1-100 (400 error if invalid)
- **Cursor**: Must be string type if provided
- **Applied via middleware**: Runs before authentication to fail fast
- **Error codes**: `INVALID_LIMIT`, `INVALID_CURSOR`

### Explicit Typing Pattern for API Endpoints

**CRITICAL**: All new Notion API endpoints must follow this exact pattern to prevent runtime errors and ensure type safety.

```typescript
// 1. AsyncHandler Pattern with Explicit Types
import { asyncHandler } from '../utils/asyncHandler.js';
import { Request, Response } from 'express';

router.get('/endpoint', asyncHandler(async (req: Request, res: Response) => {
  // Explicit Request, Response types prevent TypeScript inference issues
  // asyncHandler prevents server crashes from unhandled promise rejections
}));

// 2. Generic API Response Typing
import type { APIResponse, EntityType } from '../../src/types/notion/app.js';

const response: APIResponse<EntityType> = {
  data: transformedEntities,
  nextCursor: null,
  hasMore: false
};
// Use explicit APIResponse<T> generic - never use typeof inference

// 3. Separation of Raw vs App Types
import type { NotionPage, NotionProperty } from '../../src/types/notion/raw.js';
import type { Character, Element } from '../../src/types/notion/app.js';
// Keep raw Notion types separate from clean app types
```

**Why This Pattern?**
- **Server Stability**: AsyncHandler catches unhandled promise rejections that crash Express servers
- **Type Safety**: Explicit typing prevents silent field loss during JSON serialization
- **Maintainability**: Clean separation between Notion's complex types and our domain models

**Lessons Learned - Server Stability:**
- Unhandled async errors in Express routes cause silent server crashes during integration tests
- TypeScript `typeof` inference can strip fields from API responses
- Process-level error handlers provide final safety net but should not be relied upon
- Always wrap async route handlers with `asyncHandler` utility

### Integration Testing Strategy

**Current Status**: Full integration test suite implemented (`scripts/integration-test.ts`)
- **100% test coverage** (23/23 tests passing) covering:
  - All 4 Notion API endpoints (characters, elements, puzzles, timeline)
  - Authentication (API key validation)
  - CORS configuration
  - Rate limiting (Bottleneck and Express)
  - **Cache behavior** (hit/miss, bypass, key generation)
  - **Input validation** (limit ranges, cursor format)
  - SF_ pattern parsing from real data
- **Permissive parsing** for unknown data schemas (future-proof)
- **Server stability testing** with rate limiting and CORS validation

Run integration tests: `npm run test:integration`

## Testing Approach

### Current Test Infrastructure ✅ IMPLEMENTED

**Integration Tests**: Comprehensive test suite covering all API endpoints
- **Location**: `scripts/integration-test.ts`
- **Coverage**: All 4 Notion API endpoints (characters, elements, puzzles, timeline)
- **Features**: Authentication testing, rate limiting validation, CORS verification, error handling
- **Run**: `npm run test:integration`

**Test Strategy**:
- Real Notion API integration (no mocks)
- Permissive parsing for unknown data schemas (future-proof)
- Server stability validation (prevents crashes during load)
- 100% pass rate required before any commits

### Future Test Implementation:
- Unit tests for utility functions and hooks
- Component tests for React Flow custom nodes
- E2E tests for critical user flows (create, edit, delete)
- Mock Notion API responses for faster development testing

## File Organization
```
src/
  components/         # React components
    nodes/           # Custom React Flow nodes
    views/           # Main view components
  hooks/             # Custom React hooks
  services/          # API and data services
  types/             # TypeScript type definitions
  utils/             # Helper functions
  styles/            # CSS modules
server/              # Express backend
  routes/            # API routes
  middleware/        # Auth, error handling
```

## Common Tasks

### Adding a New Node Type
1. Create component in `src/components/nodes/`
2. Define TypeScript interface in `src/types/`
3. Register in React Flow's `nodeTypes`
4. Add styling in component's CSS module

### Implementing a Notion Mutation
1. Create mutation function in `src/services/notion.ts`
2. Define React Query mutation in relevant hook
3. Add optimistic update logic
4. Handle errors with toast notifications
5. Update TypeScript types if needed

### Debugging React Flow Issues
- Check `useNodesState` and `useEdgesState` hooks
- Verify node IDs are unique
- Ensure `nodeTypes` are registered before render
- Use React DevTools to inspect flow state
- Check browser console for React Flow warnings