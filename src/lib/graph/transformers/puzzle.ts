/**
 * Puzzle Entity Transformer
 * Converts Puzzle entities from Notion into React Flow nodes
 * Puzzles have requirements, rewards, chains, and ownership
 */

import type { Puzzle } from '@/types/notion/app';
import type { GraphNode, EntityTransformer, NodeMetadata } from '../types';

/**
 * Default position for puzzle nodes (will be overridden by layout)
 */
const DEFAULT_POSITION = { x: 0, y: 0 };

/**
 * Puzzle complexity levels based on requirements and chains
 */
const COMPLEXITY_LEVELS = {
  simple: {
    color: '#10b981',      // Green - easy puzzles
    size: 'small' as const,
    maxRequirements: 1,
    maxChainDepth: 0,
  },
  moderate: {
    color: '#3b82f6',       // Blue - medium puzzles
    size: 'medium' as const,
    maxRequirements: 3,
    maxChainDepth: 2,
  },
  complex: {
    color: '#f59e0b',       // Amber - hard puzzles
    size: 'large' as const,
    maxRequirements: 999,
    maxChainDepth: 999,
  },
} as const;

/**
 * Timing (Act) colors
 */
const TIMING_COLORS: Record<string, string> = {
  'Act 0': '#6b7280', // Gray - pre-game
  'Act 1': '#3b82f6', // Blue - early game
  'Act 2': '#f59e0b', // Amber - late game
};

/**
 * Validate puzzle entity has required fields
 */
function validatePuzzle(puzzle: Puzzle): string[] {
  const errors: string[] = [];
  
  if (!puzzle.id) {
    errors.push('Missing puzzle ID');
  }
  
  if (!puzzle.name) {
    errors.push('Missing puzzle name');
  }
  
  // Check for logical consistency
  if (puzzle.rewardIds?.length > 0 && !puzzle.descriptionSolution) {
    console.warn(`Puzzle ${puzzle.name} has rewards but no solution documented`);
  }
  
  // Validate circular references
  if (puzzle.subPuzzleIds?.includes(puzzle.id)) {
    errors.push('Puzzle references itself as sub-puzzle');
  }
  
  if (puzzle.parentItemId === puzzle.id) {
    errors.push('Puzzle references itself as parent');
  }
  
  return errors;
}

/**
 * Calculate puzzle complexity
 */
function calculateComplexity(puzzle: Puzzle): keyof typeof COMPLEXITY_LEVELS {
  const requirementCount = puzzle.puzzleElementIds?.length || 0;
  const hasChain = Boolean(puzzle.parentItemId || puzzle.subPuzzleIds?.length > 0);
  const chainDepth = hasChain ? 1 : 0; // Simplified for now
  
  // Check each complexity level
  if (requirementCount <= COMPLEXITY_LEVELS.simple.maxRequirements && 
      chainDepth <= COMPLEXITY_LEVELS.simple.maxChainDepth) {
    return 'simple';
  }
  
  if (requirementCount <= COMPLEXITY_LEVELS.moderate.maxRequirements && 
      chainDepth <= COMPLEXITY_LEVELS.moderate.maxChainDepth) {
    return 'moderate';
  }
  
  return 'complex';
}

/**
 * Generate label for puzzle node
 */
function generateLabel(puzzle: Puzzle): string {
  let label = puzzle.name || 'Unknown Puzzle';
  
  // Add chain indicator
  if (puzzle.parentItemId) {
    label = `↳ ${label}`; // Sub-puzzle indicator
  }
  
  if (puzzle.subPuzzleIds?.length > 0) {
    label += ` [${puzzle.subPuzzleIds.length}+]`; // Has sub-puzzles
  }
  
  // Add timing if available
  const timing = puzzle.timing?.[0]; // First timing value
  if (timing) {
    label += ` (${timing})`;
  }
  
  return label;
}

/**
 * Determine if puzzle is locked (requires container opening)
 */
function isLockedPuzzle(puzzle: Puzzle): boolean {
  return Boolean(puzzle.lockedItemId);
}

/**
 * Calculate puzzle importance for sorting
 */
function calculateImportance(puzzle: Puzzle): number {
  let score = 0;
  
  // Root puzzles (no parent) are more important
  if (!puzzle.parentItemId) {
    score += 1000;
  }
  
  // Puzzles with many sub-puzzles are important
  score += (puzzle.subPuzzleIds?.length || 0) * 100;
  
  // Puzzles with many rewards are important
  score += (puzzle.rewardIds?.length || 0) * 50;
  
  // Earlier timing is more important
  const timing = puzzle.timing?.[0];
  if (timing === 'Act 0') score += 300;
  else if (timing === 'Act 1') score += 200;
  else if (timing === 'Act 2') score += 100;
  
  // Locked puzzles (containers) are important
  if (isLockedPuzzle(puzzle)) {
    score += 150;
  }
  
  return score;
}

/**
 * Transform a Puzzle entity into a GraphNode
 */
