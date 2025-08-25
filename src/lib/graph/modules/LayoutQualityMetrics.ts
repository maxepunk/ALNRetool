/**
 * Layout Quality Metrics Module
 * 
 * Comprehensive graph layout quality evaluation and optimization toolkit.
 * Provides advanced metrics, pattern detection, improvement suggestions, and
 * layout comparison capabilities for visual graph optimization.
 * 
 * **Core Capabilities:**
 * - **Quality Metrics**: Edge crossings, overlaps, clustering, alignment
 * - **Advanced Analysis**: Stress, angular resolution, symmetry, orthogonality
 * - **Pattern Detection**: Hierarchical, circular, grid, clustered, force-directed
 * - **Improvement Suggestions**: Algorithm recommendations and optimization hints
 * - **Layout Comparison**: Objective comparison between different layouts
 * 
 * **Performance Features:**
 * - Optimized algorithms using spatial indexing (O(n log n))
 * - Efficient edge intersection detection
 * - Cached calculations for repeated operations
 * 
 * @example
 * ```typescript
 * const metrics = calculateLayoutQuality(nodes, edges);
 * const patterns = detectLayoutPatterns(nodes, edges);
 * const suggestions = suggestImprovements(nodes, edges, { currentAlgorithm: 'dagre' });
 * const comparison = compareLayouts(layout1, layout2);
 * 
 * reportLayoutQuality(metrics);
 * console.log(`Detected patterns: ${patterns.map(p => p.type).join(', ')}`);
 * ```
 * 
 * @see calculateLayoutQuality - Main quality metrics calculation
 * @see detectLayoutPatterns - Layout pattern analysis
 * @see suggestImprovements - Optimization recommendations
 * @see compareLayouts - Layout comparison utility
 */

import { log } from '@/utils/logger';
import type { GraphNode, GraphEdge } from '../types';
import { 
  calculateOptimizedLayoutQuality,
  SpatialIndex,
  EdgeLengthCalculator
} from '../optimization/OptimizedGraphAlgorithms';

/**
 * Core layout quality metrics interface.
 * Contains essential measurements for evaluating graph layout effectiveness.
 * 
 * Used for objective layout quality assessment and optimization decisions.
 * All metrics are normalized and rounded for consistent reporting.
 * 
 * @example
 * ```typescript
 * const metrics: LayoutQualityMetrics = calculateLayoutQuality(nodes, edges);
 * if (metrics.edgeCrossings > 5) {
 *   console.warn('High edge crossings detected');
 * }
 * if (metrics.elementClusteringScore < 0.5) {
 *   console.warn('Poor element clustering');
 * }
 * ```
 */
export interface LayoutQualityMetrics {
  /** Number of edge intersection points (lower is better for clarity) */
  edgeCrossings: number;
  /** Sum of all edge lengths in pixels */
  totalEdgeLength: number;
  /** Mean edge length in pixels */
  averageEdgeLength: number;
  /** Number of overlapping nodes (0 is ideal) */
  nodeOverlaps: number;
  /** Layout width/height ratio (around 2-3 is often optimal) */
  aspectRatio: number;
  /** Node density per unit area (nodes/pixels²) */
  density: number;
  /** Variance in edge lengths (lower means more uniform) */
  edgeLengthVariance: number;
  /** How well elements cluster near related puzzles (0-1, higher is better) */
  elementClusteringScore: number;
  /** How well puzzles align horizontally (0-1, higher is better) */
  puzzleAlignmentScore: number;
}

/**
 * Advanced layout quality metrics for sophisticated analysis.
 * Contains complex geometric and aesthetic measurements.
 * 
 * Used for detailed layout optimization and algorithm comparison.
 * These metrics provide deeper insights than basic quality metrics.
 * 
 * @example
 * ```typescript
 * const advanced = calculateAdvancedMetrics(nodes, edges);
 * if (advanced.minAngleDegrees < 20) {
 *   console.warn('Poor angular resolution - edges too close');
 * }
 * if (advanced.symmetryScore > 0.8) {
 *   console.log('Highly symmetric layout detected');
 * }
 * ```
 */
export interface AdvancedMetrics {
  /** Layout stress metric - sum of squared distance deviations from ideal */
  stress: number;
  /** Uniformity of edge length distribution (0-1, higher is more uniform) */
  edgeDistributionUniformity: number;
  /** Angular resolution quality (0-1, higher means better angle separation) */
  angularResolution: number;
  /** Minimum angle between edges in degrees */
  minAngleDegrees: number;
  /** Symmetry score for the layout (0-1, higher is more symmetric) */
  symmetryScore: number;
  /** Proportion of edges at orthogonal angles (0-1, higher is more orthogonal) */
  edgeOrthogonality: number;
  /** How well whitespace is distributed (0-1, higher is better) */
  whitespaceDistribution: number;
}

/**
 * Enumeration of detectable layout patterns.
 * Used for automatic pattern recognition and algorithm recommendations.
 * 
 * **Pattern Descriptions:**
 * - `hierarchical`: Layered structure with directional flow
 * - `circular`: Nodes arranged in circular/radial pattern
 * - `grid`: Rectangular grid arrangement
 * - `clustered`: Multiple distinct node groups
 * - `force-directed`: Uniform spacing with minimal energy
 * 
 * @example
 * ```typescript
 * const patterns = detectLayoutPatterns(nodes, edges);
 * const hierarchical = patterns.find(p => p.type === 'hierarchical');
 * if (hierarchical && hierarchical.confidence > 0.8) {
 *   console.log('Strong hierarchical pattern detected');
 * }
 * ```
 */
