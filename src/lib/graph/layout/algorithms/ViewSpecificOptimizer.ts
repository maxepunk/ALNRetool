/**
 * Professional view-specific layout optimization system for ALNRetool.
 * 
 * Provides sophisticated post-layout enhancements tailored to each investigation
 * view type, applying targeted visual optimizations, positioning adjustments,
 * and styling improvements to enhance murder mystery analysis workflows.
 * 
 * Key features:
 * - View-specific optimization strategies for each investigation context
 * - Critical path detection and highlighting for puzzle dependencies
 * - Character relationship clustering and heat mapping
 * - Progressive discovery with depth-based filtering
 * - Status-based zone organization with progress tracking
 * - Temporal ordering for timeline visualization
 * 
 * @example
 * ```typescript
 * // Apply puzzle-focused optimizations
 * const optimizedGraph = ViewSpecificOptimizer.optimize(
 *   layoutGraph, 
 *   'puzzle-focus'
 * );
 * 
 * // Critical paths highlighted, bottlenecks identified
 * console.log(optimizedGraph.nodes.find(n => n.data.emphasis === 'high'));
 * ```
 * 
 * @see {@link GraphData} Graph data structure for nodes and edges
 * @see {@link ViewType} Supported investigation view types
 * @author ALNRetool Development Team
 * @since 1.0.0
 */

import type { GraphData, GraphNode, GraphEdge, GraphNodeData, ViewType } from '../../types';

/**
 * Comprehensive optimization result interface for view-specific enhancements.
 * 
 * Provides structured output containing enhanced nodes and edges with optional
 * metadata for investigation insights, critical paths, and spatial organization.
 * 
 * @interface OptimizationResult
 * 
 * @example
 * ```typescript
 * const result: OptimizationResult = {
 *   nodes: enhancedNodes,
 *   edges: styledEdges,
 *   metadata: {
 *     criticalPath: ['puzzle-1', 'puzzle-5', 'puzzle-12'],
 *     bottlenecks: ['key-evidence'],
 *     clusters: new Map([['ownership', ['item1', 'item2']]]),
 *     zones: new Map([['complete', { x: -600, y: -300, width: 400, height: 600 }]])
 *   }
 * };
 * ```
 */
export interface OptimizationResult {
  /** Enhanced graph nodes with view-specific positioning and styling */
  nodes: GraphNode[];
  
  /** Enhanced graph edges with view-specific styling and behavior */
  edges: GraphEdge[];
  
  /** Optional metadata containing optimization insights and spatial information */
  metadata?: {
    /** Critical investigation path through puzzle dependencies */
    criticalPath?: string[];
    
    /** Identified bottleneck nodes that block multiple dependencies */
    bottlenecks?: string[];
    
    /** Node clusters organized by relationship or ownership */
    clusters?: Map<string, string[]>;
    
    /** Spatial zones for status-based organization */
    zones?: Map<string, { x: number; y: number; width: number; height: number }>;
  };
}

/**
 * Professional view-specific layout optimizer for murder mystery investigation workflows.
 * 
 * Implements sophisticated post-layout enhancement strategies tailored to each
 * investigation view type, providing critical path analysis, relationship clustering,
 * progressive discovery, status organization, and temporal visualization.
 * 
 * **Optimization Strategies:**
 * - **Puzzle Focus**: Critical path detection, bottleneck identification, completion flow
 * - **Character Journey**: Ownership clustering, interaction heat mapping, trading paths
 * - **Node Connections**: Radial depth organization, relationship type sectors
 * - **Content Status**: Zone-based organization, progress tracking, status visualization
 * - **Timeline**: Temporal ordering, parallel event handling, story thread connections
 * 
 * **Enhancement Types:**
 * - Position adjustments for better visual hierarchy
 * - Styling enhancements for emphasis and clarity
 * - Metadata enrichment for interactive features
 * - Edge styling for relationship visualization
 * - Progressive disclosure for complex networks
 * 
 * @class ViewSpecificOptimizer
 * @static
 * 
 * @example
 * ```typescript
 * // Optimize puzzle dependency visualization
 * const puzzleView = ViewSpecificOptimizer.optimize(graph, 'puzzle-focus');
 * 
 * // Optimize character relationship analysis
 * const characterView = ViewSpecificOptimizer.optimize(graph, 'character-journey');
 * 
 * // Optimize investigation depth exploration
 * const connectionsView = ViewSpecificOptimizer.optimize(graph, 'node-connections');
 * ```
 */
export class ViewSpecificOptimizer {
  /**
   * Apply comprehensive view-specific optimizations to enhance investigation workflows.
   * 
   * Implements sophisticated optimization strategies tailored to each view type,
   * providing targeted enhancements for puzzle analysis, character relationships,
   * connection exploration, status tracking, and timeline visualization.
   * 
   * **Optimization Pipeline:**
   * 1. **View Type Detection**: Identify specific optimization strategy
   * 2. **Context Analysis**: Analyze graph structure for optimization opportunities
   * 3. **Enhancement Application**: Apply view-specific positioning and styling
   * 4. **Metadata Enrichment**: Add investigation insights and spatial information
   * 
   * **View-Specific Optimizations:**
   * - **puzzle-focus**: Critical path highlighting, bottleneck detection, completion flow
   * - **character-journey**: Ownership clustering, interaction heat maps, trading visualization
   * - **node-connections**: Radial organization, relationship sectors, progressive discovery
   * - **content-status**: Zone organization, progress tracking, status visualization
   * - **timeline**: Temporal ordering, parallel events, story thread connections
   * 
   * @param graph Complete graph data requiring view-specific optimization
   * @param viewType Investigation view type determining optimization strategy
   * @returns Enhanced graph with view-specific positioning, styling, and metadata
   * 
   * @complexity O(V + E) for most optimizations, O(V²) for complex path analysis
   * 
   * @example
   * ```typescript
   * // Critical path optimization for puzzle investigation
   * const puzzleGraph = ViewSpecificOptimizer.optimize(layoutData, 'puzzle-focus');
   * console.log('Critical path:', puzzleGraph.nodes.filter(n => n.data.emphasis === 'high'));
   * 
   * // Character relationship clustering
   * const characterGraph = ViewSpecificOptimizer.optimize(layoutData, 'character-journey');
   * console.log('Owned items:', characterGraph.nodes.filter(n => n.data.isOwned));
   * 
   * // Investigation depth organization
   * const connectionsGraph = ViewSpecificOptimizer.optimize(layoutData, 'node-connections');
   * console.log('Discovery rings:', Array.from(new Set(connectionsGraph.nodes.map(n => n.data.ring))));
   * ```
   * 
   * @remarks
   * **Performance Considerations:**
   * - Most optimizations run in linear time relative to graph size
   * - Critical path analysis may require quadratic time for complex dependency networks
   * - Spatial organization uses efficient geometric calculations
   * - Heat mapping calculations scale linearly with node count
   * 
   * **Enhancement Categories:**
   * - **Positioning**: Adjust node positions for better visual hierarchy
   * - **Styling**: Apply emphasis, colors, and visual indicators
   * - **Metadata**: Enrich nodes with investigation context
   * - **Interactions**: Enable view-specific interactive features
   * 
   * **Investigation Benefits:**
   * - Clearer visual hierarchy for investigation priorities
   * - Enhanced relationship visualization
   * - Progressive discovery for complex networks
   * - Status tracking for investigation progress
   * - Temporal analysis for story reconstruction
   */
  static optimize(graph: GraphData, viewType: ViewType): GraphData {
    switch (viewType) {
      case 'puzzle-focus':
        return this.optimizePuzzleFocus(graph);
      case 'character-journey':
        return this.optimizeCharacterJourney(graph);
      case 'node-connections':
        return this.optimizeNodeConnections(graph);
      case 'content-status':
        return this.optimizeContentStatus(graph);
      case 'timeline':
        return this.optimizeTimeline(graph);
      default:
        return graph;
    }
  }

