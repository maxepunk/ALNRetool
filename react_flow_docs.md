# React Flow v12 Comprehensive Reference Documentation

## Package installation and basic setup

React Flow has migrated to a new package name in v12. The library provides a powerful, customizable node-based editor framework for React applications.

### Installation
```bash
npm install @xyflow/react
```

### Required imports
```typescript
import { ReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';  // Required for proper rendering
```

---

## Core Components API

### ReactFlow Component

The main container component that renders nodes, edges, and handles all user interactions.

#### Essential Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| **nodes** | `Node[]` | `[]` | Array of nodes in controlled flow |
| **edges** | `Edge[]` | `[]` | Array of edges in controlled flow |
| **defaultNodes** | `Node[]` | - | Initial nodes for uncontrolled flow |
| **defaultEdges** | `Edge[]` | - | Initial edges for uncontrolled flow |
| **nodeTypes** | `NodeTypes` | Built-in types | Custom node components mapping |
| **edgeTypes** | `EdgeTypes` | Built-in types | Custom edge components mapping |
| **colorMode** | `'light' \| 'dark' \| 'system'` | `'light'` | Color scheme control |
| **fitView** | `boolean` | `false` | Auto-fit view to nodes |
| **fitViewOptions** | `FitViewOptions` | - | Options for fit view behavior |

#### Viewport Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| **defaultViewport** | `Viewport` | `{x: 0, y: 0, zoom: 1}` | Initial viewport position |
| **viewport** | `Viewport` | - | Controlled viewport state |
| **onViewportChange** | `(viewport: Viewport) => void` | - | Viewport change handler |
| **minZoom** | `number` | `0.5` | Minimum zoom level |
| **maxZoom** | `number` | `2` | Maximum zoom level |

#### Interaction Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| **nodesDraggable** | `boolean` | `true` | Enable node dragging |
| **nodesConnectable** | `boolean` | `true` | Enable node connections |
| **nodesFocusable** | `boolean` | `true` | Enable node focus |
| **elementsSelectable** | `boolean` | `true` | Enable element selection |
| **panOnDrag** | `boolean \| number[]` | `true` | Enable viewport panning |
| **zoomOnScroll** | `boolean` | `true` | Enable scroll-to-zoom |
| **zoomOnDoubleClick** | `boolean` | `true` | Enable double-click zoom |
| **selectNodesOnDrag** | `boolean` | `true` | Select nodes when dragging |

### Background Component

Renders customizable background patterns (dots, lines, cross).

```typescript
import { Background, BackgroundVariant } from '@xyflow/react';
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| **variant** | `BackgroundVariant` | `'dots'` | Pattern type: 'dots', 'lines', 'cross' |
| **gap** | `number \| [number, number]` | `20` | Gap between pattern elements |
| **size** | `number` | - | Size of dots or rectangles |
| **color** | `string` | - | Pattern color |
| **bgColor** | `string` | - | Background color |
| **lineWidth** | `number` | `1` | Stroke thickness for lines |

### Controls Component

Renders viewport control buttons (zoom, fit view, interactive toggle).

```typescript
import { Controls } from '@xyflow/react';
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| **showZoom** | `boolean` | `true` | Show zoom in/out buttons |
| **showFitView** | `boolean` | `true` | Show fit view button |
| **showInteractive** | `boolean` | `true` | Show interactive toggle button |
| **position** | `PanelPosition` | `'bottom-left'` | Position on viewport |
| **orientation** | `'horizontal' \| 'vertical'` | `'vertical'` | Button layout |

### MiniMap Component

Renders a miniature overview of the flow for navigation.

```typescript
import { MiniMap } from '@xyflow/react';
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| **position** | `PanelPosition` | `'bottom-right'` | Position on viewport |
| **nodeColor** | `string \| (node: Node) => string` | `"#e2e2e2"` | Node color in minimap |
| **nodeStrokeColor** | `string \| (node: Node) => string` | `"transparent"` | Node stroke color |
| **pannable** | `boolean` | `false` | Enable panning interaction |
| **zoomable** | `boolean` | `false` | Enable zoom interaction |
| **nodeBorderRadius** | `number` | `5` | Node border radius |

### Panel Component

Positions custom content above the viewport.

```typescript
import { Panel } from '@xyflow/react';
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| **position** | `PanelPosition` | `'top-left'` | Panel position |
| **children** | `ReactNode` | - | Panel content |

