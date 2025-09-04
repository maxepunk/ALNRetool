/**
 * Edge Creation and Weighting Module
 * 
 * Core business logic for graph edge generation in ALNRetool.
 * Implements intelligent edge weighting algorithms that create
 * semantically meaningful graph layouts for murder mystery investigation networks.
 * 
 * @module lib/graph/edges
 * 
 * **Architecture:**
 * - Smart weight calculation based on entity relationships
 * - Visual styling for different edge types
 * - Duplicate edge prevention via unique keys
 * - Support for broken/missing relationship visualization
 * 
 * **Critical Business Logic:**
 * This module contains the "secret sauce" that makes graph layouts intelligent.
 * The weighting algorithm considers puzzle dependencies, element roles,
 * narrative threads, and structural relationships to position related nodes
 * closer together in the layout.
 * 
 * **Edge Types:**
 * - `requirement`: Puzzle requires element (orange, solid)
 * - `reward`: Puzzle rewards element (green, dashed, animated)
 * - `ownership`: Character owns element (purple, dashed)
 * - `dependency`: Puzzle depends on puzzle (gray, solid)
 * - `chain`: Puzzle chain connection (red, thick, animated)
 * - `timeline`: Timeline connection (gray, thin, dashed)
 * - `relationship`: General relationship (blue, dotted)
 * 
 * @see {@link calculateSmartWeight} for weighting algorithm
 * @see {@link EDGE_STYLES} for visual configurations
 */

import type { Node } from '@xyflow/react';
import type { RelationshipType } from './types';

/**
 * Visual configuration for each edge type.
 * Defines stroke color, width, animation, and markers.
 * 
 * @constant {Record<RelationshipType, EdgeStyle>} EDGE_STYLES
 * @exports EDGE_STYLES
 * 
 * **Style Properties:**
 * - `stroke`: Color of the edge line
 * - `strokeWidth`: Thickness of the edge (1-3)
 * - `strokeDasharray`: Dash pattern (solid, dashed, dotted)
 * - `animated`: Whether edge animates (for important connections)
 * - `markerEnd`: Arrowhead configuration
 * - `label`: Text label displayed on edge
 */
export const EDGE_STYLES = {
  dependency: {
    stroke: 'hsl(var(--muted-foreground))',
    strokeWidth: 2,
    strokeDasharray: 'none',
    animated: false,
    markerEnd: { type: 'arrowclosed' as const },
    label: undefined,
  },
  reward: {
    stroke: '#10b981',
    strokeWidth: 2,
    strokeDasharray: '5,5',
    animated: true,
    markerEnd: { type: 'arrowclosed' as const },
    label: 'reward',
  },
  requirement: {
    stroke: '#f59e0b',
    strokeWidth: 2,
    strokeDasharray: 'none',
    animated: false,
    markerEnd: { type: 'arrowclosed' as const },
    label: 'requires',
  },
  ownership: {
    stroke: '#8b5cf6',
    strokeWidth: 2,
    strokeDasharray: '3,3',
    animated: false,
    markerEnd: { type: 'arrowclosed' as const },
    label: 'owns',
  },
  owner: {
    stroke: '#8b5cf6',
    strokeWidth: 2,
    strokeDasharray: '3,3',
    animated: false,
    markerEnd: { type: 'arrowclosed' as const },
    label: 'owns',
  },
  chain: {
    stroke: '#ef4444',
    strokeWidth: 3,
    strokeDasharray: 'none',
    animated: true,
    markerEnd: { type: 'arrowclosed' as const },
    label: 'chain',
  },
  timeline: {
    stroke: '#6b7280',
    strokeWidth: 1,
    strokeDasharray: '2,2',
    animated: false,
    markerEnd: undefined,
    label: undefined,
  },
  relationship: {
    stroke: '#3b82f6',
    strokeWidth: 2,
    strokeDasharray: '1,1',
    animated: false,
    markerEnd: undefined,
    label: undefined,
  },
  collaboration: {
    stroke: '#06b6d4',
    strokeWidth: 2,
    strokeDasharray: '4,2',
    animated: false,
    markerEnd: undefined,
    label: 'collaborates',
  },
  container: {
    stroke: '#84cc16',
    strokeWidth: 2,
    strokeDasharray: '6,3',
    animated: false,
    markerEnd: { type: 'arrowclosed' as const },
    label: 'contains',
  },
  'puzzle-grouping': {
    stroke: '#f97316',
    strokeWidth: 1,
    strokeDasharray: '8,4',
    animated: false,
    markerEnd: undefined,
    label: 'grouped',
  },
  'virtual-dependency': {
    stroke: '#9ca3af',
    strokeWidth: 1,
    strokeDasharray: '1,3',
    animated: false,
    markerEnd: undefined,
    label: undefined,
  },
  connection: {
    stroke: '#9333ea',
    strokeWidth: 2,
    strokeDasharray: '5,5',
    animated: false,
    markerEnd: undefined,
    label: undefined,
  },
  'virtual-alignment': {
    stroke: 'transparent',
    strokeWidth: 0,
    strokeDasharray: '0,0',
    animated: false,
    markerEnd: undefined,
    label: undefined,
  },
  puzzle: {
    stroke: '#6366f1',
    strokeWidth: 2,
    strokeDasharray: '3,3',
    animated: false,
    markerEnd: { type: 'arrowclosed' as const },
    label: 'puzzle',
  },
  'character-puzzle': {
    stroke: '#8b5cf6',
    strokeWidth: 2,
    strokeDasharray: '3,3',
    animated: false,
    markerEnd: { type: 'arrowclosed' as const },
    label: 'character',
  },
  'virtual-alignment-same-rank': {
    stroke: 'transparent',
    strokeWidth: 0,
    strokeDasharray: '0',
    animated: false,
    markerEnd: undefined,
    label: undefined,
  },
  'virtual-alignment-next-rank': {
    stroke: 'transparent',
    strokeWidth: 0,
    strokeDasharray: '0',
    animated: false,
    markerEnd: undefined,
    label: undefined,
  },
} satisfies Record<RelationshipType, any>;

