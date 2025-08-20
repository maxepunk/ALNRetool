import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GraphControls from './GraphControls';
import { useGraphStore } from '@/stores/graphStore';

// Mock the graph store
vi.mock('@/stores/graphStore', () => ({
  useGraphStore: vi.fn(),
}));

describe('GraphControls', () => {
  const mockZoomIn = vi.fn();
  const mockZoomOut = vi.fn();
  const mockResetZoom = vi.fn();
  const mockFitView = vi.fn();
  const mockSetLayoutAlgorithm = vi.fn();
  const mockTriggerRelayout = vi.fn();

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup mock store
    (useGraphStore as any).mockImplementation((selector: any) => {
      const state = {
        zoomIn: mockZoomIn,
        zoomOut: mockZoomOut,
        resetZoom: mockResetZoom,
        fitView: mockFitView,
        layoutAlgorithm: 'dagre',
        setLayoutAlgorithm: mockSetLayoutAlgorithm,
        triggerRelayout: mockTriggerRelayout,
      };
      return selector(state);
    });
  });

  it('renders zoom controls', () => {
    render(<GraphControls />);

    // Check zoom buttons are rendered (by their titles)
    expect(screen.getByTitle('Zoom In')).toBeInTheDocument();
    expect(screen.getByTitle('Zoom Out')).toBeInTheDocument();
    expect(screen.getByTitle('Fit to View')).toBeInTheDocument();
    expect(screen.getByTitle('Reset Zoom')).toBeInTheDocument();
  });

  it('handles zoom in', () => {
    render(<GraphControls />);
    
    const zoomInButton = screen.getByTitle('Zoom In');
    fireEvent.click(zoomInButton);
    
    expect(mockZoomIn).toHaveBeenCalledTimes(1);
  });

  it('handles zoom out', () => {
    render(<GraphControls />);
    
    const zoomOutButton = screen.getByTitle('Zoom Out');
    fireEvent.click(zoomOutButton);
    
    expect(mockZoomOut).toHaveBeenCalledTimes(1);
  });

  it('handles fit to view', () => {
    render(<GraphControls />);
    
    const fitViewButton = screen.getByTitle('Fit to View');
    fireEvent.click(fitViewButton);
    
    expect(mockFitView).toHaveBeenCalledTimes(1);
  });

  it('handles reset zoom', () => {
    render(<GraphControls />);
    
    const resetButton = screen.getByTitle('Reset Zoom');
    fireEvent.click(resetButton);
    
    expect(mockResetZoom).toHaveBeenCalledTimes(1);
  });

  it('renders layout settings button', () => {
    render(<GraphControls />);
    
    const settingsButton = screen.getByTitle('Layout Settings');
    expect(settingsButton).toBeInTheDocument();
  });

  it('handles layout algorithm change', () => {
    render(<GraphControls />);
    
    // Open the dropdown
    const settingsButton = screen.getByTitle('Layout Settings');
    fireEvent.click(settingsButton);
    
    // Click on Force-Directed option
    const forceOption = screen.getByText('Force-Directed');
    fireEvent.click(forceOption);
    
    expect(mockSetLayoutAlgorithm).toHaveBeenCalledWith('force');
    expect(mockTriggerRelayout).toHaveBeenCalledTimes(1);
  });

  it('shows current layout algorithm as selected', () => {
    // Setup mock to return 'force' as current algorithm
    (useGraphStore as any).mockImplementation((selector: any) => {
      const state = {
        zoomIn: mockZoomIn,
        zoomOut: mockZoomOut,
        resetZoom: mockResetZoom,
        fitView: mockFitView,
        layoutAlgorithm: 'force',
        setLayoutAlgorithm: mockSetLayoutAlgorithm,
        triggerRelayout: mockTriggerRelayout,
      };
      return selector(state);
    });
    
    render(<GraphControls />);
    
    // Open the dropdown
    const settingsButton = screen.getByTitle('Layout Settings');
    fireEvent.click(settingsButton);
    
    // Check that Force-Directed has the active styling
    const forceOption = screen.getByText('Force-Directed');
    expect(forceOption.parentElement).toHaveClass('bg-accent');
  });

  it('handles re-layout trigger', () => {
    render(<GraphControls />);
    
    // Open the dropdown
    const settingsButton = screen.getByTitle('Layout Settings');
    fireEvent.click(settingsButton);
    
    // Click on Re-layout option
    const relayoutOption = screen.getByText('Re-layout Graph');
    fireEvent.click(relayoutOption);
    
    expect(mockTriggerRelayout).toHaveBeenCalledTimes(1);
  });
});