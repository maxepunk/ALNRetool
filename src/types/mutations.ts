/**
 * Mutation Type Definitions
 * 
 * TECHNICAL DEBT FIX: Centralized type definitions for all mutations
 * replacing scattered 'any' types throughout the codebase.
 */

import type { Character, Element, Puzzle, TimelineEvent } from '@/types/notion/app';
import type { GraphDelta } from '../../server/types/delta';

// Entity type union
export type EntityType = 'characters' | 'elements' | 'puzzles' | 'timeline';
export type Entity = Character | Element | Puzzle | TimelineEvent;

// Mutation types
export type MutationType = 'create' | 'update' | 'delete';

// Standardized mutation payloads
export interface CreatePayload<T extends Entity> {
  data: Partial<T>;
  parentRelation?: {
    parentType: string;
    parentId: string;
    fieldKey: string;
  };
}

export interface UpdatePayload<T extends Entity> {
  id: string;
  data: Partial<T>;
  version?: string; // H2: Changed to string for lastEdited timestamp
}

// TECHNICAL DEBT FIX: Standardized DELETE format (no more string ID)
export interface DeletePayload {
  id: string;
  version?: string; // H2: Changed to string for lastEdited timestamp
}

// Server response format
export interface MutationResponse<T extends Entity = Entity> {
  success: boolean;
  data: T;
  delta?: GraphDelta; // Optional delta for incremental updates
}

// Mutation context for rollback
export interface MutationContext {
  previousGraphData?: any;
  queryKey: string[];
  tempId?: string;
  createdEdges?: string[];
  performanceStart?: number;
  optimisticStartTime?: number;
}

// Cache update strategies
export type CacheUpdateStrategy = 
  | 'invalidate' // Full refetch (legacy)
  | 'optimistic' // Manual update (current)
  | 'delta';     // Delta application (new)

// Performance metrics
export interface MutationPerformanceMetrics {
  strategy: CacheUpdateStrategy;
  duration: number;
  deltaSize?: number;
  cacheSize?: number;
  success: boolean;
}