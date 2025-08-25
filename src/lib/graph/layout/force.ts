/**
 * Force-Directed Layout Module
 * Uses d3-force for network-style graph layouts
 * Better suited for dense, highly-connected graphs than hierarchical layouts
 * 
 * Optimized for ALNRetool Character Journey View with semantic positioning
 */

import * as d3Force from 'd3-force';
import type { GraphNode, GraphEdge, SimulationGraphNode } from '../types';
import { logger } from '../utils/Logger'


interface SimulationGraphEdge {
  source: string | SimulationGraphNode;
  target: string | SimulationGraphNode;
  type?: string;
  index?: number;
}

export interface ForceLayoutConfig {
  // Force simulation parameters
  chargeStrength?: number;     // Node repulsion strength (default: -300)
  linkDistance?: number;        // Ideal edge length (default: 100)
  linkStrength?: number;        // Edge strength (0-1, default: 0.5)
  centerStrength?: number;      // Pull toward center (default: 0.1)
  collisionRadius?: number;     // Minimum node spacing (default: 50)
  
  // Simulation settings
  iterations?: number;          // Number of simulation ticks (default: 300)
  alphaMin?: number;           // Minimum alpha before stopping (default: 0.001)
  alphaDecay?: number;         // Alpha decay rate (default: 0.0228)
  velocityDecay?: number;      // Velocity damping (default: 0.4)
  
  // Layout bounds
  width?: number;              // Canvas width (default: 1600)
  height?: number;             // Canvas height (default: 1200)
  
  // Node-specific forces
  nodeStrengthByType?: Record<string, number>;  // Custom charge by node type
  nodeSizeByType?: Record<string, number>;      // Custom collision radius by type
  
  // Semantic positioning
  enableLanePositioning?: boolean;  // Enable horizontal lanes by node type
  enableTierClustering?: boolean;   // Enable character tier clustering
  enableTimelineOrdering?: boolean; // Enable timeline chronological ordering
  
  // Lane positions (Y-axis positioning by node type)
  lanePositions?: Record<string, number>;
  
  // Tier positions (X-axis positioning for character tiers)
  tierPositions?: Record<string, number>;
}

/**
 * Apply optimized force layout for dense graphs
 * Uses research-based parameters for 200+ node networks
 */
