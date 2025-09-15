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