---

## React Flow Hooks

### State Management Hooks

#### useNodesState()
Manages node state with built-in change handling.

```typescript
const [nodes, setNodes, onNodesChange] = useNodesState<NodeType>(initialNodes);
```

**Returns:**
- `nodes: NodeType[]` - Current nodes array
- `setNodes: Dispatch<SetStateAction<NodeType[]>>` - State setter
- `onNodesChange: OnNodesChange<NodeType>` - Change handler for ReactFlow

#### useEdgesState()
Manages edge state with built-in change handling.

```typescript
const [edges, setEdges, onEdgesChange] = useEdgesState<EdgeType>(initialEdges);
```

#### useNodes()
Returns current nodes array (causes re-renders on any node change).

```typescript
const nodes = useNodes<NodeType>();
```

#### useEdges()
Returns current edges array (causes re-renders on any edge change).

```typescript
const edges = useEdges<EdgeType>();
```

### React Flow Instance Hook

#### useReactFlow()
Returns the ReactFlow instance for programmatic control.

```typescript
const reactFlowInstance = useReactFlow<NodeType, EdgeType>();
```

**Key methods:**
- `getNodes()` - Get current nodes
- `getEdges()` - Get current edges
- `setNodes(nodes)` - Set nodes
- `setEdges(edges)` - Set edges
- `addNodes(nodes)` - Add nodes
- `addEdges(edges)` - Add edges
- `deleteElements({nodes, edges})` - Delete elements
- `fitView(options?)` - Fit viewport to nodes
- `zoomIn()` / `zoomOut()` - Zoom controls
- `zoomTo(zoomLevel)` - Set specific zoom
- `getViewport()` - Get viewport state
- `setViewport({x, y, zoom})` - Set viewport
- `screenToFlowPosition({x, y})` - Convert screen to flow coordinates
- `flowToScreenPosition({x, y})` - Convert flow to screen coordinates

### Viewport and Store Hooks

#### useViewport()
Returns current viewport state.

```typescript
const { x, y, zoom } = useViewport();
```

#### useStore()
Subscribe to internal store with selectors.

```typescript
const nodeCount = useStore((state) => state.nodes.length);
```

#### useStoreApi()
Direct store access without re-renders.

```typescript
const store = useStoreApi();
const currentNodes = store.getState().nodes;
```

### Node Management Hooks

#### useUpdateNodeInternals()
Update internal node dimensions after programmatic changes.

```typescript
const updateNodeInternals = useUpdateNodeInternals();
updateNodeInternals(nodeId); // Call after modifying node handles/dimensions
```

#### useNodesData()
Subscribe to specific node data changes.

```typescript
const nodeData = useNodesData<NodeType>('nodeId');
const nodesData = useNodesData<NodeType>(['nodeId1', 'nodeId2']);
```

#### useNodesInitialized()
Check if all nodes have been measured.

```typescript
const nodesInitialized = useNodesInitialized({ includeHiddenNodes: false });
```

### Event and Connection Hooks

#### useOnSelectionChange()
Listen for selection changes.

```typescript
const onChange = useCallback(({ nodes, edges }) => {
  console.log('Selected:', nodes, edges);
}, []);

useOnSelectionChange({ onChange });
```

#### useOnViewportChange()
Listen for viewport changes.

```typescript
useOnViewportChange({
  onStart: (viewport) => console.log('Start:', viewport),
  onChange: (viewport) => console.log('Change:', viewport),
  onEnd: (viewport) => console.log('End:', viewport),
});
```

#### useHandleConnections()
Get connections for a specific handle.

