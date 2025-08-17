/**
 * Element Transformer using Base Transformer
 * Reduces duplication through inheritance
 */

import type { Element } from '@/types/notion/app';
import type { GraphNode, NodeMetadata, VisualHints, SFMetadata } from '../../types';
import { BaseTransformer } from '../BaseTransformer';
import { extractSFMetadata } from '../../patterns';

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

export class ElementTransformer extends BaseTransformer<Element> {
  protected entityType = 'element' as const;
  protected nodeType = 'element';

  /**
   * Override validation to add element-specific checks
   */
  protected validateEntity(element: Element): string[] {
    const errors = super.validateEntity(element);
    
    // Check for required relationships
    if (!element.requiredForPuzzleIds?.length && !element.rewardedByPuzzleIds?.length) {
      console.warn(`Element ${element.id} has no puzzle connections`);
    }
    
    // Validate SF patterns if present
    if (element.sfPatterns) {
      const sfErrors = this.validateSFPatterns(element.sfPatterns);
      errors.push(...sfErrors);
    }
    
    return errors;
  }

  /**
   * Override label generation for elements
   */
  protected generateLabel(element: Element): string {
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
   * Create element-specific metadata
   */
  protected createMetadata(element: Element, errors: string[]): NodeMetadata {
    // Extract SF patterns from element (may already be extracted or in descriptionText)
    const sfResult = extractSFMetadata(element.descriptionText || '');
    const sfMetadata = sfResult.metadata;
    
    // Determine element size based on importance
    const size = this.determineElementSize(element, sfMetadata);
    
    // Create visual hints with status color
    const visualHints: VisualHints = {
      color: STATUS_COLORS[element.status] || '#9ca3af',
      size,
      shape: 'rectangle',
    };
    
    // Create base metadata
    const metadata = super.createBaseMetadata(element, errors, visualHints);
    
    // Add element-specific metadata
    if (element.status) {
      metadata.status = element.status;
    }
    
    if (sfMetadata && sfResult.patternsFound.length > 0) {
      metadata.sfPatterns = sfMetadata;
    }
    
    if (element.ownerId) {
      metadata.ownerName = element.ownerId; // Will be enriched later
    }
    
    // Track container status
    if (element.isContainer) {
      (metadata as any).isContainer = true;
    }
    
    // Track dual-role elements
    if (element.requiredForPuzzleIds?.length && element.rewardedByPuzzleIds?.length) {
      (metadata as any).isDualRole = true;
    }
    
    return metadata;
  }

  /**
   * Enrich node with additional data from lookupMaps
   */
  public enrichNode(node: GraphNode<Element>, lookupMaps: any): GraphNode<Element> {
    if (!lookupMaps) return node;
    
    const element = node.data.entity;
    const metadata = { ...node.data.metadata };
    
    // Initialize enrichedData if not present
    if (!metadata.enrichedData) {
      metadata.enrichedData = {};
    }
    
    // Enrich owner data
    if (element.ownerId && lookupMaps.characters) {
      const owner = lookupMaps.characters.get(element.ownerId);
      if (owner) {
        metadata.ownerName = owner.name;
        // Map character tier to expected format
        if (owner.tier === 'Core') {
          metadata.ownerTier = 'Tier 1';
        } else if (owner.tier === 'Secondary') {
          metadata.ownerTier = 'Tier 2';
        } else {
          metadata.ownerTier = 'Tier 3';
        }
      }
    }
    
    // Add container name if element is in a container
    if (element.containerId && lookupMaps.elements) {
      const container = lookupMaps.elements.get(element.containerId);
      if (container) {
        metadata.enrichedData.containerName = container.name;
      }
    }
    
    // Add parent puzzle name if element is from a puzzle container
    if (element.containerPuzzleId && lookupMaps.puzzles) {
      const puzzle = lookupMaps.puzzles.get(element.containerPuzzleId);
      if (puzzle) {
        metadata.enrichedData.parentPuzzleName = puzzle.name;
        
        // Find collaborators
        const collaborators = new Set<string>();
        if (puzzle.puzzleElementIds) {
          puzzle.puzzleElementIds.forEach((elemId: string) => {
            const otherElement = lookupMaps.elements.get(elemId);
            if (otherElement && otherElement.ownerId && otherElement.ownerId !== element.ownerId) {
              collaborators.add(otherElement.ownerId);
            }
          });
        }
        
        // Add collaborator information
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
    if (element.timelineEventId && lookupMaps.timeline) {
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
    
    return {
      ...node,
      data: {
        ...node.data,
        metadata
      }
    };
  }

  /**
   * Validate SF patterns
   */
  private validateSFPatterns(patterns: Record<string, any>): string[] {
    const errors: string[] = [];
    
    if (patterns.valueRating !== undefined) {
      const rating = Number(patterns.valueRating);
      if (isNaN(rating) || rating < 1 || rating > 5) {
        errors.push('Invalid SF value rating (must be 1-5)');
      }
    }
    
    if (patterns.memoryType && !['Personal', 'Public', 'Mixed'].includes(patterns.memoryType)) {
      errors.push(`Invalid SF memory type: ${patterns.memoryType}`);
    }
    
    return errors;
  }


  /**
   * Determine element size based on importance
   */
  private determineElementSize(element: Element, sfMetadata?: SFMetadata | null): 'small' | 'medium' | 'large' {
    // High-value SF items are large
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
   * Override sorting to group by type and status
   */
  protected sortNodes(nodes: GraphNode<Element>[]): GraphNode<Element>[] {
    return nodes.sort((a, b) => {
      const aElement = a.data.entity;
      const bElement = b.data.entity;
      
      // Containers first
      if (aElement.isContainer !== bElement.isContainer) {
        return aElement.isContainer ? -1 : 1;
      }
      
      // Then by status (Done first)
      const statusOrder = ['Done', 'Writing Complete', 'In development', 'Idea/Placeholder'];
      const aStatusIndex = statusOrder.indexOf(aElement.status || '');
      const bStatusIndex = statusOrder.indexOf(bElement.status || '');
      
      if (aStatusIndex !== bStatusIndex) {
        return (aStatusIndex === -1 ? 999 : aStatusIndex) - 
               (bStatusIndex === -1 ? 999 : bStatusIndex);
      }
      
      // Then alphabetically
      return a.data.label.localeCompare(b.data.label);
    });
  }
}

// Export singleton instance
export const elementTransformer = new ElementTransformer();