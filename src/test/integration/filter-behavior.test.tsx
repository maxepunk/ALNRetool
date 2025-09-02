/**
 * Behavioral Tests for Filter Application
 * 
 * These tests validate user-visible filtering behavior,
 * including entity visibility, URL synchronization, persistence,
 * and UI feedback. Tests focus on what users experience,
 * not implementation details.
 */

import { describe, it, expect, beforeAll, afterEach, afterAll, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { ViewContextProvider } from '@/contexts/ViewContext';
import GraphView from '@/components/graph/GraphView';
import { FilterPanel } from '@/components/sidebar/FilterPanel';
import { useFilterStore } from '@/stores/filterStore';
import type { Character, Element, Puzzle } from '@/types/notion/app';
import type { Node as GraphNode } from '@xyflow/react';

// Mock React Flow for testing
vi.mock('@xyflow/react', () => ({
  ReactFlow: ({ nodes, edges, children }: any) => (
    <div data-testid="react-flow" role="application">
      {nodes?.map((node: GraphNode) => (
        <div 
          key={node.id} 
          data-testid={`node-${node.id}`}
          data-type={node.type}
          className="react-flow__node"
        >
          <div>{node.data.name}</div>
        </div>
      ))}
      {edges?.map((edge: any) => (
        <div 
          key={edge.id} 
          data-testid={`edge-${edge.id}`}
          data-source={edge.source}
          data-target={edge.target}
          className="react-flow__edge"
        />
      ))}
      {children}
    </div>
  ),
  ReactFlowProvider: ({ children }: any) => <div>{children}</div>,
  Background: () => null,
  BackgroundVariant: {
    Lines: 'lines',
    Dots: 'dots',
    Cross: 'cross',
  },
  Controls: () => null,
  MiniMap: () => null,
  Handle: () => null,
  Position: {
    Top: 'top',
    Right: 'right',
    Bottom: 'bottom',
    Left: 'left',
  },
  MarkerType: {
    Arrow: 'arrow',
    ArrowClosed: 'arrowclosed',
  },
  useReactFlow: () => ({
    fitView: vi.fn(),
    getNodes: vi.fn(() => []),
    getEdges: vi.fn(() => []),
  }),
  useNodesState: (initialNodes: any) => [initialNodes, vi.fn(), vi.fn()],
  useEdgesState: (initialEdges: any) => [initialEdges, vi.fn(), vi.fn()],
  applyNodeChanges: vi.fn(),
  applyEdgeChanges: vi.fn(),
  addEdge: vi.fn(),
}));

// Mock graph data with various entity types
const mockGraphData = {
  nodes: [
    {
      id: 'char-alice',
      type: 'character',
      position: { x: 100, y: 100 },
      data: {
        id: 'char-alice',
        entityType: 'character',
        name: 'Alice',
        type: 'Player',
        tier: 'Core'
      }
    },
    {
      id: 'char-bob',
      type: 'character',
      position: { x: 200, y: 100 },
      data: {
        id: 'char-bob',
        entityType: 'character',
        name: 'Bob',
        type: 'NPC',
        tier: 'Secondary'
      }
    },
    {
      id: 'puzzle-1',
      type: 'puzzle',
      position: { x: 150, y: 200 },
      data: {
        id: 'puzzle-1',
        entityType: 'puzzle',
        name: 'The Missing Evidence',
        timing: ['Act 1']
      }
    },
    {
      id: 'elem-1',
      type: 'element',
      position: { x: 250, y: 200 },
      data: {
        id: 'elem-1',
        entityType: 'element',
        name: 'Red Herring',
        basicType: 'Clue',
        status: 'Complete'
      }
    }
  ],
  edges: [
    {
      id: 'edge-1',
      source: 'char-alice',
      target: 'puzzle-1',
      type: 'characterPuzzle'
    }
  ]
};

// Mock server setup
const server = setupServer(
  // Graph complete endpoint - what GraphView actually calls
  http.get('http://localhost:3001/api/graph/complete', () => {
    return HttpResponse.json(mockGraphData);
  }),
  
  // Characters endpoint
  http.get('http://localhost:3001/api/notion/characters', () => {
    return HttpResponse.json({
      data: [
        {
          id: 'char-alice',
          name: 'Alice',
          type: 'Player',
          tier: 'Core'
        },
        {
          id: 'char-bob',
          name: 'Bob',
          type: 'NPC',
          tier: 'Secondary'
        }
      ]
    });
  }),
  
  // Puzzles endpoint
  http.get('http://localhost:3001/api/notion/puzzles', () => {
    return HttpResponse.json({
      data: [
        {
          id: 'puzzle-1',
          name: 'The Missing Evidence',
          timing: ['Act 1']
        }
      ]
    });
  }),
  
  // Elements endpoint
  http.get('http://localhost:3001/api/notion/elements', () => {
    return HttpResponse.json({
      data: [
        {
          id: 'elem-1',
          name: 'Red Herring',
          basicType: 'Clue',
          status: 'Complete'
        }
      ]
    });
  })
);

// Helper component to capture URL changes
function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="current-url">{location.search}</div>;
}

