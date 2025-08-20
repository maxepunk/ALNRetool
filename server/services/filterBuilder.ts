/**
 * Notion Filter Builder
 * Converts query parameters to Notion API filter objects
 */

import type { QueryDatabaseParameters } from '@notionhq/client/build/src/api-endpoints.js';

type NotionFilter = QueryDatabaseParameters['filter'];

/**
 * Build Notion filters for puzzles based on query parameters
 */
export function buildPuzzleFilters(params: {
  acts?: string;
  status?: string;
  lastEdited?: string;
}): NotionFilter | undefined {
  const filters: any[] = [];

  // Filter by acts (timing field in puzzles)
  // NOTE: "Timing" is a rollup field and cannot be filtered server-side
  // This filter needs to be applied client-side
  // Commenting out for now - acts filtering will be done client-side
  // if (params.acts) {
  //   const acts = params.acts.split(',');
  //   const actFilters = acts.map(act => ({
  //     property: 'Timing',
  //     multi_select: {
  //       contains: act
  //     }
  //   }));
    
  //   if (actFilters.length > 1) {
  //     filters.push({ or: actFilters });
  //   } else {
  //     filters.push(actFilters[0]);
  //   }
  // }

  // Filter by last edited time
  if (params.lastEdited) {
    const dateFilter = getDateFilter(params.lastEdited);
    if (dateFilter) {
      filters.push({
        timestamp: 'last_edited_time',
        last_edited_time: dateFilter
      });
    }
  }

  // Note: Status filtering (completed/incomplete) requires element data
  // This should be done client-side after fetching as it's derived

  if (filters.length === 0) {
    return undefined;
  }

  if (filters.length === 1) {
    return filters[0];
  }

  return {
    and: filters
  };
}

/**
 * Build Notion filters for characters based on query parameters
 */
export function buildCharacterFilters(params: {
  tiers?: string;
  type?: string;
  lastEdited?: string;
}): NotionFilter | undefined {
  const filters: any[] = [];

  // Filter by tiers
  if (params.tiers) {
    const tiers = params.tiers.split(',');
    const tierFilters = tiers.map(tier => ({
      property: 'Tier',
      select: {
        equals: tier
      }
    }));
    
    if (tierFilters.length > 1) {
      filters.push({ or: tierFilters });
    } else {
      filters.push(tierFilters[0]);
    }
  }

  // Filter by character type
  if (params.type && params.type !== 'all') {
    filters.push({
      property: 'CharacterKind',
      select: {
        equals: params.type === 'players' ? 'Player' : 'NPC'
      }
    });
  }

  // Filter by last edited time
  if (params.lastEdited) {
    const dateFilter = getDateFilter(params.lastEdited);
    if (dateFilter) {
      filters.push({
        timestamp: 'last_edited_time',
        last_edited_time: dateFilter
      });
    }
  }

  // Note: Ownership filtering requires element data and can't be done in Notion query

  if (filters.length === 0) {
    return undefined;
  }

  if (filters.length === 1) {
    return filters[0];
  }

  return {
    and: filters
  };
}

/**
 * Build Notion filters for elements based on query parameters
 */
export function buildElementFilters(params: {
  status?: string;
  lastEdited?: string;
}): NotionFilter | undefined {
  const filters: any[] = [];

  // Filter by content status
  if (params.status) {
    const statuses = params.status.split(',');
    const statusFilters = statuses.map(status => ({
      property: 'Status',
      status: {
        equals: status
      }
    }));
    
    if (statusFilters.length > 1) {
      filters.push({ or: statusFilters });
    } else {
      filters.push(statusFilters[0]);
    }
  }

  // Filter by last edited time
  if (params.lastEdited) {
    const dateFilter = getDateFilter(params.lastEdited);
    if (dateFilter) {
      filters.push({
        timestamp: 'last_edited_time',
        last_edited_time: dateFilter
      });
    }
  }

  if (filters.length === 0) {
    return undefined;
  }

  if (filters.length === 1) {
    return filters[0];
  }

  return {
    and: filters
  };
}

/**
 * Convert date range string to Notion date filter
 */
function getDateFilter(range: string): any {
  const now = new Date();
  
  switch (range) {
    case 'today':
    case '24h':
      return {
        on_or_after: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
      };
    
    case 'week':
    case '7d':
      return {
        on_or_after: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
      };
    
    case 'month':
    case '30d':
      return {
        on_or_after: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
      };
    
    default:
      return undefined;
  }
}