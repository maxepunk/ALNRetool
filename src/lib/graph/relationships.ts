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
  EdgeMetadata 
} from './types';

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

// ============================================================================
// Lookup Map Builders
// ============================================================================

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
 */
function createEdge(
  source: string,
  target: string,
  relationshipType: RelationshipType,
  metadata?: Partial<EdgeMetadata>
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
  
  const edgeStyle = EDGE_STYLES[relationshipType];
  
  const edge: GraphEdge = {
    id: createEdgeId(source, target, relationshipType),
    source,
    target,
    ...edgeStyle,
    data: {
      relationshipType,
      strength: metadata?.strength || 1,
      label: metadata?.label || (edgeStyle.label as string),
      bidirectional: metadata?.bidirectional || false,
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
 * Resolve all relationships and create edges
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