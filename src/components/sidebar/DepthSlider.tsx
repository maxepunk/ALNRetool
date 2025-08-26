/**
 * DepthSlider Component
 * Enhanced connection depth slider with mode indication and tick marks
 */

import { useFilterStore } from '@/stores/filterStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export function DepthSlider() {
  const connectionDepth = useFilterStore(state => state.connectionDepth);
  const setConnectionDepth = useFilterStore(state => state.setConnectionDepth);
  const filterMode = useFilterStore(state => state.filterMode);
  const focusedNodeId = useFilterStore(state => state.focusedNodeId);

  const getModeDescription = () => {
    if (focusedNodeId) {
      return `Showing ${connectionDepth} ${connectionDepth === 1 ? 'level' : 'levels'} from focused node`;
    } else if (connectionDepth === 0) {
      return 'Showing only filtered nodes (no connections)';
    } else {
      return `Showing filtered nodes + ${connectionDepth} ${connectionDepth === 1 ? 'level' : 'levels'} of connections`;
    }
  };

  const getModeBadge = () => {
    switch (filterMode) {
      case 'pure':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700">Pure Filter</Badge>;
      case 'focused':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">Focus Mode</Badge>;
      case 'connected':
        return <Badge variant="secondary" className="bg-green-100 text-green-700">Connected</Badge>;
    }
  };

  const depthLabels = ['None', 'Direct', '2 levels', '3 levels', '4 levels', '5 levels'];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Connection Depth</CardTitle>
          {getModeBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mode description */}
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{getModeDescription()}</span>
        </div>

        {/* Slider with value */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>Depth Level</Label>
            <span className="text-sm font-medium">
              {depthLabels[connectionDepth] || `${connectionDepth} levels`}
            </span>
          </div>

          {/* Enhanced slider */}
          <div className="relative">
            <input
              type="range"
              value={connectionDepth}
              onChange={(e) => setConnectionDepth(Number(e.target.value))}
              min={0}
              max={5}
              step={1}
              className={cn(
                "w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer",
                "slider-thumb:appearance-none slider-thumb:w-4 slider-thumb:h-4",
                "slider-thumb:bg-blue-600 slider-thumb:rounded-full slider-thumb:cursor-pointer",
                "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4",
                "[&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer",
                "[&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-blue-600",
                "[&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer"
              )}
            />
            
            {/* Tick marks and labels */}
            <div className="flex justify-between mt-1">
              {depthLabels.map((_, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div className="w-0.5 h-2 bg-gray-300" />
                  <span className={cn(
                    "text-xs mt-1",
                    index === connectionDepth ? "text-blue-600 font-semibold" : "text-gray-500"
                  )}>
                    {index}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Depth descriptions */}
          <div className="text-xs text-muted-foreground space-y-1 mt-3">
            <div className={cn("flex items-center gap-2", connectionDepth === 0 && "font-medium text-foreground")}>
              <span className="w-4">0:</span>
              <span>Only filtered nodes, no connections</span>
            </div>
            <div className={cn("flex items-center gap-2", connectionDepth === 1 && "font-medium text-foreground")}>
              <span className="w-4">1:</span>
              <span>Direct neighbors only</span>
            </div>
            <div className={cn("flex items-center gap-2", connectionDepth >= 2 && connectionDepth <= 3 && "font-medium text-foreground")}>
              <span className="w-4">2-3:</span>
              <span>Extended neighborhood</span>
            </div>
            <div className={cn("flex items-center gap-2", connectionDepth >= 4 && "font-medium text-foreground")}>
              <span className="w-4">4-5:</span>
              <span>Wide network view</span>
            </div>
          </div>
        </div>

        {/* Tips based on mode */}
        {focusedNodeId && (
          <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-md text-xs">
            <strong>Focus Mode Active:</strong> Showing connections from the focused node only. Clear focus to see all filtered nodes.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default DepthSlider;