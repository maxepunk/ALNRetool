/**
 * Relationship Resolution
 * Creates edges between nodes based on entity relationships
 * Handles missing relationships gracefully with logging
 */

import type { 
  Character, 
  Element, 
  Puzzle, 
  TimelineEvent 
} from '@/types/notion/app';
import type { 
  GraphEdge, 
  EntityLookupMaps, 
  RelationshipType,
  EdgeMetadata,
  EntityType,
  PlaceholderNodeData 
} from './types';
import type { Node } from '@xyflow/react';

// ============================================================================
// Edge Style Configuration
// ============================================================================

/**
 * Visual styles for different relationship types
 */
const EDGE_STYLES: Record<RelationshipType, Partial<GraphEdge>> = {
  ownership: {
    type: 'default',
    style: { stroke: '#3b82f6', strokeWidth: 2 },
    animated: false,
    label: 'owns',
  },
  requirement: {
    type: 'default',
    style: { stroke: '#ef4444', strokeWidth: 2, strokeDasharray: '5 5' },
    animated: false,
    label: 'requires',
  },
  reward: {
    type: 'default',
    style: { stroke: '#10b981', strokeWidth: 2 },
    animated: true,
    label: 'rewards',
  },
  timeline: {
    type: 'default',
    style: { stroke: '#8b5cf6', strokeWidth: 1.5, strokeDasharray: '2 4' },
    animated: false,
    label: 'reveals',
  },
  chain: {
    type: 'default',
    style: { stroke: '#f59e0b', strokeWidth: 3 },
    animated: false,
    label: 'unlocks',
  },
  container: {
    type: 'default',
    style: { stroke: '#6b7280', strokeWidth: 1.5, strokeDasharray: '8 4' },
    animated: false,
    label: 'contains',
  },
};

/**
 * Visual style for broken edges (missing entities)
 */
const BROKEN_EDGE_STYLE: Partial<GraphEdge> = {
  type: 'default',
  style: { 
    stroke: '#dc2626', // Red color for broken relationships
    strokeWidth: 2, 
    strokeDasharray: '3 3', // Dashed line
    opacity: 0.7 
  },
  animated: false,
  className: 'edge-broken',
};

// ============================================================================
// Lookup Map Builders
// ============================================================================

/**
 * Entity lookup maps for efficient ID resolution (defined in types.ts)
 */
export type { EntityLookupMaps } from './types';

/**
 * Build lookup maps for efficient ID resolution
 */
export function buildLookupMaps(
  characters: Character[],
  elements: Element[],
  puzzles: Puzzle[],
  timeline: TimelineEvent[]
): EntityLookupMaps {
  return {
    characters: new Map(characters.map(c => [c.id, c])),
    elements: new Map(elements.map(e => [e.id, e])),
    puzzles: new Map(puzzles.map(p => [p.id, p])),
    timeline: new Map(timeline.map(t => [t.id, t])),
  };
}

// ============================================================================
// Placeholder Node Creation
// ============================================================================

/**
 * Create a placeholder node for missing entities
 * These nodes help visualize broken relationships in the data
 */
export function createPlaceholderNode(
  id: string, 
  entityType: EntityType,
  referencedBy?: string
): Node<PlaceholderNodeData> {
  return {
    id,
    type: 'placeholder',
    position: { x: 0, y: 0 }, // Will be positioned by layout
    data: {
      entity: null, // No actual entity data
      label: `Missing ${entityType}: ${id.slice(0, 8)}...`,
      metadata: {
        entityType,
        errorState: {
          type: 'missing_entity',
          message: `Referenced ${entityType} not found in Notion`,
          referencedBy: referencedBy || 'unknown',
        },
        visualHints: {
          color: '#dc2626', // Red for missing
          size: 'small',
          shape: 'circle',
        },
      },
    },
    style: {
      background: '#fee2e2', // Light red background
      border: '2px dashed #dc2626',
      opacity: 0.8,
    },
    className: 'node-placeholder',
  };
}

// ============================================================================
// Edge Creation Functions
// ============================================================================

/**
 * Create a unique edge ID
 */
function createEdgeId(
  source: string, 
  target: string, 
  type: RelationshipType
): string {
  return `${source}-${type}-${target}`;
}

/**
 * Create an edge with metadata
 * Now includes support for marking broken relationships
 */
