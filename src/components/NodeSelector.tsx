/**
 * NodeSelector Component
 * Generic selector that adapts to different entity types
 * Supports characters, puzzles, elements, and timeline events
 */

import { useMemo, useState, useCallback } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import { normalizeTier, getTierBadgeVariant } from '@/lib/utils/tierUtils';
import type { Character, Element, Puzzle, TimelineEvent } from '@/types/notion/app';

export type NodeType = 'character' | 'puzzle' | 'element' | 'timeline';
export type Entity = Character | Element | Puzzle | TimelineEvent;

interface NodeSelectorProps {
  nodeType: NodeType;
  entities: Entity[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  placeholder?: string;
  className?: string;
  showSearch?: boolean;
}

export function NodeSelector({
  nodeType,
  entities,
  selectedId,
  onSelect,
  placeholder = 'Select an entity...',
  className = '',
  showSearch = true
}: NodeSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Helper to get entity display name
  const getEntityName = useCallback((entity: Entity): string => {
    switch (nodeType) {
      case 'character':
        return (entity as Character).name;
      case 'puzzle':
        return (entity as Puzzle).name;
      case 'element':
        return (entity as Element).name;
      case 'timeline':
        const timelineEvent = entity as TimelineEvent;
        return timelineEvent.name || `Event on ${timelineEvent.date}`;
      default:
        return entity.id;
    }
  }, [nodeType]);
  
  // Helper to get entity metadata for display
  const getEntityMetadata = useCallback((entity: Entity): React.ReactNode => {
    switch (nodeType) {
      case 'character':
        const character = entity as Character;
        return (
          <>
            {character.tier && (
              <Badge variant={getTierBadgeVariant(character.tier)} className="text-xs">
                {normalizeTier(character.tier)}
              </Badge>
            )}
            {character.type && (
              <Badge variant="outline" className="text-xs">
                {character.type}
              </Badge>
            )}
          </>
        );
      case 'puzzle':
        const puzzle = entity as Puzzle;
        return (
          <>
            {puzzle.timing && puzzle.timing.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {puzzle.timing[0]}
              </Badge>
            )}
          </>
        );
      case 'element':
        const element = entity as Element;
        return (
          <>
            {element.status && (
              <Badge variant="outline" className="text-xs">
                {element.status}
              </Badge>
            )}
          </>
        );
      case 'timeline':
        const timelineEvent = entity as TimelineEvent;
        return (
          <Badge variant="secondary" className="text-xs">
            {timelineEvent.date}
          </Badge>
        );
      default:
        return null;
    }
  }, [nodeType]);
  
  // Filter entities based on search term
  const filteredEntities = useMemo(() => {
    if (!searchTerm) return entities;
    
    const term = searchTerm.toLowerCase();
    return entities.filter(entity => {
      const name = getEntityName(entity).toLowerCase();
      return name.includes(term);
    });
  }, [entities, searchTerm, getEntityName]);
  
  // Sort entities for better UX
  const sortedEntities = useMemo(() => {
    return [...filteredEntities].sort((a, b) => {
      const nameA = getEntityName(a);
      const nameB = getEntityName(b);
      
      // Special sorting for characters by tier
      if (nodeType === 'character') {
        const charA = a as Character;
        const charB = b as Character;
        const tierOrder = { 'Core': 0, 'Secondary': 1, 'Tertiary': 2 };
        const tierA = tierOrder[charA.tier as keyof typeof tierOrder] ?? 3;
        const tierB = tierOrder[charB.tier as keyof typeof tierOrder] ?? 3;
        if (tierA !== tierB) return tierA - tierB;
      }
      
      // Special sorting for puzzles by timing
      if (nodeType === 'puzzle') {
        const puzzleA = a as Puzzle;
        const puzzleB = b as Puzzle;
        const timingA = puzzleA.timing?.[0] || '';
        const timingB = puzzleB.timing?.[0] || '';
        if (timingA && timingB && timingA !== timingB) {
          return timingA.localeCompare(timingB);
        }
      }
      
      // Alphabetical by name
      return nameA.localeCompare(nameB);
    });
  }, [filteredEntities, nodeType, getEntityName]);
  
  const selectedEntity = useMemo(() => {
    return entities.find(e => e.id === selectedId);
  }, [entities, selectedId]);
  
  return (
    <div className={`space-y-2 ${className}`}>
      {showSearch && entities.length > 10 && (
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={`Search ${nodeType}s...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      )}
      
      <Select value={selectedId || ''} onValueChange={onSelect}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder}>
            {selectedEntity && (
              <div className="flex items-center gap-2">
                <span>{getEntityName(selectedEntity)}</span>
                {getEntityMetadata(selectedEntity)}
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {sortedEntities.length === 0 ? (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">
              No {nodeType}s found
            </div>
          ) : (
            sortedEntities.map((entity) => (
              <SelectItem key={entity.id} value={entity.id}>
                <div className="flex items-center gap-2">
                  <span>{getEntityName(entity)}</span>
                  {getEntityMetadata(entity)}
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
}