/**
 * Test suite for URL routing and navigation with parameters
 * Verifies dynamic route generation, navigation, and parameter handling
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { viewRegistry } from '@/contexts/ViewContext';
import { RouteUtils, registerCommonViews } from '../RouteGenerator';

describe('Routing with URL Parameters and Navigation', () => {
  beforeEach(() => {
    // Clear ViewRegistry before each test
    viewRegistry.getAll().forEach(config => {
      viewRegistry.unregister(config.id);
    });
  });

  describe('Parameter extraction and route generation', () => {
    it('should generate correct paths for views with parameters', () => {
      registerCommonViews();

      const puzzleRoute = RouteUtils.getRouteForView('puzzle-focus');
      expect(puzzleRoute?.path).toBe('/puzzle-focus/:puzzleId');

      const characterRoute = RouteUtils.getRouteForView('character-journey');
      expect(characterRoute?.path).toBe('/character-journey/:characterId');

      const nodeRoute = RouteUtils.getRouteForView('node-connections');
      expect(nodeRoute?.path).toBe('/node-connections/:nodeType/:nodeId');
    });

    it('should generate navigation URLs with parameters', () => {
      registerCommonViews();

      const puzzleUrl = RouteUtils.generateNavUrl('puzzle-focus', {
        puzzleId: 'test-puzzle-123'
      });
      expect(puzzleUrl).toBe('/puzzle-focus/test-puzzle-123');

      const characterUrl = RouteUtils.generateNavUrl('character-journey', {
        characterId: 'char-456'
      });
      expect(characterUrl).toBe('/character-journey/char-456');

      const nodeUrl = RouteUtils.generateNavUrl('node-connections', {
        nodeType: 'element',
        nodeId: 'elem-789'
      });
      expect(nodeUrl).toBe('/node-connections/element/elem-789');
    });

    it('should handle partial parameters gracefully', () => {
      registerCommonViews();

      // Only nodeType, no nodeId
      const partialUrl = RouteUtils.generateNavUrl('node-connections', {
        nodeType: 'character'
      });
      expect(partialUrl).toBe('/node-connections/character');

      // Empty parameters should return base path
      const baseUrl = RouteUtils.generateNavUrl('content-status', {});
      expect(baseUrl).toBe('/content-status');
    });

    it('should generate routes with custom base paths', () => {
      registerCommonViews();

      const routes = RouteUtils.getAllRoutes('/app');
      const puzzleRoute = routes.find(r => r.id === 'puzzle-focus');
      expect(puzzleRoute?.path).toBe('/app/puzzle-focus/:puzzleId');
    });
  });

  describe('Router integration with memory router', () => {
    it('should handle route navigation to parameterized paths', async () => {
      registerCommonViews();
      
      const routes = [
        {
          path: '/puzzle-focus/:puzzleId',
          element: <div data-testid="puzzle-view">Puzzle View</div>
        },
        {
          path: '/node-connections/:nodeType/:nodeId',
          element: <div data-testid="node-view">Node Connections View</div>
        }
      ];

      const router = createMemoryRouter(routes, {
        initialEntries: ['/puzzle-focus/test-123']
      });

      const { getByTestId } = render(<RouterProvider router={router} />);
      expect(getByTestId('puzzle-view')).toBeInTheDocument();
    });

    it('should handle multi-parameter routes', async () => {
      const routes = [
        {
          path: '/node-connections/:nodeType/:nodeId',
          element: <div data-testid="node-view">Node View</div>
        }
      ];

      const router = createMemoryRouter(routes, {
        initialEntries: ['/node-connections/character/char-123']
      });

      const { getByTestId } = render(<RouterProvider router={router} />);
      expect(getByTestId('node-view')).toBeInTheDocument();
    });

    it('should handle routes without parameters', async () => {
      const routes = [
        {
          path: '/content-status',
          element: <div data-testid="status-view">Status View</div>
        }
      ];

      const router = createMemoryRouter(routes, {
        initialEntries: ['/content-status']
      });

      const { getByTestId } = render(<RouterProvider router={router} />);
      expect(getByTestId('status-view')).toBeInTheDocument();
    });
  });

  describe('Navigation URL edge cases', () => {
    beforeEach(() => {
      registerCommonViews();
    });

    it('should return null for non-existent views', () => {
      const url = RouteUtils.generateNavUrl('non-existent-view', { id: '123' });
      expect(url).toBeNull();
    });

    it('should handle empty parameter values', () => {
      const url = RouteUtils.generateNavUrl('puzzle-focus', { puzzleId: '' });
      expect(url).toBe('/puzzle-focus/');
    });

    it('should handle special characters in parameters', () => {
      const url = RouteUtils.generateNavUrl('puzzle-focus', { 
        puzzleId: 'puzzle-with-special-chars-@#$' 
      });
      expect(url).toBe('/puzzle-focus/puzzle-with-special-chars-%40%23%24');
    });

    it('should preserve parameter order for multi-param routes', () => {
      const url = RouteUtils.generateNavUrl('node-connections', {
        nodeType: 'element',
        nodeId: 'test-123'
      });
      // Should maintain the order: nodeType then nodeId
      expect(url).toBe('/node-connections/element/test-123');
    });
  });

  describe('Route metadata and configuration', () => {
    beforeEach(() => {
      registerCommonViews();
    });

    it('should provide route metadata for navigation', () => {
      const routes = RouteUtils.getAllRoutes();
      
      expect(routes.length).toBeGreaterThan(0);
      
      const puzzleRoute = routes.find(r => r.id === 'puzzle-focus');
      expect(puzzleRoute).toBeDefined();
      expect(puzzleRoute?.name).toBe('Puzzle Focus');
      expect(puzzleRoute?.config).toBeDefined();
    });

    it('should handle custom routing configuration', () => {
      const customConfig = {
        id: 'custom-view',
        name: 'Custom View',
        description: 'Custom test view',
        ui: {
          title: 'Custom View',
          description: 'Custom test view',
          routing: {
            basePath: '/custom/path',
            parameters: ['param1', 'param2', 'param3']
          }
        }
      } as any;
      
      viewRegistry.register(customConfig);
      
      const route = RouteUtils.getRouteForView('custom-view');
      expect(route?.path).toBe('/custom/path/:param1/:param2/:param3');
      
      const navUrl = RouteUtils.generateNavUrl('custom-view', {
        param1: 'value1',
        param2: 'value2',
        param3: 'value3'
      });
      expect(navUrl).toBe('/custom/path/value1/value2/value3');
    });
  });
});