export const transformPuzzle: EntityTransformer<Puzzle> = (
  puzzle: Puzzle,
  _index: number
): GraphNode<Puzzle> | null => {
  // Validate required fields
  const errors = validatePuzzle(puzzle);
  
  // Calculate complexity
  const complexity = calculateComplexity(puzzle);
  const complexityConfig = COMPLEXITY_LEVELS[complexity];
  
  // Determine timing color
  const timing = puzzle.timing?.[0];
  const timingColor = timing ? TIMING_COLORS[timing] : undefined;
  
  // Build metadata
  const metadata: NodeMetadata = {
    entityType: 'puzzle',
    visualHints: {
      color: timingColor || complexityConfig.color,
      icon: isLockedPuzzle(puzzle) ? 'lock' : 'puzzle',
      size: complexityConfig.size,
    },
  };
  
  // Add error state if validation failed
  if (errors.length > 0) {
    metadata.errorState = {
      type: 'invalid_relation',
      message: errors.join('; '),
    };
    console.warn(`Puzzle node ${puzzle.id} has errors:`, errors);
  }
  
  // Create the node
  const node: GraphNode<Puzzle> = {
    id: puzzle.id,
    type: 'puzzle', // Custom node type for React Flow
    position: DEFAULT_POSITION,
    data: {
      entity: puzzle,
      label: generateLabel(puzzle),
      metadata,
    },
  };
  
  return node;
}

/**
 * Transform multiple puzzles
 */
export function transformPuzzles(
  puzzles: Puzzle[]
): GraphNode<Puzzle>[] {
  const nodes: GraphNode<Puzzle>[] = [];
  
  puzzles.forEach((puzzle, index) => {
    const node = transformPuzzle(puzzle, index);
    if (node) {
      nodes.push(node);
    } else {
      console.error(`Failed to transform puzzle ${puzzle.id}`);
    }
  });
  
  // Sort by importance (root puzzles first, then by complexity)
  nodes.sort((a, b) => {
    const aScore = calculateImportance(a.data.entity);
    const bScore = calculateImportance(b.data.entity);
    return bScore - aScore; // Higher score first
  });
  
  return nodes;
}

/**
 * Get puzzle node display configuration
 */
export function getPuzzleNodeStyle(node: GraphNode<Puzzle>) {
  const hasError = node.data.metadata.errorState !== undefined;
  const puzzle = node.data.entity;
  const complexity = calculateComplexity(puzzle);
  const complexityConfig = COMPLEXITY_LEVELS[complexity];
  const isLocked = isLockedPuzzle(puzzle);
  const isSubPuzzle = Boolean(puzzle.parentItemId);
  
  // Size mapping
  const sizeMap = {
    small: { width: '140px', padding: '10px', fontSize: '12px' },
    medium: { width: '170px', padding: '12px', fontSize: '13px' },
    large: { width: '200px', padding: '14px', fontSize: '14px' },
  };
  
  const size = sizeMap[complexityConfig.size];
  
  return {
    background: hasError 
      ? '#fee2e2' 
      : isLocked 
        ? '#fef3c7' // Yellow tint for locked puzzles
        : `${complexityConfig.color}20`, // 20% opacity
    color: hasError ? '#991b1b' : complexityConfig.color,
    border: `2px ${isSubPuzzle ? 'dashed' : 'solid'} ${
      hasError ? '#dc2626' : complexityConfig.color
    }`,
    borderRadius: '12px', // Diamond-like appearance
    transform: 'rotate(45deg)', // Diamond shape
    padding: size.padding,
    fontSize: size.fontSize,
    fontWeight: '500',
    minWidth: size.width,
    maxWidth: '250px',
    textAlign: 'center' as const,
    // Counter-rotate text
    '& > *': {
      transform: 'rotate(-45deg)',
    },
    // Add lock badge for locked puzzles
    ...(isLocked && {
      '&::after': {
        content: '"🔒"',
        position: 'absolute',
        top: '-5px',
        right: '-5px',
        fontSize: '16px',
      },
    }),
  };
}

/**
 * Build puzzle hierarchy tree
 */
export function buildPuzzleHierarchy(puzzles: Puzzle[]) {
  const puzzleMap = new Map(puzzles.map(p => [p.id, p]));
  const roots: Puzzle[] = [];
  const tree = new Map<string, Puzzle[]>();
  
  puzzles.forEach(puzzle => {
    if (!puzzle.parentItemId) {
      // Root puzzle
      roots.push(puzzle);
    } else {
      // Sub-puzzle
      const siblings = tree.get(puzzle.parentItemId) || [];
      siblings.push(puzzle);
      tree.set(puzzle.parentItemId, siblings);
    }
  });
  
  return { roots, tree, puzzleMap };
}

/**
 * Get puzzles grouped by timing
 */
export function groupPuzzlesByTiming(puzzles: Puzzle[]) {
  return {
    act0: puzzles.filter(p => p.timing?.includes('Act 0')),
    act1: puzzles.filter(p => p.timing?.includes('Act 1')),
    act2: puzzles.filter(p => p.timing?.includes('Act 2')),
    unknown: puzzles.filter(p => !p.timing || p.timing.length === 0),
  };
}

/**
 * Find puzzle chains (puzzles with parent-child relationships)
 */
export function findPuzzleChains(puzzles: Puzzle[]) {
  const chains: Puzzle[][] = [];
  const visited = new Set<string>();
  const { roots, tree } = buildPuzzleHierarchy(puzzles);
  
  // Depth-first traversal to build chains
  function buildChain(puzzle: Puzzle, currentChain: Puzzle[] = []) {
    if (visited.has(puzzle.id)) return;
    visited.add(puzzle.id);
    
    currentChain.push(puzzle);
    
    const children = tree.get(puzzle.id) || [];
    if (children.length === 0) {
      // Leaf node - save chain if it has multiple puzzles
      if (currentChain.length > 1) {
        chains.push([...currentChain]);
      }
    } else {
      // Continue building chain with each child
      children.forEach(child => {
        buildChain(child, [...currentChain]);
      });
    }
  }
  
  roots.forEach(root => buildChain(root));
  
  return chains;
}