export function applyForceLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  config: ForceLayoutConfig = {}
): GraphNode[] {
  const nodeCount = nodes.length;
  const isDenseGraph = nodeCount > 200;
  const isLargeGraph = nodeCount > 150;
  const isMediumGraph = nodeCount > 100;
  
  // Dynamic canvas sizing based on node count
  // Scales from 2000x1500 for small graphs to 4000x3000 for very large graphs
  const dynamicWidth = Math.min(4000, Math.max(2000, 1500 + nodeCount * 10));
  const dynamicHeight = Math.min(3000, Math.max(1500, 1200 + nodeCount * 7));
  
  // Research-based parameters for dense graphs
  // Based on D3-force best practices and empirical testing
  const {
    chargeStrength = isDenseGraph ? -5000 : (isLargeGraph ? -3000 : (isMediumGraph ? -2000 : -1500)),
    linkDistance = isDenseGraph ? 400 : (isLargeGraph ? 350 : (isMediumGraph ? 250 : 150)),
    linkStrength = isDenseGraph ? 0.03 : (isLargeGraph ? 0.05 : (isMediumGraph ? 0.1 : 0.2)),
    centerStrength = 0.05,   // Weak center force to allow expansion
    collisionRadius = isDenseGraph ? 180 : (isLargeGraph ? 140 : (isMediumGraph ? 100 : 80)),
    iterations = isDenseGraph ? 800 : (isLargeGraph ? 600 : (isMediumGraph ? 500 : 400)),
    alphaMin = 0.001,
    alphaDecay = isDenseGraph ? 0.01 : 0.0228,  // Slower decay for dense graphs
    velocityDecay = 0.4,     // Damping to reduce oscillation
    width = dynamicWidth,
    height = dynamicHeight,
    nodeStrengthByType = {},
    nodeSizeByType = {}
  } = config;

  logger.debug('🌐 Applying optimized force-directed layout:', { 
    nodeCount,
    edgeCount: edges.length,
    isDenseGraph,
    chargeStrength,
    linkDistance,
    linkStrength,
    collisionRadius,
    iterations
   });

  // Create d3 simulation nodes (mutable copies)
  const simulationNodes: SimulationGraphNode[] = nodes.map(node => ({
    ...node,
    id: node.id,
    x: node.position?.x || Math.random() * width,
    y: node.position?.y || Math.random() * height,
    type: node.type,
    data: {
      ...node.data,
      metadata: {
        ...node.data.metadata,
        // Extract tier for characters
        tier: node.data?.metadata?.tier || (node.data as any)?.tier
      }
    }
  }));

  // Create d3 simulation links
  const simulationLinks = edges.map(edge => ({
    source: edge.source,
    target: edge.target,
    type: edge.type
  }));

  // Create force simulation with enhanced forces for anti-clustering
  const simulation = d3Force.forceSimulation(simulationNodes)
    // Link force with relationship-based parameters
    .force('link', d3Force.forceLink<SimulationGraphNode, SimulationGraphEdge>(simulationLinks)
      .id((d: SimulationGraphNode) => d.id)
      .distance((d: SimulationGraphEdge) => {
        // Semantic link distances by edge type
        if (d.type === 'ownership') return linkDistance * 0.7;     // Closer for ownership
        if (d.type === 'requirement') return linkDistance * 1.0;   // Standard for requirements
        if (d.type === 'reward') return linkDistance * 1.3;        // Further for rewards
        if (d.type === 'relationship') return linkDistance * 0.8;  // Closer for relationships
        
        // Timeline edges get moderate distance
        if (d.type === 'timeline') return linkDistance * 0.9;
        
        return linkDistance;
      })
      .strength((d: SimulationGraphEdge) => {
        // Relationship-based link strengths for semantic meaning
        if (d.type === 'ownership') return 0.3;      // Strong ownership bonds
        if (d.type === 'requirement') return 0.2;    // Moderate requirement links
        if (d.type === 'reward') return 0.15;        // Weaker reward connections
        if (d.type === 'relationship') return 0.25;  // Moderate character relationships
        return linkStrength;  // Default strength for unknown types
      })
      .iterations(3)  // More iterations for better convergence
    )
    // Many-body force with strong repulsion
    .force('charge', d3Force.forceManyBody<SimulationGraphNode>()
      .strength((d: SimulationGraphNode) => {
        // Node-type specific charge strength (multipliers)
        const nodeType = d.type || 'default';
        const typeMultiplier = nodeStrengthByType[nodeType];
        if (typeMultiplier !== undefined) {
          // If provided, use as multiplier of base charge strength
          return chargeStrength * typeMultiplier;
        }
        
        // Default strengths by node type for semantic layout
        if (d.type === 'characterNode' || d.type === 'characterTree') {
          return chargeStrength * 2.0;  // Characters repel much more for clear spacing
        }
        if (d.type === 'puzzleNode') {
          return chargeStrength * 1.6;  // Puzzles repel more for better separation
        }
        if (d.type === 'elementNode') {
          return chargeStrength * 1.0;  // Elements use base repulsion
        }
        if (d.type === 'timelineNode') {
          return chargeStrength * 0.8;  // Timeline events repel less
        }
        return chargeStrength;
      })
      .theta(0.5)  // More accurate force calculation
      .distanceMin(1)  // Prevent infinite forces at close range
      .distanceMax(isDenseGraph ? 2000 : 1500)  // Limit force range for performance
    )
    // Center force to keep graph centered
    .force('center', d3Force.forceCenter(width / 2, height / 2)
      .strength(centerStrength)
    )
    // Collision force with adaptive radius - INCREASED FOR PUZZLES
    .force('collision', d3Force.forceCollide<SimulationGraphNode>()
      .radius((d: SimulationGraphNode) => {
        // Node-type specific collision radius (multipliers)
        const nodeType = d.type || 'default';
        const typeMultiplier = nodeSizeByType[nodeType];
        if (typeMultiplier !== undefined) {
          // If provided, use as multiplier of base collision radius
          return collisionRadius * typeMultiplier;
        }
        
        // Default radii by node type with density multiplier
        const densityMultiplier = isDenseGraph ? 1.3 : (isLargeGraph ? 1.2 : 1.0);
        
        if (d.type === 'characterNode' || d.type === 'characterTree') {
          return collisionRadius * 1.3 * densityMultiplier;  // Larger for characters
        }
        if (d.type === 'puzzleNode') {
          return collisionRadius * 1.1 * densityMultiplier;  // Slightly larger for puzzles
        }
        if (d.type === 'elementNode') {
          return collisionRadius * 1.0 * densityMultiplier;  // Standard for elements
        }
        if (d.type === 'timelineNode') {
          return collisionRadius * 0.9 * densityMultiplier;  // Slightly smaller for timeline
        }
        return collisionRadius * densityMultiplier;
      })
      .strength(1.0)  // Standard collision strength for all nodes
      .iterations(3)  // Standard iterations for balance between performance and quality
    );

  // Simplified: Remove lane positioning to reduce conflicts with natural force layout
  // Only apply weak centering to keep graph balanced
  simulation.force('y', d3Force.forceY(height / 2).strength(0.01));

  // Simplified: Remove tier clustering to let natural forces handle positioning
  // Only apply weak centering to keep graph balanced
  simulation.force('x', d3Force.forceX(width / 2).strength(0.01));

  // Simplified: Remove timeline ordering to reduce conflicts
  // Let natural link forces handle timeline connections

  // Configure simulation parameters
  simulation
    .alpha(1)
    .alphaMin(alphaMin)
    .alphaDecay(alphaDecay)
    .velocityDecay(velocityDecay);

  // Run simulation for specified iterations with position bounds checking
  logger.debug(`⚙️ Running force simulation for ${iterations} iterations...`);
  const startTime = performance.now();
  
  // Define reasonable bounds to prevent extreme positions
  const maxX = width * 2;  // Allow some overflow but not extreme
  const maxY = height * 2;
  const minX = -width * 0.5;  // Allow some negative but not extreme
  const minY = -height * 0.5;
  
  // Custom tick handler with bounds checking
  const tickWithBounds = () => {
    simulation.tick();
    
    // Apply position bounds to prevent extreme values
    simulationNodes.forEach(node => {
      // Clamp positions to reasonable bounds
      if ((node.x ?? 0) > maxX) {
        node.x = maxX;
        if (node.vx !== undefined) node.vx = 0; // Stop velocity in that direction
      } else if ((node.x ?? 0) < minX) {
        node.x = minX;
        if (node.vx !== undefined) node.vx = 0;
      }
      
      if ((node.y ?? 0) > maxY) {
        node.y = maxY;
        if (node.vy !== undefined) node.vy = 0; // Stop velocity in that direction
      } else if ((node.y ?? 0) < minY) {
        node.y = minY;
        if (node.vy !== undefined) node.vy = 0;
      }
      
      // Also check for NaN or Infinity values (shouldn't happen but safety check)
      if (!isFinite(node.x ?? 0) || !isFinite(node.y ?? 0)) {
        logger.warn(`Invalid position detected for node ${node.id}, resetting to center`);
        node.x = width / 2;
        node.y = height / 2;
        if (node.vx !== undefined) node.vx = 0;
        if (node.vy !== undefined) node.vy = 0;
      }
    });
  };
  
  // For very dense graphs, show progress with throttled updates
  if (isDenseGraph && iterations > 500) {
    const checkpoints = [0.25, 0.5, 0.75, 1.0];
    let currentCheckpoint = 0;
    const updateInterval = Math.max(1, Math.floor(iterations / 100)); // Update at most 100 times
    
    for (let i = 0; i < iterations; i++) {
      tickWithBounds();
      
      // Throttle progress updates to reduce overhead
      if (i % updateInterval === 0 || i === iterations - 1) {
        const progress = i / iterations;
        if (currentCheckpoint < checkpoints.length && progress >= checkpoints[currentCheckpoint]!) {
          logger.debug(`  ${Math.round(progress * 100)}% complete...`);
          currentCheckpoint++;
        }
      }
    }
  } else {
    // Normal simulation with bounds checking - batch ticks for better performance
    const batchSize = Math.min(10, Math.max(1, Math.floor(iterations / 50)));
    for (let i = 0; i < iterations; i += batchSize) {
      const batchEnd = Math.min(i + batchSize, iterations);
      for (let j = i; j < batchEnd; j++) {
        tickWithBounds();
      }
      // Allow browser to breathe every batch (for async environments)
      if (typeof requestAnimationFrame !== 'undefined' && i % 100 === 0) {
        // This is a sync loop, but we can yield control periodically
        // Note: This won't actually work in a sync context, but prepares for async refactor
      }
    }
  }
  
  const computeTime = performance.now() - startTime;
  logger.debug(`✅ Simulation complete in ${computeTime.toFixed(0)}ms`);

  // Stop simulation
  simulation.stop();

  // Apply positions back to original nodes
  const positionedNodes = nodes.map(node => {
    const simNode = simulationNodes.find(n => n.id === node.id);
    if (!simNode) {
      logger.warn(`Node ${node.id} not found in simulation results`);
      return node;
    }

    return {
      ...node,
      position: {
        x: Math.round(simNode.x ?? simNode.position.x),
        y: Math.round(simNode.y ?? simNode.position.y)
      }
    };
  });

  // Calculate and report layout metrics
  const bounds = calculateBounds(positionedNodes);
  const avgDistance = calculateAverageDistance(positionedNodes, edges);
  const minDistance = calculateMinimumDistance(positionedNodes);
  
  logger.debug('📊 Force layout metrics:', undefined, {
    bounds,
    avgNodeDistance: avgDistance.toFixed(0),
    minNodeDistance: minDistance.toFixed(0),
    computeTime: `${computeTime.toFixed(0)}ms`,
    nodesPerSecond: (nodeCount / (computeTime / 1000)).toFixed(0)
  });

  // Warn if minimum distance suggests overlaps
  if (minDistance < collisionRadius * 0.8) {
    logger.warn(`⚠️ Potential node overlaps detected (min distance: ${minDistance.toFixed(0)}px, collision radius: ${collisionRadius}px)`);
  }

  return positionedNodes;
}

