/**
 * useViewData Hook
 * 
 * Data integration layer that bridges ViewConfiguration with existing
 * data hooks and applies filtering based on view state.
 */

import { useMemo } from 'react';
import type { ViewConfiguration } from '@/lib/graph/config/ViewConfiguration';
import type { ViewState, AllEntitiesData, ViewDataState } from '../types';

// Import existing data hooks
import { useAllCharacters } from '@/hooks/useCharacters';
import { useAllPuzzles } from '@/hooks/usePuzzles';
import { useAllElements } from '@/hooks/useElements';
import { useAllTimeline } from '@/hooks/useTimeline';

// Import ViewContext for filtering pipeline
import { useViewContext } from '@/contexts/ViewContext';

/**
 * Hook that integrates with existing data layer and applies view-specific filtering
 */
export function useViewData(config: ViewConfiguration, viewState: ViewState): ViewDataState {
  // Get ViewContext for filtering pipeline
  const viewContext = useViewContext();
  
  // Fetch all entity data using existing hooks
  const { data: charactersData, isLoading: charactersLoading, error: charactersError } = useAllCharacters();
  const { data: puzzlesData, isLoading: puzzlesLoading, error: puzzlesError } = useAllPuzzles();
  const { data: elementsData, isLoading: elementsLoading, error: elementsError } = useAllElements();
  const { data: timelineData, isLoading: timelineLoading, error: timelineError } = useAllTimeline();

  // Combined loading state
  const isLoading = charactersLoading || puzzlesLoading || elementsLoading || timelineLoading;

  // Combined error state
  const error = charactersError || puzzlesError || elementsError || timelineError;

  // Process and filter data based on view configuration and state
  const processedData = useMemo((): AllEntitiesData | null => {
    // Return null if still loading or have errors
    if (isLoading || error) {
      return null;
    }

    // Ensure we have data from all sources
    if (!charactersData || !puzzlesData || !elementsData || !timelineData) {
      return null;
    }

    // Create base data set
    const allData: AllEntitiesData = {
      characters: charactersData,
      elements: elementsData,
      puzzles: puzzlesData,
      timeline: timelineData
    };

    // No filtering needed - return all data
    // Filtering is handled at the graph transformation level
    return allData;
  }, [
    charactersData,
    elementsData,
    puzzlesData,
    timelineData,
    isLoading,
    error,
    config,
    viewState,
    viewContext
  ]);

  return {
    data: processedData,
    isLoading,
    error
  };
}