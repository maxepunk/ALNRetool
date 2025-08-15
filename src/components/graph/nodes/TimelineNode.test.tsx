import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import type { NodeProps } from '@xyflow/react';
import TimelineNode from './TimelineNode';
import type { GraphNodeData } from '@/lib/graph/types';
import type { TimelineEvent } from '@/types/notion/app';

// Mock CSS modules
vi.mock('./TimelineNode.module.css', () => ({
  default: {
    timelineNode: 'timelineNode',
    selected: 'selected',
    error: 'error',
    dateBadge: 'dateBadge',
    content: 'content',
    icon: 'icon',
    description: 'description',
    characters: 'characters',
    characterCount: 'characterCount',
    evidence: 'evidence',
    evidenceCount: 'evidenceCount',
    handle: 'handle',
    errorIndicator: 'errorIndicator',
    important: 'important',
    moderate: 'moderate',
    minor: 'minor',
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

describe('TimelineNode', () => {
  const createMockNodeProps = (
    event: Partial<TimelineEvent> = {},
    metadata: Partial<GraphNodeData<TimelineEvent>['metadata']> = {}
  ): NodeProps => {
    const defaultEvent: TimelineEvent = {
      id: 'event-1',
      name: 'Test Event',
      description: 'Test Event',
      date: '2024-01-15',
      charactersInvolvedIds: [],
      memoryEvidenceIds: [],
      memTypes: [],
      notes: '',
      lastEditedTime: '',
      ...event
    };

    const defaultMetadata: GraphNodeData<TimelineEvent>['metadata'] = {
      entityType: 'timeline',
      visualHints: {
        size: 'medium'
      },
      ...metadata
    };

    return {
      id: 'node-1',
      type: 'timeline',
      position: { x: 0, y: 0 },
      data: {
        entity: defaultEvent,
        label: defaultEvent.description,
        metadata: defaultMetadata
      } as GraphNodeData<TimelineEvent>,
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
    it('renders event description', () => {
      const props = createMockNodeProps({ description: 'Murder occurred' });
      render(<TimelineNode {...props} />);
      expect(screen.getByText('Murder occurred')).toBeInTheDocument();
    });

    it('applies base CSS classes', () => {
      const props = createMockNodeProps();
      const { container } = render(<TimelineNode {...props} />);
      const node = container.firstChild as HTMLElement;
      expect(node).toHaveClass('timelineNode');
    });

    it('has correct displayName for debugging', () => {
      expect(TimelineNode.displayName).toBe('TimelineNode');
    });

    it('renders calendar icon', () => {
      const props = createMockNodeProps();
      render(<TimelineNode {...props} />);
      expect(screen.getByText('📅')).toBeInTheDocument();
    });
  });

  describe('Date Formatting', () => {
    it('formats valid date correctly', () => {
      const props = createMockNodeProps({ date: '2024-01-15' });
      const { container } = render(<TimelineNode {...props} />);
      const dateBadge = container.querySelector('.dateBadge');
      // Check that the date was formatted (not the raw ISO string)
      expect(dateBadge?.textContent).not.toBe('2024-01-15');
      expect(dateBadge?.textContent).toContain('2024');
      expect(dateBadge?.textContent).not.toBe('Unknown Date');
    });

    it('formats date with different format', () => {
      const props = createMockNodeProps({ date: '2023-12-25' });
      const { container } = render(<TimelineNode {...props} />);
      const dateBadge = container.querySelector('.dateBadge');
      // Check that the date was formatted (not the raw ISO string)
      expect(dateBadge?.textContent).not.toBe('2023-12-25');
      expect(dateBadge?.textContent).toContain('2023');
      expect(dateBadge?.textContent).not.toBe('Unknown Date');
    });

    it('handles invalid date format gracefully', () => {
      const props = createMockNodeProps({ date: 'invalid-date' });
      render(<TimelineNode {...props} />);
      expect(screen.getByText('invalid-date')).toBeInTheDocument();
    });

    it('shows Unknown Date when date is undefined', () => {
      const props = createMockNodeProps({ date: undefined });
      render(<TimelineNode {...props} />);
      expect(screen.getByText('Unknown Date')).toBeInTheDocument();
    });

    it('shows Unknown Date when date is undefined', () => {
      const props = createMockNodeProps({ date: undefined });
      render(<TimelineNode {...props} />);
      expect(screen.getByText('Unknown Date')).toBeInTheDocument();
    });

    it('shows Unknown Date when date is empty string', () => {
      const props = createMockNodeProps({ date: '' });
      render(<TimelineNode {...props} />);
      expect(screen.getByText('Unknown Date')).toBeInTheDocument();
    });
  });

  describe('Importance Classification', () => {
    it('applies important class for > 3 characters', () => {
      const props = createMockNodeProps({ 
        charactersInvolvedIds: ['c1', 'c2', 'c3', 'c4'] 
      });
      const { container } = render(<TimelineNode {...props} />);
      const node = container.firstChild as HTMLElement;
      expect(node).toHaveClass('important');
    });

    it('applies moderate class for 2-3 characters', () => {
      const props = createMockNodeProps({ 
        charactersInvolvedIds: ['c1', 'c2'] 
      });
      const { container } = render(<TimelineNode {...props} />);
      const node = container.firstChild as HTMLElement;
      expect(node).toHaveClass('moderate');
    });

    it('applies minor class for 0-1 characters', () => {
      const props = createMockNodeProps({ 
        charactersInvolvedIds: ['c1'] 
      });
      const { container } = render(<TimelineNode {...props} />);
      const node = container.firstChild as HTMLElement;
      expect(node).toHaveClass('minor');
    });

    it('applies minor class when no characters', () => {
      const props = createMockNodeProps({ 
        charactersInvolvedIds: [] 
      });
      const { container } = render(<TimelineNode {...props} />);
      const node = container.firstChild as HTMLElement;
      expect(node).toHaveClass('minor');
    });

    it('handles undefined charactersInvolvedIds', () => {
      const props = createMockNodeProps({ 
        charactersInvolvedIds: undefined 
      });
      const { container } = render(<TimelineNode {...props} />);
      const node = container.firstChild as HTMLElement;
      expect(node).toHaveClass('minor');
    });
  });

  describe('Character Count Display', () => {
    it('shows character count when > 0', () => {
      const props = createMockNodeProps({ 
        charactersInvolvedIds: ['c1', 'c2', 'c3'] 
      });
      render(<TimelineNode {...props} />);
      expect(screen.getByText('👥 3')).toBeInTheDocument();
    });

    it('does not show character count when empty', () => {
      const props = createMockNodeProps({ 
        charactersInvolvedIds: [] 
      });
      render(<TimelineNode {...props} />);
      expect(screen.queryByText('👥')).not.toBeInTheDocument();
    });

    it('does not show character count when undefined', () => {
      const props = createMockNodeProps({ 
        charactersInvolvedIds: undefined 
      });
      render(<TimelineNode {...props} />);
      expect(screen.queryByText('👥')).not.toBeInTheDocument();
    });
  });

  describe('Evidence Count Display', () => {
    it('shows evidence count when > 0', () => {
      const props = createMockNodeProps({ 
        memoryEvidenceIds: ['e1', 'e2'] 
      });
      render(<TimelineNode {...props} />);
      expect(screen.getByText('🔍 2')).toBeInTheDocument();
    });

    it('does not show evidence count when empty', () => {
      const props = createMockNodeProps({ 
        memoryEvidenceIds: [] 
      });
      render(<TimelineNode {...props} />);
      expect(screen.queryByText('🔍')).not.toBeInTheDocument();
    });

    it('does not show evidence count when undefined', () => {
      const props = createMockNodeProps({ 
        memoryEvidenceIds: undefined 
      });
      render(<TimelineNode {...props} />);
      expect(screen.queryByText('🔍')).not.toBeInTheDocument();
    });
  });

  describe('Selection State', () => {
    it('applies selected class when selected', () => {
      const props = createMockNodeProps();
      props.selected = true;
      const { container } = render(<TimelineNode {...props} />);
      const node = container.firstChild as HTMLElement;
      expect(node).toHaveClass('selected');
    });

    it('does not apply selected class when not selected', () => {
      const props = createMockNodeProps();
      props.selected = false;
      const { container } = render(<TimelineNode {...props} />);
      const node = container.firstChild as HTMLElement;
      expect(node).not.toHaveClass('selected');
    });
  });

  describe('Error State', () => {
    it('shows error indicator when error state exists', () => {
      const props = createMockNodeProps({}, { 
        errorState: { 
          type: 'missing_data',
          message: 'Invalid event data' 
        } 
      });
      render(<TimelineNode {...props} />);
      expect(screen.getByText('⚠️')).toBeInTheDocument();
    });

    it('includes error message in title attribute', () => {
      const props = createMockNodeProps({}, { 
        errorState: { 
          type: 'invalid_relation',
          message: 'Invalid event data' 
        } 
      });
      const { container } = render(<TimelineNode {...props} />);
      const errorIndicator = container.querySelector('.errorIndicator');
      expect(errorIndicator).toHaveAttribute('title', 'Invalid event data');
    });

    it('applies error class when error exists', () => {
      const props = createMockNodeProps({}, { 
        errorState: { 
          type: 'parse_error',
          message: 'Invalid event data' 
        } 
      });
      const { container } = render(<TimelineNode {...props} />);
      const node = container.firstChild as HTMLElement;
      expect(node).toHaveClass('error');
    });

    it('does not show error indicator when no error', () => {
      const props = createMockNodeProps();
      render(<TimelineNode {...props} />);
      expect(screen.queryByText('⚠️')).not.toBeInTheDocument();
    });
  });

  describe('Handle Components', () => {
    it('renders revealed-by handle on top', () => {
      const props = createMockNodeProps();
      render(<TimelineNode {...props} />);
      const handle = screen.getByTestId('handle-revealed-by');
      expect(handle).toHaveAttribute('data-type', 'target');
      expect(handle).toHaveAttribute('data-position', 'top');
    });

    it('renders connects handle on bottom', () => {
      const props = createMockNodeProps();
      render(<TimelineNode {...props} />);
      const handle = screen.getByTestId('handle-connects');
      expect(handle).toHaveAttribute('data-type', 'source');
      expect(handle).toHaveAttribute('data-position', 'bottom');
    });
  });

  describe('Edge Cases', () => {
    it('handles all null/undefined optional fields', () => {
      const props = createMockNodeProps({
        date: undefined,
        charactersInvolvedIds: undefined,
        memoryEvidenceIds: undefined,
        memTypes: undefined,
        notes: undefined
      });
      const { container } = render(<TimelineNode {...props} />);
      expect(container.firstChild).toBeInTheDocument();
      expect(screen.getByText('Test Event')).toBeInTheDocument();
      expect(screen.getByText('Unknown Date')).toBeInTheDocument();
    });

    it('renders with minimal required data', () => {
      const minimalProps: NodeProps = {
        id: 'node-1',
        type: 'timeline',
        position: { x: 0, y: 0 },
        data: {
          entity: {
            id: 'event-1',
            description: 'Minimal Event',
          } as any,
          label: 'Minimal Event',
          metadata: {
            entityType: 'timeline'
          } as any
        } as GraphNodeData<TimelineEvent>,
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
      
      const { container } = render(<TimelineNode {...minimalProps} />);
      expect(container.firstChild).toBeInTheDocument();
      expect(screen.getByText('Minimal Event')).toBeInTheDocument();
    });

    it('handles events with many characters and evidence', () => {
      const props = createMockNodeProps({
        charactersInvolvedIds: Array.from({ length: 10 }, (_, i) => `char-${i}`),
        memoryEvidenceIds: Array.from({ length: 20 }, (_, i) => `evidence-${i}`)
      });
      render(<TimelineNode {...props} />);
      expect(screen.getByText('👥 10')).toBeInTheDocument();
      expect(screen.getByText('🔍 20')).toBeInTheDocument();
    });
  });
});