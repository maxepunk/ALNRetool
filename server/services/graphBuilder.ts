/**
 * Server-Side Graph Builder Service
 * 
 * Builds complete graph structure (nodes and edges) on the server
 * with guaranteed access to ALL data, eliminating pagination boundary issues.
 * 
 * @module server/services/graphBuilder
 * 
 * **Architecture:**
 * - Processes all entities to create nodes
 * - Resolves all relationships to create edges
 * - Generates placeholder nodes for missing entities
 * - Returns complete graph ready for React Flow
 * 
 * **Key Benefits:**
 * - No silent failures from missing entities
 * - Data integrity visualization via placeholders
 * - Single source of truth for relationships
 * - Complete graph in one HTTP request
 */

import type { Character, Element, Puzzle, TimelineEvent } from '../../src/types/notion/app.js';
import type { Node, Edge } from '@xyflow/react';
import { log } from '../utils/logger.js';

/**
 * Node type definitions matching frontend expectations
 */
type NodeType = 'character' | 'element' | 'puzzle' | 'timeline' | 'placeholder';

interface GraphNode extends Node {
  type: NodeType;
  data: {
    label: string;
    entity: Character | Element | Puzzle | TimelineEvent | null;
    metadata: {
      entityType: string;
      isPlaceholder?: boolean;
      missingFrom?: string;
    };
  };
}

/**
 * Edge style configurations (matching frontend EDGE_STYLES)
 */
const EDGE_STYLES = {
  dependency: {
    stroke: 'hsl(var(--muted-foreground))',
    strokeWidth: 2,
    animated: false,
    label: undefined,
  },
  reward: {
    stroke: '#10b981',
    strokeWidth: 2,
    strokeDasharray: '5,5',
    animated: true,
    label: 'reward',
  },
  requirement: {
    stroke: '#f59e0b',
    strokeWidth: 2,
    animated: false,
    label: 'requires',
  },
  ownership: {
    stroke: '#8b5cf6',
    strokeWidth: 2,
    strokeDasharray: '3,3',
    animated: false,
    label: 'owns',
  },
  chain: {
    stroke: '#ef4444',
    strokeWidth: 3,
    animated: true,
    label: 'chain',
  },
  timeline: {
    stroke: 'hsl(var(--muted-foreground))',
    strokeWidth: 1,
    strokeDasharray: '2,2',
    animated: false,
    label: undefined,
  },
  relationship: {
    stroke: '#3b82f6',
    strokeWidth: 1,
    strokeDasharray: '1,2',
    animated: false,
    label: undefined,
  },
  puzzle: {
    stroke: '#9333ea',
    strokeWidth: 2,
    animated: false,
    label: 'puzzle',
  },
  association: {
    stroke: '#6366f1',
    strokeWidth: 1.5,
    strokeDasharray: '3,3',
    animated: false,
    label: 'associated',
  },
};

/**
 * Build complete graph structure from all entities
 * 
 * @param entities - All entities fetched from Notion
 * @returns Complete graph with nodes and edges
 */
