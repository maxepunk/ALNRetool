import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor, within, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ViewContextProvider } from '@/contexts/ViewContext';
import EntityTypeToggle from '@/components/filters/EntityTypeToggle';
import { 
  CharacterFilterPanel, 
  PuzzleFilterPanel, 
  ElementFilterPanel 
} from '@/components/sidebar/FilterPanel';
import GraphView from '@/components/graph/GraphView';
import { useFilterStore } from '@/stores/filterStore';
import '@testing-library/jest-dom';

// Helper function for rendering with providers
function renderWithProviders(component: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });
  
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ViewContextProvider>
          {component}
        </ViewContextProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

// Mock React Flow
vi.mock('@xyflow/react', () => ({
  ReactFlow: ({ nodes, onNodeClick }: any) => {
    console.log('ReactFlow received nodes:', nodes?.map((n: any) => ({ id: n.id, type: n.type })));
    return (
      <div data-testid="react-flow">
        {nodes?.map((node: any) => (
          <div 
            key={node.id} 
            data-testid={`node-${node.id}`}
            data-type={node.data?.metadata?.entityType || node.type}
            onClick={() => onNodeClick?.(null, node)}
          >
            {node.data?.label}
          </div>
        ))}
      </div>
    );
  },
  ReactFlowProvider: ({ children }: any) => <>{children}</>,
  Background: () => null,
  Controls: () => null,
  MiniMap: () => null,
  BackgroundVariant: { 
    Dots: 'dots',
    Lines: 'lines',
    Cross: 'cross'
  },
  useReactFlow: () => ({
    fitView: vi.fn(),
    fitBounds: vi.fn(),
    getViewport: () => ({ x: 0, y: 0, zoom: 1 }),
    setViewport: vi.fn()
  })
}));

// Mock hooks
vi.mock('@/hooks/useViewConfig', () => ({
  useViewConfig: () => ({
    config: {
      name: 'Full Graph',
      description: 'Test graph view',
      filters: { entityTypes: ['all'] },
      layout: {
        direction: 'LR',
        spacing: { nodeSpacing: 100, rankSpacing: 300 }
      }
    },
    viewType: 'full-graph'
  })
}));

// Mock API with proper node structure
vi.mock('@/services/graphApi', () => ({
  graphApi: {
    getComplete: vi.fn(() => {
      const response = {
      nodes: [
        {
          id: 'char-alice',
          type: 'character',
          position: { x: 100, y: 100 },
          data: {
            id: 'char-alice',
            label: 'Alice',
            entity: {
              id: 'char-alice',
              name: 'Alice',
              type: 'Player',
              tier: 'Core',
              ownedElementIds: [],
              associatedElementIds: [],
              characterPuzzleIds: [],
              eventIds: [],
              connections: [],
              primaryAction: 'Investigate',
              characterLogline: 'Test character',
              overview: 'Test overview',
              emotionTowardsCEO: 'Neutral'
            },
            metadata: { entityType: 'character' }
          }
        },
        {
          id: 'char-bob',
          type: 'character',
          position: { x: 200, y: 100 },
          data: {
            id: 'char-bob',
            label: 'Bob',
            entity: {
              id: 'char-bob',
              name: 'Bob',
              type: 'NPC',
              tier: 'Secondary',
              ownedElementIds: [],
              associatedElementIds: [],
              characterPuzzleIds: [],
              eventIds: [],
              connections: [],
              primaryAction: 'Support',
              characterLogline: 'Test NPC',
              overview: 'Test overview',
              emotionTowardsCEO: 'Friendly'
            },
            metadata: { entityType: 'character' }
          }
        },
        {
          id: 'puzzle-1',
          type: 'puzzle',
          position: { x: 100, y: 200 },
          data: {
            id: 'puzzle-1',
            label: 'Puzzle 1',
            entity: {
              id: 'puzzle-1',
              name: 'Puzzle 1',
              descriptionSolution: 'Test solution',
              puzzleElementIds: [],
              rewardIds: [],
              subPuzzleIds: [],
              storyReveals: [],
              timing: ['Act 1'],
              narrativeThreads: [],
            },
            metadata: { entityType: 'puzzle' }
          }
        },
        {
          id: 'elem-1',
          type: 'element',
          position: { x: 100, y: 300 },
          data: {
            id: 'elem-1',
            label: 'Element 1',
            entity: {
              id: 'elem-1',
              name: 'Element 1',
              descriptionText: 'Test element',
              sfPatterns: {},
              basicType: 'Prop',
              contentIds: [],
              status: 'Done',
              firstAvailable: 'Act 0',
              requiredForPuzzleIds: [],
              rewardedByPuzzleIds: [],
              narrativeThreads: [],
              associatedCharacterIds: [],
              puzzleChain: [],
              productionNotes: '',
              filesMedia: [],
              isContainer: false
            },
            metadata: { entityType: 'element' }
          }
        }
      ],
      edges: []
    };
    console.log('Mock API returning nodes:', response.nodes.map(n => ({ id: n.id, type: n.type })));
    return Promise.resolve(response);
  })
  }
}));

