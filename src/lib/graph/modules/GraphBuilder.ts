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
   * Build graph for Character Journey View
   */
  buildCharacterJourneyGraph(data: NotionData): GraphData {
    return this.buildGraphData(data, {
      viewType: 'character-journey',
      filterRelationships: ['ownership', 'timeline'],
      includeOrphans: false,
    });
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