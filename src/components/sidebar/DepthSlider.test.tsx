/**
 * Tests for DepthSlider Component
 * 
 * Tests focus on user-visible BEHAVIOR:
 * - Slider interaction and value changes
 * - Description updates based on depth and selection state
 * - Visual feedback for current depth level
 * - Contextual tips when node is selected
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DepthSlider } from './DepthSlider';
import { useFilterStore } from '@/stores/filterStore';

// Mock the filter store
vi.mock('@/stores/filterStore', () => ({
  useFilterStore: vi.fn()
}));

describe('DepthSlider - Connection Depth Control', () => {
  // Mock store state and functions
  const mockSetConnectionDepth = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementation - no node selected, depth 1
    (useFilterStore as any).mockImplementation((selector: any) => {
      const state = {
        connectionDepth: 1,
        setConnectionDepth: mockSetConnectionDepth,
        selectedNodeId: null
      };
      
      if (typeof selector === 'function') {
        return selector(state);
      }
      return state;
    });
  });
  
  describe('Basic Rendering', () => {
    it('should display the component title', () => {
      render(<DepthSlider />);
      
      expect(screen.getByText('Connection Depth')).toBeInTheDocument();
    });
    
    it('should display the slider with correct range', () => {
      const { container } = render(<DepthSlider />);
      
      const slider = container.querySelector('input[type="range"]') as HTMLInputElement;
      expect(slider).toBeInTheDocument();
      expect(slider.min).toBe('0');
      expect(slider.max).toBe('5');
      expect(slider.step).toBe('1');
    });
    
    it('should display tick marks for all depth levels', () => {
      render(<DepthSlider />);
      
      // Should show numbers 0-5
      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });
    
    it('should display depth descriptions', () => {
      render(<DepthSlider />);
      
      expect(screen.getByText('Only filtered nodes, no connections')).toBeInTheDocument();
      expect(screen.getByText('Direct neighbors only')).toBeInTheDocument();
      expect(screen.getByText('Extended neighborhood')).toBeInTheDocument();
      expect(screen.getByText('Wide network view')).toBeInTheDocument();
    });
  });
  
  describe('Depth Value Display', () => {
    it('should show "Direct" label for depth 1', () => {
      (useFilterStore as any).mockImplementation((selector: any) => {
        const state = {
          connectionDepth: 1,
          setConnectionDepth: mockSetConnectionDepth,
          selectedNodeId: null
        };
        return typeof selector === 'function' ? selector(state) : state;
      });
      
      render(<DepthSlider />);
      
      expect(screen.getByText('Direct')).toBeInTheDocument();
    });
    
    it('should show "None" label for depth 0', () => {
      (useFilterStore as any).mockImplementation((selector: any) => {
        const state = {
          connectionDepth: 0,
          setConnectionDepth: mockSetConnectionDepth,
          selectedNodeId: null
        };
        return typeof selector === 'function' ? selector(state) : state;
      });
      
      render(<DepthSlider />);
      
      expect(screen.getByText('None')).toBeInTheDocument();
    });
    
    it('should show "3 levels" label for depth 3', () => {
      (useFilterStore as any).mockImplementation((selector: any) => {
        const state = {
          connectionDepth: 3,
          setConnectionDepth: mockSetConnectionDepth,
          selectedNodeId: null
        };
        return typeof selector === 'function' ? selector(state) : state;
      });
      
      render(<DepthSlider />);
      
      expect(screen.getByText('3 levels')).toBeInTheDocument();
    });
    
    it('should reflect current value in slider position', () => {
      (useFilterStore as any).mockImplementation((selector: any) => {
        const state = {
          connectionDepth: 4,
          setConnectionDepth: mockSetConnectionDepth,
          selectedNodeId: null
        };
        return typeof selector === 'function' ? selector(state) : state;
      });
      
      const { container } = render(<DepthSlider />);
      
      const slider = container.querySelector('input[type="range"]') as HTMLInputElement;
      expect(slider.value).toBe('4');
    });
  });
  
  describe('Description Updates - No Node Selected', () => {
    it('should show "only filtered nodes" for depth 0', () => {
      (useFilterStore as any).mockImplementation((selector: any) => {
        const state = {
          connectionDepth: 0,
          setConnectionDepth: mockSetConnectionDepth,
          selectedNodeId: null
        };
        return typeof selector === 'function' ? selector(state) : state;
      });
      
      render(<DepthSlider />);
      
      expect(screen.getByText('Showing only filtered nodes')).toBeInTheDocument();
    });
    
    it('should show "1 level of connections" for depth 1', () => {
      (useFilterStore as any).mockImplementation((selector: any) => {
        const state = {
          connectionDepth: 1,
          setConnectionDepth: mockSetConnectionDepth,
          selectedNodeId: null
        };
        return typeof selector === 'function' ? selector(state) : state;
      });
      
      render(<DepthSlider />);
      
      expect(screen.getByText('Showing filtered nodes + 1 level of connections')).toBeInTheDocument();
    });
    
    it('should show "3 levels of connections" for depth 3', () => {
      (useFilterStore as any).mockImplementation((selector: any) => {
        const state = {
          connectionDepth: 3,
          setConnectionDepth: mockSetConnectionDepth,
          selectedNodeId: null
        };
        return typeof selector === 'function' ? selector(state) : state;
      });
      
      render(<DepthSlider />);
      
      expect(screen.getByText('Showing filtered nodes + 3 levels of connections')).toBeInTheDocument();
    });
  });
  
  describe('Description Updates - Node Selected', () => {
    it('should show node-specific description when node is selected', () => {
      (useFilterStore as any).mockImplementation((selector: any) => {
        const state = {
          connectionDepth: 2,
          setConnectionDepth: mockSetConnectionDepth,
          selectedNodeId: 'node-123'
        };
        return typeof selector === 'function' ? selector(state) : state;
      });
      
      render(<DepthSlider />);
      
      expect(screen.getByText('Showing 2 levels from selected node')).toBeInTheDocument();
    });
    
    it('should show singular "level" for depth 1 with selected node', () => {
      (useFilterStore as any).mockImplementation((selector: any) => {
        const state = {
          connectionDepth: 1,
          setConnectionDepth: mockSetConnectionDepth,
          selectedNodeId: 'node-456'
        };
        return typeof selector === 'function' ? selector(state) : state;
      });
      
      render(<DepthSlider />);
      
      expect(screen.getByText('Showing 1 level from selected node')).toBeInTheDocument();
    });
    
    it('should display selection tip when node is selected', () => {
      (useFilterStore as any).mockImplementation((selector: any) => {
        const state = {
          connectionDepth: 2,
          setConnectionDepth: mockSetConnectionDepth,
          selectedNodeId: 'node-789'
        };
        return typeof selector === 'function' ? selector(state) : state;
      });
      
      render(<DepthSlider />);
      
      expect(screen.getByText('Node Selected:')).toBeInTheDocument();
      expect(screen.getByText(/Showing connections from the selected node only/)).toBeInTheDocument();
    });
    
    it('should NOT display selection tip when no node is selected', () => {
      (useFilterStore as any).mockImplementation((selector: any) => {
        const state = {
          connectionDepth: 2,
          setConnectionDepth: mockSetConnectionDepth,
          selectedNodeId: null
        };
        return typeof selector === 'function' ? selector(state) : state;
      });
      
      render(<DepthSlider />);
      
      expect(screen.queryByText('Node Selected:')).not.toBeInTheDocument();
    });
  });
  
  describe('User Interaction', () => {
    it('should call setConnectionDepth when slider value changes', () => {
      const { container } = render(<DepthSlider />);
      
      const slider = container.querySelector('input[type="range"]') as HTMLInputElement;
      
      // Change to depth 3
      fireEvent.change(slider, { target: { value: '3' } });
      
      expect(mockSetConnectionDepth).toHaveBeenCalledWith(3);
      expect(mockSetConnectionDepth).toHaveBeenCalledTimes(1);
    });
    
    it('should handle multiple slider changes', () => {
      const { container } = render(<DepthSlider />);
      
      const slider = container.querySelector('input[type="range"]') as HTMLInputElement;
      
      // Change to different values
      fireEvent.change(slider, { target: { value: '0' } });
      fireEvent.change(slider, { target: { value: '5' } });
      fireEvent.change(slider, { target: { value: '2' } });
      
      expect(mockSetConnectionDepth).toHaveBeenCalledTimes(3);
      expect(mockSetConnectionDepth).toHaveBeenNthCalledWith(1, 0);
      expect(mockSetConnectionDepth).toHaveBeenNthCalledWith(2, 5);
      expect(mockSetConnectionDepth).toHaveBeenNthCalledWith(3, 2);
    });
  });
  
  describe('Visual Highlighting', () => {
    it('should highlight current depth level tick mark', () => {
      (useFilterStore as any).mockImplementation((selector: any) => {
        const state = {
          connectionDepth: 2,
          setConnectionDepth: mockSetConnectionDepth,
          selectedNodeId: null
        };
        return typeof selector === 'function' ? selector(state) : state;
      });
      
      const { container } = render(<DepthSlider />);
      
      // Find the tick mark for depth 2
      const tickLabels = container.querySelectorAll('.text-xs.mt-1');
      const depthTwoLabel = Array.from(tickLabels).find(el => el.textContent === '2');
      
      // Should have highlighting classes
      expect(depthTwoLabel).toHaveClass('text-blue-600');
      expect(depthTwoLabel).toHaveClass('font-semibold');
    });
    
    it('should highlight matching depth description range', () => {
      (useFilterStore as any).mockImplementation((selector: any) => {
        const state = {
          connectionDepth: 0,
          setConnectionDepth: mockSetConnectionDepth,
          selectedNodeId: null
        };
        return typeof selector === 'function' ? selector(state) : state;
      });
      
      const { container } = render(<DepthSlider />);
      
      // Find the description for depth 0
      const descriptions = container.querySelectorAll('.flex.items-center.gap-2');
      const depthZeroDesc = Array.from(descriptions).find(el => 
        el.textContent?.includes('Only filtered nodes, no connections')
      );
      
      // Should have highlighting classes
      expect(depthZeroDesc).toHaveClass('font-medium');
      expect(depthZeroDesc).toHaveClass('text-foreground');
    });
    
    it('should highlight 2-3 range when depth is 2', () => {
      (useFilterStore as any).mockImplementation((selector: any) => {
        const state = {
          connectionDepth: 2,
          setConnectionDepth: mockSetConnectionDepth,
          selectedNodeId: null
        };
        return typeof selector === 'function' ? selector(state) : state;
      });
      
      const { container } = render(<DepthSlider />);
      
      // Find the description for 2-3 range
      const descriptions = container.querySelectorAll('.flex.items-center.gap-2');
      const extendedDesc = Array.from(descriptions).find(el => 
        el.textContent?.includes('Extended neighborhood')
      );
      
      // Should have highlighting classes
      expect(extendedDesc).toHaveClass('font-medium');
      expect(extendedDesc).toHaveClass('text-foreground');
    });
    
    it('should highlight 4-5 range when depth is 5', () => {
      (useFilterStore as any).mockImplementation((selector: any) => {
        const state = {
          connectionDepth: 5,
          setConnectionDepth: mockSetConnectionDepth,
          selectedNodeId: null
        };
        return typeof selector === 'function' ? selector(state) : state;
      });
      
      const { container } = render(<DepthSlider />);
      
      // Find the description for 4-5 range
      const descriptions = container.querySelectorAll('.flex.items-center.gap-2');
      const wideDesc = Array.from(descriptions).find(el => 
        el.textContent?.includes('Wide network view')
      );
      
      // Should have highlighting classes
      expect(wideDesc).toHaveClass('font-medium');
      expect(wideDesc).toHaveClass('text-foreground');
    });
  });
  
  describe('Accessibility', () => {
    it('should display visible label text for users', () => {
      const { container } = render(<DepthSlider />);
      
      // Test behavior: Users can see the label text
      expect(screen.getByText('Depth Level')).toBeInTheDocument();
      
      // Test behavior: The slider control is present and can be interacted with
      const slider = container.querySelector('input[type="range"]');
      expect(slider).toBeInTheDocument();
    });
    
    it('should provide informative icon with description', () => {
      const { container } = render(<DepthSlider />);
      
      // Info icon should be present
      const infoIcon = container.querySelector('.lucide-info');
      expect(infoIcon).toBeInTheDocument();
    });
    
    it('should maintain keyboard navigation for slider', () => {
      const { container } = render(<DepthSlider />);
      
      const slider = container.querySelector('input[type="range"]') as HTMLInputElement;
      
      // Slider should be focusable
      slider.focus();
      expect(document.activeElement).toBe(slider);
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle undefined selectedNodeId gracefully', () => {
      (useFilterStore as any).mockImplementation((selector: any) => {
        const state = {
          connectionDepth: 1,
          setConnectionDepth: mockSetConnectionDepth,
          selectedNodeId: undefined
        };
        return typeof selector === 'function' ? selector(state) : state;
      });
      
      render(<DepthSlider />);
      
      // Should show non-selected description
      expect(screen.getByText('Showing filtered nodes + 1 level of connections')).toBeInTheDocument();
      expect(screen.queryByText('Node Selected:')).not.toBeInTheDocument();
    });
    
    it('should handle empty string selectedNodeId as no selection', () => {
      (useFilterStore as any).mockImplementation((selector: any) => {
        const state = {
          connectionDepth: 1,
          setConnectionDepth: mockSetConnectionDepth,
          selectedNodeId: ''
        };
        return typeof selector === 'function' ? selector(state) : state;
      });
      
      render(<DepthSlider />);
      
      // Should show non-selected description (empty string is falsy)
      expect(screen.getByText('Showing filtered nodes + 1 level of connections')).toBeInTheDocument();
      expect(screen.queryByText('Node Selected:')).not.toBeInTheDocument();
    });
  });
});