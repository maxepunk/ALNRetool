/**
 * Character Filters with Focus Selector
 * Combines character filters with character-specific focus selector
 */

import { CharacterFilterPanel } from './FilterPanel';
import { FocusNodeSelector } from './FocusNodeSelector';
import { Card, CardContent } from '@/components/ui/card';

export function CharacterFiltersWithFocus() {
  return (
    <>
      <CharacterFilterPanel />
      <Card className="mt-2">
        <CardContent className="pt-4">
          <FocusNodeSelector 
            label="Focus Character"
            placeholder="Select character to focus on..."
            entityType="character"
          />
        </CardContent>
      </Card>
    </>
  );
}

export default CharacterFiltersWithFocus;