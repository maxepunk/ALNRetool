/**
 * Graph Depth Control Component
 * Universal control for connection depth across all graph views
 */

import { motion } from 'framer-motion';
import { SlidersHorizontal } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFilterStore } from '@/stores/filterStore';

interface GraphDepthControlProps {
  isOpen: boolean;
}

export function GraphDepthControl({ isOpen }: GraphDepthControlProps) {
  const connectionDepth = useFilterStore(state => state.connectionDepth);
  const setConnectionDepth = useFilterStore(state => state.setConnectionDepth);

  if (!isOpen) {
    return (
      <div className="flex justify-center py-2">
        <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-2"
    >
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <SlidersHorizontal className="h-3.5 w-3.5" />
        <span>Graph Depth</span>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <label className="text-xs text-muted-foreground">
            Connection Depth
          </label>
          <span className="text-xs font-medium">
            {connectionDepth} hop{connectionDepth !== 1 ? 's' : ''}
          </span>
        </div>
        <Select
          value={connectionDepth.toString()}
          onValueChange={(value) => setConnectionDepth(parseInt(value))}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 hop (immediate)</SelectItem>
            <SelectItem value="2">2 hops (close)</SelectItem>
            <SelectItem value="3">3 hops (extended)</SelectItem>
            <SelectItem value="4">4 hops (broad)</SelectItem>
            <SelectItem value="5">5 hops (wide)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground px-1">
          Controls how many connections to show from selected nodes in graph views
        </p>
      </div>
    </motion.div>
  );
}