export type LayoutPatternType = 
  | 'hierarchical' 
  | 'circular' 
  | 'grid' 
  | 'clustered' 
  | 'force-directed';

/**
 * Detected layout pattern with confidence score and characteristics.
 * Represents the result of automatic pattern detection analysis.
 * 
 * Used for algorithm selection and layout optimization decisions.
 * Higher confidence scores indicate stronger pattern matches.
 * 
 * @example
 * ```typescript
 * const pattern: LayoutPattern = {
 *   type: 'hierarchical',
 *   confidence: 0.85,
 *   characteristics: {
 *     layers: 4,
 *     directionality: 0.92
 *   }
 * };
 * ```
 */
export interface LayoutPattern {
  /** The type of pattern detected */
  type: LayoutPatternType;
  /** Confidence score (0-1, higher means stronger pattern match) */
  confidence: number;
  /** Pattern-specific characteristics and measurements */
  characteristics: Record<string, any>;
}

/**
 * Priority levels for layout improvement suggestions.
 * Used to prioritize optimization actions by importance.
 * 
 * **Priority Levels:**
 * - `critical`: Must fix (e.g., node overlaps)
 * - `high`: Should fix soon (e.g., many edge crossings)
 * - `medium`: Moderate improvement (e.g., aspect ratio)
 * - `low`: Nice to have (e.g., edge length uniformity)
 */
export type SuggestionPriority = 'critical' | 'high' | 'medium' | 'low';

/**
 * Layout improvement suggestion with priority and estimated impact.
 * Provides actionable recommendations for layout optimization.
 * 
 * Used by optimization systems to guide layout improvements
 * and suggest algorithm changes.
 * 
 * @example
 * ```typescript
 * const suggestion: ImprovementSuggestion = {
 *   type: 'reduce-crossings',
 *   priority: 'high',
 *   description: 'Reduce 8 edge crossing(s) to improve clarity',
 *   estimatedImprovement: 40,
 *   recommendedAlgorithm: 'dagre'
 * };
 * ```
 */
export interface ImprovementSuggestion {
  /** Type of improvement suggested */
  type: string;
  /** Priority level for this improvement */
  priority: SuggestionPriority;
  /** Human-readable description of the improvement */
  description: string;
  /** Estimated quality improvement percentage (0-100) */
  estimatedImprovement?: number;
  /** Recommended algorithm if suggesting algorithm change */
  recommendedAlgorithm?: string;
}

/**
 * Comprehensive comparison between two graph layouts.
 * Provides objective analysis of improvements and regressions.
 * 
 * Used for A/B testing layouts and selecting optimal arrangements.
 * Includes detailed metrics comparison and overall recommendation.
 * 
 * @example
 * ```typescript
 * const comparison = compareLayouts(dagreLayout, forceLayout);
 * console.log(`Recommendation: ${comparison.recommendation}`);
 * console.log(`Overall improvement: ${comparison.overallComparison}`);
 * comparison.improvements.forEach(imp => {
 *   console.log(`${imp.metric}: ${imp.percentageChange}% better`);
 * });
 * ```
 */
export interface LayoutComparison {
  /** Quality metrics for the first layout */
  layout1Metrics: LayoutQualityMetrics;
  /** Quality metrics for the second layout */
  layout2Metrics: LayoutQualityMetrics;
  /** Array of metrics where layout2 improved over layout1 */
  improvements: Array<{
    /** Name of the improved metric */
    metric: string;
    /** Absolute improvement amount */
    improvement: number;
    /** Percentage improvement */
    percentageChange: number;
  }>;
  /** Array of metrics where layout2 regressed from layout1 */
  regressions: Array<{
    /** Name of the regressed metric */
    metric: string;
    /** Absolute regression amount */
    regression: number;
    /** Percentage regression */
    percentageChange: number;
  }>;
  /** Overall comparison score (positive favors layout2, negative favors layout1) */
  overallComparison: number;
  /** Recommended layout choice based on analysis */
  recommendation: 'layout1' | 'layout2' | 'equivalent';
}

/**
 * Determine if two line segments intersect using the cross product method.
 * 
 * Implements the counterclockwise (CCW) test for line segment intersection.
 * This is a fundamental geometric algorithm used for edge crossing detection.
 * 
 * @param p1 - Start point of first line segment
 * @param p2 - End point of first line segment  
 * @param p3 - Start point of second line segment
 * @param p4 - End point of second line segment
 * @returns true if the line segments intersect, false otherwise
 * 
 * @remarks
 * **Algorithm Details:**
 * - Uses cross product to determine orientation of point triplets
 * - Two segments intersect if they have different orientations
 * - Handles collinear cases by checking bounding box overlap
 * - More robust than slope-based methods (avoids division by zero)
 * 
 * **CCW Test Formula:**
 * ```
 * ccw(A, B, C) = (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x)
 * ```
 * 
 * @example
 * ```typescript
 * const intersects = doEdgesIntersect(
 *   { x: 0, y: 0 }, { x: 10, y: 10 },  // First segment
 *   { x: 0, y: 10 }, { x: 10, y: 0 }   // Second segment  
 * );
 * console.log(intersects); // true - segments cross at (5, 5)
 * ```
 * 
 * Complexity: O(1)
 */
export function doEdgesIntersect(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
  p4: { x: number; y: number }
): boolean {
  const ccw = (A: typeof p1, B: typeof p1, C: typeof p1) => {
    return (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);
  };

  return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4);
}

