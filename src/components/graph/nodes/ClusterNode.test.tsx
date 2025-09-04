import { render, screen, fireEvent } from '@testing-library/react';
import { ReactFlowProvider } from '@xyflow/react';
import ClusterNode from './ClusterNode';
import { useClusterStore } from '@/stores/clusterStore';
import { vi, beforeEach } from 'vitest';

vi.mock('@/stores/clusterStore');

const mockUseClusterStore = vi.mocked(useClusterStore);

describe('ClusterNode', () => {
  const mockData = {
    label: 'Test Cluster',
    clustering: {
      isCluster: true,
      clusterType: 'puzzle' as const,
      childIds: ['node-1', 'node-2', 'node-3'],
      childCount: 3,
      childPreviews: [
        { type: 'puzzle', label: 'P1' },
        { type: 'character', label: 'C1' },
        { type: 'element', label: 'E1' },
      ],
    },
  };

  let mockState: any;

  beforeEach(() => {
    mockState = {
      expandedClusters: new Set(),
      toggleCluster: vi.fn(),
    };
    mockUseClusterStore.mockImplementation(selector => selector(mockState));
  });

  test('renders cluster information when collapsed', () => {
    render(
      <ReactFlowProvider>
        <ClusterNode id="cluster-1" data={mockData} />
      </ReactFlowProvider>
    );

    expect(screen.getByText('Test Cluster')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByLabelText('Expand cluster')).toBeInTheDocument();
    expect(screen.getByTitle('P1')).toBeInTheDocument();
    expect(screen.getByTitle('C1')).toBeInTheDocument();
    expect(screen.getByTitle('E1')).toBeInTheDocument();
  });

  test('renders correctly when expanded', () => {
    mockState.expandedClusters = new Set(['cluster-1']);

    render(
      <ReactFlowProvider>
        <ClusterNode id="cluster-1" data={mockData} />
      </ReactFlowProvider>
    );

    expect(screen.getByLabelText('Collapse cluster')).toBeInTheDocument();
    expect(screen.queryByTitle('P1')).not.toBeInTheDocument();
  });

  test('toggles expansion on click', () => {
    render(
      <ReactFlowProvider>
        <ClusterNode id="cluster-1" data={mockData} />
      </ReactFlowProvider>
    );

    const button = screen.getByRole('button', { name: /expand cluster/i });
    fireEvent.click(button);
    expect(mockState.toggleCluster).toHaveBeenCalledWith('cluster-1');
  });
});
