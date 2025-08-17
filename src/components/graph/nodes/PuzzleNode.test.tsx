import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import type { NodeProps } from '@xyflow/react';
import PuzzleNode from './PuzzleNode';
import type { GraphNodeData } from '@/lib/graph/types';
import type { Puzzle } from '@/types/notion/app';

// Mock CSS modules
vi.mock('./PuzzleNode.module.css', () => ({
  default: {
    puzzleNode: 'puzzleNode',
    selected: 'selected',
    error: 'error',
    chained: 'chained',
    chainBadge: 'chainBadge',
    content: 'content',
    icon: 'icon',
    name: 'name',
    stats: 'stats',
    requirement: 'requirement',
    reward: 'reward',
    owner: 'owner',
    handleRequires: 'handleRequires',
    handleRewards: 'handleRewards',
    handleChain: 'handleChain',
    errorIndicator: 'errorIndicator',
    'complexity-small': 'complexity-small',
    'complexity-medium': 'complexity-medium',
    'complexity-large': 'complexity-large',
  }
}));

// Mock React Flow Handle component
vi.mock('@xyflow/react', () => ({
  Handle: vi.fn(({ type, position, id }) => 
    <div data-testid={`handle-${id}`} data-type={type} data-position={position} />
  ),
  Position: {
    Top: 'top',
    Right: 'right',
    Bottom: 'bottom',
    Left: 'left',
  }
}));

