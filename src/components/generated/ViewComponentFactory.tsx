/**
 * ViewComponentFactory - Generic component generator from ViewConfiguration
 * 
 * Phase 3: Streamlined implementation with reduced complexity
 */

import React, { useState, useCallback } from 'react';
import type { Node, OnSelectionChangeParams } from '@xyflow/react';
import type { ViewConfiguration } from '@/lib/graph/config/ViewConfiguration';

// Components
import GraphView from '@/components/graph/GraphView';
import DetailPanel from '@/components/DetailPanel';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import { Card } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

// Hooks
import { useViewState } from './hooks/useViewState';
import { useViewData } from './hooks/useViewData';
import { useEntitySave } from '@/hooks/useEntitySave';
import { useViewContext } from '@/contexts/ViewContext';

// Component Registry
import { renderControl } from './ComponentRegistry';

export interface ViewComponentFactoryProps {
  config: ViewConfiguration;
  className?: string;
}

export default function ViewComponentFactory({ 
  config, 
  className = '' 
}: ViewComponentFactoryProps) {
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const viewContext = useViewContext();
  const { viewState, updateViewState, isValidSelection } = useViewState(config);
  const { data, isLoading, error } = useViewData(config, viewState);
  const { handleEntitySave, isSaving } = useEntitySave();
  
  // Set active view only once on mount
  React.useEffect(() => {
    viewContext.setActiveView(config.id);
    // Don't clear active view on unmount to prevent infinite loops
    // The next view will set itself as active
  }, [config.id]); // Remove viewContext from deps to prevent re-runs
  
  // URL state synchronization - only hydrate on mount
  const hasHydratedRef = React.useRef(false);
  React.useEffect(() => {
    if (!hasHydratedRef.current) {
      const urlViewState = viewContext.hydrateViewStateFromUrl(config.id);
      if (Object.keys(urlViewState).length > 0) {
        updateViewState(urlViewState);
      }
      hasHydratedRef.current = true;
    }
  }, [config.id, viewContext, updateViewState]);
  
  // Update URL when viewState changes (but not on initial hydration)
  const isFirstRender = React.useRef(true);
  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    viewContext.updateUrlFromViewState(config.id, viewState);
  }, [config.id, viewState, viewContext]);
  
  // Entity helpers
  const getEntityFromNode = useCallback((node: Node) => {
    if (!node.data?.entity) return null;
    return node.data.entity;
  }, []);

  const getEntityType = useCallback((node: Node): 'character' | 'element' | 'puzzle' | 'timeline' => {
    if (node.type === 'character') return 'character';
    if (node.type === 'element') return 'element';
    if (node.type === 'puzzle') return 'puzzle';
    if (node.type === 'timeline') return 'timeline';
    return 'element';
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className={`flex flex-col h-full bg-background ${className}`} data-testid={`view-${config.id}`}>
        <div className="px-8 py-6 bg-secondary border-b">
          <h1 className="text-3xl font-bold">{config.ui?.title || config.name}</h1>
          <p className="mt-2 text-muted-foreground">{config.ui?.description || 'Loading...'}</p>
        </div>
        <div className="flex-1 flex relative overflow-hidden">
          <LoadingSkeleton variant="graph" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`flex flex-col h-full bg-background ${className}`} data-testid={`view-${config.id}`}>
        <div className="px-8 py-6 bg-secondary border-b">
          <h1 className="text-3xl font-bold">{config.ui?.title || config.name}</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Card className="p-6 max-w-md w-full">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Error Loading View</h2>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {error instanceof Error ? error.message : 'An error occurred'}
            </p>
          </Card>
        </div>
      </div>
    );
  }

  // Render controls
  const renderControls = () => {
    if (!config.ui?.controls) return null;
    
    return (
      <div className="mt-4 flex flex-wrap gap-4 items-end">
        {config.ui.controls.map(controlConfig => {
          if (controlConfig.showIf && !controlConfig.showIf(viewState)) {
            return null;
          }

          let entities: any[] = [];
          if (controlConfig.type === 'entity-selector' && data) {
            const type = viewState.selectedNodeType || controlConfig.options?.entityType;
            switch (type) {
              case 'character': entities = data.characters; break;
              case 'element': entities = data.elements; break;
              case 'puzzle': entities = data.puzzles; break;
              case 'timeline': entities = data.timeline; break;
            }
          }

          return (
            <div key={controlConfig.id} className="min-w-0">
              {renderControl(controlConfig, viewState, updateViewState, entities)}
            </div>
          );
        })}
      </div>
    );
  };

  // No selection state
  if (!isValidSelection) {
    return (
      <div className={`flex flex-col h-full bg-background ${className}`} data-testid={`view-${config.id}`}>
        <div className="px-8 py-6 bg-secondary border-b">
          <h1 className="text-3xl font-bold">{config.ui?.title || config.name}</h1>
          <p className="mt-2 text-muted-foreground">{config.ui?.description}</p>
          {renderControls()}
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Card className="p-6 max-w-md w-full text-center">
            <AlertCircle className="h-5 w-5 text-amber-600 mx-auto mb-2" />
            <h2 className="text-xl font-semibold mb-2">Selection Required</h2>
            <p className="text-sm text-muted-foreground">
              Please make a selection using the controls above.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  // Main view
  return (
    <ErrorBoundary>
      <div className={`h-full flex flex-col ${className}`} data-testid={`view-${config.id}`}>
        <div className="relative z-30 p-4 border-b bg-background/95 backdrop-blur">
          <h1 className="text-2xl font-bold">{config.ui?.title || config.name}</h1>
          {config.ui?.description && (
            <p className="text-sm text-muted-foreground">{config.ui.description}</p>
          )}
          {renderControls()}
        </div>
        
        <div className="flex-1 relative">
          {data && (
            <GraphView
              characters={data.characters}
              elements={data.elements}
              puzzles={data.puzzles}
              timeline={data.timeline}
              viewType={config.id as any}
              onNodeClick={setSelectedNode}
              onSelectionChange={(params: OnSelectionChangeParams) => {
                console.log('Selection changed:', params);
              }}
              viewOptions={viewState}
            />
          )}
        </div>
        
        {selectedNode && data && (
          <DetailPanel
            entity={getEntityFromNode(selectedNode)}
            entityType={getEntityType(selectedNode)}
            onClose={() => setSelectedNode(null)}
            onSave={handleEntitySave}
            isSaving={isSaving}
            allEntities={data}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}