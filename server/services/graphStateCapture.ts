import { buildCompleteGraph } from './graphBuilder.js';
import { 
  transformCharacter, 
  transformElement, 
  transformPuzzle, 
  transformTimelineEvent 
} from '../../src/types/notion/transforms.js';
import { detectEntityType, EntityType } from '../utils/entityTypeDetection.js';
import type { Character, Element, Puzzle, TimelineEvent } from '../../src/types/notion/app.js';
import type { Edge } from '@xyflow/react';
import type { NotionPage } from '../../src/types/notion/raw.js';

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
    
    // Element relationships - using ACTUAL properties from Element interface
    if ('basicType' in entity && 'status' in entity) {
      entity.associatedCharacterIds?.forEach((id: string) => createEdge(id, entity.id, 'association'));
      if (entity.ownerId) createEdge(entity.ownerId, entity.id, 'ownership');
      if (entity.containerId) createEdge(entity.containerId, entity.id, 'container');
      entity.contentIds?.forEach((id: string) => createEdge(entity.id, id, 'contains'));
      entity.requiredForPuzzleIds?.forEach((id: string) => createEdge(entity.id, id, 'requirement'));
      entity.rewardedByPuzzleIds?.forEach((id: string) => createEdge(id, entity.id, 'reward'));
      if (entity.timelineEventId) createEdge(entity.id, entity.timelineEventId, 'timeline');
      if (entity.containerPuzzleId) createEdge(entity.containerPuzzleId, entity.id, 'puzzle_container');
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
        // Use ACTUAL Element properties
        targetEntity.associatedCharacterIds?.forEach((id: string) => relatedIds.add(id));
        if (targetEntity.ownerId) relatedIds.add(targetEntity.ownerId);
        if (targetEntity.containerId) relatedIds.add(targetEntity.containerId);
        targetEntity.contentIds?.forEach((id: string) => relatedIds.add(id));
        targetEntity.requiredForPuzzleIds?.forEach((id: string) => relatedIds.add(id));
        targetEntity.rewardedByPuzzleIds?.forEach((id: string) => relatedIds.add(id));
        if (targetEntity.timelineEventId) relatedIds.add(targetEntity.timelineEventId);
        if (targetEntity.containerPuzzleId) relatedIds.add(targetEntity.containerPuzzleId);
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
        
        // Use proper entity type detection based on database ID
        const entityType = detectEntityType(page as NotionPage);
        if (!entityType) {
          console.warn(`Could not detect entity type for page ${(page as any).id}`);
          continue;
        }
        
        // Apply appropriate transform based on detected type
        switch (entityType) {
          case 'character':
            relatedEntities.push(transformCharacter(page as any));
            break;
          case 'element':
            relatedEntities.push(transformElement(page as any));
            break;
          case 'puzzle':
            relatedEntities.push(transformPuzzle(page as any));
            break;
          case 'timeline':
            relatedEntities.push(transformTimelineEvent(page as any));
            break;
        }
      }
    }
    
    // Step 3: Build a minimal graph with just the target and related entities
    const allEntities = targetEntity ? [targetEntity, ...relatedEntities] : relatedEntities;
    
    // Create entity maps for graph building
    // Use unique properties to identify entity types
    const characters = allEntities.filter(e => e && 'tier' in e && 'type' in e);
    const elements = allEntities.filter(e => e && 'basicType' in e && 'status' in e);
    const puzzles = allEntities.filter(e => e && 'solution' in e && 'acts' in e);
    const timeline = allEntities.filter(e => e && 'date' in e && 'time' in e);
  
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
  
  // Get the nodes for these IDs (including the target entity itself)
  const relevantNodes = graphData.nodes.filter(n => 
    n.id === entityId || connectedNodeIds.has(n.id)
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
  
  // Debug: Log what we're returning
  if (relevantNodes.length === 0) {
    console.log(`[DEBUG] No nodes found for ${entityType}:${entityId}`);
    console.log(`[DEBUG] graphData had ${graphData.nodes.length} total nodes`);
    console.log(`[DEBUG] Target entity exists: ${targetEntity ? 'yes' : 'no'}`);
    if (targetEntity) {
      console.log(`[DEBUG] Target entity properties:`, Object.keys(targetEntity));
    }
  }
  
  return state;
  
  } catch (error) {
    console.error(`[GraphStateCapture] Error capturing state for ${entityType}:${entityId}:`, error);
    
    // Return null on error - caller will handle gracefully with full cache invalidation
    // This maintains type consistency with GraphState interface
    return null;
  }
}

