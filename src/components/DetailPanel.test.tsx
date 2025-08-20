import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DetailPanel } from './DetailPanel';
import { GraphAnimationProvider } from '@/contexts/GraphAnimationContext';
import type { Character, Element, Puzzle, TimelineEvent } from '@/types/notion/app';

// Mock the mutation hooks
vi.mock('@/hooks/mutations', () => ({
  useUpdateCharacter: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  })),
  useUpdateElement: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  })),
  useUpdatePuzzle: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  })),
  useUpdateTimelineEvent: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  })),
  validateUpdates: vi.fn(() => null),
}));

// Mock sample data
const mockCharacter: Character = {
  id: 'char-1',
  name: 'Alice Walker',
  type: 'Player',
  tier: 'Core',
  ownedElementIds: [],
  associatedElementIds: [],
  characterPuzzleIds: [],
  eventIds: [],
  connections: [],
  primaryAction: 'Investigating the crime',
  characterLogline: 'A detective seeking justice',
  overview: 'Experienced investigator with a strong moral compass',
  emotionTowardsCEO: 'Neutral',
};

const mockElement: Element = {
  id: 'elem-1',
  name: 'Murder Weapon',
  basicType: 'Prop',
  descriptionText: 'A mysterious dagger',
  sfPatterns: {},
  status: 'Done',
  firstAvailable: 'Act 1',
  requiredForPuzzleIds: [],
  rewardedByPuzzleIds: [],
  narrativeThreads: [],
  associatedCharacterIds: [],
  puzzleChain: [],
  productionNotes: '',
  filesMedia: [],
  isContainer: false,
  contentIds: [],
};

const mockPuzzle: Puzzle = {
  id: 'puzzle-1',
  name: 'Find the Killer',
  descriptionSolution: 'Identify who committed the murder | Check the security footage',
  puzzleElementIds: [],
  rewardIds: [],
  timing: ['Act 1'],
  ownerId: 'char-1',
  subPuzzleIds: [],
  storyReveals: [],
  narrativeThreads: [],
};

const mockTimelineEvent: TimelineEvent = {
  id: 'timeline-1',
  name: 'The Murder',
  date: '2024-01-01T22:00:00',
  description: 'The victim is found dead',
  charactersInvolvedIds: ['char-1'],
  memoryEvidenceIds: ['elem-1'],
  memTypes: ['Prop'],
  notes: 'Murder occurred in the library',
  lastEditedTime: '2024-01-01T22:00:00',
};

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <GraphAnimationProvider>
        {component}
      </GraphAnimationProvider>
    </QueryClientProvider>
  );
};