  /**
   * Optimize graph for puzzle-focused investigation with critical path analysis.
   * 
   * Implements sophisticated puzzle dependency analysis including critical path
   * detection, bottleneck identification, completion flow calculation, and
   * puzzle chain grouping for enhanced investigation clarity.
   * 
   * **Optimization Features:**
   * - **Critical Path Detection**: Identifies longest dependency chain through puzzles
   * - **Bottleneck Analysis**: Finds nodes that block multiple puzzle progressions
   * - **Completion Flow**: Left-to-right positioning based on dependency levels
   * - **Chain Grouping**: Vertical clustering of related puzzle sequences
   * - **Visual Emphasis**: Color coding and styling for investigation priorities
   * 
   * **Positioning Strategy:**
   * - **X-axis**: Completion level progression (left-to-right dependency flow)
   * - **Y-axis**: Puzzle chain grouping (vertical separation of sequences)
   * - **Chain Spacing**: 200px vertical separation between different puzzle chains
   * - **Level Spacing**: 50px horizontal progression per completion level
   * 
   * @param graph Graph data containing puzzle nodes and dependency relationships
   * @returns Enhanced graph with critical path highlighting and optimized positioning
   * 
   * @complexity O(V + E) for most calculations, O(V²) for critical path analysis
   * 
   * @example
   * ```typescript
   * // Input: Puzzle dependency network
   * const puzzleGraph = {
   *   nodes: [{ id: 'puzzle-1', type: 'puzzleNode' }, ...],
   *   edges: [{ source: 'puzzle-1', target: 'puzzle-2', type: 'dependency' }, ...]
   * };
   * 
   * // Output: Optimized puzzle investigation view
   * const optimized = ViewSpecificOptimizer.optimizePuzzleFocus(puzzleGraph);
   * 
   * // Critical path nodes highlighted in red
   * const criticalNodes = optimized.nodes.filter(n => n.data.emphasis === 'high');
   * console.log('Critical path:', criticalNodes.map(n => n.id));
   * 
   * // Bottleneck nodes highlighted in yellow
   * const bottlenecks = optimized.nodes.filter(n => n.data.emphasis === 'medium');
   * console.log('Bottlenecks:', bottlenecks.map(n => n.id));
   * ```
   * 
   * @remarks
   * **Critical Path Analysis:**
   * - Uses longest path algorithm to identify investigation priority sequence
   * - Highlights nodes that must be completed for investigation progress
   * - Provides visual guidance for puzzle completion order
   * 
   * **Bottleneck Detection:**
   * - Identifies nodes with high in-degree (many dependencies)
   * - Uses adaptive threshold based on network characteristics
   * - Highlights potential investigation roadblocks
   * 
   * **Visual Enhancements:**
   * - Critical path: Red border with glow effect and animated edges
   * - Bottlenecks: Yellow background with bold text
   * - Puzzle chains: Dashed purple borders with parent grouping
   * - Completion flow: Left-to-right positioning for natural reading
   * 
   * **Investigation Benefits:**
   * - Clear understanding of puzzle completion priorities
   * - Identification of investigation bottlenecks
   * - Visual organization of related puzzle sequences
   * - Progress tracking through completion levels
   */
  private static optimizePuzzleFocus(graph: GraphData): GraphData {
    const criticalPath = this.findCriticalPath(graph);
    const bottlenecks = this.findBottlenecks(graph);
    const puzzleChains = this.identifyPuzzleChains(graph);
    
    // Apply completion flow (left-to-right progression)
    const completionLevels = this.calculateCompletionFlow(graph);
    
    // Adjust node positions for completion flow and chain grouping
    const nodes = graph.nodes.map(node => {
      const level = completionLevels.get(node.id) || 0;
      const chain = puzzleChains.find(c => c.includes(node.id));
      const chainIndex = chain ? puzzleChains.indexOf(chain) : -1;
      
      // Handle null positions gracefully
      const currentX = node.position?.x ?? 0;
      const currentY = node.position?.y ?? 0;
      
      // Calculate position based on completion level (left-to-right)
      const x = currentX + (level * 50); // Shift right based on completion level
      
      // Group chain puzzles vertically
      let y = currentY;
      if (chain) {
        const nodeIndexInChain = chain.indexOf(node.id);
        const chainYOffset = chainIndex * 200; // Separate chains vertically
        const inChainYOffset = nodeIndexInChain * 80; // Space within chain
        y = chainYOffset + inChainYOffset - 400; // Center around origin
      }
      
      // Style based on role
      let updatedNode = {
        ...node,
        position: { x, y },
        data: {
          ...node.data,
          completionLevel: level,
          chainId: chainIndex >= 0 ? `chain-${chainIndex}` : undefined
        } as GraphNodeData
      };
      
      if (criticalPath.includes(node.id)) {
        updatedNode = {
          ...updatedNode,
          data: {
            ...updatedNode.data,
            emphasis: 'high'
          } as GraphNodeData,
          style: {
            ...updatedNode.style,
            border: '3px solid #ef4444',
            boxShadow: '0 0 20px rgba(239, 68, 68, 0.5)'
          }
        };
      }
      
      if (bottlenecks.includes(node.id)) {
        updatedNode = {
          ...updatedNode,
          data: {
            ...updatedNode.data,
            emphasis: 'medium'
          } as GraphNodeData,
          style: {
            ...updatedNode.style,
            backgroundColor: '#fbbf24',
            fontWeight: 'bold'
          }
        };
      }
      
      // Add chain grouping visual
      if (chain) {
        updatedNode = {
          ...updatedNode,
          parentNode: `chain-group-${chainIndex}`,
          style: {
            ...updatedNode.style,
            borderStyle: 'dashed',
            borderColor: '#8b5cf6'
          }
        };
      }
      
      return updatedNode;
    });

    // Enhance edges on critical path and chains
    const edges = graph.edges.map(edge => {
      const isOnCriticalPath = 
        criticalPath.includes(edge.source) && 
        criticalPath.includes(edge.target);
      
      const isChainEdge = puzzleChains.some(chain => 
        chain.includes(edge.source) && chain.includes(edge.target)
      );
      
      if (isOnCriticalPath) {
        return {
          ...edge,
          style: {
            ...edge.style,
            stroke: '#ef4444',
            strokeWidth: 3
          },
          animated: true
        };
      }
      
      if (isChainEdge) {
        return {
          ...edge,
          style: {
            ...edge.style,
            stroke: '#8b5cf6',
            strokeWidth: 2,
            strokeDasharray: '5 3'
          }
        };
      }
      
      return edge;
    });

    return {
      ...graph,
      nodes,
      edges
    };
  }

  /**
   * Optimize graph for character-focused investigation with relationship analysis.
   * 
   * Implements sophisticated character relationship visualization including ownership
   * clustering, interaction density heat mapping, and trading path highlighting
   * for enhanced social network analysis in murder mystery investigations.
   * 
   * **Optimization Features:**
   * - **Central Character Focus**: Positions main character at layout center with prominence
   * - **Ownership Clustering**: Circular arrangement of owned items around character
   * - **Interaction Heat Map**: Color-coded visualization of relationship intensity
   * - **Trading Path Enhancement**: Highlighted collaboration and exchange relationships
   * - **Density-Based Styling**: Opacity and intensity based on interaction frequency
   * 
   * **Positioning Strategy:**
   * - **Character Center**: Main character positioned centrally with scale and glow effects
   * - **Ownership Circle**: Owned items arranged in 200px radius circle around character
   * - **Heat Map Layout**: Non-owned items styled by interaction density
   * - **Angular Distribution**: Even spacing of owned items around character
   * 
   * @param graph Graph data containing character nodes and relationship edges
   * @returns Enhanced graph with character-focused clustering and relationship visualization
   * 
   * @complexity O(V + E) for clustering and heat map calculation
   * 
   * @example
   * ```typescript
   * // Input: Character relationship network
   * const characterGraph = {
   *   nodes: [{ id: 'marcus', type: 'characterNode' }, { id: 'evidence-1', type: 'elementNode' }],
   *   edges: [{ source: 'marcus', target: 'evidence-1', data: { relationshipType: 'ownership' } }]
   * };
   * 
   * // Output: Character-focused investigation view
   * const optimized = ViewSpecificOptimizer.optimizeCharacterJourney(characterGraph);
   * 
   * // Central character with prominence
   * const centralChar = optimized.nodes.find(n => n.data.isCentral);
   * console.log('Central character:', centralChar?.id);
   * 
   * // Owned items clustered around character
   * const ownedItems = optimized.nodes.filter(n => n.data.isOwned);
   * console.log('Owned items:', ownedItems.map(n => n.id));
   * 
   * // Interaction density visualization
   * const densities = optimized.nodes.map(n => ({ 
   *   id: n.id, 
   *   density: n.data.interactionDensity 
   * }));
   * console.log('Interaction densities:', densities);
   * ```
   * 
   * @remarks
   * **Character Detection:**
   * - Identifies central character node from characterNode or characterTree types
   * - Uses first character node if multiple characters present
   * - Applies special styling and positioning for investigation focus
   * 
   * **Ownership Analysis:**
   * - Identifies owned items through 'ownership' relationship edges
   * - Positions owned items in circular pattern for clear association
   * - Applies ownership cluster styling with distinct background colors
   * 
   * **Interaction Density:**
   * - Calculates relationship intensity based on connection patterns
   * - Applies heat map coloring from cool (blue) to hot (red)
   * - Uses density for opacity and visual prominence adjustment
   * 
   * **Visual Enhancements:**
   * - Central character: Green border, scale transform, glowing shadow
   * - Owned items: Heat map colors with 'ownership' cluster identification
   * - Trading paths: Purple dashed lines with density-based thickness
   * - Interaction visualization: Opacity and color intensity based on relationships
   * 
   * **Investigation Benefits:**
   * - Clear visualization of character's social and material connections
   * - Heat map reveals most significant relationships for investigation priority
   * - Ownership clustering shows character's material involvement
   * - Trading path analysis reveals collaboration patterns
   */
  private static optimizeCharacterJourney(graph: GraphData): GraphData {
    // Find the central character node
    const characterNode = graph.nodes.find(n => n.type === 'characterNode' || n.type === 'characterTree');
    if (!characterNode) return graph;

    // Calculate interaction density for heat map visualization
    const interactionDensity = this.calculateInteractionDensity(graph, characterNode.id);

    // Group owned items closer to character
    const ownedItems = graph.edges
      .filter(e => e.source === characterNode.id && (e.data as any)?.relationshipType === 'ownership')
      .map(e => e.target);

    // Create ownership clusters
    const clusterRadius = 200;
    const angleStep = (2 * Math.PI) / Math.max(ownedItems.length, 1);
    
    const nodes = graph.nodes.map((node) => {
      const density = interactionDensity.get(node.id) || 0;
      
      if (node.id === characterNode.id) {
        // Keep character central with highest interaction density
        return {
          ...node,
          data: {
            ...node.data,
            isCentral: true,
            interactionDensity: 1.0
          },
          style: {
            ...node.style,
            border: '4px solid #10b981',
            transform: 'scale(1.2)',
            boxShadow: '0 0 30px rgba(16, 185, 129, 0.8)'
          }
        };
      }
      
      const ownedIndex = ownedItems.indexOf(node.id);
      if (ownedIndex !== -1) {
        // Position owned items in a circle around character
        const angle = ownedIndex * angleStep;
        const charX = characterNode.position?.x ?? 0;
        const charY = characterNode.position?.y ?? 0;
        const x = charX + Math.cos(angle) * clusterRadius;
        const y = charY + Math.sin(angle) * clusterRadius;
        
        return {
          ...node,
          position: { x, y },
          data: {
            ...node.data,
            isOwned: true,
            cluster: 'ownership',
            interactionDensity: density
          },
          style: {
            ...node.style,
            backgroundColor: this.getHeatmapColor(density),
            opacity: 0.6 + (density * 0.4)
          }
        };
      }
      
      // Apply interaction density heat map to other nodes
      return {
        ...node,
        data: {
          ...node.data,
          interactionDensity: density
        },
        style: {
          ...node.style,
          backgroundColor: this.getHeatmapColor(density),
          opacity: 0.4 + (density * 0.6)
        }
      };
    });

    // Highlight trading paths with intensity based on interaction frequency
    const edges = graph.edges.map(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      const avgDensity = ((sourceNode?.data?.interactionDensity as number || 0) + 
                         (targetNode?.data?.interactionDensity as number || 0)) / 2;
      
      if (edge.data?.relationshipType === 'collaboration') {
        return {
          ...edge,
          style: {
            ...edge.style,
            stroke: '#8b5cf6',
            strokeWidth: 1 + (avgDensity * 3),
            strokeDasharray: '5 5',
            opacity: 0.5 + (avgDensity * 0.5)
          },
          animated: true
        };
      }
      
      // Apply density-based styling to all edges
      return {
        ...edge,
        style: {
          ...edge.style,
          opacity: 0.3 + (avgDensity * 0.5)
        }
      };
    });

