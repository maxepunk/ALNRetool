import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import type { NodeProps } from '@xyflow/react';
import ElementNode from './ElementNode';
import type { GraphNodeData, SFMetadata } from '@/lib/graph/types';
import type { Element } from '@/types/notion/app';

// Mock CSS modules
vi.mock('./ElementNode.module.css', () => ({
  default: {
    elementNode: 'elementNode',
    selected: 'selected',
    error: 'error',
    hasSF: 'hasSF',
    sfBadge: 'sfBadge',
    statusBar: 'statusBar',
    content: 'content',
    type: 'type',
    name: 'name',
    sfDetails: 'sfDetails',
    rating: 'rating',
    memoryType: 'memoryType',
    containerIndicator: 'containerIndicator',
    handle: 'handle',
    handleTop: 'handleTop',
    handleBottom: 'handleBottom',
    errorIndicator: 'errorIndicator',
    'status-done': 'status-done',
    'status-idea-placeholder': 'status-idea-placeholder',
    'status-in-development': 'status-in-development',
    'status-writing-complete': 'status-writing-complete',
    'status-unknown': 'status-unknown',
    'type-prop': 'type-prop',
    'type-memory-token': 'type-memory-token',
    'type-document': 'type-document',
    'type-set-dressing': 'type-set-dressing',
    'size-small': 'size-small',
    'size-medium': 'size-medium',
    'size-large': 'size-large',
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

describe('ElementNode', () => {
  const createMockNodeProps = (
    element: Partial<Element> = {},
    metadata: Partial<GraphNodeData<Element>['metadata']> = {},
    sfPatterns?: SFMetadata
  ): NodeProps => {
    const defaultElement: Element = {
      id: 'elem-1',
      name: 'Test Element',
      descriptionText: 'A test element',
      sfPatterns: {},
      basicType: 'Prop',
      ownerId: undefined,
      containerId: undefined,
      contentIds: [],
      timelineEventId: undefined,
      status: 'Done',
      firstAvailable: 'Act 0',
      requiredForPuzzleIds: [],
      rewardedByPuzzleIds: [],
      containerPuzzleId: undefined,
      narrativeThreads: [],
      associatedCharacterIds: [],
      puzzleChain: [],
      productionNotes: '',
      filesMedia: [],
      contentLink: undefined,
      isContainer: false,
      ...element
    };

    const defaultMetadata: GraphNodeData<Element>['metadata'] = {
      entityType: 'element',
      visualHints: {
        size: 'small'
      },
      sfPatterns,
      ...metadata
    };

    return {
      id: 'node-1',
      type: 'element',
      position: { x: 0, y: 0 },
      data: {
        entity: defaultElement,
        label: defaultElement.name,
        metadata: defaultMetadata
      } as GraphNodeData<Element>,
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
    it('renders element name', () => {
      const props = createMockNodeProps({ name: 'Key Card' });
      render(<ElementNode {...props} />);
      expect(screen.getByText('Key Card')).toBeInTheDocument();
    });

    it('applies base CSS classes', () => {
      const props = createMockNodeProps();
      const { container } = render(<ElementNode {...props} />);
      const node = container.firstChild as HTMLElement;
      expect(node).toHaveClass('elementNode');
    });

    it('has correct displayName for debugging', () => {
      expect(ElementNode.displayName).toBe('ElementNode');
    });

    it('always renders status bar', () => {
      const props = createMockNodeProps();
      const { container } = render(<ElementNode {...props} />);
      expect(container.querySelector('.statusBar')).toBeInTheDocument();
    });
  });

  describe('Type Display', () => {
    it('displays basic type when present', () => {
      const props = createMockNodeProps({ basicType: 'Memory Token (Audio)' });
      render(<ElementNode {...props} />);
      expect(screen.getByText('Memory Token (Audio)')).toBeInTheDocument();
    });

    it('displays Prop as fallback when basicType is undefined', () => {
      const props = createMockNodeProps({ basicType: undefined });
      render(<ElementNode {...props} />);
      expect(screen.getByText('Prop')).toBeInTheDocument();
    });

    it('displays Prop as fallback when basicType is undefined', () => {
      const props = createMockNodeProps({ basicType: undefined });
      render(<ElementNode {...props} />);
      expect(screen.getByText('Prop')).toBeInTheDocument();
    });

    it('displays correct type text', () => {
      const props = createMockNodeProps({ basicType: 'Memory Token (Audio)' });
      render(<ElementNode {...props} />);
      // The component should display the basic type text
      expect(screen.getByText('Memory Token (Audio)')).toBeInTheDocument();
    });

    it('handles Document type', () => {
      const props = createMockNodeProps({ basicType: 'Document' });
      const { container } = render(<ElementNode {...props} />);
      const node = container.firstChild as HTMLElement;
      expect(node).toHaveClass('type-document');
    });

    it('handles Set Dressing type', () => {
      const props = createMockNodeProps({ basicType: 'Set Dressing' });
      const { container } = render(<ElementNode {...props} />);
      const node = container.firstChild as HTMLElement;
      expect(node).toHaveClass('type-set-dressing');
    });
  });

  describe('Status Classes', () => {
    it('applies Done status class', () => {
      const props = createMockNodeProps({ status: 'Done' });
      const { container } = render(<ElementNode {...props} />);
      const node = container.firstChild as HTMLElement;
      expect(node).toHaveClass('status-done');
    });

    it('applies Idea/Placeholder status class', () => {
      const props = createMockNodeProps({ status: 'Idea/Placeholder' });
      const { container } = render(<ElementNode {...props} />);
      const node = container.firstChild as HTMLElement;
      expect(node).toHaveClass('status-idea-placeholder');
    });

    it('applies In development status class', () => {
      const props = createMockNodeProps({ status: 'In development' });
      const { container } = render(<ElementNode {...props} />);
      const node = container.firstChild as HTMLElement;
      expect(node).toHaveClass('status-in-development');
    });

    it('applies Writing Complete status class', () => {
      const props = createMockNodeProps({ status: 'Writing Complete' });
      const { container } = render(<ElementNode {...props} />);
      const node = container.firstChild as HTMLElement;
      expect(node).toHaveClass('status-writing-complete');
    });

    it('handles unknown status', () => {
      const props = createMockNodeProps({ status: undefined });
      const { container } = render(<ElementNode {...props} />);
      const node = container.firstChild as HTMLElement;
      expect(node).toHaveClass('status-unknown');
    });
  });

  describe('SF Pattern Badge', () => {
    it('shows SF badge when sfPatterns exists', () => {
      const props = createMockNodeProps({}, {}, {
        rfid: 'RFID-123',
        valueRating: 3,
        memoryType: 'Personal',
        group: { name: 'Evidence', multiplier: '1' }
      });
      render(<ElementNode {...props} />);
      expect(screen.getByText('SF')).toBeInTheDocument();
    });

    it('applies hasSF class when patterns exist', () => {
      const props = createMockNodeProps({}, {}, {
        rfid: 'RFID-123',
        valueRating: 3
      });
      const { container } = render(<ElementNode {...props} />);
      const node = container.firstChild as HTMLElement;
      expect(node).toHaveClass('hasSF');
    });

    it('does not show SF badge when no patterns', () => {
      const props = createMockNodeProps();
      render(<ElementNode {...props} />);
      expect(screen.queryByText('SF')).not.toBeInTheDocument();
    });

    it('does not apply hasSF class when no patterns', () => {
      const props = createMockNodeProps();
      const { container } = render(<ElementNode {...props} />);
      const node = container.firstChild as HTMLElement;
      expect(node).not.toHaveClass('hasSF');
    });
  });

  describe('SF Pattern Details', () => {
    it('shows value rating with stars', () => {
      const props = createMockNodeProps({}, {}, {
        valueRating: 4
      });
      render(<ElementNode {...props} />);
      expect(screen.getByText('★4')).toBeInTheDocument();
    });

    it('shows memory type abbreviation', () => {
      const props = createMockNodeProps({}, {}, {
        memoryType: 'Public'
      });
      render(<ElementNode {...props} />);
      expect(screen.getByText('P')).toBeInTheDocument();
    });

    it('shows P for Personal memory type', () => {
      const props = createMockNodeProps({}, {}, {
        memoryType: 'Personal'
      });
      render(<ElementNode {...props} />);
      expect(screen.getByText('P')).toBeInTheDocument();
    });

    it('shows M for Mixed memory type', () => {
      const props = createMockNodeProps({}, {}, {
        memoryType: 'Mixed'
      });
      render(<ElementNode {...props} />);
      expect(screen.getByText('M')).toBeInTheDocument();
    });

    it('shows both rating and memory type', () => {
      const props = createMockNodeProps({}, {}, {
        valueRating: 5,
        memoryType: 'Mixed'
      });
      render(<ElementNode {...props} />);
      expect(screen.getByText('★5')).toBeInTheDocument();
      expect(screen.getByText('M')).toBeInTheDocument();
    });

    it('does not show SF details section when no patterns', () => {
      const props = createMockNodeProps();
      const { container } = render(<ElementNode {...props} />);
      expect(container.querySelector('.sfDetails')).not.toBeInTheDocument();
    });
  });

  describe('Container Indicator', () => {
    it('shows container indicator when isContainer is true', () => {
      const props = createMockNodeProps({ isContainer: true });
      render(<ElementNode {...props} />);
      expect(screen.getByText('📦')).toBeInTheDocument();
    });

    it('does not show container indicator when isContainer is false', () => {
      const props = createMockNodeProps({ isContainer: false });
      render(<ElementNode {...props} />);
      expect(screen.queryByText('📦')).not.toBeInTheDocument();
    });
  });

  describe('Size Classes', () => {
    it('applies small size class', () => {
      const props = createMockNodeProps({}, { 
        visualHints: { size: 'small' } 
      });
      const { container } = render(<ElementNode {...props} />);
      const node = container.firstChild as HTMLElement;
      expect(node).toHaveClass('size-small');
    });

    it('applies medium size class', () => {
      const props = createMockNodeProps({}, { 
        visualHints: { size: 'medium' } 
      });
      const { container } = render(<ElementNode {...props} />);
      const node = container.firstChild as HTMLElement;
      expect(node).toHaveClass('size-medium');
    });

    it('applies large size class', () => {
      const props = createMockNodeProps({}, { 
        visualHints: { size: 'large' } 
      });
      const { container } = render(<ElementNode {...props} />);
      const node = container.firstChild as HTMLElement;
      expect(node).toHaveClass('size-large');
    });

    it('applies small by default', () => {
      const props = createMockNodeProps();
      const { container } = render(<ElementNode {...props} />);
      const node = container.firstChild as HTMLElement;
      expect(node).toHaveClass('size-small');
    });
  });

  describe('Selection State', () => {
    it('applies selected class when selected', () => {
      const props = createMockNodeProps();
      props.selected = true;
      const { container } = render(<ElementNode {...props} />);
      const node = container.firstChild as HTMLElement;
      expect(node).toHaveClass('selected');
    });

    it('does not apply selected class when not selected', () => {
      const props = createMockNodeProps();
      props.selected = false;
      const { container } = render(<ElementNode {...props} />);
      const node = container.firstChild as HTMLElement;
      expect(node).not.toHaveClass('selected');
    });
  });

  describe('Error State', () => {
    it('shows error indicator when error state exists', () => {
      const props = createMockNodeProps({}, { 
        errorState: { 
          type: 'missing_data',
          message: 'Invalid element data' 
        } 
      });
      render(<ElementNode {...props} />);
      expect(screen.getByText('⚠️')).toBeInTheDocument();
    });

    it('includes error message in title attribute', () => {
      const props = createMockNodeProps({}, { 
        errorState: { 
          type: 'invalid_relation',
          message: 'Invalid element data' 
        } 
      });
      const { container } = render(<ElementNode {...props} />);
      const errorIndicator = container.querySelector('.errorIndicator');
      expect(errorIndicator).toHaveAttribute('title', 'Invalid element data');
    });

    it('applies error class when error exists', () => {
      const props = createMockNodeProps({}, { 
        errorState: { 
          type: 'parse_error',
          message: 'Invalid element data' 
        } 
      });
      const { container } = render(<ElementNode {...props} />);
      const node = container.firstChild as HTMLElement;
      expect(node).toHaveClass('error');
    });
  });

  describe('Handle Components', () => {
    it('renders contains handle on right', () => {
      const props = createMockNodeProps();
      render(<ElementNode {...props} />);
      const handle = screen.getByTestId('handle-contains');
      expect(handle).toHaveAttribute('data-type', 'source');
      expect(handle).toHaveAttribute('data-position', 'right');
    });

    it('renders owned handle on left', () => {
      const props = createMockNodeProps();
      render(<ElementNode {...props} />);
      const handle = screen.getByTestId('handle-owned');
      expect(handle).toHaveAttribute('data-type', 'target');
      expect(handle).toHaveAttribute('data-position', 'left');
    });

    it('renders required handle on top', () => {
      const props = createMockNodeProps();
      render(<ElementNode {...props} />);
      const handle = screen.getByTestId('handle-required');
      expect(handle).toHaveAttribute('data-type', 'target');
      expect(handle).toHaveAttribute('data-position', 'top');
    });

    it('renders reveals handle on bottom', () => {
      const props = createMockNodeProps();
      render(<ElementNode {...props} />);
      const handle = screen.getByTestId('handle-reveals');
      expect(handle).toHaveAttribute('data-type', 'source');
      expect(handle).toHaveAttribute('data-position', 'bottom');
    });
  });

  describe('Edge Cases', () => {
    it('handles all null/undefined optional fields', () => {
      const props = createMockNodeProps({
        basicType: undefined,
        status: undefined,
        isContainer: false
      });
      const { container } = render(<ElementNode {...props} />);
      expect(container.firstChild).toBeInTheDocument();
      expect(screen.getByText('Test Element')).toBeInTheDocument();
      expect(screen.getByText('Prop')).toBeInTheDocument();
    });

    it('renders with minimal required data', () => {
      const minimalProps: NodeProps = {
        id: 'node-1',
        type: 'element',
        position: { x: 0, y: 0 },
        data: {
          entity: {
            id: 'elem-1',
            name: 'Minimal Element',
            isContainer: false
          } as any,
          label: 'Minimal Element',
          metadata: {
            entityType: 'element'
          } as any
        } as GraphNodeData<Element>,
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
      
      const { container } = render(<ElementNode {...minimalProps} />);
      expect(container.firstChild).toBeInTheDocument();
      expect(screen.getByText('Minimal Element')).toBeInTheDocument();
    });

    it('handles complex element with all features', () => {
      const props = createMockNodeProps({
        basicType: 'Memory Token (Video)',
        status: 'Done',
        isContainer: true
      }, {}, {
        rfid: 'RFID-123',
        valueRating: 5,
        memoryType: 'Mixed',
        group: { name: 'CEO Evidence', multiplier: '1' }
      });
      render(<ElementNode {...props} />);
      expect(screen.getByText('SF')).toBeInTheDocument();
      expect(screen.getByText('★5')).toBeInTheDocument();
      expect(screen.getByText('M')).toBeInTheDocument();  // Mixed shows 'M'
      expect(screen.getByText('📦')).toBeInTheDocument();
      expect(screen.getByText('Memory Token (Video)')).toBeInTheDocument();
    });
  });
});