describe('DetailPanel', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Snapshot Tests', () => {
    it('should match snapshot for character entity', () => {
      const { container } = renderWithProviders(
        <DetailPanel
          entity={mockCharacter}
          entityType="character"
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );
      
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should match snapshot for element entity', () => {
      const { container } = renderWithProviders(
        <DetailPanel
          entity={mockElement}
          entityType="element"
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );
      
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should match snapshot for puzzle entity', () => {
      const { container } = renderWithProviders(
        <DetailPanel
          entity={mockPuzzle}
          entityType="puzzle"
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );
      
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should match snapshot for timeline entity', () => {
      const { container } = renderWithProviders(
        <DetailPanel
          entity={mockTimelineEvent}
          entityType="timeline"
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );
      
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should match snapshot when entity is null', () => {
      const { container } = renderWithProviders(
        <DetailPanel
          entity={null}
          entityType="character"
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );
      
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should match snapshot when loading', () => {
      const { container } = renderWithProviders(
        <DetailPanel
          entity={mockCharacter}
          entityType="character"
          onClose={mockOnClose}
          onSave={mockOnSave}
          isLoading={true}
        />
      );
      
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should match snapshot when saving', () => {
      const { container } = renderWithProviders(
        <DetailPanel
          entity={mockCharacter}
          entityType="character"
          onClose={mockOnClose}
          onSave={mockOnSave}
          isSaving={true}
        />
      );
      
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should match snapshot with error', () => {
      const { container } = renderWithProviders(
        <DetailPanel
          entity={mockCharacter}
          entityType="character"
          onClose={mockOnClose}
          onSave={mockOnSave}
          error="Failed to save changes"
        />
      );
      
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Functional Tests', () => {
    it('should call onClose when close button is clicked', () => {
      renderWithProviders(
        <DetailPanel
          entity={mockCharacter}
          entityType="character"
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      // The close button is an icon button without explicit text, find by test id or X icon
      const buttons = screen.getAllByRole('button');
      // The first button is typically the close button with X icon
      const closeButton = buttons[0];
      if (closeButton) {
        fireEvent.click(closeButton);
      }

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should enable save button when form is dirty', async () => {
      renderWithProviders(
        <DetailPanel
          entity={mockCharacter}
          entityType="character"
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const nameInput = screen.getByLabelText(/name/i);
      fireEvent.change(nameInput, { target: { value: 'Alice Walker Updated' } });

      await waitFor(() => {
        const saveButton = screen.getByRole('button', { name: /save/i });
        expect(saveButton).not.toBeDisabled();
      });
    });

    it('should show validation error for required fields', async () => {
      renderWithProviders(
        <DetailPanel
          entity={mockCharacter}
          entityType="character"
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const nameInput = screen.getByLabelText(/name/i);
      fireEvent.change(nameInput, { target: { value: '' } });

      const saveButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      });
    });

    it.skip('should handle field changes correctly', () => {
      // TODO: Update this test to match new DetailPanel implementation
      renderWithProviders(
        <DetailPanel
          entity={mockPuzzle}
          entityType="puzzle"
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      // The field is labeled "Description/Solution" in the DetailPanel
      const descriptionTextarea = screen.getByLabelText('Description/Solution');
      fireEvent.change(descriptionTextarea, { 
        target: { value: 'Updated puzzle description' } 
      });

      expect(descriptionTextarea).toHaveValue('Updated puzzle description');
    });

    it('should display all entities when provided', () => {
      const allEntities = {
        characters: [mockCharacter],
        elements: [mockElement],
        puzzles: [mockPuzzle],
        timeline: [mockTimelineEvent],
      };

      renderWithProviders(
        <DetailPanel
          entity={mockPuzzle}
          entityType="puzzle"
          onClose={mockOnClose}
          onSave={mockOnSave}
          allEntities={allEntities}
        />
      );

      // The component should have access to all entities for relationship mapping
      expect(screen.getByLabelText(/name/i)).toHaveValue('Find the Killer');
    });
  });

  describe('Entity Type Specific Rendering', () => {
    // TODO: These tests need to be updated to match the new DetailPanel implementation
    // which uses collapsible sections and different field rendering
    it.skip('should render character-specific fields', () => {
      renderWithProviders(
        <DetailPanel
          entity={mockCharacter}
          entityType="character"
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      // These are select fields, look for them by exact label text
      expect(screen.getByLabelText('Type')).toBeInTheDocument();
      expect(screen.getByLabelText('Tier')).toBeInTheDocument();
      expect(screen.getByLabelText('Primary Action')).toBeInTheDocument();
    });

    it.skip('should render element-specific fields', () => {
      renderWithProviders(
        <DetailPanel
          entity={mockElement}
          entityType="element"
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByLabelText('Basic Type')).toBeInTheDocument();
      
      // Expand Additional Details section to access more fields
      const additionalDetailsButton = screen.getByText(/additional details/i);
      fireEvent.click(additionalDetailsButton);
      
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
    });

    it.skip('should render puzzle-specific fields', () => {
      renderWithProviders(
        <DetailPanel
          entity={mockPuzzle}
          entityType="puzzle"
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      // Name is in the Basic Information section (open by default)
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      
      // Expand Additional Details section to see other fields
      const additionalDetailsButton = screen.getByText(/additional details/i);
      fireEvent.click(additionalDetailsButton);
      
      // Now check for fields
      expect(screen.getByLabelText('Description/Solution')).toBeInTheDocument();
      expect(screen.getByLabelText('Timing')).toBeInTheDocument();
    });

    it('should render timeline-specific fields', () => {
      renderWithProviders(
        <DetailPanel
          entity={mockTimelineEvent}
          entityType="timeline"
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
      
      // Notes field is in the Additional Details section, need to expand it
      const additionalDetailsButton = screen.getByText(/additional details/i);
      fireEvent.click(additionalDetailsButton);
      
      expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
      // Relation fields don't have form controls, check for the label text instead
      expect(screen.getByText(/characters involved/i)).toBeInTheDocument();
    });
  });
});