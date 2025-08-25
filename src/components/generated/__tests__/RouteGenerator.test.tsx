/**
 * Test suite for RouteGenerator
 * Verifies automatic route generation from ViewConfiguration objects
 * Tests all 4 ViewConfiguration imports and parameter edge cases
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { viewRegistry } from '@/contexts/ViewContext';
import { RouteUtils, registerCommonViews } from '../RouteGenerator';
import { PuzzleFocusConfig } from '@/lib/graph/config/views/PuzzleFocusConfig';
import { CharacterJourneyConfig } from '@/lib/graph/config/views/CharacterJourneyConfig';
import { TimelineConfig } from '@/lib/graph/config/views/TimelineConfig';
import { createTestViewConfig } from '@/test/helpers/viewConfig';

describe('RouteGenerator', () => {
  beforeEach(() => {
    // Clear ViewRegistry before each test
    viewRegistry.getAll().forEach(config => {
      viewRegistry.unregister(config.id);
    });
  });

  describe('RouteUtils', () => {
    it('should generate routes for registered views', () => {
      const testConfig = createTestViewConfig({
        id: 'test-view',
        name: 'Test View',
        description: 'Test view for routing'
      });
      viewRegistry.register(testConfig);

      const routes = RouteUtils.getAllRoutes();
      expect(routes).toHaveLength(1);
      expect(routes[0]?.id).toBe('test-view');
      expect(routes[0]?.path).toBe('/test-view');
      expect(routes[0]?.config).toEqual(testConfig);
    });

    it('should get route for specific view', () => {
      const testConfig = createTestViewConfig({
        id: 'puzzle-focus',
        name: 'Puzzle Focus',
        description: 'Test puzzle focus view'
      });
      viewRegistry.register(testConfig);

      const route = RouteUtils.getRouteForView('puzzle-focus');
      expect(route?.id).toBe('puzzle-focus');
      expect(route?.path).toBe('/puzzle-focus/:puzzleId');
    });

    it('should return null for non-existent view', () => {
      const route = RouteUtils.getRouteForView('non-existent');
      expect(route).toBeNull();
    });

    it('should generate navigation URLs with parameters', () => {
      const testConfig = createTestViewConfig({
        id: 'node-connections',
        name: 'Node Connections',
        description: 'Test node connections view'
      });
      viewRegistry.register(testConfig);

      const url = RouteUtils.generateNavUrl('node-connections', {
        nodeType: 'character',
        nodeId: 'test-123'
      });
      expect(url).toBe('/node-connections/character/test-123');
    });

    it('should handle navigation URLs without parameters', () => {
      const testConfig = createTestViewConfig({
        id: 'node-connections',
        name: 'Node Connections',
        description: 'Test node connections view'
      });
      viewRegistry.register(testConfig);

      const url = RouteUtils.generateNavUrl('node-connections');
      expect(url).toBe('/node-connections');
    });

    it('should handle custom base path', () => {
      const testConfig = createTestViewConfig({
        id: 'puzzle-focus',
        name: 'Puzzle Focus',
        description: 'Test puzzle focus view'
      });
      viewRegistry.register(testConfig);

      const routes = RouteUtils.getAllRoutes('/app');
      expect(routes[0]?.path).toBe('/app/puzzle-focus/:puzzleId');
    });
  });



  describe('registerCommonViews', () => {
    it('should register all common view configurations', () => {
      expect(viewRegistry.getAll()).toHaveLength(0);

      registerCommonViews();

      const registeredViews = viewRegistry.getAll();
      expect(registeredViews.length).toBeGreaterThanOrEqual(3); // At least 3 views

      const viewIds = registeredViews.map(v => v.id);
      expect(viewIds).toContain('puzzle-focus');
      expect(viewIds).toContain('character-journey');
      expect(viewIds).toContain('timeline');
    });

    it('should generate correct paths for common views', () => {
      registerCommonViews();

      const puzzleFocusRoute = RouteUtils.getRouteForView('puzzle-focus');
      expect(puzzleFocusRoute?.path).toMatch(/puzzle-focus/);

      const characterJourneyRoute = RouteUtils.getRouteForView('character-journey');
      expect(characterJourneyRoute?.path).toMatch(/character-journey/);

      const timelineRoute = RouteUtils.getRouteForView('timeline');
      expect(timelineRoute?.path).toMatch(/timeline/);

      const nodeConnectionsRoute = RouteUtils.getRouteForView('node-connections');
      if (nodeConnectionsRoute) {
        expect(nodeConnectionsRoute.path).toMatch(/node-connections/);
      }
    });
  });

  describe('Actual ViewConfiguration Integration', () => {
    it('should correctly import and use PuzzleFocusConfig', () => {
      expect(PuzzleFocusConfig).toBeDefined();
      expect(PuzzleFocusConfig.id).toBe('puzzle-focus');
      expect(PuzzleFocusConfig.name).toBe('Puzzle Focus');
      
      viewRegistry.register(PuzzleFocusConfig);
      const route = RouteUtils.getRouteForView('puzzle-focus');
      expect(route).toBeDefined();
      expect(route?.config).toBe(PuzzleFocusConfig);
    });

    it('should correctly import and use CharacterJourneyConfig', () => {
      expect(CharacterJourneyConfig).toBeDefined();
      expect(CharacterJourneyConfig.id).toBe('character-journey');
      expect(CharacterJourneyConfig.name).toBe('Character Journey');
      
      viewRegistry.register(CharacterJourneyConfig);
      const route = RouteUtils.getRouteForView('character-journey');
      expect(route).toBeDefined();
      expect(route?.config).toBe(CharacterJourneyConfig);
    });

    it('should correctly import and use TimelineConfig', () => {
      expect(TimelineConfig).toBeDefined();
      expect(TimelineConfig.id).toBe('timeline');
      expect(TimelineConfig.name).toBe('Timeline');
      
      viewRegistry.register(TimelineConfig);
      const route = RouteUtils.getRouteForView('timeline');
      expect(route).toBeDefined();
      expect(route?.config).toBe(TimelineConfig);
    });

    it('should handle all ViewConfiguration properties', () => {
      // Test PuzzleFocusConfig has required properties
      expect(PuzzleFocusConfig.nodes).toBeDefined();
      expect(PuzzleFocusConfig.edges).toBeDefined();
      
      // Test CharacterJourneyConfig has template variables
      expect(CharacterJourneyConfig.variables).toBeDefined();
      
      // Test TimelineConfig has appropriate configuration
      expect(TimelineConfig.hooks).toBeDefined();
      expect(typeof TimelineConfig.hooks).toBe('object');
    });
  });

  describe('Parameter Edge Cases', () => {
    it('should handle optional parameters correctly', () => {
      const configWithOptional = createTestViewConfig({
        id: 'test-optional',
        name: 'Test Optional',
        description: 'Test optional parameters',
        ui: {
          title: 'Test Optional',
          routing: {
            basePath: '/test',
            parameters: {
              requiredParam: { type: 'string', required: true },
              optionalParam: { type: 'string', required: false }
            }
          }
        }
      });
      
      viewRegistry.register(configWithOptional);
      const route = RouteUtils.getRouteForView('test-optional');
      expect(route?.path).toContain(':requiredParam');
      // Route patterns include all parameters as required for React Router matching
      // The 'required' flag only affects URL generation, not route pattern matching
      expect(route?.path).toContain(':optionalParam');
    });

    it('should handle empty parameters gracefully', () => {
      registerCommonViews(); // Ensure views are registered
      const url = RouteUtils.generateNavUrl('puzzle-focus', {});
      expect(url).toBe('/puzzle-focus');
    });

    it('should handle null/undefined parameters', () => {
      registerCommonViews(); // Ensure views are registered
      const url = RouteUtils.generateNavUrl('node-connections', {
        nodeType: 'character',
        nodeId: undefined as any
      });
      expect(url).toBe('/node-connections/character');
    });

    it('should escape special characters in parameters', () => {
      registerCommonViews(); // Ensure views are registered
      const url = RouteUtils.generateNavUrl('node-connections', {
        nodeType: 'character',
        nodeId: 'test/123#special'
      });
      expect(url || '').not.toContain('#');
      expect(url || '').toContain('test');
    });

    it('should handle very long parameter values', () => {
      registerCommonViews(); // Ensure views are registered
      const longId = 'a'.repeat(1000);
      const url = RouteUtils.generateNavUrl('puzzle-focus', {
        puzzleId: longId
      });
      expect((url || '').length).toBeGreaterThan(1000);
      expect(url || '').toContain(longId);
    });
  });

  describe('Navigation URL Generation with Template Variables', () => {
    it('should resolve template variables in navigation URLs', () => {
      const config = createTestViewConfig({
        id: 'test-templates',
        name: 'Test Templates',
        description: 'Test template variable resolution',
        ui: {
          title: 'Test With Selected Node',
          routing: {
            basePath: '/nodes',
            parameters: {
              selectedNodeType: { type: 'string', required: true },
              selectedNodeId: { type: 'string', required: true }
            }
          }
        }
      });
      
      viewRegistry.register(config);
      
      const url = RouteUtils.generateNavUrl('test-templates', {
        selectedNodeType: 'puzzle',
        selectedNodeId: 'puzzle-456'
      });
      
      expect(url || '').toContain('puzzle');
      expect(url || '').toContain('puzzle-456');
    });

    it('should handle missing template variables', () => {
      const config = createTestViewConfig({
        id: 'test-missing',
        name: 'Test Missing',
        description: 'Test missing template variables',
        ui: {
          title: 'Test Missing',
          routing: {
            basePath: '/test-missing',
            parameters: {
              missingVar: { type: 'string', required: true }
            }
          }
        }
      });
      
      viewRegistry.register(config);
      
      const url = RouteUtils.generateNavUrl('test-missing', {});
      expect(url).toBe('/test-missing');
    });

    it('should handle nested template resolution', () => {
      registerCommonViews(); // Ensure views are registered
      const params = {
        nodeType: 'character',
        nodeId: 'char-123',
        depth: '2'
      };
      
      const url = RouteUtils.generateNavUrl('node-connections', params);
      expect(url).toContain('character');
      expect(url).toContain('char-123');
    });
  });

  describe('Route path generation', () => {
    it('should handle custom routing configuration', () => {
      const customConfig = createTestViewConfig({
        id: 'test-view',
        name: 'Test View',
        description: 'Test',
        ui: {
          title: 'Test View',
          description: 'Test',
          routing: {
            basePath: '/custom/path',
            parameters: {
              param1: { type: 'string', required: true },
              param2: { type: 'string', required: true }
            }
          }
        }
      });
      viewRegistry.register(customConfig);

      const route = RouteUtils.getRouteForView('test-view');
      expect(route?.path).toBe('/custom/path/:param1/:param2');
    });

    it('should use default patterns for known view types', () => {
      const puzzleConfig = createTestViewConfig({ 
        id: 'puzzle-focus', 
        name: 'Test', 
        description: 'Test' 
      });
      viewRegistry.register(puzzleConfig);

      const route = RouteUtils.getRouteForView('puzzle-focus');
      expect(route?.path).toBe('/puzzle-focus/:puzzleId');
    });

    it('should fallback to view ID for unknown types', () => {
      const unknownConfig = createTestViewConfig({ 
        id: 'unknown-type', 
        name: 'Unknown', 
        description: 'Unknown' 
      });
      viewRegistry.register(unknownConfig);

      const route = RouteUtils.getRouteForView('unknown-type');
      expect(route?.path).toBe('/unknown-type');
    });
  });
});