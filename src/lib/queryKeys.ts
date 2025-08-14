/**
 * Centralized query key factory for React Query
 * Provides type-safe, consistent query keys for caching and invalidation
 */

export const queryKeys = {
  // Root key for all Notion-related queries
  all: ['notion'] as const,
  
  // Characters queries
  characters: () => [...queryKeys.all, 'characters'] as const,
  character: (id: string) => [...queryKeys.characters(), id] as const,
  charactersList: (filters?: { limit?: number; cursor?: string }) => 
    [...queryKeys.characters(), 'list', filters] as const,
  
  // Elements queries
  elements: () => [...queryKeys.all, 'elements'] as const,
  element: (id: string) => [...queryKeys.elements(), id] as const,
  elementsList: (filters?: { limit?: number; cursor?: string }) =>
    [...queryKeys.elements(), 'list', filters] as const,
  
  // Puzzles queries
  puzzles: () => [...queryKeys.all, 'puzzles'] as const,
  puzzle: (id: string) => [...queryKeys.puzzles(), id] as const,
  puzzlesList: (filters?: { limit?: number; cursor?: string }) =>
    [...queryKeys.puzzles(), 'list', filters] as const,
  
  // Timeline queries
  timeline: () => [...queryKeys.all, 'timeline'] as const,
  timelineEvent: (id: string) => [...queryKeys.timeline(), id] as const,
  timelineList: (filters?: { limit?: number; cursor?: string }) =>
    [...queryKeys.timeline(), 'list', filters] as const,
}

// Helper function to invalidate all queries for a specific entity type
export const invalidateEntityQueries = (
  queryClient: { invalidateQueries: (options: { queryKey: string[] }) => void },
  entityType: 'characters' | 'elements' | 'puzzles' | 'timeline'
) => {
  const keyMap = {
    characters: queryKeys.characters(),
    elements: queryKeys.elements(),
    puzzles: queryKeys.puzzles(),
    timeline: queryKeys.timeline(),
  }
  
  return queryClient.invalidateQueries({ queryKey: keyMap[entityType] })
}