/**
 * NodeConnectionsFilters Component
 * Filter controls for the Node Connections view
 */

import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Network, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NodeSelector } from '@/components/NodeSelector';
import { useFilterStore } from '@/stores/filterStore';
import { useCharacters } from '@/hooks/useCharacters';
import { usePuzzles } from '@/hooks/usePuzzles';
import { useElements } from '@/hooks/useElements';
import { useTimeline } from '@/hooks/useTimeline';
import type { NodeType } from '@/components/NodeSelector';

interface NodeConnectionsFiltersProps {
  isOpen: boolean;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

export function NodeConnectionsFilters({
  isOpen,
  isExpanded,
  onToggleExpanded
}: NodeConnectionsFiltersProps) {
  const navigate = useNavigate();
  
  // Get data hooks
  const { data: characters } = useCharacters();
  const { data: puzzles } = usePuzzles();
  const { data: elements } = useElements();
  const { data: timeline } = useTimeline();
  
  // Get filter state and actions from store
  const nodeConnectionsFilters = useFilterStore(state => state.nodeConnectionsFilters);
  const setNodeType = useFilterStore(state => state.setNodeType);
  const setSelectedNodeId = useFilterStore(state => state.setSelectedNodeId);
  const clearNodeConnectionsFilters = useFilterStore(state => state.clearNodeConnectionsFilters);
  
  // Handle node type change
  const handleNodeTypeChange = useCallback((type: NodeType) => {
    setNodeType(type);
    setSelectedNodeId(null); // Clear selection when changing type
    navigate(`/node-connections/${type}`);
  }, [setNodeType, setSelectedNodeId, navigate]);
  
  // Handle entity selection
  const handleEntitySelect = useCallback((entityId: string) => {
    setSelectedNodeId(entityId);
    if (nodeConnectionsFilters?.nodeType) {
      navigate(`/node-connections/${nodeConnectionsFilters.nodeType}/${entityId}`);
    }
  }, [setSelectedNodeId, nodeConnectionsFilters, navigate]);
  
  // Get entities based on selected type
  const getEntities = useCallback(() => {
    switch (nodeConnectionsFilters?.nodeType) {
      case 'character':
        return characters || [];
      case 'puzzle':
        return puzzles || [];
      case 'element':
        return elements || [];
      case 'timeline':
        return timeline || [];
      default:
        return [];
    }
  }, [nodeConnectionsFilters?.nodeType, characters, puzzles, elements, timeline]);
  
  // Count active filters
  const activeFilterCount = nodeConnectionsFilters?.selectedNodeId ? 1 : 0;
  
  return (
    <Card className={cn(
      "border-0 shadow-none bg-transparent",
      !isOpen && "px-0"
    )}>
      <Collapsible open={isExpanded} onOpenChange={onToggleExpanded}>
        <CollapsibleTrigger className={cn(
          "flex items-center justify-between w-full py-2 hover:bg-accent rounded-lg px-2 transition-colors",
          !isOpen && "justify-center px-0"
        )}>
          <div className="flex items-center gap-2">
            <Network className="h-4 w-4" />
            {isOpen && (
              <>
                <span className="font-medium">Node Connections</span>
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {activeFilterCount}
                  </Badge>
                )}
              </>
            )}
          </div>
          {isOpen && (
            isExpanded ? 
            <ChevronDown className="h-4 w-4" /> : 
            <ChevronRight className="h-4 w-4" />
          )}
        </CollapsibleTrigger>
        
        {isOpen && (
          <CollapsibleContent className="space-y-3 pt-3">
            {/* Node Type Selector */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Node Type</Label>
              <Select 
                value={nodeConnectionsFilters?.nodeType || 'character'} 
                onValueChange={handleNodeTypeChange}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="character">Character</SelectItem>
                  <SelectItem value="puzzle">Puzzle</SelectItem>
                  <SelectItem value="element">Element</SelectItem>
                  <SelectItem value="timeline">Timeline</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Entity Selector */}
            {nodeConnectionsFilters?.nodeType && (
              <div className="space-y-2">
                <Label className="text-xs font-medium">Select Entity</Label>
                <NodeSelector
                  nodeType={nodeConnectionsFilters.nodeType}
                  entities={getEntities()}
                  selectedId={nodeConnectionsFilters.selectedNodeId}
                  onSelect={handleEntitySelect}
                  placeholder={`Select a ${nodeConnectionsFilters.nodeType}...`}
                  showSearch={getEntities().length > 10}
                />
              </div>
            )}
            
            {/* Help Text */}
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Select an entity to explore its connections</p>
              <p>• Use depth control to expand the network</p>
              <p>• Click nodes to view details</p>
            </div>
            
            {/* Clear Filters */}
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearNodeConnectionsFilters}
                className="w-full justify-start h-8"
              >
                <X className="h-3 w-3 mr-2" />
                Clear filters
              </Button>
            )}
          </CollapsibleContent>
        )}
      </Collapsible>
    </Card>
  );
}