/**
 * Puzzle Filters with Focus Selector
 * Combines puzzle filters with puzzle-specific focus selector
 */

import { PuzzleFilterPanel } from './FilterPanel';
import { FocusNodeSelector } from './FocusNodeSelector';
import { Card, CardContent } from '@/components/ui/card';

export function PuzzleFiltersWithFocus() {
  return (
    <>
      <PuzzleFilterPanel />
      <Card className="mt-2">
        <CardContent className="pt-4">
          <FocusNodeSelector 
            label="Focus Puzzle"
            placeholder="Select puzzle to focus on..."
            entityType="puzzle"
          />
        </CardContent>
      </Card>
    </>
  );
}

export default PuzzleFiltersWithFocus;