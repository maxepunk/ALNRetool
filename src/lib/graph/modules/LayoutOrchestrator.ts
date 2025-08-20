/**
 * LayoutOrchestrator Module
 * Manages layout algorithms and view-specific configurations
 */

import type {
  GraphData,
  LayoutConfig,
  ViewType,
  LayoutOrchestrator as ILayoutOrchestrator
} from '../types';

import { 
  applyDagreLayout as dagreLayout,
  LAYOUT_PRESETS
} from '../layouts';
import { applyPureDagreLayout as pureDagreLayout } from '../layout/dagre';
import { applyForceLayout, applyClusteredForceLayout } from '../layout/force';

export class LayoutOrchestrator implements ILayoutOrchestrator {
  /**
   * Apply layout to graph based on configuration
   */
  applyLayout(graph: GraphData, config?: LayoutConfig): GraphData {
    const layoutConfig = config || this.getDefaultConfig();
    
    console.log('Applying layout:', {
      algorithm: layoutConfig.algorithm,
      direction: layoutConfig.direction,
      nodeCount: graph.nodes.length,
      edgeCount: graph.edges.length,
      fullConfig: layoutConfig
    });

    let result: GraphData;
    
    switch (layoutConfig.algorithm) {
      case 'none':
        // Skip layout, return graph as-is
        result = graph;
        break;
      case 'pure-dagre':
        result = this.applyPureDagreLayout(graph, layoutConfig);
        break;
      case 'dagre':
        result = this.applyDagreLayout(graph, layoutConfig);
        break;
      case 'force':
        result = this.applyForceLayout(graph, layoutConfig);
        break;
      case 'force-clustered':
        result = this.applyClusteredForceLayout(graph, layoutConfig);
        break;
      default:
        result = this.applyDagreLayout(graph, layoutConfig);
    }

    return result;
  }

  /**
   * Apply standard Dagre layout
   */
  applyDagreLayout(graph: GraphData, config?: LayoutConfig): GraphData {
    const positionedNodes = dagreLayout(
      graph.nodes,
      graph.edges,
      config || this.getDefaultConfig()
    );

    return {
      ...graph,
      nodes: positionedNodes
    };
  }

  /**
   * Apply pure Dagre layout with semantic ranking
   */
  applyPureDagreLayout(graph: GraphData, config?: LayoutConfig): GraphData {
    // Map old direction values to supported ones
    let layoutDirection: 'TB' | 'LR' = 'LR';
    if (config?.direction) {
      if (config.direction === 'TB' || config.direction === 'LR') {
        layoutDirection = config.direction;
      } else if (config.direction === 'BT') {
        layoutDirection = 'TB';
      } else if (config.direction === 'RL') {
        layoutDirection = 'LR';
      }
    }
    
    const positionedNodes = pureDagreLayout(
      graph.nodes,
      graph.edges,
      {
        ...config, // Spread config first (includes dynamic spacing properties)
        direction: layoutDirection, // Then override with mapped direction
        rankSeparation: config?.spacing?.rankSpacing || (config as any)?.rankSeparation || 300,
        nodeSeparation: config?.spacing?.nodeSpacing || (config as any)?.nodeSeparation || 100,
        puzzleSpacing: (config as any)?.puzzleSpacing || 300,
        elementSpacing: (config as any)?.elementSpacing || 100,
        useFractionalRanks: (config as any)?.useFractionalRanks ?? true,
        optimizeEdgeCrossings: (config as any)?.optimizeEdgeCrossings ?? true,
        // Pass through dynamic spacing properties from config
        dynamicSpacing: (config as any)?.dynamicSpacing,
        tightElementSpacing: (config as any)?.tightElementSpacing,
        adaptiveRankSeparation: (config as any)?.adaptiveRankSeparation,
        clusterElements: (config as any)?.clusterElements
      }
    );
    
    // Filter out virtual edges that were only used for layout
    const displayEdges = graph.edges.filter(edge => !edge.data?.isVirtual);

    return {
      ...graph,
      nodes: positionedNodes,
      edges: displayEdges
    };
  }

