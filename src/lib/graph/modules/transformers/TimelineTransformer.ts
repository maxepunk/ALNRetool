/**
 * TimelineTransformer Module
 * Transforms Timeline entities into graph nodes with proper metadata
 */

import type { TimelineEvent } from '@/types/notion/app';
import type { NodeMetadata, VisualHints, GraphNode } from '../../types';
import { BaseTransformer } from '../BaseTransformer';
import { logger } from '../../utils/Logger'


export class TimelineTransformer extends BaseTransformer<TimelineEvent> {
  protected entityType = 'timeline' as const;
  protected nodeType = 'timeline';

  /**
   * Override label generation to format dates
   */
  protected generateLabel(timeline: TimelineEvent): string {
    if (!timeline.date) {
      logger.warn(`Timeline event ${timeline.id} has no date`);
      return 'Unknown Date';
    }

    try {
      const date = new Date(timeline.date);
      if (isNaN(date.getTime())) {
        logger.warn(`Invalid date format for timeline event ${timeline.id}: ${timeline.date}`);
        return timeline.date; // Return as-is if can't parse
      }

      // Format as "Mon DD, YYYY" in UTC to avoid timezone issues
      const options: Intl.DateTimeFormatOptions = { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        timeZone: 'UTC'
      };
      return date.toLocaleDateString('en-US', options);
    } catch (error) {
      logger.warn(`Error formatting date for timeline event ${timeline.id}:`, undefined, error);
      return timeline.date || 'Unknown Date';
    }
  }

  /**
   * Create timeline-specific metadata
   */
  protected createMetadata(timeline: TimelineEvent, errors: string[]): NodeMetadata {
    const visualHints: VisualHints = {
      shape: 'rectangle',
      size: this.determineTimelineSize(timeline),
      color: '#FF7F50', // Coral color for timeline events
    };

    return {
      ...this.createBaseMetadata(timeline, errors, visualHints),
      timelineConnections: [
        ...(timeline.charactersInvolvedIds || []),
        ...(timeline.memoryEvidenceIds || []),
      ],
    };
  }

  /**
   * Determine timeline event size based on importance
   */
  private determineTimelineSize(timeline: TimelineEvent): 'small' | 'medium' | 'large' {
    const totalConnections = (timeline.charactersInvolvedIds?.length || 0) + 
                            (timeline.memoryEvidenceIds?.length || 0);
    
    // Large if connected to many entities
    if (totalConnections > 5) {
      return 'large';
    }
    
    // Medium if has some connections
    if (totalConnections > 2) {
      return 'medium';
    }
    
    // Small for minimal connections
    return 'small';
  }

  /**
   * Override validation for timeline-specific rules
   */
  protected validateEntity(timeline: TimelineEvent): string[] {
    const errors: string[] = [];
    
    // Check required fields - ID and description
    if (!timeline.id) {
      errors.push('Missing timeline ID');
    }
    
    if (!timeline.description) {
      errors.push('Missing timeline description');
    }
    
    // Check for valid date
    if (timeline.date && !this.isValidDate(timeline.date)) {
      errors.push('Invalid date format');
    }
    
    return errors;
  }

  /**
   * Check if a date string is valid
   */
  private isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }

  /**
   * Override sortNodes to sort timeline events chronologically by date
   * Events with dates come first (sorted chronologically), then events without dates
   */
  protected override sortNodes(nodes: GraphNode<TimelineEvent>[]): GraphNode<TimelineEvent>[] {
    return nodes.sort((a, b) => {
      const aDate = a.data.entity.date ? new Date(a.data.entity.date).getTime() : Infinity;
      const bDate = b.data.entity.date ? new Date(b.data.entity.date).getTime() : Infinity;

      // Sort by date ascending (earlier dates first)
      if (aDate !== bDate) {
        return aDate - bDate;
      }

      // For events on the same date or both without dates, 
      // fallback to alphabetical sort by label
      return a.data.label.localeCompare(b.data.label);
    });
  }
}

/**
 * Pre-configured singleton instance of TimelineTransformer.
 * Ready-to-use transformer for timeline event processing.
 * 
 * **Usage Benefits:**
 * - Avoids repeated instantiation overhead
 * - Consistent configuration across application
 * - Immediate availability for timeline transformations
 * - Standard pattern matching other transformer modules
 * 
 * **Common Usage Patterns:**
 * - Single timeline event transformation with date formatting
 * - Collection transformation with chronological sorting
 * - Integration with graph building pipeline
 * - Timeline-specific validation and connection tracking
 * 
 * @example
 * ```typescript
 * import { timelineTransformer } from './transformers/TimelineTransformer';
 * 
 * // Transform single timeline event
 * const eventNode = timelineTransformer.transformEntity(timelineEvent);
 * 
 * // Transform chronologically sorted collection
 * const eventNodes = timelineTransformer.transformCollection(
 *   events,
 *   { skipValidation: false, sortResults: true }
 * );
 * 
 * // Use in graph building
 * const graphBuilder = new GraphBuilder();
 * graphBuilder.addNodes(eventNodes);
 * 
 * // Access timeline connections for edge creation
 * eventNodes.forEach(node => {
 *   const connections = node.data.metadata.timelineConnections;
 *   connections.forEach(connectionId => {
 *     // Create edges to connected entities
 *   });
 * });
 * ```
 * 
 * Singleton Pattern: Ensures consistent transformer configuration across modules
 */
export const timelineTransformer = new TimelineTransformer();