function createEdge(
  source: string,
  target: string,
  relationshipType: RelationshipType,
  metadata?: Partial<EdgeMetadata> & { isBroken?: boolean }
): GraphEdge | null {
  // Validate source and target exist
  if (!source || !target) {
    console.warn(`Invalid edge: source=${source}, target=${target}, type=${relationshipType}`);
    return null;
  }
  
  // Don't create self-referential edges
  if (source === target) {
    console.warn(`Self-referential edge ignored: ${source} -> ${target}`);
    return null;
  }
  
  // Use broken style if edge references missing entities
  const isBroken = metadata?.isBroken || false;
  const baseStyle = isBroken ? BROKEN_EDGE_STYLE : EDGE_STYLES[relationshipType];
  const edgeStyle = {
    ...EDGE_STYLES[relationshipType],
    ...baseStyle,
  };
  
  const edge: GraphEdge = {
    id: createEdgeId(source, target, relationshipType),
    source,
    target,
    ...edgeStyle,
    data: {
      relationshipType,
      strength: metadata?.strength || 1,
      label: metadata?.label || (EDGE_STYLES[relationshipType].label as string),
      bidirectional: metadata?.bidirectional || false,
      isBroken,
    },
  };
  
  return edge;
}

// ============================================================================
// Ownership Edges (Character -> Element)
// ============================================================================

/**
 * Create ownership edges between characters and their owned elements
 */
export function createOwnershipEdges(
  elements: Element[],
  lookupMaps: EntityLookupMaps
): GraphEdge[] {
  const edges: GraphEdge[] = [];
  
  elements.forEach(element => {
    if (!element.ownerId) return;
    
    // Check if owner exists in character map
    const ownerCharacter = lookupMaps.characters.get(element.ownerId);
    if (!ownerCharacter) {
      console.warn(`Element ${element.name} has unknown owner: ${element.ownerId}`);
      return;
    }
    
    const edge = createEdge(
      ownerCharacter.id,
      element.id,
      'ownership',
      {
        label: `owns`,
        strength: ownerCharacter.tier === 'Core' ? 1 : 0.7,
      }
    );
    
    if (edge) {
      edges.push(edge);
    }
  });
  
  console.info(`Created ${edges.length} ownership edges`);
  return edges;
}

// ============================================================================
// Requirement Edges (Puzzle -> Element)
// ============================================================================

/**
 * Create requirement edges between puzzles and required elements
 */
export function createRequirementEdges(
  puzzles: Puzzle[],
  lookupMaps: EntityLookupMaps
): GraphEdge[] {
  const edges: GraphEdge[] = [];
  
  puzzles.forEach(puzzle => {
    if (!puzzle.puzzleElementIds || puzzle.puzzleElementIds.length === 0) return;
    
    puzzle.puzzleElementIds.forEach(elementId => {
      // Check if element exists
      const element = lookupMaps.elements.get(elementId);
      if (!element) {
        console.warn(`Puzzle ${puzzle.name} requires unknown element: ${elementId}`);
        return;
      }
      
      const edge = createEdge(
        puzzle.id,
        elementId,
        'requirement',
        {
          label: 'needs',
          strength: 0.8,
        }
      );
      
      if (edge) {
        edges.push(edge);
      }
    });
  });
  
  console.info(`Created ${edges.length} requirement edges`);
  return edges;
}

// ============================================================================
// Reward Edges (Puzzle -> Element)
// ============================================================================

/**
 * Create reward edges between puzzles and reward elements
 */
export function createRewardEdges(
  puzzles: Puzzle[],
  lookupMaps: EntityLookupMaps
): GraphEdge[] {
  const edges: GraphEdge[] = [];
  
  puzzles.forEach(puzzle => {
    if (!puzzle.rewardIds || puzzle.rewardIds.length === 0) return;
    
    puzzle.rewardIds.forEach(elementId => {
      // Check if element exists
      const element = lookupMaps.elements.get(elementId);
      if (!element) {
        console.warn(`Puzzle ${puzzle.name} rewards unknown element: ${elementId}`);
        return;
      }
      
      const edge = createEdge(
        puzzle.id,
        elementId,
        'reward',
        {
          label: 'gives',
          strength: 1,
        }
      );
      
      if (edge) {
        edges.push(edge);
      }
    });
  });
  
  console.info(`Created ${edges.length} reward edges`);
  return edges;
}

// ============================================================================
// Timeline Edges (Element -> Timeline)
// ============================================================================

/**
 * Create timeline edges between elements and timeline events they reveal
 */
export function createTimelineEdges(
  elements: Element[],
  lookupMaps: EntityLookupMaps
): GraphEdge[] {
  const edges: GraphEdge[] = [];
  
  elements.forEach(element => {
    if (!element.timelineEventId) return;
    
    // Check if timeline event exists
    const timelineEvent = lookupMaps.timeline.get(element.timelineEventId);
    if (!timelineEvent) {
      console.warn(`Element ${element.name} reveals unknown timeline: ${element.timelineEventId}`);
      return;
    }
    
    const edge = createEdge(
      element.id,
      timelineEvent.id,
      'timeline',
      {
        label: 'reveals',
        strength: 0.6,
      }
    );
    
    if (edge) {
      edges.push(edge);
    }
  });
  
  console.info(`Created ${edges.length} timeline edges`);
  return edges;
}