```typescript
const connections = useHandleConnections({
  type: 'target',
  id: 'handle-id'
});
```

---

## Node and Edge Types

### Node Interface

```typescript
interface Node<T = any> {
  // Core properties
  id: string;
  position: { x: number; y: number };
  data: T;
  
  // Type and positioning
  type?: string;
  sourcePosition?: Position;
  targetPosition?: Position;
  
  // State properties
  selected?: boolean;
  dragging?: boolean;
  draggable?: boolean;
  selectable?: boolean;
  connectable?: boolean;
  deletable?: boolean;
  
  // Styling
  style?: React.CSSProperties;
  className?: string;
  hidden?: boolean;
  
  // Dimensions
  width?: number;
  height?: number;
  measured?: { width?: number; height?: number; };
  
  // Hierarchy
  parentId?: string;
  extent?: 'parent' | [[number, number], [number, number]];
  expandParent?: boolean;
  
  // Advanced
  zIndex?: number;
  focusable?: boolean;
  ariaLabel?: string;
}
```

### Built-in Node Types
1. **default** - Standard node with source and target handles
2. **input** - Node with only source handles
3. **output** - Node with only target handles
4. **group** - Container node for grouping

### Edge Interface

```typescript
interface Edge<T = any> {
  // Core properties
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  
  // Type and styling
  type?: string;
  style?: React.CSSProperties;
  className?: string;
  animated?: boolean;
  
  // Labels
  label?: string | React.ReactNode;
  labelStyle?: React.CSSProperties;
  labelShowBg?: boolean;
  labelBgStyle?: React.CSSProperties;
  labelBgPadding?: [number, number];
  
  // State
  selected?: boolean;
  hidden?: boolean;
  deletable?: boolean;
  
  // Markers
  markerStart?: EdgeMarker;
  markerEnd?: EdgeMarker;
  
  // Data
  data?: T;
  
  // Interaction
  focusable?: boolean;
  interactionWidth?: number;
}
```

### Built-in Edge Types
1. **default** / **bezier** - Smooth bezier curve
2. **straight** - Direct line
3. **step** - Right-angled connections
4. **smoothstep** - Right-angled with rounded corners
5. **simplebezier** - Simplified bezier curve

### Handle Component

```typescript
interface HandleProps {
  id?: string;
  type: 'source' | 'target';
  position: Position;
  isConnectable?: boolean;
  isValidConnection?: (connection: Connection) => boolean;
  style?: React.CSSProperties;
  className?: string;
}
```

---

## Event Handlers

### Connection Events

| Event | Signature | Description |
|-------|-----------|-------------|
| **onConnect** | `(connection: Connection) => void` | Connection completed |
| **onConnectStart** | `(event, {nodeId, handleId, handleType}) => void` | Connection drag started |
| **onConnectEnd** | `(event: MouseEvent) => void` | Connection drag ended |
| **onReconnect** | `(oldEdge: Edge, newConnection: Connection) => void` | Edge reconnected |

### Node Events

| Event | Signature | Description |
|-------|-----------|-------------|
| **onNodeClick** | `(event: MouseEvent, node: Node) => void` | Node clicked |
| **onNodeDoubleClick** | `(event: MouseEvent, node: Node) => void` | Node double-clicked |
| **onNodeMouseEnter** | `(event: MouseEvent, node: Node) => void` | Mouse entered node |
| **onNodeMouseLeave** | `(event: MouseEvent, node: Node) => void` | Mouse left node |
| **onNodeDragStart** | `(event: MouseEvent, node: Node, nodes: Node[]) => void` | Node drag started |
| **onNodeDrag** | `(event: MouseEvent, node: Node, nodes: Node[]) => void` | Node being dragged |
| **onNodeDragStop** | `(event: MouseEvent, node: Node, nodes: Node[]) => void` | Node drag stopped |
| **onNodesChange** | `(changes: NodeChange[]) => void` | Nodes changed |
| **onNodesDelete** | `(nodes: Node[]) => void` | Nodes deleted |

### Edge Events

