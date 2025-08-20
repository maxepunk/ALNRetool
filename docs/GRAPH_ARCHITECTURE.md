# Graph Architecture Documentation

Comprehensive documentation of ALNRetool's graph visualization system.

## Overview

The graph system transforms Notion database entities into an interactive node-edge visualization using React Flow and Dagre layout algorithms. The architecture follows a modular transformer pattern with clear separation of concerns.

## Architecture Diagram

```
Notion Data → Transformers → Graph Builder → Layout Engine → React Flow
     ↓            ↓              ↓              ↓              ↓
  Entities    Normalized      Nodes/Edges    Positioned    Rendered
              Entities                        Graph         UI
```

## Core Modules

### Directory Structure
```
src/lib/graph/
├── index.ts                      # Public API facade
├── types.ts                      # TypeScript type definitions
├── relationships.ts              # Relationship mapping utilities
├── layout/
│   ├── dagre.ts                 # Pure Dagre layout implementation
│   └── force.ts                 # D3-force layout (experimental)
└── modules/
    ├── BaseTransformer.ts       # Abstract base class
    ├── EntityTransformer.ts     # Entity-to-node transformation
    ├── GraphBuilder.ts          # Node/edge assembly
    ├── EdgeBuilder.ts           # Smart edge creation
    ├── ErrorHandler.ts          # Error management
    ├── LayoutOrchestrator.ts    # Layout coordination
    ├── LayoutQualityMetrics.ts  # Quality measurement
    ├── VirtualEdgeInjector.ts   # Virtual edge handling
    └── ElementClusterer.ts      # Post-layout clustering
```

## Module Responsibilities

### BaseTransformer
Abstract base class providing common transformation patterns.

```typescript
abstract class BaseTransformer<TInput, TOutput> {
  protected errorHandler: ErrorHandler;
  
  abstract transform(input: TInput): TOutput;
  abstract validate(input: TInput): ValidationResult;
  
  protected handleError(error: Error): void;
  protected logMetrics(metrics: TransformMetrics): void;
}
```

**Key Features**:
- Error handling framework
- Validation pipeline
- Metrics collection
- Logging infrastructure

### EntityTransformer
Converts Notion entities into React Flow nodes.

**Transformations**:
```typescript
Character → CharacterNode {
  id: string
  type: 'characterNode'
  position: { x: 0, y: 0 }
  data: {
    label: string
    description: string
    relationships: string[]
    narrativeThreads: string[]
    timing: 'early' | 'middle' | 'late'
    color: string
  }
}

Element → ElementNode {
  id: string
  type: 'elementNode'
  position: { x: 0, y: 0 }
  data: {
    label: string
    description: string
    type: 'object' | 'information' | 'location'
    discoveredBy: string[]
    puzzles: string[]
    color: string
  }
}

Puzzle → PuzzleNode {
  id: string
  type: 'puzzleNode'
  position: { x: 0, y: 0 }
  data: {
    label: string
    description: string
    difficulty: number
    solutionType: string
    chain?: string
    dependencies: string[]
    rewards: string[]
    color: string
  }
}
```

### EdgeBuilder
Creates typed edges with intelligent weighting.

**Edge Types**:
- `dependency`: Puzzle prerequisites (weight: 10)
- `reward`: Puzzle rewards (weight: 8)
- `relation`: Character relationships (weight: 5)
- `chain`: Puzzle chain connections (weight: 15)
- `discovered`: Element discovery (weight: 6)

**Edge Creation Logic**:
```typescript
class EdgeBuilder {
  buildEdges(nodes: Node[]): Edge[] {
    const edges: Edge[] = [];
    
    // Puzzle dependencies
    puzzles.forEach(puzzle => {
      puzzle.dependencies.forEach(dep => {
        edges.push({
          id: `dep-${puzzle.id}-${dep}`,
          source: dep,
          target: puzzle.id,
          type: 'dependency',
          weight: 10
        });
      });
    });
    
    // Character relationships (bidirectional)
    characters.forEach(char => {
      char.relationships.forEach(rel => {
        if (!edgeExists(char.id, rel)) {
          edges.push({
            id: `rel-${char.id}-${rel}`,
            source: char.id,
            target: rel,
            type: 'relation',
            weight: 5
          });
        }
      });
    });
    
    return edges;
  }
}
```

### VirtualEdgeInjector
Adds virtual edges to improve layout quality without affecting visualization.

