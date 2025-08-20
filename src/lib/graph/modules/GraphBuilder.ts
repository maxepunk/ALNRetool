/**
 * GraphBuilder Module
 * Main orchestrator for building graph data from Notion entities
 */

import type {
  GraphData,
  GraphNode,
  GraphEdge,
  BuildGraphOptions,
  NotionData,
  GraphBuilder as IGraphBuilder,
  ViewType,
  PlaceholderNodeData,
  DataIntegrityReport
} from '../types';
import type { Node } from '@xyflow/react';
import type { DataIntegrityReport as RelationshipIntegrityReport } from '../relationships';

import { entityTransformer } from './EntityTransformer';
import { layoutOrchestrator } from './LayoutOrchestrator';
import { 
  resolveAllRelationships,
  resolveRelationshipsWithIntegrity,
  filterEdgesByType
} from '../relationships';

export class GraphBuilder implements IGraphBuilder {
  /**
   * Build complete graph data from Notion entities
   */
  buildGraphData(data: NotionData, options: BuildGraphOptions = {}): GraphData & { integrityReport?: DataIntegrityReport } {
    const startTime = performance.now();
    const warnings: string[] = [];
    
    console.group('Building graph data');
    console.log('Input data:', {
      characters: data.characters.length,
      elements: data.elements.length,
      puzzles: data.puzzles.length,
      timeline: data.timeline.length,
    });
    console.log('Options:', options);
    
    // Step 1: Transform entities to nodes with filtering
    const allNodes = entityTransformer.transformEntities(data, options.excludeEntityTypes);
    
    if (allNodes.length === 0) {
      console.warn('No nodes created from input data');
      warnings.push('No nodes created from input data');
    }
    
    // Step 2: Resolve relationships to edges with smart weighting
    let allEdges: GraphEdge[];
    let placeholderNodes: Node<PlaceholderNodeData>[] = [];
    let integrityReport: RelationshipIntegrityReport | undefined;
    
    if (options.enableIntegrityChecking !== false) {
      const integrityResult = resolveRelationshipsWithIntegrity(
        data.characters,
        data.elements,
        data.puzzles,
        data.timeline
      );
      allEdges = integrityResult.edges;
      placeholderNodes = integrityResult.placeholderNodes;
      integrityReport = integrityResult.report;
      
      if (integrityResult.report.missingEntities.size > 0) {
        warnings.push(`Found ${integrityResult.report.missingEntities.size} missing entities`);
      }
      if (integrityResult.report.brokenRelationships > 0) {
        warnings.push(`Found ${integrityResult.report.brokenRelationships} broken relationships`);
      }
    } else {
      allEdges = resolveAllRelationships(
        data.characters,
        data.elements,
        data.puzzles,
        data.timeline,
        allNodes  // Pass nodes for smart edge weighting
      );
    }
    
    // Step 3: Filter edges by relationship type
    let filteredEdges = allEdges;
    if (options.filterRelationships && options.filterRelationships.length > 0) {
      filteredEdges = filterEdgesByType(allEdges, options.filterRelationships);
      console.log(`Filtered edges from ${allEdges.length} to ${filteredEdges.length}`);
    }
    
    // Step 4: Combine all nodes (removed group nodes - using edge-based layout instead)
    const combinedNodes: GraphNode[] = [...allNodes, ...placeholderNodes as any];
    
    // Step 5: Filter orphans if requested
    let nodesToKeep = combinedNodes;
    if (!options.includeOrphans) {
      nodesToKeep = this.filterOrphans(combinedNodes, filteredEdges, options.viewType);
    }
    
    // Step 7: Filter edges to match kept nodes
    const keptNodeIds = new Set(nodesToKeep.map(n => n.id));
    const finalEdges = filteredEdges.filter(edge => 
      keptNodeIds.has(edge.source) && keptNodeIds.has(edge.target)
    );
    
    // Step 8: Apply layout
    const layoutConfig = options.layoutConfig || 
      layoutOrchestrator.getLayoutForView(options.viewType || 'puzzle-focus');
    
    const graphWithLayout = layoutOrchestrator.applyLayout(
      { nodes: nodesToKeep, edges: finalEdges },
      layoutConfig
    );
    
    // Step 9: Calculate layout metrics (for backward compatibility)
    const layoutMetrics = {
      width: Math.max(...graphWithLayout.nodes.map(n => n.position?.x || 0)) - 
             Math.min(...graphWithLayout.nodes.map(n => n.position?.x || 0)),
      height: Math.max(...graphWithLayout.nodes.map(n => n.position?.y || 0)) - 
              Math.min(...graphWithLayout.nodes.map(n => n.position?.y || 0)),
      density: graphWithLayout.nodes.length > 0 ? 
               finalEdges.length / graphWithLayout.nodes.length : 0,
      overlap: 0,
    };
    
    // Step 10: Build final result
    const endTime = performance.now();
    const result: GraphData & { integrityReport?: DataIntegrityReport } = {
      nodes: graphWithLayout.nodes,
      edges: finalEdges,
      metadata: {
        metrics: {
          startTime,
          endTime,
          duration: endTime - startTime,
          nodeCount: graphWithLayout.nodes.length,
          edgeCount: finalEdges.length,
          warnings,
          layoutMetrics,
        },
        viewType: options.viewType,
        timestamp: new Date().toISOString(),
      },
    };
    
    if (integrityReport) {
      // Convert RelationshipIntegrityReport to DataIntegrityReport format
      const missingReferences = {
        puzzles: [] as string[],
        elements: [] as string[],
        characters: [] as string[],
        timeline: [] as string[],
      };
      
      // Extract missing entity IDs by type
      integrityReport.missingEntities.forEach((info: any, id: string) => {
        switch(info.type) {
          case 'puzzle':
            missingReferences.puzzles.push(id);
            break;
          case 'element':
            missingReferences.elements.push(id);
            break;
          case 'character':
            missingReferences.characters.push(id);
            break;
          case 'timeline':
            missingReferences.timeline.push(id);
            break;
        }
      });
      
      result.integrityReport = {
        missingReferences,
        orphanedEntities: {
          puzzles: [],
          elements: [],
        },
        brokenRelationships: [],
      };
    }
    
    console.log('Graph build complete:', {
      duration: result.metadata?.metrics ? `${result.metadata.metrics.duration.toFixed(2)}ms` : 'N/A',
      nodes: result.nodes.length,
      edges: result.edges.length,
      placeholders: placeholderNodes.length,
      integrityScore: integrityReport ? Math.round(integrityReport.integrityScore) : undefined,
    });
    console.groupEnd();
    
    return result;
  }

