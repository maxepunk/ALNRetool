/**
 * ComponentRegistry
 * 
 * Registry system for pluggable UI control components used by ViewComponentFactory.
 * Maps control types to React components with proper typing.
 */

import type { 
  ComponentRegistry,
  EntitySelectorProps, 
  DepthSelectorProps, 
  FilterCheckboxProps, 
  BadgeDisplayProps 
} from './types';

// Import UI components
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

/**
 * EntitySelector Component
 * Allows selection of entities (characters, puzzles, elements, timeline)
 */
function EntitySelector({ 
  id, 
  label, 
  value, 
  onChange, 
  placeholder, 
  disabled,
  entities,
  entityType 
}: EntitySelectorProps) {
  const handleValueChange = (selectedValue: string) => {
    if (selectedValue === 'empty') {
      onChange(undefined);
      return;
    }
    onChange(selectedValue);
  };

  // Special case: selecting entity type itself
  if (entityType === undefined) {
    const typeOptions = [
      { value: 'character', label: 'Characters' },
      { value: 'element', label: 'Elements' }, 
      { value: 'puzzle', label: 'Puzzles' },
      { value: 'timeline', label: 'Timeline Events' }
    ];

    return (
      <div className="space-y-2">
        <Label htmlFor={id} className="text-sm font-medium">{label}</Label>
        <Select 
          value={value as string || ''} 
          onValueChange={handleValueChange}
          disabled={disabled}
        >
          <SelectTrigger id={id}>
            <SelectValue placeholder={placeholder || 'Select type...'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="empty">Select type...</SelectItem>
            {typeOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  // Regular entity selection
  const getEntityLabel = (entity: any) => {
    if ('name' in entity) return entity.name;
    if ('title' in entity) return entity.title;
    if ('descriptionText' in entity) return entity.descriptionText?.substring(0, 50) + '...';
    return 'Unknown Entity';
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium">{label}</Label>
      <Select 
        value={value as string || ''} 
        onValueChange={handleValueChange}
        disabled={disabled}
      >
        <SelectTrigger id={id}>
          <SelectValue placeholder={placeholder || 'Select entity...'} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="empty">{placeholder || 'Select entity...'}</SelectItem>
          {entities.map(entity => (
            <SelectItem key={entity.id} value={entity.id}>
              {getEntityLabel(entity)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * DepthSelector Component  
 * Range input for selecting traversal depth
 */
function DepthSelector({
  id,
  label,
  value,
  onChange,
  disabled,
  min = 1,
  max = 5,
  step = 1
}: DepthSelectorProps) {
  const currentValue = Number(value) || min;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(event.target.value));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-sm font-medium">{label}</Label>
        <span className="text-sm text-muted-foreground">
          Depth: {currentValue}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={currentValue}
        onChange={handleChange}
        disabled={disabled}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

/**
 * FilterCheckbox Component
 * Checkbox for enabling/disabling filters
 */
function FilterCheckbox({
  id,
  label,
  checked,
  onCheckedChange,
  disabled
}: FilterCheckboxProps) {
  return (
    <div className="flex items-center space-x-2">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
      <Label htmlFor={id} className="text-sm font-medium cursor-pointer">
        {label}
      </Label>
    </div>
  );
}

/**
 * BadgeDisplay Component
 * Displays status information as styled badges
 */
function BadgeDisplay({
  id,
  content,
  variant = 'default'
}: BadgeDisplayProps) {
  return (
    <Badge id={id} variant={variant} className="text-xs">
      {content}
    </Badge>
  );
}

/**
 * ToggleSwitch Component
 * Toggle switch for binary options
 */
function ToggleSwitch({
  id,
  label,
  checked,
  onCheckedChange,
  disabled
}: FilterCheckboxProps) {
  return (
    <div className="flex items-center space-x-2">
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
      <Label htmlFor={id} className="text-sm font-medium cursor-pointer">
        {label}
      </Label>
    </div>
  );
}

/**
 * Component Registry - Maps control types to components
 */
export const componentRegistry: ComponentRegistry = {
  'entity-selector': EntitySelector,
  'depth-selector': DepthSelector,
  'filter-checkbox': FilterCheckbox,
  'badge-display': BadgeDisplay,
  'toggle-switch': ToggleSwitch
};

/**
 * Get component from registry with proper typing
 */
export function getRegisteredComponent(type: keyof ComponentRegistry) {
  const Component = componentRegistry[type];
  if (!Component) {
    console.warn(`Component type "${type}" not found in registry`);
    return null;
  }
  return Component;
}

/**
 * Render control component based on configuration
 */
export function renderControl(
  controlConfig: any, 
  viewState: Record<string, unknown>,
  updateViewState: (updates: Record<string, unknown>) => void,
  entities: any[] = []
) {
  const Component = getRegisteredComponent(controlConfig.type);
  if (!Component) return null;

  const value = viewState[controlConfig.statePath];
  const handleChange = (newValue: unknown) => {
    updateViewState({ [controlConfig.statePath]: newValue });
  };

  switch (controlConfig.type) {
    case 'entity-selector':
      return (
        <EntitySelector
          id={controlConfig.id}
          label={controlConfig.label}
          value={value}
          onChange={handleChange}
          placeholder={controlConfig.placeholder}
          disabled={false}
          entities={entities}
          entityType={controlConfig.options?.entityType}
        />
      );

    case 'depth-selector':
      return (
        <DepthSelector
          id={controlConfig.id}
          label={controlConfig.label}
          value={value}
          onChange={handleChange}
          placeholder={controlConfig.placeholder}
          disabled={false}
          min={controlConfig.options?.min || 1}
          max={controlConfig.options?.max || 5}
          step={controlConfig.options?.step || 1}
        />
      );

    case 'filter-checkbox':
      return (
        <FilterCheckbox
          id={controlConfig.id}
          label={controlConfig.label}
          value={value}
          onChange={handleChange}
          placeholder={controlConfig.placeholder}
          disabled={false}
          checked={Boolean(value)}
          onCheckedChange={handleChange}
        />
      );

    case 'toggle-switch':
      return (
        <ToggleSwitch
          id={controlConfig.id}
          label={controlConfig.label}
          value={value}
          onChange={handleChange}
          placeholder={controlConfig.placeholder}
          disabled={false}
          checked={Boolean(value)}
          onCheckedChange={handleChange}
        />
      );

    case 'badge-display':
      const badgeContent = getBadgeContent(value, controlConfig);
      if (!badgeContent) return null;
      
      return (
        <BadgeDisplay
          id={controlConfig.id}
          content={badgeContent}
          variant={controlConfig.options?.variant || 'default'}
        />
      );

    default:
      return null;
  }
}

/**
 * Helper to generate badge content from view state
 */
function getBadgeContent(value: unknown, controlConfig: any): string | null {
  if (!value) return null;

  // Handle depth metadata for connection status
  if (controlConfig.statePath === 'depthMetadata' && value && typeof value === 'object') {
    const metadata = value as any;
    if (metadata.isCompleteNetwork) {
      return `Complete Network (${metadata.totalReachableNodes} nodes)`;
    } else {
      return `Partial Network (${metadata.nodesAtCurrentDepth}/${metadata.totalReachableNodes} nodes)`;
    }
  }

  // Generic string conversion
  return String(value);
}