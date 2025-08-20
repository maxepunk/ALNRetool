/**
 * useMutateElement Hook
 * Handles element mutations via React Query
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { elementsApi } from '@/services/api';
import type { Element } from '@/types/notion/app';
import { toast } from 'react-hot-toast';

interface MutateElementParams {
  id: string;
  properties: {
    Owner?: {
      relation: Array<{ id: string }>;
    };
    [key: string]: any;
  };
}

export function useMutateElement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, properties }: MutateElementParams) => {
      // Transform properties to match the API format
      const updates: Partial<Element> = {};
      
      // Handle Owner relation update
      if (properties.Owner?.relation?.[0]?.id) {
        updates.ownerId = properties.Owner.relation[0].id;
      }
      
      // Add other property transformations as needed
      Object.entries(properties).forEach(([key, value]) => {
        if (key !== 'Owner') {
          // Handle other properties
          updates[key as keyof Element] = value;
        }
      });
      
      return elementsApi.update(id, updates);
    },
    
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['elements'] });
      queryClient.invalidateQueries({ queryKey: ['synthesized'] });
      queryClient.invalidateQueries({ queryKey: ['characterJourney'] });
      
      // Show success message
      toast.success('Element updated successfully');
    },
    
    onError: (error) => {
      console.error('Failed to update element:', error);
      toast.error('Failed to update element');
    },
  });
}