// ============================================================================
// Chain Edges (Puzzle -> Puzzle)
// ============================================================================

/**
 * Create chain edges between parent and child puzzles
 */
export function createChainEdges(
  puzzles: Puzzle[],
  lookupMaps: EntityLookupMaps
): GraphEdge[] {
  const edges: GraphEdge[] = [];
  
  puzzles.forEach(puzzle => {
    // Parent -> Child edges
    if (puzzle.subPuzzleIds && puzzle.subPuzzleIds.length > 0) {
      puzzle.subPuzzleIds.forEach(subPuzzleId => {
        const subPuzzle = lookupMaps.puzzles.get(subPuzzleId);
        if (!subPuzzle) {
          console.warn(`Puzzle ${puzzle.name} has unknown sub-puzzle: ${subPuzzleId}`);
          return;
        }
        
        const edge = createEdge(
          puzzle.id,
          subPuzzleId,
          'chain',
          {
            label: 'leads to',
            strength: 1,
          }
        );
        
        if (edge) {
          edges.push(edge);
        }
      });
    }
  });
  
  console.info(`Created ${edges.length} chain edges`);
  return edges;
}

// ============================================================================
// Container Edges (Element -> Element)
// ============================================================================

/**
 * Create container edges between elements and their contents
 */
export function createContainerEdges(
  elements: Element[],
  lookupMaps: EntityLookupMaps
): GraphEdge[] {
  const edges: GraphEdge[] = [];
  
  elements.forEach(element => {
    if (!element.contentIds || element.contentIds.length === 0) return;
    
    element.contentIds.forEach(contentId => {
      const contentElement = lookupMaps.elements.get(contentId);
      if (!contentElement) {
        console.warn(`Element ${element.name} contains unknown element: ${contentId}`);
        return;
      }
      
      const edge = createEdge(
        element.id,
        contentId,
        'container',
        {
          label: 'contains',
          strength: 0.7,
        }
      );
      
      if (edge) {
        edges.push(edge);
      }
    });
  });
  
  console.info(`Created ${edges.length} container edges`);
  return edges;
}

// ============================================================================
// Main Relationship Resolution
// ============================================================================

/**
 * Data integrity report for missing entities
 */
export interface DataIntegrityReport {
  missingEntities: Map<string, { type: EntityType; referencedBy: string[] }>;
  brokenRelationships: number;
  totalRelationships: number;
  integrityScore: number; // 0-100 percentage
}

/**
 * Resolve all relationships and create edges
 * Original version - kept for backward compatibility
 */
export function resolveAllRelationships(
  characters: Character[],
  elements: Element[],
  puzzles: Puzzle[],
  timeline: TimelineEvent[]
): GraphEdge[] {
  // Build lookup maps for efficient resolution
  const lookupMaps = buildLookupMaps(characters, elements, puzzles, timeline);
  
  console.group('Resolving relationships');
  
  // Create all edge types
  const allEdges: GraphEdge[] = [
    ...createOwnershipEdges(elements, lookupMaps),
    ...createRequirementEdges(puzzles, lookupMaps),
    ...createRewardEdges(puzzles, lookupMaps),
    ...createTimelineEdges(elements, lookupMaps),
    ...createChainEdges(puzzles, lookupMaps),
    ...createContainerEdges(elements, lookupMaps),
  ];
  
  console.info(`Total edges created: ${allEdges.length}`);
  console.groupEnd();
  
  // Remove duplicates (shouldn't happen but just in case)
  const uniqueEdges = new Map<string, GraphEdge>();
  allEdges.forEach(edge => {
    uniqueEdges.set(edge.id, edge);
  });
  
  return Array.from(uniqueEdges.values());
}

/**
 * Enhanced relationship resolution with placeholder nodes for missing entities
 * Returns edges, placeholder nodes, and data integrity report
 */
