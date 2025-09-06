/**
 * Integration Tests for Entity Type Visibility Toggle Behavior
 * 
 * These tests verify that entity type toggles act as master switches:
 * - When an entity type is hidden, ALL entities of that type are hidden
 *   regardless of granular filter settings
 * - When an entity type is shown, granular filters then apply
 * - Tests the interaction between master visibility and granular filters
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ViewContextProvider } from '@/contexts/ViewContext';
import EntityTypeToggle from '@/components/filters/EntityTypeToggle';
import { CharacterFilterPanel, PuzzleFilterPanel } from '@/components/sidebar/FilterPanel';
import { useFilterStore } from '@/stores/filterStore';
import '@testing-library/jest-dom';

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

// Mock graph view to observe visibility changes
const MockGraphView = () => {
  const entityVisibility = useFilterStore(state => state.entityVisibility);
  const characterType = useFilterStore(state => state.characterFilters.characterType);
  const selectedTiers = useFilterStore(state => state.characterFilters.selectedTiers);
  const selectedActs = useFilterStore(state => state.puzzleFilters.selectedActs);
  
  return (
    <div data-testid="mock-graph">
      <div data-testid="visibility-status">
        {Object.entries(entityVisibility).map(([type, visible]) => (
          <span key={type} data-testid={`${type}-visibility`}>
            {type}: {visible ? 'visible' : 'hidden'}
          </span>
        ))}
      </div>
      <div data-testid="filter-status">
        <span data-testid="character-filters">
          Type: {characterType}, Tiers: {Array.from(selectedTiers).join(',')}
        </span>
        <span data-testid="puzzle-filters">
          Acts: {Array.from(selectedActs).join(',')}
        </span>
      </div>
    </div>
  );
};

describe('Entity Type Visibility Toggle - Master Control Behavior', () => {
  beforeEach(() => {
    // Reset filter store before each test
    useFilterStore.setState({
      entityVisibility: {
        character: true,
        puzzle: true,
        element: true,
        timeline: true
      },
      characterFilters: {
        characterType: 'all',
        selectedTiers: new Set(['Core', 'Secondary', 'Tertiary']),
        ownershipStatus: new Set(),
        selectedCharacterId: null,
        highlightShared: false
      },
      puzzleFilters: {
        selectedActs: new Set(['Act 0', 'Act 1', 'Act 2']),
        completionStatus: 'all',
        selectedPuzzleId: null
      }
    });
  });
  
  describe('Master Switch Behavior', () => {
    it('should hide ALL characters when character visibility is toggled off, regardless of filters', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(
        <>
          <EntityTypeToggle />
          <CharacterFilterPanel />
          <MockGraphView />
        </>
      );
      
      // Set some granular filters
      const coreCheckbox = screen.getByLabelText('Core');
      await user.click(coreCheckbox); // Uncheck Core tier
      
      // Verify Core tier is unchecked
      expect(coreCheckbox).not.toBeChecked();
      expect(screen.getByTestId('character-filters')).toHaveTextContent('Tiers: Secondary,Tertiary');
      
      // Now toggle off character visibility entirely
      const characterToggle = screen.getByLabelText('Characters');
      await user.click(characterToggle);
      
      // Verify characters are hidden at master level
      expect(screen.getByTestId('character-visibility')).toHaveTextContent('character: hidden');
      
      // Granular filters should still maintain their state
      expect(screen.getByTestId('character-filters')).toHaveTextContent('Tiers: Secondary,Tertiary');
    });
    
    it('should show filtered characters when visibility is toggled back on', async () => {
      const user = userEvent.setup();
      
      // Start with characters hidden
      useFilterStore.setState({
        entityVisibility: { ...useFilterStore.getState().entityVisibility, character: false }
      });
      
      renderWithProviders(
        <>
          <EntityTypeToggle />
          <CharacterFilterPanel />
          <MockGraphView />
        </>
      );
      
      // Verify characters start hidden
      expect(screen.getByTestId('character-visibility')).toHaveTextContent('character: hidden');
      
      // Set a granular filter while hidden
      const secondaryCheckbox = screen.getByLabelText('Secondary');
      await user.click(secondaryCheckbox); // Uncheck Secondary
      
      // Toggle characters back on
      const characterToggle = screen.getByLabelText('Characters');
      await user.click(characterToggle);
      
      // Verify characters are visible again
      expect(screen.getByTestId('character-visibility')).toHaveTextContent('character: visible');
      
      // Granular filters should apply
      expect(screen.getByTestId('character-filters')).toHaveTextContent('Tiers: Core,Tertiary');
    });
    
    it('should allow hiding all entity types simultaneously', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(
        <>
          <EntityTypeToggle />
          <MockGraphView />
        </>
      );
      
      // Use Hide All button
      const hideAllButton = screen.getByTitle('Hide all entity types');
      await user.click(hideAllButton);
      
      // All entity types should be hidden
      expect(screen.getByTestId('character-visibility')).toHaveTextContent('character: hidden');
      expect(screen.getByTestId('puzzle-visibility')).toHaveTextContent('puzzle: hidden');
      expect(screen.getByTestId('element-visibility')).toHaveTextContent('element: hidden');
      expect(screen.getByTestId('timeline-visibility')).toHaveTextContent('timeline: hidden');
      
      // Count badge should show 0/4
      expect(screen.getByText('0/4')).toBeInTheDocument();
    });
    
    it('should maintain granular filter state when using Show All', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(
        <>
          <EntityTypeToggle />
          <CharacterFilterPanel />
          <MockGraphView />
        </>
      );
      
      // Set some granular filters
      await user.click(screen.getByLabelText('Core'));
      expect(screen.getByTestId('character-filters')).toHaveTextContent('Tiers: Secondary,Tertiary');
      
      // Hide all entities
      await user.click(screen.getByTitle('Hide all entity types'));
      
      // Show all entities
      await user.click(screen.getByTitle('Show all entity types'));
      
      // Granular filters should be preserved
      expect(screen.getByTestId('character-filters')).toHaveTextContent('Tiers: Secondary,Tertiary');
    });
  });
  
  describe('Interaction Between Master and Granular Filters', () => {
    it('should not apply granular filters when entity type is hidden', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(
        <>
          <EntityTypeToggle />
          <PuzzleFilterPanel />
          <MockGraphView />
        </>
      );
      
      // Hide puzzles at master level
      await user.click(screen.getByLabelText('Puzzles'));
      expect(screen.getByTestId('puzzle-visibility')).toHaveTextContent('puzzle: hidden');
      
      // Try to change granular filters
      await user.click(screen.getByLabelText('Act 1'));
      
      // Filter state changes but puzzles remain hidden
      expect(screen.getByTestId('puzzle-filters')).toHaveTextContent('Acts: Act 0,Act 2');
      expect(screen.getByTestId('puzzle-visibility')).toHaveTextContent('puzzle: hidden');
    });
    
    it('should immediately apply granular filters when entity type becomes visible', async () => {
      const user = userEvent.setup();
      
      // Start with puzzles hidden and specific acts selected
      useFilterStore.setState({
        entityVisibility: { ...useFilterStore.getState().entityVisibility, puzzle: false },
        puzzleFilters: {
          ...useFilterStore.getState().puzzleFilters,
          selectedActs: new Set(['Act 1'])
        }
      });
      
      renderWithProviders(
        <>
          <EntityTypeToggle />
          <MockGraphView />
        </>
      );
      
      // Verify starting state
      expect(screen.getByTestId('puzzle-visibility')).toHaveTextContent('puzzle: hidden');
      expect(screen.getByTestId('puzzle-filters')).toHaveTextContent('Acts: Act 1');
      
      // Show puzzles
      await user.click(screen.getByLabelText('Puzzles'));
      
      // Puzzles are visible with filters applied
      expect(screen.getByTestId('puzzle-visibility')).toHaveTextContent('puzzle: visible');
      expect(screen.getByTestId('puzzle-filters')).toHaveTextContent('Acts: Act 1');
    });
    
    it('should handle toggling individual types while others remain filtered', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(
        <>
          <EntityTypeToggle />
          <CharacterFilterPanel />
          <PuzzleFilterPanel />
          <MockGraphView />
        </>
      );
      
      // Set filters for both types
      await user.click(screen.getByLabelText('Core')); // Uncheck Core tier
      await user.click(screen.getByLabelText('Act 0')); // Uncheck Act 0
      
      // Hide characters only
      await user.click(screen.getByLabelText('Characters'));
      
      // Characters hidden, puzzles still visible with filters
      expect(screen.getByTestId('character-visibility')).toHaveTextContent('character: hidden');
      expect(screen.getByTestId('puzzle-visibility')).toHaveTextContent('puzzle: visible');
      expect(screen.getByTestId('puzzle-filters')).toHaveTextContent('Acts: Act 1,Act 2');
    });
  });
  
  describe('Visual Feedback Consistency', () => {
    it('should update opacity styling when entity types are hidden', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(<EntityTypeToggle />);
      
      // Get the character checkbox by its ID
      const characterCheckbox = screen.getByRole('checkbox', { name: /characters/i });
      
      // The label contains the span with text styling - find it directly
      const characterLabel = screen.getByText('Characters', { selector: 'span.text-xs' });
      
      // Initially visible - should have font-medium class
      expect(characterLabel).toHaveClass('font-medium');
      expect(characterLabel).not.toHaveClass('text-gray-500');
      
      // Hide characters
      await user.click(characterCheckbox);
      
      // Should now have text-gray-500 class instead of font-medium
      expect(characterLabel).toHaveClass('text-gray-500');
      expect(characterLabel).not.toHaveClass('font-medium');
    });
    
    it('should show correct count in visibility badge', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(<EntityTypeToggle />);
      
      // Initially all visible
      expect(screen.getByText('4/4')).toBeInTheDocument();
      
      // Hide one type
      await user.click(screen.getByLabelText('Characters'));
      expect(screen.getByText('3/4')).toBeInTheDocument();
      
      // Hide another
      await user.click(screen.getByLabelText('Elements'));
      expect(screen.getByText('2/4')).toBeInTheDocument();
    });
    
    it('should maintain visual consistency when rapidly toggling', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(
        <>
          <EntityTypeToggle />
          <MockGraphView />
        </>
      );
      
      const characterToggle = screen.getByLabelText('Characters');
      
      // Rapidly toggle multiple times
      await user.click(characterToggle); // Hide
      await user.click(characterToggle); // Show
      await user.click(characterToggle); // Hide
      await user.click(characterToggle); // Show
      
      // Final state should be visible
      expect(screen.getByTestId('character-visibility')).toHaveTextContent('character: visible');
      expect(characterToggle).toBeChecked();
    });
  });
  
  describe('Edge Cases and State Persistence', () => {
    it('should handle empty filter sets gracefully', async () => {
      const user = userEvent.setup();
      
      // Set all tier filters to empty
      useFilterStore.setState({
        characterFilters: {
          ...useFilterStore.getState().characterFilters,
          selectedTiers: new Set(),
          ownershipStatus: new Set()
        }
      });
      
      renderWithProviders(
        <>
          <EntityTypeToggle />
          <MockGraphView />
        </>
      );
      
      // Should still be able to toggle visibility
      await user.click(screen.getByLabelText('Characters'));
      expect(screen.getByTestId('character-visibility')).toHaveTextContent('character: hidden');
    });
    
    it('should preserve filter state through multiple visibility toggles', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(
        <>
          <EntityTypeToggle />
          <CharacterFilterPanel />
          <MockGraphView />
        </>
      );
      
      // Set specific filters
      await user.click(screen.getByLabelText('Core'));
      await user.click(screen.getByLabelText('Tertiary'));
      
      const initialFilters = screen.getByTestId('character-filters').textContent;
      
      // Toggle visibility multiple times
      const toggle = screen.getByLabelText('Characters');
      await user.click(toggle); // Hide
      await user.click(toggle); // Show
      
      // Filters should be unchanged
      expect(screen.getByTestId('character-filters').textContent).toBe(initialFilters);
    });
    
    it('should handle Show All / Hide All without losing individual toggle states', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(
        <>
          <EntityTypeToggle />
          <MockGraphView />
        </>
      );
      
      // Set mixed visibility
      await user.click(screen.getByLabelText('Characters')); // Hide characters
      await user.click(screen.getByLabelText('Elements')); // Hide elements
      
      // Show all
      await user.click(screen.getByTitle('Show all entity types'));
      
      // All should be visible
      expect(screen.getByText('4/4')).toBeInTheDocument();
      
      // Hide all
      await user.click(screen.getByTitle('Hide all entity types'));
      
      // All should be hidden
      expect(screen.getByText('0/4')).toBeInTheDocument();
      
      // Show all again - state is reset
      await user.click(screen.getByTitle('Show all entity types'));
      expect(screen.getByText('4/4')).toBeInTheDocument();
    });
  });
});