/**
 * Apply force layout with clustering for related nodes
 * Groups nodes by a specified attribute to create visual clusters
 */
export function applyClusteredForceLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  clusterBy: (node: GraphNode) => string,
  config: ForceLayoutConfig = {}
): GraphNode[] {
  // Group nodes by cluster
  const clusters = new Map<string, GraphNode[]>();
  nodes.forEach(node => {
    const cluster = clusterBy(node);
    if (!clusters.has(cluster)) {
      clusters.set(cluster, []);
    }
    clusters.get(cluster)!.push(node);
  });

  logger.debug('🎯 Applying clustered force layout:', { 
    clusterCount: clusters.size,
    clusters: Array.from(clusters.entries()).map(([key, nodes]) => ({
      cluster: key,
      nodeCount: nodes.length
     }))
  });

  // Calculate cluster centers in a grid pattern for better space utilization
  const clusterCenters = new Map<string, { x: number; y: number }>();
  const gridCols = Math.ceil(Math.sqrt(clusters.size));
  const gridRows = Math.ceil(clusters.size / gridCols);
  const cellWidth = (config.width || 12000) / gridCols;
  const cellHeight = (config.height || 10000) / gridRows;

  let i = 0;
  clusters.forEach((_, clusterId) => {
    const col = i % gridCols;
    const row = Math.floor(i / gridCols);
    clusterCenters.set(clusterId, {
      x: cellWidth * (col + 0.5),
      y: cellHeight * (row + 0.5)
    });
    i++;
  });

  // Create simulation with cluster forces
  const simulationNodes = nodes.map(node => {
    const cluster = clusterBy(node);
    const center = clusterCenters.get(cluster) || { 
      x: (config.width || 12000) / 2, 
      y: (config.height || 10000) / 2 
    };
    return {
      id: node.id,
      x: center.x + (Math.random() - 0.5) * 200,
      y: center.y + (Math.random() - 0.5) * 200,
      type: node.type,
      cluster,
      data: node.data
    } as any; // d3-force requires specific internal types
  });

  const simulationLinks = edges.map(edge => ({
    source: edge.source,
    target: edge.target,
    type: edge.type
  }));

  // Create force simulation with cluster attraction
  const simulation = d3Force.forceSimulation(simulationNodes)
    .force('link', d3Force.forceLink<SimulationGraphNode, SimulationGraphEdge>(simulationLinks)
      .id((d: SimulationGraphNode) => d.id)
      .distance(config.linkDistance || 200)
      .strength(config.linkStrength || 0.1)
    )
    .force('charge', d3Force.forceManyBody()
      .strength(config.chargeStrength || -2000)
      .distanceMax(1000)  // Limit charge range within clusters
    )
    .force('collision', d3Force.forceCollide()
      .radius(config.collisionRadius || 100)
      .strength(0.8)
      .iterations(3)
    )
    // Add cluster attraction forces
    .force('clusterX', d3Force.forceX<SimulationGraphNode>((d: SimulationGraphNode) => {
      const center = clusterCenters.get(d.cluster || '');
      return center ? center.x : (config.width || 12000) / 2;
    }).strength(0.4))
    .force('clusterY', d3Force.forceY<SimulationGraphNode>((d: SimulationGraphNode) => {
      const center = clusterCenters.get(d.cluster || '');
      return center ? center.y : (config.height || 10000) / 2;
    }).strength(0.4))
    .alpha(1)
    .alphaMin(config.alphaMin || 0.001)
    .alphaDecay(config.alphaDecay || 0.0228)
    .velocityDecay(config.velocityDecay || 0.4);

  // Run simulation
  const iterations = config.iterations || 800;
  logger.debug(`⚙️ Running clustered simulation for ${iterations} iterations...`);
  simulation.tick(iterations);
  simulation.stop();

  // Apply positions back to original nodes
  const positionedNodes = nodes.map(node => {
    const simNode = simulationNodes.find(n => n.id === node.id);
    if (!simNode) {
      return node;
    }

    return {
      ...node,
      position: {
        x: Math.round(simNode.x ?? 0),
        y: Math.round(simNode.y ?? 0)
      },
      data: {
        ...node.data,
        cluster: (simNode).cluster
      }
    };
  });

  return positionedNodes;
}

