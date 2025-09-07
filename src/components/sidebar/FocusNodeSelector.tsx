/**
 * FocusNodeSelector Component
 * Searchable dropdown for selecting a focus node (character, puzzle, element, or timeline)
 */

import { useState, useMemo } from 'react';
import { useFilterStore } from '@/stores/filterStore';
import { useQuery } from '@tanstack/react-query';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown, X, Users, Puzzle as PuzzleIcon, Package, Clock, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { graphApi } from '@/services/graphApi';

interface FocusNodeSelectorProps {
  label?: string;
  placeholder?: string;
  entityType?: 'character' | 'puzzle' | 'element' | 'timeline' | 'all';
}

const entityIcons = {
  character: Users,
  puzzle: PuzzleIcon,
  element: Package,
  timeline: Clock,
};

export function FocusNodeSelector({ 
  label = "Focus Node",
  placeholder = "Select entity to focus on...",
  entityType = 'all' 
}: FocusNodeSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const selectedNodeId = useFilterStore(state => state.selectedNodeId);
  const setSelectedNode = useFilterStore(state => state.setSelectedNode);
  
  // Fetch all entities for selection
  const { data: graphData } = useQuery({
    queryKey: ['graph', 'full'],
    queryFn: () => graphApi.getComplete(true),
    staleTime: 5 * 60 * 1000,
  });
  
  interface EntityOption {
    id: string;
    name: string;
    type: 'character' | 'puzzle' | 'element' | 'timeline';
    tier?: string;
    acts?: string[];
    basicType?: string;
    date?: string;
  }
  
  // Filter and prepare entities for display
  const entities = useMemo((): EntityOption[] => {
    if (!graphData?.nodes) return [];
    
    const allEntities: EntityOption[] = [];
    
    // Extract entities from graph nodes
    graphData.nodes.forEach(node => {
      const entity = node.data?.entity;
      if (!entity) return;
      
      const nodeType = node.data.metadata?.entityType;
      
      if (entityType === 'all' || entityType === nodeType) {
        switch (nodeType) {
          case 'character':
            allEntities.push({
              id: entity.id,
              name: entity.name || 'Unnamed Character',
              type: 'character',
              tier: entity.tier
            });
            break;
          case 'puzzle':
            allEntities.push({
              id: entity.id,
              name: entity.name || 'Unnamed Puzzle',
              type: 'puzzle',
              acts: entity.timing
            });
            break;
          case 'element':
            allEntities.push({
              id: entity.id,
              name: entity.name || 'Unnamed Element',
              type: 'element',
              basicType: entity.basicType
            });
            break;
          case 'timeline':
            allEntities.push({
              id: entity.id,
              name: entity.name || entity.description || 'Unnamed Event',
              type: 'timeline',
              date: entity.date
            });
            break;
        }
      }
    });
    
    return allEntities;
  }, [graphData, entityType]);
  
  // Filter entities based on search
  const filteredEntities = useMemo(() => {
    if (!search) return entities;
    const searchLower = search.toLowerCase();
    return entities.filter(entity => 
      entity.name.toLowerCase().includes(searchLower)
    );
  }, [entities, search]);
  
  // Find selected entity
  const selectedEntity = entities.find(e => e.id === selectedNodeId);
  
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            {selectedEntity ? (
              <div className="flex items-center gap-2 truncate">
                {(() => {
                  const Icon = entityIcons[selectedEntity.type];
                  return <Icon className="h-4 w-4 shrink-0" />;
                })()}
                <span className="truncate">{selectedEntity.name}</span>
              </div>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <div className="flex items-center gap-1 ml-2 shrink-0">
              {selectedNodeId && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNode(null);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
              <ChevronsUpDown className="h-4 w-4 opacity-50" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0" align="start">
          <div className="flex flex-col">
            {/* Search Input */}
            <div className="flex items-center border-b px-3 py-2">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <Input
                placeholder="Search entities..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            
            {/* Results List */}
            <div className="max-h-[300px] overflow-y-auto">
              {filteredEntities.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No entity found.
                </div>
              ) : (
                <>
                  {entityType === 'all' ? (
                    // Grouped by type
                    ['character', 'puzzle', 'element', 'timeline'].map(type => {
                      const typeEntities = filteredEntities.filter(e => e.type === type);
                      if (typeEntities.length === 0) return null;
                      
                      const Icon = entityIcons[type as keyof typeof entityIcons];
                      return (
                        <div key={type}>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                            {type.charAt(0).toUpperCase() + type.slice(1)}s
                          </div>
                          {typeEntities.map(entity => (
                            <Button
                              key={entity.id}
                              variant="ghost"
                              justify="start"
                              className={cn(
                                "w-full",
                                selectedNodeId === entity.id && "bg-accent"
                              )}
                              onClick={() => {
                                setSelectedNode(entity.id === selectedNodeId ? null : entity.id);
                                setOpen(false);
                                setSearch('');
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedNodeId === entity.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <Icon className="mr-2 h-4 w-4" />
                              <span className="truncate">{entity.name}</span>
                            </Button>
                          ))}
                        </div>
                      );
                    })
                  ) : (
                    // Flat list for single type
                    filteredEntities.map(entity => {
                      const Icon = entityIcons[entity.type];
                      return (
                        <Button
                          key={entity.id}
                          variant="ghost"
                          justify="start"
                          className={cn(
                            "w-full",
                            selectedNodeId === entity.id && "bg-accent"
                          )}
                          onClick={() => {
                            setSelectedNode(entity.id === selectedNodeId ? null : entity.id);
                            setOpen(false);
                            setSearch('');
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedNodeId === entity.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <Icon className="mr-2 h-4 w-4" />
                          <span className="truncate">{entity.name}</span>
                        </Button>
                      );
                    })
                  )}
                </>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}