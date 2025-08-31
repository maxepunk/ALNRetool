import { useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAllEntityData } from '@/hooks/generic/useEntityData';
import { charactersApi } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';
import { normalizeTier, getTierBadgeVariant } from '@/lib/utils/tierUtils';
import { useFilterStore } from '@/stores/filterStore';
import type { Character } from '@/types/notion/app';

interface CharacterSelectorProps {
  className?: string;
}

export function CharacterSelector({ className }: CharacterSelectorProps) {
  const navigate = useNavigate();
  const { characterId } = useParams<{ characterId?: string }>();
  const { data: characters, isLoading } = useAllEntityData(charactersApi, queryKeys.characters());
  
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
        <Select disabled className="w-[280px]">
          <option value="">Loading characters...</option>
        </Select>
      </div>
    );
  }

  return (
    <div className={className}>
      {selectedCharacter && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium">{selectedCharacter.name}</span>
          <Badge variant={getTierBadgeVariant(selectedCharacter.tier)}>
            {normalizeTier(selectedCharacter.tier)}
          </Badge>
        </div>
      )}
      <Select 
        value={activeCharacterId || ''} 
        onValueChange={handleCharacterChange}
        className="w-[280px]"
      >
        {!activeCharacterId && (
          <option value="" disabled>
            Select a character to explore
          </option>
        )}
        {charactersByTier.core.length > 0 && (
          <optgroup label="Core Characters">
            {charactersByTier.core.map((character) => (
              <option key={character.id} value={character.id}>
                {character.name} {character.type && `(${character.type})`}
              </option>
            ))}
          </optgroup>
        )}
        
        {charactersByTier.secondary.length > 0 && (
          <optgroup label="Secondary Characters">
            {charactersByTier.secondary.map((character) => (
              <option key={character.id} value={character.id}>
                {character.name} {character.type && `(${character.type})`}
              </option>
            ))}
          </optgroup>
        )}
        
        {charactersByTier.tertiary.length > 0 && (
          <optgroup label="Tertiary Characters">
            {charactersByTier.tertiary.map((character) => (
              <option key={character.id} value={character.id}>
                {character.name} {character.type && `(${character.type})`}
              </option>
            ))}
          </optgroup>
        )}
      </Select>
    </div>
  );
}