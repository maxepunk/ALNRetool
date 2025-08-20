/**
 * Content Status View
 * Status dashboard for tracking content completion
 */

import { useAllCharacters } from '@/hooks/useCharacters';
import { useSynthesizedData } from '@/hooks/useSynthesizedData';
import { useAllTimeline } from '@/hooks/useTimeline';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, AlertCircle, Clock } from 'lucide-react';

interface StatusCardProps {
  title: string;
  complete: number;
  total: number;
  color: string;
  icon: React.ReactNode;
}

const StatusCard = ({ title, complete, total, color, icon }: StatusCardProps) => {
  const percentage = total > 0 ? Math.round((complete / total) * 100) : 0;
  
  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${color} bg-opacity-10`}>
            {icon}
          </div>
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <Badge 
          variant={percentage === 100 ? "default" : percentage >= 75 ? "secondary" : "outline"}
        >
          {percentage}%
        </Badge>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-3xl font-bold">
            {complete}/{total}
          </span>
          <span className="text-sm text-muted-foreground">
            {total - complete} remaining
          </span>
        </div>
        
        <Progress value={percentage} className="h-2" />
        
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span>{complete} complete</span>
          </div>
          <div className="flex items-center gap-1">
            <Circle className="h-4 w-4 text-muted-foreground" />
            <span>{total - complete} incomplete</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default function ContentStatusView() {
  // Fetch data from Notion
  const { data: characters = [], isLoading: loadingCharacters } = useAllCharacters();
  const { data: synthesizedData, isLoading: loadingSynthesized } = useSynthesizedData();
  const { data: timeline = [], isLoading: loadingTimeline } = useAllTimeline();
  
  // Extract elements and puzzles from synthesized data
  const elements = synthesizedData?.elements || [];
  const puzzles = synthesizedData?.puzzles || [];
  
  // Combined loading state
  const isLoading = loadingCharacters || loadingSynthesized || loadingTimeline;
  
  // Calculate completion statistics
  const stats = {
    characters: {
      total: characters.length,
      complete: characters.filter(c => 
        c.tier && c.overview && c.type
      ).length,
    },
    puzzles: {
      total: puzzles.length,
      complete: puzzles.filter(p => 
        p.descriptionSolution && p.timing?.length > 0
      ).length,
    },
    elements: {
      total: elements.length,
      complete: elements.filter(e => 
        e.descriptionText && e.basicType
      ).length,
    },
    timeline: {
      total: timeline.length,
      complete: timeline.filter(t => 
        t.date && t.description && t.charactersInvolvedIds?.length > 0
      ).length,
    }
  };
  
  // Calculate overall completion
  const totalItems = stats.characters.total + stats.puzzles.total + 
                    stats.elements.total + stats.timeline.total;
  const totalComplete = stats.characters.complete + stats.puzzles.complete + 
                       stats.elements.complete + stats.timeline.complete;
  const overallPercentage = totalItems > 0 ? Math.round((totalComplete / totalItems) * 100) : 0;
  
  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <LoadingSkeleton variant="text" lines={2} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <LoadingSkeleton key={i} variant="card" />
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <ErrorBoundary>
      <div data-testid="content-status-view" className="p-8 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h2 className="text-3xl font-bold">Content Status Dashboard</h2>
          <p className="text-muted-foreground">
            Track completion status for all game content
          </p>
        </div>
        
        {/* Overall Progress */}
        <Card className="p-6 bg-gradient-to-r from-primary/5 to-secondary/5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Overall Completion</h3>
              <Badge variant="default" className="text-lg px-3 py-1">
                {overallPercentage}%
              </Badge>
            </div>
            <Progress value={overallPercentage} className="h-3" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{totalComplete} items complete</span>
              <span>{totalItems - totalComplete} items remaining</span>
            </div>
          </div>
        </Card>
        
        {/* Status Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatusCard
            title="Characters"
            complete={stats.characters.complete}
            total={stats.characters.total}
            color="bg-green-600"
            icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
          />
          
          <StatusCard
            title="Puzzles"
            complete={stats.puzzles.complete}
            total={stats.puzzles.total}
            color="bg-blue-600"
            icon={<AlertCircle className="h-5 w-5 text-blue-600" />}
          />
          
          <StatusCard
            title="Elements"
            complete={stats.elements.complete}
            total={stats.elements.total}
            color="bg-purple-600"
            icon={<Circle className="h-5 w-5 text-purple-600" />}
          />
          
          <StatusCard
            title="Timeline"
            complete={stats.timeline.complete}
            total={stats.timeline.total}
            color="bg-orange-600"
            icon={<Clock className="h-5 w-5 text-orange-600" />}
          />
        </div>
        
        {/* Incomplete Items Summary */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Incomplete Items</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Characters Missing Fields</p>
              <ul className="text-sm space-y-1">
                <li>• {characters.filter(c => !c.tier).length} missing tier</li>
                <li>• {characters.filter(c => !c.overview).length} missing overview</li>
                <li>• {characters.filter(c => !c.type).length} missing type</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Puzzles Missing Fields</p>
              <ul className="text-sm space-y-1">
                <li>• {puzzles.filter(p => !p.descriptionSolution).length} missing solution</li>
                <li>• {puzzles.filter(p => !p.timing || p.timing.length === 0).length} missing timing</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Elements Missing Fields</p>
              <ul className="text-sm space-y-1">
                <li>• {elements.filter(e => !e.descriptionText).length} missing description</li>
                <li>• {elements.filter(e => !e.basicType).length} missing type</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Timeline Missing Fields</p>
              <ul className="text-sm space-y-1">
                <li>• {timeline.filter(t => !t.date).length} missing date</li>
                <li>• {timeline.filter(t => !t.description).length} missing description</li>
                <li>• {timeline.filter(t => !t.charactersInvolvedIds?.length).length} missing characters</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </ErrorBoundary>
  );
}