export function buildCompleteGraph(entities: {
  characters: Character[];
  elements: Element[];
  puzzles: Puzzle[];
  timeline: TimelineEvent[];
}): {
  nodes: GraphNode[];
  edges: Edge[];
  metadata: {
    totalNodes: number;
    totalEdges: number;
    placeholderNodes: number;
    missingEntities: Array<{ id: string; referencedBy: string; type: string }>;
  };
} {
  const startTime = Date.now();
  
  // Create lookup maps for O(1) entity access
  const characterMap = new Map(entities.characters.map(c => [c.id, c]));
  const elementMap = new Map(entities.elements.map(e => [e.id, e]));
  const puzzleMap = new Map(entities.puzzles.map(p => [p.id, p]));
  const timelineMap = new Map(entities.timeline.map(t => [t.id, t]));
  
  // Track placeholder nodes needed
  const placeholderNodes = new Map<string, GraphNode>();
  const missingEntities: Array<{ id: string; referencedBy: string; type: string }> = [];
  
  // Create nodes from all entities
  const nodes: GraphNode[] = [];
  
  // Character nodes
  entities.characters.forEach(character => {
    nodes.push({
      id: character.id,
      type: 'character',
      position: { x: 0, y: 0 }, // Will be set by layout engine
      data: {
        label: character.name || 'Unnamed Character',
        entity: character,
        metadata: {
          entityType: 'character',
        },
      },
    });
  });
  
  // Element nodes
  entities.elements.forEach(element => {
    nodes.push({
      id: element.id,
      type: 'element',
      position: { x: 0, y: 0 },
      data: {
        label: element.name || 'Unnamed Element',
        entity: element,
        metadata: {
          entityType: 'element',
        },
      },
    });
  });
  
  // Puzzle nodes
  entities.puzzles.forEach(puzzle => {
    nodes.push({
      id: puzzle.id,
      type: 'puzzle',
      position: { x: 0, y: 0 },
      data: {
        label: puzzle.name || 'Unnamed Puzzle',
        entity: puzzle,
        metadata: {
          entityType: 'puzzle',
        },
      },
    });
  });
  
  // Timeline nodes
  entities.timeline.forEach(event => {
    nodes.push({
      id: event.id,
      type: 'timeline',
      position: { x: 0, y: 0 },
      data: {
        label: event.name || 'Unnamed Event',
        entity: event,
        metadata: {
          entityType: 'timeline',
        },
      },
    });
  });
  
  // Create edges with relationship resolution
  const edges: Edge[] = [];
  const edgeSet = new Set<string>(); // Prevent duplicates
  
  /**
   * Helper to create placeholder node if entity is missing
   */
  const ensureNode = (entityId: string, entityType: string, referencedBy: string): void => {
    // Check if entity exists
    const exists = 
      characterMap.has(entityId) ||
      elementMap.has(entityId) ||
      puzzleMap.has(entityId) ||
      timelineMap.has(entityId);
    
    if (!exists && !placeholderNodes.has(entityId)) {
      // Create placeholder node
      const placeholder: GraphNode = {
        id: entityId,
        type: 'placeholder',
        position: { x: 0, y: 0 },
        data: {
          label: `Missing ${entityType}`,
          entity: null,
          metadata: {
            entityType,
            isPlaceholder: true,
            missingFrom: referencedBy,
          },
        },
      };
      
      placeholderNodes.set(entityId, placeholder);
      missingEntities.push({
        id: entityId,
        referencedBy,
        type: entityType,
      });
      
      log.warn('[GraphBuilder] Creating placeholder node', {
        entityId,
        entityType,
        referencedBy,
      });
    }
  };
  
  /**
   * Helper to create edge with deduplication
   */
  const createEdge = (
    source: string,
    target: string,
    type: keyof typeof EDGE_STYLES,
    weight: number = 1
  ): void => {
    const edgeId = `${source}-${target}-${type}`;
    
    if (!edgeSet.has(edgeId)) {
      edgeSet.add(edgeId);
      
      const style = EDGE_STYLES[type];
      const edgeStyle: any = {
        stroke: style.stroke,
        strokeWidth: style.strokeWidth,
      };
      
      // Only add strokeDasharray if it exists in the style
      if ('strokeDasharray' in style) {
        edgeStyle.strokeDasharray = style.strokeDasharray;
      }
      
      edges.push({
        id: edgeId,
        source,
        target,
        type: 'default',
        animated: style.animated,
        label: style.label,
        style: edgeStyle,
        data: {
          weight,
          relationshipType: type,
        },
      });
    }
  };
  
  // Process Character relationships
  entities.characters.forEach(character => {
    // Owned elements (character -> element)
    if (character.ownedElementIds?.length) {
      character.ownedElementIds.forEach(elementId => {
        ensureNode(elementId, 'element', `character:${character.id}`);
        createEdge(character.id, elementId, 'ownership', 10);
      });
    }
    
    // Associated elements (character <-> element)
    // These are elements connected through timeline events (narrative connections)
    if (character.associatedElementIds?.length) {
      character.associatedElementIds.forEach(elementId => {
        ensureNode(elementId, 'element', `character:${character.id}`);
        createEdge(character.id, elementId, 'association', 6);
      });
    }
    
    // Character puzzles (character <-> puzzle)
    if (character.characterPuzzleIds?.length) {
      character.characterPuzzleIds.forEach(puzzleId => {
        ensureNode(puzzleId, 'puzzle', `character:${character.id}`);
        createEdge(character.id, puzzleId, 'puzzle', 7);
      });
    }
    
    // Timeline events (character <-> timeline)
    if (character.eventIds?.length) {
      character.eventIds.forEach(eventId => {
        ensureNode(eventId, 'timeline', `character:${character.id}`);
        createEdge(character.id, eventId, 'timeline', 6);
      });
    }
  });

  // Process Element relationships
  entities.elements.forEach(element => {
    // Owner relationship
    if (element.ownerId) {
      ensureNode(element.ownerId, 'character', `element:${element.id}`);
      createEdge(element.ownerId, element.id, 'ownership', 10);
    }
    
    // Required for puzzles (element -> puzzle)
    if (element.requiredForPuzzleIds?.length) {
      element.requiredForPuzzleIds.forEach(puzzleId => {
        ensureNode(puzzleId, 'puzzle', `element:${element.id}`);
        createEdge(element.id, puzzleId, 'requirement', 8);
      });
    }
    
    // Rewarded by puzzles (puzzle -> element)
    if (element.rewardedByPuzzleIds?.length) {
      element.rewardedByPuzzleIds.forEach(puzzleId => {
        ensureNode(puzzleId, 'puzzle', `element:${element.id}`);
        createEdge(puzzleId, element.id, 'reward', 8);
      });
    }
  });
  
  // Process Puzzle relationships
  entities.puzzles.forEach(puzzle => {
    // Parent-child relationships (dependencies)
    if (puzzle.parentItemId) {
      ensureNode(puzzle.parentItemId, 'puzzle', `puzzle:${puzzle.id}`);
      createEdge(puzzle.parentItemId, puzzle.id, 'dependency', 10);
    }
    
    // Sub-puzzle relationships (chains)
    if (puzzle.subPuzzleIds?.length) {
      puzzle.subPuzzleIds.forEach(subId => {
        ensureNode(subId, 'puzzle', `puzzle:${puzzle.id}`);
        createEdge(puzzle.id, subId, 'chain', 15); // High weight for chains
      });
    }
    
    // Requirements (elements needed for puzzle)
    if (puzzle.puzzleElementIds?.length) {
      puzzle.puzzleElementIds.forEach(elemId => {
        ensureNode(elemId, 'element', `puzzle:${puzzle.id}`);
        createEdge(elemId, puzzle.id, 'requirement', 8);
      });
    }
    
    // Rewards (elements given by puzzle)
    if (puzzle.rewardIds?.length) {
      puzzle.rewardIds.forEach(rewId => {
        ensureNode(rewId, 'element', `puzzle:${puzzle.id}`);
        createEdge(puzzle.id, rewId, 'reward', 8);
      });
    }
  });
  
  // Process Timeline relationships
  entities.timeline.forEach((event, index) => {
    // Connect to next timeline event
    if (index < entities.timeline.length - 1) {
      const nextEvent = entities.timeline[index + 1];
      createEdge(event.id, nextEvent.id, 'timeline', 3);
    }
    
    // Connect to involved characters (RELATION field)
    if (event.charactersInvolvedIds?.length) {
      event.charactersInvolvedIds.forEach(characterId => {
        ensureNode(characterId, 'character', `timeline:${event.id}`);
        createEdge(event.id, characterId, 'timeline', 6);
      });
    }
    
    // Connect to memory/evidence elements (RELATION field)
    if (event.memoryEvidenceIds?.length) {
      event.memoryEvidenceIds.forEach(elementId => {
        ensureNode(elementId, 'element', `timeline:${event.id}`);
        createEdge(event.id, elementId, 'timeline', 6);
      });
    }
    
    // Connect to associated puzzles (synthesized from puzzle.storyReveals)
    // Note: These connections also flow through Elements naturally
    if (event.associatedPuzzles?.length) {
      event.associatedPuzzles.forEach(puzzleId => {
        ensureNode(puzzleId, 'puzzle', `timeline:${event.id}`);
        createEdge(event.id, puzzleId, 'timeline', 5);
      });
    }
  });
  
  // Add placeholder nodes to final node list
  nodes.push(...placeholderNodes.values());
  
  const duration = Date.now() - startTime;
  log.info('[GraphBuilder] Graph built successfully', {
    nodes: nodes.length,
    edges: edges.length,
    placeholders: placeholderNodes.size,
    missingEntities: missingEntities.length,
    durationMs: duration,
  });
  
  return {
    nodes,
    edges,
    metadata: {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      placeholderNodes: placeholderNodes.size,
      missingEntities,
    },
  };
}

/**
 * Filter graph based on view configuration
 * This will be expanded to handle view-specific filtering
 */
export function filterGraphForView(
  graph: { nodes: GraphNode[]; edges: Edge[] },
  viewConfig: any
): { nodes: GraphNode[]; edges: Edge[] } {
  // TODO: Implement view-specific filtering
  // For now, return full graph
  return graph;
}