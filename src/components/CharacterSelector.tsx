import { useMemo } from 'react';
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
import type { Character } from '@/types/notion/app';

interface CharacterSelectorProps {
  className?: string;
}

export function CharacterSelector({ className }: CharacterSelectorProps) {
  const navigate = useNavigate();
  const { characterId } = useParams<{ characterId?: string }>();
  const { data: characters, isLoading } = useAllCharacters();

  // Group characters by tier
  const charactersByTier = useMemo(() => {
    if (!characters) return { core: [], secondary: [], tertiary: [] };

    return characters.reduce(
      (acc, character) => {
        const tier = character.tier?.toLowerCase() || 'tertiary';
        if (tier === 'core' || tier === 'tier 1') {
          acc.core.push(character);
        } else if (tier === 'secondary' || tier === 'tier 2') {
          acc.secondary.push(character);
        } else {
          acc.tertiary.push(character);
        }
        return acc;
      },
      { core: [] as Character[], secondary: [] as Character[], tertiary: [] as Character[] }
    );
  }, [characters]);

  const handleCharacterChange = (newCharacterId: string) => {
    if (newCharacterId) {
      navigate(`/character-journey/${newCharacterId}`);
    }
  };

  const selectedCharacter = characters?.find(c => c.id === characterId);

  const getTierBadgeVariant = (tier: string): "default" | "secondary" | "outline" => {
    const tierLower = tier?.toLowerCase() || '';
    if (tierLower === 'core' || tierLower === 'tier 1') return 'default';
    if (tierLower === 'secondary' || tierLower === 'tier 2') return 'secondary';
    return 'outline';
  };

  const formatTierLabel = (tier: string): string => {
    const tierLower = tier?.toLowerCase() || '';
    if (tierLower === 'core' || tierLower === 'tier 1') return 'Core';
    if (tierLower === 'secondary' || tierLower === 'tier 2') return 'Secondary';
    return 'Tertiary';
  };

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
      <Select value={characterId || ''} onValueChange={handleCharacterChange}>
        <SelectTrigger className="w-[280px]">
          <SelectValue placeholder="Select a character to explore">
            {selectedCharacter && (
              <div className="flex items-center gap-2">
                <span>{selectedCharacter.name}</span>
                <Badge variant={getTierBadgeVariant(selectedCharacter.tier || '')}>
                  {formatTierLabel(selectedCharacter.tier || '')}
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