/**
 * FilterSection Component
 * Advanced filtering controls for graph views
 */

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Filter, 
  Users, 
  Puzzle, 
  Calendar,
  Eye,
  EyeOff,
  RotateCcw
} from 'lucide-react';

interface FilterOptions {
  showCharacters: boolean;
  showPuzzles: boolean;
  showElements: boolean;
  showTimeline: boolean;
  showCompleted: boolean;
  showLocked: boolean;
}

export function FilterSection() {
  const [filters, setFilters] = useState<FilterOptions>({
    showCharacters: true,
    showPuzzles: true,
    showElements: true,
    showTimeline: true,
    showCompleted: true,
    showLocked: true,
  });

  const toggleFilter = (key: keyof FilterOptions) => {
    setFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const resetFilters = () => {
    setFilters({
      showCharacters: true,
      showPuzzles: true,
      showElements: true,
      showTimeline: true,
      showCompleted: true,
      showLocked: true,
    });
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-medium">Filters</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={resetFilters}
          className="h-8 px-2"
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Reset
        </Button>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-4">
        {/* Entity Types */}
        <div className="space-y-3">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Entity Types
          </Label>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-3 w-3" />
                <Label htmlFor="show-characters" className="text-sm cursor-pointer">
                  Characters
                </Label>
              </div>
              <Switch
                id="show-characters"
                checked={filters.showCharacters}
                onCheckedChange={() => toggleFilter('showCharacters')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Puzzle className="h-3 w-3" />
                <Label htmlFor="show-puzzles" className="text-sm cursor-pointer">
                  Puzzles
                </Label>
              </div>
              <Switch
                id="show-puzzles"
                checked={filters.showPuzzles}
                onCheckedChange={() => toggleFilter('showPuzzles')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="h-3 w-3 p-0 justify-center">
                  E
                </Badge>
                <Label htmlFor="show-elements" className="text-sm cursor-pointer">
                  Elements
                </Label>
              </div>
              <Switch
                id="show-elements"
                checked={filters.showElements}
                onCheckedChange={() => toggleFilter('showElements')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                <Label htmlFor="show-timeline" className="text-sm cursor-pointer">
                  Timeline
                </Label>
              </div>
              <Switch
                id="show-timeline"
                checked={filters.showTimeline}
                onCheckedChange={() => toggleFilter('showTimeline')}
              />
            </div>
          </div>
        </div>

        {/* Status Filters */}
        <div className="space-y-3">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Status
          </Label>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-3 w-3" />
                <Label htmlFor="show-completed" className="text-sm cursor-pointer">
                  Completed
                </Label>
              </div>
              <Switch
                id="show-completed"
                checked={filters.showCompleted}
                onCheckedChange={() => toggleFilter('showCompleted')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <EyeOff className="h-3 w-3" />
                <Label htmlFor="show-locked" className="text-sm cursor-pointer">
                  Locked
                </Label>
              </div>
              <Switch
                id="show-locked"
                checked={filters.showLocked}
                onCheckedChange={() => toggleFilter('showLocked')}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Badge variant="secondary" className="text-xs">
          {Object.values(filters).filter(Boolean).length} active
        </Badge>
      </div>
    </Card>
  );
}