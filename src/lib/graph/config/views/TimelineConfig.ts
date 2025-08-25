/**
 * TimelineConfig
 * 
 * Declarative configuration for timeline view.
 * Replaces TimelineStrategy (98 lines) with proper filtering logic.
 */

import type { ViewConfiguration } from '../ViewConfiguration';

export const TimelineConfig: ViewConfiguration = {
  id: 'timeline',
  name: 'Timeline',
  description: 'Shows timeline events within a date range and involved characters',

  nodes: {
    include: [
      // Timeline events (filtered by date if provided)
      {
        type: 'filtered',
        entityType: 'timeline',
        where: () => true // Will be overridden by hooks
      },
      // Characters involved in timeline events
      {
        type: 'filtered',
        entityType: 'character',
        where: () => true // Will be overridden by hooks
      }
    ]
  },

  edges: [
    { entityType: 'timeline' }
  ],

  hooks: {
    beforeNodeSelection: (config, data) => {
      // This hook filters the data based on date range before node selection
      const variables = (config as ViewConfiguration & { appliedVariables?: Record<string, unknown> }).appliedVariables ?? {};
      const startDate = variables.startDate;
      const endDate = variables.endDate;
      
      if (startDate || endDate) {
        // Filter timeline events by date
        const filteredEvents = data.timeline.filter(event => {
          if (!event.date) return false;
          const eventDate = new Date(event.date);
          if (startDate && eventDate < new Date(startDate as string | number | Date)) return false;
          if (endDate && eventDate > new Date(endDate as string | number | Date)) return false;
          return true;
        });
        
        // Collect character IDs from filtered events
        const characterIds = new Set<string>();
        filteredEvents.forEach(event => {
          if (event.charactersInvolvedIds) {
            event.charactersInvolvedIds.forEach(id => characterIds.add(id));
          }
        });
        
        // Update where clauses to filter properly
        config.nodes.include[0]!.where = (event: unknown) => {
          const eventObj = event as { date?: unknown };
          if (!eventObj.date) return false;
          const eventDate = new Date(eventObj.date as string);
          if (startDate && eventDate < new Date(startDate as string)) return false;
          if (endDate && eventDate > new Date(endDate as string)) return false;
          return true;
        };
        
        config.nodes.include[1]!.where = (char: unknown) => {
          const charObj = char as { id: string };
          return characterIds.has(charObj.id);
        };
      }
    }
  },

  performance: {
    maxNodes: 500,
    cacheTTL: 300000 // 5 minutes
  }
};