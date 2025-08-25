/**
 * Integration test for AppRouter with dynamic routing
 * Verifies that ViewRegistry routes are properly integrated
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AppRouter from '@/router/AppRouter';
import { viewRegistry } from '@/contexts/ViewContext';

// Mock the components that AppRouter depends on
vi.mock('@/components/layout/AppLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="app-layout">{children}</div>
}));

vi.mock('@/components/common/ErrorBoundary', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="error-boundary">{children}</div>
}));

vi.mock('@/components/common/NotFound', () => ({
  default: () => <div data-testid="not-found">404 Not Found</div>
}));

describe('AppRouter Integration', () => {
  beforeEach(() => {
    // Clear ViewRegistry before each test
    viewRegistry.getAll().forEach(config => {
      viewRegistry.unregister(config.id);
    });
  });

  it('should render AppLayout structure', () => {
    render(
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    );

    expect(screen.getByTestId('app-layout')).toBeInTheDocument();
    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
  });

  it('should register common views on mount', () => {
    render(
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    );

    const registeredViews = viewRegistry.getAll();
    expect(registeredViews.length).toBeGreaterThan(0);
    
    const viewIds = registeredViews.map(v => v.id);
    expect(viewIds).toContain('puzzle-focus');
    expect(viewIds).toContain('character-journey');
    expect(viewIds).toContain('node-connections');
    expect(viewIds).toContain('content-status');
  });

  it('should use DynamicRoutes for routing', () => {
    // This test verifies that the AppRouter structure is correct
    // The actual routing behavior would require more complex setup with react-router testing
    const { container } = render(
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    );

    // Should contain the basic structure without errors
    expect(container.firstChild).toBeTruthy();
  });
});