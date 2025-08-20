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
  EntityType,
  PlaceholderNodeData,
  GraphNode
} from './types';
import type { Node } from '@xyflow/react';
import { EdgeBuilder } from './modules/EdgeBuilder';

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
      label: `Missing ${entityType}: ${id.slice(0, 8)}...`,
      metadata: {
        entityType,
        entityId: id,
        isPlaceholder: true,
        missingReason: `Referenced ${entityType} not found in Notion (referenced by: ${referencedBy || 'unknown'})`,
      },
      visualHints: {
        color: '#dc2626', // Red for missing
        size: 'small',
        shape: 'circle',
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
  // Adapter: Use EdgeBuilder version for consistency
  const edgeBuilder = new EdgeBuilder();
  const edges = createOwnershipEdgesWithBuilder(elements, lookupMaps, edgeBuilder);
  
  // Transform edge data structure for backward compatibility
  const transformedEdges = edges.map(edge => ({
    ...edge,
    data: {
      relationshipType: edge.data?.relationshipType || 'ownership',
      ...edge.data,
      ...edge.data?.metadata, // Flatten metadata into data
    }
  })) as GraphEdge[];
  
  console.info(`Created ${transformedEdges.length} ownership edges`);
  return transformedEdges;
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
  // Adapter: Use EdgeBuilder version for consistency
  const edgeBuilder = new EdgeBuilder();
  const edges = createRequirementEdgesWithBuilder(puzzles, lookupMaps, edgeBuilder);
  
  // Transform edge data structure for backward compatibility
  const transformedEdges = edges.map(edge => ({
    ...edge,
    data: {
      relationshipType: edge.data?.relationshipType || 'requirement',
      ...edge.data,
      ...edge.data?.metadata, // Flatten metadata into data
    }
  })) as GraphEdge[];
  
  console.info(`Created ${transformedEdges.length} requirement edges`);
  return transformedEdges;
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
  // Adapter: Use EdgeBuilder version for consistency
  const edgeBuilder = new EdgeBuilder();
  const edges = createRewardEdgesWithBuilder(puzzles, lookupMaps, edgeBuilder);
  
  // Transform edge data structure for backward compatibility
  const transformedEdges = edges.map(edge => ({
    ...edge,
    data: {
      relationshipType: edge.data?.relationshipType || 'reward',
      ...edge.data,
      ...edge.data?.metadata, // Flatten metadata into data
    }
  })) as GraphEdge[];
  
  console.info(`Created ${transformedEdges.length} reward edges`);
  return transformedEdges;
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
  // Adapter: Use EdgeBuilder version for consistency
  const edgeBuilder = new EdgeBuilder();
  const edges = createTimelineEdgesWithBuilder(elements, lookupMaps, edgeBuilder);
  
  // Transform edge data structure for backward compatibility
  const transformedEdges = edges.map(edge => ({
    ...edge,
    data: {
      relationshipType: edge.data?.relationshipType || 'timeline',
      ...edge.data,
      ...edge.data?.metadata, // Flatten metadata into data
    }
  })) as GraphEdge[];
  
  console.info(`Created ${transformedEdges.length} timeline edges`);
  return transformedEdges;
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
  // Adapter: Use EdgeBuilder version for consistency
  const edgeBuilder = new EdgeBuilder();
  const edges = createContainerEdgesWithBuilder(elements, lookupMaps, edgeBuilder);
  
  // Transform edge data structure for backward compatibility
  const transformedEdges = edges.map(edge => ({
    ...edge,
    data: {
      relationshipType: edge.data?.relationshipType || 'container',
      ...edge.data,
      ...edge.data?.metadata, // Flatten metadata into data
    }
  })) as GraphEdge[];
  
  console.info(`Created ${transformedEdges.length} container edges`);
  return transformedEdges;
}

// ============================================================================
// EdgeBuilder-based Edge Creation Functions (Phase 3: Smart Edge Weighting)
// ============================================================================

/**
 * Create ownership edges using EdgeBuilder with smart weighting
 */
function createOwnershipEdgesWithBuilder(
  elements: Element[],
  lookupMaps: EntityLookupMaps,
  edgeBuilder: EdgeBuilder
): GraphEdge[] {
  const edges: GraphEdge[] = [];
  
  elements.forEach(element => {
    if (!element.ownerId) return;
    
    // Check if owner exists
    const owner = lookupMaps.characters.get(element.ownerId);
    if (!owner) {
      console.warn(`Element ${element.name} has unknown owner: ${element.ownerId}`);
      return;
    }
    
    const edge = edgeBuilder.createEdge(
      element.ownerId,  // Character is source
      element.id,       // Element is target
      'ownership',
      {
        metadata: {
          label: 'owns',
          strength: 0.9,
        }
      }
    );
    
    if (edge) {
      edges.push(edge);
    }
  });
  
  return edges;
}

/**
 * Create requirement edges using EdgeBuilder with smart weighting
 */
