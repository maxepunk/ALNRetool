/**
 * Graph API Service
 * 
 * Client-side API service for fetching complete graph data from server.
 * Replaces multiple entity queries with single graph endpoint.
 * 
 * @module services/graphApi
 */

import type { Node, Edge } from '@xyflow/react';

/**
 * API base URL - same as other services
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Graph API response structure
 */
export interface GraphResponse {
  nodes: Node[];
  edges: Edge[];
  metadata?: {
    totalNodes: number;
    totalEdges: number;
    placeholderNodes: number;
    missingEntities: Array<{
      id: string;
      referencedBy: string;
      type: string;
    }>;
    entityCounts: {
      characters: number;
      elements: number;
      puzzles: number;
      timeline: number;
    };
    buildTime: number;
    cached: boolean;
  };
}

/**
 * Graph API client
 */
export const graphApi = {
  /**
   * Fetch complete graph with all nodes and edges
   * 
   * @param includeMetadata - Whether to include graph metadata (default: true)
   * @returns Complete graph data ready for React Flow
   */
  async getComplete(
    includeMetadata: boolean = true
  ): Promise<GraphResponse> {
    const params = new URLSearchParams();
    
    // REMOVED viewConfig serialization to enable cache unification
    // All views now use the same URL for proper caching
    
    if (!includeMetadata) {
      params.append('includeMetadata', 'false');
    }
    
    const queryString = params.toString();
    const url = queryString 
      ? `${API_BASE_URL}/graph/complete?${queryString}`
      : `${API_BASE_URL}/graph/complete`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to fetch graph: ${error}`);
    }
    
    const data: GraphResponse = await response.json();
    
    // Keep warning for actual issues
    if (data.metadata?.missingEntities && data.metadata.missingEntities.length > 0) {
      console.warn('[Graph API] Missing entities detected', 
        data.metadata.missingEntities
      );
    }
    
    return data;
  },
  
  /**
   * Invalidate graph cache (for testing)
   * Forces next request to rebuild graph
   */
  async invalidateCache(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/graph/complete`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Cache-Bypass': 'true',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to invalidate graph cache');
    }
  },
};