| Event | Signature | Description |
|-------|-----------|-------------|
| **onEdgeClick** | `(event: MouseEvent, edge: Edge) => void` | Edge clicked |
| **onEdgeDoubleClick** | `(event: MouseEvent, edge: Edge) => void` | Edge double-clicked |
| **onEdgesChange** | `(changes: EdgeChange[]) => void` | Edges changed |
| **onEdgesDelete** | `(edges: Edge[]) => void` | Edges deleted |

### Viewport Events

| Event | Signature | Description |
|-------|-----------|-------------|
| **onMove** | `(event: MouseEvent \| TouchEvent, viewport: Viewport) => void` | Viewport moving |
| **onMoveStart** | `(event: MouseEvent \| TouchEvent, viewport: Viewport) => void` | Viewport move started |
| **onMoveEnd** | `(event: MouseEvent \| TouchEvent, viewport: Viewport) => void` | Viewport move ended |

---

## Utility Functions

### Node/Edge Manipulation

#### addEdge()
Adds a new edge to an array with validation.

```typescript
const onConnect = useCallback(
  (connection) => setEdges((eds) => addEdge(connection, eds)),
  [setEdges]
);
```

#### applyNodeChanges()
Applies node changes from React Flow events.

```typescript
const onNodesChange = useCallback(
  (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
  [setNodes]
);
```

#### applyEdgeChanges()
Applies edge changes from React Flow events.

```typescript
const onEdgesChange = useCallback(
  (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
  [setEdges]
);
```

### Graph Analysis

#### getIncomers()
Gets nodes connected as sources to the given node.

```typescript
const incomers = getIncomers(node, nodes, edges);
```

#### getOutgoers()
Gets nodes connected as targets from the given node.

```typescript
const outgoers = getOutgoers(node, nodes, edges);
```

#### getConnectedEdges()
Gets edges that connect any of the given nodes.

```typescript
const connectedEdges = getConnectedEdges(nodes, edges);
```

### Type Guards

#### isNode()
TypeScript type guard for nodes.

```typescript
if (isNode(element)) {
  // element is typed as Node
}
```

#### isEdge()
TypeScript type guard for edges.

```typescript
if (isEdge(element)) {
  // element is typed as Edge
}
```

### Path Generation Functions

#### getBezierPath()
Generates SVG path for bezier curves.

```typescript
const [path, labelX, labelY, offsetX, offsetY] = getBezierPath({
  sourceX, sourceY, sourcePosition,
  targetX, targetY, targetPosition,
  curvature: 0.25
});
```

#### getSmoothStepPath()
Generates stepped path with rounded corners.

```typescript
const [path, labelX, labelY] = getSmoothStepPath({
  sourceX, sourceY, sourcePosition,
  targetX, targetY, targetPosition,
  borderRadius: 5
});
```

#### getStraightPath()
Generates straight line path.

```typescript
const [path, labelX, labelY] = getStraightPath({
  sourceX, sourceY, targetX, targetY
});
```

---

## Styling and Theming

### CSS Requirements

```javascript
// Required for proper rendering
import '@xyflow/react/dist/style.css';

// Or minimal base styles only
import '@xyflow/react/dist/base.css';
```

### CSS Variables

React Flow provides extensive CSS variables for theming:

```css
.react-flow {
  /* Node styling */
  --xy-node-background-color-default: #fff;
  --xy-node-border-default: 1px solid #1a192b;
  --xy-node-color-default: inherit;
  
  /* Edge styling */
  --xy-edge-stroke-default: #b1b1b7;
  --xy-edge-stroke-width-default: 1;
  --xy-edge-stroke-selected-default: #555;
  
  /* Handle styling */
  --xy-handle-background-color-default: #1a192b;
  --xy-handle-border-color-default: #fff;
  
  /* Controls styling */
  --xy-controls-button-background-color-default: #fefefe;
  --xy-controls-button-border-color-default: #eee;
  
  /* MiniMap styling */
  --xy-minimap-background-color-default: #fff;
  
  /* Background patterns */
  --xy-background-pattern-dots-color-default: #91919a;
  --xy-background-pattern-line-color-default: #eee;
}
```

