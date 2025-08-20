import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@/test/utils';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import CharacterJourneyView from './CharacterJourneyView';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the hooks
vi.mock('@/hooks/useCharacterJourneyData', () => ({
  useCharacterJourneyData: vi.fn()
}));

vi.mock('@/hooks/useGraphInteractions', () => ({
  useGraphDragDrop: vi.fn(() => ({ isDragging: false }))
}));

// Mock the components
vi.mock('@/components/graph/GraphView', () => ({
  default: vi.fn(({ onNodeClick }) => (
    <div data-testid="graph-view">
      <button onClick={() => onNodeClick({ id: 'test-node' })}>Test Node</button>
    </div>
  ))
}));

vi.mock('@/components/CharacterSelector', () => ({
  CharacterSelector: vi.fn(({ className }) => (
    <div data-testid="character-selector" className={className}>Character Selector</div>
  ))
}));

vi.mock('@/components/FilterSection', () => ({
  FilterSection: vi.fn(() => <div data-testid="filter-section">Filter Section</div>)
}));

vi.mock('@/components/common/LoadingSkeleton', () => ({
  default: vi.fn(({ variant }) => <div data-testid="loading-skeleton">{variant}</div>)
}));

vi.mock('@/components/common/ErrorDisplay', () => ({
  ErrorDisplay: vi.fn(({ error }) => <div data-testid="error-display">{error.message}</div>)
}));

vi.mock('@/components/DetailPanel', () => ({
  default: vi.fn(({ entity, onClose }) => (
    <div data-testid="detail-panel">
      {entity && <div>Detail panel for entity: {entity.name || entity.id}</div>}
      <button onClick={onClose}>Close</button>
    </div>
  ))
}));

// Mock React Flow styles
vi.mock('@xyflow/react/dist/style.css', () => ({}));

const mockCharacterData = {
  characters: [
    {
      id: 'char-1',
      name: 'John Doe',
      tier: 'Core',
      type: 'Detective',
      description: 'A skilled detective'
    },
    {
      id: 'char-2',
      name: 'Jane Smith',
      tier: 'Secondary',
      type: 'Scientist',
      description: 'A brilliant scientist'
    }
  ],
  elements: [],
  puzzles: [],
  timeline: []
};