function createRequirementEdgesWithBuilder(
  puzzles: Puzzle[],
  lookupMaps: EntityLookupMaps,
  edgeBuilder: EdgeBuilder
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
      
      const edge = edgeBuilder.createEdge(
        elementId,  // Element is the source (flows into puzzle)
        puzzle.id,  // Puzzle is the target (receives the element)
        'requirement',
        {
          metadata: {
            label: 'needs',
            strength: 0.8,
          }
        }
      );
      
      if (edge) {
        edges.push(edge);
      }
    });
  });
  
  return edges;
}

/**
 * Create reward edges using EdgeBuilder with smart weighting
 */
function createRewardEdgesWithBuilder(
  puzzles: Puzzle[],
  lookupMaps: EntityLookupMaps,
  edgeBuilder: EdgeBuilder
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
      
      const edge = edgeBuilder.createEdge(
        puzzle.id,   // Puzzle is the source (provides the reward)
        elementId,   // Element is the target (receives as reward)
        'reward',
        {
          metadata: {
            label: 'gives',
            strength: 0.7,
          }
        }
      );
      
      if (edge) {
        edges.push(edge);
      }
    });
  });
  
  return edges;
}

/**
 * Create timeline edges using EdgeBuilder with smart weighting
 */
function createTimelineEdgesWithBuilder(
  elements: Element[],
  lookupMaps: EntityLookupMaps,
  edgeBuilder: EdgeBuilder
): GraphEdge[] {
  const edges: GraphEdge[] = [];
  
  elements.forEach(element => {
    if (!element.timelineEventId) return;
    
    // Check if timeline event exists
    const timelineEvent = lookupMaps.timeline.get(element.timelineEventId);
    if (!timelineEvent) {
      // This is expected in filtered views where not all timeline events are included
      console.debug(`Element ${element.name} references timeline event not in current view: ${element.timelineEventId}`);
      return;
    }
    
    const edge = edgeBuilder.createEdge(
      element.id,
      element.timelineEventId,
      'timeline',
      {
        metadata: {
          label: 'appears in',
          strength: 0.5,
        }
      }
    );
    
    if (edge) {
      edges.push(edge);
    }
  });
  
  return edges;
}

/**
 * Create container edges using EdgeBuilder with smart weighting
 */
function createContainerEdgesWithBuilder(
  elements: Element[],
  lookupMaps: EntityLookupMaps,
  edgeBuilder: EdgeBuilder
): GraphEdge[] {
  const edges: GraphEdge[] = [];
  
  elements.forEach(element => {
    if (!element.contentIds || element.contentIds.length === 0) return;
    
    element.contentIds.forEach(contentId => {
      // Skip self-referential edges
      if (element.id === contentId) {
        console.warn(`Self-referential edge ignored: Element ${element.name} cannot contain itself`);
        return;
      }
      
      // Check if content element exists
      const contentElement = lookupMaps.elements.get(contentId);
      if (!contentElement) {
        console.warn(`Element ${element.name} contains unknown element: ${contentId}`);
        return;
      }
      
      const edge = edgeBuilder.createEdge(
        element.id,   // Container is source
        contentId,    // Content element is target
        'container',
        {
          metadata: {
            label: 'contains',
            strength: 0.7,
          }
        }
      );
      
      if (edge) {
        edges.push(edge);
      }
    });
  });
  
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
  timeline: TimelineEvent[],
  nodes?: GraphNode[]
): GraphEdge[] {
  // Build lookup maps for efficient resolution
  const lookupMaps = buildLookupMaps(characters, elements, puzzles, timeline);
  
  console.group('Resolving relationships with smart edge weighting');
  
  // Phase 3: Use EdgeBuilder for smart edge weighting
  // Create EdgeBuilder with nodes for affinity analysis
  const edgeBuilder = new EdgeBuilder([], nodes);
  
  // Create all edge types using EdgeBuilder
  createOwnershipEdgesWithBuilder(elements, lookupMaps, edgeBuilder);
  createRequirementEdgesWithBuilder(puzzles, lookupMaps, edgeBuilder);
  createRewardEdgesWithBuilder(puzzles, lookupMaps, edgeBuilder);
  createTimelineEdgesWithBuilder(elements, lookupMaps, edgeBuilder);
  createContainerEdgesWithBuilder(elements, lookupMaps, edgeBuilder);
  // Note: Chain edges have been removed - replaced by dependency edges
  
  // Get statistics including affinity analysis
  const stats = edgeBuilder.getStatistics();
  
  // Only analyze affinity if we have nodes
  if (nodes && nodes.length > 0) {
    const affinity = edgeBuilder.analyzeElementAffinity();
    console.info(`Dual-role elements: ${affinity.dualRoleElements.length}`);
    console.info(`Multi-puzzle elements: ${affinity.multiPuzzleElements.length}`);
    console.info(`High affinity edges: ${affinity.highAffinityEdges.length}`);
  }
  
  console.info(`Total edges created: ${stats.total}`);
  console.info(`Average edge weight: ${stats.averageWeight.toFixed(2)}`);
  console.info(`Weight distribution:`, stats.weightDistribution);
  console.groupEnd();
  
  return edgeBuilder.getEdges();
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