**Virtual Edge Strategy**:
```typescript
class VirtualEdgeInjector {
  injectVirtualEdges(nodes: Node[], edges: Edge[]): Edge[] {
    const virtualEdges: Edge[] = [];
    
    // Connect isolated nodes to nearest cluster
    isolatedNodes.forEach(node => {
      const nearest = findNearestCluster(node);
      virtualEdges.push({
        id: `virtual-${node.id}-${nearest.id}`,
        source: node.id,
        target: nearest.id,
        weight: 0.1,
        hidden: true
      });
    });
    
    // Add chain continuity edges
    puzzleChains.forEach(chain => {
      chain.puzzles.forEach((puzzle, i) => {
        if (i < chain.puzzles.length - 1) {
          virtualEdges.push({
            id: `chain-${puzzle}-${chain.puzzles[i+1]}`,
            source: puzzle,
            target: chain.puzzles[i+1],
            weight: 15,
            hidden: false
          });
        }
      });
    });
    
    return [...edges, ...virtualEdges];
  }
}
```

### LayoutOrchestrator
Coordinates the layout process using Dagre.

**Configuration**:
```typescript
const dagreConfig = {
  rankdir: 'LR',           // Left-to-right flow
  ranksep: 300,            // Horizontal spacing
  nodesep: 100,            // Vertical spacing
  align: 'UL',             // Upper-left alignment
  acyclicer: 'greedy',     // Cycle removal strategy
  ranker: 'network-simplex' // Optimal edge crossing
};
```

**Layout Process**:
1. Initialize Dagre graph
2. Add nodes with dimensions
3. Add edges with weights
4. Inject virtual edges
5. Run layout algorithm
6. Extract positions
7. Apply clustering
8. Remove virtual edges

### LayoutQualityMetrics
Measures and reports layout quality.

**Metrics Collected**:
- Edge crossing count
- Node overlap percentage
- Aspect ratio
- Whitespace distribution
- Cluster cohesion
- Edge length variance

```typescript
interface LayoutMetrics {
  crossings: number;
  overlaps: number;
  aspectRatio: number;
  avgEdgeLength: number;
  edgeLengthVariance: number;
  clusterCohesion: number;
  whitespaceRatio: number;
  layoutTime: number;
}
```

## Node Types

### Character Node
```typescript
{
  type: 'characterNode',
  style: {
    background: 'linear-gradient(135deg, #10B981, #059669)',
    borderRadius: '12px',
    border: '2px solid rgba(16, 185, 129, 0.3)',
    minWidth: '200px',
    minHeight: '80px'
  }
}
```

### Element Node
```typescript
{
  type: 'elementNode',
  style: {
    background: 'linear-gradient(135deg, #A855F7, #9333EA)',
    borderRadius: '8px',
    border: '2px solid rgba(168, 85, 247, 0.3)',
    minWidth: '180px',
    minHeight: '70px'
  }
}
```

### Puzzle Node
```typescript
{
  type: 'puzzleNode',
  style: {
    background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
    clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
    minWidth: '160px',
    minHeight: '160px'
  }
}
```

### Timeline Node
```typescript
{
  type: 'timelineNode',
  style: {
    background: 'linear-gradient(135deg, #F97316, #EA580C)',
    borderRadius: '16px',
    border: '2px solid rgba(249, 115, 22, 0.3)',
    minWidth: '220px',
    minHeight: '90px'
  }
}
```

## Edge Types

### Dependency Edge
- **Style**: Solid line with arrow
- **Color**: `#94A3B8`
- **Weight**: 10
- **Use**: Puzzle prerequisites

### Reward Edge
- **Style**: Dashed line with arrow
- **Color**: `#10B981`
- **Weight**: 8
- **StrokeDasharray**: "5,5"
- **Use**: Puzzle rewards (elements)

### Relation Edge
- **Style**: Dotted line, no arrow
- **Color**: `#A855F7`
- **Weight**: 5
- **StrokeDasharray**: "2,4"
- **Use**: Character relationships

### Chain Edge
- **Style**: Bold solid line
- **Color**: `#F97316`
- **Weight**: 15
- **StrokeWidth**: 3
- **Use**: Puzzle chain connections

## Layout Algorithm

### Dagre Configuration
```javascript
const g = new dagre.graphlib.Graph({
  directed: true,
  multigraph: false,
  compound: false
});

g.setGraph({
  rankdir: 'LR',
  align: 'UL',
  nodesep: 100,
  edgesep: 50,
  ranksep: 300,
  marginx: 50,
  marginy: 50,
  acyclicer: 'greedy',
  ranker: 'network-simplex'
});
```

### Layout Steps

1. **Graph Initialization**
   ```typescript
   const g = new dagre.graphlib.Graph();
   g.setGraph(config);
   ```

2. **Node Addition**
   ```typescript
   nodes.forEach(node => {
     g.setNode(node.id, {
       width: node.width || 200,
       height: node.height || 100
     });
   });
   ```