export function resolveRelationshipsWithIntegrity(
  characters: Character[],
  elements: Element[],
  puzzles: Puzzle[],
  timeline: TimelineEvent[]
): {
  edges: GraphEdge[];
  placeholderNodes: Node<PlaceholderNodeData>[];
  report: DataIntegrityReport;
} {
  // Build lookup maps for efficient resolution
  const lookupMaps = buildLookupMaps(characters, elements, puzzles, timeline);
  
  // Track missing entities
  const missingEntities = new Map<string, { type: EntityType; referencedBy: string[] }>();
  const placeholderNodes: Node<PlaceholderNodeData>[] = [];
  let brokenRelationships = 0;
  let totalRelationships = 0;
  
  console.group('Resolving relationships with integrity checking');
  
  // Helper to track missing entity
  const trackMissingEntity = (id: string, type: EntityType, referencedBy: string) => {
    const existing = missingEntities.get(id);
    if (existing) {
      existing.referencedBy.push(referencedBy);
    } else {
      missingEntities.set(id, { type, referencedBy: [referencedBy] });
    }
  };
  
  // Create all edge types with missing entity tracking
  const allEdges: GraphEdge[] = [];
  
  // First, scan all entities for references to missing entities
  // This is more comprehensive than just looking at created edges
  
  // Check Elements for missing owners
  elements.forEach(element => {
    if (element.ownerId && !lookupMaps.characters.has(element.ownerId)) {
      trackMissingEntity(element.ownerId, 'character', `Element: ${element.name}`);
    }
    if (element.timelineEventId && !lookupMaps.timeline.has(element.timelineEventId)) {
      trackMissingEntity(element.timelineEventId, 'timeline', `Element: ${element.name}`);
    }
    // Check container relationships
    element.contentIds?.forEach(contentId => {
      if (!lookupMaps.elements.has(contentId)) {
        trackMissingEntity(contentId, 'element', `Container: ${element.name}`);
      }
    });
  });
  
  // Check Puzzles for missing elements and sub-puzzles
  puzzles.forEach(puzzle => {
    puzzle.puzzleElementIds?.forEach(elementId => {
      if (!lookupMaps.elements.has(elementId)) {
        trackMissingEntity(elementId, 'element', `Puzzle requirement: ${puzzle.name}`);
      }
    });
    puzzle.rewardIds?.forEach(elementId => {
      if (!lookupMaps.elements.has(elementId)) {
        trackMissingEntity(elementId, 'element', `Puzzle reward: ${puzzle.name}`);
      }
    });
    puzzle.subPuzzleIds?.forEach(subPuzzleId => {
      if (!lookupMaps.puzzles.has(subPuzzleId)) {
        trackMissingEntity(subPuzzleId, 'puzzle', `Parent puzzle: ${puzzle.name}`);
      }
    });
  });
  
  // Create edges (these won't include edges to missing entities due to the checks in creation functions)
  const standardEdges = [
    ...createOwnershipEdges(elements, lookupMaps),
    ...createRequirementEdges(puzzles, lookupMaps),
    ...createRewardEdges(puzzles, lookupMaps),
    ...createTimelineEdges(elements, lookupMaps),
    ...createChainEdges(puzzles, lookupMaps),
    ...createContainerEdges(elements, lookupMaps),
  ];
  
  // Count relationships (including broken ones we couldn't create)
  totalRelationships = standardEdges.length + missingEntities.size;
  brokenRelationships = missingEntities.size;
  
  // Add the created edges
  allEdges.push(...standardEdges);
  
  // Create placeholder nodes for missing entities
  missingEntities.forEach((info, id) => {
    const placeholder = createPlaceholderNode(
      id, 
      info.type,
      info.referencedBy.join(', ')
    );
    placeholderNodes.push(placeholder);
  });
  
  // Calculate integrity score
  const integrityScore = totalRelationships > 0
    ? Math.round(((totalRelationships - brokenRelationships) / totalRelationships) * 100)
    : 100;
  
  console.log(`Data integrity: ${integrityScore}%`);
  console.log(`Missing entities: ${missingEntities.size}`);
  console.log(`Broken relationships: ${brokenRelationships}/${totalRelationships}`);
  console.groupEnd();
  
  // Remove duplicates
  const uniqueEdges = new Map<string, GraphEdge>();
  allEdges.forEach(edge => {
    uniqueEdges.set(edge.id, edge);
  });
  
  return {
    edges: Array.from(uniqueEdges.values()),
    placeholderNodes,
    report: {
      missingEntities,
      brokenRelationships,
      totalRelationships,
      integrityScore,
    },
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Filter edges by relationship type
 */
export function filterEdgesByType(
  edges: GraphEdge[],
  types: RelationshipType[]
): GraphEdge[] {
  return edges.filter(edge => 
    types.includes(edge.data?.relationshipType as RelationshipType)
  );
}

/**
 * Get edges connected to a specific node
 */
export function getConnectedEdges(
  nodeId: string,
  edges: GraphEdge[]
): {
  incoming: GraphEdge[];
  outgoing: GraphEdge[];
} {
  return {
    incoming: edges.filter(e => e.target === nodeId),
    outgoing: edges.filter(e => e.source === nodeId),
  };
}

/**
 * Calculate node connectivity score
 */
export function calculateConnectivity(
  nodeId: string,
  edges: GraphEdge[]
): number {
  const connected = getConnectedEdges(nodeId, edges);
  return connected.incoming.length + connected.outgoing.length;
}