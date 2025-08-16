Project Overview

  ALNRetool: Visual design tool for "About Last Night" murder mystery game
  Goal: Transform Notion databases into interactive graphs with inline editing
  Timeline: 8 weeks (4 two-week sprints)
  Approach: Incremental delivery with verifiable outcomes

  Architecture Overview

  [Notion API] <---> [Express Proxy] <---> [React App]
                                             |
                                      +------+------+
                                      |             |
                                [React Flow]  [TanStack Query]
                                      |             |
                                      +------+------+
                                             |
                                      [3 View Components]

  ---
  SPRINT 1: Foundation & Data Layer (Weeks 1-2) ✅ COMPLETE

  Week 1: Project Setup & Notion Integration

  Days 1-2: Development Environment ✅ COMPLETED
  Tasks:
  [✅] Initialize Vite React TypeScript project
  [✅] Install core dependencies
  [✅] Configure TypeScript and ESLint
  [✅] Set up Git repository with branching strategy

  Days 1-2: Development Environment

  WHY: A solid foundation prevents technical debt. TypeScript catches errors early, Vite provides
  fast HMR for rapid development, and proper tooling ensures consistent code quality across the
  team.

  IMPLEMENTED ARCHITECTURE:
  ├─ Frontend: Vite React TypeScript on port 5173
  ├─ Backend: Express proxy server on port 3001 
  ├─ Concurrent development: `npm run dev` starts both servers
  ├─ Production builds: Separate client/server build commands
  └─ Code quality: ESLint + TypeScript strict mode + Prettier

  HOW:
  ✅ Initialize Vite React TypeScript project
  ├─ WHY: Vite = fastest build tool, better DX than CRA
  ├─ IMPLEMENTED: Official Vite React-TS template with strict TypeScript
  │                Dual server setup (client + Express proxy)
  │                Concurrently orchestrates both servers
  └─ VERIFIED: ✅ Hot reload works, TypeScript compiles, dev servers start cleanly

  ✅ Install core dependencies
  ├─ WHY: Get all infrastructure deps upfront to avoid context switching
  ├─ INSTALLED: @notionhq/client ^4.0.1 (data source)
  │             @tanstack/react-query ^5.83.0 (caching/mutations)
  │             @xyflow/react ^12.8.2 (graph viz)
  │             express ^5.1.0 + cors ^2.8.5 (API proxy)
  │             react-hot-toast ^2.5.2 (user feedback)
  │             react-router-dom ^7.6.3 (navigation)
  │             express-rate-limit ^7.5.1 + bottleneck ^2.19.5 (rate limiting)
  │             tsx ^4.20.3 + concurrently ^9.2.0 (dev tools)
  └─ VERIFIED: ✅ No peer dependency warnings, clean npm install

  ✅ Configure TypeScript and ESLint
  ├─ WHY: Catch errors at compile time, not runtime
  ├─ IMPLEMENTED: TypeScript strict mode + noUncheckedIndexedAccess
  │               Path aliases: @/* → src/* (configured in tsconfig + Vite)
  │               ESLint 9.x with typescript-eslint + React plugins
  │               Type-aware linting with project references
  │               Prettier integration via eslint-config-prettier
  │               Dual project setup: tsconfig.app.json + tsconfig.server.json
  └─ VERIFIED: ✅ `npm run typecheck` validates both projects, ESLint catches security issues

  ✅ Set up Git repository
  ├─ WHY: Track changes from day 1, enable rollback
  ├─ IMPLEMENTED: Comprehensive .gitignore (dependencies, builds, env, logs, temp)
  │               Branch structure: main → develop → feature/sprint-1-foundation
  │               Conventional commits with commitizen helper tool
  │               Remote repository: https://github.com/maxepunk/ALNRetool
  │               Initial commit with proper Git identity (max@maxepunk.com)
  └─ VERIFIED: ✅ All branches pushed to remote, commitizen configured

  CURRENT PROJECT STATE FOR DAY 3 TEAM:
  
  File Structure:
  ALNRetool/
  ├─ src/                          # React app source
  │  ├─ App.tsx                    # Main component (fixed security warnings)
  │  ├─ main.tsx                   # App entry point
  │  └─ vite-env.d.ts             # Vite type definitions
  ├─ server/
  │  ├─ index.ts                   # Express server with health endpoint + rate limiting
  │  └─ tsconfig.server.json       # Server TypeScript config
  ├─ package.json                  # Scripts: dev, build, typecheck, lint
  ├─ tsconfig.json                 # Project references root
  ├─ tsconfig.app.json            # Client TypeScript config (strict + path aliases)
  ├─ eslint.config.js             # ESLint with TypeScript + React + Prettier
  ├─ vite.config.ts               # Vite with React plugin + path aliases
  └─ .gitignore                   # Comprehensive ignore patterns

  Available Commands:
  ├─ `npm run dev`                # Start both client (5173) + server (3001)
  ├─ `npm run build`              # Production build (client + server)
  ├─ `npm run typecheck`          # TypeScript validation (both projects)
  ├─ `npm run lint`               # ESLint validation
  └─ `git cz`                     # Conventional commit helper

  Server Ready for Notion Integration:
  ├─ Express server on port 3001
  ├─ CORS configured for localhost:5173
  ├─ Rate limiting: 100 req/min per IP (incoming protection)
  ├─ Health endpoint: GET /api/health
  ├─ Ready for /api/notion/* endpoints
  └─ Environment: dotenv configured (.env file needed)

  Days 3-4: Notion Integration ✅ COMPLETED
  Tasks:
  [✅] Add Notion API endpoints to existing Express server
  [✅] Test Notion API authentication
  [✅] Generate TypeScript types from schema
  [✅] Verify rate limit handling (3 req/sec)
  [✅] Implement server-side caching (5-minute TTL)
  [✅] Add input validation middleware (pagination limits)
 
   Days 3-4: Notion Integration

  WHY: This is the critical path - if we can't connect to Notion reliably, nothing else matters.
  Testing rate limits early prevents surprises later.

  HOW:
  ✅ Express proxy server (ALREADY COMPLETED)
  ├─ WHY: Never expose Notion token to browser
  ├─ CURRENT STATE: Express server running on port 3001
  │                 CORS configured for localhost:5173 (Vite default)
  │                 Rate limiting: 100 req/min per IP
  │                 Health endpoint: GET /api/health working
  └─ ✅ IMPLEMENTED: 4 Notion API endpoints: /api/notion/{characters,elements,puzzles,timeline}

  ✅ Test Notion API authentication  
  ├─ WHY: Validate permissions before building features
  ├─ IMPLEMENTED: X-API-Key authentication middleware
  │               All 4 database permissions working
  │               Integration test suite validates real data access
  │               Comprehensive error handling for auth failures
  └─ STATUS: 23/23 integration tests passing (100% success - cache & validation tests added)

  ✅ Generate TypeScript types from schema
  ├─ WHY: Type safety prevents runtime errors with Notion data  
  ├─ IMPLEMENTED: 3-file type system approach
  │               raw.ts: Direct Notion API response types
  │               app.ts: Clean UI-friendly types (Character, Element, Puzzle, Timeline)
  │               transforms.ts: Conversion functions with SF_ pattern parsing
  │               APIResponse<T> generic for consistent endpoint responses
  └─ STATUS: Full type coverage working, explicit typing pattern documented

  ✅ Verify rate limit handling
  ├─ WHY: 3 req/sec limit will break naive implementations
  ├─ IMPLEMENTED: Dual-layer rate limiting
  │               Bottleneck: 340ms spacing for Notion calls (respects 3 req/sec) 
  │               Express: 100 req/min per IP for incoming protection
  │               AsyncHandler pattern prevents server crashes
  └─ STATUS: Core functionality working, server stable, all tests passing with cache + validation

  ✅ Server-side caching (NEW)
  ├─ WHY: Reduce Notion API calls by 70-80%, improve response times
  ├─ IMPLEMENTED: Node-cache with 5-minute TTL
  │               Cache key pattern: {endpoint}:{limit}:{cursor}
  │               X-Cache-Hit header indicates cache status
  │               X-Cache-Bypass header forces fresh fetch
  │               Cache management endpoints for monitoring/clearing
  └─ VERIFIED: Cached responses return in <50ms, 23/23 tests pass

  ✅ Input validation middleware (NEW)
  ├─ WHY: Prevent invalid requests from reaching Notion API
  ├─ IMPLEMENTED: Pagination validation (limit: 1-100, default: 20)
  │               Consistent error codes (INVALID_LIMIT)
  │               Applied before authentication check
  └─ VERIFIED: All invalid inputs properly rejected with 400 status

  Day 5: Data Fetching Layer ✅ COMPLETE
  Tasks:
  [✅] Configure React Query client
  [✅] Create database hooks (useCharacters, etc.)
  [✅] Implement caching strategy (5-min stale time)
  [✅] Test concurrent requests
  [✅] Add comprehensive test suite (212/212 tests passing)
  [✅] Implement three-layer error boundaries
  [✅] Create loading skeleton components
  [✅] Setup Mock Service Worker (MSW) infrastructure
  
    Day 5: Data Fetching Layer

  WHY: React Query provides caching, background refetching, and optimistic updates out of the box.
  Setting this up correctly now means all future features get these benefits automatically.

  HOW:
  Configure React Query client ✅ VERIFIED
  ├─ WHY: Central cache prevents duplicate requests
  ├─ HOW: Set staleTime: 5 min (data changes infrequently)
  │       cacheTime: 10 min (keep in memory longer)
  │       retry: 3 with exponential backoff
  └─ ✅ VERIFIED: QueryClient configured with proper defaults

  Create database hooks ✅ VERIFIED
  ├─ WHY: Encapsulate data fetching logic in one place
  ├─ HOW: One hook per database:
  │       useCharacters() → all characters + paginated methods
  │       usePuzzles() → all puzzles + paginated methods
  │       useElements() → all elements + paginated methods
  │       useTimeline() → all events + paginated methods
  │       Each returns { data, isLoading, error }
  └─ ✅ VERIFIED: All hooks implemented with comprehensive test coverage

  Implement caching strategy ✅ VERIFIED
  ├─ WHY: Minimize API calls, improve performance
  ├─ HOW: Query key factories with filter support
  │       ['characters', { limit: 20, cursor: null }]
  │       Entity-specific cache configurations
  │       Invalidation patterns for mutations
  └─ ✅ VERIFIED: Cache working correctly with stale time strategy

  Test concurrent requests ✅ VERIFIED
  ├─ WHY: Ensure our rate limiting works under real load
  ├─ HOW: Comprehensive test suite with MSW mocking
  │       212/212 tests covering all scenarios
  │       Error boundary testing with QueryErrorResetBoundary
  │       Loading state validation with skeleton components
  └─ ✅ VERIFIED: All data fetching patterns working correctly
  
  Week 2: Data Processing

  Days 6-7: Graph Transformation ✅ COMPLETED
  Tasks:
  [✅] Build Notion -> React Flow transformers
  [✅] Handle entity relationships
  [✅] Create SF_ pattern parser stub
  [✅] Test with real game data

    Days 6-7: Graph Data Structures

  WHY: React Flow needs specific node/edge format. Transforming Notion's relational data into graph
   structure is the core of our value proposition - making connections visible.

  HOW:
  Build transformation functions
  ├─ WHY: Decouple Notion structure from UI needs
  ├─ HOW: Pure functions for each transform:
  │       notionToNode(entity) → { id, type, data, position }
  │       relationToEdge(source, target, label) → { id, source, target, label }
  │       Special handling for each entity type
  └─ VERIFY: Console.log shows correct structure

  Handle relationship resolution
  ├─ WHY: Notion relations are IDs, we need full objects
  ├─ HOW: Build lookup maps first:
  │       idToCharacter: Map<string, Character>
  │       idToElement: Map<string, Element>
  │       Then resolve: puzzle.owner = idToCharacter.get(puzzle.ownerId)
  └─ VERIFY: No undefined relationships

  Create SF_ pattern parser stub
  ├─ WHY: Future feature, but structure affects data model
  ├─ HOW: Regex to extract patterns:
  │       /SF_ValueRating:\s*\[(\d+)\]/
  │       Store in element.metadata for later use
  │       Don't block on missing patterns
  └─ VERIFY: Patterns extracted when present

  Test with real game data
  ├─ WHY: Mock data hides edge cases
  ├─ HOW: Load actual Notion export
  │       Transform all entities
  │       Measure performance (target: <1s for 200 nodes)
  └─ VERIFY: No crashes, all relationships resolve
  
  Days 8-10: Foundation UI ✅ COMPLETED
  Tasks:
  [✅] Set up React Router
  [✅] Create basic layout components
  [✅] Add navigation between views
  [✅] Implement loading/error states

  Days 8-9: Basic UI Scaffold

  WHY: Before building features, we need the navigation structure. This scaffold lets us develop
  views independently while maintaining a cohesive app experience.

  HOW:
  Set up React Router
  ├─ WHY: Users need to switch between 3 views
  ├─ HOW: Routes structure:
  │       / → redirect to /puzzle
  │       /puzzle → PuzzleFocusView
  │       /character → CharacterJourneyView
  │       /status → ContentStatusView
  │       Lazy load each view component
  └─ VERIFY: Can navigate to all routes

  Create layout components
  ├─ WHY: Consistent UI across all views
  ├─ HOW: AppLayout with:
  │       Header: App title + navigation tabs
  │       Main: <Outlet /> for route content
  │       Global filters: Act selector, search box
  │       Use CSS Grid for responsive layout
  └─ VERIFY: Layout stays stable during navigation

  Add navigation between views
  ├─ WHY: Quick context switching is core requirement
  ├─ HOW: Tab-style navigation in header
  │       Active tab highlighted
  │       Preserve view state in sessionStorage
  │       Keyboard shortcuts: Ctrl+1/2/3
  └─ VERIFY: State persists when switching back

  Implement loading/error states
  ├─ WHY: Network requests will fail, users need feedback
  ├─ HOW: Global patterns:
  │       Loading: Skeleton screens matching layout
  │       Error: Friendly message + retry button
  │       Empty: Helpful message when no data
  │       Use React Error Boundaries
  └─ VERIFY: Disconnect network, see error state

  Day 10: Sprint 1 Verification

  WHY: Ensures foundation is solid before building features. Catching issues now is 10x cheaper
  than fixing them later.

  HOW:
  All TypeScript types compile
  ├─ RUN: npm run typecheck
  ├─ EXPECT: No errors
  └─ FIX: Any type errors before proceeding

  Can fetch all 4 Notion databases
  ├─ TEST: Load each route, check network tab
  ├─ EXPECT: See all 4 API calls succeed
  └─ FIX: Permission or auth issues

  Basic graph data structure populated
  ├─ TEST: Console.log transformed data
  ├─ EXPECT: Nodes have id, type, data, position
  │         Edges have source, target, label
  └─ FIX: Transformation logic bugs

  Development server runs without errors
  ├─ RUN: npm run dev for 5 minutes
  ├─ EXPECT: No console errors, no crashes
  └─ FIX: Any runtime errors

  Sprint 1 Deliverable: Foundation ready for feature development
  - Can fetch and transform Notion data
  - Basic UI structure in place
  - All development tools configured
  - No technical debt accumulated
  

  Sprint 1 Deliverable: Foundation ready for feature development
  - Can fetch and transform Notion data
  - Basic UI structure in place
  - All development tools configured
  - No technical debt accumulated
  ---
  SPRINT 2: First View + Basic Editing (Weeks 3-4) 🚧 IN PROGRESS

  ## Sprint 2 Current Status Assessment: ~35% Complete
  
  ### ✅ What's Implemented (Foundation Working):
  - React Flow integration with @xyflow/react installed and configured
  - Basic custom node components (PuzzleNode, ElementNode, CharacterNode, TimelineNode)
  - Dagre layout engine (451 lines) with horizontal/vertical layouts
  - Data transformation pipeline (Notion → Nodes/Edges → React Flow)
  - Basic PuzzleFocusView component with node rendering
  - React Query hooks connecting to data layer
  
  ### ❌ What's Missing (Per PRD Requirements):
  - **Visual**: Diamond shape for puzzle nodes (PRD Line 411)
  - **Visual**: Owner portrait badges on elements (PRD Line 236)
  - **Visual**: Status-based borders: dashed/solid (PRD Line 232)
  - **Functional**: Details panel with editing (PRD Line 241-243)
  - **Functional**: Search/filter functionality (PRD Line 241)
  - **Functional**: Act filter for game phases (PRD Line 242)
  - **Functional**: Puzzle selector dropdown
  - **Infrastructure**: 2-way sync mutation endpoints

  ## 🎯 REVISED SPRINT 2 COMPLETION PLAN (Prioritizing Visual Completeness)

  ### Phase 1: Visual Enhancements (Days 11-13) - MCP ACCELERATED ⬆️
  
  WHY: Game designers need to instantly distinguish between different entity types and their states
  at a glance. With 100+ nodes on screen, visual hierarchy determines usability. Clear visual
  language reduces cognitive load and prevents mistakes during content planning.

  HOW:
  Distinguish puzzle nodes from other entities
  ├─ WHY: Puzzles are the core game mechanics - must stand out from elements/characters
  ├─ HOW: Create unique visual shape that can't be confused with rectangles
  │       Use MCP component_refiner to transform existing PuzzleNode
  │       Ensure shape works with React Flow connection handles
  │       Test visibility at different zoom levels (50% to 200%)
  └─ VERIFY: Designer can identify all puzzles in 2 seconds at any zoom
  
  Show element ownership at a glance
  ├─ WHY: Designers need to know who owns what without clicking each node
  ├─ HOW: Add visual indicator showing owning character on element nodes
  │       Use MCP component_builder for reusable ownership badge
  │       Support both character portraits and text fallbacks
  │       Ensure readable at standard zoom (100%)
  └─ VERIFY: Can identify owner of any element without opening details
  
  Communicate content status visually
  ├─ WHY: Writers need to identify incomplete content quickly to prioritize work
  ├─ HOW: Visual styling that shows placeholder vs ready vs in-progress
  │       Different visual treatments (borders, colors, patterns)
  │       Consistent across all entity types
  │       Accessible to colorblind users (not just color)
  └─ VERIFY: Writer can identify all placeholder content in 5 seconds
  
  Show game flow progression
  ├─ WHY: Understanding the sequence of gameplay events prevents narrative conflicts
  ├─ HOW: Visual emphasis on left-to-right flow (requirements → puzzle → rewards)
  │       Edge styling to show dependency direction
  │       Visual grouping of related nodes
  │       Clear visual hierarchy between primary and secondary paths
  └─ VERIFY: New team member understands game flow without explanation

  Days 11-12: React Flow Setup & Custom Nodes

  WHY: React Flow is powerful but complex. Custom nodes let us show game-specific information
  (character portraits, status badges) that generic nodes can't display.

  HOW:
  Install React Flow dependencies
  ├─ WHY: Core library + layout algorithm
  ├─ HOW: npm install @xyflow/react dagre
  │       Import CSS: @xyflow/react/dist/style.css
  │       Set up provider wrapper
  └─ VERIFY: Can render example flow

  Create custom node components
  ├─ WHY: Each entity type needs different visual treatment
  ├─ HOW: One component per type:
  │       PuzzleNode: Diamond shape, puzzle name, status border
  │       ElementNode: Rectangle, type icon, owner badge
  │       CharacterBadge: Small circular portrait
  │       TimelineNode: Rounded rect, date display
  │       All use React.memo for performance
  └─ VERIFY: Each renders with mock data

  Implement horizontal layout with dagre
  ├─ WHY: Manual positioning is error-prone and ugly
  ├─ HOW: Configure dagre for left-to-right:
  │       rankdir: 'LR', ranksep: 200, nodesep: 50
  │       Group nodes by type for cleaner layout
  │       Elements → Puzzles → Rewards → Timeline
  └─ VERIFY: Auto-layout looks reasonable

  Add node styling based on status
  ├─ WHY: Visual feedback shows content state at a glance
  ├─ HOW: CSS classes per status:
  │       .status-placeholder: dashed border
  │       .status-in-progress: yellow border
  │       .status-complete: green border
  │       Animate status changes with transition
  └─ VERIFY: Nodes visually distinct by status

  ### Phase 2: Details Panel & Interactions (Days 14-16) ⬇️
  
  WHY: Nodes can't display all information needed for decision-making. Designers need quick access
  to full entity details without leaving the graph context. The panel becomes the editing interface.

  HOW:
  Create non-disruptive details view
  ├─ WHY: Designers need to see details while maintaining graph context
  ├─ HOW: Sliding panel that preserves graph visibility
  │       Click node to open, multiple ways to close
  │       Display all Notion properties in organized groups
  │       Remember open/closed state between page refreshes
  └─ VERIFY: Can view details without losing place in graph
  
  Make data human-readable
  ├─ WHY: Raw database fields are confusing and error-prone
  ├─ HOW: Transform technical fields into friendly labels
  │       Format dates, handle empty values gracefully
  │       Show relationships as navigable links
  │       Group related information logically
  └─ VERIFY: Non-technical user understands all fields
  
  Enable keyboard workflows
  ├─ WHY: Power users need speed, accessibility users need alternatives
  ├─ HOW: Full keyboard navigation (Tab, Enter, Escape)
  │       Consistent shortcuts across all interactions
  │       Focus management for screen readers
  └─ VERIFY: Can operate entirely without mouse

  ### Phase 3: Mutation Infrastructure (Days 17-18) ⬇️
  
  WHY: The tool's value is in 2-way sync. Designers must trust that changes save reliably to Notion.
  Without editing, it's just a read-only viewer. Status is the most-changed field, perfect for MVP.

  HOW:
  Build reliable save pipeline
  ├─ WHY: Data loss destroys user trust immediately
  ├─ HOW: Express endpoints that validate and forward to Notion
  │       Handle all error cases with clear messages
  │       Implement retry logic for transient failures
  │       Log all mutations for debugging
  └─ VERIFY: Changes persist across page refreshes
  
  Provide instant feedback
  ├─ WHY: Users expect immediate response to actions
  ├─ HOW: Optimistic updates show changes before server confirms
  │       Loading states during network requests
  │       Success/error notifications
  │       Rollback UI on failures
  └─ VERIFY: Status changes feel instant
  
  Start with highest-value field
  ├─ WHY: Status field changes most frequently in daily workflow
  ├─ HOW: Replace read-only status badge with editable dropdown
  │       All status options from Notion schema
  │       Save on selection, not separate button
  │       Clear error recovery options
  └─ VERIFY: Can update status in under 3 clicks

  ### Phase 4: Search & Filtering (Days 19-20)
  
  WHY: 100+ nodes create visual overload. Designers need to focus on specific subsets of content
  relevant to their current task. Different work modes require different filtering strategies.

  HOW:
  Enable quick content discovery
  ├─ WHY: Finding specific items in large graphs wastes time
  ├─ HOW: Search box that filters nodes as you type
  │       Fuzzy matching for typo tolerance
  │       Visual highlighting of matches
  │       Option to hide or dim non-matches
  └─ VERIFY: Can find any node in under 5 seconds
  
  Support different work modes
  ├─ WHY: Writers focus on incomplete content, designers on specific acts
  ├─ HOW: Contextual filters for common workflows
  │       Act filter for game phase work
  │       Status filter for content completion
  │       Entity type filter for focused editing
  └─ VERIFY: Can show only "Act 1 incomplete elements" in 2 clicks
  
  Enable deep focus
  ├─ WHY: Complex puzzles need isolation to understand dependencies
  ├─ HOW: Puzzle selector that shows only relevant subgraph
  │       Include all dependencies and rewards
  │       Maintain visual context
  │       Easy return to full view
  └─ VERIFY: Can isolate and understand any puzzle in 10 seconds
  
  ## Implementation Details & Technical Guidance

  ### MCP Tool Usage Strategy

  1. **Component Refinement** (for existing nodes):
     ```
     mcp__magic__21st_magic_component_refiner
     - Input: Current PuzzleNode.tsx
     - Context: "Add diamond shape with clip-path, maintain React Flow handles"
     - Output: Enhanced component with PRD visuals
     ```

  2. **Component Generation** (for new features):
     ```
     mcp__magic__21st_magic_component_builder
     - Request: "Owner badge overlay component with portrait and initials fallback"
     - Context: React Flow node overlay, absolute positioning
     - Output: New OwnerBadge.tsx component
     ```

  3. **Component Inspiration** (for patterns):
     ```
     mcp__magic__21st_magic_component_inspiration
     - Search: "status indicators", "node badges", "graph overlays"
     - Apply: Best patterns to our use case
     ```

  ### Critical Visual Implementation Notes

  **Diamond Shape CSS (from expert analysis):**
  ```css
  .puzzleNode {
    clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%);
    /* CRITICAL: Use filter for shadow, not box-shadow */
    filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
  }
  ```

  **Owner Badge with Fallback:**
  ```tsx
  const OwnerBadge = ({ owner }) => {
    const [hasError, setHasError] = useState(false);
    const showImage = owner.portraitUrl && !hasError;
    
    return showImage ? (
      <img src={owner.portraitUrl} onError={() => setHasError(true)} />
    ) : (
      <div className="initials">{getInitials(owner.name)}</div>
    );
  };
  ```

  **Status-Based Borders:**
  ```css
  .status-placeholder { border: 2px dashed #999; }
  .status-ready { border: 2px solid #4CAF50; }
  .status-in-progress { border: 2px solid #FFC107; }
  ```

  ## Sprint 2 Verification Checklist

  ### Visual Enhancements Complete:
  [ ] Diamond-shaped puzzle nodes render correctly
  [ ] Owner badges show portraits with initials fallback
  [ ] Status borders (dashed/solid) working
  [ ] Left-to-right flow is clear
  [ ] All nodes have proper visual hierarchy

  ### Details Panel Working:
  [ ] Panel slides in smoothly on node click
  [ ] All entity properties display correctly
  [ ] Close interactions (X, backdrop, Escape) work
  [ ] Property formatting is readable
  [ ] Panel state persists in sessionStorage

  ### Mutation Infrastructure:
  [ ] Express PUT/PATCH endpoints functional
  [ ] React Query mutations handle optimistic updates
  [ ] Error rollback restores previous state
  [ ] Toast notifications appear for all states
  [ ] Status editor saves to Notion successfully

  ### Search & Filtering:
  [ ] Search box filters nodes by name
  [ ] Act filter shows/hides by game phase
  [ ] Puzzle selector isolates single puzzles
  [ ] Filter preferences saved in sessionStorage
  [ ] Performance acceptable with 100+ nodes

  ## Sprint 2 Success Metrics

  **Performance Targets:**
  - Graph renders 100+ nodes at 30+ fps
  - Node interactions respond in <100ms
  - Status updates complete in <2 seconds
  - Search filtering responds in <300ms

  **User Experience:**
  - Diamond puzzle nodes immediately recognizable
  - Owner badges provide clear character context
  - Status borders communicate state at a glance
  - Details panel feels native and responsive
  - Editing status feels instant with optimistic updates

  ## Sprint 2 Deliverable Summary
  ✅ Phase 1: Visual enhancements matching PRD specifications
  ✅ Phase 2: Details panel for viewing all entity properties
  ✅ Phase 3: 2-way sync with Notion for status editing
  ✅ Phase 4: Search and filtering for large graphs
  
  **Result**: A visually complete, functional puzzle dependency viewer with basic editing capabilities, ready for expansion to additional field types and views in Sprint 3.

  ---
  SPRINT 3: Remaining Views + Full Editing (Weeks 5-6)

  Week 5: Multiple Views

  Days 21-23: Character Journey View
  Hierarchical Layout:
        [CHARACTER]
             |
      [Owned Puzzles]
        /         \
  [Elements]   [Elements]
      |            |
  [Timeline]   [Timeline]

  Tasks:
  [ ] Implement vertical tree layout
  [ ] Add character selector
  [ ] Create tier visualizations
  [ ] Enable drag-drop ownership

  Days 24-25: Content Status View
  Status Dashboard:
  +---------------------------+
  | NEEDS CONTENT (12)        |
  | > Memory: "Sofia's Pitch" |
  | > Document: "Contract"    |
  +---------------------------+
  | IN PROGRESS (5)           |
  | > Puzzle: "Hidden Safe"   |
  +---------------------------+

  Tasks:
  [ ] Build grouped list view
  [ ] Add inline status/owner dropdowns
  [ ] Create expandable context graphs
  [ ] Implement type icons

Days 21-22: Character Journey View - Hierarchical Layout

  WHY: Shows how character ownership affects puzzle access. Critical for balancing gameplay -
  ensures all characters have meaningful content.

  HOW:
  Implement character selector dropdown
  ├─ WHY: Each character has unique content paths
  ├─ HOW: Dropdown with character portraits:
  │       All characters listed with tier badges
  │       "All Characters" overview option
  │       Filter by tier (Core/Secondary/Tertiary)
  │       Selection updates URL parameter
  └─ VERIFY: Can switch between characters

  Create hierarchical node positioning
  ├─ WHY: Shows clear ownership and access paths
  ├─ HOW: Vertical tree with dagre:
  │       Root: Selected character (large node)
  │       Level 1: Owned puzzles (medium nodes)
  │       Level 2: Accessible elements (small nodes)
  │       Level 3: Timeline events revealed (tiny nodes)
  │       Rank separation: 150px between levels
  └─ VERIFY: Hierarchy visually clear

  Add visual indicators for character tiers
  ├─ WHY: Core characters need more content than Tertiary
  ├─ HOW: Size and styling differences:
  │       Core: Large (80px), bold border
  │       Secondary: Medium (60px), normal border
  │       Tertiary: Small (40px), thin border
  │       Color coding by tier
  └─ VERIFY: Tier differences obvious

  Show owned vs accessible content toggle
  ├─ WHY: Distinguish starting items from discoverable items
  ├─ HOW: Toggle switch in header:
  │       "Owned Only": Direct ownership relations
  │       "Accessible": Includes puzzle rewards
  │       Different edge styles (solid vs dashed)
  │       Legend explains difference
  └─ VERIFY: Toggle changes visible content

Day 23: Drag-and-Drop Ownership

  WHY: Most requested feature from PRD. Lets designers quickly reassign items between characters
  for balance.

  HOW:
  Implement React DnD or native drag
  ├─ WHY: Standard interaction for moving items
  ├─ HOW: Make element nodes draggable:
  │       onDragStart: Set element data
  │       Character nodes accept drops
  │       Show valid drop targets on drag
  │       Prevent invalid drops (same owner)
  └─ VERIFY: Can drag elements to characters

  Visual feedback during drag
  ├─ WHY: Users need to see what's happening
  ├─ HOW: Drag states:
  │       Dragging: Element semi-transparent
  │       Valid target: Character highlighted green
  │       Invalid target: Character grayed out
  │       Drop preview: Element moves to target
  └─ VERIFY: Clear visual feedback

  Validation before drop
  ├─ WHY: Prevent invalid ownership assignments
  ├─ HOW: Business rules check:
  │       Can't assign to same character
  │       Warn if breaking puzzle access
  │       Confirm ownership changes
  │       Show impact preview
  └─ VERIFY: Invalid drops prevented

  Update both nodes on success
  ├─ WHY: Graph must reflect new ownership immediately
  ├─ HOW: Optimistic update:
  │       Move element visually
  │       Update Notion database
  │       Invalidate affected queries
  │       Rollback on failure
  └─ VERIFY: Changes sync to Notion

  Days 24-25: Content Status View

  WHY: Shows work queue prioritized by urgency. Essential for narrative designer to know what to
  write next.

  HOW:
  Create accordion-style grouped list
  ├─ WHY: Status groups reduce cognitive load
  ├─ HOW: Group elements by status:
  │       "Needs Content" (red) - placeholder status
  │       "In Progress" (yellow) - actively worked
  │       "Ready for Review" (blue) - awaiting approval
  │       "Complete" (green) - finished items
  │       Collapsible groups with count badges
  └─ VERIFY: Groups collapse/expand smoothly

  Add type icons and status badges
  ├─ WHY: Quick visual scanning of work types
  ├─ HOW: Icon system:
  │       Document: File icon
  │       Memory Token: Audio/video icons
  │       Prop: Box icon
  │       Status badge shows current state
  │       Color coding matches other views
  └─ VERIFY: Icons communicate meaning clearly

  Implement expand for context mini-graph
  ├─ WHY: Show why this item matters without leaving view
  ├─ HOW: Expandable preview:
  │       Click "Show Context" button
  │       Small graph shows: Owner → Element → Puzzle → Timeline
  │       Max 6 nodes to keep simple
  │       Close button to collapse
  └─ VERIFY: Context helps prioritize work

  Quick status/owner dropdowns
  ├─ WHY: Bulk status updates without opening details
  ├─ HOW: Inline editing:
  │       Status dropdown in each row
  │       Owner dropdown with character portraits
  │       Save on selection
  │       Batch update multiple items
  └─ VERIFY: Can update multiple items quickly


  Week 6: Complete Field Editing

  Days 26-27: Field Components
  Editor Components:
  - TextInput.tsx (titles)
  - TextArea.tsx (rich text)
  - SelectDropdown.tsx (selects)
  - MultiSelect.tsx (tags)
  - RelationPicker.tsx (relations)
  - DatePicker.tsx (dates)

  Tasks:
  [ ] Build all field editors
  [ ] Add to details panels
  [ ] Implement validation
  [ ] Test with each field type

  Days 26-27: Field Type Components

  WHY: Support all Notion field types for complete editing. Reusable components ensure consistency.

  HOW:
  Build comprehensive editor library
  ├─ WHY: Each Notion field type needs specific UI
  ├─ HOW: Editor components:
  │       TextInput: Single line text with validation
  │       TextArea: Multi-line with auto-resize
  │       SelectDropdown: Single select with search
  │       MultiSelect: Tag-style with add/remove
  │       RelationPicker: Entity search with previews
  │       DatePicker: Calendar popup with time
  │       UrlInput: URL validation and link preview
  └─ VERIFY: Each editor handles its data type

  Add validation and error states
  ├─ WHY: Prevent invalid data from reaching Notion
  ├─ HOW: Validation rules:
  │       Required fields marked with *
  │       URL format validation
  │       Date range validation
  │       Relation existence checking
  │       Character count limits
  └─ VERIFY: Invalid input shows helpful errors

  Implement focus management
  ├─ WHY: Keyboard navigation for power users
  ├─ HOW: Tab order:
  │       Tab moves between fields
  │       Enter saves current field
  │       Escape cancels editing
  │       Arrow keys in dropdowns
  └─ VERIFY: Can edit without mouse

  Add to all details panels
  ├─ WHY: Consistent editing across all views
  ├─ HOW: Replace read-only displays:
  │       Same positioning and styling
  │       Hover indicates editability
  │       Loading states during save
  │       Success/error feedback
  └─ VERIFY: Editing feels native

  Days 28-30: Integration
  Tasks:
  [ ] Cross-view navigation
  [ ] Keyboard shortcuts (Ctrl+S)
  [ ] State persistence
  [ ] Final integration testing

  Days 28-30: Cross-View Navigation & Final Integration

  WHY: Users need to move fluidly between related entities across different views.

  HOW:
  Add links between related entities
  ├─ WHY: Follow relationships across views
  ├─ HOW: Clickable entity links:
  │       Character name → Character Journey view
  │       Puzzle name → Puzzle Focus view
  │       Element status → Content Status view
  │       Maintain current filters when switching
  └─ VERIFY: Can navigate relationships

  Implement view state persistence
  ├─ WHY: Don't lose work when switching views
  ├─ HOW: Session storage:
  │       Remember selected entities
  │       Preserve filter states
  │       Keep detail panel open
  │       Restore on return to view
  └─ VERIFY: State survives navigation

  Add keyboard shortcuts
  ├─ WHY: Power users want speed
  ├─ HOW: Global shortcuts:
  │       Ctrl+1/2/3: Switch views
  │       Ctrl+S: Save current edits
  │       Ctrl+F: Focus search
  │       Escape: Close panels
  └─ VERIFY: Shortcuts work consistently

  Final integration testing
  ├─ WHY: Ensure all features work together
  ├─ HOW: End-to-end scenarios:
  │       Edit element in Puzzle view
  │       Navigate to Character view
  │       Verify change reflected
  │       Test with multiple browser tabs
  └─ VERIFY: No data inconsistencies

  Sprint 3 Deliverable: Complete MVP with all views and editing
  - All 3 views fully functional
  - Can edit all field types
  - Drag-drop ownership works
  - Cross-view navigation seamless
  - No data loss on edits

  ---
  SPRINT 4: Polish & Production (Weeks 7-8)

  Week 7: Performance & Reliability

  Days 31-32: Optimization
  Performance Targets:
  - 100+ nodes at 60fps
  - <2 second sync time
  - <300ms search response

  Tasks:
  [ ] Profile with React DevTools
  [ ] Add virtualization if needed
  [ ] Implement React.memo
  [ ] Optimize re-renders

  Days 31-32: Performance Optimization

  WHY: 100+ nodes will cause performance problems. Optimize now before users complain.

  HOW:
  Profile with React DevTools
  ├─ WHY: Measure actual performance bottlenecks
  ├─ HOW: Use Profiler tab:
  │       Record interaction scenarios
  │       Identify slow components
  │       Look for unnecessary renders
  │       Measure JavaScript execution time
  └─ VERIFY: Frame rate stays above 30fps

  Add virtualization for large graphs
  ├─ WHY: DOM nodes are expensive with 200+ items
  ├─ HOW: React Flow virtualization:
  │       Only render visible nodes
  │       Use viewport culling
  │       Lazy load node details
  │       Implement zoom-based LOD
  └─ VERIFY: Smooth zoom with 200+ nodes

  Optimize re-renders with React.memo
  ├─ WHY: Prevent cascade re-renders
  ├─ HOW: Memoization strategy:
  │       Wrap expensive components
  │       Stable callback references
  │       Split large components
  │       Use useMemo for calculations
  └─ VERIFY: Edit one node, others don't re-render

  Days 33-35: Error Handling & Testing
  Tasks:
  [ ] Add comprehensive error boundaries
  [ ] Implement retry logic
  [ ] User testing sessions
  [ ] Fix critical issues

  Days 33-35: Comprehensive Error Handling & User Testing

  WHY: Errors will happen in production. Graceful handling builds user trust.

  HOW:
  Add error boundaries and recovery
  ├─ WHY: React errors shouldn't crash entire app
  ├─ HOW: Error boundary strategy:
  │       View-level boundaries
  │       Fallback UI with retry
  │       Error reporting to console
  │       User-friendly error messages
  └─ VERIFY: Errors contained and recoverable

  Implement retry logic for failed updates
  ├─ WHY: Network issues shouldn't lose user work
  ├─ HOW: Exponential backoff:
  │       3 retry attempts
  │       2s, 4s, 8s delays
  │       Queue failed requests
  │       Manual retry option
  └─ VERIFY: Eventually succeeds or shows clear error

  Schedule user testing sessions
  ├─ WHY: Validate real user workflows
  ├─ HOW: 2-hour sessions per designer:
  │       Use actual game data
  │       Complete real tasks
  │       Think-aloud protocol
  │       Record pain points
  └─ VERIFY: Users complete tasks successfully

  Week 8: Deployment

  Days 36-37: Production Setup
  Deployment Checklist:
  [ ] Environment variables
  [ ] Build optimization
  [ ] CI/CD pipeline
  [ ] Monitoring (Sentry)

  Days 36-37: Production Deployment

  WHY: Move from development to production environment with proper monitoring.

  HOW:
  Set up CI/CD pipeline
  ├─ WHY: Automated deployments prevent errors
  ├─ HOW: GitHub Actions workflow:
  │       Run tests on push
  │       Build production bundle
  │       Deploy to hosting platform
  │       Environment variable management
  └─ VERIFY: Push to main triggers deployment

  Add monitoring and error tracking
  ├─ WHY: Know when things break in production
  ├─ HOW: Sentry integration:
  │       Capture JavaScript errors
  │       Track performance metrics
  │       Monitor API response times
  │       Alert on error spikes
  └─ VERIFY: Errors appear in dashboard

  Test in production environment
  ├─ WHY: Production behaves differently than local
  ├─ HOW: Production testing:
  │       Real Notion data
  │       Multiple users simultaneously
  │       Various network conditions
  │       Different devices/browsers
  └─ VERIFY: Production matches local behavior


  Days 38-40: Documentation & Launch
  Tasks:
  [ ] User documentation
  [ ] Developer guide
  [ ] Final bug fixes
  [ ] Production deployment

  Days 38-40: Documentation & Final Launch

  WHY: Enable long-term success through good documentation and smooth handoff.

  HOW:
  Create user documentation
  ├─ WHY: Users need onboarding without dev support
  ├─ HOW: User guide sections:
  │       Getting started walkthrough
  │       View explanations with screenshots
  │       Editing workflows
  │       Troubleshooting common issues
  └─ VERIFY: Non-technical user can follow guide

  Write developer documentation
  ├─ WHY: Future developers need to understand system
  ├─ HOW: Technical documentation:
  │       Architecture overview with diagrams
  │       Adding new features guide
  │       Deployment process
  │       Monitoring and debugging
  └─ VERIFY: New developer can contribute

  Final verification and launch
  ├─ WHY: Ensure production readiness
  ├─ HOW: Launch checklist:
  │       All acceptance criteria met
  │       Performance benchmarks pass
  │       Error handling tested
  │       Designers trained and ready
  └─ VERIFY: Both designers using tool daily

  Sprint 4 Deliverable: Production-ready tool in daily use
  - Optimized for real-world data volumes
  - Comprehensive error handling and recovery
  - Deployed with monitoring and documentation
  - Users trained and successfully onboarded
  - Ready for maintenance and future features

  ---
  Git Strategy & Development Workflow

  Branch Structure

  main (production)
    |
    +-- develop
         |
         +-- feature/sprint-1-foundation
         +-- feature/sprint-2-puzzle-view
         +-- feature/sprint-3-remaining-views
         +-- feature/sprint-4-production

  Commit Standards

  feat(scope): add new feature
  fix(scope): resolve bug
  refactor(scope): improve code
  test(scope): add tests
  docs(scope): update documentation

  Verification Commands

  npm run dev        # Development server
  npm run build      # Production build
  npm run typecheck  # TypeScript validation
  npm run lint       # Code quality
  npm run test       # Unit tests

  ---
  Risk Management

  Critical Checkpoints

  Week 1: Notion API Integration
  Success: Can fetch all 4 databases
  Failure: Switch to mock data + export

  Week 3: First View Feedback
  Success: Designers approve approach
  Failure: Iterate before continuing

  Week 5: Editing Functionality
  Success: 2-way sync working reliably
  Failure: Reduce editing scope

  Week 7: Performance Testing
  Success: Meets all targets
  Failure: Defer advanced features

  Technical Mitigations

  Notion Rate Limits
  // Batch requests with throttling
  const rateLimiter = pLimit(3); // 3 concurrent
  await rateLimiter(() => fetchData());

  Sync Conflicts
  // Clear user feedback
  toast.warning("Conflict detected", {
    action: "View Changes",
    onClick: () => showDiff()
  });

  ---
  First Day Action Plan

  # 1. Initialize project
  mkdir ALNRetool && cd ALNRetool
  git init

  # 2. Create initial structure
  echo "# ALNRetool" > README.md
  echo "node_modules/" > .gitignore
  git add . && git commit -m "initial: project setup"

  # 3. Set up development branch
  git checkout -b develop
  git checkout -b feature/sprint-1-foundation

  # 4. First coding task
  "Create a Vite React TypeScript project with these dependencies:
  - @tanstack/react-query
  - @xyflow/react
  - @notionhq/client
  - express
  - react-hot-toast
  And set up the basic folder structure"