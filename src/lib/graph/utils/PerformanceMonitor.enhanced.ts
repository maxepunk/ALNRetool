/**
 * Enhanced Performance Monitor with React Flow Integration
 * 
 * Extends the base PerformanceMonitor with React Flow-specific
 * tracking and performance marks for graph operations.
 */

import { performanceMonitor } from './PerformanceMonitor';

export interface GraphPerformanceMetrics {
  pageLoadTime: number;
  graphRenderTime: number;
  layoutCalculationTime: number;
  nodeRenderTime: number;
  edgeRenderTime: number;
  memoryUsage: number;
  nodeCount: number;
  edgeCount: number;
  viewType: string;
  timestamp: number;
}

export interface PerformanceThresholds {
  pageLoad: number;  // ms
  graphRender: number;  // ms
  layoutCalculation: number;  // ms
  memoryDelta: number;  // MB
}

const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  pageLoad: 2000,  // 2 seconds
  graphRender: 500,  // 500ms
  layoutCalculation: 200,  // 200ms
  memoryDelta: 50  // 50MB
};

class EnhancedPerformanceMonitor {
  private metrics: GraphPerformanceMetrics[] = [];
  private thresholds: PerformanceThresholds = DEFAULT_THRESHOLDS;
  private marks: Map<string, number> = new Map();
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = import.meta.env?.DEV === true;
  }

  /**
   * Mark a performance point
   */
  mark(name: string): void {
    const timestamp = performance.now();
    this.marks.set(name, timestamp);
    
    if (this.isDevelopment && typeof window !== 'undefined' && window.performance?.mark) {
      window.performance.mark(name);
    }
  }

  /**
   * Measure between two marks
   */
  measureBetweenMarks(startMark: string, endMark: string, label?: string): number | null {
    const start = this.marks.get(startMark);
    const end = this.marks.get(endMark);
    
    if (!start || !end) {
      console.warn(`Missing marks: ${startMark} or ${endMark}`);
      return null;
    }
    
    const duration = end - start;
    
    if (this.isDevelopment && typeof window !== 'undefined' && window.performance?.measure) {
      try {
        window.performance.measure(label || `${startMark}-to-${endMark}`, startMark, endMark);
      } catch (e) {
        // Marks might not exist in window.performance
      }
    }
    
    return duration;
  }

  /**
   * Track graph rendering performance
   */
  trackGraphRender(
    viewType: string,
    nodeCount: number,
    edgeCount: number,
    renderTime: number
  ): void {
    const metrics: GraphPerformanceMetrics = {
      pageLoadTime: 0,
      graphRenderTime: renderTime,
      layoutCalculationTime: 0,
      nodeRenderTime: 0,
      edgeRenderTime: 0,
      memoryUsage: this.getMemoryUsage(),
      nodeCount,
      edgeCount,
      viewType,
      timestamp: Date.now()
    };
    
    this.metrics.push(metrics);
    this.checkThresholds(metrics);
    
    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics.shift();
    }
  }

  /**
   * Track layout calculation performance
   */
  trackLayoutCalculation(duration: number, nodeCount: number, edgeCount: number): void {
    if (this.isDevelopment) {
    }
    
    if (duration > this.thresholds.layoutCalculation) {
      console.warn(`Layout calculation exceeded threshold: ${duration.toFixed(2)}ms > ${this.thresholds.layoutCalculation}ms`);
    }
  }

  /**
   * Get memory usage (browser environment)
   */
  private getMemoryUsage(): number {
    if (typeof window !== 'undefined' && (window.performance as any)?.memory) {
      const memory = (window.performance as any).memory;
      return Math.round(memory.usedJSHeapSize / 1024 / 1024); // MB
    }
    return 0;
  }

  /**
   * Check if metrics exceed thresholds
   */
  private checkThresholds(metrics: GraphPerformanceMetrics): void {
    const violations: string[] = [];
    
    if (metrics.pageLoadTime > this.thresholds.pageLoad) {
      violations.push(`Page load: ${metrics.pageLoadTime.toFixed(0)}ms > ${this.thresholds.pageLoad}ms`);
    }
    
    if (metrics.graphRenderTime > this.thresholds.graphRender) {
      violations.push(`Graph render: ${metrics.graphRenderTime.toFixed(0)}ms > ${this.thresholds.graphRender}ms`);
    }
    
    if (metrics.layoutCalculationTime > this.thresholds.layoutCalculation) {
      violations.push(`Layout: ${metrics.layoutCalculationTime.toFixed(0)}ms > ${this.thresholds.layoutCalculation}ms`);
    }
    
    if (violations.length > 0 && this.isDevelopment) {
      console.warn('Performance threshold violations:', violations);
    }
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    averageRenderTime: number;
    averageLayoutTime: number;
    averageNodeCount: number;
    averageEdgeCount: number;
    violationCount: number;
    recentMetrics: GraphPerformanceMetrics[];
  } {
    if (this.metrics.length === 0) {
      return {
        averageRenderTime: 0,
        averageLayoutTime: 0,
        averageNodeCount: 0,
        averageEdgeCount: 0,
        violationCount: 0,
        recentMetrics: []
      };
    }
    
    const sum = this.metrics.reduce(
      (acc, m) => ({
        renderTime: acc.renderTime + m.graphRenderTime,
        layoutTime: acc.layoutTime + m.layoutCalculationTime,
        nodeCount: acc.nodeCount + m.nodeCount,
        edgeCount: acc.edgeCount + m.edgeCount,
        violations: acc.violations + (
          m.graphRenderTime > this.thresholds.graphRender ||
          m.layoutCalculationTime > this.thresholds.layoutCalculation ? 1 : 0
        )
      }),
      { renderTime: 0, layoutTime: 0, nodeCount: 0, edgeCount: 0, violations: 0 }
    );
    
    const count = this.metrics.length;
    
    return {
      averageRenderTime: sum.renderTime / count,
      averageLayoutTime: sum.layoutTime / count,
      averageNodeCount: sum.nodeCount / count,
      averageEdgeCount: sum.edgeCount / count,
      violationCount: sum.violations,
      recentMetrics: this.metrics.slice(-10)
    };
  }

  /**
   * Create a performance report
   */
  generateReport(): string {
    const summary = this.getPerformanceSummary();
    
    return `
Performance Report
==================
Average Render Time: ${summary.averageRenderTime.toFixed(2)}ms
Average Layout Time: ${summary.averageLayoutTime.toFixed(2)}ms
Average Node Count: ${summary.averageNodeCount.toFixed(0)}
Average Edge Count: ${summary.averageEdgeCount.toFixed(0)}
Threshold Violations: ${summary.violationCount}

Thresholds:
- Page Load: ${this.thresholds.pageLoad}ms
- Graph Render: ${this.thresholds.graphRender}ms
- Layout Calculation: ${this.thresholds.layoutCalculation}ms

Recent Metrics:
${summary.recentMetrics.map(m => 
  `- ${m.viewType}: ${m.graphRenderTime.toFixed(0)}ms render, ${m.nodeCount} nodes, ${m.edgeCount} edges`
).join('\n')}
    `.trim();
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): GraphPerformanceMetrics[] {
    return [...this.metrics];
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    this.marks.clear();
  }

  /**
   * Update performance thresholds
   */
  setThresholds(thresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  /**
   * Get current thresholds
   */
  getThresholds(): PerformanceThresholds {
    return { ...this.thresholds };
  }
}

// Create singleton instance
export const enhancedPerformanceMonitor = new EnhancedPerformanceMonitor();

// Export convenience functions
export const markPerformance = (name: string) => enhancedPerformanceMonitor.mark(name);
export const measureMarks = (start: string, end: string, label?: string) => 
  enhancedPerformanceMonitor.measureBetweenMarks(start, end, label);
export const trackGraphPerformance = (
  viewType: string,
  nodeCount: number,
  edgeCount: number,
  renderTime: number
) => enhancedPerformanceMonitor.trackGraphRender(viewType, nodeCount, edgeCount, renderTime);
export const trackLayout = (duration: number, nodeCount: number, edgeCount: number) =>
  enhancedPerformanceMonitor.trackLayoutCalculation(duration, nodeCount, edgeCount);
export const getPerformanceReport = () => enhancedPerformanceMonitor.generateReport();

// Integration with base performanceMonitor
export const integratedMeasure = async <T>(
  label: string,
  fn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> => {
  markPerformance(`${label}-start`);
  const result = await performanceMonitor.measureAsync(label, fn, metadata);
  markPerformance(`${label}-end`);
  measureMarks(`${label}-start`, `${label}-end`, label);
  return result;
};