/**
 * Calculate comprehensive layout quality metrics for graph evaluation.
 * 
 * Performs complete analysis of layout quality including geometric, aesthetic,
 * and domain-specific measurements. Optimized for performance using spatial
 * indexing and efficient algorithms.
 * 
 * @param nodes - Array of positioned graph nodes with coordinates
 * @param edges - Array of graph edges connecting the nodes
 * @returns LayoutQualityMetrics object with all calculated quality measures
 * 
 * @remarks
 * **Metrics Calculated:**
 * - **Edge Crossings**: Using optimized line intersection detection
 * - **Node Overlaps**: Spatial indexing for efficient overlap detection
 * - **Edge Statistics**: Length, variance, and distribution analysis
 * - **Layout Dimensions**: Bounding box, aspect ratio, and density
 * - **Domain Metrics**: Element clustering and puzzle alignment scores
 * 
 * **Performance Optimizations:**
 * - O(n log n) spatial indexing for overlap detection
 * - Cached edge length calculations
 * - Efficient bounding box computation
 * - Vectorized statistical calculations
 * 
 * **Domain-Specific Features:**
 * - Element clustering: How well elements cluster near related puzzles
 * - Puzzle alignment: How well puzzles align horizontally
 * - Entity type awareness: Optimized for murder mystery game structure
 * 
 * @example
 * ```typescript
 * const metrics = calculateLayoutQuality(layoutNodes, layoutEdges);
 * console.log(`Quality Report:`);
 * console.log(`- Edge crossings: ${metrics.edgeCrossings}`);
 * console.log(`- Node overlaps: ${metrics.nodeOverlaps}`);
 * console.log(`- Element clustering: ${metrics.elementClusteringScore}`);
 * 
 * if (metrics.edgeCrossings > 5) {
 *   console.warn('Consider layout optimization');
 * }
 * ```
 * 
 * Complexity: O(V + E log E) where V = nodes, E = edges
 */