// Helper function to render with all providers
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
          <LocationDisplay />
        </ViewContextProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

describe('User applies filters', () => {
  beforeAll(() => server.listen());
  beforeEach(() => {
    // Clear filters and sessionStorage before each test
    useFilterStore.getState().clearAllFilters();
    sessionStorage.clear();
  });
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('should hide filtered entities', async () => {
    const user = userEvent.setup();
    
    // Render graph view with filter controls
    renderWithProviders(
      <div>
        <FilterPanel
          title="Entity Visibility"
          filters={{
            entityVisibility: {
              type: 'checkbox',
              label: 'Show Entity Types',
              options: [
                { value: 'character', label: 'Characters' },
                { value: 'puzzle', label: 'Puzzles' },
                { value: 'element', label: 'Elements' }
              ]
            }
          }}
        />
        <GraphView />
      </div>
    );
    
    // Wait for graph to load with all entities
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('The Missing Evidence')).toBeInTheDocument();
      expect(screen.getByText('Red Herring')).toBeInTheDocument();
    });
    
    // Get initial node count
    const graphContainer = screen.getByRole('application'); // React Flow uses this role
    const initialNodes = within(graphContainer).getAllByText(/Alice|Bob|Missing Evidence|Red Herring/);
    expect(initialNodes).toHaveLength(4);
    
    // Toggle off characters using the filter
    const characterCheckbox = screen.getByLabelText('Characters');
    await user.click(characterCheckbox);
    
    // Verify characters are hidden
    await waitFor(() => {
      expect(screen.queryByText('Alice')).not.toBeInTheDocument();
      expect(screen.queryByText('Bob')).not.toBeInTheDocument();
      // Puzzle and element should still be visible
      expect(screen.getByText('The Missing Evidence')).toBeInTheDocument();
      expect(screen.getByText('Red Herring')).toBeInTheDocument();
    });
    
    // Toggle characters back on
    await user.click(characterCheckbox);
    
    // Verify characters are visible again
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });
  });

  it('should update URL with filter state', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(
      <div>
        <FilterPanel
          title="Character Filters"
          filters={{
            tiers: {
              type: 'multiselect',
              label: 'Character Tiers',
              options: [
                { value: 'Core', label: 'Core' },
                { value: 'Secondary', label: 'Secondary' },
                { value: 'Tertiary', label: 'Tertiary' }
              ]
            },
            search: {
              type: 'text',
              label: 'Search'
            }
          }}
        />
        <GraphView />
      </div>
    );
    
    // Apply tier filter
    const coreCheckbox = screen.getByLabelText('Core');
    await user.click(coreCheckbox);
    
    // Manually sync to URL (in real app this would be automatic)
    useFilterStore.getState().syncToUrl();
    
    // Check URL was updated
    await waitFor(() => {
      const urlDisplay = screen.getByTestId('current-url');
      expect(urlDisplay.textContent).toContain('tiers=Core');
    });
    
    // Apply another tier
    const secondaryCheckbox = screen.getByLabelText('Secondary');
    await user.click(secondaryCheckbox);
    useFilterStore.getState().syncToUrl();
    
    // Check URL has both tiers
    await waitFor(() => {
      const urlDisplay = screen.getByTestId('current-url');
      expect(urlDisplay.textContent).toMatch(/tiers=Core,Secondary|tiers=Secondary,Core/);
    });
    
    // Add search term
    useFilterStore.getState().setSearchTerm('Alice');
    useFilterStore.getState().syncToUrl();
    
    // Check URL has search
    await waitFor(() => {
      const urlDisplay = screen.getByTestId('current-url');
      expect(urlDisplay.textContent).toContain('search=Alice');
    });
  });

  it('should persist filters on navigation', async () => {
    const user = userEvent.setup();
    
    // Initial render with filters
    const { unmount } = renderWithProviders(
      <FilterPanel
        title="Puzzle Filters"
        filters={{
          acts: {
            type: 'multiselect',
            label: 'Acts',
            options: [
              { value: 'Act 0', label: 'Act 0' },
              { value: 'Act 1', label: 'Act 1' },
              { value: 'Act 2', label: 'Act 2' }
            ]
          }
        }}
      />
    );
    
    // Apply filters
    const act1Checkbox = screen.getByLabelText('Act 1');
    await user.click(act1Checkbox);
    
    // Verify filter is applied
    expect(useFilterStore.getState().puzzleFilters.selectedActs.has('Act 1')).toBe(true);
    
    // Verify sessionStorage has the filter
    const stored = sessionStorage.getItem('filter-storage');
    expect(stored).toBeTruthy();
    const parsedStorage = JSON.parse(stored!);
    expect(parsedStorage.state.puzzleFilters.selectedActs).toContain('Act 1');
    
    // Simulate navigation (unmount and remount)
    unmount();
    
    // Re-render the component (simulating navigation back)
    renderWithProviders(
      <FilterPanel
        title="Puzzle Filters"
        filters={{
          acts: {
            type: 'multiselect',
            label: 'Acts',
            options: [
              { value: 'Act 0', label: 'Act 0' },
              { value: 'Act 1', label: 'Act 1' },
              { value: 'Act 2', label: 'Act 2' }
            ]
          }
        }}
      />
    );
    
    // Verify filter persisted
    await waitFor(() => {
      const act1CheckboxAfterNav = screen.getByLabelText('Act 1');
      expect(act1CheckboxAfterNav).toBeChecked();
    });
    
    // Verify store state was restored
    expect(useFilterStore.getState().puzzleFilters.selectedActs.has('Act 1')).toBe(true);
  });

  it('should show filter status bar', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(
      <div>
        <FilterPanel
          title="Search"
          filters={{
            search: {
              type: 'text',
              label: 'Search entities'
            }
          }}
        />
        <GraphView />
      </div>
    );
    
    // Initially, no filter status bar (no active filters)
    expect(screen.queryByText(/nodes/)).not.toBeInTheDocument();
    
    // Apply a search filter
    useFilterStore.getState().setSearchTerm('Alice');
    
    // Mock the filtered graph response
    server.use(
      http.get('http://localhost:3001/api/graph/complete', () => {
        return HttpResponse.json({
          nodes: [mockGraphData.nodes[0]], // Only Alice
          edges: []
        });
      })
    );
    
    // Re-render to show filter status
    renderWithProviders(<GraphView />);
    
    // Verify filter status bar appears
    await waitFor(() => {
      // Status bar should show node count
      expect(screen.getByText(/1 \/ 4 nodes/)).toBeInTheDocument();
      // Should indicate hidden nodes
      expect(screen.getByText(/3 hidden/)).toBeInTheDocument();
    });
    
    // Clear filters
    useFilterStore.getState().clearSearch();
    
    // Mock full graph response
    server.use(
      http.get('http://localhost:3001/api/graph/complete', () => {
        return HttpResponse.json(mockGraphData);
      })
    );
    
    // Re-render without filters
    renderWithProviders(<GraphView />);
    
    // Status bar should disappear when no filters active
    await waitFor(() => {
      expect(screen.queryByText(/nodes/)).not.toBeInTheDocument();
    });
  });
});

