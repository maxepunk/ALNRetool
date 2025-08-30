import { memo } from 'react';
import { useFilterStore } from '@/stores/filterStore';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Puzzle, 
  Package, 
  Clock,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Entity Type Toggle Component
 * 
 * Provides checkboxes to show/hide entire entity types in the graph.
 * Works in conjunction with cross-entity filter awareness (Option 1).
 * 
 * Features:
 * - Individual toggles for each entity type
 * - Visual icons for each type
 * - Show All / Hide All quick actions
 * - Active count badges
 */
const EntityTypeToggle = memo(() => {
  const entityVisibility = useFilterStore(state => state.entityVisibility);
  const toggleEntityVisibility = useFilterStore(state => state.toggleEntityVisibility);
  const showAllEntities = useFilterStore(state => state.showAllEntities);
  const hideAllEntities = useFilterStore(state => state.hideAllEntities);
  
  // Count visible entity types
  const visibleCount = Object.values(entityVisibility).filter(v => v).length;
  const totalCount = Object.keys(entityVisibility).length;
  
  const entityConfig = [
    {
      key: 'character' as const,
      label: 'Characters',
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      key: 'puzzle' as const,
      label: 'Puzzles',
      icon: Puzzle,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200'
    },
    {
      key: 'element' as const,
      label: 'Elements',
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      key: 'timeline' as const,
      label: 'Timeline',
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    }
  ];
  
  return (
    <div className="space-y-3">
      {/* Header with count and quick actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Show Entity Types</span>
          <Badge variant="secondary" className="text-xs">
            {visibleCount}/{totalCount}
          </Badge>
        </div>
        <div className="flex gap-1">
          <button
            onClick={showAllEntities}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="Show all entity types"
          >
            <Eye className="h-4 w-4 text-gray-600" />
          </button>
          <button
            onClick={hideAllEntities}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="Hide all entity types"
          >
            <EyeOff className="h-4 w-4 text-gray-600" />
          </button>
        </div>
      </div>
      
      {/* Entity type toggles */}
      <div className="space-y-2">
        {entityConfig.map(({ key, label, icon: Icon, color, bgColor, borderColor }) => {
          const isVisible = entityVisibility[key];
          
          return (
            <div
              key={key}
              className={cn(
                "flex items-center justify-between p-2 rounded-lg border transition-all",
                isVisible ? cn(bgColor, borderColor) : "bg-gray-50 border-gray-200 opacity-60"
              )}
            >
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`entity-${key}`}
                  checked={isVisible}
                  onCheckedChange={() => toggleEntityVisibility(key)}
                  className="data-[state=checked]:bg-primary"
                />
                <Label 
                  htmlFor={`entity-${key}`}
                  className="flex items-center gap-2 cursor-pointer select-none"
                >
                  <Icon className={cn("h-4 w-4", isVisible ? color : "text-gray-400")} />
                  <span className={cn("text-sm", isVisible ? "font-medium" : "text-gray-500")}>
                    {label}
                  </span>
                </Label>
              </div>
              
              {/* Optional: Add count of filtered items for this type */}
              {isVisible && (
                <Badge 
                  variant="outline" 
                  className={cn("text-xs", borderColor, color)}
                >
                  {/* This would need to be connected to actual filtered counts */}
                  All
                </Badge>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Info text */}
      <div className="text-xs text-gray-500 italic">
        Hide entity types to focus on specific graph elements
      </div>
    </div>
  );
});

EntityTypeToggle.displayName = 'EntityTypeToggle';

export default EntityTypeToggle;