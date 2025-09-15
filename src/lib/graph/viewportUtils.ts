/**
 * Viewport Management Utilities
 * 
 * Provides intelligent viewport positioning based on connection density
 * and viewport persistence across sessions.
 */

import type { Node, Edge, Viewport } from '@xyflow/react';

/**
 * Get the most relevant nodes for initial viewport based on connection density.
 * Returns node IDs of the most connected nodes in the graph.
 * 
 * @param nodes - All nodes in the graph
 * @param edges - All edges in the graph
 * @param isMobile - Whether the user is on a mobile device
 * @returns Array of node IDs to focus on, or null if viewport should be restored
 */
export function getInitialViewNodes(
  nodes: Node[],
  edges: Edge[],
  isMobile: boolean
): string[] | null {
  // 1. Try to load saved viewport first
  const savedViewport = loadViewport();
  if (savedViewport) {
    // Return null to indicate saved viewport should be used
    return null;
  }
  
  // 2. Calculate connection density for each node
  const connectionCounts = new Map<string, number>();
  
  // Initialize all nodes with 0 connections
  nodes.forEach(node => {
    connectionCounts.set(node.id, 0);
  });
  
  // Count connections from edges
  edges.forEach(edge => {
    // Increment count for source node
    connectionCounts.set(
      edge.source,
      (connectionCounts.get(edge.source) || 0) + 1
    );
    // Increment count for target node
    connectionCounts.set(
      edge.target,
      (connectionCounts.get(edge.target) || 0) + 1
    );
  });
  
  // 3. Sort nodes by connection count (descending)
  const sortedNodes = [...nodes].sort((a, b) => {
    const countA = connectionCounts.get(a.id) || 0;
    const countB = connectionCounts.get(b.id) || 0;
    return countB - countA; // Higher counts first
  });
  
  // 4. Determine how many nodes to show
  const nodeCount = isMobile ? 10 : 20;
  
  // 5. Return top N most connected node IDs
  const topNodes = sortedNodes.slice(0, nodeCount);
  return topNodes.map(node => node.id);
}

/**
 * Save viewport state to sessionStorage with error handling.
 * 
 * @param viewport - The viewport to save
 * @returns true if save was successful, false otherwise
 */
export function saveViewport(viewport: Viewport): boolean {
  try {
    const key = 'graph-viewport';
    const data = JSON.stringify({
      x: viewport.x,
      y: viewport.y,
      zoom: viewport.zoom,
      timestamp: Date.now()
    });
    sessionStorage.setItem(key, data);
    return true;
  } catch (error) {
    // SessionStorage might be blocked or full
    console.warn('[viewportUtils] Failed to save viewport:', error);
    return false;
  }
}

/**
 * Load viewport state from sessionStorage with error handling.
 * 
 * @returns The saved viewport or null if not available
 */
export function loadViewport(): Viewport | null {
  try {
    const key = 'graph-viewport';
    const stored = sessionStorage.getItem(key);
    
    if (!stored) {
      return null;
    }
    
    const data = JSON.parse(stored);
    
    // Validate the stored data has required fields
    if (
      typeof data.x === 'number' &&
      typeof data.y === 'number' &&
      typeof data.zoom === 'number'
    ) {
      // Check if viewport is not too old (e.g., 24 hours)
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      const age = Date.now() - (data.timestamp || 0);
      
      if (age > maxAge) {
        // Clear old viewport
        sessionStorage.removeItem(key);
        return null;
      }
      
      return {
        x: data.x,
        y: data.y,
        zoom: data.zoom
      };
    }
    
    return null;
  } catch (error) {
    // SessionStorage might be blocked or data might be corrupted
    console.warn('[viewportUtils] Failed to load viewport:', error);
    return null;
  }
}

/**
 * Clear saved viewport from sessionStorage.
 */
export function clearViewport(): void {
  try {
    sessionStorage.removeItem('graph-viewport');
  } catch (error) {
    console.warn('[viewportUtils] Failed to clear viewport:', error);
  }
}

/**
 * Check if a node is well-visible in the current viewport.
 * A node is considered well-visible if it's within the central 60% of the viewport.
 * 
 * @param node - The node to check
 * @param viewport - Current viewport
 * @param viewportBounds - The viewport bounds in graph coordinates
 * @returns true if the node is well-visible
 */
export function isNodeWellVisible(
  node: Node,
  viewport: Viewport,
  viewportBounds: { width: number; height: number }
): boolean {
  if (!node.position) return false;
  
  // Calculate the central area (60% of viewport, 20% margin on each side)
  const margin = 0.2;
  const viewportCenterX = -viewport.x / viewport.zoom + viewportBounds.width / 2;
  const viewportCenterY = -viewport.y / viewport.zoom + viewportBounds.height / 2;
  
  const centralWidth = viewportBounds.width * (1 - 2 * margin) / viewport.zoom;
  const centralHeight = viewportBounds.height * (1 - 2 * margin) / viewport.zoom;
  
  const centralLeft = viewportCenterX - centralWidth / 2;
  const centralRight = viewportCenterX + centralWidth / 2;
  const centralTop = viewportCenterY - centralHeight / 2;
  const centralBottom = viewportCenterY + centralHeight / 2;
  
  // Get node bounds (considering its size)
  const nodeWidth = node.width || 200; // Default width if not measured
  const nodeHeight = node.height || 100; // Default height if not measured
  
  const nodeLeft = node.position.x;
  const nodeRight = node.position.x + nodeWidth;
  const nodeTop = node.position.y;
  const nodeBottom = node.position.y + nodeHeight;
  
  // Check if node is mostly within the central area
  const horizontalOverlap = Math.min(nodeRight, centralRight) - Math.max(nodeLeft, centralLeft);
  const verticalOverlap = Math.min(nodeBottom, centralBottom) - Math.max(nodeTop, centralTop);
  
  // Node is well-visible if at least 50% of it is in the central area
  const nodeArea = nodeWidth * nodeHeight;
  const overlapArea = Math.max(0, horizontalOverlap) * Math.max(0, verticalOverlap);
  
  return overlapArea >= nodeArea * 0.5;
}