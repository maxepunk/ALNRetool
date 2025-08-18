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

export class LayoutOrchestrator implements ILayoutOrchestrator {
  /**
   * Apply layout to graph based on configuration
   */
  applyLayout(graph: GraphData, config?: LayoutConfig): GraphData {
    const layoutConfig = config || this.getDefaultConfig();
    
    console.log('Applying layout:', {
      algorithm: layoutConfig.algorithm,
      nodeCount: graph.nodes.length,
      edgeCount: graph.edges.length
    });

    let result: GraphData;
    
    switch (layoutConfig.algorithm) {
      case 'pure-dagre':
        result = this.applyPureDagreLayout(graph, layoutConfig);
        break;
      case 'dagre':
        result = this.applyDagreLayout(graph, layoutConfig);
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