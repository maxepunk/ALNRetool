import { render, screen, fireEvent } from '@testing-library/react';
import { ReactFlowProvider } from '@xyflow/react';
import ClusterNode from './ClusterNode';
import { useClusterStore } from '@/stores/clusterStore';
import { vi } from 'vitest';

const mockData = {
  label: 'Test Cluster',
  clustering: {
    isCluster: true,
    clusterType: 'puzzle',
    childIds: ['node-1', 'node-2', 'node-3'],
    childCount: 3
  }
};

describe('ClusterNode', () => {
  beforeEach(() => {
    vi.spyOn(useClusterStore, 'getState').mockReturnValue({
      expandedClusters: new Set(),
      toggleCluster: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('renders cluster information', () => {
    render(
      <ReactFlowProvider>
        <ClusterNode id="cluster-1" data={mockData} />
      </ReactFlowProvider>
    );

    expect(screen.getByText('Test Cluster')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  test('toggles expansion on click', () => {
    const toggleCluster = vi.fn();
    useClusterStore.setState({ toggleCluster });

    render(
      <ReactFlowProvider>
        <ClusterNode id="cluster-1" data={mockData} />
      </ReactFlowProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /expand cluster/i }));
    expect(toggleCluster).toHaveBeenCalledWith('cluster-1');
  });
});
