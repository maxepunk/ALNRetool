/**
 * Timeline Entity Transformer
 * Converts Timeline events from Notion into React Flow nodes
 * Timeline nodes are the simplest - they have no direct relationships
 */

import type { TimelineEvent } from '@/types/notion/app';
import type { GraphNode, EntityTransformer, NodeMetadata } from '../types';

/**
 * Default position for timeline nodes (will be overridden by layout)
 */
const DEFAULT_POSITION = { x: 0, y: 0 };

/**
 * Validate timeline entity has required fields
 */
function validateTimeline(timeline: TimelineEvent): string[] {
  const errors: string[] = [];
  
  if (!timeline.id) {
    errors.push('Missing timeline ID');
  }
  
  if (!timeline.description) {
    errors.push('Missing timeline description');
  }
  
  // Date is optional but warn if missing
  if (!timeline.date) {
    console.warn(`Timeline ${timeline.id} has no date`);
  }
  
  return errors;
}

/**
 * Format date for display
 */
function formatDate(date: string | null): string {
  if (!date) return 'Unknown Date';
  
  try {
    // Parse ISO date and format nicely using UTC to avoid timezone issues
    const parsed = new Date(date);
    
    // Check if date is valid
    if (isNaN(parsed.getTime())) {
      console.warn(`Invalid date format: ${date}`);
      return date; // Return as-is if parsing fails
    }
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[parsed.getUTCMonth()];
    const day = parsed.getUTCDate();
    const year = parsed.getUTCFullYear();
    return `${month} ${day}, ${year}`;
  } catch {
    console.warn(`Invalid date format: ${date}`);
    return date; // Return as-is if parsing fails
  }
}

/**
 * Transform a Timeline entity into a GraphNode
 */
export const transformTimeline: EntityTransformer<TimelineEvent> = (
  timeline: TimelineEvent,
  _index: number
): GraphNode<TimelineEvent> | null => {
  // Validate required fields
  const errors = validateTimeline(timeline);
  
  // Build metadata
  const metadata: NodeMetadata = {
    entityType: 'timeline',
    visualHints: {
      color: '#9333ea', // Purple for timeline events
      icon: 'clock',
      size: 'small', // Timeline nodes are typically smaller
    },
  };
  
  // Add error state if validation failed
  if (errors.length > 0) {
    metadata.errorState = {
      type: 'missing_data',
      message: errors.join('; '),
    };
    
    // Still create the node but with error styling
    console.warn(`Timeline node ${timeline.id} has errors:`, errors);
  }
  
  // Create the node
  const node: GraphNode<TimelineEvent> = {
    id: timeline.id,
    type: 'timeline', // Custom node type for React Flow
    position: DEFAULT_POSITION,
    data: {
      entity: timeline,
      label: formatDate(timeline.date),
      metadata,
    },
  };
  
  return node;
}

/**
 * Transform multiple timeline events
 */
export function transformTimelineEvents(
  events: TimelineEvent[]
): GraphNode<TimelineEvent>[] {
  const nodes: GraphNode<TimelineEvent>[] = [];
  
  events.forEach((event, index) => {
    try {
      const node = transformTimeline(event, index);
      if (node) {
        nodes.push(node);
      } else {
        console.error(`Failed to transform timeline event ${event?.id || 'unknown'}`);
      }
    } catch (error) {
      console.error(`Failed to transform timeline event: ${error}`);
    }
  });
  
  // Sort by date if available
  nodes.sort((a, b) => {
    const dateA = a.data.entity.date;
    const dateB = b.data.entity.date;
    
    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;
    
    return new Date(dateA).getTime() - new Date(dateB).getTime();
  });
  
  return nodes;
}

/**
 * Get timeline node display configuration
 */
export function getTimelineNodeStyle(node: GraphNode<TimelineEvent>) {
  const hasError = node.data.metadata.errorState !== undefined;
  
  return {
    background: hasError ? '#fee2e2' : '#f3e8ff', // Red tint for errors, purple tint normally
    color: hasError ? '#991b1b' : '#6b21a8',
    border: `2px ${hasError ? 'dashed' : 'solid'} ${hasError ? '#dc2626' : '#9333ea'}`,
    borderRadius: '8px',
    padding: '10px',
    fontSize: '12px',
    fontWeight: '500',
    minWidth: '120px',
    maxWidth: '200px',
  };
}