describe('CharacterJourneyView', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderWithRouter = (initialPath = '/character-journey') => {
    // Set the initial path using window.history
    window.history.pushState({}, 'Test page', initialPath);
    
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/character-journey" element={<CharacterJourneyView />} />
            <Route path="/character-journey/:characterId" element={<CharacterJourneyView />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  describe('Loading State', () => {
    it('shows loading spinner when data is loading', async () => {
      const { useCharacterJourneyData } = vi.mocked(await import('@/hooks/useCharacterJourneyData'));
      useCharacterJourneyData.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null
      } as any);

      renderWithRouter();
      
      expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
      expect(screen.getByText('Loading character ownership paths...')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('shows error display when there is an error', async () => {
      const { useCharacterJourneyData } = vi.mocked(await import('@/hooks/useCharacterJourneyData'));
      useCharacterJourneyData.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to load data')
      } as any);

      renderWithRouter();
      
      expect(screen.getByTestId('error-display')).toBeInTheDocument();
      expect(screen.getByText('Failed to load data')).toBeInTheDocument();
    });

    it('shows error display when no data is available', async () => {
      const { useCharacterJourneyData } = vi.mocked(await import('@/hooks/useCharacterJourneyData'));
      useCharacterJourneyData.mockReturnValue({
        data: null,
        isLoading: false,
        error: null
      } as any);

      renderWithRouter();
      
      expect(screen.getByTestId('error-display')).toBeInTheDocument();
      expect(screen.getByText('No data available')).toBeInTheDocument();
    });
  });

  describe('Character Selection', () => {
    it('shows character selector when no character is selected', async () => {
      const { useCharacterJourneyData } = vi.mocked(await import('@/hooks/useCharacterJourneyData'));
      useCharacterJourneyData.mockReturnValue({
        data: mockCharacterData,
        isLoading: false,
        error: null
      } as any);

      renderWithRouter('/character-journey');
      
      expect(screen.getByText('Select a Character')).toBeInTheDocument();
      expect(screen.getByText('Choose a character to explore their ownership paths and story journey')).toBeInTheDocument();
      expect(screen.getByTestId('character-selector')).toBeInTheDocument();
    });

    it('redirects to base route when character is not found', async () => {
      const { useCharacterJourneyData } = vi.mocked(await import('@/hooks/useCharacterJourneyData'));
      useCharacterJourneyData.mockReturnValue({
        data: mockCharacterData,
        isLoading: false,
        error: null
      } as any);

      renderWithRouter('/character-journey/invalid-char');
      
      // Should redirect back to character selection
      expect(screen.queryByTestId('character-journey-view')).not.toBeInTheDocument();
    });
  });

  describe('Character Journey Display', () => {
    beforeEach(async () => {
      const { useCharacterJourneyData } = vi.mocked(await import('@/hooks/useCharacterJourneyData'));
      useCharacterJourneyData.mockReturnValue({
        data: mockCharacterData,
        isLoading: false,
        error: null
      } as any);
    });

    it('displays selected character information', () => {
      renderWithRouter('/character-journey/char-1');
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Core')).toBeInTheDocument();
      expect(screen.getByText('Detective')).toBeInTheDocument();
    });

    it('renders graph view with character data', () => {
      renderWithRouter('/character-journey/char-1');
      
      expect(screen.getByTestId('graph-view')).toBeInTheDocument();
    });

    it('shows character selector for switching characters', () => {
      renderWithRouter('/character-journey/char-1');
      
      const selectors = screen.getAllByTestId('character-selector');
      expect(selectors.length).toBeGreaterThan(0);
      expect(selectors[0]).toHaveClass('ml-auto');
    });
  });

  describe('View Controls', () => {
    beforeEach(async () => {
      const { useCharacterJourneyData } = vi.mocked(await import('@/hooks/useCharacterJourneyData'));
      useCharacterJourneyData.mockReturnValue({
        data: mockCharacterData,
        isLoading: false,
        error: null
      } as any);
    });

    it('toggles between filtered and full-web view modes', () => {
      renderWithRouter('/character-journey/char-1');
      
      const filteredButton = screen.getByRole('button', { name: 'Filtered' });
      const fullWebButton = screen.getByRole('button', { name: 'Full Web' });
      
      // Initially filtered mode is active
      expect(filteredButton).toHaveClass('h-7');
      
      // Click Full Web
      fireEvent.click(fullWebButton);
      
      // Depth selector should appear
      expect(screen.getByLabelText('Connection Depth:')).toBeInTheDocument();
    });

    it('shows depth control in full-web mode', () => {
      renderWithRouter('/character-journey/char-1');
      
      const fullWebButton = screen.getByRole('button', { name: 'Full Web' });
      fireEvent.click(fullWebButton);
      
      const depthSelect = screen.getByLabelText('Connection Depth:') as HTMLSelectElement;
      expect(depthSelect).toBeInTheDocument();
      expect(depthSelect.value).toBe('3'); // Default depth
      
      // Change depth
      fireEvent.change(depthSelect, { target: { value: '5' } });
      expect(depthSelect.value).toBe('5');
    });

    it('shows filter controls in filtered mode', () => {
      renderWithRouter('/character-journey/char-1');
      
      expect(screen.getByLabelText('Show only owned')).toBeInTheDocument();
      expect(screen.getByLabelText('Show accessible')).toBeInTheDocument();
      expect(screen.getByLabelText(/Highlight shared/)).toBeInTheDocument();
    });

    it('toggles filter visibility', () => {
      renderWithRouter('/character-journey/char-1');
      
      const filterButton = screen.getByRole('button', { name: /Filters/ });
      
      // Initially filters are hidden
      expect(screen.queryByTestId('filter-section')).not.toBeInTheDocument();
      
      // Click to show filters
      fireEvent.click(filterButton);
      expect(screen.getByTestId('filter-section')).toBeInTheDocument();
      
      // Click to hide filters
      fireEvent.click(filterButton);
      expect(screen.queryByTestId('filter-section')).not.toBeInTheDocument();
    });
  });

  describe('Checkbox Controls', () => {
    beforeEach(async () => {
      const { useCharacterJourneyData } = vi.mocked(await import('@/hooks/useCharacterJourneyData'));
      useCharacterJourneyData.mockReturnValue({
        data: mockCharacterData,
        isLoading: false,
        error: null
      } as any);
    });

    it('toggles show only owned checkbox', () => {
      renderWithRouter('/character-journey/char-1');
      
      const checkbox = screen.getByRole('checkbox', { name: 'Show only owned' });
      expect(checkbox).toBeChecked();
      
      fireEvent.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });

    it('toggles show accessible checkbox', () => {
      renderWithRouter('/character-journey/char-1');
      
      const checkbox = screen.getByRole('checkbox', { name: 'Show accessible' });
      expect(checkbox).toBeChecked();
      
      fireEvent.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });

    it('toggles highlight shared checkbox', () => {
      renderWithRouter('/character-journey/char-1');
      
      const checkbox = screen.getByRole('checkbox', { name: /Highlight shared/ });
      expect(checkbox).not.toBeChecked();
      
      fireEvent.click(checkbox);
      expect(checkbox).toBeChecked();
    });
  });

  describe('Node Interaction', () => {
    beforeEach(async () => {
      const { useCharacterJourneyData } = vi.mocked(await import('@/hooks/useCharacterJourneyData'));
      useCharacterJourneyData.mockReturnValue({
        data: mockCharacterData,
        isLoading: false,
        error: null
      } as any);
    });

    it('handles node click and shows detail panel', () => {
      renderWithRouter('/character-journey/char-1');
      
      const testNode = screen.getByText('Test Node');
      fireEvent.click(testNode);
      
      expect(screen.getByTestId('detail-panel')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    });

    it('closes detail panel when close button is clicked', () => {
      renderWithRouter('/character-journey/char-1');
      
      // Open detail panel
      const testNode = screen.getByText('Test Node');
      fireEvent.click(testNode);
      
      expect(screen.getByTestId('detail-panel')).toBeInTheDocument();
      
      // Close detail panel
      const closeButton = screen.getByRole('button', { name: 'Close' });
      fireEvent.click(closeButton);
      
      expect(screen.queryByTestId('detail-panel')).not.toBeInTheDocument();
    });
  });

  describe('Drag and Drop', () => {
    it('shows drag indicator when dragging', async () => {
      const { useCharacterJourneyData } = vi.mocked(await import('@/hooks/useCharacterJourneyData'));
      useCharacterJourneyData.mockReturnValue({
        data: mockCharacterData,
        isLoading: false,
        error: null
      } as any);

      const { useGraphDragDrop } = vi.mocked(await import('@/hooks/useGraphInteractions'));
      useGraphDragDrop.mockReturnValue({ isDragging: true } as any);

      renderWithRouter('/character-journey/char-1');
      
      expect(screen.getByText('Dragging element for ownership transfer')).toBeInTheDocument();
    });
  });

  describe('Tier Badge Variants', () => {
    it('renders correct badge variant for Core tier', async () => {
      const { useCharacterJourneyData } = vi.mocked(await import('@/hooks/useCharacterJourneyData'));
      useCharacterJourneyData.mockReturnValue({
        data: mockCharacterData,
        isLoading: false,
        error: null
      } as any);

      renderWithRouter('/character-journey/char-1');
      
      const badge = screen.getByText('Core');
      expect(badge).toBeInTheDocument();
      // Badge with default variant should have bg-primary class
      expect(badge).toHaveClass('bg-primary');
    });

    it('renders correct badge variant for Secondary tier', async () => {
      const { useCharacterJourneyData } = vi.mocked(await import('@/hooks/useCharacterJourneyData'));
      useCharacterJourneyData.mockReturnValue({
        data: mockCharacterData,
        isLoading: false,
        error: null
      } as any);

      renderWithRouter('/character-journey/char-2');
      
      const badge = screen.getByText('Secondary');
      expect(badge).toBeInTheDocument();
      // Badge with secondary variant should have bg-secondary class
      expect(badge).toHaveClass('bg-secondary');
    });
  });

  describe('Empty State', () => {
    it('shows empty state message when no data for character', async () => {
      const { useCharacterJourneyData } = vi.mocked(await import('@/hooks/useCharacterJourneyData'));
      useCharacterJourneyData.mockReturnValue({
        data: {
          characters: [],
          elements: [],
          puzzles: [],
          timeline: []
        },
        isLoading: false,
        error: null
      } as any);

      renderWithRouter('/character-journey');
      
      // Should show character selector since no characters available
      expect(screen.getByText('Select a Character')).toBeInTheDocument();
    });
  });
});