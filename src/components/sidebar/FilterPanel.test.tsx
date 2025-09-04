/**
 * Tests for FilterPanel Components
 * 
 * Tests the generic FilterPanel and all pre-configured variants:
 * - CharacterFilterPanel (tiers and character types)
 * - PuzzleFilterPanel (acts and completion status)
 * - ElementFilterPanel (basic types and production status)
 * 
 * Verifies intended behavior of granular filtering within entity types.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { 
  FilterPanel,
  CharacterFilterPanel, 
  PuzzleFilterPanel, 
  ElementFilterPanel 
} from './FilterPanel';
import { useFilterStore } from '@/stores/filterStore';

// Mock the filter store
vi.mock('@/stores/filterStore', () => ({
  useFilterStore: vi.fn()
}));

describe('FilterPanel Components', () => {
  // Mock store functions
  const mockGetFilter = vi.fn();
  const mockSetFilter = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock implementation
    mockGetFilter.mockImplementation((key: string) => {
      switch(key) {
        case 'tiers': return [];
        case 'characterTypes': return 'all';
        case 'acts': return [];
        case 'completionStatus': return 'all';
        case 'basicTypes': return [];
        case 'status': return [];
        default: return null;
      }
    });
    
    (useFilterStore as any).mockImplementation(() => ({
      getFilter: mockGetFilter,
      setFilter: mockSetFilter
    }));
  });
  
  describe('Generic FilterPanel', () => {
    describe('Checkbox Filter Type', () => {
      it('should render checkboxes and handle selection', async () => {
        const user = userEvent.setup();
        
        render(
          <FilterPanel
            title="Test Filters"
            filters={{
              testFilter: {
                type: 'checkbox',
                label: 'Test Options',
                options: [
                  { value: 'option1', label: 'Option 1' },
                  { value: 'option2', label: 'Option 2' }
                ]
              }
            }}
          />
        );
        
        // Verify checkboxes render
        expect(screen.getByLabelText('Option 1')).toBeInTheDocument();
        expect(screen.getByLabelText('Option 2')).toBeInTheDocument();
        
        // Click first checkbox
        await user.click(screen.getByLabelText('Option 1'));
        
        // Verify setFilter called correctly
        expect(mockSetFilter).toHaveBeenCalledWith('testFilter', ['option1']);
      });
      
      it('should handle unchecking checkboxes', async () => {
        const user = userEvent.setup();
        mockGetFilter.mockReturnValue(['option1', 'option2']);
        
        render(
          <FilterPanel
            title="Test Filters"
            filters={{
              testFilter: {
                type: 'checkbox',
                label: 'Test Options',
                options: [
                  { value: 'option1', label: 'Option 1' },
                  { value: 'option2', label: 'Option 2' }
                ]
              }
            }}
          />
        );
        
        // Both should be checked
        expect(screen.getByLabelText('Option 1')).toBeChecked();
        expect(screen.getByLabelText('Option 2')).toBeChecked();
        
        // Uncheck first option
        await user.click(screen.getByLabelText('Option 1'));
        
        // Should remove option1, keep option2
        expect(mockSetFilter).toHaveBeenCalledWith('testFilter', ['option2']);
      });
    });
    
    describe('Radio Filter Type', () => {
      it('should render radio options and handle selection', async () => {
        const user = userEvent.setup();
        
        render(
          <FilterPanel
            title="Test Filters"
            filters={{
              radioFilter: {
                type: 'radio',
                label: 'Single Choice',
                options: [
                  { value: 'all', label: 'All' },
                  { value: 'some', label: 'Some' },
                  { value: 'none', label: 'None' }
                ]
              }
            }}
          />
        );
        
        // Verify options render (radio implemented as checkboxes with single selection)
        expect(screen.getByLabelText('All')).toBeInTheDocument();
        expect(screen.getByLabelText('Some')).toBeInTheDocument();
        expect(screen.getByLabelText('None')).toBeInTheDocument();
        
        // Select 'Some'
        await user.click(screen.getByLabelText('Some'));
        
        // Verify setFilter called with single value
        expect(mockSetFilter).toHaveBeenCalledWith('radioFilter', 'some');
      });
      
      it('should allow deselecting radio option', async () => {
        const user = userEvent.setup();
        mockGetFilter.mockReturnValue('some');
        
        render(
          <FilterPanel
            title="Test Filters"
            filters={{
              radioFilter: {
                type: 'radio',
                label: 'Single Choice',
                options: [
                  { value: 'all', label: 'All' },
                  { value: 'some', label: 'Some' }
                ]
              }
            }}
          />
        );
        
        // 'Some' should be selected
        expect(screen.getByLabelText('Some')).toBeChecked();
        
        // Click to deselect
        await user.click(screen.getByLabelText('Some'));
        
        // Should set to null
        expect(mockSetFilter).toHaveBeenCalledWith('radioFilter', null);
      });
    });
    
    describe('Multiselect Filter Type', () => {
      it('should render checkboxes with badges for selected items', async () => {
        const user = userEvent.setup();
        mockGetFilter.mockReturnValue(['item1', 'item2']);
        
        render(
          <FilterPanel
            title="Test Filters"
            filters={{
              multiFilter: {
                type: 'multiselect',
                label: 'Multiple Choice',
                options: [
                  { value: 'item1', label: 'Item 1' },
                  { value: 'item2', label: 'Item 2' },
                  { value: 'item3', label: 'Item 3' }
                ]
              }
            }}
          />
        );
        
        // Should show badges for selected items
        expect(screen.getByText('item1')).toBeInTheDocument();
        expect(screen.getByText('item2')).toBeInTheDocument();
        
        // Checkboxes should reflect selection
        expect(screen.getByLabelText('Item 1')).toBeChecked();
        expect(screen.getByLabelText('Item 2')).toBeChecked();
        expect(screen.getByLabelText('Item 3')).not.toBeChecked();
      });
      
      it('should handle adding items to multiselect', async () => {
        const user = userEvent.setup();
        mockGetFilter.mockReturnValue(['item1']);
        
        render(
          <FilterPanel
            title="Test Filters"
            filters={{
              multiFilter: {
                type: 'multiselect',
                label: 'Multiple Choice',
                options: [
                  { value: 'item1', label: 'Item 1' },
                  { value: 'item2', label: 'Item 2' }
                ]
              }
            }}
          />
        );
        
        // Add item2
        await user.click(screen.getByLabelText('Item 2'));
        
        // Should add to existing array
        expect(mockSetFilter).toHaveBeenCalledWith('multiFilter', ['item1', 'item2']);
      });
      
      it('should handle removing items via badge X button', async () => {
        const user = userEvent.setup();
        mockGetFilter.mockReturnValue(['item1', 'item2']);
        
        const { container } = render(
          <FilterPanel
            title="Test Filters"
            filters={{
              multiFilter: {
                type: 'multiselect',
                label: 'Multiple Choice',
                options: [
                  { value: 'item1', label: 'Item 1' },
                  { value: 'item2', label: 'Item 2' }
                ]
              }
            }}
          />
        );
        
        // Find the X button for item1 badge
        const removeButtons = container.querySelectorAll('button.h-4.w-4');
        expect(removeButtons).toHaveLength(2);
        
        // Click first remove button (for item1)
        await user.click(removeButtons[0]);
        
        // Should remove item1, keep item2
        expect(mockSetFilter).toHaveBeenCalledWith('multiFilter', ['item2']);
      });
    });
    
    describe('Slider Filter Type', () => {
      it('should render slider with current value', () => {
        mockGetFilter.mockReturnValue(5);
        
        const { container } = render(
          <FilterPanel
            title="Test Filters"
            filters={{
              depthFilter: {
                type: 'slider',
                label: 'Depth',
                min: 0,
                max: 10,
                step: 1
              }
            }}
          />
        );
        
        // Check slider exists
        const slider = container.querySelector('input[type="range"]');
        expect(slider).toBeInTheDocument();
        expect(slider).toHaveAttribute('min', '0');
        expect(slider).toHaveAttribute('max', '10');
        expect(slider).toHaveAttribute('step', '1');
        expect(slider).toHaveValue('5');
        
        // Check value display
        expect(screen.getByText('5')).toBeInTheDocument();
      });
      
      it('should handle slider value changes', async () => {
        mockGetFilter.mockReturnValue(3);
        
        const { container } = render(
          <FilterPanel
            title="Test Filters"
            filters={{
              depthFilter: {
                type: 'slider',
                label: 'Depth',
                min: 0,
                max: 10,
                step: 1
              }
            }}
          />
        );
        
        const slider = container.querySelector('input[type="range"]') as HTMLInputElement;
        
        // Change slider value using fireEvent for proper React event simulation
        fireEvent.change(slider, { target: { value: '7' } });
        
        expect(mockSetFilter).toHaveBeenCalledWith('depthFilter', 7);
      });
    });
  });
  
  describe('CharacterFilterPanel', () => {
    it('should render with correct title and filters', () => {
      render(<CharacterFilterPanel />);
      
      // Check title
      expect(screen.getByText('Character Filters')).toBeInTheDocument();
      
      // Check character type filter
      expect(screen.getByText('Character Type')).toBeInTheDocument();
      expect(screen.getByLabelText('All')).toBeInTheDocument();
      expect(screen.getByLabelText('Players')).toBeInTheDocument();
      expect(screen.getByLabelText('NPCs')).toBeInTheDocument();
      
      // Check tiers filter
      expect(screen.getByText('Tiers')).toBeInTheDocument();
      expect(screen.getByLabelText('Core')).toBeInTheDocument();
      expect(screen.getByLabelText('Secondary')).toBeInTheDocument();
      expect(screen.getByLabelText('Tertiary')).toBeInTheDocument();
    });
    
    it('should update characterTypes filter with correct key', async () => {
      const user = userEvent.setup();
      render(<CharacterFilterPanel />);
      
      await user.click(screen.getByLabelText('Players'));
      
      // Should use 'characterTypes' key and 'Player' value
      expect(mockSetFilter).toHaveBeenCalledWith('characterTypes', 'Player');
    });
    
    it('should update tiers filter as multiselect', async () => {
      const user = userEvent.setup();
      mockGetFilter.mockImplementation((key) => {
        if (key === 'tiers') return ['Core'];
        return null;
      });
      
      render(<CharacterFilterPanel />);
      
      // Core should be checked
      expect(screen.getByLabelText('Core')).toBeChecked();
      
      // Add Secondary
      await user.click(screen.getByLabelText('Secondary'));
      
      // Should add to array
      expect(mockSetFilter).toHaveBeenCalledWith('tiers', ['Core', 'Secondary']);
    });
  });
  
  describe('PuzzleFilterPanel', () => {
    it('should render with correct title and filters', () => {
      render(<PuzzleFilterPanel />);
      
      // Check title
      expect(screen.getByText('Puzzle Filters')).toBeInTheDocument();
      
      // Check acts filter
      expect(screen.getByText('Acts')).toBeInTheDocument();
      expect(screen.getByLabelText('Act 0')).toBeInTheDocument();
      expect(screen.getByLabelText('Act 1')).toBeInTheDocument();
      expect(screen.getByLabelText('Act 2')).toBeInTheDocument();
      
      // Check completion status filter
      expect(screen.getByText('Completion Status')).toBeInTheDocument();
      expect(screen.getByLabelText('All')).toBeInTheDocument();
      expect(screen.getByLabelText('Completed')).toBeInTheDocument();
      expect(screen.getByLabelText('Incomplete')).toBeInTheDocument();
    });
    
    it('should update acts filter as multiselect', async () => {
      const user = userEvent.setup();
      mockGetFilter.mockImplementation((key) => {
        if (key === 'acts') return [];
        return 'all';
      });
      
      render(<PuzzleFilterPanel />);
      
      // Select Act 1
      await user.click(screen.getByLabelText('Act 1'));
      
      // Should use 'acts' key
      expect(mockSetFilter).toHaveBeenCalledWith('acts', ['Act 1']);
      
      // Mock updated state
      mockGetFilter.mockImplementation((key) => {
        if (key === 'acts') return ['Act 1'];
        return 'all';
      });
    });
    
    it('should update completion status as radio', async () => {
      const user = userEvent.setup();
      render(<PuzzleFilterPanel />);
      
      await user.click(screen.getByLabelText('Completed'));
      
      // Should use 'completionStatus' key
      expect(mockSetFilter).toHaveBeenCalledWith('completionStatus', 'completed');
    });
  });
  
  describe('ElementFilterPanel', () => {
    it('should render with correct title and element type filters', () => {
      render(<ElementFilterPanel />);
      
      // Check title
      expect(screen.getByText('Element Filters')).toBeInTheDocument();
      
      // Check element types filter
      expect(screen.getByText('Element Types')).toBeInTheDocument();
      expect(screen.getByLabelText('Set Dressing')).toBeInTheDocument();
      expect(screen.getByLabelText('Prop')).toBeInTheDocument();
      expect(screen.getByLabelText('Document')).toBeInTheDocument();
      
      // Check status filter
      expect(screen.getByText('Production Status')).toBeInTheDocument();
      expect(screen.getByLabelText('Idea/Placeholder')).toBeInTheDocument();
      expect(screen.getByLabelText('In Development')).toBeInTheDocument();
      expect(screen.getByLabelText('Done')).toBeInTheDocument();
    });
    
    it('should update basicTypes filter as multiselect', async () => {
      const user = userEvent.setup();
      mockGetFilter.mockImplementation((key) => {
        if (key === 'basicTypes') return [];
        if (key === 'status') return [];
        return null;
      });
      
      render(<ElementFilterPanel />);
      
      // Select Prop
      await user.click(screen.getByLabelText('Prop'));
      
      // Should use 'basicTypes' key
      expect(mockSetFilter).toHaveBeenCalledWith('basicTypes', ['Prop']);
    });
    
    it('should update status filter as multiselect', async () => {
      const user = userEvent.setup();
      mockGetFilter.mockImplementation((key) => {
        if (key === 'status') return ['Done'];
        if (key === 'basicTypes') return [];
        return null;
      });
      
      render(<ElementFilterPanel />);
      
      // Done should be checked
      expect(screen.getByLabelText('Done')).toBeChecked();
      
      // Add In Development
      await user.click(screen.getByLabelText('In Development'));
      
      // Should use 'status' key
      expect(mockSetFilter).toHaveBeenCalledWith('status', ['Done', 'In development']);
    });
  });
  
  describe('Filter State Management', () => {
    it('should handle empty/null filter values gracefully', () => {
      mockGetFilter.mockReturnValue(null);
      
      const { container } = render(
        <FilterPanel
          title="Test"
          filters={{
            test: {
              type: 'multiselect',
              label: 'Test',
              options: [{ value: 'a', label: 'A' }]
            }
          }}
        />
      );
      
      // Should not crash and render empty state
      expect(container.querySelector('.space-y-4')).toBeInTheDocument();
    });
    
    it('should handle undefined filter values', () => {
      mockGetFilter.mockReturnValue(undefined);
      
      render(
        <FilterPanel
          title="Test"
          filters={{
            test: {
              type: 'checkbox',
              label: 'Test',
              options: [{ value: 'a', label: 'A' }]
            }
          }}
        />
      );
      
      // Checkboxes should be unchecked
      expect(screen.getByLabelText('A')).not.toBeChecked();
    });
    
    it('should properly display panel title', () => {
      render(
        <FilterPanel
          title="Custom Title Here"
          filters={{}}
        />
      );
      
      expect(screen.getByText('Custom Title Here')).toBeInTheDocument();
    });
  });
  
  describe('User Interaction Flows', () => {
    it('should support selecting multiple tiers in CharacterFilterPanel', async () => {
      const user = userEvent.setup();
      
      // Track the current state of the tiers
      let currentTiers: string[] = [];
      mockGetFilter.mockImplementation((key) => {
        if (key === 'tiers') return currentTiers;
        return 'all';
      });
      
      // Mock setFilter to also update our tracked state
      mockSetFilter.mockImplementation((key, value) => {
        if (key === 'tiers') {
          currentTiers = value;
        }
      });
      
      const { rerender } = render(<CharacterFilterPanel />);
      
      // Select Core tier
      await user.click(screen.getByLabelText('Core'));
      expect(mockSetFilter).toHaveBeenCalledWith('tiers', ['Core']);
      rerender(<CharacterFilterPanel />);
      
      // Select Secondary tier
      await user.click(screen.getByLabelText('Secondary'));
      expect(mockSetFilter).toHaveBeenCalledWith('tiers', ['Core', 'Secondary']);
      rerender(<CharacterFilterPanel />);
      
      // Select Tertiary tier
      await user.click(screen.getByLabelText('Tertiary'));
      expect(mockSetFilter).toHaveBeenCalledWith('tiers', ['Core', 'Secondary', 'Tertiary']);
    });
    
    it('should support clearing all acts in PuzzleFilterPanel', async () => {
      const user = userEvent.setup();
      
      // Track the current state of the acts
      let currentActs = ['Act 0', 'Act 1', 'Act 2'];
      mockGetFilter.mockImplementation((key) => {
        if (key === 'acts') return currentActs;
        return 'all';
      });
      
      // Mock setFilter to also update our tracked state
      mockSetFilter.mockImplementation((key, value) => {
        if (key === 'acts') {
          currentActs = value;
        }
      });
      
      const { rerender } = render(<PuzzleFilterPanel />);
      
      // All acts should be checked
      expect(screen.getByLabelText('Act 0')).toBeChecked();
      expect(screen.getByLabelText('Act 1')).toBeChecked();
      expect(screen.getByLabelText('Act 2')).toBeChecked();
      
      // Uncheck Act 0
      await user.click(screen.getByLabelText('Act 0'));
      expect(mockSetFilter).toHaveBeenCalledWith('acts', ['Act 1', 'Act 2']);
      rerender(<PuzzleFilterPanel />);
      
      // Uncheck Act 1
      await user.click(screen.getByLabelText('Act 1'));
      expect(mockSetFilter).toHaveBeenCalledWith('acts', ['Act 2']);
      rerender(<PuzzleFilterPanel />);
      
      // Uncheck Act 2
      await user.click(screen.getByLabelText('Act 2'));
      expect(mockSetFilter).toHaveBeenCalledWith('acts', []);
    });
  });
});