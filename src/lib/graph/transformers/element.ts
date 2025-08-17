/**
 * Element Entity Transformer
 * Converts Element entities from Notion into React Flow nodes
 * Elements have owners, containers, and may contain SF_ patterns
 */

import type { Element } from '@/types/notion/app';
import type { GraphNode, NodeMetadata, SFMetadata, EntityLookupMaps } from '../types';
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
  'Memory Token (Audio)': 'disc',
  'Memory Token (Video)': 'volume-2',
  'Memory Token (Image)': 'image',
  'Memory Token (Audio+Image)': 'film',
  'Document': 'file-text',
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
function determineNodeSize(element: Element, sfMetadata?: SFMetadata): 'small' | 'medium' | 'large' {
  // Elements with high value ratings are large
  if (sfMetadata?.valueRating !== undefined && sfMetadata.valueRating >= 4) {
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
    let typeAbbrev: string;
    
    // Handle Memory Token types specially
    if (element.basicType.startsWith('Memory Token')) {
      typeAbbrev = 'MT';
    } else {
      // For other types, use first letter of each word (excluding parentheses)
      typeAbbrev = element.basicType
        .split(' ')
        .filter(word => !word.startsWith('('))
        .map(word => word[0])
        .join('');
    }
    
    label = `[${typeAbbrev}] ${label}`;
  }
  
  return label;
}

/**
 * Transform an Element entity into a GraphNode with enriched owner data
 */
export const transformElement = (
  element: Element,
  _index: number,
  lookupMaps?: EntityLookupMaps
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
  
  // Enrich with owner data if lookup maps are available
  if (lookupMaps && element.ownerId) {
    const owner = lookupMaps.characters.get(element.ownerId);
    if (owner) {
      metadata.ownerName = owner.name;
      // Map character tier to the expected format with default fallback
      if (owner.tier === 'Core') {
        metadata.ownerTier = 'Tier 1';
      } else if (owner.tier === 'Secondary') {
        metadata.ownerTier = 'Tier 2';
      } else {
        // Default to Tier 3 for 'Tertiary' or any unexpected value
        metadata.ownerTier = 'Tier 3';
      }
    }
  }
  
  // Add enriched data for details panel
  if (lookupMaps) {
    metadata.enrichedData = {};
    
    // Add container name if element is in a container
    if (element.containerId) {
      const container = lookupMaps.elements.get(element.containerId);
      if (container) {
        metadata.enrichedData.containerName = container.name;
      }
    }
    
    // Add parent puzzle name if element is from a puzzle container
    if (element.containerPuzzleId) {
      const puzzle = lookupMaps.puzzles.get(element.containerPuzzleId);
      if (puzzle) {
        metadata.enrichedData.parentPuzzleName = puzzle.name;
        
        // Find collaborators: other characters who own elements in the same puzzle
        const collaborators = new Set<string>();
        if (puzzle.puzzleElementIds) {
          puzzle.puzzleElementIds.forEach(elemId => {
            const otherElement = lookupMaps.elements.get(elemId);
            if (otherElement && otherElement.ownerId && otherElement.ownerId !== element.ownerId) {
              collaborators.add(otherElement.ownerId);
            }
          });
        }
        
        // Add collaborator information if there are any
        if (collaborators.size > 0) {
          metadata.enrichedData.collaborators = Array.from(collaborators).map(charId => {
            const character = lookupMaps.characters.get(charId);
            return {
              id: charId,
              name: character?.name || 'Unknown',
              tier: character?.tier || 'Unknown'
            };
          });
          metadata.enrichedData.requiresCollaboration = true;
        }
      }
    }
    
    // Add timeline information if element is associated with a timeline event
    // Note: Timeline nodes may be filtered out in puzzle view, but we still
    // track this metadata for display in node details and other views
    if (element.timelineEventId) {
      const timelineEvent = lookupMaps.timeline.get(element.timelineEventId);
      if (timelineEvent) {
        metadata.enrichedData.timelineInfo = {
          events: [{
            id: timelineEvent.id,
            name: timelineEvent.name,
            date: timelineEvent.date
          }],
          earliestDiscovery: timelineEvent.date
        };
      }
    }
  }
  
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
 * Transform multiple elements with optional enrichment from lookup maps
 */
export function transformElements(
  elements: Element[],
  lookupMaps?: EntityLookupMaps
): GraphNode<Element>[] {
  const nodes: GraphNode<Element>[] = [];
  
  elements.forEach((element, index) => {
    const node = transformElement(element, index, lookupMaps);
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
    // Note: SF badge should be rendered as a React element in the component,
    // not via pseudo-selector which doesn't work with inline styles
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