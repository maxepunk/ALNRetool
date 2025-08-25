/**
 * Test helpers for ViewConfiguration objects
 */

import type { ViewConfiguration } from '@/lib/graph/config/ViewConfiguration';

/**
 * Create a minimal valid ViewConfiguration for tests
 */
export function createTestViewConfig(partial: Partial<ViewConfiguration> = {}): ViewConfiguration {
  return {
    id: partial.id || 'test-view',
    name: partial.name || 'Test View',
    description: partial.description || 'Test view for unit tests',
    nodes: partial.nodes || { include: [] },
    edges: partial.edges || [],
    ...partial
  };
}

/**
 * Create a ViewConfiguration with UI controls
 */
export function createTestViewWithControls(
  id: string,
  controls: any[] = []
): ViewConfiguration {
  return createTestViewConfig({
    id,
    ui: {
      title: `${id} View`,
      description: `Test ${id} view`,
      controls
    }
  });
}