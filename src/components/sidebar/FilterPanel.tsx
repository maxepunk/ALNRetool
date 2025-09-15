/**
 * Consolidated filter panel component
 * Combines all filter types into a single, configurable component
 */

import { useFilterStore } from '@/stores/filterStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
// Radio group removed - using checkboxes for all filters
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FilterConfig {
  type: 'checkbox' | 'radio' | 'slider' | 'multiselect';
  label: string;
  options?: Array<{ value: string; label: string }>;
  min?: number;
  max?: number;
  step?: number;
  layout?: 'vertical' | 'horizontal' | 'grid'; // Layout option for compact display
}

interface FilterPanelProps {
  title: string;
  filters: Record<string, FilterConfig>;
  entityType?: 'character' | 'puzzle' | 'element' | 'timeline';
}

export function FilterPanel({ title, filters, entityType }: FilterPanelProps) {
  const store = useFilterStore();
  const entityVisibility = useFilterStore(state => state.entityVisibility);
  
  // Check if this entity type is hidden
  const isDisabled = entityType && !entityVisibility[entityType];
  
  const renderFilter = (key: string, config: FilterConfig) => {
    switch (config.type) {
      case 'checkbox':
        // Handle single boolean checkbox (like highlightShared)
        if (config.options?.length === 1 && config.options[0]?.value === 'true') {
          return (
            <div key={key} className="flex items-center space-x-2">
              <Checkbox
                id={key}
                checked={store.getFilter(key) === true}
                onCheckedChange={(checked) => {
                  store.setFilter(key, checked);
                }}
              />
              <Label htmlFor={key}>{config.options[0]?.label || config.label}</Label>
            </div>
          );
        }
        // Handle multi-checkbox with layout options
        const containerClass = config.layout === 'horizontal' 
          ? "flex flex-wrap gap-3"
          : config.layout === 'grid'
          ? "grid grid-cols-2 gap-2"
          : "space-y-2";
          
        return (
          <div key={key} className="space-y-2">
            <Label>{config.label}</Label>
            <div className={containerClass}>
              {config.options?.map(option => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${key}-${option.value}`}
                    checked={store.getFilter(key)?.includes(option.value)}
                    onCheckedChange={(checked) => {
                      const current = store.getFilter(key) || [];
                      if (checked) {
                        store.setFilter(key, [...current, option.value]);
                      } else {
                        store.setFilter(key, current.filter((v: string) => v !== option.value));
                      }
                    }}
                  />
                  <Label htmlFor={`${key}-${option.value}`} className="text-xs">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 'radio':
        // Use checkboxes with single selection behavior for radio
        const currentValue = store.getFilter(key);
        return (
          <div key={key} className="space-y-2">
            <Label>{config.label}</Label>
            {config.options?.map(option => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`${key}-${option.value}`}
                  checked={currentValue === option.value}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      store.setFilter(key, option.value);
                    } else {
                      store.setFilter(key, null);
                    }
                  }}
                />
                <Label htmlFor={`${key}-${option.value}`}>{option.label}</Label>
              </div>
            ))}
          </div>
        );
      
      case 'slider':
        // Use input with type=range for slider functionality
        return (
          <div key={key} className="space-y-2">
            <div className="flex justify-between">
              <Label>{config.label}</Label>
              <span className="text-sm text-muted-foreground">
                {store.getFilter(key) || config.min || 0}
              </span>
            </div>
            <input
              type="range"
              value={store.getFilter(key) || config.min || 0}
              onChange={(e) => store.setFilter(key, Number(e.target.value))}
              min={config.min}
              max={config.max}
              step={config.step}
              className="w-full"
            />
          </div>
        );
      
      case 'multiselect':
        const selected = store.getFilter(key) || [];
        return (
          <div key={key} className="space-y-2">
            <Label>{config.label}</Label>
            <div className="flex flex-wrap gap-1">
              {(Array.isArray(selected) ? selected : []).map((value: string) => (
                <Badge key={value} variant="secondary" className="pr-1">
                  {value}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-1"
                    onClick={() => {
                      const currentArray = Array.isArray(selected) ? selected : [];
                      store.setFilter(key, currentArray.filter((v: string) => v !== value));
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
            <div className="space-y-1">
              {config.options?.map(option => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${key}-${option.value}`}
                    checked={Array.isArray(selected) && selected.includes(option.value)}
                    onCheckedChange={(checked) => {
                      const currentArray = Array.isArray(selected) ? selected : [];
                      if (checked) {
                        store.setFilter(key, [...currentArray, option.value]);
                      } else {
                        store.setFilter(key, currentArray.filter((v: string) => v !== option.value));
                      }
                    }}
                  />
                  <Label htmlFor={`${key}-${option.value}`}>{option.label}</Label>
                </div>
              ))}
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };
  
  return (
    <Card className={isDisabled ? 'opacity-50' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {title}
          {isDisabled && (
            <Badge variant="secondary" className="text-xs">
              Hidden
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className={`space-y-4 ${isDisabled ? 'pointer-events-none' : ''}`}>
        {Object.entries(filters).map(([key, config]) => renderFilter(key, config))}
      </CardContent>
    </Card>
  );
}

// Export pre-configured filter panels for common use cases
export const CharacterFilterPanel = () => (
  <FilterPanel
    title="Character Filters"
    entityType="character"
    filters={{
      characterTypes: {
        type: 'radio',
        label: 'Character Type',
        options: [
          { value: 'all', label: 'All' },
          { value: 'Player', label: 'Players' },
          { value: 'NPC', label: 'NPCs' }
        ]
      },
      tiers: {
        type: 'multiselect',
        label: 'Tiers',
        layout: 'horizontal', // Compact horizontal layout
        options: [
          { value: 'Core', label: 'Core' },
          { value: 'Secondary', label: 'Secondary' },
          { value: 'Tertiary', label: 'Tertiary' }
        ]
      },
      ownershipStatus: {
        type: 'multiselect',
        label: 'Ownership Status',
        layout: 'grid', // 2x2 grid layout
        options: [
          { value: 'Owned', label: 'Owned' },
          { value: 'Accessible', label: 'Accessible' },
          { value: 'Shared', label: 'Shared' },
          { value: 'Locked', label: 'Locked' }
        ]
      },
      highlightShared: {
        type: 'checkbox',
        label: 'Highlight Shared',
        options: [
          { value: 'true', label: 'Highlight Shared Elements' }
        ]
      }
    }}
  />
);

export const PuzzleFilterPanel = () => (
  <FilterPanel
    title="Puzzle Filters"
    entityType="puzzle"
    filters={{
      acts: {
        type: 'multiselect',
        label: 'Acts',
        layout: 'horizontal', // Compact horizontal layout
        options: [
          { value: 'Act 0', label: 'Act 0' },
          { value: 'Act 1', label: 'Act 1' },
          { value: 'Act 2', label: 'Act 2' }
        ]
      },
      completionStatus: {
        type: 'radio',
        label: 'Completion Status',
        options: [
          { value: 'all', label: 'All' },
          { value: 'completed', label: 'Completed' },
          { value: 'incomplete', label: 'Incomplete' }
        ]
      }
    }}
  />
);

export const ElementFilterPanel = () => (
  <FilterPanel
    title="Element Filters"
    entityType="element"
    filters={{
      basicTypes: {
        type: 'multiselect',
        label: 'Element Types',
        options: [
          { value: 'Set Dressing', label: 'Set Dressing' },
          { value: 'Prop', label: 'Prop' },
          { value: 'Memory Token Audio', label: 'Memory Token (Audio)' },
          { value: 'Memory Token Video', label: 'Memory Token (Video)' },
          { value: 'Memory Token Image', label: 'Memory Token (Image)' },
          { value: 'Memory Token Audio + Image', label: 'Memory Token (Audio+Image)' },
          { value: 'Document', label: 'Document' }
        ]
      },
      status: {
        type: 'multiselect',
        label: 'Production Status',
        options: [
          { value: 'Idea/Placeholder', label: 'Idea/Placeholder' },
          { value: 'in space playtest ready', label: 'In Space Playtest Ready' },
          { value: 'In development', label: 'In Development' },
          { value: 'Writing Complete', label: 'Writing Complete' },
          { value: 'Design Complete', label: 'Design Complete' },
          { value: 'Source Prop/print', label: 'Source Prop/Print' },
          { value: 'Ready for Playtest', label: 'Ready for Playtest' },
          { value: 'Done', label: 'Done' }
        ]
      },
      contentStatus: {
        type: 'multiselect',
        label: 'Content Status',
        layout: 'grid', // 2x2 grid layout
        options: [
          { value: 'draft', label: 'Draft' },
          { value: 'review', label: 'Review' },
          { value: 'approved', label: 'Approved' },
          { value: 'published', label: 'Published' }
        ]
      },
      hasIssues: {
        type: 'radio',
        label: 'Has Issues',
        options: [
          { value: 'all', label: 'All' },
          { value: 'true', label: 'Yes' },
          { value: 'false', label: 'No' }
        ]
      },
      lastEditedRange: {
        type: 'radio',
        label: 'Last Edited',
        options: [
          { value: 'all', label: 'All' },
          { value: 'today', label: 'Today' },
          { value: 'week', label: 'This Week' },
          { value: 'month', label: 'This Month' }
        ]
      }
    }}
  />
);

export const DepthFilterPanel = () => (
  <FilterPanel
    title="Graph Depth"
    filters={{
      depth: {
        type: 'slider',
        label: 'Connection Depth',
        min: 1,
        max: 5,
        step: 1
      }
    }}
  />
);

export default FilterPanel;