### CSS Classes

Key CSS classes for custom styling:

- `.react-flow` - Main container
- `.react-flow__node` - All nodes
- `.react-flow__node.selected` - Selected nodes
- `.react-flow__edge` - All edges
- `.react-flow__edge.animated` - Animated edges
- `.react-flow__handle` - Handle elements
- `.react-flow__background` - Background component
- `.react-flow__minimap` - MiniMap component
- `.react-flow__controls` - Controls component

---

## TypeScript Types

### Core Types

```typescript
import type {
  // Basic types
  Node,
  Edge,
  Connection,
  Viewport,
  XYPosition,
  Position,
  
  // Component props
  ReactFlowProps,
  NodeProps,
  EdgeProps,
  
  // Event handlers
  OnConnect,
  OnNodesChange,
  OnEdgesChange,
  OnNodeDrag,
  NodeMouseHandler,
  EdgeMouseHandler,
  
  // Change types
  NodeChange,
  EdgeChange,
  
  // Instance
  ReactFlowInstance,
  
  // Options
  FitViewOptions,
  DefaultEdgeOptions,
  
  // Collections
  NodeTypes,
  EdgeTypes,
} from '@xyflow/react';
```

### Custom Type Patterns

```typescript
// Define custom node types
type NumberNode = Node<{ value: number }, 'number'>;
type TextNode = Node<{ text: string }, 'text'>;
type AppNode = NumberNode | TextNode;

// Define custom edge types
type WeightedEdge = Edge<{ weight: number }, 'weighted'>;
type AppEdge = Edge | WeightedEdge;

// Use with components
const Flow = () => {
  const [nodes, setNodes] = useState<AppNode[]>([]);
  const [edges, setEdges] = useState<AppEdge[]>([]);
  
  return (
    <ReactFlow<AppNode, AppEdge>
      nodes={nodes}
      edges={edges}
    />
  );
};
```

---

## Performance Optimization

### Memoization Best Practices

```typescript
// Memoize components
const CustomNode = memo(({ data }: NodeProps) => {
  return <div>{data.label}</div>;
});

// Define types outside component
const nodeTypes = useMemo(() => ({
  custom: CustomNode,
}), []);

// Memoize event handlers
const onNodeClick = useCallback((event, node) => {
  console.log('Node clicked:', node);
}, []);

// Memoize options objects
const fitViewOptions = useMemo(() => ({
  padding: 0.2,
  includeHiddenNodes: false,
}), []);
```

### Large Graph Handling

1. **Use virtualization** for 1000+ nodes
2. **Simplify styles** - avoid complex shadows, gradients
3. **Hide off-screen elements** with viewport culling
4. **Batch updates** using functional setState
5. **Use `onlyRenderVisibleElements` prop** for extreme cases

### Store Access Patterns

```typescript
// ❌ Bad - causes re-renders on any change
const nodes = useStore(state => state.nodes);

// ✅ Good - specific selector
const nodeCount = useStore(state => state.nodes.length);

// ✅ Good - no re-renders
const store = useStoreApi();
const handleClick = () => {
  const { nodes } = store.getState();
};
```

---

## Common Implementation Patterns

### Basic Controlled Flow

```typescript
import { ReactFlow, useNodesState, useEdgesState, addEdge } from '@xyflow/react';

function BasicFlow() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );
  
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      fitView
    >
      <Background />
      <Controls />
      <MiniMap />
    </ReactFlow>
  );
}
```

### Custom Node Component

```typescript
function CustomNode({ data, selected }: NodeProps) {
  return (
    <div className={`custom-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Left} />
      <div>{data.label}</div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

const nodeTypes = { custom: CustomNode };
```

### Custom Edge Component

```typescript
function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  markerEnd,
}: EdgeProps) {
  const [path] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });
  
  return (
    <BaseEdge
      id={id}
      path={path}
      markerEnd={markerEnd}
    />
  );
}