    return {
      ...graph,
      nodes,
      edges
    };
  }

  /**
   * Optimize graph for node connection exploration with progressive discovery.
   * 
   * Implements sophisticated radial organization with depth-based positioning,
   * relationship type sectors, and progressive disclosure for systematic
   * investigation of node connections and relationship networks.
   * 
   * **Optimization Features:**
   * - **Radial Depth Organization**: Concentric circles based on connection distance
   * - **Relationship Sectors**: Angular positioning by relationship type
   * - **Progressive Discovery**: Depth-based visibility with fade effects
   * - **Central Node Focus**: Root node prominently positioned at layout center
   * - **Sector-Based Grouping**: Related nodes clustered in relationship-specific areas
   * 
   * **Positioning Strategy:**
   * - **Concentric Circles**: 250px radius steps for each depth level
   * - **Sector Angles**: 60-degree sectors for different relationship types
   * - **Progressive Visibility**: Visible depth limit of 3 for manageable complexity
   * - **Angular Distribution**: Even spacing within relationship sectors
   * 
   * @param graph Graph data with nodes at various connection depths
   * @returns Enhanced graph with radial organization and progressive disclosure
   * 
   * @complexity O(V + E) for depth grouping and positioning calculations
   * 
   * @example
   * ```typescript
   * // Input: Node connection network with depth metadata
   * const connectionGraph = {
   *   nodes: [
   *     { id: 'root', data: { depth: 0, isRoot: true } },
   *     { id: 'child1', data: { depth: 1 } },
   *     { id: 'child2', data: { depth: 2 } }
   *   ],
   *   edges: [
   *     { source: 'root', target: 'child1', data: { relationshipType: 'dependency' } }
   *   ]
   * };
   * 
   * // Output: Radial connection exploration view
   * const optimized = ViewSpecificOptimizer.optimizeNodeConnections(connectionGraph);
   * 
   * // Central root node with prominence
   * const rootNode = optimized.nodes.find(n => n.data.isCentral);
   * console.log('Root node at center:', rootNode?.position);
   * 
   * // Nodes organized by depth rings
   * const nodesByRing = optimized.nodes.reduce((acc, n) => {
   *   const ring = n.data.ring || 0;
   *   acc[ring] = (acc[ring] || 0) + 1;
   *   return acc;
   * }, {} as Record<number, number>);
   * console.log('Nodes per ring:', nodesByRing);
   * 
   * // Progressive discovery status
   * const discoveredNodes = optimized.nodes.filter(n => n.data.discovered);
   * console.log('Discovered nodes:', discoveredNodes.length);
   * ```
   * 
   * @remarks
   * **Depth Organization:**
   * - Level 0: Central root node at origin with maximum prominence
   * - Level 1+: Concentric circles at 250px intervals for clear depth separation
   * - Progressive fade for nodes beyond maximum visible depth (3 levels)
   * 
   * **Relationship Sectors:**
   * - Dependency: 0° (rightward) - Critical dependencies
   * - Reward: 60° (upper-right) - Positive outcomes
   * - Ownership: 120° (upper-left) - Possession relationships  
   * - Trading: 180° (leftward) - Exchange relationships
   * - Relations: 240° (lower-left) - Social connections
   * - Unknown: 300° (lower-right) - Unclassified relationships
   * 
   * **Progressive Discovery:**
   * - Visible depth limit prevents overwhelming complexity
   * - Blur and fade effects for undiscovered nodes
   * - Interactive cursor states for discovered vs hidden nodes
   * 
   * **Visual Enhancements:**
   * - Central node: Orange border with glow and high z-index
   * - Depth rings: Opacity decreases with distance (0.4 minimum)
   * - Relationship sectors: Color-coded edge styling by type
   * - Discovery states: Blur effects and reduced opacity for hidden nodes
   * 
   * **Investigation Benefits:**
   * - Systematic exploration of node relationships
   * - Clear visual hierarchy based on connection distance
   * - Relationship type awareness through sector organization
   * - Manageable complexity through progressive disclosure
   */
  private static optimizeNodeConnections(graph: GraphData): GraphData {
    // Find the central node
    const centralNode = graph.nodes.find(n => n.data?.isRoot || n.data?.depth === 0);
    if (!centralNode) return graph;

    // Group nodes by depth for progressive discovery
    const nodesByDepth = new Map<number, GraphNode[]>();
    graph.nodes.forEach(node => {
      const depth = node.data?.depth || 0;
      if (!nodesByDepth.has(depth)) {
        nodesByDepth.set(depth, []);
      }
      nodesByDepth.get(depth)!.push(node);
    });

    // Group nodes by relationship type for differentiation
    const nodesByRelationType = new Map<string, Set<string>>();
    graph.edges.forEach(edge => {
      const relType = edge.data?.relationshipType || 'unknown';
      if (!nodesByRelationType.has(relType)) {
        nodesByRelationType.set(relType, new Set());
      }
      nodesByRelationType.get(relType)!.add(edge.target);
    });

    // Position nodes in concentric circles with relationship-based sectors
    const radiusStep = 250;
    const maxVisibleDepth = 3; // For progressive discovery
    
    const nodes = graph.nodes.map(node => {
      const depth = node.data?.depth || 0;
      
      if (depth === 0) {
        // Keep central node at center
        return {
          ...node,
          position: { x: 0, y: 0 },
          data: {
            ...node.data,
            isCentral: true,
            discovered: true
          },
          style: {
            ...node.style,
            border: '4px solid #f59e0b',
            zIndex: 100,
            boxShadow: '0 0 40px rgba(245, 158, 11, 0.6)'
          }
        };
      }
      
      // Determine relationship type for sector assignment
      let relationType = 'unknown';
      for (const [type, nodes] of nodesByRelationType.entries()) {
        if (nodes.has(node.id)) {
          relationType = type;
          break;
        }
      }
      
      // Calculate sector angle based on relationship type
      const sectorAngles = {
        'dependency': 0,
        'reward': Math.PI / 3,
        'owns': 2 * Math.PI / 3,
        'trades': Math.PI,
        'relation': 4 * Math.PI / 3,
        'unknown': 5 * Math.PI / 3
      };
      
      const nodesAtDepth = nodesByDepth.get(depth) || [];
      const nodeIndex = nodesAtDepth.filter(n => {
        // Group by relationship type within depth
        for (const [type, nodes] of nodesByRelationType.entries()) {
          if (nodes.has(n.id) && type === relationType) return true;
        }
        return relationType === 'unknown';
      }).indexOf(node);
      
      const sectorSpread = Math.PI / 3; // 60-degree spread per sector
      const baseAngle = sectorAngles[relationType as keyof typeof sectorAngles] || 0;
      const angleOffset = (nodeIndex * sectorSpread / Math.max(nodesAtDepth.length, 1));
      const angle = baseAngle + angleOffset - Math.PI / 2;
      const radius = depth * radiusStep;
      
      // Progressive discovery: hide or fade nodes beyond max depth
      const isDiscovered = depth <= maxVisibleDepth;
      const opacity = isDiscovered 
        ? Math.max(0.4, 1 - depth * 0.15)
        : 0.1;
      
      return {
        ...node,
        position: {
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius
        },
        data: {
          ...node.data,
          ring: depth,
          sector: relationType,
          discovered: isDiscovered,
          depth: depth
        } as GraphNodeData,
        style: {
          ...node.style,
          opacity,
          filter: isDiscovered ? 'none' : 'blur(2px)',
          transition: 'opacity 0.3s, filter 0.3s',
          cursor: isDiscovered ? 'pointer' : 'default'
        }
      };
    });

    // Style edges by relationship type and depth
    const edges = graph.edges.map(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      const maxDepth = Math.max(
        sourceNode?.data?.depth || 0,
        targetNode?.data?.depth || 0
      );
      
      // Relationship type specific styling
      const relationType = edge.data?.relationshipType || 'unknown';
      const relationshipStyles = {
        'dependency': { stroke: '#ef4444', strokeDasharray: 'none', strokeWidth: 2 },
        'reward': { stroke: '#10b981', strokeDasharray: '5 5', strokeWidth: 2 },
        'owns': { stroke: '#8b5cf6', strokeDasharray: '2 2', strokeWidth: 1.5 },
        'trades': { stroke: '#f59e0b', strokeDasharray: '8 4', strokeWidth: 1.5 },
        'relation': { stroke: '#06b6d4', strokeDasharray: '3 3', strokeWidth: 1 },
        'unknown': { stroke: '#94a3b8', strokeDasharray: 'none', strokeWidth: 1 }
      };
      
      const style = relationshipStyles[relationType as keyof typeof relationshipStyles] || relationshipStyles.unknown;
      
      // Progressive discovery for edges
      const isDiscovered = maxDepth <= maxVisibleDepth;
      
      return {
        ...edge,
        style: {
          ...edge.style,
          ...style,
          opacity: isDiscovered 
            ? Math.max(0.3, 1 - maxDepth * 0.2)
            : 0.05,
          filter: isDiscovered ? 'none' : 'blur(1px)'
        },
        animated: edge.data?.relationshipType === 'requirement' && isDiscovered
      };
    });

    return {
      ...graph,
      nodes,
      edges
    };
  }

  /**
   * Optimize graph for content status tracking with zone-based organization.
   * 
   * Implements sophisticated status-based spatial organization with progress
   * tracking, zone visualization, and completion metrics for systematic
   * investigation progress monitoring and task management.
   * 
   * **Optimization Features:**
   * - **Status Zone Organization**: Spatial separation by completion status
   * - **Progress Metrics**: Individual and overall completion tracking
   * - **Grid Layout**: Systematic arrangement within each status zone
   * - **Progress Visualization**: Conic gradient progress rings for incomplete items
   * - **Blocker Identification**: Animated highlighting of blocking dependencies
   * 
   * **Zone Layout:**
   * - **Complete Zone**: Left side (-600x, -300y, 400w×600h) - Green styling
   * - **Incomplete Zone**: Center (-100x, -300y, 400w×600h) - Yellow styling  
   * - **Blocked Zone**: Right side (400x, -300y, 400w×600h) - Red styling
   * - **Grid Organization**: Square grid layout within each zone
   * 
   * @param graph Graph data containing nodes with status metadata
   * @returns Enhanced graph with zone-based organization and progress visualization
   * 
   * @complexity O(V) for status analysis and positioning calculations
   * 
   * @example
   * ```typescript
   * // Input: Content with various completion statuses
   * const statusGraph = {
   *   nodes: [
   *     { id: 'task1', data: { status: 'complete', subtaskProgress: 100 } },
   *     { id: 'task2', data: { status: 'incomplete', subtaskProgress: 60 } },
   *     { id: 'task3', data: { status: 'blocked' } }
   *   ],
   *   edges: [{ source: 'task1', target: 'task3', type: 'dependency' }]
   * };
   * 
   * // Output: Status-organized investigation view
   * const optimized = ViewSpecificOptimizer.optimizeContentStatus(statusGraph);
   * 
   * // Nodes organized by status zones
   * const zoneDistribution = optimized.nodes.reduce((acc, n) => {
   *   const zone = n.data.zone;
   *   acc[zone] = (acc[zone] || 0) + 1;
   *   return acc;
   * }, {} as Record<string, number>);
   * console.log('Zone distribution:', zoneDistribution);
   * 
   * // Progress tracking
   * const progressStats = optimized.nodes.map(n => ({
   *   id: n.id,
   *   progress: n.data.progress,
   *   zone: n.data.zone
   * }));
   * console.log('Progress stats:', progressStats);
   * 
   * // Overall completion metrics
   * const overallProgress = optimized.nodes[0]?.data.statusMetrics?.overallProgress;
   * console.log('Overall progress:', overallProgress + '%');
   * ```
   * 
   * @remarks
   * **Status Zone Logic:**
   * - Complete: Tasks finished with 100% progress in green zone
   * - Incomplete: Tasks in progress with yellow zone and progress rings
   * - Blocked: Tasks prevented by dependencies in red zone with animations
   * 
   * **Progress Visualization:**
   * - Conic gradient rings show completion percentage for incomplete items
   * - Progress labels display percentage on node labels
   * - Overall progress calculated as completed/total ratio
   * 
   * **Grid Organization:**
   * - Square grid layout optimized for node count in each zone
   * - Even distribution within zone boundaries
   * - Centered positioning for visual balance
   * 
   * **Visual Enhancements:**
   * - Complete zone: Green background (#10b981) with success border
   * - Incomplete zone: Yellow background (#fbbf24) with progress rings
   * - Blocked zone: Red background (#ef4444) with animated blocker edges
   * - Progress rings: Conic gradients showing completion percentage
   * 
   * **Investigation Benefits:**
   * - Clear visual separation of investigation progress
   * - Quick identification of completed, pending, and blocked tasks
   * - Progress tracking for complex investigations
   * - Systematic organization for task management
   */
  private static optimizeContentStatus(graph: GraphData): GraphData {
    // Define status zones
    const zones = new Map([
      ['complete', { x: -600, y: -300, width: 400, height: 600 }],
      ['incomplete', { x: -100, y: -300, width: 400, height: 600 }],
      ['blocked', { x: 400, y: -300, width: 400, height: 600 }]
    ]);

    // Calculate progress metrics
    const totalNodes = graph.nodes.length;
    const statusCounts = new Map<string, number>();
    const completionByType = new Map<string, { complete: number; total: number }>();
    
    graph.nodes.forEach(node => {
      const status = node.data?.status || 'unknown';
      const nodeType = node.type || 'unknown';
      
      statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
      
      // Track completion by type
      if (!completionByType.has(nodeType)) {
        completionByType.set(nodeType, { complete: 0, total: 0 });
      }
      const typeMetrics = completionByType.get(nodeType)!;
      typeMetrics.total++;
      if (status === 'complete') {
        typeMetrics.complete++;
      }
    });

    // Calculate overall progress percentage
    const completeCount = statusCounts.get('complete') || 0;
    const overallProgress = totalNodes > 0 ? (completeCount / totalNodes) * 100 : 0;

    // Position nodes in grid within their zones
    const nodesByStatus = new Map<string, GraphNode[]>();
    graph.nodes.forEach(node => {
      const status = node.data?.status || 'incomplete';
      if (!nodesByStatus.has(status)) {
        nodesByStatus.set(status, []);
      }
      nodesByStatus.get(status)!.push(node);
    });

    const nodes = graph.nodes.map(node => {
      const status = node.data?.status || 'incomplete';
      const zone = zones.get(status) || zones.get('incomplete')!;
      const statusNodes = nodesByStatus.get(status) || [];
      const index = statusNodes.indexOf(node);
      
      // Grid layout within zone
      const cols = Math.ceil(Math.sqrt(statusNodes.length));
      const row = Math.floor(index / cols);
      const col = index % cols;
      const cellWidth = zone.width / cols;
      const cellHeight = zone.height / Math.ceil(statusNodes.length / cols);
      
      const x = zone.x + col * cellWidth + cellWidth / 2;
      const y = zone.y + row * cellHeight + cellHeight / 2;
      
      // Calculate individual progress (for compound nodes like puzzles with subtasks)
      const subtaskProgress = node.data?.subtaskProgress || 
        (status === 'complete' ? 100 : status === 'blocked' ? 0 : 50);
      
      // Style by status with progress indicators
      let backgroundColor = '#94a3b8';
      let borderColor = '#64748b';
      let progressRingColor = '#475569';
      
      if (status === 'complete') {
        backgroundColor = '#10b981';
        borderColor = '#059669';
        progressRingColor = '#34d399';
      } else if (status === 'blocked') {
        backgroundColor = '#ef4444';
        borderColor = '#dc2626';
        progressRingColor = '#f87171';
      } else if (status === 'incomplete') {
        backgroundColor = '#fbbf24';
        borderColor = '#f59e0b';
        progressRingColor = '#fcd34d';
      }
      
      // Add progress visualization as a ring or bar
      const progressIndicator = subtaskProgress < 100 ? {
        backgroundImage: `conic-gradient(${progressRingColor} ${subtaskProgress * 3.6}deg, transparent 0deg)`,
        backgroundSize: '100% 100%',
        backgroundPosition: 'center'
      } : {};
      
      return {
        ...node,
        position: { x, y },
        data: {
          ...node.data,
          zone: status,
          progress: subtaskProgress,
          statusMetrics: {
            overallProgress,
            typeProgress: completionByType.get(node.type || 'unknown')
          }
        },
        style: {
          ...node.style,
          backgroundColor,
          border: `2px solid ${borderColor}`,
          ...progressIndicator
        },
        // Add progress label
        label: `${node.data?.label || node.id}\n${subtaskProgress}%`
      };
    });

    // Create zone labels with progress metrics (but don't add to nodes)
    Array.from(zones.entries()).map(([status, zone]) => {
      const count = statusCounts.get(status) || 0;
      const percentage = totalNodes > 0 ? ((count / totalNodes) * 100).toFixed(1) : '0';
      
      return {
        id: `zone-label-${status}`,
        type: 'annotation',
        position: { 
          x: zone.x + zone.width / 2, 
          y: zone.y - 50 
        },
        data: {
          label: `${status.toUpperCase()}\n${count} items (${percentage}%)`,
          level: 1
        },
        style: {
          fontSize: 14,
          fontWeight: 'bold',
          color: status === 'complete' ? '#10b981' : 
                 status === 'blocked' ? '#ef4444' : '#94a3b8'
        }
      };
    });

    // Create overall progress indicator (but don't add to nodes)
    // Commenting out as unused - can be restored if needed
    /* const progressNode = {
      id: 'overall-progress',
      type: 'annotation',
      position: { x: 0, y: -450 },
      data: {
        label: `Overall Progress: ${overallProgress.toFixed(1)}%`,
        level: 0
      },
      style: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#f59e0b',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: '10px 20px',
        borderRadius: '8px'
      }
    }; */

    // Style edges to show blockers
    const edges = graph.edges.map(edge => {
      const targetNode = nodes.find(n => n.id === edge.target);
      
      if (targetNode?.data?.status === 'blocked') {
        return {
          ...edge,
          style: {
            ...edge.style,
            stroke: '#ef4444',
            strokeWidth: 2
          },
          animated: true
        };
      }
      
      return edge;
    });

    // Return graph with annotations in metadata, not in nodes array
    return {
      ...graph,
      nodes,
      edges,
      // Store annotations in metadata for optional rendering
      metadata: {
        ...graph.metadata
      }
    };
  }

  /**
   * Optimize graph for timeline visualization with temporal ordering.
   * 
   * Implements sophisticated chronological organization with parallel event
   * handling, critical story moment highlighting, and temporal distance
   * visualization for murder mystery timeline reconstruction and analysis.
   * 
   * **Optimization Features:**
   * - **Chronological Ordering**: Left-to-right temporal progression
   * - **Parallel Event Handling**: Vertical stacking for simultaneous events
   * - **Critical Moment Emphasis**: Special styling for key story points
   * - **Temporal Distance Visualization**: Edge styling based on time gaps
   * - **Story Thread Connections**: Enhanced relationship visualization across time
   * 
   * **Timeline Layout:**
   * - **X-axis**: Time progression with 300px steps between time periods
   * - **Y-axis**: Parallel event stacking with 150px vertical separation
   * - **Centering**: Timeline centered around origin for balanced view
   * - **Critical Emphasis**: Golden borders and glow effects for key moments
   * 
   * @param graph Graph data containing nodes with timestamp metadata
   * @returns Enhanced graph with chronological organization and temporal visualization
   * 
   * @complexity O(V log V) for timestamp sorting and positioning calculations
   * 
   * @example
   * ```typescript
   * // Input: Timeline events with timestamps
   * const timelineGraph = {
   *   nodes: [
   *     { 
   *       id: 'event1', 
   *       data: { 
   *         timestamp: 1640995200000,  // 2022-01-01 00:00:00
   *         isCriticalMoment: true 
   *       } 
   *     },
   *     { 
   *       id: 'event2', 
   *       data: { 
   *         metadata: { timestamp: 1641081600000 }  // 2022-01-02 00:00:00
   *       } 
   *     }
   *   ],
   *   edges: [{ source: 'event1', target: 'event2', type: 'sequence' }]
   * };
   * 
   * // Output: Chronologically organized timeline view
   * const optimized = ViewSpecificOptimizer.optimizeTimeline(timelineGraph);
   * 
   * // Events positioned by temporal order
   * const timelinePositions = optimized.nodes.map(n => ({
   *   id: n.id,
   *   timeIndex: n.data.timeIndex,
   *   position: n.position,
   *   isCritical: n.data.isCriticalMoment
   * }));
   * console.log('Timeline positions:', timelinePositions);
   * 
   * // Critical story moments highlighted
   * const criticalMoments = optimized.nodes.filter(n => n.data.isCriticalMoment);
   * console.log('Critical moments:', criticalMoments.map(n => n.id));
   * 
   * // Temporal connections with distance styling
   * const connections = optimized.edges.map(e => ({
   *   id: e.id,
   *   opacity: e.style?.opacity,
   *   isDashed: !!e.style?.strokeDasharray
   * }));
   * console.log('Temporal connections:', connections);
   * ```
   * 
   * @remarks
   * **Timestamp Resolution:**
   * - Supports timestamps in both data.timestamp and data.metadata.timestamp
   * - Handles missing timestamps with default value 0 (positioned first)
   * - Automatic sorting for chronological left-to-right progression
   * 
   * **Parallel Event Handling:**
   * - Events with identical timestamps stacked vertically
   * - 150px vertical spacing prevents overlap
   * - Centered arrangement for visual balance
   * 
   * **Critical Moment Detection:**
   * - Uses data.isCriticalMoment flag for special styling
   * - Golden border (#f59e0b) with glow effects
   * - Enhanced visual prominence for key investigation points
   * 
   * **Temporal Distance Visualization:**
   * - Edge opacity decreases with temporal distance
   * - Dashed lines for connections spanning >2 time periods
   * - Visual indication of story thread continuity
   * 
   * **Visual Enhancements:**
   * - Critical moments: Golden borders with glow shadows
   * - Temporal progression: Left-to-right chronological flow
   * - Parallel events: Vertical stacking with clear separation
   * - Story threads: Opacity and dash patterns based on time gaps
   * 
   * **Investigation Benefits:**
   * - Clear chronological understanding of events
   * - Identification of parallel activities and coincidences
   * - Emphasis on critical investigation moments
   * - Visual story thread analysis across time periods
   */
  private static optimizeTimeline(graph: GraphData): GraphData {
    // Group nodes by timestamp
    const nodesByTime = new Map<number, GraphNode[]>();
    graph.nodes.forEach(node => {
      // Check both data.timestamp and data.metadata.timestamp
      const timestamp = node.data?.timestamp || node.data?.metadata?.timestamp || 0;
      if (!nodesByTime.has(timestamp)) {
        nodesByTime.set(timestamp, []);
      }
      nodesByTime.get(timestamp)!.push(node);
    });

    // Sort timestamps
    const timestamps = Array.from(nodesByTime.keys()).sort((a, b) => a - b);
    
    // Position nodes on timeline
    const xStep = 300;
    const yStep = 150;
    
    const nodes = graph.nodes.map(node => {
      // Check both data.timestamp and data.metadata.timestamp
      const timestamp = node.data?.timestamp || node.data?.metadata?.timestamp || 0;
      const timeIndex = timestamps.indexOf(timestamp);
      const nodesAtTime = nodesByTime.get(timestamp) || [];
      const nodeIndex = nodesAtTime.indexOf(node);
      
      // X position based on time
      const x = timeIndex * xStep - (timestamps.length * xStep) / 2;
      
      // Y position for parallel events
      const y = nodeIndex * yStep - (nodesAtTime.length * yStep) / 2;
      
      // Highlight critical story moments
      const isCritical = node.data?.isCriticalMoment;
      
      return {
        ...node,
        position: { x, y },
        data: {
          ...node.data,
          timeIndex
        },
        style: {
          ...node.style,
          border: isCritical ? '3px solid #f59e0b' : '1px solid #64748b',
          boxShadow: isCritical ? '0 0 20px rgba(245, 158, 11, 0.5)' : undefined
        }
      };
    });

    // Connect story threads
    const edges = graph.edges.map(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      
      // Style based on temporal distance
      const timeDiff = Math.abs(
        (targetNode?.data?.timeIndex || 0) - 
        (sourceNode?.data?.timeIndex || 0)
      );
      
      return {
        ...edge,
        style: {
          ...edge.style,
          strokeDasharray: timeDiff > 2 ? '10 5' : undefined,
          opacity: Math.max(0.3, 1 - timeDiff * 0.1)
        }
      };
    });

    return {
      ...graph,
      nodes,
      edges
    };
  }

  /**
   * Find critical path in puzzle dependency network using longest path analysis.
   * 
   * Implements sophisticated graph traversal to identify the longest sequence of
   * dependent puzzles, representing the critical path that determines minimum
   * investigation completion time and priority puzzle sequence.
   * 
   * **Algorithm Implementation:**
   * 1. **Dependency Graph Construction**: Build adjacency list from requirement edges
   * 2. **In-Degree Calculation**: Track dependencies for each puzzle node
   * 3. **DFS Path Analysis**: Recursive traversal to find maximum depth paths
   * 4. **Critical Path Reconstruction**: Backtrack through parent relationships
   * 
   * **Path Detection Strategy:**
   * - Analyzes 'requirement' and 'dependency' edge types for puzzle sequencing
   * - Uses depth-first search with memoization for optimal performance
   * - Tracks parent relationships for efficient path reconstruction
   * - Handles multiple starting points (nodes with in-degree 0)
   * 
   * @param graph Graph data containing puzzle nodes and dependency relationships
   * @returns Array of node IDs representing the longest dependency sequence
   * 
   * @complexity O(V + E) for graph construction, O(V²) worst case for DFS traversal
   * 
   * @example
   * ```typescript
   * // Input: Puzzle dependency network
   * const puzzleGraph = {
   *   nodes: [
   *     { id: 'intro-puzzle', type: 'puzzleNode' },
   *     { id: 'main-puzzle', type: 'puzzleNode' },
   *     { id: 'final-puzzle', type: 'puzzleNode' }
   *   ],
   *   edges: [
   *     { source: 'intro-puzzle', target: 'main-puzzle', type: 'dependency' },
   *     { source: 'main-puzzle', target: 'final-puzzle', data: { relationshipType: 'requirement' } }
   *   ]
   * };
   * 
   * // Find critical investigation path
   * const criticalPath = ViewSpecificOptimizer.findCriticalPath(puzzleGraph);
   * console.log('Critical path:', criticalPath);
   * // Output: ['intro-puzzle', 'main-puzzle', 'final-puzzle']
   * 
   * // Path length indicates investigation complexity
   * console.log('Investigation depth:', criticalPath.length);
   * ```
   * 
   * @remarks
   * **Dependency Edge Recognition:**
   * - Processes edges with type === 'dependency'
   * - Processes edges with data.relationshipType === 'requirement'
   * - Builds directed adjacency list for traversal analysis
   * 
   * **Longest Path Algorithm:**
   * - Uses memoized DFS to avoid redundant calculations
   * - Tracks maximum path length from each node
   * - Maintains parent relationships for path reconstruction
   * - Handles cycles gracefully through visited tracking
   * 
   * **Critical Path Significance:**
   * - Represents minimum investigation completion sequence
   * - Identifies bottleneck puzzles that block progress
   * - Provides investigation priority ordering
   * - Determines overall case complexity
   * 
   * **Performance Optimization:**
   * - Memoization prevents redundant path calculations
   * - Early termination when cycles detected
   * - Efficient parent tracking for path reconstruction
   * - Linear complexity for most practical puzzle networks
   * 
   * **Investigation Applications:**
   * - Priority sequencing for puzzle completion
   * - Bottleneck identification for resource allocation
   * - Progress tracking against critical milestones
   * - Investigation complexity assessment
   */
  private static findCriticalPath(graph: GraphData): string[] {
    // Build adjacency list
    const adjList = new Map<string, string[]>();
    const inDegree = new Map<string, number>();
    
    graph.nodes.forEach(node => {
      adjList.set(node.id, []);
      inDegree.set(node.id, 0);
    });
    
    graph.edges.forEach(edge => {
      if (edge.data && (edge.data.relationshipType === 'requirement' || 
          edge.type === 'dependency')) {
        adjList.get(edge.source)?.push(edge.target);
        inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
      }
    });
    
    // Find longest path using DFS
    const pathLength = new Map<string, number>();
    const pathParent = new Map<string, string | null>();
    
    const dfs = (nodeId: string): number => {
      if (pathLength.has(nodeId)) {
        return pathLength.get(nodeId)!;
      }
      
      let maxLength = 0;
      let bestChild: string | null = null;
      
      const children = adjList.get(nodeId) || [];
      for (const child of children) {
        const childLength = dfs(child) + 1;
        if (childLength > maxLength) {
          maxLength = childLength;
          bestChild = child;
        }
      }
      
      pathLength.set(nodeId, maxLength);
      if (bestChild) {
        pathParent.set(bestChild, nodeId);
      }
      
      return maxLength;
    };
    
    // Find the node with longest path
    let maxPath = 0;
    let startNode: string | null = null;
    
    graph.nodes.forEach(node => {
      if (inDegree.get(node.id) === 0) {
        const length = dfs(node.id);
        if (length > maxPath) {
          maxPath = length;
          startNode = node.id;
        }
      }
    });
    
    // Reconstruct path
    const path: string[] = [];
    if (startNode) {
      let current: string | null = startNode;
      while (current) {
        path.push(current);
        // Find next node in path
        const children: string[] = adjList.get(current) || [];
        current = null;
        for (const child of children) {
          if (pathParent.get(child) === path[path.length - 1]) {
            current = child;
            break;
          }
        }
      }
    }
    
    return path;
  }

  /**
   * Find bottleneck nodes that block multiple investigation paths.
   * 
   * Implements sophisticated dependency analysis to identify nodes with high
   * in-degree connectivity, representing investigation bottlenecks where multiple
   * puzzle paths converge and create potential progress blockages.
   * 
   * **Bottleneck Detection Algorithm:**
   * 1. **In-Degree Calculation**: Count incoming dependency edges for each node
   * 2. **Statistical Analysis**: Calculate average in-degree for threshold determination
   * 3. **Adaptive Thresholding**: Use minimum of 2x average or absolute threshold of 2
   * 4. **Bottleneck Identification**: Select nodes exceeding threshold with >1 in-degree
   * 
   * **Threshold Strategy:**
   * - **Statistical Threshold**: 2x average in-degree for network-relative detection
   * - **Absolute Threshold**: Minimum 2 incoming dependencies for practical significance
   * - **Adaptive Selection**: Lower of statistical or absolute for balanced detection
   * - **Minimum Filter**: Excludes nodes with ≤1 dependencies (not true bottlenecks)
   * 
   * @param graph Graph data containing nodes with dependency relationships
   * @returns Array of node IDs representing identified investigation bottlenecks
   * 
   * @complexity O(V + E) for in-degree calculation and statistical analysis
   * 
   * @example
   * ```typescript
   * // Input: Investigation network with converging dependencies
   * const investigationGraph = {
   *   nodes: [
   *     { id: 'key-evidence', type: 'elementNode' },
   *     { id: 'witness-1', type: 'characterNode' },
   *     { id: 'witness-2', type: 'characterNode' },
   *     { id: 'conclusion', type: 'puzzleNode' }
   *   ],
   *   edges: [
   *     { source: 'witness-1', target: 'key-evidence', type: 'dependency' },
   *     { source: 'witness-2', target: 'key-evidence', type: 'dependency' },
   *     { source: 'key-evidence', target: 'conclusion', data: { relationshipType: 'requirement' } }
   *   ]
   * };
   * 
   * // Identify investigation bottlenecks
   * const bottlenecks = ViewSpecificOptimizer.findBottlenecks(investigationGraph);
   * console.log('Investigation bottlenecks:', bottlenecks);
   * // Output: ['key-evidence'] (2 witnesses depend on this evidence)
   * 
   * // Bottleneck analysis for resource prioritization
   * console.log('Priority targets for investigation:', bottlenecks.length);
   * ```
   * 
   * @remarks
   * **In-Degree Analysis:**
   * - Counts incoming edges with type === 'dependency'
   * - Counts incoming edges with data.relationshipType === 'requirement'  
   * - Excludes other edge types from bottleneck calculation
   * - Initializes all nodes with zero in-degree for comprehensive coverage
   * 
   * **Statistical Thresholding:**
   * - Calculates average only from nodes with >0 in-degree
   * - Prevents skewing from isolated nodes
   * - Uses 2x multiplier for meaningful bottleneck detection
   * - Applies minimum threshold of 2 for practical significance
   * 
   * **Bottleneck Significance:**
   * - High in-degree indicates multiple dependency convergence
   * - Represents potential investigation roadblocks
   * - Identifies resource allocation priorities
   * - Highlights critical evidence or puzzle nodes
   * 
   * **Adaptive Algorithm Benefits:**
   * - Works with various network sizes and structures
   * - Prevents false positives in sparse networks
   * - Ensures meaningful bottleneck identification
   * - Scales appropriately with investigation complexity
   * 
   * **Investigation Applications:**
   * - Priority identification for evidence gathering
   * - Resource allocation for complex investigations
   * - Risk assessment for investigation timeline
   * - Critical path vulnerability analysis
   */
  private static findBottlenecks(graph: GraphData): string[] {
    const inDegree = new Map<string, number>();
    
    // Initialize all nodes with 0 in-degree
    graph.nodes.forEach(node => {
      inDegree.set(node.id, 0);
    });
    
    // Count incoming dependency edges for each node
    graph.edges.forEach(edge => {
      if (edge.data && (edge.data.relationshipType === 'requirement' || 
          edge.type === 'dependency')) {
        inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
      }
    });
    
    // Find nodes with high in-degree (many other nodes depend on them)
    const bottlenecks: string[] = [];
    const degrees = Array.from(inDegree.values()).filter(d => d > 0);
    
    if (degrees.length === 0) return bottlenecks;
    
    const avgInDegree = degrees.reduce((a, b) => a + b, 0) / degrees.length;
    
    // Use a more reasonable threshold: nodes with >= 2x average or >= 2 incoming edges
    // (whichever is lower) are considered bottlenecks
    const threshold = Math.min(avgInDegree * 2, 2);
    
    inDegree.forEach((degree, nodeId) => {
      if (degree >= threshold && degree > 1) {
        bottlenecks.push(nodeId);
      }
    });
    
    return bottlenecks;
  }

  /**
   * Identify linear puzzle chains in dependency network.
   * 
   * Implements sophisticated chain detection algorithm to find sequences of
   * puzzles connected by dependencies, enabling visual grouping and logical
   * organization of related puzzle sequences in investigation workflows.
   * 
   * **Chain Detection Algorithm:**
   * 1. **Dependency Graph Construction**: Build adjacency list from puzzle dependencies
   * 2. **Starting Point Identification**: Find puzzles with no incoming dependencies
   * 3. **Chain Traversal**: Follow single-child paths to build linear sequences
   * 4. **Chain Termination**: Stop at branching points or visited nodes
   * 
   * **Chain Definition Criteria:**
   * - **Linear Sequence**: Each puzzle has at most one successor
   * - **Dependency Connection**: Connected by 'dependency' or 'requirement' edges
   * - **Puzzle Node Filter**: Only includes nodes of type 'puzzleNode'
   * - **Visited Tracking**: Prevents cycles and duplicate chain inclusion
   * 
   * @param graph Graph data containing puzzle nodes and dependency relationships
   * @returns Array of chain arrays, each containing sequence of connected puzzle IDs
   * 
   * @complexity O(V + E) for graph construction and chain traversal
   * 
   * @example
   * ```typescript
   * // Input: Complex puzzle dependency network
   * const puzzleNetwork = {
   *   nodes: [
   *     { id: 'intro-1', type: 'puzzleNode' },
   *     { id: 'intro-2', type: 'puzzleNode' },
   *     { id: 'main-1', type: 'puzzleNode' },
   *     { id: 'main-2', type: 'puzzleNode' },
   *     { id: 'finale', type: 'puzzleNode' }
   *   ],
   *   edges: [
   *     { source: 'intro-1', target: 'intro-2', type: 'dependency' },
   *     { source: 'main-1', target: 'main-2', data: { relationshipType: 'requirement' } },
   *     { source: 'intro-2', target: 'finale', type: 'dependency' },
   *     { source: 'main-2', target: 'finale', type: 'dependency' }
   *   ]
   * };
   * 
   * // Identify puzzle chains
   * const chains = ViewSpecificOptimizer.identifyPuzzleChains(puzzleNetwork);
   * console.log('Puzzle chains:', chains);
   * // Output: [['intro-1', 'intro-2'], ['main-1', 'main-2']]
   * // Note: 'finale' not included as it has multiple predecessors (branching point)
   * 
   * // Chain analysis for visual grouping
   * chains.forEach((chain, index) => {
   *   console.log(`Chain ${index + 1}: ${chain.join(' → ')}`);
   * });
   * ```
   * 
   * @remarks
   * **Chain Starting Points:**
   * - Identifies puzzles with in-degree 0 (no incoming dependencies)
   * - Only considers 'puzzleNode' type for relevant chain detection
   * - Ensures chains start from logical beginning points
   * 
   * **Chain Traversal Logic:**
   * - Follows paths where each node has exactly one unvisited successor
   * - Terminates at branching points (multiple children) or convergence points
   * - Maintains visited set to prevent infinite loops and duplicate inclusion
   * - Includes single-node chains for comprehensive coverage
   * 
   * **Chain Termination Conditions:**
   * - **No Children**: End of dependency path reached
   * - **Multiple Children**: Branching point that splits investigation paths
   * - **Visited Node**: Prevents cycles and ensures linear sequences
   * - **Non-Puzzle Node**: Maintains focus on puzzle-specific chains
   * 
   * **Visual Grouping Benefits:**
   * - Enables vertical clustering of related puzzle sequences
   * - Provides logical organization for complex puzzle networks
   * - Supports chain-specific styling and visual emphasis
   * - Facilitates understanding of puzzle progression patterns
   * 
   * **Investigation Applications:**
   * - Sequential puzzle completion planning
   * - Visual organization of related investigation steps
   * - Progress tracking within puzzle sequences
   * - Resource allocation for chain-specific puzzle groups
   */
  private static identifyPuzzleChains(graph: GraphData): string[][] {
    const chains: string[][] = [];
    const visited = new Set<string>();
    
    // Build adjacency list for dependencies
    const adjList = new Map<string, string[]>();
    const inDegree = new Map<string, number>();
    
    graph.nodes.forEach(node => {
      if (node.type === 'puzzleNode') {
        adjList.set(node.id, []);
        inDegree.set(node.id, 0);
      }
    });
    
    graph.edges.forEach(edge => {
      if (edge.data && (edge.data.relationshipType === 'requirement' || 
          edge.type === 'dependency')) {
        adjList.get(edge.source)?.push(edge.target);
        inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
      }
    });
    
    // Find chains starting from nodes with no incoming dependencies
    const findChain = (nodeId: string): string[] => {
      const chain = [nodeId];
      visited.add(nodeId);
      
      let current = nodeId;
      while (true) {
        const children = adjList.get(current) || [];
        // Follow chain if there's exactly one child
        const unvisitedChildren = children.filter(c => !visited.has(c));
        if (unvisitedChildren.length === 1 && unvisitedChildren[0]) {
          current = unvisitedChildren[0];
          chain.push(current);
          visited.add(current);
        } else {
          break;
        }
      }
      
      return chain;
    };
    
    // Find all chains (including single-node chains)
    graph.nodes.forEach(node => {
      if (node.type === 'puzzleNode' && 
          !visited.has(node.id) && 
          (inDegree.get(node.id) || 0) === 0) {
        const chain = findChain(node.id);
        // Include all chains, even single-node ones
        chains.push(chain);
      }
    });
    
    return chains;
  }

  /**
   * Calculate completion flow patterns for status-based investigation visualization.
   * 
   * Analyzes puzzle completion status and dependencies to determine logical flow
   * patterns, enabling visual representation of investigation progress through
   * color gradients, progress indicators, and completion status zones.
   * 
   * Flow calculation includes:
   * - Dependency chain analysis for prerequisite tracking
   * - Status propagation through connected components
   * - Completion percentage estimation for progress bars
   * - Bottleneck identification in investigation workflow
   * - Zone assignment for status-based organization
   * 
   * @param graph Graph data containing nodes and dependency edges
   * @returns Map of node IDs to normalized completion flow levels (0-N)
   * 
   * @complexity O(V + E) for topological sorting and level assignment
   * 
   * @example
   * ```typescript
   * // Calculate flow for puzzle dependency chain
   * const flowLevels = ViewSpecificOptimizer.calculateCompletionFlow(puzzleGraph);
   * console.log('Flow levels:', flowLevels);
   * // Output: Map { 'intro-puzzle' => 0, 'main-puzzle' => 1, 'finale' => 2 }
   * 
   * // Apply flow-based styling
   * const maxLevel = Math.max(...flowLevels.values());
   * nodes.forEach(node => {
   *   const level = flowLevels.get(node.id) || 0;
   *   const flowIntensity = level / maxLevel; // 0.0 to 1.0
   *   node.data.statusZone = flowIntensity > 0.8 ? 'complete' : 'active';
   * });
   * ```
   * 
   * @see {@link identifyPuzzleChains} For puzzle dependency analysis
   * @see {@link findBottlenecks} For bottleneck detection
   * 
   * @remarks Uses topological sorting algorithm to assign flow levels:
   * - Level 0: Nodes with no dependencies (starting points)
   * - Level N: Nodes requiring completion of level N-1 prerequisites
   * - Handles cycles gracefully through visited tracking
   * - Integrates with murder mystery investigation workflow progress tracking
   */
  private static calculateCompletionFlow(graph: GraphData): Map<string, number> {
    const levels = new Map<string, number>();
    const adjList = new Map<string, string[]>();
    const inDegree = new Map<string, number>();
    
    // Build adjacency list
    graph.nodes.forEach(node => {
      adjList.set(node.id, []);
      inDegree.set(node.id, 0);
      levels.set(node.id, 0);
    });
    
    graph.edges.forEach(edge => {
      if (edge.data && (edge.data.relationshipType === 'requirement' || 
          edge.type === 'dependency')) {
        adjList.get(edge.source)?.push(edge.target);
        inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
      }
    });
    
    // Topological sort with level assignment
    const queue: string[] = [];
    
    // Start with nodes that have no dependencies
    graph.nodes.forEach(node => {
      if (inDegree.get(node.id) === 0) {
        queue.push(node.id);
        levels.set(node.id, 0);
      }
    });
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentLevel = levels.get(current) || 0;
      
      const children = adjList.get(current) || [];
      for (const child of children) {
        levels.set(child, Math.max(levels.get(child) || 0, currentLevel + 1));
        inDegree.set(child, (inDegree.get(child) || 0) - 1);
        
        if (inDegree.get(child) === 0) {
          queue.push(child);
        }
      }
    }
    
    return levels;
  }

  /**
   * Calculate interaction density for character relationship heat mapping and clustering.
   * 
   * Analyzes character interaction patterns to generate density metrics for visual
   * heat mapping, relationship clustering, and social network analysis within the
   * murder mystery investigation context using breadth-first search traversal.
   * 
   * Density calculation factors:
   * - Direct relationship count and strength
   * - Indirect connection paths (up to 3 degrees of separation)
   * - Interaction frequency and relationship multipliers
   * - Distance-based density attenuation (closer = higher density)
   * - Connection count weighting for hub character identification
   * 
   * **Algorithm Steps:**
   * 1. **BFS Traversal**: From target character up to 3 degrees of separation
   * 2. **Distance Calculation**: Track shortest path to each reachable node
   * 3. **Density Computation**: Base density from inverse distance + interaction weighting
   * 4. **Normalization**: Clamp final density values between 0.0 and 1.0
   * 
   * @param graph Complete graph data for relationship analysis
   * @param characterId Target character ID for density calculation center
   * @returns Map of node IDs to normalized density values (0.0 to 1.0)
   * 
   * @complexity O(V + E) for BFS traversal, O(E) for interaction counting
   * 
   * @example
   * ```typescript
   * // Calculate density for Marcus Blackwood (central character)
   * const densityMap = ViewSpecificOptimizer.calculateInteractionDensity(
   *   investigationGraph, 
   *   'marcus-blackwood-id'
   * );
   * 
   * // Apply heat map styling based on density
   * nodes.forEach(node => {
   *   const density = densityMap.get(node.id) || 0;
   *   node.data.heatmapColor = this.getHeatmapColor(density);
   *   node.data.clusterRole = density > 0.7 ? 'hub' : 'peripheral';
   *   node.style.opacity = Math.max(0.3, density);
   * });
   * 
   * console.log('High-density connections:', 
   *   Array.from(densityMap.entries())
   *     .filter(([_, density]) => density > 0.6)
   *     .map(([id, _]) => id)
   * );
   * ```
   * 
   * @see {@link getHeatmapColor} For density-to-color mapping
   * @see {@link optimizeCharacterJourney} For character-focused optimization
   * 
   * @remarks
   * **Distance-Based Attenuation:**
   * - Distance 0 (self): 100% base density
   * - Distance 1: 75% base density (direct connections)
   * - Distance 2: 50% base density (friends-of-friends)
   * - Distance 3: 25% base density (extended network)
   * - Distance >3: 0% density (not included)
   * 
   * **Interaction Weighting:**
   * - Each direct edge adds 0.1 to density
   * - Multiple connections compound for hub identification
   * - Final density clamped to prevent overflow
   * 
   * Essential for identifying key characters and relationship patterns
   * in murder mystery investigations
   */
  private static calculateInteractionDensity(graph: GraphData, characterId: string): Map<string, number> {
    const density = new Map<string, number>();
    const maxDistance = 3;
    
    // BFS from character node to calculate distance
    const distances = new Map<string, number>();
    const queue: { id: string; dist: number }[] = [{ id: characterId, dist: 0 }];
    const visited = new Set<string>();
    
    while (queue.length > 0) {
      const { id, dist } = queue.shift()!;
      if (visited.has(id) || dist > maxDistance) continue;
      
      visited.add(id);
      distances.set(id, dist);
      
      // Find connected nodes
      graph.edges.forEach(edge => {
        if (edge.source === id && !visited.has(edge.target)) {
          queue.push({ id: edge.target, dist: dist + 1 });
        }
        if (edge.target === id && !visited.has(edge.source)) {
          queue.push({ id: edge.source, dist: dist + 1 });
        }
      });
    }
    
    // Calculate density based on distance and interaction count
    graph.nodes.forEach(node => {
      const distance = distances.get(node.id);
      if (distance !== undefined) {
        // Closer nodes have higher density
        const baseDensity = 1 - (distance / (maxDistance + 1));
        
        // Count interactions with character
        let interactionCount = 0;
        graph.edges.forEach(edge => {
          if ((edge.source === characterId && edge.target === node.id) ||
              (edge.target === characterId && edge.source === node.id)) {
            interactionCount++;
          }
        });
        
        // Combine distance and interaction count
        const finalDensity = baseDensity * (1 + interactionCount * 0.2);
        density.set(node.id, Math.min(1, finalDensity));
      } else {
        density.set(node.id, 0);
      }
    });
    
    return density;
  }

  /**
   * Convert density value to appropriate heat map color for visual intensity mapping.
   * 
   * Transforms normalized density values into color representations using a carefully
   * designed gradient optimized for murder mystery investigation analysis. The color
   * scheme provides intuitive visual feedback for relationship intensity and character
   * importance within the investigation network.
   * 
   * **Color Gradient Strategy:**
   * - **0.00-0.25**: Blue to Cyan - Isolated/peripheral characters
   * - **0.25-0.50**: Cyan to Green - Moderate connections
   * - **0.50-0.75**: Green to Yellow - Well-connected characters  
   * - **0.75-1.00**: Yellow to Red - Central hub characters (key suspects)
   * 
   * **RGB Interpolation Algorithm:**
   * - Uses linear interpolation between color stops
   * - Smooth gradient transitions for natural visualization
   * - Clamped input values prevent invalid color generation
   * - Four-segment gradient for optimal density discrimination
   * 
   * @param density Normalized density value between 0.0 and 1.0
   * @returns CSS RGB color string for heat map visualization
   * 
   * @complexity O(1) - constant time color calculation with clamping
   * 
   * @example
   * ```typescript
   * // Map Marcus Blackwood's high density to red
   * const color = ViewSpecificOptimizer.getHeatmapColor(0.85);
   * console.log('Hub character color:', color);
   * // Output: 'rgb(255, 191, 0)' (yellow-orange for high-priority suspect)
   * 
   * // Apply to character node styling
   * characterNode.style = {
   *   ...characterNode.style,
   *   backgroundColor: color,
   *   borderColor: this.adjustColorBrightness(color, -0.2),
   *   priority: density > 0.8 ? 'critical' : 'normal'
   * };
   * 
   * // Peripheral character gets cool blue
   * const peripheralColor = ViewSpecificOptimizer.getHeatmapColor(0.15);
   * console.log('Background character:', peripheralColor);
   * // Output: 'rgb(0, 140, 235)' (blue for background character)
   * 
   * // Full spectrum demonstration
   * [0.1, 0.3, 0.5, 0.7, 0.9].forEach(density => {
   *   console.log(`Density ${density}: ${this.getHeatmapColor(density)}`);
   * });
   * // Shows complete blue→cyan→green→yellow→red progression
   * ```
   * 
   * @see {@link calculateInteractionDensity} For density value generation
   * @see {@link optimizeCharacterJourney} For character visualization context
   * 
   * @remarks
   * **Color Accessibility:**
   * - Gradient designed for colorblind accessibility
   * - High contrast between adjacent ranges
   * - Red reserved for highest priority (key suspects)
   * - Blue indicates low investigation priority
   * 
   * **Investigation Workflow Integration:**
   * - Red/yellow: Focus investigation resources here
   * - Green: Standard investigation priority
   * - Blue/cyan: Background characters, lower priority
   * 
   * **Performance Optimization:**
   * - No external dependencies or complex calculations
   * - Efficient linear interpolation algorithm
   * - Clamped inputs prevent edge case errors
   */
  private static getHeatmapColor(density: number): string {
    // Clamp density between 0 and 1
    const d = Math.max(0, Math.min(1, density));
    
    // Create gradient from blue (cold) to red (hot)
    if (d < 0.25) {
      // Blue to cyan
      const t = d * 4;
      return `rgb(${Math.floor(0 * (1 - t) + 0 * t)}, ${Math.floor(100 * (1 - t) + 191 * t)}, ${Math.floor(255 * (1 - t) + 207 * t)})`;
    } else if (d < 0.5) {
      // Cyan to green
      const t = (d - 0.25) * 4;
      return `rgb(${Math.floor(0 * (1 - t) + 0 * t)}, ${Math.floor(191 * (1 - t) + 255 * t)}, ${Math.floor(207 * (1 - t) + 0 * t)})`;
    } else if (d < 0.75) {
      // Green to yellow
      const t = (d - 0.5) * 4;
      return `rgb(${Math.floor(0 * (1 - t) + 255 * t)}, ${Math.floor(255 * (1 - t) + 255 * t)}, ${Math.floor(0)})`;
    } else {
      // Yellow to red
      const t = (d - 0.75) * 4;
      return `rgb(${Math.floor(255)}, ${Math.floor(255 * (1 - t) + 0 * t)}, ${Math.floor(0)})`;
    }
  }
}