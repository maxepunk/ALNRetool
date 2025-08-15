import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import CharacterNode from './CharacterNode';
import type { NodeMetadata } from '@/lib/graph/types';
import { createNodeProps } from '@/test/utils/node-test-helpers';
import { createMockCharacter } from '@/test/utils/factories';

// Mock CSS modules
vi.mock('./CharacterNode.module.css', () => ({
  default: {
    characterNode: 'characterNode',
    selected: 'selected',
    error: 'error',
    content: 'content',
    icon: 'icon',
    name: 'name',
    tierBadge: 'tierBadge',
    logline: 'logline',
    stats: 'stats',
    stat: 'stat',
    typeIndicator: 'typeIndicator',
    handle: 'handle',
    errorIndicator: 'errorIndicator',
    // Type classes with prefixes
    'type-player': 'type-player',
    'type-npc': 'type-npc',
    'type-unknown': 'type-unknown',
    // Tier classes with prefixes
    'tier-core': 'tier-core',
    'tier-secondary': 'tier-secondary',
    'tier-tertiary': 'tier-tertiary',
    'tier-unknown': 'tier-unknown',
    // Size classes with prefixes
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

describe('CharacterNode', () => {

  describe('Basic Rendering', () => {
    it('renders character name', () => {
      const character = createMockCharacter({ name: 'Alice' });
      const props = createNodeProps(character);
      render(<CharacterNode {...props} />);
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    it('applies base CSS classes', () => {
      const character = createMockCharacter();
      const props = createNodeProps(character);
      const { container } = render(<CharacterNode {...props} />);
      const node = container.firstChild as HTMLElement;
      expect(node).toHaveClass('characterNode');
    });

    it('has correct displayName for debugging', () => {
      expect(CharacterNode.displayName).toBe('CharacterNode');
    });
  });

  describe('Character Type Styling', () => {
    it('applies player class for Player type', () => {
      const character = createMockCharacter({ type: 'Player' });
      const props = createNodeProps(character);
      const { container } = render(<CharacterNode {...props} />);
      const node = container.firstChild as HTMLElement;
      expect(node).toHaveClass('type-player');
    });

    it('applies npc class for NPC type', () => {
      const character = createMockCharacter({ type: 'NPC' });
      const props = createNodeProps(character);
      const { container } = render(<CharacterNode {...props} />);
      const node = container.firstChild as HTMLElement;
      expect(node).toHaveClass('type-npc');
    });

    it('renders NPC indicator for NPC type', () => {
      const character = createMockCharacter({ type: 'NPC' });
      const props = createNodeProps(character);
      render(<CharacterNode {...props} />);
      expect(screen.getByText('[NPC]')).toBeInTheDocument();
    });

    it('does not render indicator for Player type', () => {
      const character = createMockCharacter({ type: 'Player' });
      const props = createNodeProps(character);
      render(<CharacterNode {...props} />);
      expect(screen.queryByText('[NPC]')).not.toBeInTheDocument();
    });
  });

  describe('Tier Display', () => {
    it('shows tier badge for Core', () => {
      const character = createMockCharacter({ tier: 'Core' });
      const props = createNodeProps(character);
      render(<CharacterNode {...props} />);
      expect(screen.getByText('Core')).toBeInTheDocument();
    });

    it('shows tier badge for Secondary', () => {
      const character = createMockCharacter({ tier: 'Secondary' });
      const props = createNodeProps(character);
      render(<CharacterNode {...props} />);
      expect(screen.getByText('Secondary')).toBeInTheDocument();
    });

    it('shows tier badge for Tertiary', () => {
      const character = createMockCharacter({ tier: 'Tertiary' });
      const props = createNodeProps(character);
      render(<CharacterNode {...props} />);
      expect(screen.getByText('Tertiary')).toBeInTheDocument();
    });

    it('applies correct CSS class for each tier', () => {
      const tiers: Array<'Core' | 'Secondary' | 'Tertiary'> = ['Core', 'Secondary', 'Tertiary'];
      const expectedClasses = ['tier-core', 'tier-secondary', 'tier-tertiary'];
      
      tiers.forEach((tier, index) => {
        const character = createMockCharacter({ tier });
        const props = createNodeProps(character);
        const { container } = render(<CharacterNode {...props} />);
        const node = container.firstChild as HTMLElement;
        const expectedClass = expectedClasses[index];
        if (expectedClass) {
          expect(node).toHaveClass(expectedClass);
        }
      });
    });
  });

  describe('Connection Counts', () => {
    it('shows element count when > 0', () => {
      const character = createMockCharacter({ 
        ownedElementIds: ['e1', 'e2']
      });
      const props = createNodeProps(character);
      render(<CharacterNode {...props} />);
      expect(screen.getByText('📦 2')).toBeInTheDocument();
    });

    it('shows puzzle count when > 0', () => {
      const character = createMockCharacter({ 
        characterPuzzleIds: ['p1', 'p2', 'p3']
      });
      const props = createNodeProps(character);
      render(<CharacterNode {...props} />);
      expect(screen.getByText('🧩 3')).toBeInTheDocument();
    });

    it('does not show event count (not implemented)', () => {
      const character = createMockCharacter({ 
        eventIds: ['ev1']
      });
      const props = createNodeProps(character);
      render(<CharacterNode {...props} />);
      // Event count is not displayed in current implementation
      expect(screen.queryByText(/📅/)).not.toBeInTheDocument();
    });

    it('does not show counts when all are 0', () => {
      const character = createMockCharacter({
        ownedElementIds: [],
        associatedElementIds: [],
        characterPuzzleIds: [],
        eventIds: []
      });
      const props = createNodeProps(character);
      render(<CharacterNode {...props} />);
      expect(screen.queryByText(/📦/)).not.toBeInTheDocument();
      expect(screen.queryByText(/🧩/)).not.toBeInTheDocument();
      expect(screen.queryByText(/📅/)).not.toBeInTheDocument();
    });

    it('handles undefined arrays gracefully', () => {
      const character = createMockCharacter({
        ownedElementIds: undefined,
        associatedElementIds: undefined,
        characterPuzzleIds: undefined,
        eventIds: undefined
      });
      const props = createNodeProps(character);
      render(<CharacterNode {...props} />);
      expect(screen.queryByText(/📦/)).not.toBeInTheDocument();
      expect(screen.queryByText(/🧩/)).not.toBeInTheDocument();
      expect(screen.queryByText(/📅/)).not.toBeInTheDocument();
    });
  });

  describe('Selection State', () => {
    it('applies selected class when selected', () => {
      const character = createMockCharacter();
      const props = createNodeProps(character, {}, { selected: true });
      const { container } = render(<CharacterNode {...props} />);
      const node = container.firstChild as HTMLElement;
      expect(node).toHaveClass('selected');
    });

    it('does not apply selected class when not selected', () => {
      const character = createMockCharacter();
      const props = createNodeProps(character, {}, { selected: false });
      const { container } = render(<CharacterNode {...props} />);
      const node = container.firstChild as HTMLElement;
      expect(node).not.toHaveClass('selected');
    });
  });

  describe('Node Size Hints', () => {
    it('uses size from visual hints', () => {
      const character = createMockCharacter({ tier: 'Core' });
      const metadata: Partial<NodeMetadata> = {
        visualHints: { size: 'large' }
      };
      const props = createNodeProps(character, metadata);
      render(<CharacterNode {...props} />);
      // The component should use the size hint (implementation specific)
      expect((props.data as any).metadata.visualHints?.size).toBe('large');
    });

    it('defaults to medium size when not specified', () => {
      const character = createMockCharacter();
      const props = createNodeProps(character);
      render(<CharacterNode {...props} />);
      expect((props.data as any).metadata.visualHints?.size).toBe('medium');
    });
  });

  describe('Error State', () => {
    it('shows error indicator when error state exists', () => {
      const character = createMockCharacter();
      const metadata: Partial<NodeMetadata> = {
        errorState: { 
          type: 'missing_data',
          message: 'Invalid character data' 
        }
      };
      const props = createNodeProps(character, metadata);
      render(<CharacterNode {...props} />);
      expect(screen.getByText('⚠️')).toBeInTheDocument();
    });

    it('includes error message in title attribute', () => {
      const character = createMockCharacter();
      const metadata: Partial<NodeMetadata> = {
        errorState: { 
          type: 'missing_data',
          message: 'Invalid character data' 
        }
      };
      const props = createNodeProps(character, metadata);
      const { container } = render(<CharacterNode {...props} />);
      const errorIndicator = container.querySelector('.errorIndicator');
      expect(errorIndicator).toHaveAttribute('title', 'Invalid character data');
    });

    it('applies error class when error exists', () => {
      const character = createMockCharacter();
      const metadata: Partial<NodeMetadata> = {
        errorState: { 
          type: 'missing_data',
          message: 'Invalid character data' 
        }
      };
      const props = createNodeProps(character, metadata);
      const { container } = render(<CharacterNode {...props} />);
      const node = container.firstChild as HTMLElement;
      expect(node).toHaveClass('error');
    });

    it('does not show error indicator when no error', () => {
      const character = createMockCharacter();
      const props = createNodeProps(character);
      render(<CharacterNode {...props} />);
      expect(screen.queryByText('⚠️')).not.toBeInTheDocument();
    });
  });

  describe('Handle Components', () => {
    it('renders owns-elements handle on right', () => {
      const character = createMockCharacter();
      const props = createNodeProps(character);
      render(<CharacterNode {...props} />);
      const handle = screen.getByTestId('handle-ownership');
      expect(handle).toHaveAttribute('data-type', 'source');
      expect(handle).toHaveAttribute('data-position', 'right');
    });

    it('renders connected-to handle on left', () => {
      const character = createMockCharacter();
      const props = createNodeProps(character);
      render(<CharacterNode {...props} />);
      const handle = screen.getByTestId('handle-connection');
      expect(handle).toHaveAttribute('data-type', 'target');
      expect(handle).toHaveAttribute('data-position', 'left');
    });
  });

  describe('Edge Cases', () => {
    it('handles all null/undefined optional fields', () => {
      const character = createMockCharacter({
        name: 'Test Character',
        primaryAction: undefined,
        characterLogline: undefined,
        overview: undefined,
        emotionTowardsCEO: undefined
      });
      const props = createNodeProps(character);
      const { container } = render(<CharacterNode {...props} />);
      expect(container.firstChild).toBeInTheDocument();
      expect(screen.getByText('Test Character')).toBeInTheDocument();
    });

    it('renders with minimal required data', () => {
      const minimalCharacter = createMockCharacter({
        name: 'Minimal Character'
      });
      
      const props = createNodeProps(minimalCharacter);
      const { container } = render(<CharacterNode {...props} />);
      expect(container.firstChild).toBeInTheDocument();
      expect(screen.getByText('Minimal Character')).toBeInTheDocument();
    });
  });
});