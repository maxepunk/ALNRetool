/**
 * useAsyncLayout Hook
 * Manages asynchronous layout computation with progress tracking
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useGraphContextOptional } from '@/contexts/GraphContextProvider';
import { getDefaultGraphContext } from '@/lib/graph/GraphContext';
import type { GraphData, LayoutConfig } from '@/lib/graph/types';
import type { LayoutProgress } from '@/lib/graph/layout/BaseLayoutAlgorithm';

export interface AsyncLayoutState {
  isLayouting: boolean;
  layoutProgress: number;
  error: string | null;
}

export interface UseAsyncLayoutOptions {
  onProgress?: (progress: number) => void;
  onComplete?: (graph: GraphData) => void;
  onError?: (error: Error) => void;
}

export function useAsyncLayout(options: UseAsyncLayoutOptions = {}) {
  // Get graph context from React context or use default
  const contextFromProvider = useGraphContextOptional();
  const graphContext = contextFromProvider || getDefaultGraphContext();
  const [state, setState] = useState<AsyncLayoutState>({
    isLayouting: false,
    layoutProgress: 0,
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const isActiveRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isActiveRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const applyLayoutAsync = useCallback(async (
    graph: GraphData,
    config?: LayoutConfig
  ): Promise<GraphData> => {
    // Cancel any ongoing layout
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    // Reset state
    setState({
      isLayouting: true,
      layoutProgress: 0,
      error: null,
    });

    try {
      // Handle progress updates
      const handleProgress = (progress: LayoutProgress) => {
        if (!isActiveRef.current) return;
        
        const progressValue = progress.progress;
        setState(prev => ({
          ...prev,
          layoutProgress: progressValue,
        }));
        
        options.onProgress?.(progressValue);
      };

      // Apply layout asynchronously
      const result = await graphContext.layoutOrchestrator.applyLayoutAsync(
        graph,
        config,
        handleProgress
      );

      if (!isActiveRef.current) {
        throw new Error('Component unmounted');
      }

      // Update state on completion
      setState({
        isLayouting: false,
        layoutProgress: 100,
        error: null,
      });

      options.onComplete?.(result);
      return result;

    } catch (error) {
      if (!isActiveRef.current) {
        throw error; // Re-throw if component unmounted
      }

      const errorMessage = error instanceof Error ? error.message : 'Layout failed';
      setState({
        isLayouting: false,
        layoutProgress: 0,
        error: errorMessage,
      });

      options.onError?.(error instanceof Error ? error : new Error(errorMessage));
      
      // Return original graph on error
      return graph;
    } finally {
      abortControllerRef.current = null;
    }
  }, [options]);

  const cancelLayout = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      graphContext.layoutOrchestrator.cancelForceLayout();
    }
    setState({
      isLayouting: false,
      layoutProgress: 0,
      error: null,
    });
  }, []);

  return {
    ...state,
    applyLayoutAsync,
    cancelLayout,
  };
}