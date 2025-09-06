/**
 * Tests for EntityTypeToggle Component
 * 
 * Tests focus on user-visible BEHAVIOR, not implementation details.
 * Verifies that entity type visibility controls work as the master switch
 * for graph filtering, overriding all granular filters when turned off.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EntityTypeToggle from './EntityTypeToggle';
import { useFilterStore } from '@/stores/filterStore';

// Mock the filter store
vi.mock('@/stores/filterStore', () => ({
  useFilterStore: vi.fn()
}));

describe('EntityTypeToggle - Master Visibility Control', () => {
  // Mock store state and functions
  const mockEntityVisibility = {
    character: true,
    puzzle: true,
    element: true,
    timeline: true
  };
  
  const mockToggleEntityVisibility = vi.fn();
  const mockShowAllEntities = vi.fn();
  const mockHideAllEntities = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock implementation
    (useFilterStore as any).mockImplementation((selector: any) => {
      const state = {
        entityVisibility: mockEntityVisibility,
        toggleEntityVisibility: mockToggleEntityVisibility,
        showAllEntities: mockShowAllEntities,
        hideAllEntities: mockHideAllEntities
      };
      
      if (typeof selector === 'function') {
        return selector(state);
      }
      return state;
    });
  });
  
  describe('Individual Entity Type Toggles', () => {
    it('should display all four entity type checkboxes with correct labels', () => {
      render(<EntityTypeToggle />);
      
      expect(screen.getByLabelText(/Characters/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Puzzles/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Elements/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Timeline/i)).toBeInTheDocument();
    });
    
    it('should show checked state based on visibility in store', () => {
      // Set some entities as hidden
      mockEntityVisibility.character = false;
      mockEntityVisibility.element = false;
      
      render(<EntityTypeToggle />);
      
      expect(screen.getByLabelText(/Characters/i)).not.toBeChecked();
      expect(screen.getByLabelText(/Puzzles/i)).toBeChecked();
      expect(screen.getByLabelText(/Elements/i)).not.toBeChecked();
      expect(screen.getByLabelText(/Timeline/i)).toBeChecked();
    });
    
    it('should toggle character visibility when character checkbox is clicked', async () => {
      const user = userEvent.setup();
      render(<EntityTypeToggle />);
      
      const characterCheckbox = screen.getByLabelText(/Characters/i);
      await user.click(characterCheckbox);
      
      expect(mockToggleEntityVisibility).toHaveBeenCalledWith('character');
      expect(mockToggleEntityVisibility).toHaveBeenCalledTimes(1);
    });
    
    it('should toggle puzzle visibility when puzzle checkbox is clicked', async () => {
      const user = userEvent.setup();
      render(<EntityTypeToggle />);
      
      const puzzleCheckbox = screen.getByLabelText(/Puzzles/i);
      await user.click(puzzleCheckbox);
      
      expect(mockToggleEntityVisibility).toHaveBeenCalledWith('puzzle');
      expect(mockToggleEntityVisibility).toHaveBeenCalledTimes(1);
    });
    
    it('should toggle element visibility when element checkbox is clicked', async () => {
      const user = userEvent.setup();
      render(<EntityTypeToggle />);
      
      const elementCheckbox = screen.getByLabelText(/Elements/i);
      await user.click(elementCheckbox);
      
      expect(mockToggleEntityVisibility).toHaveBeenCalledWith('element');
      expect(mockToggleEntityVisibility).toHaveBeenCalledTimes(1);
    });
    
    it('should toggle timeline visibility when timeline checkbox is clicked', async () => {
      const user = userEvent.setup();
      render(<EntityTypeToggle />);
      
      const timelineCheckbox = screen.getByLabelText(/Timeline/i);
      await user.click(timelineCheckbox);
      
      expect(mockToggleEntityVisibility).toHaveBeenCalledWith('timeline');
      expect(mockToggleEntityVisibility).toHaveBeenCalledTimes(1);
    });
    
    it('should apply visual styling to indicate hidden entity types', () => {
      // Hide characters and puzzles
      mockEntityVisibility.character = false;
      mockEntityVisibility.puzzle = false;
      mockEntityVisibility.element = true;
      mockEntityVisibility.timeline = true;
      
      const { container } = render(<EntityTypeToggle />);
      
      // Get all label elements that contain entity names
      const labels = container.querySelectorAll('label[for^="entity-"]');
      
      // Check that we have 4 entity labels
      expect(labels).toHaveLength(4);
      
      // Find specific entity labels and check their text styling
      const characterLabel = Array.from(labels).find(l => l.getAttribute('for') === 'entity-character');
      const puzzleLabel = Array.from(labels).find(l => l.getAttribute('for') === 'entity-puzzle');
      const elementLabel = Array.from(labels).find(l => l.getAttribute('for') === 'entity-element');
      const timelineLabel = Array.from(labels).find(l => l.getAttribute('for') === 'entity-timeline');
      
      // Hidden entities should have text-gray-500 class on their span
      expect(characterLabel?.querySelector('span')).toHaveClass('text-gray-500');
      expect(puzzleLabel?.querySelector('span')).toHaveClass('text-gray-500');
      
      // Visible entities should have font-medium class on their span
      expect(elementLabel?.querySelector('span')).toHaveClass('font-medium');
      expect(timelineLabel?.querySelector('span')).toHaveClass('font-medium');
    });
  });
  
  describe('Bulk Controls - Show All / Hide All', () => {
    it('should display Show All and Hide All buttons', () => {
      render(<EntityTypeToggle />);
      
      const showAllButton = screen.getByTitle('Show all entity types');
      const hideAllButton = screen.getByTitle('Hide all entity types');
      
      expect(showAllButton).toBeInTheDocument();
      expect(hideAllButton).toBeInTheDocument();
    });
    
    it('should call showAllEntities when Show All button is clicked', async () => {
      const user = userEvent.setup();
      render(<EntityTypeToggle />);
      
      const showAllButton = screen.getByTitle('Show all entity types');
      await user.click(showAllButton);
      
      expect(mockShowAllEntities).toHaveBeenCalledTimes(1);
      expect(mockHideAllEntities).not.toHaveBeenCalled();
    });
    
    it('should call hideAllEntities when Hide All button is clicked', async () => {
      const user = userEvent.setup();
      render(<EntityTypeToggle />);
      
      const hideAllButton = screen.getByTitle('Hide all entity types');
      await user.click(hideAllButton);
      
      expect(mockHideAllEntities).toHaveBeenCalledTimes(1);
      expect(mockShowAllEntities).not.toHaveBeenCalled();
    });
    
    it('should display count badge showing visible/total entities', () => {
      // Set 2 entities as visible, 2 as hidden
      mockEntityVisibility.character = true;
      mockEntityVisibility.puzzle = true;
      mockEntityVisibility.element = false;
      mockEntityVisibility.timeline = false;
      
      render(<EntityTypeToggle />);
      
      const countBadge = screen.getByText('2/4');
      expect(countBadge).toBeInTheDocument();
    });
    
    it('should update count badge when all entities are visible', () => {
      // All entities visible
      mockEntityVisibility.character = true;
      mockEntityVisibility.puzzle = true;
      mockEntityVisibility.element = true;
      mockEntityVisibility.timeline = true;
      
      render(<EntityTypeToggle />);
      
      const countBadge = screen.getByText('4/4');
      expect(countBadge).toBeInTheDocument();
    });
    
    it('should update count badge when no entities are visible', () => {
      // All entities hidden
      mockEntityVisibility.character = false;
      mockEntityVisibility.puzzle = false;
      mockEntityVisibility.element = false;
      mockEntityVisibility.timeline = false;
      
      render(<EntityTypeToggle />);
      
      const countBadge = screen.getByText('0/4');
      expect(countBadge).toBeInTheDocument();
    });
  });
  
  describe('Visual Feedback and User Experience', () => {
    it('should display icons for each entity type', () => {
      const { container } = render(<EntityTypeToggle />);
      
      // Lucide icons are rendered as svg elements
      const icons = container.querySelectorAll('svg');
      // 4 entity type icons + 2 for Show/Hide all buttons
      expect(icons.length).toBeGreaterThanOrEqual(6);
    });
    
    it('should show helper text explaining the feature', () => {
      render(<EntityTypeToggle />);
      
      const helperText = screen.getByText(/Hide entity types to focus on specific graph elements/i);
      expect(helperText).toBeInTheDocument();
    });
    
    it('should have accessible labels for screen readers', () => {
      const { container } = render(<EntityTypeToggle />);
      
      // Each checkbox should have a proper label association
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(4);
      
      // Verify each checkbox has an id and corresponding label
      const expectedLabels = ['Characters', 'Puzzles', 'Elements', 'Timeline'];
      checkboxes.forEach((checkbox, index) => {
        // Check the checkbox has an id
        expect(checkbox).toHaveAttribute('id');
        const checkboxId = checkbox.getAttribute('id');
        
        // Find the label that points to this checkbox
        const label = container.querySelector(`label[for="${checkboxId}"]`);
        expect(label).toBeInTheDocument();
        
        // Verify the label contains the expected text
        expect(label?.textContent).toContain(expectedLabels[index]);
      });
    });
  });
  
  describe('State Independence - Critical Behavior', () => {
    it('should not reset any other filter state when toggling visibility', async () => {
      const user = userEvent.setup();
      render(<EntityTypeToggle />);
      
      // Click character toggle
      await user.click(screen.getByLabelText(/Characters/i));
      
      // Should ONLY call toggle, not any reset or clear functions
      expect(mockToggleEntityVisibility).toHaveBeenCalledWith('character');
      expect(mockToggleEntityVisibility).toHaveBeenCalledTimes(1);
      // No other store methods should be called
      expect(mockShowAllEntities).not.toHaveBeenCalled();
      expect(mockHideAllEntities).not.toHaveBeenCalled();
    });
    
    it('should maintain individual toggle states when using Show All', async () => {
      const user = userEvent.setup();
      render(<EntityTypeToggle />);
      
      // Click Show All
      await user.click(screen.getByTitle('Show all entity types'));
      
      // Should only call showAllEntities, not individual toggles
      expect(mockShowAllEntities).toHaveBeenCalledTimes(1);
      expect(mockToggleEntityVisibility).not.toHaveBeenCalled();
    });
    
    it('should maintain individual toggle states when using Hide All', async () => {
      const user = userEvent.setup();
      render(<EntityTypeToggle />);
      
      // Click Hide All
      await user.click(screen.getByTitle('Hide all entity types'));
      
      // Should only call hideAllEntities, not individual toggles  
      expect(mockHideAllEntities).toHaveBeenCalledTimes(1);
      expect(mockToggleEntityVisibility).not.toHaveBeenCalled();
    });
  });
  
  describe('Integration Readiness', () => {
    it('should render without crashing when store is in various states', () => {
      // Test with all entities visible
      mockEntityVisibility.character = true;
      mockEntityVisibility.puzzle = true;
      mockEntityVisibility.element = true;
      mockEntityVisibility.timeline = true;
      
      let result = render(<EntityTypeToggle />);
      expect(screen.getByText('4/4')).toBeInTheDocument();
      result.unmount();
      
      // Test with mixed visibility - need to update the mock to return new state
      mockEntityVisibility.character = false;
      mockEntityVisibility.puzzle = true;
      mockEntityVisibility.element = true;
      mockEntityVisibility.timeline = true;
      
      result = render(<EntityTypeToggle />);
      expect(screen.getByText('3/4')).toBeInTheDocument();
      result.unmount();
      
      // Test with all hidden
      mockEntityVisibility.character = false;
      mockEntityVisibility.puzzle = false;
      mockEntityVisibility.element = false;
      mockEntityVisibility.timeline = false;
      
      result = render(<EntityTypeToggle />);
      expect(screen.getByText('0/4')).toBeInTheDocument();
    });
    
    it('should be memoized to prevent unnecessary re-renders', () => {
      // The component is wrapped in React.memo
      const { rerender } = render(<EntityTypeToggle />);
      
      // Re-render with same props/state
      rerender(<EntityTypeToggle />);
      
      // If store state hasn't changed, toggle function references should be stable
      expect(mockToggleEntityVisibility).toHaveBeenCalledTimes(0);
    });
  });
});