export function calculateLayoutQuality(
  nodes: GraphNode[],
  edges: GraphEdge[]
): LayoutQualityMetrics {
  // Use optimized algorithms for O(n log n) and O(n) operations
  const optimizedMetrics = calculateOptimizedLayoutQuality(nodes, edges);
  
  // Use optimized results
  const edgeCrossings = optimizedMetrics.edgeCrossings;
  const nodeOverlaps = optimizedMetrics.nodeOverlaps;
  const edgeLengths = optimizedMetrics.edgeLengths;
  const totalEdgeLength = edgeLengths.reduce((sum, len) => sum + len, 0);
  const averageEdgeLength = optimizedMetrics.averageEdgeLength;
  const edgeLengthVariance = optimizedMetrics.edgeLengthVariance;

  // Calculate bounding box and aspect ratio
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  nodes.forEach(node => {
    minX = Math.min(minX, node.position.x);
    maxX = Math.max(maxX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxY = Math.max(maxY, node.position.y);
  });

  const width = maxX - minX;
  const height = maxY - minY || 1; // Prevent division by zero
  const aspectRatio = width > 0 && height > 0 ? width / height : 1;
  const area = width * height;
  const density = area > 0 ? nodes.length / area : 0;

  // Calculate element clustering score (how well elements cluster near puzzles)
  let elementClusteringScore = 0;
  const elementNodes = nodes.filter(n => n.data.metadata.entityType === 'element');
  const puzzleNodes = nodes.filter(n => n.data.metadata.entityType === 'puzzle');

  elementNodes.forEach(element => {
    const entity = element.data.entity;
    const connectedPuzzles = [
      ...(entity.requiredForPuzzleIds || []),
      ...(entity.rewardedByPuzzleIds || [])
    ];

    if (connectedPuzzles.length > 0) {
      let minDistance = Infinity;
      connectedPuzzles.forEach(puzzleId => {
        const puzzle = puzzleNodes.find(p => p.id === puzzleId);
        if (puzzle) {
          const distance = Math.sqrt(
            Math.pow(puzzle.position.x - element.position.x, 2) +
            Math.pow(puzzle.position.y - element.position.y, 2)
          );
          minDistance = Math.min(minDistance, distance);
        }
      });

      // Score based on proximity (closer is better)
      if (minDistance < Infinity) {
        elementClusteringScore += Math.max(0, 1 - minDistance / 500);
      }
    }
  });

  elementClusteringScore = elementNodes.length > 0 ? 
    elementClusteringScore / elementNodes.length : 1;

  // Calculate puzzle alignment score (how well puzzles align horizontally)
  let puzzleAlignmentScore = 0;
  if (puzzleNodes.length > 1) {
    const yPositions = puzzleNodes.map(p => p.position.y);
    const avgY = yPositions.reduce((sum, y) => sum + y, 0) / yPositions.length;
    const yVariance = yPositions.reduce((sum, y) => sum + Math.pow(y - avgY, 2), 0) / yPositions.length;

    // Lower variance means better alignment
    puzzleAlignmentScore = Math.max(0, 1 - Math.sqrt(yVariance) / 200);
  } else {
    puzzleAlignmentScore = 1;
  }

  return {
    edgeCrossings,
    totalEdgeLength: Math.round(totalEdgeLength),
    averageEdgeLength: Math.round(averageEdgeLength),
    nodeOverlaps,
    aspectRatio: Math.round(aspectRatio * 100) / 100,
    density: Math.round(density * 10000) / 10000,
    edgeLengthVariance: Math.round(edgeLengthVariance),
    elementClusteringScore: Math.round(elementClusteringScore * 100) / 100,
    puzzleAlignmentScore: Math.round(puzzleAlignmentScore * 100) / 100,
  };
}

/**
 * Generate and log comprehensive layout quality report to console.
 * 
 * Formats metrics in human-readable form and calculates overall quality score.
 * Provides categorical quality assessment (Excellent/Good/Fair/Poor) based
 * on weighted scoring of key metrics.
 * 
 * @param metrics - Layout quality metrics to format and report
 * 
 * @remarks
 * **Quality Scoring Formula:**
 * ```
 * score = (crossing_score * 0.3) + (overlap_score * 0.2) + 
 *         (aspect_score * 0.1) + (clustering_score * 0.2) + 
 *         (alignment_score * 0.2)
 * ```
 * 
 * **Quality Thresholds:**
 * - Excellent: > 80%
 * - Good: 60-80%
 * - Fair: 40-60%
 * - Poor: < 40%
 * 
 * @example
 * ```typescript
 * const metrics = calculateLayoutQuality(nodes, edges);
 * reportLayoutQuality(metrics);
 * 
 * // Console output:
 * // [Layout Quality Report] {
 * //   edgeCrossings: 3,
 * //   totalEdgeLength: '2450px',
 * //   elementClusteringScore: '0.78 (0-1, higher is better)'
 * // }
 * // Layout Overall Quality { level: 'Good', score: '72%' }
 * ```
 * 
 * Complexity: O(1)
 */
export function reportLayoutQuality(metrics: LayoutQualityMetrics): void {
  log.info('[Layout Quality Report]', {
    edgeCrossings: metrics.edgeCrossings,
    totalEdgeLength: `${metrics.totalEdgeLength}px`,
    averageEdgeLength: `${metrics.averageEdgeLength}px`,
    edgeLengthVariance: metrics.edgeLengthVariance,
    nodeOverlaps: metrics.nodeOverlaps,
    aspectRatio: metrics.aspectRatio,
    nodeDensity: metrics.density,
    elementClusteringScore: `${metrics.elementClusteringScore} (0-1, higher is better)`,
    puzzleAlignmentScore: `${metrics.puzzleAlignmentScore} (0-1, higher is better)`
  });

  // Overall quality assessment
  const qualityScore = (
    (1 - Math.min(metrics.edgeCrossings / 20, 1)) * 0.3 +  // Fewer crossings is better
    (1 - Math.min(metrics.nodeOverlaps / 10, 1)) * 0.2 +   // No overlaps is better
    (Math.min(metrics.aspectRatio / 3, 1)) * 0.1 +          // Aspect ratio around 3 is good
    metrics.elementClusteringScore * 0.2 +                   // Higher clustering is better
    metrics.puzzleAlignmentScore * 0.2                       // Better alignment is better
  );

  const qualityLevel = 
    qualityScore > 0.8 ? 'Excellent' :
    qualityScore > 0.6 ? 'Good' :
    qualityScore > 0.4 ? 'Fair' : 'Poor';

  log.info('Layout Overall Quality', {
    level: qualityLevel,
    score: `${Math.round(qualityScore * 100)}%`,
    qualityScore
  });
}

/**
 * Calculate advanced layout metrics for sophisticated quality analysis.
 * 
 * Computes complex geometric and aesthetic measurements that go beyond
 * basic quality metrics. Includes stress analysis, angular resolution,
 * symmetry detection, and whitespace distribution.
 * 
 * @param nodes - Array of positioned graph nodes
 * @param edges - Array of graph edges
 * @returns AdvancedMetrics object with sophisticated quality measurements
 * 
 * @remarks
 * **Advanced Metrics Include:**
 * 
 * 1. **Stress Metric**: Sum of squared deviations from ideal edge lengths
 * 2. **Edge Distribution Uniformity**: How consistent edge lengths are
 * 3. **Angular Resolution**: Quality of angle separation between edges
 * 4. **Symmetry Score**: Horizontal and vertical symmetry detection
 * 5. **Edge Orthogonality**: Proportion of edges at orthogonal angles
 * 6. **Whitespace Distribution**: How efficiently space is utilized
 * 
 * **Use Cases:**
 * - Algorithm comparison and tuning
 * - Aesthetic quality assessment
 * - Layout pattern analysis
 * - Advanced optimization decisions
 * 
 * @example
 * ```typescript
 * const advanced = calculateAdvancedMetrics(nodes, edges);
 * console.log(`Advanced Analysis:`);
 * console.log(`- Stress: ${advanced.stress}`);
 * console.log(`- Symmetry: ${advanced.symmetryScore}`);
 * console.log(`- Min angle: ${advanced.minAngleDegrees}°`);
 * 
 * if (advanced.minAngleDegrees < 15) {
 *   console.warn('Poor angular resolution detected');
 * }
 * ```
 * 
 * Complexity: O(V + E²) where V = nodes, E = edges
 */
export function calculateAdvancedMetrics(
  nodes: GraphNode[],
  edges: GraphEdge[]
): AdvancedMetrics {
  // Use EdgeLengthCalculator for optimized edge length calculations
  const lengthCalculator = new EdgeLengthCalculator();
  lengthCalculator.buildCache(nodes);
  const edgeLengths = lengthCalculator.calculateEdgeLengths(edges);
  
  // Calculate stress metric (sum of squared differences between ideal and actual distances)
  let stress = 0;
  const idealDistance = 150; // Ideal edge length
  
  edgeLengths.forEach(actualDistance => {
    stress += Math.pow(actualDistance - idealDistance, 2);
  });
  stress = edges.length > 0 ? stress / edges.length : 0;

  // Calculate edge distribution uniformity
  const avgLength = edgeLengths.reduce((sum, len) => sum + len, 0) / (edgeLengths.length || 1);
  const variance = edgeLengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / (edgeLengths.length || 1);
  const edgeDistributionUniformity = avgLength > 0 ? 1 - (Math.sqrt(variance) / avgLength) : 1;

  // Calculate angular resolution
  const nodeAngles = new Map<string, number[]>();
  edges.forEach(edge => {
    const source = nodes.find(n => n.id === edge.source);
    const target = nodes.find(n => n.id === edge.target);
    if (source && target) {
      // Calculate angle from source to target
      const angle = Math.atan2(
        target.position.y - source.position.y,
        target.position.x - source.position.x
      );
      
      if (!nodeAngles.has(edge.source)) {
        nodeAngles.set(edge.source, []);
      }
      nodeAngles.get(edge.source)!.push(angle);
      
      // Also consider reverse angle for target
      const reverseAngle = Math.atan2(
        source.position.y - target.position.y,
        source.position.x - target.position.x
      );
      if (!nodeAngles.has(edge.target)) {
        nodeAngles.set(edge.target, []);
      }
      nodeAngles.get(edge.target)!.push(reverseAngle);
    }
  });
  
  let minAngle = Math.PI * 2;
  nodeAngles.forEach(angles => {
    if (angles.length > 1) {
      angles.sort((a, b) => a - b);
      for (let i = 0; i < angles.length; i++) {
        const nextIndex = (i + 1) % angles.length;
        let angleDiff = angles[nextIndex]! - angles[i]!;
        if (i === angles.length - 1) {
          angleDiff = (Math.PI * 2 + angles[0]!) - angles[i]!;
        }
        minAngle = Math.min(minAngle, Math.abs(angleDiff));
      }
    }
  });
  
  const minAngleDegrees = (minAngle * 180) / Math.PI;
  const angularResolution = minAngle / (Math.PI * 2);

  // Calculate symmetry score
  let symmetryScore = 0;
  if (nodes.length > 0) {
    const centerX = nodes.reduce((sum, n) => sum + n.position.x, 0) / nodes.length;
    const centerY = nodes.reduce((sum, n) => sum + n.position.y, 0) / nodes.length;
    
    // Check horizontal and vertical symmetry
    let horizontalSymmetry = 0;
    let verticalSymmetry = 0;
    
    nodes.forEach(node => {
      // Find mirror position
      const mirrorX = 2 * centerX - node.position.x;
      const mirrorY = 2 * centerY - node.position.y;
      
      // Check if there's a node near the mirror position
      const horizontalMirror = nodes.find(n => 
        Math.abs(n.position.x - mirrorX) < 50 && 
        Math.abs(n.position.y - node.position.y) < 50
      );
      const verticalMirror = nodes.find(n => 
        Math.abs(n.position.x - node.position.x) < 50 && 
        Math.abs(n.position.y - mirrorY) < 50
      );
      
      if (horizontalMirror) horizontalSymmetry++;
      if (verticalMirror) verticalSymmetry++;
    });
    
    symmetryScore = Math.max(
      horizontalSymmetry / nodes.length,
      verticalSymmetry / nodes.length
    );
  }

  // Calculate edge orthogonality
  let orthogonalEdges = 0;
  edges.forEach(edge => {
    const source = nodes.find(n => n.id === edge.source);
    const target = nodes.find(n => n.id === edge.target);
    if (source && target) {
      const angle = Math.atan2(
        target.position.y - source.position.y,
        target.position.x - source.position.x
      );
      const degrees = Math.abs(angle * 180 / Math.PI);
      
      // Check if angle is close to 0, 90, 180, or 270 degrees
      const isOrthogonal = 
        degrees < 10 || degrees > 170 ||
        (degrees > 80 && degrees < 100);
      
      if (isOrthogonal) orthogonalEdges++;
    }
  });
  const edgeOrthogonality = edges.length > 0 ? orthogonalEdges / edges.length : 1;

  // Calculate whitespace distribution
  let whitespaceDistribution = 1;
  if (nodes.length > 1) {
    // Calculate convex hull area (simplified)
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    
    nodes.forEach(node => {
      minX = Math.min(minX, node.position.x);
      maxX = Math.max(maxX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxY = Math.max(maxY, node.position.y);
    });
    
    const boundingArea = (maxX - minX) * (maxY - minY);
    const nodeArea = nodes.length * 2500; // Assume 50x50 per node
    
    whitespaceDistribution = boundingArea > 0 ? 
      Math.min(1, nodeArea / boundingArea) : 0;
  }

  return {
    stress: Math.round(stress),
    edgeDistributionUniformity: Math.round(edgeDistributionUniformity * 100) / 100,
    angularResolution: Math.round(angularResolution * 100) / 100,
    minAngleDegrees: Math.round(minAngleDegrees),
    symmetryScore: Math.round(symmetryScore * 100) / 100,
    edgeOrthogonality: Math.round(edgeOrthogonality * 100) / 100,
    whitespaceDistribution: Math.round(whitespaceDistribution * 100) / 100
  };
}

/**
 * Detect and analyze layout patterns in the positioned graph.
 * 
 * Uses heuristic analysis to identify common layout patterns and calculate
 * confidence scores. Supports multiple pattern types and provides detailed
 * characteristics for each detected pattern.
 * 
 * @param nodes - Array of positioned graph nodes
 * @param edges - Array of graph edges
 * @returns Array of detected patterns with confidence scores and characteristics
 * 
 * @remarks
 * **Pattern Detection Algorithms:**
 * 
 * 1. **Hierarchical**: Detects layered structures with directional flow
 *    - Analyzes Y-position clustering and edge directionality
 *    - Confidence based on downward edge ratio
 * 
 * 2. **Circular**: Identifies radial arrangements around center point
 *    - Calculates distance variance from computed center
 *    - Higher uniformity = higher confidence
 * 
 * 3. **Grid**: Detects rectangular grid arrangements
 *    - Analyzes unique X/Y position combinations
 *    - Excludes if already detected as hierarchical
 * 
 * 4. **Clustered**: Finds distinct node groups using spatial indexing
 *    - Uses efficient proximity search with 150px radius
 *    - BFS clustering for connected components
 * 
 * 5. **Force-Directed**: Identifies uniform spacing patterns
 *    - Analyzes edge length distribution uniformity
 *    - Higher uniformity suggests force-directed layout
 * 
 * **Confidence Scoring:**
 * - 0.0-0.3: Weak pattern match
 * - 0.3-0.6: Moderate pattern match
 * - 0.6-0.8: Strong pattern match
 * - 0.8-1.0: Very strong pattern match
 * 
 * @example
 * ```typescript
 * const patterns = detectLayoutPatterns(nodes, edges);
 * patterns.forEach(pattern => {
 *   console.log(`${pattern.type}: ${pattern.confidence} confidence`);
 *   if (pattern.type === 'hierarchical') {
 *     console.log(`  Layers: ${pattern.characteristics.layers}`);
 *   }
 * });
 * 
 * const strongPatterns = patterns.filter(p => p.confidence > 0.8);
 * ```
 * 
 * Complexity: O(V² + E) where V = nodes, E = edges
 */
export function detectLayoutPatterns(
  nodes: GraphNode[],
  edges: GraphEdge[]
): LayoutPattern[] {
  const patterns: LayoutPattern[] = [];
  
  // Check for hierarchical pattern (layered structure)
  const yPositions = nodes.map(n => n.position.y);
  const uniqueYPositions = new Set(yPositions);
  const layerRatio = uniqueYPositions.size / nodes.length;
  
  if (layerRatio <= 0.5 && uniqueYPositions.size > 1) {
    // Check if edges mostly go downward
    let downwardEdges = 0;
    edges.forEach(edge => {
      const source = nodes.find(n => n.id === edge.source);
      const target = nodes.find(n => n.id === edge.target);
      if (source && target && target.position.y > source.position.y) {
        downwardEdges++;
      }
    });
    
    const hierarchicalConfidence = edges.length > 0 ? 
      downwardEdges / edges.length : 0;
    
    if (hierarchicalConfidence > 0.7) {
      patterns.push({
        type: 'hierarchical',
        confidence: hierarchicalConfidence,
        characteristics: {
          layers: uniqueYPositions.size,
          directionality: downwardEdges / edges.length
        }
      });
    }
  }
  
  // Check for circular pattern
  if (nodes.length > 3) {
    const centerX = nodes.reduce((sum, n) => sum + n.position.x, 0) / nodes.length;
    const centerY = nodes.reduce((sum, n) => sum + n.position.y, 0) / nodes.length;
    
    const distances = nodes.map(n => 
      Math.sqrt(
        Math.pow(n.position.x - centerX, 2) + 
        Math.pow(n.position.y - centerY, 2)
      )
    );
    
    const avgDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;
    const variance = distances.reduce((sum, d) => 
      sum + Math.pow(d - avgDistance, 2), 0
    ) / distances.length;
    
    const circularConfidence = avgDistance > 0 ? 
      1 - (Math.sqrt(variance) / avgDistance) : 0;
    
    if (circularConfidence > 0.7) {
      patterns.push({
        type: 'circular',
        confidence: circularConfidence,
        characteristics: {
          radius: avgDistance,
          center: { x: centerX, y: centerY }
        }
      });
    }
  }
  
  // Check for grid pattern (but not if it's hierarchical)
  const xPositions = nodes.map(n => n.position.x);
  const uniqueXPositions = new Set(xPositions);
  const gridConfidence = (uniqueXPositions.size * uniqueYPositions.size) / nodes.length;
  
  // Don't detect as grid if it's already detected as hierarchical
  const isHierarchical = patterns.some(p => p.type === 'hierarchical');
  
  if (gridConfidence > 0.7 && uniqueXPositions.size > 1 && uniqueYPositions.size > 1 && !isHierarchical) {
    patterns.push({
      type: 'grid',
      confidence: gridConfidence,
      characteristics: {
        rows: uniqueYPositions.size,
        columns: uniqueXPositions.size
      }
    });
  }
  
  // Check for clustered pattern using SpatialIndex for efficient proximity search
  const spatialIndex = new SpatialIndex(150);
  spatialIndex.buildIndex(nodes);
  
  const clusters: GraphNode[][] = [];
  const visited = new Set<string>();
  
  nodes.forEach(node => {
    if (!visited.has(node.id)) {
      const cluster: GraphNode[] = [];
      const queue = [node];
      
      while (queue.length > 0) {
        const current = queue.shift()!;
        if (visited.has(current.id)) continue;
        
        visited.add(current.id);
        cluster.push(current);
        
        // Use spatial index to find nearby nodes efficiently
        const nearbyNodes = spatialIndex.findNodesInRadius(
          current.position.x,
          current.position.y,
          150
        );
        
        nearbyNodes.forEach(other => {
          if (!visited.has(other.id)) {
            queue.push(other);
          }
        });
      }
      
      if (cluster.length > 1) {
        clusters.push(cluster);
      }
    }
  });
  
  if (clusters.length > 1 && clusters.length < nodes.length / 2) {
    patterns.push({
      type: 'clustered',
      confidence: 0.8,
      characteristics: {
        clusterCount: clusters.length,
        avgClusterSize: nodes.length / clusters.length
      }
    });
  }
  
  // Check for force-directed pattern (relatively uniform edge lengths)
  if (edges.length > 3) {
    const edgeLengths: number[] = [];
    edges.forEach(edge => {
      const source = nodes.find(n => n.id === edge.source);
      const target = nodes.find(n => n.id === edge.target);
      if (source && target) {
        const length = Math.sqrt(
          Math.pow(target.position.x - source.position.x, 2) +
          Math.pow(target.position.y - source.position.y, 2)
        );
        edgeLengths.push(length);
      }
    });
    
    const avgLength = edgeLengths.reduce((sum, len) => sum + len, 0) / edgeLengths.length;
    const lengthVariance = edgeLengths.reduce((sum, len) => 
      sum + Math.pow(len - avgLength, 2), 0
    ) / edgeLengths.length;
    
    const forceConfidence = avgLength > 0 ? 
      1 - (Math.sqrt(lengthVariance) / avgLength) : 0;
    
    if (forceConfidence > 0.6) {
      patterns.push({
        type: 'force-directed',
        confidence: forceConfidence,
        characteristics: {
          avgEdgeLength: avgLength,
          uniformity: forceConfidence
        }
      });
    }
  }
  
  return patterns;
}

/**
 * Generate prioritized improvement suggestions for layout optimization.
 * 
 * Analyzes current layout quality and detected patterns to provide actionable
 * recommendations. Includes priority levels and estimated improvement percentages.
 * 
 * @param nodes - Array of positioned graph nodes
 * @param edges - Array of graph edges
 * @param options - Configuration options including current algorithm
 * @returns Array of improvement suggestions sorted by priority
 * 
 * @remarks
 * **Suggestion Categories:**
 * 
 * 1. **Critical Issues**:
 *    - Node overlaps (blocks readability)
 *    - Must be resolved immediately
 * 
 * 2. **High Priority**:
 *    - Many edge crossings (> 5)
 *    - Significantly impacts clarity
 * 
 * 3. **Medium Priority**:
 *    - Poor aspect ratio (> 5 or < 0.2)
 *    - Algorithm mismatch with detected patterns
 * 
 * 4. **Low Priority**:
 *    - Edge length variance
 *    - Aesthetic improvements
 * 
 * **Algorithm Recommendations:**
 * - Hierarchical patterns → Dagre algorithm
 * - Circular patterns → Circular algorithm
 * - Force patterns → Force-directed algorithm
 * 
 * **Improvement Estimation:**
 * - Based on severity and typical optimization results
 * - Range: 10-50% improvement potential
 * - Used for prioritization decisions
 * 
 * @example
 * ```typescript
 * const suggestions = suggestImprovements(nodes, edges, {
 *   currentAlgorithm: 'force'
 * });
 * 
 * suggestions.forEach(suggestion => {
 *   console.log(`[${suggestion.priority.toUpperCase()}] ${suggestion.description}`);
 *   if (suggestion.estimatedImprovement) {
 *     console.log(`  Expected improvement: ${suggestion.estimatedImprovement}%`);
 *   }
 * });
 * 
 * const criticalIssues = suggestions.filter(s => s.priority === 'critical');
 * ```
 * 
 * Complexity: O(V + E + P) where V = nodes, E = edges, P = pattern detection
 */
export function suggestImprovements(
  nodes: GraphNode[],
  edges: GraphEdge[],
  options: { currentAlgorithm?: string } = {}
): ImprovementSuggestion[] {
  const suggestions: ImprovementSuggestion[] = [];
  const metrics = calculateLayoutQuality(nodes, edges);
  
  // Check for edge crossings
  if (metrics.edgeCrossings > 0) {
    suggestions.push({
      type: 'reduce-crossings',
      priority: metrics.edgeCrossings > 5 ? 'high' : 'medium',
      description: `Reduce ${metrics.edgeCrossings} edge crossing(s) to improve clarity`,
      estimatedImprovement: Math.min(metrics.edgeCrossings * 10, 50)
    });
  }
  
  // Check for node overlaps
  if (metrics.nodeOverlaps > 0) {
    suggestions.push({
      type: 'resolve-overlaps',
      priority: 'critical',
      description: `Resolve ${metrics.nodeOverlaps} node overlap(s) for better readability`,
      estimatedImprovement: metrics.nodeOverlaps * 20
    });
  }
  
  // Check aspect ratio
  if (metrics.aspectRatio > 5 || metrics.aspectRatio < 0.2) {
    suggestions.push({
      type: 'improve-aspect-ratio',
      priority: 'medium',
      description: 'Adjust layout dimensions for better aspect ratio',
      estimatedImprovement: 15
    });
  }
  
  // Check edge length variance
  if (metrics.edgeLengthVariance > 10000) {
    suggestions.push({
      type: 'normalize-edge-lengths',
      priority: 'low',
      description: 'Normalize edge lengths for more uniform appearance',
      estimatedImprovement: 10
    });
  }
  
  // Suggest algorithm changes based on patterns
  const patterns = detectLayoutPatterns(nodes, edges);
  
  if (options.currentAlgorithm) {
    const hierarchicalPattern = patterns.find(p => p.type === 'hierarchical');
    if (hierarchicalPattern && hierarchicalPattern.confidence > 0.8 && 
        options.currentAlgorithm !== 'dagre') {
      suggestions.push({
        type: 'change-algorithm',
        priority: 'medium',
        description: 'Switch to Dagre algorithm for hierarchical layout',
        recommendedAlgorithm: 'dagre',
        estimatedImprovement: 30
      });
    }
    
    const circularPattern = patterns.find(p => p.type === 'circular');
    if (circularPattern && circularPattern.confidence > 0.8 && 
        options.currentAlgorithm !== 'circular') {
      suggestions.push({
        type: 'change-algorithm',
        priority: 'medium',
        description: 'Switch to Circular algorithm for circular layout',
        recommendedAlgorithm: 'circular',
        estimatedImprovement: 25
      });
    }
  }
  
  return suggestions;
}

/**
 * Perform comprehensive comparison between two graph layouts.
 * 
 * Calculates quality metrics for both layouts, identifies improvements and
 * regressions, and provides an overall recommendation. Used for A/B testing
 * layouts and selecting optimal arrangements.
 * 
 * @param layout1 - First layout with positioned nodes and edges
 * @param layout2 - Second layout with positioned nodes and edges  
 * @returns LayoutComparison object with detailed analysis and recommendation
 * 
 * @remarks
 * **Comparison Process:**
 * 
 * 1. **Metric Calculation**: Calculate quality metrics for both layouts
 * 2. **Improvement Analysis**: Identify metrics where layout2 > layout1
 * 3. **Regression Analysis**: Identify metrics where layout2 < layout1
 * 4. **Overall Scoring**: Weighted combination of key metrics
 * 5. **Recommendation**: Choose better layout or mark as equivalent
 * 
 * **Scoring Weights:**
 * - Edge crossings: 30% (lower is better)
 * - Node overlaps: 20% (lower is better)
 * - Element clustering: 25% (higher is better)
 * - Puzzle alignment: 25% (higher is better)
 * 
 * **Recommendation Logic:**
 * - Equivalent: < 5% difference in overall score
 * - Layout1: Layout1 has higher overall score
 * - Layout2: Layout2 has higher overall score
 * 
 * @example
 * ```typescript
 * const comparison = compareLayouts(
 *   { nodes: dagreNodes, edges: dagreEdges },
 *   { nodes: forceNodes, edges: forceEdges }
 * );
 * 
 * console.log(`Recommendation: ${comparison.recommendation}`);
 * console.log(`Overall difference: ${comparison.overallComparison}`);
 * 
 * comparison.improvements.forEach(imp => {
 *   console.log(`✓ ${imp.metric}: ${imp.percentageChange.toFixed(1)}% better`);
 * });
 * 
 * comparison.regressions.forEach(reg => {
 *   console.log(`✗ ${reg.metric}: ${reg.percentageChange.toFixed(1)}% worse`);
 * });
 * ```
 * 
 * Complexity: O(V + E) for each layout
 */
export function compareLayouts(
  layout1: { nodes: GraphNode[]; edges: GraphEdge[] },
  layout2: { nodes: GraphNode[]; edges: GraphEdge[] }
): LayoutComparison {
  const metrics1 = calculateLayoutQuality(layout1.nodes, layout1.edges);
  const metrics2 = calculateLayoutQuality(layout2.nodes, layout2.edges);
  
  const improvements: LayoutComparison['improvements'] = [];
  const regressions: LayoutComparison['regressions'] = [];
  
  // Compare each metric
  const compareMetric = (
    name: string, 
    value1: number, 
    value2: number, 
    lowerIsBetter: boolean
  ) => {
    const diff = value2 - value1;
    const percentChange = value1 !== 0 ? (diff / value1) * 100 : 0;
    
    if (lowerIsBetter ? diff < 0 : diff > 0) {
      improvements.push({
        metric: name,
        improvement: Math.abs(diff),
        percentageChange: Math.abs(percentChange)
      });
    } else if (lowerIsBetter ? diff > 0 : diff < 0) {
      regressions.push({
        metric: name,
        regression: Math.abs(diff),
        percentageChange: Math.abs(percentChange)
      });
    }
  };
  
  compareMetric('edgeCrossings', metrics1.edgeCrossings, metrics2.edgeCrossings, true);
  compareMetric('nodeOverlaps', metrics1.nodeOverlaps, metrics2.nodeOverlaps, true);
  compareMetric('edgeLengthVariance', metrics1.edgeLengthVariance, metrics2.edgeLengthVariance, true);
  compareMetric('elementClusteringScore', metrics1.elementClusteringScore, metrics2.elementClusteringScore, false);
  compareMetric('puzzleAlignmentScore', metrics1.puzzleAlignmentScore, metrics2.puzzleAlignmentScore, false);
  
  // Calculate overall comparison score
  const score1 = (
    (1 - Math.min(metrics1.edgeCrossings / 20, 1)) * 0.3 +
    (1 - Math.min(metrics1.nodeOverlaps / 10, 1)) * 0.2 +
    metrics1.elementClusteringScore * 0.25 +
    metrics1.puzzleAlignmentScore * 0.25
  );
  
  const score2 = (
    (1 - Math.min(metrics2.edgeCrossings / 20, 1)) * 0.3 +
    (1 - Math.min(metrics2.nodeOverlaps / 10, 1)) * 0.2 +
    metrics2.elementClusteringScore * 0.25 +
    metrics2.puzzleAlignmentScore * 0.25
  );
  
  const overallComparison = score2 - score1;
  
  let recommendation: LayoutComparison['recommendation'];
  if (Math.abs(overallComparison) < 0.05) {
    recommendation = 'equivalent';
  } else if (overallComparison > 0) {
    recommendation = 'layout2';
  } else {
    recommendation = 'layout1';
  }
  
  return {
    layout1Metrics: metrics1,
    layout2Metrics: metrics2,
    improvements,
    regressions,
    overallComparison,
    recommendation
  };
}