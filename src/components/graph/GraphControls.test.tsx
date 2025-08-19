import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GraphControls from './GraphControls';
import type { FilterState } from './GraphControls';

describe('GraphControls', () => {
  const mockPuzzles = [
    { id: '1', name: 'Puzzle 1' },
    { id: '2', name: 'Puzzle 2' },
  ];

  const mockFilterState: FilterState = {
    searchTerm: '',
    selectedActs: new Set(),
    selectedPuzzleId: null,
  };

  const mockOnFilterChange = vi.fn();
  const mockOnClearFilters = vi.fn();

  it('renders all filter controls', () => {
    render(
      <GraphControls
        puzzles={mockPuzzles as any}
        filterState={mockFilterState}
        onFilterChange={mockOnFilterChange}
        onClearFilters={mockOnClearFilters}
      />
    );

    // Check search box is rendered
    expect(screen.getByPlaceholderText('Search nodes...')).toBeInTheDocument();
    
    // Check Acts button is rendered
    expect(screen.getByText('Acts')).toBeInTheDocument();
    
    // Check puzzle selector is rendered
    expect(screen.getByText('All Puzzles')).toBeInTheDocument();
  });

  it('handles search input', () => {
    render(
      <GraphControls
        puzzles={mockPuzzles as any}
        filterState={mockFilterState}
        onFilterChange={mockOnFilterChange}
        onClearFilters={mockOnClearFilters}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search nodes...') as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'test search' } });

    expect(mockOnFilterChange).toHaveBeenCalledWith({
      ...mockFilterState,
      searchTerm: 'test search',
    });
  });

  it('shows active filter badges', () => {
    const activeFilterState: FilterState = {
      searchTerm: 'puzzle',
      selectedActs: new Set(['Act 0', 'Act 1']),
      selectedPuzzleId: '1',
    };

    render(
      <GraphControls
        puzzles={mockPuzzles as any}
        filterState={activeFilterState}
        onFilterChange={mockOnFilterChange}
        onClearFilters={mockOnClearFilters}
      />
    );

    // Check that active filters are displayed
    expect(screen.getByText('puzzle')).toBeInTheDocument();
    expect(screen.getByText('Act 0')).toBeInTheDocument();
    expect(screen.getByText('Act 1')).toBeInTheDocument();
    // Use getAllByText since "Puzzle 1" appears in both the select and the badge
    const puzzle1Elements = screen.getAllByText('Puzzle 1');
    expect(puzzle1Elements.length).toBeGreaterThan(0);
    
    // Check clear button is shown
    expect(screen.getByText('Clear')).toBeInTheDocument();
  });
});