3. **Edge Addition with Weights**
   ```typescript
   edges.forEach(edge => {
     g.setEdge(edge.source, edge.target, {
       weight: edge.weight || 1,
       minlen: edge.minlen || 1
     });
   });
   ```

4. **Layout Execution**
   ```typescript
   dagre.layout(g);
   ```

5. **Position Extraction**
   ```typescript
   nodes.forEach(node => {
     const position = g.node(node.id);
     node.position = {
       x: position.x - position.width / 2,
       y: position.y - position.height / 2
     };
   });
   ```

## Performance Optimizations

### Caching Strategy
- Layout results cached for 5 minutes
- Invalidated on entity updates
- Partial re-layout for local changes

### Batch Processing
- Edge creation batched by type
- Virtual edge injection in single pass
- Position updates batched

### Rendering Optimizations
- React.memo for node components
- Virtualization for large graphs (>500 nodes)
- Progressive rendering for initial load

## Quality Metrics

### Target Metrics
- **Edge Crossings**: < 10% of total edges
- **Node Overlaps**: 0
- **Aspect Ratio**: 16:9 to 4:3
- **Layout Time**: < 200ms for 100 nodes
- **Frame Rate**: 60fps during interactions

### Monitoring
```typescript
const metrics = layoutQualityMetrics.calculate(nodes, edges);
console.log('Layout Quality:', {
  crossings: metrics.crossings,
  overlaps: metrics.overlaps,
  aspectRatio: metrics.aspectRatio,
  performance: metrics.layoutTime
});
```

## React Flow Integration

### Graph Component
```typescript
<ReactFlow
  nodes={nodes}
  edges={edges}
  nodeTypes={nodeTypes}
  edgeTypes={edgeTypes}
  onNodesChange={onNodesChange}
  onEdgesChange={onEdgesChange}
  onNodeClick={handleNodeClick}
  fitView
  fitViewOptions={{
    padding: 0.2,
    maxZoom: 1.5
  }}
>
  <Background variant="dots" />
  <Controls />
  <MiniMap />
</ReactFlow>
```

### Custom Hooks
```typescript
// useGraphLayout.ts
const useGraphLayout = (entities: GraphData) => {
  const { nodes, edges } = useMemo(() => {
    const transformer = new GraphBuilder();
    return transformer.build(entities);
  }, [entities]);
  
  const layoutedElements = useMemo(() => {
    const orchestrator = new LayoutOrchestrator();
    return orchestrator.layout(nodes, edges);
  }, [nodes, edges]);
  
  return layoutedElements;
};
```

## Error Handling

### Error Types
```typescript
enum GraphErrorType {
  TRANSFORM_ERROR = 'TRANSFORM_ERROR',
  LAYOUT_ERROR = 'LAYOUT_ERROR',
  RENDER_ERROR = 'RENDER_ERROR',
  DATA_ERROR = 'DATA_ERROR'
}
```

### Error Recovery
```typescript
class ErrorHandler {
  handleError(error: GraphError): RecoveryAction {
    switch (error.type) {
      case GraphErrorType.TRANSFORM_ERROR:
        return { action: 'SKIP_ENTITY', fallback: null };
      case GraphErrorType.LAYOUT_ERROR:
        return { action: 'USE_FALLBACK_LAYOUT', fallback: 'grid' };
      case GraphErrorType.RENDER_ERROR:
        return { action: 'SHOW_ERROR_BOUNDARY', fallback: <ErrorFallback /> };
      default:
        return { action: 'LOG_AND_CONTINUE', fallback: null };
    }
  }
}
```

## Testing Strategy

### Unit Tests
- Transformer logic validation
- Edge weight calculations
- Layout algorithm correctness
- Error handling paths

### Integration Tests
- Full transformation pipeline
- Layout with real data
- React Flow rendering
- User interactions

### Performance Tests
- Layout time benchmarks
- Memory usage profiling
- Render performance
- Large dataset handling

## Future Enhancements

### Planned Features
1. **Alternative Layouts**
   - Force-directed layout
   - Hierarchical layout
   - Circular layout
   - Grid layout

2. **Advanced Interactions**
   - Multi-select operations
   - Bulk editing
   - Drag-and-drop reordering
   - Context menus

3. **Visual Improvements**
   - Animated transitions
   - 3D visualization option
   - Custom node shapes
   - Theme customization

4. **Performance**
   - WebWorker for layout calculation
   - GPU acceleration
   - Incremental layout updates
   - Level-of-detail rendering

5. **Analytics**
   - Graph complexity metrics
   - User interaction tracking
   - Performance monitoring
   - Layout quality reporting