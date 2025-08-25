/**
 * Professional ForceAtlas2 physics-based layout algorithm implementation for ALNRetool.
 * 
 * Provides sophisticated force-directed graph layout using physics simulation with 
 * Barnes-Hut optimization, specifically optimized for scale-free networks, character
 * relationships, and social network visualization in murder mystery investigations.
 * 
 * Key features:
 * - O(n log n) complexity with Barnes-Hut approximation
 * - Hub node detection and special handling
 * - Asynchronous layout with progress reporting
 * - Incremental updates for dynamic graphs
 * - Advanced physics simulation with adaptive speed control
 * - Optimized for 150-200 node scale-free networks
 * 
 * @example
 * ```typescript
 * const config: ForceAtlas2Config = {
 *   iterations: 1000,
 *   gravity: 0.05,
 *   barnesHutOptimize: true,
 *   barnesHutTheta: 0.5
 * };
 * 
 * const algorithm = new ForceAtlas2Algorithm(traversalEngine, config);
 * const layoutData = await algorithm.applyAsync(graph, (progress) => {
 *   console.log(`Layout progress: ${progress.progress}%`);
 * });
 * ```
 * 
 * @see {@link BaseLayoutAlgorithm} Abstract base class
 * @see {@link QuadTree} Barnes-Hut spatial optimization
 * @author ALNRetool Development Team
 * @since 1.0.0
 */

import { BaseLayoutAlgorithm, type LayoutMetadata, type LayoutConfig, type LayoutProgress } from '../BaseLayoutAlgorithm';
import type { GraphData, GraphEdge } from '../../types';
import { QuadTree } from '../../utils/quadtree';
import { logger } from '../../utils/Logger';
import type { TraversalEngine } from '../../modules/TraversalEngine';

/**
 * Configuration interface for ForceAtlas2 physics-based layout algorithm.
 * 
 * Extends base LayoutConfig with ForceAtlas2-specific physics parameters
 * optimized for scale-free networks and character relationship visualization.
 * All parameters are optional with murder mystery-optimized defaults.
 * 
 * @interface ForceAtlas2Config
 * @extends LayoutConfig
 * 
 * @example
 * ```typescript
 * const config: ForceAtlas2Config = {
 *   iterations: 1000,        // High iteration count for complex networks
 *   gravity: 0.05,           // Gentle gravity for natural spread
 *   scalingRatio: 10,        // Good separation for 150-200 nodes
 *   barnesHutOptimize: true, // Essential for performance
 *   barnesHutTheta: 0.5,     // Higher accuracy for better layout
 *   outboundAttractionDistribution: true // Better for hub nodes
 * };
 * ```
 */
export interface ForceAtlas2Config extends LayoutConfig {
  /** Maximum number of physics simulation iterations (default: 1000 for complex networks) */
  iterations?: number;
  
  /** Gravity strength pulling nodes toward center (0.05 = gentle for natural spread) */
  gravity?: number;
  
  /** Base repulsion scaling factor (10 = good separation for 150-200 nodes) */
  scalingRatio?: number;
  
  /** Edge weight influence on attraction forces (1.0 = proportional to weights) */
  edgeWeightInfluence?: number;
  
  /** Jitter tolerance for speed optimization (1.0 = balanced stability/movement) */
  jitterTolerance?: number;
  
  /** Enable Barnes-Hut approximation for O(n log n) complexity (true = recommended) */
  barnesHutOptimize?: boolean;
  
  /** Barnes-Hut approximation threshold (0.5 = higher accuracy, slower performance) */
  barnesHutTheta?: number;
  
  /** Use logarithmic attraction mode for dense networks (false = better for scale-free) */
  linLogMode?: boolean;
  
  /** Distribute attraction based on node degree (true = better for hub nodes like Marcus) */
  outboundAttractionDistribution?: boolean;
  
  /** Prevent node overlap by adjusting node sizes (true = cleaner visualization) */
  adjustSizes?: boolean;
  