/**
 * Calculate smart edge weight based on element affinity and puzzle relationships.
 * This is the "secret sauce" that makes graph layouts intelligent.
 * 
 * **CRITICAL BUSINESS LOGIC - DO NOT MODIFY WITHOUT UNDERSTANDING**
 * 
 * @function calculateSmartWeight
 * @param {string} source - Source node ID
 * @param {string} target - Target node ID
 * @param {RelationshipType} relationshipType - Type of relationship
 * @param {Node} [sourceNode] - Source node with entity data
 * @param {Node} [targetNode] - Target node with entity data
 * @param {number} [baseWeight=1] - Base weight before modifiers
 * @returns {number} Calculated weight (0.7 to 15)
 * 
 * **Weight Modifiers:**
 * - Dual-role elements (requirement + reward): 3x weight
 * - SF pattern elements: 1.5x weight
 * - Multi-puzzle rewards: 2x weight
 * - Parent-child puzzles: 5x weight (highest)
 * - Narrative thread puzzles: 2x weight
 * - Ownership edges: 1.5x weight
 * - Timeline edges: 0.7x weight (lowest)
 * 
 * **Complexity:** O(n) where n is number of narrative threads
 * 
 * @example
 * const weight = calculateSmartWeight(
 *   'puzzle-1', 'element-2', 'requirement',
 *   puzzleNode, elementNode
 * );
 * // Returns higher weight if element has dual role
 */
export function calculateSmartWeight(
  source: string,
  target: string,
  relationshipType: RelationshipType,
  sourceNode?: Node,
  targetNode?: Node,
  baseWeight: number = 1
): number {
  let weight = baseWeight;

  if (!sourceNode || !targetNode) {
    return weight;
  }

  const sourceEntity = sourceNode.data?.entity;
  const targetEntity = targetNode.data?.entity;
  const sourceType = (sourceNode.data?.metadata as any)?.entityType;
  const targetType = (targetNode.data?.metadata as any)?.entityType;

  // Element-to-puzzle edge weighting
  if (sourceType === 'element' && targetType === 'puzzle') {
    const element = sourceEntity as any;
    
    // Dual-role elements (both requirement and reward) get higher weight
    if (element?.requiredForPuzzleIds?.length > 0 && 
        element?.rewardedByPuzzleIds?.length > 0) {
      weight *= 3; // Triple weight for dual-role elements
    }
    
    // Elements with SF patterns get slightly higher weight
    if (element?.sfPatterns && Object.keys(element.sfPatterns).length > 0) {
      weight *= 1.5; // 50% boost for SF pattern elements
    }
  }
  
  // Puzzle-to-element edge weighting
  else if (sourceType === 'puzzle' && targetType === 'element') {
    const element = targetEntity as any;
    
    // Elements that are rewards and also requirements get higher weight
    if (element?.requiredForPuzzleIds?.length > 0 && 
        element?.rewardedByPuzzleIds?.length > 0) {
      weight *= 3; // Triple weight for dual-role elements
    }
    
    // Elements rewarded by multiple puzzles get higher weight
    else if (element?.rewardedByPuzzleIds?.length > 1) {
      weight *= 2; // Double weight for multi-puzzle rewards
    }
  }
  
  // Puzzle-to-puzzle connections (dependencies)
  else if (sourceType === 'puzzle' && targetType === 'puzzle') {
    const sourcePuzzle = sourceEntity as any;
    const targetPuzzle = targetEntity as any;
    
    // Parent-child puzzle relationships get highest weight
    if (sourcePuzzle?.subPuzzleIds?.includes(target) || 
        targetPuzzle?.parentItemId === source) {
      weight *= 5; // Very high weight for parent-child
    }
    
    // Optimized narrative thread comparison using Set lookup (O(N+M) instead of O(N*M))
    const sourceThreads = new Set(sourcePuzzle?.narrativeThreads || []);
    if (sourceThreads.size > 0) {
      const commonThreads = targetPuzzle?.narrativeThreads?.filter((thread: string) => 
        sourceThreads.has(thread)
      );
      if (commonThreads?.length > 0) {
        weight *= 2; // Double weight for narrative connections
      }
    }
  }
  
  // Relationship type modifiers
  if (relationshipType === 'ownership' || relationshipType === 'owner') {
    weight *= 1.5;
  }
  
  // Timeline edges get lower weight (they're less structurally important)
  if (relationshipType === 'timeline') {
    weight *= 0.7;
  }

  return weight;
}