describe('Filter edge cases', () => {
  // Server is already listening from the first describe block
  beforeEach(() => {
    useFilterStore.getState().clearAllFilters();
    sessionStorage.clear();
  });
  afterEach(() => server.resetHandlers());

  it('should handle multiple filter types simultaneously', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(
      <div>
        <FilterPanel
          title="Combined Filters"
          filters={{
            search: {
              type: 'text',
              label: 'Search'
            },
            tiers: {
              type: 'multiselect',
              label: 'Tiers',
              options: [
                { value: 'Core', label: 'Core' },
                { value: 'Secondary', label: 'Secondary' }
              ]
            },
            acts: {
              type: 'multiselect',
              label: 'Acts',
              options: [
                { value: 'Act 1', label: 'Act 1' }
              ]
            }
          }}
        />
      </div>
    );
    
    // Apply multiple filters
    useFilterStore.getState().setSearchTerm('test');
    await user.click(screen.getByLabelText('Core'));
    await user.click(screen.getByLabelText('Act 1'));
    
    // Verify all filters are active
    const state = useFilterStore.getState();
    expect(state.searchTerm).toBe('test');
    expect(state.characterFilters.selectedTiers.has('Core')).toBe(true);
    expect(state.puzzleFilters.selectedActs.has('Act 1')).toBe(true);
    expect(state.hasActiveFilters()).toBe(true);
    expect(state.activeFilterCount()).toBe(3);
  });

  it('should clear all filters at once', async () => {
    const user = userEvent.setup();
    
    // Set up multiple filters
    useFilterStore.getState().setSearchTerm('test');
    useFilterStore.getState().toggleTier('Core');
    useFilterStore.getState().toggleAct('Act 1');
    
    // Verify filters are set
    expect(useFilterStore.getState().hasActiveFilters()).toBe(true);
    
    // Clear all filters
    useFilterStore.getState().clearAllFilters();
    
    // Verify all filters cleared
    const state = useFilterStore.getState();
    expect(state.searchTerm).toBe('');
    expect(state.characterFilters.selectedTiers.size).toBe(0);
    expect(state.puzzleFilters.selectedActs.size).toBe(0);
    expect(state.hasActiveFilters()).toBe(false);
    expect(state.activeFilterCount()).toBe(0);
  });

  it('should handle filter presets', async () => {
    // Apply "critical-path" preset
    useFilterStore.getState().applyPreset('critical-path');
    
    // Verify preset filters applied
    const state = useFilterStore.getState();
    expect(state.puzzleFilters.selectedActs.has('Act 0')).toBe(true);
    expect(state.puzzleFilters.selectedActs.has('Act 1')).toBe(true);
    
    // Apply "my-work" preset
    useFilterStore.getState().applyPreset('my-work');
    
    // Verify ownership filter applied
    expect(useFilterStore.getState().characterFilters.ownershipStatus.has('Owned')).toBe(true);
  });
});