import type { Node, Edge } from '@xyflow/react';
import type { Character, Element, Puzzle, TimelineEvent } from '../../src/types/notion/app.js';

// Re-export GraphNode type from graphBuilder for consistency
export type NodeType = 'character' | 'element' | 'puzzle' | 'timeline' | 'placeholder';

export interface GraphNode extends Node {
  type: NodeType;
  data: {
    label: string;
    entity: Character | Element | Puzzle | TimelineEvent | null;
    metadata: {
      entityType: string;
      isPlaceholder?: boolean;
      missingFrom?: string;
    };
  };
}

export interface GraphDelta {
  entity: Character | Element | Puzzle | TimelineEvent;
  changes: {
    nodes: {
      updated: GraphNode[];
      created: GraphNode[];
      deleted: string[];  // Just IDs for deletions
    };
    edges: {
      created: Edge[];
      deleted: string[];  // Just IDs for deletions
      updated: Edge[];    // Added for edge property changes
    };
  };
  // Version tracking for cache consistency (prevents cache corruption)
  fromVersion?: number; // The cache version this delta was calculated from
  toVersion?: number;   // The cache version after applying this delta
}

export interface DeltaCalculatorResult {
  delta: GraphDelta;
  performanceMs: number;
}

export interface GraphState {
  nodes: GraphNode[];
  edges: Edge[];
  capturedAt: number;
}