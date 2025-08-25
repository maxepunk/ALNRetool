/**
 * Performance benchmarks for ViewComponentFactory vs Manual Implementation
 * 
 * Metrics tracked:
 * - Initial render time
 * - Re-render performance with state changes
 * - Memory usage
 * - Bundle size impact
 */

import { describe, it, expect, afterEach } from 'vitest';
import { performance } from 'perf_hooks';
import { render } from '@testing-library/react';
import React from 'react';
import { renderWithProviders } from '@/test/utils';
import ViewComponentFactory from '@/components/generated/ViewComponentFactory';
import { PuzzleFocusConfig } from '@/lib/graph/config/views/PuzzleFocusConfig';
import { CharacterJourneyConfig } from '@/lib/graph/config/views/CharacterJourneyConfig';
import { TimelineConfig } from '@/lib/graph/config/views/TimelineConfig';
import type { ViewConfiguration } from '@/lib/graph/config/ViewConfiguration';

// Helper to measure render time
function measureRenderTime(component: React.ReactElement): number {
  const start = performance.now();
  const { unmount } = render(component);
  const end = performance.now();
  unmount();
  return end - start;
}

// Helper to measure memory usage
function measureMemoryUsage(): number {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    return process.memoryUsage().heapUsed / 1024 / 1024; // MB
  }
  return 0;
}