  /**
   * Build graph for Puzzle Focus View
   */
  buildPuzzleFocusGraph(data: NotionData): GraphData {
    return this.buildGraphData(data, {
      viewType: 'puzzle-focus',
      filterRelationships: ['requirement', 'reward'],
      excludeEntityTypes: ['timeline'],
      includeOrphans: false,
    });
  }

  /**
   * Build full connection web for a character using BFS traversal
   * Shows ALL transitive connections from a starting character
   * @param data - The Notion data to process
   * @param characterId - The starting character for traversal
   * @param options - Configuration options for traversal limits
   */
  buildFullConnectionGraph(
    data: NotionData,
    characterId: string,
    options: {
      maxDepth?: number;
      maxNodes?: number;
      expandedNodes?: Set<string>;
    } = {}
  ): GraphData {
    console.log('🔍 buildFullConnectionGraph called with:', { characterId, options });
    console.log('📊 Input data size:', {
      characters: data.characters.length,
      elements: data.elements.length,
      puzzles: data.puzzles.length,
      timeline: data.timeline.length
    });
    const { maxDepth = 10, maxNodes = 250, expandedNodes = new Set() } = options;
    
    // Initialize collections for BFS
    const visitedNodes = new Set<string>();
    const nodesToInclude = new Set<string>();
    const nodeDistances = new Map<string, number>();
    
    // Queue for BFS: [nodeId, distance, entityType]
    type QueueItem = [string, number, 'character' | 'element' | 'puzzle' | 'timeline'];
    const queue: QueueItem[] = [];
    
    // Find starting character
    const startCharacter = data.characters.find(c => c.id === characterId);
    if (!startCharacter) {
      console.warn(`Character ${characterId} not found`);
      return { nodes: [], edges: [] };
    }
    
    console.log('📊 Starting character found:', startCharacter.name, {
      ownedElements: startCharacter.ownedElementIds?.length || 0
    });
    
    // Initialize with starting character
    queue.push([characterId, 0, 'character']);
    visitedNodes.add(characterId);
    nodesToInclude.add(characterId);
    nodeDistances.set(characterId, 0);
    
    // Build relationship maps for efficient traversal
    const elementOwners = new Map<string, string[]>();
    const puzzleRequirements = new Map<string, string[]>();
    const puzzleRewards = new Map<string, string[]>();
    const elementPuzzles = new Map<string, string[]>();
    const timelineCharacters = new Map<string, string[]>();
    const elementTimelines = new Map<string, string>();
    
    // Populate relationship maps
    data.characters.forEach(char => {
      (char.ownedElementIds || []).forEach(elemId => {
        if (!elementOwners.has(elemId)) elementOwners.set(elemId, []);
        elementOwners.get(elemId)!.push(char.id);
      });
    });
    
    data.puzzles.forEach(puzzle => {
      // puzzleElementIds are the requirements for the puzzle
      (puzzle.puzzleElementIds || []).forEach((reqId: string) => {
        puzzleRequirements.set(puzzle.id, puzzle.puzzleElementIds || []);
        if (!elementPuzzles.has(reqId)) elementPuzzles.set(reqId, []);
        elementPuzzles.get(reqId)!.push(puzzle.id);
      });
      (puzzle.rewardIds || []).forEach(rewId => {
        puzzleRewards.set(puzzle.id, puzzle.rewardIds || []);
        if (!elementPuzzles.has(rewId)) elementPuzzles.set(rewId, []);
        elementPuzzles.get(rewId)!.push(puzzle.id);
      });
    });
    
    data.timeline.forEach(event => {
      (event.charactersInvolvedIds || []).forEach(charId => {
        if (!timelineCharacters.has(event.id)) timelineCharacters.set(event.id, []);
        timelineCharacters.get(event.id)!.push(charId);
      });
    });
    
    data.elements.forEach(elem => {
      if (elem.timelineEventId) {
        elementTimelines.set(elem.id, elem.timelineEventId);
      }
    });
    
    // BFS traversal
    let nodesProcessed = 0;
    console.log('🚀 Starting BFS traversal with queue:', queue.length, 'items');
    console.log('📊 Relationship maps built:', {
      elementOwners: elementOwners.size,
      puzzleRequirements: puzzleRequirements.size,
      puzzleRewards: puzzleRewards.size,
      elementPuzzles: elementPuzzles.size,
      timelineCharacters: timelineCharacters.size,
      elementTimelines: elementTimelines.size
    });
    
    while (queue.length > 0 && nodesProcessed < maxNodes) {
      const [currentId, distance, entityType] = queue.shift()!;
      console.log(`⏳ Processing: ${entityType} ${currentId} at distance ${distance}`);
      
      // Check depth limit
      if (distance >= maxDepth) {
        console.log(`  ⛔ Skipping - reached max depth ${maxDepth}`);
        continue;
      }
      
      // Progressive loading: Skip if node not expanded (unless within initial depth)
      if (distance > 2 && expandedNodes.size > 0 && !expandedNodes.has(currentId)) {
        continue;
      }
      
      nodesProcessed++;
      const nextDistance = distance + 1;
      
      // Process based on entity type
      switch (entityType) {
        case 'character': {
          const char = data.characters.find(c => c.id === currentId);
          if (!char) {
            console.log(`  ❌ Character ${currentId} not found in data`);
            break;
          }
          console.log(`  👤 Processing character: ${char.name}`);
          console.log(`     Owned elements: ${char.ownedElementIds?.length || 0}`);
          
          // Add owned elements
          (char.ownedElementIds || []).forEach(elemId => {
            if (!visitedNodes.has(elemId)) {
              visitedNodes.add(elemId);
              nodesToInclude.add(elemId);
              nodeDistances.set(elemId, nextDistance);
              queue.push([elemId, nextDistance, 'element']);
            }
          });
          
          // Add timeline events character participates in
          data.timeline.forEach(event => {
            if (event.charactersInvolvedIds?.includes(currentId) && !visitedNodes.has(event.id)) {
              visitedNodes.add(event.id);
              nodesToInclude.add(event.id);
              nodeDistances.set(event.id, nextDistance);
              queue.push([event.id, nextDistance, 'timeline']);
            }
          });
          break;
        }
        
        case 'element': {
          const elem = data.elements.find(e => e.id === currentId);
          if (!elem) {
            console.log(`  ❌ Element ${currentId} not found in data`);
            break;
          }
          console.log(`  📦 Processing element: ${elem.name}`);
          
          // Add puzzles that use this element
          const puzzles = elementPuzzles.get(currentId) || [];
          console.log(`     Connected puzzles: ${puzzles.length}`);
          puzzles.forEach(puzzleId => {
            if (!visitedNodes.has(puzzleId)) {
              visitedNodes.add(puzzleId);
              nodesToInclude.add(puzzleId);
              nodeDistances.set(puzzleId, nextDistance);
              queue.push([puzzleId, nextDistance, 'puzzle']);
            }
          });
          
          // Add timeline event for this element
          const timelineId = elementTimelines.get(currentId);
          if (timelineId && !visitedNodes.has(timelineId)) {
            visitedNodes.add(timelineId);
            nodesToInclude.add(timelineId);
            nodeDistances.set(timelineId, nextDistance);
            queue.push([timelineId, nextDistance, 'timeline']);
          }
          
          // Add other characters who own this element
          const owners = elementOwners.get(currentId) || [];
          owners.forEach(ownerId => {
            if (!visitedNodes.has(ownerId)) {
              visitedNodes.add(ownerId);
              nodesToInclude.add(ownerId);
              nodeDistances.set(ownerId, nextDistance);
              queue.push([ownerId, nextDistance, 'character']);
            }
          });
          break;
        }
        
        case 'puzzle': {
          const puzzle = data.puzzles.find(p => p.id === currentId);
          if (!puzzle) break;
          
          // Add all requirement and reward elements
          [...(puzzle.puzzleElementIds || []), ...(puzzle.rewardIds || [])].forEach(elemId => {
            if (!visitedNodes.has(elemId)) {
              visitedNodes.add(elemId);
              nodesToInclude.add(elemId);
              nodeDistances.set(elemId, nextDistance);
              queue.push([elemId, nextDistance, 'element']);
            }
          });
          break;
        }
        
        case 'timeline': {
          const event = data.timeline.find(t => t.id === currentId);
          if (!event) break;
          
          // Add all involved characters
          (event.charactersInvolvedIds || []).forEach(charId => {
            if (!visitedNodes.has(charId)) {
              visitedNodes.add(charId);
              nodesToInclude.add(charId);
              nodeDistances.set(charId, nextDistance);
              queue.push([charId, nextDistance, 'character']);
            }
          });
          break;
        }
      }
    }
    
    // Log BFS results
    console.log('🏁 BFS traversal complete:', {
      nodesProcessed,
      nodesDiscovered: nodesToInclude.size,
      maxDepth,
      nodesByType: {
        characters: Array.from(nodesToInclude).filter(id => data.characters.some(c => c.id === id)).length,
        elements: Array.from(nodesToInclude).filter(id => data.elements.some(e => e.id === id)).length,
        puzzles: Array.from(nodesToInclude).filter(id => data.puzzles.some(p => p.id === id)).length,
        timeline: Array.from(nodesToInclude).filter(id => data.timeline.some(t => t.id === id)).length
      }
    });
    
    // Filter data to only include discovered entities
    const filteredData: NotionData = {
      characters: data.characters.filter(c => nodesToInclude.has(c.id)),
      elements: data.elements.filter(e => nodesToInclude.has(e.id)),
      puzzles: data.puzzles.filter(p => nodesToInclude.has(p.id)),
      timeline: data.timeline.filter(t => nodesToInclude.has(t.id))
    };
    
    // Build graph with filtered data
    const graph = this.buildGraphData(filteredData, {
      viewType: 'character-journey' as any, // Use character-journey type for compatibility
      filterRelationships: ['ownership', 'timeline', 'requirement', 'reward'],
      includeOrphans: false,
      layoutConfig: { algorithm: 'none' } as any // Skip layout initially
    });
    
    // Add distance metadata to nodes for visual hierarchy
    graph.nodes = graph.nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        distance: nodeDistances.get(node.id) || 0,
        isExpanded: expandedNodes.has(node.id)
      }
    }));
    
    // Don't filter edges - the graph builder should create ALL appropriate edges
    // between the discovered nodes. The BFS already filtered which nodes to include,
    // so any edges between those nodes are valid connections.
    console.log('📊 Graph edges (no filtering applied):', {
      totalEdges: graph.edges.length,
      edgeTypes: graph.edges.reduce((acc, edge) => {
        const type = edge.data?.relationshipType || 'unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    });
    
    // Add node count warning if approaching limit
    if (nodesProcessed >= maxNodes) {
      console.warn(`Full Connection Web: Reached node limit (${maxNodes}). Some connections may be hidden.`);
    }
    
    // Apply force-directed layout for network visualization
    // Force layout is better suited for dense, highly-connected graphs
    // Using very strong repulsion forces based on d3-force best practices
    const nodeCount = graph.nodes.length;
    const isLargeGraph = nodeCount > 150;
    const isDenseGraph = nodeCount > 200;
    
    // Calculate adaptive parameters based on graph density
    // For very dense graphs (200+ nodes), we need MUCH stronger repulsion
    // Research shows -4000 to -5000 is needed for 200+ node graphs
    // Note: The force.ts implementation handles adaptive parameters internally
    
    const layoutConfig = {
      algorithm: 'force' as any,
      // The new force.ts implementation will handle adaptive parameters internally
      // based on node count, so we just pass the semantic features we want
      
      // Enable semantic positioning features for character journey view
      enableLanePositioning: true,     // Create horizontal lanes by node type
      enableTierClustering: true,      // Cluster characters by tier (Core, Secondary, Tertiary)
      enableTimelineOrdering: true,    // Order timeline events chronologically
      
      // Let force.ts determine optimal values based on graph density
      // It will use -8000 charge for 200+ nodes, -5000 for 150+, etc.
      iterations: isDenseGraph ? 1200 : (isLargeGraph ? 1000 : 800),
      
      // Canvas size for the graph
      width: isDenseGraph ? 8000 : (isLargeGraph ? 6000 : 5000),
      height: isDenseGraph ? 6000 : (isLargeGraph ? 5000 : 4000),
      
      // Weak center force to allow maximum expansion
      centerStrength: 0.05,
      
      // Node-type specific multipliers (force.ts will apply these to adaptive base values)
      nodeStrengthByType: {
        'characterNode': 1.5,   // Characters repel 50% more
        'puzzleNode': 1.2,      // Puzzles repel 20% more
        'elementNode': 1.0,     // Elements use base repulsion
        'timelineNode': 0.8     // Timeline events repel 20% less
      },
      nodeSizeByType: {
        'characterNode': 1.3,   // 30% larger collision for characters
        'puzzleNode': 1.1,      // 10% larger for puzzles
        'elementNode': 1.0,     // Standard for elements
        'timelineNode': 0.9     // 10% smaller for timeline
      }
    };
    const graphWithLayout = layoutOrchestrator.applyLayout(graph, layoutConfig);
    
    console.log('📐 Force layout applied to Full Connection Web:', {
      nodeCount: graphWithLayout.nodes.length,
      edgeCount: graphWithLayout.edges.length,
      hasPositions: graphWithLayout.nodes[0]?.position ? true : false
    });
    
    return graphWithLayout;
  }

  /**
   * Build graph for Character Journey View
   * Creates a hierarchical structure: Character -> Puzzles -> Elements -> Timeline
   * @param data - The Notion data to process
   * @param characterId - Optional characterId to filter the journey to a specific character
   */
  buildCharacterJourneyGraph(data: NotionData, characterId?: string): GraphData {
    // If characterId is provided, filter data to only include relevant entities
    let filteredData = data;
    
    if (characterId) {
      // Find the character
      const character = data.characters.find(c => c.id === characterId);
      if (!character) {
        console.warn(`Character ${characterId} not found, showing all data`);
      } else {
        // Filter to only include:
        // 1. The selected character
        // 2. Elements owned by that character
        // 3. Puzzles accessible through those elements
        // 4. Timeline events related to those puzzles
        
        const ownedElementIds = new Set(character.ownedElementIds || []);
        
        // Find puzzles that have requirements from owned elements OR reward owned elements
        const accessiblePuzzleIds = new Set<string>();
        data.puzzles.forEach(puzzle => {
          // Include puzzles where character owns requirements OR receives rewards
          if (puzzle.puzzleElementIds?.some((reqId: string) => ownedElementIds.has(reqId)) ||
              puzzle.rewardIds?.some(rewId => ownedElementIds.has(rewId))) {
            accessiblePuzzleIds.add(puzzle.id);
          }
        });
        
        // Collect elements that are rewards from accessible puzzles
        const rewardedElementIds = new Set<string>();
        data.puzzles.forEach(puzzle => {
          if (accessiblePuzzleIds.has(puzzle.id) && puzzle.rewardIds) {
            puzzle.rewardIds.forEach(id => rewardedElementIds.add(id));
          }
        });
        
        // Find timeline events related to accessible puzzles OR where character participates
        const relevantTimelineIds = new Set<string>();
        data.timeline.forEach(event => {
          // Include if character directly participates in the event
          // Note: Timeline events use 'charactersInvolvedIds' not 'characterIds'
          if (event.charactersInvolvedIds?.includes(characterId)) {
            relevantTimelineIds.add(event.id);
          }
        });
        
        // Also include timeline events referenced by included elements
        data.elements.forEach(element => {
          if ((ownedElementIds.has(element.id) || rewardedElementIds.has(element.id)) && element.timelineEventId) {
            relevantTimelineIds.add(element.timelineEventId);
          }
        });
        
        // Create filtered data object
        filteredData = {
          characters: [character],
          elements: data.elements.filter(e => 
            ownedElementIds.has(e.id) || rewardedElementIds.has(e.id)
          ),
          puzzles: data.puzzles.filter(p => accessiblePuzzleIds.has(p.id)),
          timeline: data.timeline.filter(t => relevantTimelineIds.has(t.id))
        };
        
        // Safety check: If we have very little data after filtering, include more context
        // This prevents the Dagre "Cannot read properties of undefined" error
        const totalFilteredEntities = filteredData.characters.length + 
                                     filteredData.elements.length + 
                                     filteredData.puzzles.length + 
                                     filteredData.timeline.length;
        
        if (totalFilteredEntities < 3) {
          console.warn(`Character ${characterId} has very limited data (${totalFilteredEntities} entities). Using full dataset for context.`);
          // Fall back to full data to avoid empty graph issues
          filteredData = data;
        }
      }
    }
    
    // Build graph WITHOUT layout first since we need to modify nodes
    const graph = this.buildGraphData(filteredData, {
      viewType: 'character-journey',
      filterRelationships: ['ownership', 'timeline', 'requirement', 'reward'],
      includeOrphans: false,
      layoutConfig: { algorithm: 'none' } as any // Skip layout in buildGraphData
    });

    // Add hierarchical metadata for layout and map node types for character journey view
    const nodes = graph.nodes.map(node => {
      // Map character nodes to use characterTree type for hierarchical view
      let nodeType = node.type;
      if (node.type === 'character') {
        nodeType = 'characterTree';
      }
      
      // Assign ranks based on node type for hierarchical layout
      let rank = 0;
      if (node.type === 'character') {
        rank = 0; // Top level
      } else if (node.type === 'puzzle') {
        rank = 1; // Second level
      } else if (node.type === 'element') {
        rank = 2; // Third level
      } else if (node.type === 'timeline') {
        rank = 3; // Bottom level
      }

      return {
        ...node,
        type: nodeType,
        data: {
          ...node.data,
          metadata: {
            ...node.data.metadata,
            hierarchyRank: rank,
          }
        }
      };
    });

    // Now apply the character journey layout with TB direction
    const layoutConfig = layoutOrchestrator.getLayoutForView('character-journey');
    const graphWithLayout = layoutOrchestrator.applyLayout(
      { ...graph, nodes },
      layoutConfig
    );

    return graphWithLayout;
  }

  /**
   * Build graph for Content Status View
   */
  buildContentStatusGraph(data: NotionData): GraphData {
    return this.buildGraphData(data, {
      viewType: 'content-status',
      includeOrphans: true,
    });
  }

  /**
   * Filter orphan nodes from the graph
   */
  private filterOrphans(nodes: GraphNode[], edges: GraphEdge[], viewType?: ViewType): GraphNode[] {
    const connectedNodeIds = new Set<string>();
    
    // Mark all nodes connected by edges
    edges.forEach(edge => {
      if (nodes.some(n => n.id === edge.source)) {
        connectedNodeIds.add(edge.source);
      }
      if (nodes.some(n => n.id === edge.target)) {
        connectedNodeIds.add(edge.target);
      }
    });
    
    // For puzzle-focus view, preserve parent-child chains
    if (viewType === 'puzzle-focus') {
      nodes.forEach(node => {
        if (node.data.metadata.isParent || node.data.metadata.isChild) {
          connectedNodeIds.add(node.id);
          if (node.data.metadata.parentId) {
            connectedNodeIds.add(node.data.metadata.parentId);
          }
        }
      });
    }
    
    const filtered = nodes.filter(node => connectedNodeIds.has(node.id));
    const removedCount = nodes.length - filtered.length;
    
    if (removedCount > 0) {
      console.log(`Removed ${removedCount} orphan nodes`);
    }
    
    return filtered;
  }
}

// Export singleton instance
export const graphBuilder = new GraphBuilder();