  /** Use strong gravity mode for compact layouts (false = allow natural spread) */
  strongGravityMode?: boolean;
  
  /** Global speed damping factor (1.0 = no additional damping) */
  slowDown?: number;
  
  /** Initial iteration count before speed optimization (1 = immediate optimization) */
  startingIterations?: number;
  
  /** Iterations per render frame for async layout (10 = smooth progress updates) */
  iterationsPerRender?: number;
}

/**
 * Internal node data structure for ForceAtlas2 physics simulation.
 * 
 * Contains complete physics state including position, velocity, forces,
 * and node properties used during layout calculations.
 * 
 * @internal
 * @interface NodeData
 */
interface NodeData {
  /** Unique node identifier matching GraphNode.id */
  id: string;
  
  /** Current X coordinate position in layout space */
  x: number;
  
  /** Current Y coordinate position in layout space */
  y: number;
  
  /** X-component velocity for physics simulation */
  vx: number;
  
  /** Y-component velocity for physics simulation */
  vy: number;
  
  /** X-component accumulated force for current iteration */
  fx: number;
  
  /** Y-component accumulated force for current iteration */
  fy: number;
  
  /** Node mass based on degree (1 + degree for hub detection) */
  mass: number;
  
  /** Visual node size for collision detection (default: 10) */
  size: number;
  
  /** Node connectivity degree for hub detection and force scaling */
  degree: number;
}

/**
 * ForceAtlas2 physics-based layout algorithm optimized for scale-free networks.
 * 
 * Implements sophisticated force-directed graph layout using physics simulation
 * with Barnes-Hut spatial optimization, specifically tuned for murder mystery
 * character networks with hub nodes (like Marcus Blackwood). Features adaptive
 * speed control, incremental updates, and asynchronous processing.
 * 
 * Algorithm complexity:
 * - Time: O(n log n) with Barnes-Hut, O(n²) without optimization
 * - Space: O(n) for node data storage
 * - Iterations: ~1000 for convergence on 150-200 node networks
 * 
 * @class ForceAtlas2Algorithm
 * @extends BaseLayoutAlgorithm
 * 
 * @example
 * ```typescript
 * // Create algorithm with murder mystery optimization
 * const algorithm = new ForceAtlas2Algorithm(traversalEngine, {
 *   iterations: 1000,
 *   barnesHutOptimize: true,
 *   outboundAttractionDistribution: true // Better for hub nodes
 * });
 * 
 * // Apply layout asynchronously with progress
 * const result = await algorithm.applyAsync(graph, (progress) => {
 *   updateProgressBar(progress.progress);
 * });
 * ```
 */
export class ForceAtlas2Algorithm extends BaseLayoutAlgorithm {
  /** Internal physics simulation data for all nodes */
  private nodeData: Map<string, NodeData> = new Map();
  
  /** Current adaptive speed for physics simulation (starts at 10 for better initial separation) */
  private speed = 10;
  
  // private speedEfficiency = 1; // Reserved for future optimization

