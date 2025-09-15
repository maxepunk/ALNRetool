/**
 * Navigation Tracking Hook
 * 
 * Subscribes to node selection changes and tracks them in navigation history.
 * This hook bridges the filterStore selection state with navigationStore history.
 */

import { useEffect, useRef } from 'react';
import { useFilterStore } from '@/stores/filterStore';
import { useNavigationStore } from '@/stores/navigationStore';
import type { Node } from '@xyflow/react';

interface UseNavigationTrackingProps {
  nodes: Node[];
}

/**
 * Hook that tracks node navigation by subscribing to selection changes
 * 
 * @param nodes - Current graph nodes to look up node details
 */
export function useNavigationTracking({ nodes }: UseNavigationTrackingProps) {
  const selectedNodeId = useFilterStore(state => state.selectedNodeId);
  const pushNode = useNavigationStore(state => state.pushNode);
  const lastTrackedNodeId = useRef<string | null>(null);
  
  useEffect(() => {
    // Skip if no selection or same as last tracked
    if (!selectedNodeId || selectedNodeId === lastTrackedNodeId.current) {
      return;
    }
    
    // Find the selected node details
    const selectedNode = nodes.find(n => n.id === selectedNodeId);
    if (!selectedNode) {
      return;
    }
    
    // Extract node information from the node data
    const nodeData = selectedNode.data as any;
    const nodeType = nodeData?.metadata?.entityType;
    const nodeName = nodeData?.label || selectedNodeId;
    
    // Skip if we don't have proper type information
    if (!nodeType || !['character', 'element', 'puzzle', 'timeline'].includes(nodeType)) {
      console.warn('[NavigationTracking] Unknown node type:', nodeType);
      return;
    }
    
    // Track the navigation
    pushNode({
      nodeId: selectedNodeId,
      nodeName,
      nodeType: nodeType as 'character' | 'element' | 'puzzle' | 'timeline',
    });
    
    // Update last tracked to prevent duplicates
    lastTrackedNodeId.current = selectedNodeId;
    
  }, [selectedNodeId, nodes, pushNode]);
  
  // Reset tracking when nodes change significantly (e.g., new graph loaded)
  useEffect(() => {
    if (nodes.length === 0) {
      lastTrackedNodeId.current = null;
    }
  }, [nodes.length]);
}