/**
 * Behavioral Tests for Entity Creation
 * 
 * These tests validate user-visible behavior when creating entities,
 * NOT implementation details. They use MSW for API mocking and test
 * the complete user journey from UI interaction to visual feedback.
 */

import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { ViewContextProvider } from '@/contexts/ViewContext';
import { CreatePanel } from '@/components/CreatePanel';
import GraphView from '@/components/graph/GraphView';
import type { Character, Element, Puzzle, TimelineEvent } from '@/types/notion/app';

// Mock server setup
const server = setupServer(
  // Character creation endpoint
  http.post('http://localhost:3001/api/notion/characters', async ({ request }) => {
    const body = await request.json() as any;
    const newCharacter: Character = {
      id: `char-${Date.now()}`,
      entityType: 'character',
      name: body.name,
      type: body.type,
      tier: body.tier,
      primaryAction: body.primaryAction || '',
      characterLogline: body.characterLogline || '',
      overview: body.overview || '',
      emotionTowardsCEO: body.emotionTowardsCEO || 'Neutral',
      ownedElementIds: [],
      associatedElementIds: [],
      characterPuzzleIds: body._parentRelation?.targetId ? [body._parentRelation.targetId] : [],
      eventIds: [],
      connections: []
    };
    
    return HttpResponse.json(newCharacter, { status: 201 });
  }),

  // Element creation endpoint
  http.post('http://localhost:3001/api/notion/elements', async ({ request }) => {
    const body = await request.json() as any;
    const newElement: Element = {
      id: `elem-${Date.now()}`,
      entityType: 'element',
      name: body.name,
      basicType: body.basicType,
      status: body.status,
      description: body.description || '',
      timingContext: body.timingContext || '',
      ownerId: body.ownerId || null,
      associatedCharacterIds: body.associatedCharacterIds || [],
      puzzles: body.puzzles || [],
      timeline: body.timeline || []
    };
    
    return HttpResponse.json(newElement, { status: 201 });
  }),

  // Puzzle creation endpoint
  http.post('http://localhost:3001/api/notion/puzzles', async ({ request }) => {
    const body = await request.json() as any;
    const newPuzzle: Puzzle = {
      id: `puzzle-${Date.now()}`,
      entityType: 'puzzle',
      name: body.name,
      timing: body.timing || [],
      action: body.action || '',
      storytellingPurpose: body.storytellingPurpose || '',
      characterIds: body.characterIds || [],
      elementIds: body.elementIds || [],
      timelineIds: body.timelineIds || []
    };
    
    return HttpResponse.json(newPuzzle, { status: 201 });
  }),

  // Graph data endpoint - returns created entities
  http.get('http://localhost:3001/api/graph/data', () => {
    return HttpResponse.json({
      nodes: [],
      edges: []
    });
  })
);

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
        </ViewContextProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

describe('User creates a character', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('should appear in the graph view after creation', async () => {
    const user = userEvent.setup();
    
    // Render the create panel
    renderWithProviders(<CreatePanel />);
    
    // User selects character type
    const typeSelector = screen.getByLabelText(/entity type/i);
    await user.selectOptions(typeSelector, 'character');
    
    // User fills in character details
    await user.type(screen.getByLabelText(/name/i), 'Alice');
    
    const characterTypeField = screen.getByLabelText(/character type/i);
    await user.selectOptions(characterTypeField, 'Player');
    
    const tierField = screen.getByLabelText(/tier/i);
    await user.selectOptions(tierField, 'Core');
    
    // User saves the character
    const saveButton = screen.getByRole('button', { name: /save|create/i });
    await user.click(saveButton);
    
    // Verify success feedback
    await waitFor(() => {
      expect(screen.getByText(/created successfully/i)).toBeInTheDocument();
    });
  });

  it('should be saved to the backend', async () => {
    const user = userEvent.setup();
    let capturedRequest: any = null;
    
    // Capture the request
    server.use(
      http.post('http://localhost:3001/api/notion/characters', async ({ request }) => {
        capturedRequest = await request.json();
        return HttpResponse.json({ 
          id: 'char-123',
          ...capturedRequest 
        }, { status: 201 });
      })
    );
    
    renderWithProviders(<CreatePanel />);
    
    // Create a character
    await user.selectOptions(screen.getByLabelText(/entity type/i), 'character');
    await user.type(screen.getByLabelText(/name/i), 'Bob');
    await user.selectOptions(screen.getByLabelText(/character type/i), 'NPC');
    await user.selectOptions(screen.getByLabelText(/tier/i), 'Secondary');
    await user.click(screen.getByRole('button', { name: /save|create/i }));
    
    // Verify the correct data was sent
    await waitFor(() => {
      expect(capturedRequest).toEqual(expect.objectContaining({
        name: 'Bob',
        type: 'NPC',
        tier: 'Secondary'
      }));
    });
  });

  it('should show validation errors for missing required fields', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(<CreatePanel />);
    
    // Try to save without filling required fields
    await user.selectOptions(screen.getByLabelText(/entity type/i), 'character');
    await user.click(screen.getByRole('button', { name: /save|create/i }));
    
    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });
  });

  it('should handle server errors gracefully', async () => {
    const user = userEvent.setup();
    
    // Mock server error
    server.use(
      http.post('http://localhost:3001/api/notion/characters', () => {
        return HttpResponse.json(
          { error: 'Database connection failed' },
          { status: 500 }
        );
      })
    );
    
    renderWithProviders(<CreatePanel />);
    
    // Try to create a character
    await user.selectOptions(screen.getByLabelText(/entity type/i), 'character');
    await user.type(screen.getByLabelText(/name/i), 'Charlie');
    await user.selectOptions(screen.getByLabelText(/character type/i), 'Player');
    await user.selectOptions(screen.getByLabelText(/tier/i), 'Core');
    await user.click(screen.getByRole('button', { name: /save|create/i }));
    
    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/failed to create/i)).toBeInTheDocument();
    });
    
    // Form should still be usable for retry
    expect(screen.getByLabelText(/name/i)).toHaveValue('Charlie');
  });
});