/**
 * Fetches graph state for a specific set of entity IDs.
 * WHY: When calculating deltas, we need to compare the same scope of entities
 * before and after a mutation. This ensures entities that were unlinked
 * are still included in the "after" state for accurate delta calculation.
 * 
 * @param entityIds - Array of entity IDs to fetch
 * @returns GraphState with nodes and edges for the specified entities
 */
export async function fetchGraphStateForIds(entityIds: string[]): Promise<any | null> {
  try {
    const notion = await import('./notion.js').then(m => m.notion);
    
    // Fetch all entities in parallel, handling deletions gracefully
    const fetchPromises = entityIds.map(async (id) => {
      try {
        const page = await notion.pages.retrieve({ page_id: id });
        return page;
      } catch (error: any) {
        // If entity was deleted (404), return null
        if (error?.status === 404) {
          console.log(`[GraphStateCapture] Entity ${id} was deleted`);
          return null;
        }
        console.warn(`[GraphStateCapture] Could not fetch entity ${id}:`, error?.message);
        return null;
      }
    });
    
    const pages = await Promise.all(fetchPromises);
    const validPages = pages.filter(p => p !== null);
    
    // Transform pages based on their entity types
    const transformedEntities: any[] = [];
    for (const page of validPages) {
      if (!page) continue;
      
      // Detect entity type and apply appropriate transform
      const entityType = detectEntityType(page as NotionPage);
      if (!entityType) {
        console.warn(`[GraphStateCapture] Could not detect entity type for page ${(page as any).id}`);
        continue;
      }
      
      switch (entityType) {
        case 'character':
          transformedEntities.push(transformCharacter(page as any));
          break;
        case 'element':
          transformedEntities.push(transformElement(page as any));
          break;
        case 'puzzle':
          transformedEntities.push(transformPuzzle(page as any));
          break;
        case 'timeline':
          transformedEntities.push(transformTimelineEvent(page as any));
          break;
      }
    }
    
    // Build graph from the fetched entities
    const characters = transformedEntities.filter(e => e && 'tier' in e && 'type' in e);
    const elements = transformedEntities.filter(e => e && 'basicType' in e && 'status' in e);
    const puzzles = transformedEntities.filter(e => e && 'solution' in e && 'acts' in e);
    const timeline = transformedEntities.filter(e => e && 'date' in e && 'time' in e);
    
    const graphData = buildCompleteGraph({ characters, elements, puzzles, timeline });
    
    // Return only the nodes and edges for the requested entity IDs
    const requestedIds = new Set(entityIds);
    const relevantNodes = graphData.nodes.filter(n => requestedIds.has(n.id));
    
    // Include edges where both source and target are in our set
    const relevantEdges = graphData.edges.filter(e =>
      requestedIds.has(e.source) && requestedIds.has(e.target)
    );
    
    const state = {
      nodes: relevantNodes,
      edges: relevantEdges,
      capturedAt: Date.now()
    };
    
    console.log(`[GraphStateCapture] Fetched state for ${entityIds.length} IDs - ${relevantNodes.length} nodes, ${relevantEdges.length} edges`);
    
    return state;
    
  } catch (error) {
    console.error(`[GraphStateCapture] Error fetching state for IDs:`, error);
    return null;
  }
}