const edgeTypes = { custom: CustomEdge };
```

### Drag and Drop Implementation

```typescript
const DnDFlow = () => {
  const { screenToFlowPosition } = useReactFlow();
  const [nodes, setNodes] = useState([]);
  
  const onDrop = useCallback((event) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('nodeType');
    
    const position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });
    
    const newNode = {
      id: `${Date.now()}`,
      type,
      position,
      data: { label: `${type} node` },
    };
    
    setNodes((nds) => [...nds, newNode]);
  }, [screenToFlowPosition]);
  
  return (
    <div onDrop={onDrop} onDragOver={(e) => e.preventDefault()}>
      <ReactFlow nodes={nodes} />
    </div>
  );
};
```

---

## State Management Integration

### Zustand Integration

```typescript
import { create } from 'zustand';
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';

const useStore = create((set, get) => ({
  nodes: [],
  edges: [],
  
  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },
  
  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },
  
  onConnect: (connection) => {
    set({
      edges: addEdge(connection, get().edges),
    });
  },
}));

// Usage in component
const { nodes, edges, onNodesChange, onEdgesChange, onConnect } = useStore();
```

### Redux Toolkit Integration

```typescript
import { createSlice } from '@reduxjs/toolkit';

const flowSlice = createSlice({
  name: 'flow',
  initialState: {
    nodes: [],
    edges: [],
  },
  reducers: {
    updateNodes: (state, action) => {
      state.nodes = applyNodeChanges(action.payload, state.nodes);
    },
    updateEdges: (state, action) => {
      state.edges = applyEdgeChanges(action.payload, state.edges);
    },
    connectNodes: (state, action) => {
      state.edges = addEdge(action.payload, state.edges);
    },
  },
});
```

---

## Auto-Layout Algorithms

### Dagre Integration

```typescript
import dagre from 'dagre';

const getLayoutedElements = (nodes, edges, direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction });
  
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, {
      width: node.measured?.width || 172,
      height: node.measured?.height || 36,
    });
  });
  
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });
  
  dagre.layout(dagreGraph);
  
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - (node.measured?.width || 172) / 2,
        y: nodeWithPosition.y - (node.measured?.height || 36) / 2,
      },
    };
  });
  
  return { nodes: layoutedNodes, edges };
};
```

---

## Migration Guide (v11 to v12)

### Package Name Change
```typescript
// v11
import ReactFlow from 'reactflow';

// v12
import { ReactFlow } from '@xyflow/react';
```

### Breaking Changes

1. **Node dimensions**: Use `node.measured.width/height` instead of `node.width/height`
2. **Property renames**:
   - `parentNode` → `parentId`
   - `xPos/yPos` → `positionAbsoluteX/positionAbsoluteY`
   - `onEdgeUpdate` → `onReconnect`
3. **Function renames**:
   - `project()` → `screenToFlowPosition()`
4. **No object mutations**: Always create new objects for updates

### New Features in v12

1. **Dark mode**: Built-in `colorMode` prop
2. **SSR support**: Define node dimensions for server rendering
3. **Computing flows**: New hooks for data flow management
4. **Improved TypeScript**: Better generic support and TSDoc integration

---

## Best Practices Summary

### Performance
- Always memoize components, handlers, and objects
- Use specific store selectors to minimize re-renders
- Implement virtualization for large graphs
- Batch state updates when possible

### State Management
- Use external state management (Zustand/Redux) for complex apps
- Keep node/edge data normalized
- Avoid direct mutations in v12

### Styling
- Import required CSS files
- Use CSS variables for theming
- Minimize complex styles for better performance

### TypeScript
- Define proper union types for custom nodes/edges
- Use generics with hooks and components
- Leverage type guards for runtime checks

### Architecture
- Separate business logic from UI components
- Use custom hooks for reusable functionality
- Implement proper error boundaries
- Design with accessibility in mind

This comprehensive documentation provides a complete reference for React Flow v12, structured for easy parsing and quick reference when developing node-based applications.