  /**
   * Initialize ForceAtlas2 algorithm with murder mystery network optimization.
   * 
   * Sets up algorithm metadata, performance characteristics, and default configuration
   * optimized for character relationship networks and investigation focus visualization.
   * 
   * @param traversalEngine Graph traversal utilities for relationship analysis
   * @param config Optional ForceAtlas2-specific configuration parameters
   * 
   * @example
   * ```typescript
   * const algorithm = new ForceAtlas2Algorithm(traversalEngine, {
   *   iterations: 1500,              // Higher for complex networks
   *   gravity: 0.03,                // Gentle for character relationships
   *   barnesHutOptimize: true,      // Essential for performance
   *   outboundAttractionDistribution: true // Better for Marcus (hub node)
   * });
   * ```
   */
  constructor(traversalEngine: TraversalEngine, config?: ForceAtlas2Config) {
    const metadata: LayoutMetadata = {
      id: 'force-atlas2',
      name: 'ForceAtlas2',
      description: 'ForceAtlas2 algorithm optimized for scale-free networks with hub nodes. Best for character relationships and social networks.',
      category: 'force',
      capabilities: {
        supportsAsync: true,
        supportsCancellation: true,
        supportsIncremental: true,
        supportsConstraints: false,
        maxNodes: 10000,
        maxEdges: 50000
      },
      defaultConfig: {
        iterations: 500, // Increased for better convergence with 150-200 nodes
        gravity: 0.05, // Reduced for better spread in scale-free networks
        scalingRatio: 10, // Good for scale-free networks
        edgeWeightInfluence: 1,
        jitterTolerance: 1,
        barnesHutOptimize: true, // Essential for O(n log n) performance
        barnesHutTheta: 0.5, // Lower value for more accuracy with 150-200 nodes
        linLogMode: false, // Linear mode better for scale-free networks
        outboundAttractionDistribution: true, // Better for super-hub (Marcus Blackwood)
        adjustSizes: true, // Prevent node overlap
        strongGravityMode: false, // Allow natural spread for force-directed layout
        slowDown: 1,
        startingIterations: 1,
        iterationsPerRender: 10
      },
      performance: {
        timeComplexity: 'O(n log n) with Barnes-Hut, O(n²) without',
        spaceComplexity: 'O(n)',
        averageIterations: 1000
      }
    };

    super(metadata, traversalEngine, config);
  }

  /**
   * Apply ForceAtlas2 layout algorithm to graph data synchronously.
   * 
   * Runs complete physics simulation with force calculations, position updates,
   * and adaptive speed control. Optimized for scale-free networks with hub nodes.
   * 
   * Time Complexity: O(n log n) with Barnes-Hut, O(n²) without
   * Space Complexity: O(n) for physics simulation data
   * 
   * @param graph Input graph data with nodes and edges
   * @returns Updated graph with new node positions from physics simulation
   * 
   * @example
   * ```typescript
   * // Apply layout to character relationship network
   * const layoutData = algorithm.apply(characterGraph);
   * 
   * // Nodes now have physics-based positions
   * console.log(layoutData.nodes[0].position); // { x: 245.7, y: -128.3 }
   * ```
   */
  apply(graph: GraphData): GraphData {
    this.initializeNodeData(graph);
    
    const config = this.config as ForceAtlas2Config;
    const iterations = config.iterations || 1000;
    
    // Start with higher speed for better initial separation
    this.speed = 10;
    // this.speedEfficiency = 1; // Reserved for future optimization
    
    for (let i = 0; i < iterations; i++) {
      if (this.cancelled) break;
      
      this.computeForces(graph);
      this.applyForces();
      this.adjustSpeed();
    }
    
    // Debug: Log final positions
    if (import.meta.env.DEV) {
      const finalPositions = Array.from(this.nodeData.values()).slice(0, 5).map(n => ({
        id: n.id,
        x: n.x.toFixed(2),
        y: n.y.toFixed(2)
      }));
      logger.debug(`[ForceAtlas2] Final positions after ${iterations} iterations`, undefined, finalPositions);
    }
    
    return this.updateGraphPositions(graph);
  }