  /**
   * Get layout configuration for a specific view
   */
  getLayoutForView(viewType: ViewType): LayoutConfig {
    switch (viewType) {
      case 'puzzle-focus':
        // Use the preset from layouts.ts which includes dynamic spacing
        return {
          ...LAYOUT_PRESETS.puzzleFocus,
          algorithm: 'pure-dagre',
          spacing: {
            rankSpacing: LAYOUT_PRESETS.puzzleFocus.rankSeparation,
            nodeSpacing: LAYOUT_PRESETS.puzzleFocus.nodeSeparation,
            edgePadding: 10
          },
          alignment: 'DL'
        } as LayoutConfig;
      
      case 'character-journey':
        return {
          ...LAYOUT_PRESETS.characterJourney,
          algorithm: 'dagre',
          spacing: {
            rankSpacing: LAYOUT_PRESETS.characterJourney.rankSeparation,
            nodeSpacing: LAYOUT_PRESETS.characterJourney.nodeSeparation,
            edgePadding: 10
          },
          alignment: 'UL'
        } as LayoutConfig;
      
      case 'content-status':
        return {
          ...LAYOUT_PRESETS.contentStatus,
          algorithm: 'dagre',
          spacing: {
            rankSpacing: LAYOUT_PRESETS.contentStatus.rankSeparation,
            nodeSpacing: LAYOUT_PRESETS.contentStatus.nodeSeparation,
            edgePadding: 10
          },
          alignment: 'UL'
        } as LayoutConfig;
      
      default:
        return this.getDefaultConfig();
    }
  }

  /**
   * Apply force-directed layout
   */
  applyForceLayout(graph: GraphData, config?: LayoutConfig): GraphData {
    // Pass through all configuration from GraphBuilder
    // The force.ts implementation will handle adaptive parameters internally
    const forceConfig = {
      // Pass through all properties from the config
      ...(config as any),
      
      // Ensure critical properties exist with sensible defaults
      // These are fallbacks only if not provided by GraphBuilder
      chargeStrength: (config as any)?.chargeStrength,
      linkDistance: (config as any)?.linkDistance,
      linkStrength: (config as any)?.linkStrength,
      collisionRadius: (config as any)?.collisionRadius,
      iterations: (config as any)?.iterations || 800,
      width: (config as any)?.width || 8000,
      height: (config as any)?.height || 6000,
      centerStrength: (config as any)?.centerStrength || 0.05,
      
      // Pass through semantic features if provided (don't default to false)
      enableLanePositioning: (config as any)?.enableLanePositioning,
      enableTierClustering: (config as any)?.enableTierClustering,
      enableTimelineOrdering: (config as any)?.enableTimelineOrdering,
      
      // Pass through node-type specific configurations
      // These are now multipliers that force.ts will apply to adaptive base values
      nodeStrengthByType: (config as any)?.nodeStrengthByType || {},
      nodeSizeByType: (config as any)?.nodeSizeByType || {}
    };

    console.log('🔧 LayoutOrchestrator passing config to force layout:', {
      hasSemanticFeatures: forceConfig.enableTierClustering || forceConfig.enableTimelineOrdering,
      nodeCount: graph.nodes.length,
      configKeys: Object.keys(forceConfig).filter(k => forceConfig[k] !== undefined)
    });

    const positionedNodes = applyForceLayout(
      graph.nodes,
      graph.edges,
      forceConfig
    );

    return {
      ...graph,
      nodes: positionedNodes
    };
  }

  /**
   * Apply clustered force-directed layout
   */
  applyClusteredForceLayout(graph: GraphData, config?: LayoutConfig): GraphData {
    // Cluster by entity type by default
    const clusterBy = (node: any) => node.type || 'unknown';
    
    const forceConfig = {
      chargeStrength: (config as any)?.chargeStrength || -400,
      linkDistance: (config as any)?.linkDistance || 120,
      linkStrength: (config as any)?.linkStrength || 0.4,
      collisionRadius: (config as any)?.collisionRadius || 55,
      iterations: (config as any)?.iterations || 400,
      width: (config as any)?.width || 2400,
      height: (config as any)?.height || 1800
    };

    const positionedNodes = applyClusteredForceLayout(
      graph.nodes,
      graph.edges,
      clusterBy,
      forceConfig
    );

    return {
      ...graph,
      nodes: positionedNodes
    };
  }

  /**
   * Get default layout configuration
   */
  private getDefaultConfig(): LayoutConfig {
    return {
      algorithm: 'dagre',
      direction: 'TB',
      spacing: {
        rankSpacing: 150,
        nodeSpacing: 100,
        edgePadding: 10
      },
      alignment: 'UL'
    };
  }
}

// Export singleton instance
export const layoutOrchestrator = new LayoutOrchestrator();