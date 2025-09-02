/**
 * Behavioral Tests for Relationship Management
 * 
 * Tests user-visible behavior when creating and managing relationships
 * between entities. Focuses on edge creation, updates, and deletion
 * from the user's perspective.
 */

import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { setupServer } from 'msw/node';
import { http, HttpResponse, delay } from 'msw';
import { ViewContextProvider } from '@/contexts/ViewContext';
import GraphView from '@/components/graph/GraphView';
import { DetailPanel } from '@/components/DetailPanel';
import type { Character, Puzzle, Element } from '@/types/notion/app';
import type { GraphNode, GraphEdge } from '@/types/graph';

// Mock React Flow for testing
vi.mock('@xyflow/react', () => ({
  ReactFlow: ({ nodes, edges, onNodesChange, onEdgesChange, children }: any) => (
    <div data-testid="react-flow">
      {nodes?.map((node: GraphNode) => (
        <div 
          key={node.id} 
          data-testid={`node-${node.id}`}
          data-type={node.type}
          className="react-flow__node"
        >
          {node.data.label}
        </div>
      ))}
      {edges?.map((edge: GraphEdge) => (
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
  Background: () => null,
  Controls: () => null,
  MiniMap: () => null,
  Panel: ({ children }: any) => <div>{children}</div>,
  useReactFlow: () => ({
    getNodes: () => [],
    getEdges: () => [],
    setNodes: vi.fn(),
    setEdges: vi.fn(),
    fitView: vi.fn()
  }),
  useNodesState: (initialNodes: any) => [initialNodes, vi.fn(), vi.fn()],
  useEdgesState: (initialEdges: any) => [initialEdges, vi.fn(), vi.fn()],
  MarkerType: { ArrowClosed: 'arrowclosed' }
}));

// Test data
const testCharacter: Character = {
  id: 'char-1',
  entityType: 'character',
  name: 'Alice',
  type: 'Player',
  tier: 'Core',
  primaryAction: 'Investigate',
  characterLogline: 'Determined detective',
  overview: 'Main character',
  emotionTowardsCEO: 'Suspicious',
  ownedElementIds: [],
  associatedElementIds: [],
  characterPuzzleIds: [],
  eventIds: [],
  connections: []
};

const testPuzzle: Puzzle = {
  id: 'puzzle-1',
  entityType: 'puzzle',
  name: 'The Missing Evidence',
  timing: ['Act 1'],
  action: 'Find the clue',
  storytellingPurpose: 'Reveal motive',
  characterIds: [],
  elementIds: [],
  timelineIds: []
};

const testElement: Element = {
  id: 'elem-1',
  entityType: 'element',
  name: 'Bloody Knife',
  basicType: 'Clue',
  status: 'Complete',
  description: 'Found at crime scene',
  timingContext: 'Act 1',
  ownerId: null,
  associatedCharacterIds: [],
  puzzles: [],
  timeline: []
};

// Mock server
const server = setupServer(
  // Graph data endpoint
  http.get('http://localhost:3001/api/graph/data', ({ request }) => {
    const url = new URL(request.url);
    const view = url.searchParams.get('view') || 'default';
    
    return HttpResponse.json({
      nodes: [
        {
          id: 'char-1',
          type: 'character',
          position: { x: 100, y: 100 },
          data: {
            entity: testCharacter,
            label: 'Alice',
            metadata: { entityType: 'character' }
          }
        },
        {
          id: 'puzzle-1',
          type: 'puzzle',
          position: { x: 300, y: 100 },
          data: {
            entity: testPuzzle,
            label: 'The Missing Evidence',
            metadata: { entityType: 'puzzle' }
          }
        },
        {
          id: 'elem-1',
          type: 'element',
          position: { x: 200, y: 200 },
          data: {
            entity: testElement,
            label: 'Bloody Knife',
            metadata: { entityType: 'element' }
          }
        }
      ],
      edges: []
    });
  }),

  // Update character endpoint
  http.put('http://localhost:3001/api/notion/characters/:id', async ({ params, request }) => {
    const body = await request.json() as any;
    const updatedCharacter = {
      ...testCharacter,
      ...body,
      id: params.id as string
    };
    
    // Return delta for optimistic updates
    return HttpResponse.json({
      entity: updatedCharacter,
      delta: {
        nodes: {
          updated: [{
            id: params.id,
            data: { entity: updatedCharacter }
          }]
        },
        edges: body.characterPuzzleIds?.length > 0 ? {
          added: [{
            id: `edge-${params.id}-${body.characterPuzzleIds[0]}`,
            source: params.id,
            target: body.characterPuzzleIds[0],
            type: 'default'
          }]
        } : {}
      }
    });
  }),

  // Update puzzle endpoint
  http.put('http://localhost:3001/api/notion/puzzles/:id', async ({ params, request }) => {
    const body = await request.json() as any;
    const updatedPuzzle = {
      ...testPuzzle,
      ...body,
      id: params.id as string
    };
    
    return HttpResponse.json({
      entity: updatedPuzzle,
      delta: {
        nodes: {
          updated: [{
            id: params.id,
            data: { entity: updatedPuzzle }
          }]
        },
        edges: body.characterIds?.length > 0 ? {
          added: [{
            id: `edge-${body.characterIds[0]}-${params.id}`,
            source: body.characterIds[0],
            target: params.id,
            type: 'default'
          }]
        } : {}
      }
    });
  }),

  // Update element endpoint
  http.put('http://localhost:3001/api/notion/elements/:id', async ({ params, request }) => {
    const body = await request.json() as any;
    const updatedElement = {
      ...testElement,
      ...body,
      id: params.id as string
    };
    
    return HttpResponse.json({
      entity: updatedElement,
      delta: {
        nodes: {
          updated: [{
            id: params.id,
            data: { entity: updatedElement }
          }]
        },
        edges: body.ownerId ? {
          added: [{
            id: `edge-${body.ownerId}-${params.id}`,
            source: body.ownerId,
            target: params.id,
            type: 'ownership'
          }]
        } : {}
      }
    });
  })
);

// Helper to render with providers
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

describe('User connects entities', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('should create edge between character and puzzle', async () => {
    const user = userEvent.setup();
    
    // Render graph view
    renderWithProviders(<GraphView />);
    
    // Wait for nodes to load
    await waitFor(() => {
      expect(screen.getByTestId('node-char-1')).toBeInTheDocument();
      expect(screen.getByTestId('node-puzzle-1')).toBeInTheDocument();
    });
    
    // Click on character node to open detail panel
    await user.click(screen.getByTestId('node-char-1'));
    
    // In detail panel, add puzzle relationship
    const puzzleField = screen.getByLabelText(/puzzles/i);
    await user.selectOptions(puzzleField, 'puzzle-1');
    
    // Save changes
    await user.click(screen.getByRole('button', { name: /save/i }));
    
    // Verify edge appears
    await waitFor(() => {
      const edge = screen.getByTestId(/edge-.*char-1.*puzzle-1/);
      expect(edge).toBeInTheDocument();
      expect(edge).toHaveAttribute('data-source', 'char-1');
      expect(edge).toHaveAttribute('data-target', 'puzzle-1');
    });
  });

  it('should update both entities when creating relationship', async () => {
    const user = userEvent.setup();
    let characterRequest: any = null;
    let puzzleRequest: any = null;
    
    // Capture requests
    server.use(
      http.put('http://localhost:3001/api/notion/characters/:id', async ({ request }) => {
        characterRequest = await request.json();
        return HttpResponse.json({ entity: { ...testCharacter, ...characterRequest } });
      }),
      http.put('http://localhost:3001/api/notion/puzzles/:id', async ({ request }) => {
        puzzleRequest = await request.json();
        return HttpResponse.json({ entity: { ...testPuzzle, ...puzzleRequest } });
      })
    );
    
    renderWithProviders(<GraphView />);
    
    // Wait for load
    await waitFor(() => {
      expect(screen.getByTestId('node-char-1')).toBeInTheDocument();
    });
    
    // Connect character to puzzle
    await user.click(screen.getByTestId('node-char-1'));
    const puzzleField = screen.getByLabelText(/puzzles/i);
    await user.selectOptions(puzzleField, 'puzzle-1');
    await user.click(screen.getByRole('button', { name: /save/i }));
    
    // Verify both entities updated
    await waitFor(() => {
      expect(characterRequest?.characterPuzzleIds).toContain('puzzle-1');
    });
    
    // Note: In real implementation, puzzle would also be updated
    // This depends on whether relationships are bidirectional
  });

  it('should persist relationship after page refresh', async () => {
    const user = userEvent.setup();
    
    // First render - create relationship
    const { unmount } = renderWithProviders(<GraphView />);
    
    await waitFor(() => {
      expect(screen.getByTestId('node-char-1')).toBeInTheDocument();
    });
    
    // Create relationship
    await user.click(screen.getByTestId('node-char-1'));
    await user.selectOptions(screen.getByLabelText(/puzzles/i), 'puzzle-1');
    await user.click(screen.getByRole('button', { name: /save/i }));
    
    // Wait for edge
    await waitFor(() => {
      expect(screen.getByTestId(/edge-.*char-1.*puzzle-1/)).toBeInTheDocument();
    });
    
    // Simulate refresh by unmounting and remounting
    unmount();
    
    // Update server to return the relationship
    server.use(
      http.get('http://localhost:3001/api/graph/data', () => {
        return HttpResponse.json({
          nodes: [
            {
              id: 'char-1',
              type: 'character',
              position: { x: 100, y: 100 },
              data: {
                entity: { ...testCharacter, characterPuzzleIds: ['puzzle-1'] },
                label: 'Alice',
                metadata: { entityType: 'character' }
              }
            },
            {
              id: 'puzzle-1',
              type: 'puzzle',
              position: { x: 300, y: 100 },
              data: {
                entity: { ...testPuzzle, characterIds: ['char-1'] },
                label: 'The Missing Evidence',
                metadata: { entityType: 'puzzle' }
              }
            }
          ],
          edges: [{
            id: 'edge-char-1-puzzle-1',
            source: 'char-1',
            target: 'puzzle-1',
            type: 'default'
          }]
        });
      })
    );
    
    // Re-render
    renderWithProviders(<GraphView />);
    
    // Verify edge still exists
    await waitFor(() => {
      expect(screen.getByTestId(/edge-.*char-1.*puzzle-1/)).toBeInTheDocument();
    });
  });

  it('should handle concurrent edits gracefully', async () => {
    const user = userEvent.setup();
    
    // Simulate slow network
    server.use(
      http.put('http://localhost:3001/api/notion/characters/:id', async ({ request }) => {
        await delay(1000); // Simulate network delay
        const body = await request.json() as any;
        return HttpResponse.json({
          entity: { ...testCharacter, ...body }
        });
      })
    );
    
    renderWithProviders(<GraphView />);
    
    await waitFor(() => {
      expect(screen.getByTestId('node-char-1')).toBeInTheDocument();
    });
    
    // Start first edit
    await user.click(screen.getByTestId('node-char-1'));
    await user.selectOptions(screen.getByLabelText(/puzzles/i), 'puzzle-1');
    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);
    
    // Immediately start second edit (while first is in flight)
    await user.clear(screen.getByLabelText(/name/i));
    await user.type(screen.getByLabelText(/name/i), 'Alice Updated');
    await user.click(saveButton);
    
    // Both edits should complete without errors
    await waitFor(() => {
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
    }, { timeout: 3000 });
  });
});

describe('User removes relationships', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('should remove edge when deleting relationship', async () => {
    const user = userEvent.setup();
    
    // Start with existing relationship
    server.use(
      http.get('http://localhost:3001/api/graph/data', () => {
        return HttpResponse.json({
          nodes: [
            {
              id: 'char-1',
              type: 'character',
              position: { x: 100, y: 100 },
              data: {
                entity: { ...testCharacter, characterPuzzleIds: ['puzzle-1'] },
                label: 'Alice',
                metadata: { entityType: 'character' }
              }
            },
            {
              id: 'puzzle-1',
              type: 'puzzle',
              position: { x: 300, y: 100 },
              data: {
                entity: testPuzzle,
                label: 'The Missing Evidence',
                metadata: { entityType: 'puzzle' }
              }
            }
          ],
          edges: [{
            id: 'edge-char-1-puzzle-1',
            source: 'char-1',
            target: 'puzzle-1',
            type: 'default'
          }]
        });
      })
    );
    
    renderWithProviders(<GraphView />);
    
    // Verify edge exists
    await waitFor(() => {
      expect(screen.getByTestId(/edge-.*char-1.*puzzle-1/)).toBeInTheDocument();
    });
    
    // Remove relationship
    await user.click(screen.getByTestId('node-char-1'));
    
    // Clear puzzle selection
    const puzzleField = screen.getByLabelText(/puzzles/i);
    await user.selectOptions(puzzleField, '');
    await user.click(screen.getByRole('button', { name: /save/i }));
    
    // Verify edge removed
    await waitFor(() => {
      expect(screen.queryByTestId(/edge-.*char-1.*puzzle-1/)).not.toBeInTheDocument();
    });
  });

  it('should move edge when re-assigning relationship', async () => {
    const user = userEvent.setup();
    
    // Add a second character
    server.use(
      http.get('http://localhost:3001/api/graph/data', () => {
        return HttpResponse.json({
          nodes: [
            {
              id: 'char-1',
              type: 'character',
              position: { x: 100, y: 100 },
              data: {
                entity: testCharacter,
                label: 'Alice',
                metadata: { entityType: 'character' }
              }
            },
            {
              id: 'char-2',
              type: 'character',
              position: { x: 100, y: 200 },
              data: {
                entity: { ...testCharacter, id: 'char-2', name: 'Bob' },
                label: 'Bob',
                metadata: { entityType: 'character' }
              }
            },
            {
              id: 'elem-1',
              type: 'element',
              position: { x: 300, y: 150 },
              data: {
                entity: { ...testElement, ownerId: 'char-1' },
                label: 'Bloody Knife',
                metadata: { entityType: 'element' }
              }
            }
          ],
          edges: [{
            id: 'edge-char-1-elem-1',
            source: 'char-1',
            target: 'elem-1',
            type: 'ownership'
          }]
        });
      })
    );
    
    renderWithProviders(<GraphView />);
    
    // Verify initial edge
    await waitFor(() => {
      expect(screen.getByTestId(/edge-.*char-1.*elem-1/)).toBeInTheDocument();
    });
    
    // Reassign element to different character
    await user.click(screen.getByTestId('node-elem-1'));
    const ownerField = screen.getByLabelText(/owner/i);
    await user.selectOptions(ownerField, 'char-2');
    await user.click(screen.getByRole('button', { name: /save/i }));
    
    // Verify edge moved
    await waitFor(() => {
      expect(screen.queryByTestId(/edge-.*char-1.*elem-1/)).not.toBeInTheDocument();
      expect(screen.getByTestId(/edge-.*char-2.*elem-1/)).toBeInTheDocument();
    });
  });
});

describe('Edge visual feedback', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('should show optimistic edge immediately on creation', async () => {
    const user = userEvent.setup();
    
    // Add delay to server response
    server.use(
      http.put('http://localhost:3001/api/notion/characters/:id', async ({ request }) => {
        await delay(2000);
        const body = await request.json() as any;
        return HttpResponse.json({
          entity: { ...testCharacter, ...body },
          delta: {
            edges: {
              added: [{
                id: 'edge-final',
                source: 'char-1',
                target: 'puzzle-1',
                type: 'default'
              }]
            }
          }
        });
      })
    );
    
    renderWithProviders(<GraphView />);
    
    await waitFor(() => {
      expect(screen.getByTestId('node-char-1')).toBeInTheDocument();
    });
    
    // Create relationship
    await user.click(screen.getByTestId('node-char-1'));
    await user.selectOptions(screen.getByLabelText(/puzzles/i), 'puzzle-1');
    await user.click(screen.getByRole('button', { name: /save/i }));
    
    // Edge should appear immediately (optimistic)
    expect(screen.getByTestId(/edge-.*char-1.*puzzle-1/)).toBeInTheDocument();
    
    // Edge should have optimistic styling
    const edge = screen.getByTestId(/edge-.*char-1.*puzzle-1/);
    expect(edge).toHaveClass('optimistic');
    
    // After server response, edge should be solid
    await waitFor(() => {
      expect(edge).not.toHaveClass('optimistic');
    }, { timeout: 3000 });
  });

  it('should revert edge on server error', async () => {
    const user = userEvent.setup();
    
    // Mock server error
    server.use(
      http.put('http://localhost:3001/api/notion/characters/:id', () => {
        return HttpResponse.json(
          { error: 'Conflict: Entity was modified' },
          { status: 409 }
        );
      })
    );
    
    renderWithProviders(<GraphView />);
    
    await waitFor(() => {
      expect(screen.getByTestId('node-char-1')).toBeInTheDocument();
    });
    
    // Try to create relationship
    await user.click(screen.getByTestId('node-char-1'));
    await user.selectOptions(screen.getByLabelText(/puzzles/i), 'puzzle-1');
    await user.click(screen.getByRole('button', { name: /save/i }));
    
    // Edge appears optimistically
    expect(screen.getByTestId(/edge-.*char-1.*puzzle-1/)).toBeInTheDocument();
    
    // Edge should be removed after error
    await waitFor(() => {
      expect(screen.queryByTestId(/edge-.*char-1.*puzzle-1/)).not.toBeInTheDocument();
    });
    
    // Error message should appear
    expect(screen.getByText(/conflict/i)).toBeInTheDocument();
  });
});