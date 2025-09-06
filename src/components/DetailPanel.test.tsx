import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DetailPanel } from './DetailPanel';
import { useEntityMutation } from '@/hooks/mutations';
import { useViewConfig } from '@/hooks/useViewConfig';
import { useGraphAnimation } from '@/contexts/GraphAnimationContext';
import * as fieldRegistry from '@/config/fieldRegistry';
import type { Character } from '@/types/notion/app';

// Mocks
vi.mock('@/hooks/mutations');
vi.mock('@/hooks/useViewConfig');
vi.mock('@/contexts/GraphAnimationContext');
vi.mock('@/config/fieldRegistry');

const mockUseEntityMutation = useEntityMutation as vi.Mock;
const mockUseViewConfig = useViewConfig as vi.Mock;
const mockUseGraphAnimation = useGraphAnimation as vi.Mock;
const mockGetFieldsByCategory = fieldRegistry.getFieldsByCategory as vi.Mock;

const queryClient = new QueryClient();

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('DetailPanel', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();
  const mockMutate = vi.fn();
  const mockDeleteMutate = vi.fn();

  const mockCharacter: Character = {
    id: 'char1',
    name: 'Test Character',
    type: 'PC',
    status: 'Active',
    version: 1,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseViewConfig.mockReturnValue({ config: { name: 'test-view' } });
    mockUseGraphAnimation.mockReturnValue({
      onNodeHoverStart: vi.fn(),
      onNodeHoverEnd: vi.fn(),
    });
    mockUseEntityMutation.mockImplementation((entityType, mutationType) => {
        if (mutationType === 'delete') {
            return {
                mutateAsync: mockDeleteMutate,
                isPending: false,
                error: null,
            };
        }
        return {
            mutateAsync: mockMutate,
            isPending: false,
            error: null,
            reset: vi.fn(),
        };
    });
    mockGetFieldsByCategory.mockImplementation((entityType, category) => {
        if (category === 'basic') {
            return [{ key: 'name', label: 'Name', type: 'text', required: true }];
        }
        return [];
    });
  });

  it('should render nothing if no entity is provided', () => {
    const { container } = render(
      <Wrapper>
        <DetailPanel entity={null} entityType="character" onClose={mockOnClose} />
      </Wrapper>
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render the detail panel for a character', () => {
    render(
      <Wrapper>
        <DetailPanel entity={mockCharacter} entityType="character" onClose={mockOnClose} />
      </Wrapper>
    );
    expect(screen.getByText('Character Details')).toBeInTheDocument();
    expect(screen.getByLabelText(/Name/)).toHaveValue('Test Character');
  });

  it('should call onClose when the close button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <Wrapper>
        <DetailPanel entity={mockCharacter} entityType="character" onClose={mockOnClose} />
      </Wrapper>
    );
    await user.click(screen.getByTitle('Close'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should update form data on input change', async () => {
    const user = userEvent.setup();
    render(
      <Wrapper>
        <DetailPanel entity={mockCharacter} entityType="character" onClose={mockOnClose} />
      </Wrapper>
    );
    const nameInput = screen.getByLabelText(/Name/);
    await user.clear(nameInput);
    await user.type(nameInput, 'New Name');
    expect(nameInput).toHaveValue('New Name');
  });

  it('should call onSave with changed data', async () => {
    const user = userEvent.setup();
    mockMutate.mockResolvedValue({});
    render(
      <Wrapper>
        <DetailPanel entity={mockCharacter} entityType="character" onClose={mockOnClose} onSave={mockOnSave} />
      </Wrapper>
    );
    const nameInput = screen.getByLabelText(/Name/);
    await user.clear(nameInput);
    await user.type(nameInput, 'New Name');
    await user.click(screen.getByText('Save Changes'));

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({ name: 'New Name' });
    });
  });

  it('should call update mutation if onSave is not provided', async () => {
    const user = userEvent.setup();
    mockMutate.mockResolvedValue({});
    render(
      <Wrapper>
        <DetailPanel entity={mockCharacter} entityType="character" onClose={mockOnClose} />
      </Wrapper>
    );
    const nameInput = screen.getByLabelText(/Name/);
    await user.clear(nameInput);
    await user.type(nameInput, 'New Name');
    await user.click(screen.getByText('Save Changes'));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({ id: 'char1', name: 'New Name', version: 1 });
    });
  });

  it('should show validation error for required field', async () => {
    const user = userEvent.setup();
    render(
      <Wrapper>
        <DetailPanel entity={mockCharacter} entityType="character" onClose={mockOnClose} />
      </Wrapper>
    );
    const nameInput = screen.getByLabelText(/Name/);
    await user.clear(nameInput);

    await waitFor(() => {
        expect(screen.getByText('This field is required')).toBeInTheDocument();
    });
  });

    it('should open delete confirmation on delete click', async () => {
        const user = userEvent.setup();
        render(
            <Wrapper>
                <DetailPanel entity={mockCharacter} entityType="character" onClose={mockOnClose} />
            </Wrapper>
        );
        await user.click(screen.getByTitle('Delete entity'));
        expect(await screen.findByText('Are you sure?')).toBeInTheDocument();
    });

    it('should call delete mutation on confirmation', async () => {
        const user = userEvent.setup();
        mockDeleteMutate.mockResolvedValue({});
        render(
            <Wrapper>
                <DetailPanel entity={mockCharacter} entityType="character" onClose={mockOnClose} />
            </Wrapper>
        );
        await user.click(screen.getByTitle('Delete entity'));
        const confirmButton = await screen.findByText('Delete');
        await user.click(confirmButton);
        await waitFor(() => {
            expect(mockDeleteMutate).toHaveBeenCalledWith({ id: 'char1', version: 1 });
        });
    });
});
