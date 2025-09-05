/**
 * GraphDataContext
 * 
 * Provides entity lookup capabilities across the graph visualization.
 * Enables nodes to resolve entity names and details by ID.
 * 
 * @module contexts/GraphDataContext
 */

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { Character, Element, Puzzle, TimelineEvent } from '@/types/notion/app';

export type EntityType = 'character' | 'element' | 'puzzle' | 'timeline';
export type Entity = Character | Element | Puzzle | TimelineEvent;

interface AllEntities {
  characters: Character[];
  elements: Element[];
  puzzles: Puzzle[];
  timeline: TimelineEvent[];
}

interface GraphDataContextValue {
  /**
   * Get a full entity by ID and type
   */
  getEntityById: (id: string, type: EntityType) => Entity | undefined;
  
  /**
   * Get just the name of an entity by ID and type
   */
  getEntityName: (id: string, type: EntityType) => string;
  
  /**
   * Get multiple entity names by IDs and type
   */
  getEntityNames: (ids: string[], type: EntityType) => string[];
  
  /**
   * Direct access to all entities if needed
   */
  allEntities: AllEntities;
}

const GraphDataContext = createContext<GraphDataContextValue | null>(null);

interface GraphDataContextProviderProps {
  children: ReactNode;
  allEntities: AllEntities;
}

export function GraphDataContextProvider({ 
  children, 
  allEntities 
}: GraphDataContextProviderProps) {
  // Create lookup maps for O(1) access
  const entityMaps = useMemo(() => {
    const characterMap = new Map<string, Character>(
      allEntities.characters.map(c => [c.id, c])
    );
    const elementMap = new Map<string, Element>(
      allEntities.elements.map(e => [e.id, e])
    );
    const puzzleMap = new Map<string, Puzzle>(
      allEntities.puzzles.map(p => [p.id, p])
    );
    const timelineMap = new Map<string, TimelineEvent>(
      allEntities.timeline.map(t => [t.id, t])
    );
    
    return { characterMap, elementMap, puzzleMap, timelineMap };
  }, [allEntities]);

  const value = useMemo<GraphDataContextValue>(() => ({
    getEntityById: (id: string, type: EntityType): Entity | undefined => {
      if (!id) return undefined;
      
      switch (type) {
        case 'character':
          return entityMaps.characterMap.get(id);
        case 'element':
          return entityMaps.elementMap.get(id);
        case 'puzzle':
          return entityMaps.puzzleMap.get(id);
        case 'timeline':
          return entityMaps.timelineMap.get(id);
        default:
          return undefined;
      }
    },
    
    getEntityName: (id: string, type: EntityType): string => {
      if (!id) return 'Unknown';
      
      const entity = value.getEntityById(id, type);
      if (!entity) return 'Unknown';
      
      // All entity types have a 'name' field
      return entity.name || 'Unnamed';
    },
    
    getEntityNames: (ids: string[], type: EntityType): string[] => {
      if (!ids || ids.length === 0) return [];
      
      return ids
        .map(id => value.getEntityName(id, type))
        .filter(name => name !== 'Unknown');
    },
    
    allEntities,
  }), [entityMaps, allEntities]);

  return (
    <GraphDataContext.Provider value={value}>
      {children}
    </GraphDataContext.Provider>
  );
}

/**
 * Hook to access graph data context
 * @throws {Error} If used outside of GraphDataContextProvider
 */
export function useGraphData(): GraphDataContextValue {
  const context = useContext(GraphDataContext);
  if (!context) {
    throw new Error('useGraphData must be used within GraphDataContextProvider');
  }
  return context;
}