/**
 * Element Entity Transformer
 * Converts Element entities from Notion into React Flow nodes
 * Elements have owners, containers, and may contain SF_ patterns
 */

import type { Element } from '@/types/notion/app';
import type { GraphNode, EntityTransformer, NodeMetadata } from '../types';
import { extractSFMetadata, hasSFPatterns } from '../patterns';

/**
 * Default position for element nodes (will be overridden by layout)
 */
const DEFAULT_POSITION = { x: 0, y: 0 };

/**
 * Status to color mapping for visual feedback
 */
const STATUS_COLORS: Record<string, string> = {
  'Idea/Placeholder': '#9ca3af',     // Gray
  'in space playtest ready': '#10b981', // Green
  'In development': '#eab308',  // Yellow
  'Writing Complete': '#3b82f6', // Blue
  'Design Complete': '#3b82f6',  // Blue
  'Source Prop/print': '#f97316', // Orange
  'Ready for Playtest': '#10b981', // Green
  'Done': '#10b981',            // Green
};

/**
 * Basic type to icon mapping
 */
const TYPE_ICONS: Record<string, string> = {
  'Set Dressing': 'home',
  'Prop': 'box',
  'Memory Token': 'disc',
  'Document': 'file-text',
  'Audio': 'volume-2',
  'Video': 'video',
  'Image': 'image',
  'Audio+Image': 'film',
};

/**
 * Validate element entity has required fields
 */
function validateElement(element: Element): string[] {
  const errors: string[] = [];
  
  if (!element.id) {
    errors.push('Missing element ID');
  }
  
  if (!element.name) {
    errors.push('Missing element name');
  }
  
  // Check if status is valid
  if (element.status && !STATUS_COLORS[element.status]) {
    console.warn(`Unknown status for element ${element.id}: ${element.status}`);
  }
  
  return errors;
}

/**
 * Determine node size based on element importance
 */
function determineNodeSize(element: Element, sfMetadata?: any): 'small' | 'medium' | 'large' {
  // Elements with high value ratings are large
  if (sfMetadata?.valueRating >= 4) {
    return 'large';
  }
  
  // Container elements are medium
  if (element.contentIds?.length > 0 || element.containerPuzzleId) {
    return 'medium';
  }
  
  // Default to small
  return 'small';
}

/**
 * Generate label for element node
 */
function generateLabel(element: Element): string {
  // Use name as primary label
  let label = element.name || 'Unnamed Element';
  
  // Add type indicator if it's a special type
  if (element.basicType && element.basicType !== 'Prop') {
    const typeAbbrev = element.basicType
      .split(' ')
      .map(word => word[0])
      .join('');
    label = `[${typeAbbrev}] ${label}`;
  }
  
  return label;
}

/**
 * Transform an Element entity into a GraphNode
 */
export const transformElement: EntityTransformer<Element> = (
  element: Element,
  _index: number
): GraphNode<Element> | null => {
  // Validate required fields
  const errors = validateElement(element);
  
  // Extract SF_ patterns if present in description
  const sfResult = extractSFMetadata(element.descriptionText);
  
  // Build metadata
  const metadata: NodeMetadata = {
    entityType: 'element',
    status: element.status || 'Unknown',
    visualHints: {
      color: STATUS_COLORS[element.status] || '#6b7280',
      icon: TYPE_ICONS[element.basicType] || 'circle',
      size: determineNodeSize(element, sfResult.metadata),
    },
  };
  
  // Add SF_ patterns if found
  if (sfResult.patternsFound.length > 0) {
    metadata.sfPatterns = sfResult.metadata;
    
    // Log warnings for incomplete patterns
    if (sfResult.warnings.length > 0) {
      console.info(`Element ${element.name} SF_ patterns:`, sfResult.warnings);
    }
  }
  
  // Add error state if validation failed
  if (errors.length > 0) {
    metadata.errorState = {
      type: 'missing_data',
      message: errors.join('; '),
    };
    console.warn(`Element node ${element.id} has errors:`, errors);
  }
  
  // Create the node
  const node: GraphNode<Element> = {
    id: element.id,
    type: 'element', // Custom node type for React Flow
    position: DEFAULT_POSITION,
    data: {
      entity: element,
      label: generateLabel(element),
      metadata,
    },
  };
  
  return node;
}

/**
 * Transform multiple elements
 */
export function transformElements(
  elements: Element[]
): GraphNode<Element>[] {
  const nodes: GraphNode<Element>[] = [];
  
  elements.forEach((element, index) => {
    const node = transformElement(element, index);
    if (node) {
      nodes.push(node);
    } else {
      console.error(`Failed to transform element ${element.id}`);
    }
  });
  
  // Sort by status (complete items last)
  nodes.sort((a, b) => {
    const statusOrder = ['Idea/Placeholder', 'In development', 'Writing Complete', 
                        'Design Complete', 'Source Prop/print', 'in space playtest ready', 'Ready for Playtest', 'Done'];
    const aIndex = statusOrder.indexOf(a.data.entity.status || '');
    const bIndex = statusOrder.indexOf(b.data.entity.status || '');
    
    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    
    return aIndex - bIndex;
  });
  
  return nodes;
}

/**
 * Get element node display configuration
 */
export function getElementNodeStyle(node: GraphNode<Element>) {
  const hasError = node.data.metadata.errorState !== undefined;
  const status = node.data.entity.status;
  const hasSF = node.data.metadata.sfPatterns !== undefined;
  
  const baseColor = STATUS_COLORS[status || ''] || '#6b7280';
  
  return {
    background: hasError ? '#fee2e2' : `${baseColor}20`, // 20% opacity
    color: hasError ? '#991b1b' : baseColor,
    border: `2px ${hasError ? 'dashed' : 'solid'} ${hasError ? '#dc2626' : baseColor}`,
    borderRadius: hasSF ? '12px' : '8px', // More rounded if has SF patterns
    padding: '12px',
    fontSize: '13px',
    fontWeight: hasSF ? '600' : '500',
    minWidth: '140px',
    maxWidth: '250px',
    // Add badge for SF patterns
    ...(hasSF && {
      '&::after': {
        content: '"SF"',
        position: 'absolute',
        top: '-8px',
        right: '-8px',
        background: '#8b5cf6',
        color: 'white',
        borderRadius: '10px',
        padding: '2px 6px',
        fontSize: '10px',
        fontWeight: 'bold',
      },
    }),
  };
}

/**
 * Check if an element is a container
 */
export function isContainer(element: Element): boolean {
  return Boolean(element.contentIds?.length > 0 || element.containerPuzzleId);
}

/**
 * Get elements that need special handling
 */
export function getSpecialElements(elements: Element[]) {
  return {
    containers: elements.filter(isContainer),
    withSFPatterns: elements.filter(e => hasSFPatterns(e.descriptionText)),
    incomplete: elements.filter(e => 
      e.status === 'Idea/Placeholder' || 
      !e.status
    ),
  };
}