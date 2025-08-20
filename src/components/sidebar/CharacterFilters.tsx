/**
 * CharacterFilters Component
 * Character-specific filter controls for the sidebar
 */

import { memo, useCallback } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronRight, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFilterStore } from '@/stores/filterStore';
import { useCharacters } from '@/hooks/useCharacters';

interface CharacterFiltersProps {
  isOpen: boolean;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}const tierOptions: Array<'Core' | 'Secondary' | 'Tertiary'> = ['Core', 'Secondary', 'Tertiary'];
const ownershipOptions: Array<'Owned' | 'Accessible' | 'Shared' | 'Locked'> = [
  'Owned', 'Accessible', 'Shared', 'Locked'
];

export const CharacterFilters = memo(function CharacterFilters({ 
  isOpen, 
  isExpanded, 
  onToggleExpanded 
}: CharacterFiltersProps) {
  const characterFilters = useFilterStore((state) => state.characterFilters);
  const toggleTier = useFilterStore((state) => state.toggleTier);
  const toggleOwnership = useFilterStore((state) => state.toggleOwnership);
  const setCharacterType = useFilterStore((state) => state.setCharacterType);
  const selectCharacter = useFilterStore((state) => state.selectCharacter);
  const clearCharacterFilters = useFilterStore((state) => state.clearCharacterFilters);
  
  const { data: characters, isLoading } = useCharacters();

  const handleTierToggle = useCallback((tier: 'Core' | 'Secondary' | 'Tertiary') => {
    toggleTier(tier);
  }, [toggleTier]);

  const handleOwnershipToggle = useCallback((status: 'Owned' | 'Accessible' | 'Shared' | 'Locked') => {
    toggleOwnership(status);
  }, [toggleOwnership]);

  const handleTypeChange = useCallback((value: string) => {
    setCharacterType(value as 'all' | 'Player' | 'NPC');
  }, [setCharacterType]);  const handleCharacterSelect = useCallback((value: string) => {
    selectCharacter(value === 'all' ? null : value);
  }, [selectCharacter]);

  const handleClearFilters = useCallback(() => {
    clearCharacterFilters();
  }, [clearCharacterFilters]);

  const activeFilterCount = 
    characterFilters.selectedTiers.size + 
    characterFilters.ownershipStatus.size + 
    (characterFilters.characterType !== 'all' ? 1 : 0) +
    (characterFilters.selectedCharacterId ? 1 : 0);

  if (!isOpen) {
    return (
      <Button
        size="icon"
        variant="ghost"
        className="w-full relative"
        title="Character filters"
        aria-label={`Character filters${activeFilterCount > 0 ? ` (${activeFilterCount} active)` : ''}`}
      >
        <Users className="h-4 w-4" />
        {activeFilterCount > 0 && (
          <Badge variant="secondary" className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs">
            {activeFilterCount}
          </Badge>
        )}
      </Button>
    );
  }  return (
    <Collapsible open={isExpanded} onOpenChange={onToggleExpanded}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between px-3 py-2 h-auto"
          aria-expanded={isExpanded}
          aria-controls="character-filters-content"
        >
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" aria-hidden="true" />
            <span className="font-medium">Character Filters</span>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </div>
          <ChevronRight 
            className={cn(
              "h-4 w-4 transition-transform",
              isExpanded && "transform rotate-90"
            )}
            aria-hidden="true"
          />
        </Button>
      </CollapsibleTrigger>      <CollapsibleContent id="character-filters-content" className="px-3 pb-3 space-y-3">
        {/* Tier Selection */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Character Tiers</Label>
          <div className="space-y-1">
            {tierOptions.map((tier) => (
              <div key={tier} className="flex items-center space-x-2">
                <Checkbox
                  id={`tier-${tier}`}
                  checked={characterFilters.selectedTiers.has(tier)}
                  onCheckedChange={() => handleTierToggle(tier)}
                  aria-label={`Filter by ${tier} tier`}
                />
                <Label
                  htmlFor={`tier-${tier}`}
                  className="text-sm cursor-pointer"
                >
                  {tier}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Ownership Status */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">
            Ownership Status
          </Label>
          <div className="space-y-1">            {ownershipOptions.map((status) => (
              <div key={status} className="flex items-center space-x-2">
                <Checkbox
                  id={`ownership-${status}`}
                  checked={characterFilters.ownershipStatus.has(status)}
                  onCheckedChange={() => handleOwnershipToggle(status)}
                  aria-label={`Filter by ${status} ownership`}
                />
                <Label
                  htmlFor={`ownership-${status}`}
                  className="text-sm cursor-pointer"
                >
                  {status}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Character Type */}
        <div className="space-y-2">
          <Label htmlFor="character-type" className="text-xs font-medium">
            Character Type
          </Label>
          <Select
            value={characterFilters.characterType}
            onValueChange={handleTypeChange}
          >            <SelectTrigger id="character-type" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All characters</SelectItem>
              <SelectItem value="Player">Players only</SelectItem>
              <SelectItem value="NPC">NPCs only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Character Selection */}
        <div className="space-y-2">
          <Label htmlFor="character-select" className="text-xs font-medium">
            Focus Character
          </Label>
          <Select
            value={characterFilters.selectedCharacterId || 'all'}
            onValueChange={handleCharacterSelect}
            disabled={isLoading}
          >
            <SelectTrigger id="character-select" className="w-full">
              <SelectValue placeholder={isLoading ? "Loading..." : "All characters"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All characters</SelectItem>              {characters?.map((character) => (
                <SelectItem key={character.id} value={character.id}>
                  {character.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Clear Filters */}
        {activeFilterCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearFilters}
            className="w-full"
          >
            Clear all character filters
          </Button>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
});