// Helper functions
function calculateBounds(nodes: GraphNode[]) {
  if (nodes.length === 0) return { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 };

  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  nodes.forEach(node => {
    if (node.position) {
      minX = Math.min(minX, node.position.x);
      maxX = Math.max(maxX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxY = Math.max(maxY, node.position.y);
    }
  });

  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY
  };
}

function calculateAverageDistance(nodes: GraphNode[], edges: GraphEdge[]): number {
  if (edges.length === 0) return 0;

  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  let totalDistance = 0;
  let count = 0;

  edges.forEach(edge => {
    const source = nodeMap.get(edge.source);
    const target = nodeMap.get(edge.target);
    
    if (source?.position && target?.position) {
      const dx = source.position.x - target.position.x;
      const dy = source.position.y - target.position.y;
      totalDistance += Math.sqrt(dx * dx + dy * dy);
      count++;
    }
  });

  return count > 0 ? totalDistance / count : 0;
}

function calculateMinimumDistance(nodes: GraphNode[]): number {
  if (nodes.length < 2) return Infinity;
  
  let minDistance = Infinity;
  
  for (let i = 0; i < nodes.length - 1; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const node1 = nodes[i];
      const node2 = nodes[j];
      
      if (node1 && node2 && node1.position && node2.position) {
        const dx = node1.position.x - node2.position.x;
        const dy = node1.position.y - node2.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        minDistance = Math.min(minDistance, distance);
      }
    }
  }
  
  return minDistance;
}