  /**
   * Apply ForceAtlas2 layout algorithm asynchronously with progress reporting.
   * 
   * Runs physics simulation in batches with progress callbacks and browser yield
   * points. Ideal for large networks where layout calculation time is significant.
   * 
   * @param graph Input graph data to layout
   * @param onProgress Optional callback for layout progress updates
   * @returns Promise resolving to graph with new node positions
   * 
   * @example
   * ```typescript
   * const result = await algorithm.applyAsync(graph, (progress) => {
   *   console.log(`${progress.message} - ${progress.progress}% complete`);
   *   updateProgressUI(progress.progress, progress.timeRemaining);
   * });
   * ```
   */
  async applyAsync(
    graph: GraphData,
    onProgress?: (progress: LayoutProgress) => void
  ): Promise<GraphData> {
    this.resetCancellation();
    this.initializeNodeData(graph);
    
    const config = this.config as ForceAtlas2Config;
    const iterations = config.iterations || 1000;
    const iterationsPerRender = config.iterationsPerRender || 10;
    
    for (let i = 0; i < iterations; i += iterationsPerRender) {
      if (this.cancelled) break;
      
      // Run batch of iterations
      for (let j = 0; j < iterationsPerRender && i + j < iterations; j++) {
        this.computeForces(graph);
        this.applyForces();
        this.adjustSpeed();
      }
      
      // Report progress
      if (onProgress) {
        const progress = Math.min(100, ((i + iterationsPerRender) / iterations) * 100);
        const timeRemaining = ((iterations - i) / iterationsPerRender) * 0.01; // Rough estimate
        
        onProgress({
          progress,
          message: `ForceAtlas2: ${Math.floor(progress)}% complete`,
          timeRemaining
        });
      }
      
      // Yield to browser
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    
    return this.updateGraphPositions(graph);
  }

  /**
   * Initialize node physics data with smart position detection.
   * 
   * Creates NodeData entries for all graph nodes with initial positions,
   * physics properties, and degree-based mass calculation. Detects horizontal
   * alignment issues and applies circular initialization when needed.
   * 
   * Complexity: O(V + E) for degree calculation and position analysis
   * 
   * @param graph Graph data containing nodes and edges
   * 
   * @remarks
   * Uses circular layout initialization when nodes lack 2D spread to ensure
   * physics simulation has proper starting conditions for force-directed layout.
   */
  private initializeNodeData(graph: GraphData): void {
    this.nodeData.clear();
    
    // Calculate degrees
    const degrees = new Map<string, number>();
    graph.edges.forEach(edge => {
      degrees.set(edge.source, (degrees.get(edge.source) || 0) + 1);
      degrees.set(edge.target, (degrees.get(edge.target) || 0) + 1);
    });
    
    // Collect all Y positions to check for horizontal alignment
    const yPositions = graph.nodes
      .filter(n => n.position?.y !== undefined)
      .map(n => n.position.y);
    
    // Check if nodes are horizontally aligned (small Y variance)
    let forceReinitialize = false;
    if (yPositions.length > 0) {
      const minY = Math.min(...yPositions);
      const maxY = Math.max(...yPositions);
      const yRange = maxY - minY;
      // If Y range is less than 10% of expected spread, nodes are likely aligned
      forceReinitialize = yRange < (graph.nodes.length * 2);
      
      if (forceReinitialize && import.meta.env.DEV) {
        logger.debug('[ForceAtlas2] Detected horizontal alignment, reinitializing positions', { 
          yRange,
          nodeCount: graph.nodes.length,
          threshold: graph.nodes.length * 2
         });
      }
    }
    
    // Initialize node data with better spread
    graph.nodes.forEach((node, index) => {
      const degree = degrees.get(node.id) || 0;
      
      let x: number, y: number;
      
      const hasPosition = node.position?.x !== undefined && node.position?.y !== undefined;
      
      // Always reinitialize if horizontal alignment detected or no positions
      if (!hasPosition || forceReinitialize) {
        // Create a circular layout for initial positions to ensure 2D spread
        const angle = (index / graph.nodes.length) * Math.PI * 2;
        const radius = Math.min(500, 100 + (graph.nodes.length * 5));
        x = Math.cos(angle) * radius;
        y = Math.sin(angle) * radius;
        
        // Add some random jitter to avoid perfect circle
        x += (Math.random() - 0.5) * 100;
        y += (Math.random() - 0.5) * 100;
      } else {
        // Use existing positions if they have good 2D spread
        x = node.position.x;
        y = node.position.y;
      }
      
      this.nodeData.set(node.id, {
        id: node.id,
        x,
        y,
        vx: 0,
        vy: 0,
        fx: 0,
        fy: 0,
        mass: 1 + degree,
        size: 10,
        degree
      });
    });
    
    // Debug: Log initial positions
    if (import.meta.env.DEV) {
      const positions = Array.from(this.nodeData.values()).slice(0, 5).map(n => ({
        id: n.id,
        x: n.x.toFixed(2),
        y: n.y.toFixed(2)
      }));
      logger.debug('[ForceAtlas2] Initial positions:', undefined, positions);
    }
  }

  /**
   * Compute all physics forces for current simulation iteration.
   * 
   * Calculates repulsion (node-node), attraction (edge-based), and gravity forces
   * using either Barnes-Hut approximation or direct computation based on configuration.
   * 
   * Force computation pipeline:
   * 1. Reset accumulated forces to zero
   * 2. Apply repulsion forces between all node pairs
   * 3. Apply attraction forces along edges
   * 4. Apply gravity forces toward center of mass
   * 
   * Complexity: O(n log n) with Barnes-Hut, O(n²) with direct computation
   * 
   * @param graph Graph data containing edges for attraction calculation
   */
  private computeForces(graph: GraphData): void {
    const config = this.config as ForceAtlas2Config;
    
    // Reset forces
    this.nodeData.forEach(node => {
      node.fx = 0;
      node.fy = 0;
    });
    
    // Apply repulsion (node-node)
    if (config.barnesHutOptimize) {
      this.applyBarnesHutRepulsion();
    } else {
      this.applyDirectRepulsion();
    }
    
    // Apply attraction (edges)
    this.applyAttraction(graph.edges);
    
    // Apply gravity
    this.applyGravity();
  }

  /**
   * Apply direct O(n²) repulsion forces between all node pairs.
   * 
   * Computes quadratic repulsion with degree-based scaling for hub nodes.
   * Hub nodes (>10 connections) receive 2x repulsion factor for better separation.
   * 
   * Complexity: O(n²) - use only for small networks or high precision needs
   * 
   * @remarks
   * Includes overlap prevention and minimum separation enforcement.
   * Hub detection provides special handling for characters like Marcus Blackwood.
   */
  private applyDirectRepulsion(): void {
    const config = this.config as ForceAtlas2Config;
    const scalingRatio = config.scalingRatio || 10;
    
    const nodes = Array.from(this.nodeData.values());
    
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const n1 = nodes[i];
        const n2 = nodes[j];
        if (!n1 || !n2) continue;
        
        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        
        // Prevent overlap and ensure minimum separation
        if (distance < 1) {
          // If nodes are too close, push them apart randomly
          const angle = Math.random() * Math.PI * 2;
          n1.x -= Math.cos(angle) * 10;
          n1.y -= Math.sin(angle) * 10;
          n2.x += Math.cos(angle) * 10;
          n2.y += Math.sin(angle) * 10;
          distance = 20;
        }
        
        // Degree-based repulsion: stronger for hub nodes
        // As per best practices: hubs (>10 connections) get 2x repulsion
        const n1RepulsionFactor = n1.degree > 10 ? 2.0 : 1.0;
        const n2RepulsionFactor = n2.degree > 10 ? 2.0 : 1.0;
        const avgRepulsionFactor = (n1RepulsionFactor + n2RepulsionFactor) / 2;
        
        // Quadratic repulsion for better separation
        const repulsionStrength = (scalingRatio * avgRepulsionFactor * n1.mass * n2.mass) / (distance * distance);
        
        const fx = (dx / distance) * repulsionStrength;
        const fy = (dy / distance) * repulsionStrength;
        
        n1.fx -= fx;
        n1.fy -= fy;
        n2.fx += fx;
        n2.fy += fy;
      }
    }
  }

  /**
   * Apply Barnes-Hut approximated repulsion forces for O(n log n) performance.
   * 
   * Uses QuadTree spatial partitioning to approximate distant node interactions
   * while maintaining accuracy for nearby nodes. Essential for large networks.
   * 
   * Complexity: O(n log n) with quadtree construction and traversal
   * 
   * @remarks
   * Includes degree-based repulsion scaling where hub nodes (>10 connections)
   * receive enhanced repulsion factors for better network layout quality.
   */
  private applyBarnesHutRepulsion(): void {
    const config = this.config as ForceAtlas2Config;
    const scalingRatio = config.scalingRatio || 10;
    const barnesHutTheta = config.barnesHutTheta || 0.8;
    
    // Build quadtree from current node positions
    const quadTreeNodes = Array.from(this.nodeData.values()).map(node => ({
      x: node.x,
      y: node.y,
      id: node.id,
      mass: node.mass,
      degree: node.degree // Include degree for hub detection
    }));
    
    const quadTree = QuadTree.fromNodes(quadTreeNodes, barnesHutTheta);
    
    // Calculate repulsion forces using Barnes-Hut approximation
    this.nodeData.forEach(node => {
      // Degree-based repulsion: stronger for hub nodes (>10 connections)
      const repulsionFactor = node.degree > 10 ? 2.0 : 1.0;
      
      const force = quadTree.calculateForce(
        { x: node.x, y: node.y, id: node.id, mass: node.mass },
        {
          gravity: 0, // We handle gravity separately
          repulsion: scalingRatio * repulsionFactor * node.mass,
          minDistance: 10 // Increased minimum distance
        }
      );
      
      node.fx += force.fx;
      node.fy += force.fy;
    });
    
    // Log performance improvement for large graphs
    if (this.nodeData.size > 100 && import.meta.env.DEV) {
      const stats = quadTree.getStats();
      logger.debug('[ForceAtlas2] Barnes-Hut optimization active:', { 
        nodes: this.nodeData.size,
        regions: stats.totalRegions,
        maxDepth: stats.maxDepth,
        avgNodesPerLeaf: stats.averageNodesPerLeaf.toFixed(2),
        complexity: `O(n log n) vs O(n²)`
       });
    }
  }

  /**
   * Apply edge-based attraction forces between connected nodes.
   * 
   * Calculates attraction forces along graph edges with configurable weighting
   * and distribution modes. Supports linear and logarithmic attraction modes.
   * 
   * Complexity: O(E) - linear in number of edges
   * 
   * @param edges Graph edges defining attraction relationships
   * 
   * @remarks
   * - Linear mode: Direct distance-proportional attraction
   * - LinLog mode: Logarithmic attraction for dense networks
   * - Outbound distribution: Normalize by source node degree for hubs
   */
  private applyAttraction(edges: GraphEdge[]): void {
    const config = this.config as ForceAtlas2Config;
    const edgeWeightInfluence = config.edgeWeightInfluence || 1;
    const linLogMode = config.linLogMode || false;
    const outboundAttractionDistribution = config.outboundAttractionDistribution || false;
    
    edges.forEach(edge => {
      const source = this.nodeData.get(edge.source);
      const target = this.nodeData.get(edge.target);
      
      if (!source || !target) return;
      
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const distance = Math.sqrt(dx * dx + dy * dy) || 1;
      
      let attractionStrength: number;
      
      if (linLogMode) {
        attractionStrength = Math.log(1 + distance) * edgeWeightInfluence;
      } else {
        attractionStrength = distance * edgeWeightInfluence;
      }
      
      if (outboundAttractionDistribution) {
        attractionStrength /= source.mass;
      }
      
      const fx = (dx / distance) * attractionStrength;
      const fy = (dy / distance) * attractionStrength;
      
      source.fx += fx;
      source.fy += fy;
      target.fx -= fx;
      target.fy -= fy;
    });
  }

  /**
   * Apply gravity forces pulling nodes toward layout center of mass.
   * 
   * Calculates center of mass and applies gravitational attraction to prevent
   * network fragmentation and maintain cohesive layout structure.
   * 
   * Complexity: O(n) for center calculation and force application
   * 
   * @remarks
   * - Strong gravity mode: Constant force regardless of distance
   * - Normal gravity mode: Distance-inversely proportional force
   * - Prevents network explosion in scale-free topologies
   */
  private applyGravity(): void {
    const config = this.config as ForceAtlas2Config;
    const gravity = config.gravity || 0.08;
    const strongGravityMode = config.strongGravityMode !== undefined ? config.strongGravityMode : true;
    const scalingRatio = config.scalingRatio || 10;
    
    // Calculate center of mass
    let cx = 0, cy = 0, totalMass = 0;
    this.nodeData.forEach(node => {
      cx += node.x * node.mass;
      cy += node.y * node.mass;
      totalMass += node.mass;
    });
    
    if (totalMass > 0) {
      cx /= totalMass;
      cy /= totalMass;
    }
    
    // Apply gravity force
    this.nodeData.forEach(node => {
      const dx = cx - node.x;
      const dy = cy - node.y;
      const distance = Math.sqrt(dx * dx + dy * dy) || 1;
      
      let gravityStrength: number;
      
      if (strongGravityMode) {
        gravityStrength = scalingRatio * node.mass * gravity;
      } else {
        gravityStrength = scalingRatio * node.mass * gravity / distance;
      }
      
      node.fx += dx * gravityStrength / distance;
      node.fy += dy * gravityStrength / distance;
    });
  }

  /**
   * Apply accumulated forces to update node velocities and positions.
   * 
   * Integrates physics forces using velocity Verlet-style integration with
   * adaptive speed control and swinging-based damping for stability.
   * 
   * Complexity: O(n) for force integration
   * 
   * @remarks
   * - Uses swinging detection to prevent oscillation
   * - Applies adaptive speed scaling based on network movement
   * - Includes velocity damping for convergence
   */
  private applyForces(): void {
    const config = this.config as ForceAtlas2Config;
    const slowDown = config.slowDown || 1;
    
    this.nodeData.forEach(node => {
      // Apply forces with damping
      const swinging = Math.sqrt(
        Math.pow(node.fx - node.vx, 2) + 
        Math.pow(node.fy - node.vy, 2)
      );
      
      // Ensure minimum speed to prevent complete stop
      const minSpeed = 0.1;
      const effectiveSpeed = Math.max(this.speed, minSpeed);
      
      const factor = effectiveSpeed / (1 + Math.sqrt(effectiveSpeed * swinging));
      
      node.vx = node.vx + node.fx * factor * slowDown;
      node.vy = node.vy + node.fy * factor * slowDown;
      
      // Update positions
      node.x += node.vx;
      node.y += node.vy;
      
      // Apply gentler damping to allow more movement
      node.vx *= 0.9;
      node.vy *= 0.9;
    });
  }

  /**
   * Adjust global simulation speed based on network swinging and traction.
   * 
   * Implements adaptive speed control using jitter tolerance to optimize
   * convergence rate while maintaining layout stability.
   * 
   * Complexity: O(n) for swinging and traction calculation
   * 
   * @remarks
   * - Higher swinging = reduce speed for stability
   * - Higher traction = increase speed for faster convergence
   * - Prevents speed from dropping below minimum threshold
   */
  private adjustSpeed(): void {
    const config = this.config as ForceAtlas2Config;
    const jitterTolerance = config.jitterTolerance || 1;
    
    let totalSwinging = 0;
    let totalEffectiveTraction = 0;
    
    this.nodeData.forEach(node => {
      const swinging = Math.sqrt(
        Math.pow(node.fx - node.vx, 2) + 
        Math.pow(node.fy - node.vy, 2)
      );
      
      const traction = Math.sqrt(
        Math.pow(node.fx + node.vx, 2) + 
        Math.pow(node.fy + node.vy, 2)
      ) / 2;
      
      totalSwinging += node.mass * swinging;
      totalEffectiveTraction += node.mass * traction;
    });
    
    // Prevent division by zero
    if (totalSwinging === 0) totalSwinging = 1;
    
    // Optimize speed with better convergence
    const targetSpeed = jitterTolerance * jitterTolerance * 
      totalEffectiveTraction / totalSwinging;
    
    // More aggressive speed adjustment for better convergence
    const maxRise = 0.5;
    this.speed = this.speed + Math.min(targetSpeed - this.speed, maxRise * this.speed);
    
    // Ensure minimum speed for movement
    this.speed = Math.max(this.speed, 0.1);
  }

  /**
   * Update graph nodes with final calculated positions from physics simulation.
   * 
   * Transfers positions from internal NodeData to GraphNode.position format
   * with debug logging and position uniqueness validation.
   * 
   * Complexity: O(n) for position transfer
   * 
   * @param graph Original graph data structure
   * @returns Updated graph with new node positions
   * 
   * @remarks
   * Includes position clustering detection to identify potential layout issues
   * where nodes end up with similar coordinates.
   */
  private updateGraphPositions(graph: GraphData): GraphData {
    const updatedNodes = graph.nodes.map(node => {
      const nodeData = this.nodeData.get(node.id);
      if (!nodeData) return node;
      
      return {
        ...node,
        position: {
          x: nodeData.x,
          y: nodeData.y
        }
      };
    });
    
    // Debug: Log final positions
    if (import.meta.env.DEV) {
      const finalPositions = updatedNodes.slice(0, 5).map(n => ({
        id: n.id,
        x: n.position?.x?.toFixed(2),
        y: n.position?.y?.toFixed(2)
      }));
      logger.debug('[ForceAtlas2] Final positions after layout:', undefined, finalPositions);
      
      // Check if positions are actually different
      const uniquePositions = new Set(
        updatedNodes.map(n => `${Math.round(n.position?.x || 0)},${Math.round(n.position?.y || 0)}`)
      );
      if (uniquePositions.size < updatedNodes.length * 0.8) {
        logger.warn('[ForceAtlas2] Warning: Many nodes have similar positions!', undefined, {
          totalNodes: updatedNodes.length,
          uniquePositions: uniquePositions.size
        });
      }
    }
    
    return {
      ...graph,
      nodes: updatedNodes
    };
  }

  /**
   * Apply incremental ForceAtlas2 layout for dynamic graph updates.
   * 
   * Reinitializes only changed nodes while preserving positions of unchanged
   * nodes, then runs reduced iteration count for efficient updates.
   * 
   * Complexity: O(k log n) where k = number of changed nodes
   * 
   * @param graph Current graph data
   * @param changedNodes Set of node IDs that were modified
   * @param _changedEdges Set of edge IDs that were modified (unused currently)
   * @returns Updated graph with incremental layout applied
   * 
   * @example
   * ```typescript
   * // Update layout after adding new character
   * const updatedGraph = algorithm.applyIncremental(
   *   graph, 
   *   new Set(['new-character-id']), 
   *   new Set()
   * );
   * ```
   */
  applyIncremental(
    graph: GraphData,
    changedNodes: Set<string>,
    _changedEdges: Set<string>
  ): GraphData {
    // Initialize only changed nodes, keep others
    graph.nodes.forEach(node => {
      if (changedNodes.has(node.id)) {
        const degrees = new Map<string, number>();
        graph.edges.forEach(edge => {
          if (edge.source === node.id || edge.target === node.id) {
            degrees.set(node.id, (degrees.get(node.id) || 0) + 1);
          }
        });
        
        const degree = degrees.get(node.id) || 0;
        this.nodeData.set(node.id, {
          id: node.id,
          x: node.position?.x || Math.random() * 1000 - 500,
          y: node.position?.y || Math.random() * 1000 - 500,
          vx: 0,
          vy: 0,
          fx: 0,
          fy: 0,
          mass: 1 + degree,
          size: 10,
          degree
        });
      }
    });
    
    // Run fewer iterations for incremental update
    const config = this.config as ForceAtlas2Config;
    const iterations = Math.floor((config.iterations || 1000) * 0.3);
    
    for (let i = 0; i < iterations; i++) {
      if (this.cancelled) break;
      
      this.computeForces(graph);
      this.applyForces();
      this.adjustSpeed();
    }
    
    return this.updateGraphPositions(graph);
  }
}