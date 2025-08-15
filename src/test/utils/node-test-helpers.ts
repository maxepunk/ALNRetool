import type { NodeProps } from '@xyflow/react';
import type { GraphNodeData, NodeMetadata } from '@/lib/graph/types';
import type { Character, Element, Puzzle, TimelineEvent } from '@/types/notion/app';

/**
 * Helper to create valid NodeProps for testing React Flow nodes
 */
export function createNodeProps<T extends Character | Element | Puzzle | TimelineEvent>(
  entity: T,
  metadata: Partial<NodeMetadata> = {},
  overrides: Partial<NodeProps> = {}
): NodeProps {
  const nodeType = getNodeType(entity);
  
  const defaultMetadata: NodeMetadata = {
    entityType: nodeType,
    visualHints: {
      size: 'medium',
      ...metadata.visualHints
    },
    ...metadata
  };

  const nodeData: GraphNodeData<T> = {
    entity,
    label: getLabel(entity),
    metadata: defaultMetadata
  };

  return {
    id: 'node-1',
    type: nodeType,
    position: { x: 0, y: 0 },
    data: nodeData,
    selected: false,
    isConnectable: true,
    xPos: 0,
    yPos: 0,
    zIndex: 0,
    dragging: false,
    draggable: true,
    selectable: true,
    deletable: true,
    ...overrides
  } as NodeProps;
}

function getNodeType(entity: any): 'character' | 'element' | 'puzzle' | 'timeline' {
  if ('tier' in entity) return 'character';
  if ('basicType' in entity) return 'element';
  if ('puzzleElementIds' in entity) return 'puzzle';
  if ('date' in entity) return 'timeline';
  return 'element'; // default
}

function getLabel(entity: any): string {
  return entity.name || entity.description || entity.puzzle || 'Unknown';
}

/**
 * Create minimal GraphNodeData for testing
 */
export function createGraphNodeData<T extends Character | Element | Puzzle | TimelineEvent>(
  entity: T,
  metadata: Partial<NodeMetadata> = {}
): GraphNodeData<T> {
  const nodeType = getNodeType(entity);
  
  return {
    entity,
    label: getLabel(entity),
    metadata: {
      entityType: nodeType,
      ...metadata
    }
  };
}