describe('Filter Component Interactions', () => {
  beforeEach(() => {
    // Reset store state before each test
    console.log('Setting initial store state');
    useFilterStore.setState({
      entityVisibility: {
        character: true,
        puzzle: true,
        element: true,
        timeline: true
      },
      characterFilters: {
        selectedTiers: new Set(['Core', 'Secondary', 'Tertiary']),
        ownershipStatus: new Set(),
        characterType: 'all',
        selectedCharacterId: null,
        highlightShared: false
      },
      puzzleFilters: {
        selectedActs: new Set(['Act 0', 'Act 1', 'Act 2']),
        completionStatus: 'all',
        selectedPuzzleId: null
      },
      contentFilters: {
        contentStatus: new Set(),
        hasIssues: null,
        lastEditedRange: 'all',
        elementBasicTypes: new Set(),
        elementStatus: new Set()
      }
    });
    
    // Verify the state was set correctly
    const state = useFilterStore.getState();
    console.log('Entity visibility after setting:', state.entityVisibility);
    console.log('Selected tiers:', Array.from(state.characterFilters.selectedTiers));
    console.log('Selected acts:', Array.from(state.puzzleFilters.selectedActs));
  });

  describe('EntityTypeToggle affects FilterPanel results', () => {
    it('should hide filtered character results when characters are hidden', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(
        <div>
          <EntityTypeToggle />
          <CharacterFilterPanel />
          <GraphView />
        </div>
      );

      // Wait for graph to load
      await waitFor(() => {
        expect(screen.getByTestId('react-flow')).toBeInTheDocument();
      });

      // Verify characters are initially visible
      expect(screen.getByTestId('node-char-alice')).toBeInTheDocument();
      expect(screen.getByTestId('node-char-bob')).toBeInTheDocument();

      // Apply character filter - uncheck Secondary tier
      const secondaryCheckbox = screen.getByLabelText('Secondary');
      await user.click(secondaryCheckbox);

      // Verify only Core character is visible
      await waitFor(() => {
        expect(screen.getByTestId('node-char-alice')).toBeInTheDocument();
        expect(screen.queryByTestId('node-char-bob')).not.toBeInTheDocument();
      });

      // Now hide all characters via EntityTypeToggle
      const characterToggle = screen.getByRole('checkbox', { name: /characters/i });
      await user.click(characterToggle);

      // Verify no characters are visible, regardless of filter
      await waitFor(() => {
        expect(screen.queryByTestId('node-char-alice')).not.toBeInTheDocument();
        expect(screen.queryByTestId('node-char-bob')).not.toBeInTheDocument();
      });
    });

    it('should only apply filters to visible entity types', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(
        <div>
          <EntityTypeToggle />
          <CharacterFilterPanel />
          <PuzzleFilterPanel />
          <GraphView />
        </div>
      );

      // Wait for graph to load
      await waitFor(() => {
        expect(screen.getByTestId('react-flow')).toBeInTheDocument();
      });
      
      // Wait for character nodes to render first
      await waitFor(() => {
        expect(screen.getByTestId('node-char-alice')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Hide characters
      const characterToggle = screen.getByRole('checkbox', { name: /characters/i });
      await user.click(characterToggle);

      // Apply character filter (should have no effect since characters are hidden)
      const coreCheckbox = screen.getByLabelText('Core');
      await user.click(coreCheckbox); // Uncheck Core

      // Verify puzzles are still visible (filter didn't affect them)
      await waitFor(() => {
        expect(screen.getByTestId('node-puzzle-1')).toBeInTheDocument();
      }, { timeout: 2000 });

      // Re-enable characters
      await user.click(characterToggle);

      // Now the filter should take effect - Core characters should be hidden
      await waitFor(() => {
        expect(screen.queryByTestId('node-char-alice')).not.toBeInTheDocument();
        expect(screen.getByTestId('node-char-bob')).toBeInTheDocument(); // Secondary is still checked
      });
    });

    it('should maintain filter state when toggling entity visibility', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(
        <div>
          <EntityTypeToggle />
          <CharacterFilterPanel />
          <GraphView />
        </div>
      );

      await waitFor(() => {
        expect(screen.getByTestId('react-flow')).toBeInTheDocument();
      });

      // Apply character filter - uncheck Secondary
      const secondaryCheckbox = screen.getByLabelText('Secondary');
      await user.click(secondaryCheckbox);

      // Verify filter applied
      await waitFor(() => {
        expect(screen.getByTestId('node-char-alice')).toBeInTheDocument();
        expect(screen.queryByTestId('node-char-bob')).not.toBeInTheDocument();
      });

      // Toggle characters off and on
      const characterToggle = screen.getByRole('checkbox', { name: /characters/i });
      await user.click(characterToggle); // Off
      await user.click(characterToggle); // On

      // Filter should still be applied
      await waitFor(() => {
        expect(screen.getByTestId('node-char-alice')).toBeInTheDocument();
        expect(screen.queryByTestId('node-char-bob')).not.toBeInTheDocument();
      });

      // Verify store state maintained the filter
      const state = useFilterStore.getState();
      expect(state.characterFilters.selectedTiers.has('Core')).toBe(true);
      expect(state.characterFilters.selectedTiers.has('Secondary')).toBe(false);
    });
  });

  describe('Show All / Hide All interactions', () => {
    it('should affect all FilterPanels when using show/hide all', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(
        <div>
          <EntityTypeToggle />
          <CharacterFilterPanel />
          <PuzzleFilterPanel />
          <ElementFilterPanel />
          <GraphView />
        </div>
      );

      await waitFor(() => {
        expect(screen.getByTestId('react-flow')).toBeInTheDocument();
      });

      // Initially all entities visible (wait for them to render)
      await waitFor(() => {
        expect(screen.getByTestId('node-char-alice')).toBeInTheDocument();
        expect(screen.getByTestId('node-puzzle-1')).toBeInTheDocument();
        expect(screen.getByTestId('node-elem-1')).toBeInTheDocument();
      });

      // Click Hide All
      const hideAllButton = screen.getByRole('button', { name: /hide all/i });
      await user.click(hideAllButton);

      // All entities should be hidden
      await waitFor(() => {
        expect(screen.queryByTestId('node-char-alice')).not.toBeInTheDocument();
        expect(screen.queryByTestId('node-puzzle-1')).not.toBeInTheDocument();
        expect(screen.queryByTestId('node-elem-1')).not.toBeInTheDocument();
      });

      // Click Show All
      const showAllButton = screen.getByRole('button', { name: /show all/i });
      await user.click(showAllButton);

      // All entities should be visible again
      await waitFor(() => {
        expect(screen.getByTestId('node-char-alice')).toBeInTheDocument();
        expect(screen.getByTestId('node-puzzle-1')).toBeInTheDocument();
        expect(screen.getByTestId('node-elem-1')).toBeInTheDocument();
      });
    });
  });

  describe('Cross-filter awareness', () => {
    it('should update visible counts when combining entity visibility and filters', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(
        <div>
          <EntityTypeToggle />
          <CharacterFilterPanel />
          <GraphView />
        </div>
      );

      await waitFor(() => {
        expect(screen.getByTestId('react-flow')).toBeInTheDocument();
      });

      // Check initial state - 2 characters visible
      const reactFlow = screen.getByTestId('react-flow');
      const characterNodes = within(reactFlow).getAllByTestId(/node-char-/);
      expect(characterNodes).toHaveLength(2);

      // Apply tier filter - uncheck Secondary
      const secondaryCheckbox = screen.getByLabelText('Secondary');
      await user.click(secondaryCheckbox);

      // Should have 1 character (only Core)
      await waitFor(() => {
        const updatedNodes = within(reactFlow).queryAllByTestId(/node-char-/);
        expect(updatedNodes).toHaveLength(1);
      });

      // Now hide all characters via toggle
      const characterToggle = screen.getByRole('checkbox', { name: /characters/i });
      await user.click(characterToggle);

      // Should have 0 characters
      await waitFor(() => {
        const finalNodes = within(reactFlow).queryAllByTestId(/node-char-/);
        expect(finalNodes).toHaveLength(0);
      });
    });
  });
});