describe('PuzzleNode', () => {
  const createMockNodeProps = (
    puzzle: Partial<Puzzle> = {},
    metadata: Partial<GraphNodeData<Puzzle>['metadata']> = {}
  ): NodeProps => {
    const defaultPuzzle: Puzzle = {
      id: 'puzzle-1',
      name: 'Test Puzzle',
      descriptionSolution: 'A test puzzle solution',
      puzzleElementIds: [],
      lockedItemId: undefined,
      ownerId: undefined,
      rewardIds: [],
      parentItemId: undefined,
      subPuzzleIds: [],
      storyReveals: [],
      timing: [],
      narrativeThreads: [],
      assetLink: undefined,
      ...puzzle
    };

    const defaultMetadata: GraphNodeData<Puzzle>['metadata'] = {
      entityType: 'puzzle',
      visualHints: {
        size: 'medium'
      },
      ...metadata
    };

    return {
      id: 'node-1',
      type: 'puzzle',
      position: { x: 0, y: 0 },
      data: {
        entity: defaultPuzzle,
        label: defaultPuzzle.name,
        metadata: defaultMetadata
      } as GraphNodeData<Puzzle>,
      selected: false,
      isConnectable: true,
      xPos: 0,
      yPos: 0,
      zIndex: 0,
      dragging: false,
      draggable: true,
      selectable: true,
      deletable: true
    } as unknown as NodeProps;
  };

  describe('Basic Rendering', () => {
    it('renders puzzle name', () => {
      const props = createMockNodeProps({ name: 'Lockbox Puzzle' });
      render(<PuzzleNode {...props} />);
      expect(screen.getByText('Lockbox Puzzle')).toBeInTheDocument();
    });

    it('applies base CSS classes', () => {
      const props = createMockNodeProps();
      const { container } = render(<PuzzleNode {...props} />);
      const node = container.querySelector('.puzzleNode');
      expect(node).toBeInTheDocument();
    });

    it('has correct displayName for debugging', () => {
      expect(PuzzleNode.displayName).toBe('PuzzleNode');
    });

    it('renders puzzle icon', () => {
      const props = createMockNodeProps();
      render(<PuzzleNode {...props} />);
      expect(screen.getByText('🧩')).toBeInTheDocument();
    });
  });

  describe('Chain Indicator', () => {
    it('shows chain badge when has parent', () => {
      const props = createMockNodeProps({ parentItemId: 'parent-1' });
      render(<PuzzleNode {...props} />);
      expect(screen.getByText('🔗')).toBeInTheDocument();
    });

    it('shows chain badge when has sub-puzzles', () => {
      const props = createMockNodeProps({ 
        subPuzzleIds: ['sub-1', 'sub-2'] 
      });
      render(<PuzzleNode {...props} />);
      expect(screen.getByText('🔗')).toBeInTheDocument();
    });

    it('applies chained class when chained', () => {
      const props = createMockNodeProps({ parentItemId: 'parent-1' });
      const { container } = render(<PuzzleNode {...props} />);
      const node = container.querySelector('.chained');
      expect(node).toBeInTheDocument();
    });

    it('does not show chain badge when not chained', () => {
      const props = createMockNodeProps({ 
        parentItemId: undefined,
        subPuzzleIds: [] 
      });
      render(<PuzzleNode {...props} />);
      expect(screen.queryByText('🔗')).not.toBeInTheDocument();
    });

    it('does not apply chained class when not chained', () => {
      const props = createMockNodeProps();
      const { container } = render(<PuzzleNode {...props} />);
      const node = container.querySelector('.chained');
      expect(node).not.toBeInTheDocument();
    });
  });

  describe('Complexity Classes', () => {
    it('applies small complexity class', () => {
      const props = createMockNodeProps({}, { 
        visualHints: { size: 'small' } 
      });
      const { container } = render(<PuzzleNode {...props} />);
      const node = container.firstChild as HTMLElement;
      expect(node).toHaveClass('complexity-small');
    });

    it('applies medium complexity class by default', () => {
      const props = createMockNodeProps();
      const { container } = render(<PuzzleNode {...props} />);
      const node = container.firstChild as HTMLElement;
      expect(node).toHaveClass('complexity-medium');
    });

    it('applies large complexity class', () => {
      const props = createMockNodeProps({}, { 
        visualHints: { size: 'large' } 
      });
      const { container } = render(<PuzzleNode {...props} />);
      const node = container.firstChild as HTMLElement;
      expect(node).toHaveClass('complexity-large');
    });
  });

  describe('Requirements Display', () => {
    it('shows requirement count when > 0', () => {
      const props = createMockNodeProps({ 
        puzzleElementIds: ['elem-1', 'elem-2', 'elem-3'] 
      });
      render(<PuzzleNode {...props} />);
      expect(screen.getByText('↓ 3')).toBeInTheDocument();
    });

    it('does not show requirement count when empty', () => {
      const props = createMockNodeProps({ 
        puzzleElementIds: [] 
      });
      render(<PuzzleNode {...props} />);
      expect(screen.queryByText(/↓/)).not.toBeInTheDocument();
    });

    it('handles undefined puzzleElementIds', () => {
      const props = createMockNodeProps({ 
        puzzleElementIds: undefined 
      });
      render(<PuzzleNode {...props} />);
      expect(screen.queryByText(/↓/)).not.toBeInTheDocument();
    });
  });

  describe('Rewards Display', () => {
    it('shows reward count when > 0', () => {
      const props = createMockNodeProps({ 
        rewardIds: ['reward-1', 'reward-2'] 
      });
      render(<PuzzleNode {...props} />);
      expect(screen.getByText('↑ 2')).toBeInTheDocument();
    });

    it('does not show reward count when empty', () => {
      const props = createMockNodeProps({ 
        rewardIds: [] 
      });
      render(<PuzzleNode {...props} />);
      expect(screen.queryByText(/↑/)).not.toBeInTheDocument();
    });

    it('handles undefined rewardIds', () => {
      const props = createMockNodeProps({ 
        rewardIds: undefined 
      });
      render(<PuzzleNode {...props} />);
      expect(screen.queryByText(/↑/)).not.toBeInTheDocument();
    });

    it('shows both requirements and rewards', () => {
      const props = createMockNodeProps({ 
        puzzleElementIds: ['elem-1', 'elem-2'],
        rewardIds: ['reward-1', 'reward-2', 'reward-3'] 
      });
      render(<PuzzleNode {...props} />);
      expect(screen.getByText('↓ 2')).toBeInTheDocument();
      expect(screen.getByText('↑ 3')).toBeInTheDocument();
    });
  });

  describe('Owner Indicator', () => {
    it('shows owner indicator when ownerId exists', () => {
      const props = createMockNodeProps({ ownerId: 'char-1' });
      render(<PuzzleNode {...props} />);
      expect(screen.getByText('👤')).toBeInTheDocument();
    });

    it('does not show owner indicator when no owner', () => {
      const props = createMockNodeProps({ ownerId: undefined });
      render(<PuzzleNode {...props} />);
      expect(screen.queryByText('👤')).not.toBeInTheDocument();
    });
  });

  describe('Selection State', () => {
    it('applies selected class when selected', () => {
      const props = createMockNodeProps();
      props.selected = true;
      const { container } = render(<PuzzleNode {...props} />);
      const node = container.querySelector('.selected');
      expect(node).toBeInTheDocument();
    });

    it('does not apply selected class when not selected', () => {
      const props = createMockNodeProps();
      props.selected = false;
      const { container } = render(<PuzzleNode {...props} />);
      const node = container.querySelector('.selected');
      expect(node).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('shows error indicator when error state exists', () => {
      const props = createMockNodeProps({}, { 
        errorState: { 
          type: 'missing_data',
          message: 'Invalid puzzle data' 
        } 
      });
      render(<PuzzleNode {...props} />);
      expect(screen.getByText('⚠️')).toBeInTheDocument();
    });

    it('includes error message in title attribute', () => {
      const props = createMockNodeProps({}, { 
        errorState: { 
          type: 'invalid_relation',
          message: 'Invalid puzzle data' 
        } 
      });
      const { container } = render(<PuzzleNode {...props} />);
      const errorIndicator = container.querySelector('.errorIndicator');
      expect(errorIndicator).toHaveAttribute('title', 'Invalid puzzle data');
    });

    it('applies error class when error exists', () => {
      const props = createMockNodeProps({}, { 
        errorState: { 
          type: 'parse_error',
          message: 'Invalid puzzle data' 
        } 
      });
      const { container } = render(<PuzzleNode {...props} />);
      const node = container.querySelector('.error');
      expect(node).toBeInTheDocument();
    });
  });

  describe('Handle Components', () => {
    it('renders requires handle on top', () => {
      const props = createMockNodeProps();
      render(<PuzzleNode {...props} />);
      const handle = screen.getByTestId('handle-requires');
      expect(handle).toHaveAttribute('data-type', 'target');
      expect(handle).toHaveAttribute('data-position', 'top');
    });

    it('renders rewards handle on bottom', () => {
      const props = createMockNodeProps();
      render(<PuzzleNode {...props} />);
      const handle = screen.getByTestId('handle-rewards');
      expect(handle).toHaveAttribute('data-type', 'source');
      expect(handle).toHaveAttribute('data-position', 'bottom');
    });

    it('renders parent handle on left', () => {
      const props = createMockNodeProps();
      render(<PuzzleNode {...props} />);
      const handle = screen.getByTestId('handle-parent');
      expect(handle).toHaveAttribute('data-type', 'target');
      expect(handle).toHaveAttribute('data-position', 'left');
    });

    it('renders child handle on right', () => {
      const props = createMockNodeProps();
      render(<PuzzleNode {...props} />);
      const handle = screen.getByTestId('handle-child');
      expect(handle).toHaveAttribute('data-type', 'source');
      expect(handle).toHaveAttribute('data-position', 'right');
    });
  });

  describe('Edge Cases', () => {
    it('handles all null/undefined optional fields', () => {
      const props = createMockNodeProps({
        puzzleElementIds: undefined,
        lockedItemId: undefined,
        ownerId: undefined,
        rewardIds: undefined,
        parentItemId: undefined,
        subPuzzleIds: undefined
      });
      const { container } = render(<PuzzleNode {...props} />);
      expect(container.firstChild).toBeInTheDocument();
      expect(screen.getByText('Test Puzzle')).toBeInTheDocument();
    });

    it('renders with minimal required data', () => {
      const minimalProps: NodeProps = {
        id: 'node-1',
        type: 'puzzle',
        position: { x: 0, y: 0 },
        data: {
          entity: {
            id: 'puzzle-1',
            name: 'Minimal Puzzle',
          } as any,
          label: 'Minimal Puzzle',
          metadata: {
            entityType: 'puzzle'
          } as any
        } as GraphNodeData<Puzzle>,
        selected: false,
        isConnectable: true,
        xPos: 0,
        yPos: 0,
        zIndex: 0,
        dragging: false,
        draggable: true,
        selectable: true,
        deletable: true
      } as unknown as NodeProps;
      
      const { container } = render(<PuzzleNode {...minimalProps} />);
      expect(container.firstChild).toBeInTheDocument();
      expect(screen.getByText('Minimal Puzzle')).toBeInTheDocument();
    });

    it('handles complex chain with parent and children', () => {
      const props = createMockNodeProps({
        parentItemId: 'parent-1',
        subPuzzleIds: ['sub-1', 'sub-2', 'sub-3'],
        puzzleElementIds: ['elem-1', 'elem-2'],
        rewardIds: ['reward-1'],
        ownerId: 'char-1'
      });
      render(<PuzzleNode {...props} />);
      expect(screen.getByText('🔗')).toBeInTheDocument();
      expect(screen.getByText('↓ 2')).toBeInTheDocument();
      expect(screen.getByText('↑ 1')).toBeInTheDocument();
      expect(screen.getByText('👤')).toBeInTheDocument();
    });
  });
});