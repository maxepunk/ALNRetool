import { useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAllCharacters } from '@/hooks/useCharacters';
import { normalizeTier, getTierBadgeVariant } from '@/lib/utils/tierUtils';
import { useFilterStore } from '@/stores/filterStore';
import type { Character } from '@/types/notion/app';

interface CharacterSelectorProps {
  className?: string;
}

export function CharacterSelector({ className }: CharacterSelectorProps) {
  const navigate = useNavigate();
  const { characterId } = useParams<{ characterId?: string }>();
  const { data: characters, isLoading } = useAllCharacters();
  
  // Get character selection from filter store
  const selectedCharacterId = useFilterStore(state => state.characterFilters.selectedCharacterId);
  const selectCharacter = useFilterStore(state => state.selectCharacter);

  // Group characters by tier using normalized tiers
  const charactersByTier = useMemo(() => {
    if (!characters) return { core: [], secondary: [], tertiary: [] };

    return characters.reduce(
      (acc, character) => {
        const tier = normalizeTier(character.tier);
        if (tier === 'Core') {
          acc.core.push(character);
        } else if (tier === 'Secondary') {
          acc.secondary.push(character);
        } else {
          acc.tertiary.push(character);
        }
        return acc;
      },
      { core: [] as Character[], secondary: [] as Character[], tertiary: [] as Character[] }
    );
  }, [characters]);

  // Sync URL params with store on mount and when URL changes
  useEffect(() => {
    if (characterId && characterId !== selectedCharacterId) {
      selectCharacter(characterId);
    }
  }, [characterId, selectedCharacterId, selectCharacter]);
  
  // Bidirectional sync: Update both store and URL
  const handleCharacterChange = (newCharacterId: string) => {
    if (newCharacterId) {
      // Update store first
      selectCharacter(newCharacterId);
      // Then navigate to update URL
      navigate(`/character-journey/${newCharacterId}`);
    }
  };

  // Use store value as source of truth, fallback to URL param
  const activeCharacterId = selectedCharacterId || characterId;
  const selectedCharacter = characters?.find(c => c.id === activeCharacterId);

  if (isLoading) {
    return (
      <div className={className}>
        <Select disabled>
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Loading characters..." />
          </SelectTrigger>
        </Select>
      </div>
    );
  }

  return (
    <div className={className}>
      <Select value={activeCharacterId || ''} onValueChange={handleCharacterChange}>
        <SelectTrigger className="w-[280px]">
          <SelectValue placeholder="Select a character to explore">
            {selectedCharacter && (
              <div className="flex items-center gap-2">
                <span>{selectedCharacter.name}</span>
                <Badge variant={getTierBadgeVariant(selectedCharacter.tier)}>
                  {normalizeTier(selectedCharacter.tier)}
                </Badge>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {charactersByTier.core.length > 0 && (
            <SelectGroup>
              <SelectLabel>Core Characters</SelectLabel>
              {charactersByTier.core.map((character) => (
                <SelectItem key={character.id} value={character.id}>
                  <div className="flex items-center gap-2">
                    <span>{character.name}</span>
                    <Badge variant="default">Core</Badge>
                    {character.type && (
                      <span className="text-xs text-muted-foreground">
                        ({character.type})
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          )}
          
          {charactersByTier.secondary.length > 0 && (
            <SelectGroup>
              <SelectLabel>Secondary Characters</SelectLabel>
              {charactersByTier.secondary.map((character) => (
                <SelectItem key={character.id} value={character.id}>
                  <div className="flex items-center gap-2">
                    <span>{character.name}</span>
                    <Badge variant="secondary">Secondary</Badge>
                    {character.type && (
                      <span className="text-xs text-muted-foreground">
                        ({character.type})
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          )}
          
          {charactersByTier.tertiary.length > 0 && (
            <SelectGroup>
              <SelectLabel>Tertiary Characters</SelectLabel>
              {charactersByTier.tertiary.map((character) => (
                <SelectItem key={character.id} value={character.id}>
                  <div className="flex items-center gap-2">
                    <span>{character.name}</span>
                    <Badge variant="outline">Tertiary</Badge>
                    {character.type && (
                      <span className="text-xs text-muted-foreground">
                        ({character.type})
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}