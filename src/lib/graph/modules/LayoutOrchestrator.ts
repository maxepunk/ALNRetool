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
  applyDagreLayout as dagreLayout
} from '../layouts';
import { applyPureDagreLayout as pureDagreLayout } from '../pureDagreLayout';

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
        ...config, // Spread config first
        direction: layoutDirection, // Then override with mapped direction
        rankSeparation: config?.spacing?.rankSpacing || 300,
        nodeSeparation: config?.spacing?.nodeSpacing || 100,
        puzzleSpacing: 300,
        elementSpacing: 100,
        useFractionalRanks: true,
        optimizeEdgeCrossings: true
      }
    );

    return {
      ...graph,
      nodes: positionedNodes
    };
  }

  /**
   * Get layout configuration for a specific view
   */
  getLayoutForView(viewType: ViewType): LayoutConfig {
    switch (viewType) {
      case 'puzzle-focus':
        return {
          algorithm: 'pure-dagre',
          direction: 'LR',
          spacing: {
            rankSpacing: 300,
            nodeSpacing: 100,
            edgePadding: 10
          },
          alignment: 'DL'
        };
      
      case 'character-journey':
        return {
          algorithm: 'dagre',
          direction: 'TB',
          spacing: {
            rankSpacing: 150,
            nodeSpacing: 80,
            edgePadding: 10
          },
          alignment: 'UL'
        };
      
      case 'content-status':
        return {
          algorithm: 'dagre',
          direction: 'LR',
          spacing: {
            rankSpacing: 200,
            nodeSpacing: 100,
            edgePadding: 10
          },
          alignment: 'UL'
        };
      
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