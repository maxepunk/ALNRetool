# ALNRetool - Complete Architectural Schema

## Table of Contents
1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Frontend Architecture (145 files)](#frontend-architecture)
4. [Backend Architecture (28 files)](#backend-architecture)
5. [Data Flow Architecture](#data-flow-architecture)
6. [State Management](#state-management)
7. [API Layer](#api-layer)
8. [Testing Architecture](#testing-architecture)
9. [Build & Deployment](#build--deployment)
10. [File-by-File Architecture Map](#file-by-file-architecture-map)

## System Overview

ALNRetool is a graph-based visualization and editing tool for the "About Last Night" murder mystery game. It provides an interactive interface for managing characters, puzzles, story elements, and timeline events stored in Notion databases.

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (React)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   UI Layer   │  │ State Mgmt   │  │   Services   │      │
│  │  Components  │◄─┤   Zustand    │◄─┤  API Client  │      │
│  │  React Flow  │  │ TanStack Q   │  │   Batching   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────┬───────────────────────────────┘
                              │ HTTP/REST
┌─────────────────────────────▼───────────────────────────────┐
│                      Backend (Express.js)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Middleware  │  │    Routes    │  │   Services   │      │
│  │ Auth/CORS    │──┤ /api/notion  │──┤ Notion API   │      │
│  │ Rate Limit   │  │ /api/graph   │  │    Cache     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────┬───────────────────────────────┘
                              │ Notion API
┌─────────────────────────────▼───────────────────────────────┐
│                    External Data (Notion)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Characters  │  │   Elements   │  │   Puzzles    │      │
│  │   Database   │  │   Database   │  │   Database   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└──────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend (src/ - 145 files)
- **Framework**: React 18.3.1 with TypeScript 5.8.3
- **Build Tool**: Vite 7.0.4
- **Routing**: React Router DOM 7.6.3
- **Graph Visualization**: React Flow (@xyflow/react) 12.8.3
- **State Management**: 
  - Zustand 5.0.8 (client state)
  - TanStack Query 5.85.0 (server state)
- **Styling**: Tailwind CSS 4.1.12, Framer Motion 12.23.12
- **UI Components**: Custom components + Radix UI primitives

### Backend (server/ - 28 files)
- **Framework**: Express.js 5.1.0 with TypeScript
- **API Client**: Notion API Client 4.0.1
- **Caching**: Node-cache 5.1.2
- **Rate Limiting**: express-rate-limit 7.5.1
- **Logging**: Winston 3.17.0
- **Process Management**: TSX watch mode (dev), Node.js (prod)

### Testing Infrastructure
- **Unit/Integration**: Vitest 3.2.4 with happy-dom
- **E2E**: Playwright 1.55.0
- **Mocking**: MSW 2.10.4
- **Coverage**: Vitest Coverage v8

## Frontend Architecture

### Directory Structure (src/)

```
src/
├── App.tsx                 # Root component with providers
├── main.tsx               # Application entry point
├── index.css              # Global styles
├── vite-env.d.ts          # Vite type definitions
│
├── components/ (52 files)
│   ├── common/            # Shared UI components (7 files)
│   ├── field-editors/     # Form field components (6 files)
│   ├── filters/           # Filter components (1 file)
│   ├── graph/             # Graph visualization (17 files)
│   │   ├── nodes/         # Node components (9 files)
│   │   ├── edges/         # Edge components (2 files)
│   │   └── LayoutProgress/# Layout indicators (2 files)
│   ├── layout/            # Layout components (3 files)
│   ├── sidebar/           # Sidebar components (6 files)
│   ├── skeletons/         # Loading skeletons (2 files)
│   └── ui/                # Base UI components (15 files)
│
├── config/ (7 files)
│   ├── entity-fields/     # Entity field configs (5 files)
│   ├── fieldRegistry.ts   # Field type registry
│   └── zIndex.ts          # Z-index constants
│
├── contexts/ (2 files)
│   ├── GraphAnimationContext.tsx
│   └── ViewContext.tsx
│
├── hooks/ (24 files)
│   ├── detail-panel/      # Detail panel hooks (1 file)
│   ├── generic/           # Generic data hooks (1 file)
│   ├── graph/             # Graph-specific hooks (2 files)
│   └── mutations/         # Data mutation hooks (5 files)
│
├── lib/ (31 files)
│   ├── animations.ts      # Animation utilities
│   ├── cache/             # Cache updaters (2 files)
│   ├── filters/           # Filter logic (2 files)
│   ├── graph/             # Graph utilities (11 files)
│   │   ├── layout/        # Layout algorithms (1 file)
│   │   └── cache/         # Graph caching (1 file)
│   ├── utils/             # Utility functions (1 file)
│   └── viewConfigs.ts     # View configurations
│
├── router/ (1 file)
│   └── AppRouter.tsx      # Route definitions
│
├── services/ (3 files)
│   ├── api.ts             # Main API client
│   ├── graphApi.ts        # Graph API endpoints
│   └── requestBatcher.ts  # Request batching
│
├── stores/ (4 files)
│   ├── creationStore.ts   # Entity creation state
│   ├── filterStore.ts     # Filter state
│   ├── uiStore.ts         # UI preferences
│   └── viewStore.ts       # View state
│
├── test/ (15 files)
│   ├── helpers/           # Test helpers
│   ├── mocks/             # Mock data (8 files)
│   ├── utils/             # Test utilities (4 files)
│   └── setup.ts           # Test setup
│
├── types/ (11 files)
│   ├── api/               # API types
│   ├── notion/            # Notion types (5 files)
│   ├── shared/            # Shared types
│   └── mutations.ts       # Mutation types
│
└── utils/ (5 files)
    ├── fieldValidation.ts # Field validation
    ├── logger.ts          # Frontend logger
    ├── performance.ts     # Performance utils
    └── urlState.ts        # URL state sync

```

### Component Architecture

#### 1. **Graph Components** (src/components/graph/)
- **GraphView.tsx**: Main graph container with React Flow
- **Node Types**: CharacterNode, ElementNode, PuzzleNode, TimelineNode
- **Edge Types**: DefaultEdge with custom styling
- **Layout Engine**: Dagre algorithm for automatic positioning

#### 2. **State Management Architecture**

```typescript
// Zustand Stores (Client State)
filterStore.ts    -> Filters, search, visibility
creationStore.ts  -> Entity creation workflow
uiStore.ts        -> UI preferences, theme
viewStore.ts      -> View configuration

// TanStack Query (Server State)
- Caching: 5 min stale time
- Background refetching
- Optimistic updates
- Request batching
```

#### 3. **Data Flow Patterns**

```
User Action → Hook → Store/Query → API → Backend → Notion
     ↑                                              ↓
     └──────── Optimistic Update ←─── Response ────┘
```

## Backend Architecture

### Directory Structure (server/)

```
server/
├── index.ts               # Main server entry
├── config/
│   └── index.ts          # Configuration loader
│
├── middleware/ (3 files)
│   ├── auth.ts           # API key authentication
│   ├── errorHandler.ts   # Global error handling
│   └── validation.ts     # Request validation
│
├── routes/ (11 files)
│   ├── cache.ts          # Cache management
│   ├── graph.ts          # Graph endpoints
│   └── notion/           # Notion proxy routes (8 files)
│       ├── base.ts       # Base router factory
│       ├── characters.ts # Character endpoints
│       ├── elements.ts   # Element endpoints
│       ├── puzzles.ts    # Puzzle endpoints
│       ├── timeline.ts   # Timeline endpoints
│       ├── synthesized.ts# Relationship synthesis
│       ├── createEntityRouter.ts # Entity CRUD
│       └── index.ts      # Route aggregator
│
├── services/ (9 files)
│   ├── cache.ts          # Cache service
│   ├── deltaCalculator.ts# Delta computation
│   ├── filterBuilder.ts  # Query filters
│   ├── graphBuilder.ts   # Graph construction
│   ├── graphStateCapture.ts # State snapshots
│   ├── notion.ts         # Notion API wrapper
│   ├── notionPropertyMappers.ts # Property mapping
│   └── relationshipSynthesizer.ts # Relationship resolution
│
├── types/ (2 files)
│   ├── delta.ts          # Delta types
│   └── entityProperties.ts # Entity property types
│
└── utils/ (3 files)
    ├── asyncHandler.ts   # Async error handling
    ├── entityTypeDetection.ts # Type detection
    └── logger.ts         # Winston logger
```

### API Architecture

#### Endpoint Structure
```
/api/
├── health                 # Health check (public)
├── notion/
│   ├── characters         # GET, PUT operations
│   ├── elements          # GET, PUT operations
│   ├── puzzles           # GET, PUT operations
│   ├── timeline          # GET, PUT operations
│   └── synthesized       # GET relationships
├── graph/
│   └── data              # GET complete graph
└── cache/
    ├── stats             # GET cache statistics
    └── clear             # POST clear cache
```

## Data Flow Architecture

### 1. **Read Flow**
```
Frontend Request
    ↓
TanStack Query Cache Check
    ↓ (cache miss)
API Client (with batching)
    ↓
Express Route Handler
    ↓
Node-cache Check
    ↓ (cache miss)
Notion API Service
    ↓
Notion Database
    ↓
Response Transformation
    ↓
Cache Update
    ↓
Frontend State Update
```

### 2. **Write Flow**
```
User Action
    ↓
Optimistic Update (UI)
    ↓
Mutation Hook
    ↓
API Request
    ↓
Express Validation
    ↓
Notion API Update
    ↓ (success)
Cache Invalidation
    ↓
Query Refetch
    ↓
UI Reconciliation
```

### 3. **Graph Construction**
```
Parallel Fetch (4 entity types)
    ↓
Relationship Synthesis
    ↓
Node Creation
    ↓
Edge Generation
    ↓
Layout Calculation (Dagre)
    ↓
React Flow Render
```

## State Management

### Client State (Zustand)
- **filterStore**: Search, filters, visibility
- **creationStore**: Entity creation workflow
- **uiStore**: Theme, preferences
- **viewStore**: View configuration

### Server State (TanStack Query)
- **Entity Queries**: Characters, elements, puzzles, timeline
- **Graph Query**: Complete graph data
- **Mutations**: Update operations with optimistic updates

### URL State
- Filter synchronization
- Shareable links
- Browser history integration

## API Layer

### Request Batching
```typescript
// requestBatcher.ts
- Groups parallel requests
- Reduces API calls
- Improves performance
```

### Caching Strategy
- **Client**: 5-minute stale time
- **Server**: 5-minute TTL
- **Invalidation**: On mutations
- **Background**: Refetch on focus

### Authentication
- API key-based
- Origin validation
- Rate limiting (100 req/min)

## Testing Architecture

### Unit Tests (Vitest)
- **Components**: 52 test files
- **Hooks**: 24 test files
- **Utils**: 31 test files
- **Coverage**: 80% minimum

### Integration Tests
- API endpoint testing
- Service layer testing
- Mock Notion responses

### E2E Tests (Playwright)
- User workflows
- Graph interactions
- CRUD operations

## Build & Deployment

### Development
```bash
npm run dev         # Concurrent client + server
npm run dev:client  # Vite dev server (5173)
npm run dev:server  # Express with TSX watch (3001)
```

### Production Build
```bash
npm run build       # Build both client + server
├── dist/client/    # Vite production build
└── dist/server/    # TypeScript compiled server
```

### Configuration Files
- **vite.config.ts**: Build configuration
- **tsconfig.json**: TypeScript project references
- **tsconfig.app.json**: Frontend TypeScript
- **tsconfig.server.json**: Backend TypeScript
- **tailwind.config.js**: Styling configuration
- **eslint.config.js**: Linting rules
- **playwright.config.ts**: E2E test configuration

## File-by-File Architecture Map

### Core Entry Points
- `src/main.tsx`: React DOM root, provider setup
- `src/App.tsx`: Provider hierarchy, global config
- `server/index.ts`: Express server, middleware, routes

### Key Architectural Files

#### Frontend Core
- `src/components/graph/GraphView.tsx`: Main graph orchestrator
- `src/stores/filterStore.ts`: Central filter state
- `src/services/api.ts`: API client with batching
- `src/hooks/mutations/entityMutations.ts`: CRUD operations
- `src/lib/graph/nodeCreators.ts`: Node factory functions
- `src/lib/graph/layout/dagre.ts`: Graph layout algorithm

#### Backend Core
- `server/routes/notion/createEntityRouter.ts`: Entity CRUD factory
- `server/services/notion.ts`: Notion API wrapper
- `server/services/relationshipSynthesizer.ts`: Bidirectional relationships
- `server/services/graphBuilder.ts`: Graph data transformation
- `server/services/cache.ts`: Caching layer
- `server/services/deltaCalculator.ts`: Change detection

### Data Type Definitions
- `src/types/notion/app.ts`: Frontend entity types
- `src/types/notion/raw.ts`: Notion API types
- `src/types/notion/transforms.ts`: Type transformations
- `server/types/entityProperties.ts`: Backend entity types
- `server/types/delta.ts`: Delta calculation types

### Configuration Files
- `src/config/entity-fields/*.ts`: Field configurations per entity
- `src/config/fieldRegistry.ts`: Field type registry
- `src/lib/viewConfigs.ts`: View-specific configurations
- `server/config/index.ts`: Server configuration

### Testing Infrastructure
- `src/test/setup.ts`: Test environment setup
- `src/test/mocks/handlers.ts`: MSW API mocks
- `tests/e2e/edge-mutations.spec.ts`: E2E test suite
- `scripts/smoke-test.ts`: Smoke test runner
- `scripts/integration-test.ts`: Integration test runner

## Performance Optimizations

### Frontend
- Request batching for parallel API calls
- Memoization in graph calculations
- Virtual rendering for large graphs
- Progressive loading with pagination
- Optimistic updates for better UX

### Backend
- In-memory caching with TTL
- Rate limiting for API protection
- Parallel Notion API calls
- Connection pooling
- Response compression

## Security Measures

### Authentication & Authorization
- API key validation
- Origin checking (CORS)
- Rate limiting per IP
- Input validation middleware

### Data Protection
- No sensitive data in frontend
- Environment variable isolation
- Secure cookie handling
- Error message sanitization

## Monitoring & Logging

### Frontend
- Performance monitoring hooks
- Error boundaries
- Console logging utilities

### Backend
- Winston logger with levels
- Request/response logging
- Error tracking
- Health check endpoints

---

This architectural schema covers all 173 TypeScript/React files across the frontend and backend, providing a complete map of the ALNRetool codebase structure, data flows, and system design.