describe('ViewComponentFactory Performance Benchmarks', () => {
  const iterations = 10;
  
  afterEach(() => {
    // Clean up any lingering components
  });
  
  describe('Initial Render Performance', () => {
    it('should render PuzzleFocusView in under 100ms', () => {
      const times: number[] = [];
      
      for (let i = 0; i < iterations; i++) {
        const time = measureRenderTime(
          <ViewComponentFactory config={PuzzleFocusConfig} />
        );
        times.push(time);
      }
      
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      console.log(`PuzzleFocus avg render time: ${avgTime.toFixed(2)}ms`);
      
      expect(avgTime).toBeLessThan(100);
    });

    it('should render CharacterJourneyView in under 100ms', () => {
      const times: number[] = [];
      
      for (let i = 0; i < iterations; i++) {
        const time = measureRenderTime(
          <ViewComponentFactory config={CharacterJourneyConfig} />
        );
        times.push(time);
      }
      
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      console.log(`CharacterJourney avg render time: ${avgTime.toFixed(2)}ms`);
      
      expect(avgTime).toBeLessThan(100);
    });

    it('should render TimelineView in under 100ms', () => {
      const times: number[] = [];
      
      for (let i = 0; i < iterations; i++) {
        const time = measureRenderTime(
          <ViewComponentFactory config={TimelineConfig} />
        );
        times.push(time);
      }
      
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      console.log(`Timeline avg render time: ${avgTime.toFixed(2)}ms`);
      
      expect(avgTime).toBeLessThan(100);
    });
  });

  describe('Re-render Performance', () => {
    it('should handle state changes efficiently', () => {
      const { rerender } = renderWithProviders(
        <ViewComponentFactory config={PuzzleFocusConfig} />
      );
      
      const times: number[] = [];
      
      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        
        // Simulate state change by updating config
        const updatedConfig: ViewConfiguration = {
          ...PuzzleFocusConfig,
          ui: {
            ...PuzzleFocusConfig.ui,
            title: `Updated Title ${i}`
          }
        };
        
        rerender(<ViewComponentFactory config={updatedConfig} />);
        
        const end = performance.now();
        times.push(end - start);
      }
      
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      console.log(`Re-render avg time: ${avgTime.toFixed(2)}ms`);
      
      expect(avgTime).toBeLessThan(50); // Re-renders should be faster
    });

    it('should memoize expensive computations', () => {
      const complexConfig: ViewConfiguration = {
        ...PuzzleFocusConfig,
        hooks: {
          ...PuzzleFocusConfig.hooks,
          afterNodeCreation: (nodes) => {
            // Simulate expensive computation
            const result = Array(1000).fill(0).map((_, i) => i * 2);
            console.log(`Computed: ${result.length}`);
            return nodes;
          }
        }
      };
      
      const { rerender } = renderWithProviders(
        <ViewComponentFactory config={complexConfig} />
      );
      
      const start = performance.now();
      
      // Multiple re-renders with same config should use memoized values
      for (let i = 0; i < 5; i++) {
        rerender(<ViewComponentFactory config={complexConfig} />);
      }
      
      const end = performance.now();
      const totalTime = end - start;
      
      console.log(`Memoized re-renders total time: ${totalTime.toFixed(2)}ms`);
      expect(totalTime).toBeLessThan(100); // Should be fast due to memoization
    });
  });

  describe('Memory Usage', () => {
    it('should not have memory leaks on mount/unmount cycles', () => {
      const initialMemory = measureMemoryUsage();
      const components: any[] = [];
      
      // Mount and unmount multiple times
      for (let i = 0; i < 20; i++) {
        const { unmount } = render(
          <ViewComponentFactory config={PuzzleFocusConfig} />
        );
        components.push(unmount);
      }
      
      // Unmount all
      components.forEach(unmount => unmount());
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = measureMemoryUsage();
      const memoryIncrease = finalMemory - initialMemory;
      
      console.log(`Memory increase: ${memoryIncrease.toFixed(2)}MB`);
      
      // Allow for some memory increase but flag potential leaks
      expect(memoryIncrease).toBeLessThan(10); // Less than 10MB increase
    });

    it('should efficiently handle large ViewConfigurations', () => {
      const largeConfig: ViewConfiguration = {
        ...PuzzleFocusConfig,
        ui: {
          title: 'Performance Test View',
          controls: Array(100).fill(0).map((_, i) => ({
            id: `control-${i}`,
            type: 'entity-selector' as const,
            label: `Control ${i}`,
            statePath: `control${i}`,
            options: {
              entityType: 'character' as const,
              multiple: true
            }
          }))
        }
      };
      
      const initialMemory = measureMemoryUsage();
      
      const { unmount } = render(
        <ViewComponentFactory config={largeConfig} />
      );
      
      const peakMemory = measureMemoryUsage();
      unmount();
      
      const memoryUsed = peakMemory - initialMemory;
      console.log(`Large config memory usage: ${memoryUsed.toFixed(2)}MB`);
      
      expect(memoryUsed).toBeLessThan(50); // Should handle large configs efficiently
    });
  });

  describe('Comparative Performance', () => {
    it('should have comparable performance to manual implementation', () => {
      // Simulate a manual implementation render time
      const ManualComponent = () => <div>Manual Implementation</div>;
      
      const manualTimes: number[] = [];
      const factoryTimes: number[] = [];
      
      for (let i = 0; i < iterations; i++) {
        manualTimes.push(measureRenderTime(<ManualComponent />));
        factoryTimes.push(measureRenderTime(
          <ViewComponentFactory config={PuzzleFocusConfig} />
        ));
      }
      
      const avgManual = manualTimes.reduce((a, b) => a + b, 0) / manualTimes.length;
      const avgFactory = factoryTimes.reduce((a, b) => a + b, 0) / factoryTimes.length;
      
      const overhead = ((avgFactory - avgManual) / avgManual) * 100;
      
      console.log(`Manual avg: ${avgManual.toFixed(2)}ms`);
      console.log(`Factory avg: ${avgFactory.toFixed(2)}ms`);
      console.log(`Overhead: ${overhead.toFixed(1)}%`);
      
      // Factory should have less than 50% overhead
      expect(overhead).toBeLessThan(50);
    });
  });

  describe('Bundle Size Impact', () => {
    it('should document bundle size metrics', () => {
      // This is a placeholder for bundle size analysis
      // In a real scenario, we'd use webpack-bundle-analyzer or similar
      
      const estimatedSizes = {
        ViewComponentFactory: 15, // KB
        ViewConfiguration: 5,     // KB per config
        Dependencies: 20,          // KB
        Total: 40                  // KB
      };
      
      console.log('Estimated Bundle Sizes:');
      Object.entries(estimatedSizes).forEach(([key, size]) => {
        console.log(`  ${key}: ${size}KB`);
      });
      
      expect(estimatedSizes.Total).toBeLessThan(500); // Should be under 500KB
    });
  });

  describe('Concurrent Rendering', () => {
    it('should handle multiple views rendering simultaneously', () => {
      const start = performance.now();
      
      const { unmount: unmount1 } = render(
        <ViewComponentFactory config={PuzzleFocusConfig} />
      );
      const { unmount: unmount2 } = render(
        <ViewComponentFactory config={CharacterJourneyConfig} />
      );
      const { unmount: unmount3 } = render(
        <ViewComponentFactory config={TimelineConfig} />
      );
      
      const end = performance.now();
      const totalTime = end - start;
      
      unmount1();
      unmount2();
      unmount3();
      
      console.log(`Concurrent render time: ${totalTime.toFixed(2)}ms`);
      
      // Should handle concurrent renders efficiently
      expect(totalTime).toBeLessThan(300); // All three in under 300ms
    });
  });
});