import { buildCompleteGraph } from './graphBuilder.js';
import { 
  transformCharacter, 
  transformElement, 
  transformPuzzle, 
  transformTimelineEvent 
} from '../../src/types/notion/transforms.js';
import type { Character, Element, Puzzle, TimelineEvent } from '../../src/types/notion/app.js';
import type { Edge } from '@xyflow/react';

/**
 * WHY: To calculate deltas, we need the graph state before mutation.
 * This service captures relevant portions of the graph (not entire graph)
 * to minimize memory usage while enabling accurate delta calculation.
 * 
 * Focuses on the mutated entity and its immediate connections only.
 */

/**
 * Helper function to generate edges for a limited set of entities
 * Extracted from graphBuilder to support in-memory graph updates
 */
export function generateEdgesForEntities(entities: any[]): Edge[] {
  const edges: Edge[] = [];
  const edgeSet = new Set<string>();
  
  // Build lookup maps
  const entityMap = new Map<string, any>();
  entities.forEach(e => {
    if (e && e.id) entityMap.set(e.id, e);
  });
  
  const createEdge = (source: string, target: string, type: string) => {
    const edgeId = `${source}-${target}-${type}`;
    if (!edgeSet.has(edgeId) && entityMap.has(source) && entityMap.has(target)) {
      edgeSet.add(edgeId);
      edges.push({
        id: edgeId,
        source,
        target,
        type: 'default',
        animated: type === 'ownership',
        data: { relationshipType: type }
      });
    }
  };
  
  // Process all entities and their relationships
  entities.forEach(entity => {
    if (!entity) return;
    
    // Character relationships
    if ('type' in entity) {
      entity.ownedElementIds?.forEach((id: string) => createEdge(entity.id, id, 'ownership'));
      entity.associatedElementIds?.forEach((id: string) => createEdge(entity.id, id, 'association'));
      entity.characterPuzzleIds?.forEach((id: string) => createEdge(entity.id, id, 'puzzle'));
      entity.timelineIds?.forEach((id: string) => createEdge(entity.id, id, 'timeline'));
    }
    
    // Element relationships
    if ('sourceCharacterIds' in entity) {
      entity.sourceCharacterIds?.forEach((id: string) => createEdge(id, entity.id, 'source'));
      entity.ownerCharacterIds?.forEach((id: string) => createEdge(id, entity.id, 'ownership'));
      entity.puzzleIds?.forEach((id: string) => createEdge(entity.id, id, 'requirement'));
    }
    
    // Puzzle relationships
    if ('solution' in entity) {
      entity.characterIds?.forEach((id: string) => createEdge(id, entity.id, 'puzzle'));
      entity.requiredElementIds?.forEach((id: string) => createEdge(id, entity.id, 'requirement'));
      entity.rewardElementIds?.forEach((id: string) => createEdge(entity.id, id, 'reward'));
    }
    
    // Timeline relationships
    if ('time' in entity) {
      entity.characterIds?.forEach((id: string) => createEdge(id, entity.id, 'timeline'));
    }
  });
  
  return edges;
}
export async function captureGraphState(entityId: string, entityType: string): Promise<any | null> {
  try {
    // CRITICAL: Do NOT cache pre-mutation state!
    // WHY: If two mutations happen within cache window, the second will use
    // stale "before" state from the first, causing incorrect deltas and data corruption.
    // We MUST always capture fresh state immediately before each mutation.
    
    // PERFORMANCE OPTIMIZATION: Only fetch the entity being mutated and its direct relations
    // WHY: Fetching all entities causes unacceptable latency as data grows
    const notion = await import('./notion.js').then(m => m.notion);
    
    // Step 1: Fetch the target entity to get its relationships
    let targetEntity: any = null;
    const relatedIds = new Set<string>();
    
    try {
      const page = await notion.pages.retrieve({ page_id: entityId });
      
      // Transform based on entity type
      if (entityType === 'characters') {
        targetEntity = transformCharacter(page as any);
        // Collect all related IDs from character
        targetEntity.ownedElementIds?.forEach((id: string) => relatedIds.add(id));
        targetEntity.associatedElementIds?.forEach((id: string) => relatedIds.add(id));
        targetEntity.characterPuzzleIds?.forEach((id: string) => relatedIds.add(id));
        targetEntity.timelineIds?.forEach((id: string) => relatedIds.add(id));
      } else if (entityType === 'elements') {
        targetEntity = transformElement(page as any);
        targetEntity.sourceCharacterIds?.forEach((id: string) => relatedIds.add(id));
        targetEntity.ownerCharacterIds?.forEach((id: string) => relatedIds.add(id));
        targetEntity.puzzleIds?.forEach((id: string) => relatedIds.add(id));
      } else if (entityType === 'puzzles') {
        targetEntity = transformPuzzle(page as any);
        targetEntity.characterIds?.forEach((id: string) => relatedIds.add(id));
        targetEntity.requiredElementIds?.forEach((id: string) => relatedIds.add(id));
        targetEntity.rewardElementIds?.forEach((id: string) => relatedIds.add(id));
      } else if (entityType === 'timeline') {
        targetEntity = transformTimelineEvent(page as any);
        targetEntity.characterIds?.forEach((id: string) => relatedIds.add(id));
      }
    } catch (error) {
      console.warn(`Could not fetch target entity ${entityId}:`, error);
    }
    
    // Step 2: Fetch only the related entities in parallel
    const relatedEntities: any[] = [];
    if (relatedIds.size > 0) {
      const fetchPromises = Array.from(relatedIds).map(async (id) => {
        try {
          const page = await notion.pages.retrieve({ page_id: id });
          return page;
        } catch (error) {
          console.warn(`Could not fetch related entity ${id}:`, error);
          return null;
        }
      });
      
      const relatedPages = await Promise.all(fetchPromises);
      
      // Transform the related entities based on their types
      for (const page of relatedPages) {
        if (!page) continue;
        
        // Detect type from page properties and transform accordingly
        const props = (page as any).properties;
        if (props.Type) {
          relatedEntities.push(transformCharacter(page as any));
        } else if (props.Source) {
          relatedEntities.push(transformElement(page as any));
        } else if (props.Solution) {
          relatedEntities.push(transformPuzzle(page as any));
        } else if (props.Time) {
          relatedEntities.push(transformTimelineEvent(page as any));
        }
      }
    }
    
    // Step 3: Build a minimal graph with just the target and related entities
    const allEntities = targetEntity ? [targetEntity, ...relatedEntities] : relatedEntities;
    
    // Create entity maps for graph building
    const characters = allEntities.filter(e => e && 'type' in e);
    const elements = allEntities.filter(e => e && 'sourceCharacterIds' in e);
    const puzzles = allEntities.filter(e => e && 'solution' in e);
    const timeline = allEntities.filter(e => e && 'time' in e);
  
  // Build current graph state
  const graphData = buildCompleteGraph({ characters, elements, puzzles, timeline });
  
  // Extract only the relevant portion (entity + connections)
  // WHY: Full graph might be thousands of nodes, we only need ~10-50
  
  // First, find all edges connected to this entity
  const connectedEdges = graphData.edges.filter(e =>
    e.source === entityId || e.target === entityId
  );
  
  // Get all node IDs connected via edges
  const connectedNodeIds = new Set<string>([entityId]);
  connectedEdges.forEach(e => {
    connectedNodeIds.add(e.source);
    connectedNodeIds.add(e.target);
  });
  
  // Get the nodes for these IDs
  const relevantNodes = graphData.nodes.filter(n => 
    connectedNodeIds.has(n.id)
  );
  
  // Include all edges between relevant nodes
  const relevantEdges = graphData.edges.filter(e =>
    connectedNodeIds.has(e.source) && connectedNodeIds.has(e.target)
  );
  
  const state = { 
    nodes: relevantNodes, 
    edges: relevantEdges,
    capturedAt: Date.now()
  };
  
  // DO NOT CACHE - must always be fresh for accurate delta calculation
  
  console.log(`Captured graph state for ${entityType}:${entityId} - ${relevantNodes.length} nodes, ${relevantEdges.length} edges`);
  return state;
  
  } catch (error) {
    console.error(`[GraphStateCapture] Error capturing state for ${entityType}:${entityId}:`, error);
    
    // Return null on error - caller will handle gracefully with full cache invalidation
    // This maintains type consistency with GraphState interface
    return null;
  }
}