describe('User creates an element', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('should create element with proper type and status', async () => {
    const user = userEvent.setup();
    let capturedRequest: any = null;
    
    server.use(
      http.post('http://localhost:3001/api/notion/elements', async ({ request }) => {
        capturedRequest = await request.json();
        return HttpResponse.json({ 
          id: 'elem-123',
          ...capturedRequest 
        }, { status: 201 });
      })
    );
    
    renderWithProviders(<CreatePanel />);
    
    // Select element type
    await user.selectOptions(screen.getByLabelText(/entity type/i), 'element');
    
    // Fill element details
    await user.type(screen.getByLabelText(/name/i), 'Red Herring');
    await user.selectOptions(screen.getByLabelText(/basic type/i), 'Clue');
    await user.selectOptions(screen.getByLabelText(/status/i), 'Complete');
    
    // Save
    await user.click(screen.getByRole('button', { name: /save|create/i }));
    
    // Verify correct data sent
    await waitFor(() => {
      expect(capturedRequest).toEqual(expect.objectContaining({
        name: 'Red Herring',
        basicType: 'Clue',
        status: 'Complete'
      }));
    });
  });

  it('should allow linking element to character as owner', async () => {
    const user = userEvent.setup();
    
    // Mock existing characters for selection
    server.use(
      http.get('http://localhost:3001/api/notion/characters', () => {
        return HttpResponse.json({
          data: [
            { id: 'char-1', name: 'Alice', type: 'Player', tier: 'Core' },
            { id: 'char-2', name: 'Bob', type: 'NPC', tier: 'Secondary' }
          ]
        });
      })
    );
    
    renderWithProviders(<CreatePanel />);
    
    // Select element and fill basic info
    await user.selectOptions(screen.getByLabelText(/entity type/i), 'element');
    await user.type(screen.getByLabelText(/name/i), 'Important Item');
    
    // Select owner
    const ownerField = screen.getByLabelText(/owner/i);
    await user.selectOptions(ownerField, 'char-1');
    
    // Verify selection
    expect(ownerField).toHaveValue('char-1');
  });
});

describe('User creates a puzzle', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('should create puzzle with timing and linked entities', async () => {
    const user = userEvent.setup();
    let capturedRequest: any = null;
    
    server.use(
      http.post('http://localhost:3001/api/notion/puzzles', async ({ request }) => {
        capturedRequest = await request.json();
        return HttpResponse.json({ 
          id: 'puzzle-123',
          ...capturedRequest 
        }, { status: 201 });
      })
    );
    
    renderWithProviders(<CreatePanel />);
    
    // Select puzzle type
    await user.selectOptions(screen.getByLabelText(/entity type/i), 'puzzle');
    
    // Fill puzzle details
    await user.type(screen.getByLabelText(/name/i), 'The Missing Evidence');
    
    // Select timing (multi-select)
    const timingField = screen.getByLabelText(/timing/i);
    await user.selectOptions(timingField, ['Act 1', 'Act 2']);
    
    // Save
    await user.click(screen.getByRole('button', { name: /save|create/i }));
    
    // Verify correct data sent
    await waitFor(() => {
      expect(capturedRequest).toEqual(expect.objectContaining({
        name: 'The Missing Evidence',
        timing: expect.arrayContaining(['Act 1', 'Act 2'])
      }));
    });
  });
});

describe('User creates entity from parent context', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('should create character linked to puzzle when created from puzzle detail', async () => {
    const user = userEvent.setup();
    let capturedRequest: any = null;
    
    server.use(
      http.post('http://localhost:3001/api/notion/characters', async ({ request }) => {
        capturedRequest = await request.json();
        return HttpResponse.json({ 
          id: 'char-new',
          ...capturedRequest 
        }, { status: 201 });
      })
    );
    
    // Simulate being in puzzle context
    const parentContext = {
      parentId: 'puzzle-parent',
      parentType: 'puzzle',
      relationField: 'characterIds'
    };
    
    renderWithProviders(
      <CreatePanel initialParentContext={parentContext} />
    );
    
    // Should default to character type when creating from puzzle
    const typeField = screen.getByLabelText(/entity type/i);
    expect(typeField).toHaveValue('character');
    
    // Fill character details
    await user.type(screen.getByLabelText(/name/i), 'Detective');
    await user.selectOptions(screen.getByLabelText(/character type/i), 'NPC');
    await user.selectOptions(screen.getByLabelText(/tier/i), 'Core');
    
    // Save
    await user.click(screen.getByRole('button', { name: /save|create/i }));
    
    // Verify parent relation was included
    await waitFor(() => {
      expect(capturedRequest).toEqual(expect.objectContaining({
        name: 'Detective',
        _parentRelation: {
          targetId: 'puzzle-parent',
          targetType: 'puzzle',
          field: 'characterIds'
        }
      }));
    });
  });
});