/**
 * Generate unique edge key for duplicate prevention.
 * Combines relationship type and node IDs to ensure uniqueness.
 * 
 * @function getEdgeKey
 * @param {string} source - Source node ID
 * @param {string} target - Target node ID
 * @param {RelationshipType} [relationshipType='dependency'] - Type of relationship
 * @returns {string} Unique edge identifier
 * 
 * **Format:** `{relationshipType}-{source}-{target}`
 * 
 * **Complexity:** O(1)
 * 
 * @example
 * const key = getEdgeKey('node1', 'node2', 'requirement');
 * // Returns: "requirement-node1-node2"
 */
export function getEdgeKey(
  source: string,
  target: string,
  relationshipType: RelationshipType = 'dependency'
): string {
  return `${relationshipType}-${source}-${target}`;
}

/**
 * Create a complete edge object with styling, weight, and metadata.
 * Combines visual configuration with calculated weight for optimal layout.
 * 
 * @function createEdge
 * @param {string} source - Source node ID
 * @param {string} target - Target node ID
 * @param {RelationshipType} relationshipType - Type of relationship
 * @param {Node} [sourceNode] - Source node for weight calculation
 * @param {Node} [targetNode] - Target node for weight calculation
 * @param {Object} [options] - Additional edge options
 * @param {number} [options.weight] - Override calculated weight
 * @param {boolean} [options.isBroken] - Mark as broken relationship
 * @param {React.CSSProperties} [options.customStyle] - Custom CSS styles
 * @returns {Edge} Complete edge object for React Flow
 * 
 * **Edge Properties:**
 * - Unique ID for deduplication
 * - Visual styling based on relationship type
 * - Calculated weight for layout positioning
 * - Support for broken/missing relationships
 * - Animated edges for important connections
 * 
 * **Complexity:** O(n) where n is narrative threads (via calculateSmartWeight)
 * 
 * @example
 * const edge = createEdge(
 *   'puzzle1', 'element2', 'reward',
 *   puzzleNode, elementNode,
 *   { isBroken: false }
 * );
 * // Returns animated green dashed edge with calculated weight
 */
export function createEdge(
  source: string,
  target: string,
  relationshipType: RelationshipType,
  sourceNode?: Node,
  targetNode?: Node,
  options?: {
    weight?: number;
    isBroken?: boolean;
    customStyle?: React.CSSProperties;
  }
) {
  const id = getEdgeKey(source, target, relationshipType);
  const weight = calculateSmartWeight(
    source, 
    target, 
    relationshipType, 
    sourceNode, 
    targetNode,
    options?.weight
  );
  
  const styleConfig = EDGE_STYLES[relationshipType] || EDGE_STYLES.dependency;
  
  const style: React.CSSProperties = {
    stroke: options?.isBroken ? '#ef4444' : styleConfig.stroke,
    strokeWidth: styleConfig.strokeWidth,
    strokeDasharray: options?.isBroken ? '10,5' : styleConfig.strokeDasharray,
    opacity: options?.isBroken ? 0.5 : 1,
    ...options?.customStyle,
  };

  return {
    id,
    source,
    target,
    type: 'default',
    animated: styleConfig.animated || false,
    style,
    markerEnd: styleConfig.markerEnd,
    label: styleConfig.label,
    labelStyle: {
      fill: '#374151', // Gray-700 for dark text
      fontSize: 12,
      fontWeight: 500,
    },
    labelBgPadding: [8, 4] as [number, number],
    labelBgBorderRadius: 4,
    labelBgStyle: {
      fill: '#ffffff', // White background
      fillOpacity: 0.9,
      stroke: '#d1d5db', // Light border
      strokeWidth: 1,
    },
    data: {
      weight,
      relationshipType,
    },
  };
}