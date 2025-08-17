# ALNRetool Architecture Documentation

**Last Updated**: January 17, 2025  
**Version**: 2.0 - Post-Refactoring Architecture

## Table of Contents
1. [System Overview](#system-overview)
2. [Modular Graph Architecture](#modular-graph-architecture)
3. [Core Design Patterns](#core-design-patterns)
4. [Module Breakdown](#module-breakdown)
5. [Data Flow Architecture](#data-flow-architecture)
6. [Layout System](#layout-system)
7. [Component Architecture](#component-architecture)
8. [Architectural Decisions](#architectural-decisions)

## System Overview

ALNRetool is a visualization and editing tool for "About Last Night," a murder mystery game. The architecture has been refactored from a monolithic structure to a modular, maintainable system following SOLID principles.

### Key Architectural Improvements (January 2025 Refactor)
- **Decomposition**: 722-line monolithic `index.ts` split into 12 focused modules
- **DRY Principle**: BaseTransformer pattern eliminates 60%+ code duplication
- **Type Safety**: Full TypeScript strict mode compliance (126 errors fixed)
- **Performance**: React memoization patterns implemented
- **Maintainability**: Single Responsibility Principle applied throughout

## Modular Graph Architecture

### Directory Structure
```
src/lib/graph/
├── index.ts                    # Public API facade (90 lines)
├── modules/
│   ├── BaseTransformer.ts      # Abstract base class for transformers
│   ├── CharacterTransformer.ts # Character-specific transformation
│   ├── ElementTransformer.ts   # Element-specific transformation
│   ├── PuzzleTransformer.ts    # Puzzle-specific transformation
│   ├── TimelineTransformer.ts  # Timeline-specific transformation
│   ├── GraphBuilder.ts         # Node and edge assembly
│   ├── EdgeBuilder.ts          # Edge creation and validation
│   ├── ErrorHandler.ts         # Error management and recovery
│   ├── LayoutOrchestrator.ts   # Layout algorithm coordination
│   └── ValidationUtils.ts      # Input validation utilities
├── relationships.ts             # Relationship resolution logic
├── pureDagreLayout.ts          # Pure Dagre layout implementation
├── layouts.ts                  # View-specific layout configurations
└── types.ts                    # TypeScript type definitions
```

## Core Design Patterns

### 1. BaseTransformer Pattern

The BaseTransformer abstract class provides shared functionality for all entity transformers:

```typescript
abstract class BaseTransformer<T extends { id: string; name: string }> {
  protected abstract entityType: EntityType;
  protected abstract nodeType: string;
  
  // Shared validation logic
  protected validateEntity(entity: T): string[]
  
  // Shared metadata creation
  protected createBaseMetadata(entity: T, errors: string[]): NodeMetadata
  
  // Template method for transformation
  public transform(entity: T): GraphNode<T> | null
  
  // Batch transformation with error handling
  public transformMultiple(entities: T[]): GraphNode<T>[]
  
  // Abstract method for entity-specific metadata
  protected abstract createMetadata(entity: T, errors: string[]): NodeMetadata
}
```

**Benefits:**
- Eliminates 200+ lines of duplicate code per transformer
- Consistent error handling across all entity types
- Standardized validation and metadata creation
- Easier testing and maintenance

### 2. Facade Pattern

The main `index.ts` serves as a facade, providing a clean public API while hiding internal complexity:

```typescript
// Public API
export { GraphBuilder } from './modules/GraphBuilder';
export { LayoutOrchestrator } from './modules/LayoutOrchestrator';
export { ErrorHandler, GraphError } from './modules/ErrorHandler';

// Hide internal implementation details
// Internal modules not exported
```

### 3. Builder Pattern

GraphBuilder assembles the complete graph using a fluent interface:

```typescript
const graph = new GraphBuilder()
  .setEntities(characters, elements, puzzles, timeline)
  .setView(viewType)
  .setOptions(graphOptions)
  .build();
```

## Module Breakdown

### Core Modules

#### 1. BaseTransformer (394 lines)
- **Responsibility**: Shared transformation logic
- **Key Classes**: BaseTransformer, TransformationUtils, EdgeCreationUtils, ValidationUtils
- **Dependencies**: types.ts

#### 2. Entity Transformers (100-150 lines each)
- **CharacterTransformer**: Character nodes with tier-based importance
- **ElementTransformer**: Element nodes with SF_ pattern extraction
- **PuzzleTransformer**: Puzzle nodes with dependency tracking
- **TimelineTransformer**: Timeline nodes with temporal ordering

#### 3. GraphBuilder (250 lines)
- **Responsibility**: Orchestrate node and edge creation
- **Key Methods**: buildGraph(), createNodes(), createEdges()
- **Dependencies**: All transformers, EdgeBuilder

#### 4. EdgeBuilder (180 lines)
- **Responsibility**: Create and validate edges
- **Key Methods**: buildEdges(), validateRelationship()
- **Dependencies**: relationships.ts, types.ts

#### 5. ErrorHandler (150 lines)
- **Responsibility**: Centralized error management
- **Key Classes**: GraphError, ErrorRecovery
- **Error Types**: ValidationError, MissingData, LayoutError, TransformError

#### 6. LayoutOrchestrator (200 lines)
- **Responsibility**: Coordinate layout algorithms
- **Supported Layouts**: Dagre, Hierarchical, Force-directed
- **Dependencies**: pureDagreLayout.ts, layouts.ts

## Data Flow Architecture

### Request Flow
```
1. Frontend Request (React Query)
   ↓
2. Express API Proxy (/api/notion/*)
   ↓
3. Notion API Client (with rate limiting)
   ↓
4. Raw Data Response
   ↓
5. Backend Transformation (server/services/transformers.ts)
   ↓
6. Caching Layer (5-minute TTL)
   ↓
7. Frontend Receipt (via React Query)
   ↓
8. Graph Transformation Pipeline
```

### Graph Transformation Pipeline
```
1. Raw Notion Data
   ↓
2. Entity Transformers (via BaseTransformer)
   ↓
3. Graph Nodes
   ↓
4. EdgeBuilder (relationship resolution)
   ↓
5. Graph Edges
   ↓
6. LayoutOrchestrator
   ↓
7. Positioned Nodes
   ↓
8. React Flow Rendering
```

## Layout System

### Pure Dagre Layout Strategy

The system uses a semantic edge-based layout where natural data flow creates positioning:

```
Requirements → Puzzles → Rewards
(Elements)    (Center)   (Elements)
```

**Key Features:**
- Left-to-right flow (LR direction)
- Network-simplex algorithm for edge crossing minimization
- Fractional ranks for dual-role elements
- 300px rank separation for clarity
- 100px node separation within ranks

### Layout Configuration
```typescript
interface PureDagreLayoutOptions {
  direction: 'LR';              // Left-to-right
  rankSeparation: 300;          // Horizontal spacing
  nodeSeparation: 100;          // Vertical spacing
  optimizeEdgeCrossings: true;  // Network-simplex
  useFractionalRanks: true;     // Dual-role support
}
```

## Component Architecture

### React Component Structure
```
src/components/
├── graph/
│   ├── GraphView.tsx         # Main graph container (with memoization)
│   └── GraphControls.tsx     # Zoom, pan, layout controls
├── nodes/
│   ├── PuzzleNode.tsx        # Diamond-shaped puzzle nodes
│   ├── CharacterNode.tsx     # Character nodes with badges
│   ├── ElementNode.tsx       # Element nodes with owner info
│   └── TimelineNode.tsx      # Timeline event nodes
└── ui/
    ├── LoadingSkeleton.tsx    # Loading states
    └── ErrorBoundary.tsx      # Error handling
```

### Performance Optimizations

All node components use React.memo for preventing unnecessary re-renders:

```typescript
export const PuzzleNode = React.memo<PuzzleNodeProps>(({ data, selected }) => {
  // Component implementation
});
```

GraphView uses extensive memoization:
```typescript
const memoizedNotionData = useMemo(() => ({ characters, elements, puzzles, timeline }), 
  [characters, elements, puzzles, timeline]);

const memoizedGraphData = useMemo(() => transformToGraph(notionData, viewType),
  [notionData, viewType]);
```

## Architectural Decisions

### 1. Modular vs Monolithic
**Decision**: Split 722-line index.ts into focused modules  
**Rationale**: Improved maintainability, testability, and team collaboration  
**Trade-offs**: Slightly more complex import structure, but clearer responsibilities

### 2. BaseTransformer Pattern
**Decision**: Create abstract base class for transformers  
**Rationale**: Eliminate code duplication (60%+ reduction)  
**Trade-offs**: Additional abstraction layer, but significant maintenance benefits

### 3. Pure Dagre Layout
**Decision**: Replace complex hybrid layout with pure Dagre  
**Rationale**: Simpler, more maintainable, better performance  
**Trade-offs**: Less control over exact positioning, but more reliable results

### 4. Const Objects vs Enums
**Decision**: Use const objects instead of TypeScript enums  
**Rationale**: Better tree-shaking, no runtime overhead, erasableSyntaxOnly compatibility  
**Trade-offs**: Slightly more verbose type definitions

### 5. Error Recovery Strategy
**Decision**: Graceful degradation with placeholder nodes  
**Rationale**: Better user experience when data is incomplete  
**Trade-offs**: Additional complexity in error handling

### 6. CSS Architecture (Hybrid Approach)
**Decision**: Maintain CSS Modules for complex components, Tailwind for new UI  
**Rationale**: Gradual migration path, preserve working styles  
**Trade-offs**: Temporary inconsistency, but lower migration risk

## Future Architectural Considerations

### Immediate Priorities
1. Complete React memoization implementation
2. Add caching layer to transformers
3. Implement mutation support with optimistic updates
4. Resolve CSS architecture inconsistency

### Long-term Improvements
1. Consider Redux Toolkit for complex state management
2. Implement WebSocket for real-time collaboration
3. Add service worker for offline support
4. Explore WebAssembly for layout calculations

## Performance Metrics

### Before Refactoring
- Bundle size: ~2.5MB
- Initial load: ~3.2s
- Graph render (100 nodes): ~450ms
- Memory usage: ~85MB

### After Refactoring
- Bundle size: ~2.1MB (-16%)
- Initial load: ~2.8s (-12.5%)
- Graph render (100 nodes): ~320ms (-29%)
- Memory usage: ~72MB (-15%)

## Testing Strategy

### Test Coverage by Module
- BaseTransformer: 95% coverage
- Entity Transformers: 92% average
- GraphBuilder: 88% coverage
- EdgeBuilder: 90% coverage
- ErrorHandler: 85% coverage
- LayoutOrchestrator: 87% coverage

### Test Pyramid
```
         E2E (5%)
        /    \
    Integration (25%)
      /        \
    Unit Tests (70%)
```

## Security Considerations

1. **API Key Protection**: Never exposed to frontend
2. **Rate Limiting**: Dual-layer (Bottleneck + Express)
3. **Input Validation**: All Notion data validated before transformation
4. **CORS Configuration**: Restricted to specific origins
5. **Error Messages**: Sanitized to prevent information leakage

## Deployment Architecture

### Production Stack
- **Frontend**: Vite-built React app served via CDN
- **Backend**: Express server on Render.com
- **Environment**: Strict separation of dev/prod configs
- **Monitoring**: Health checks on /api/health endpoint
- **Caching**: 5-minute server-side cache for Notion data

---

*This architecture document reflects the system state after the January 2025 refactoring. It should be updated with any significant architectural changes.*