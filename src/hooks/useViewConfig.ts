/**
 * Hook for managing view configurations
 */

import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { viewConfigs, type ViewConfig } from '@/lib/viewConfigs';
import { useFilterStore } from '@/stores/filterStore';

export function useViewConfig(): {
  config: ViewConfig;
  viewType: string;
  applyFilters: () => void;
} {
  const { viewType = 'full-graph' } = useParams<{ viewType: string }>();
  const filterStore = useFilterStore();
  
  const config = useMemo(() => {
    return viewConfigs[viewType] || viewConfigs['full-graph'];
  }, [viewType]);
  
  const applyFilters = () => {
    if (!config) return;
    
    // Apply filters from config to store
    if (config.filters.entityTypes) {
      filterStore.setFilter('entityTypes', config.filters.entityTypes);
    }
    if (config.filters.characterTypes) {
      filterStore.setFilter('characterTypes', config.filters.characterTypes);
    }
    if (config.filters.tiers) {
      filterStore.setFilter('tiers', config.filters.tiers);
    }
    if (config.filters.puzzleComplexity) {
      filterStore.setFilter('minComplexity', config.filters.puzzleComplexity.min);
      filterStore.setFilter('maxComplexity', config.filters.puzzleComplexity.max);
    }
    
    // Apply custom filters
    if (config.filters.customFilters) {
      Object.entries(config.filters.customFilters).forEach(([key, value]) => {
        filterStore.setFilter(key, value);
      });
    }
  };
  
  return {
    config: config!,  // We always have a fallback to 'full-graph'
    viewType,
    applyFilters
  };
}