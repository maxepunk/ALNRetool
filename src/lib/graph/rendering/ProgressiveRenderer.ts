/**
 * ProgressiveRenderer - Renders large graphs progressively in chunks
 * Maintains UI responsiveness by breaking rendering into smaller tasks
 */

import type { GraphData, GraphNode, GraphEdge } from '../types';

interface Viewport {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface RenderOptions {
  onUpdate?: (state: RenderState) => void;
  onComplete?: (graph: GraphData) => void;
  onCancel?: () => void;
  onError?: (error: Error) => void;
  onPause?: () => void;
  viewport?: Viewport;
}

interface RenderState {
  nodes: GraphNode[];
  edges: GraphEdge[];
  progress: number;
  isComplete: boolean;
}

interface RendererConfig {
  chunkSize?: number;
  delayBetweenChunks?: number;
  prioritizeViewport?: boolean;
  prioritizeByMetadata?: boolean;
  batchDOMUpdates?: boolean;
  immediateThreshold?: number;
  adaptiveChunkSize?: boolean;
  maxDroppedFrames?: number;
}

export class ProgressiveRenderer {
  private config: Required<RendererConfig>;
  private renderState: {
    isRendering: boolean;
    progress: number;
    renderedNodes: Map<string, GraphNode>;
    renderedEdges: Map<string, GraphEdge>;
    pendingNodes: GraphNode[];
    pendingEdges: GraphEdge[];
    timeoutId?: NodeJS.Timeout;
    rafId?: number;
    viewport?: Viewport;
    lastFrameTime: number;
    droppedFrames: number;
    currentChunkSize: number;
    options?: RenderOptions;
  };

  constructor(config: RendererConfig = {}) {
    this.config = {
      chunkSize: config.chunkSize ?? 50,
      delayBetweenChunks: config.delayBetweenChunks ?? 10,
      prioritizeViewport: config.prioritizeViewport ?? false,
      prioritizeByMetadata: config.prioritizeByMetadata ?? false,
      batchDOMUpdates: config.batchDOMUpdates ?? false,
      immediateThreshold: config.immediateThreshold ?? 100,
      adaptiveChunkSize: config.adaptiveChunkSize ?? false,
      maxDroppedFrames: config.maxDroppedFrames ?? 5
    };

    this.renderState = this.createInitialState();
  }

  /**
   * Start rendering a graph progressively
   */
  render(graph: GraphData, options: RenderOptions = {}): void {
    // Validate input
    if (!graph || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) {
      options.onError?.(new Error('Invalid graph structure'));
      return;
    }

    // Cancel any ongoing render
    this.cancel();

    // Initialize render state
    this.renderState = {
      ...this.createInitialState(),
      isRendering: true,
      viewport: options.viewport,
      pendingNodes: [...graph.nodes],
      pendingEdges: [...graph.edges],
      currentChunkSize: this.config.chunkSize,
      options
    };

    // Sort nodes by priority if needed
    if (this.config.prioritizeViewport && options.viewport) {
      this.sortNodesByViewport(options.viewport);
    } else if (this.config.prioritizeByMetadata) {
      this.sortNodesByPriority();
    }

    // Check if we should render immediately
    // Only if not explicitly using small chunk sizes
    if (graph.nodes.length <= this.config.immediateThreshold && 
        this.config.chunkSize >= this.config.immediateThreshold) {
      this.renderImmediate(graph, options);
      return;
    }

    // Start progressive rendering
    this.renderChunk(options);
  }

  /**
   * Update the viewport for prioritization
   */
  updateViewport(viewport: Viewport): void {
    this.renderState.viewport = viewport;
    
    // Re-sort remaining nodes
    if (this.config.prioritizeViewport && this.renderState.isRendering) {
      this.sortNodesByViewport(viewport);
    }
  }

  /**
   * Cancel ongoing render
   */
  cancel(): void {
    if (this.renderState.timeoutId) {
      clearTimeout(this.renderState.timeoutId);
      this.renderState.timeoutId = undefined;
    }
    if (this.renderState.rafId) {
      cancelAnimationFrame(this.renderState.rafId);
      this.renderState.rafId = undefined;
    }
    
    const wasRendering = this.renderState.isRendering;
    const options = this.renderState.options;
    
    // Reset state but keep options for callback
    this.renderState.isRendering = false;
    this.renderState.progress = 0;
    
    // Call onCancel if we were actually rendering (and not called from render())
    if (wasRendering && options?.onCancel) {
      options.onCancel();
    }
    
    // Now fully reset
    this.renderState = this.createInitialState();
  }

  /**
   * Check if currently rendering
   */
  isRendering(): boolean {
    return this.renderState.isRendering;
  }

  /**
   * Get current render progress (0-1)
   */
  getProgress(): number {
    return this.renderState.progress;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<RendererConfig>): void {
    Object.assign(this.config, config);
    if (config.chunkSize !== undefined) {
      this.renderState.currentChunkSize = config.chunkSize;
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): Required<RendererConfig> {
    return { ...this.config };
  }

  /**
   * Detect dropped frames for performance monitoring
   */
  detectDroppedFrames(): void {
    const now = performance.now();
    const frameDelta = now - this.renderState.lastFrameTime;
    
    // Assume 60 FPS target (16.67ms per frame)
    if (frameDelta > 33) { // More than 2 frames
      this.renderState.droppedFrames++;
      
      // Check if we should pause
      if (this.renderState.droppedFrames > this.config.maxDroppedFrames && 
          this.renderState.options?.onPause) {
        this.renderState.options.onPause();
      }
    } else {
      this.renderState.droppedFrames = 0;
    }
    
    this.renderState.lastFrameTime = now;
  }

  /**
   * Create initial render state
   */
  private createInitialState() {
    return {
      isRendering: false,
      progress: 0,
      renderedNodes: new Map<string, GraphNode>(),
      renderedEdges: new Map<string, GraphEdge>(),
      pendingNodes: [] as GraphNode[],
      pendingEdges: [] as GraphEdge[],
      timeoutId: undefined as NodeJS.Timeout | undefined,
      rafId: undefined as number | undefined,
      viewport: undefined as Viewport | undefined,
      lastFrameTime: performance.now(),
      droppedFrames: 0,
      currentChunkSize: this.config.chunkSize,
      options: undefined as RenderOptions | undefined
    };
  }

  /**
   * Render immediately for small graphs
   */
  private renderImmediate(graph: GraphData, options: RenderOptions): void {
    try {
      const state: RenderState = {
        nodes: graph.nodes,
        edges: graph.edges,
        progress: 1,
        isComplete: true
      };
      
      options.onUpdate?.(state);
      options.onComplete?.(graph);
      
      this.renderState.isRendering = false;
      this.renderState.progress = 1;
    } catch (error) {
      this.handleError(error as Error, options);
    }
  }

  /**
   * Render a single chunk of nodes
   */
  private renderChunk(options: RenderOptions): void {
    try {
      const startTime = performance.now();
      
      // Check for dropped frames
      if (this.renderState.droppedFrames > this.config.maxDroppedFrames) {
        options.onPause?.();
        this.renderState.droppedFrames = 0;
        // Reset and continue
      }
      
      // Take next chunk of nodes
      const chunkSize = this.renderState.currentChunkSize;
      const nodesToRender = this.renderState.pendingNodes.splice(0, chunkSize);
      
      // Add to rendered map
      nodesToRender.forEach(node => {
        this.renderState.renderedNodes.set(node.id, node);
      });
      
      // Find edges that can now be rendered
      this.renderState.pendingEdges = this.renderState.pendingEdges.filter(edge => {
        if (this.renderState.renderedNodes.has(edge.source) && 
            this.renderState.renderedNodes.has(edge.target)) {
          this.renderState.renderedEdges.set(edge.id, edge);
          return false;
        }
        return true;
      });
      
      // Calculate progress
      const totalItems = this.renderState.renderedNodes.size + this.renderState.pendingNodes.length;
      this.renderState.progress = totalItems > 0 ? this.renderState.renderedNodes.size / totalItems : 1;
      
      // Build current state with all rendered nodes and edges
      const currentNodes = Array.from(this.renderState.renderedNodes.values());
      const currentEdges = Array.from(this.renderState.renderedEdges.values());
      
      const state: RenderState = {
        nodes: currentNodes,
        edges: currentEdges,
        progress: this.renderState.progress,
        isComplete: this.renderState.pendingNodes.length === 0
      };
      
      // Adapt chunk size based on performance
      if (this.config.adaptiveChunkSize) {
        const renderTime = performance.now() - startTime;
        // More aggressive adaptation for testing
        if (renderTime < 5) {
          this.renderState.currentChunkSize = Math.min(Math.floor(this.renderState.currentChunkSize * 2), 200);
        } else if (renderTime > 15) {
          this.renderState.currentChunkSize = Math.max(Math.floor(this.renderState.currentChunkSize * 0.5), 5);
        } else if (renderTime > 10) {
          this.renderState.currentChunkSize = Math.max(Math.floor(this.renderState.currentChunkSize * 0.75), 8);
        }
      }
      
      // Send update
      const sendUpdate = () => {
        // Check if we were cancelled
        if (!this.renderState.isRendering) {
          return;
        }
        
        options.onUpdate?.(state);
        
        if (state.isComplete) {
          this.renderState.isRendering = false;
          
          // Build complete graph
          const completeGraph: GraphData = {
            nodes: currentNodes,
            edges: currentEdges
          };
          
          options.onComplete?.(completeGraph);
        } else {
          // Schedule next chunk
          this.renderState.timeoutId = setTimeout(() => {
            // Check again if we were cancelled
            if (this.renderState.isRendering) {
              this.renderChunk(options);
            }
          }, this.config.delayBetweenChunks);
        }
      };
      
      // Batch DOM updates if configured
      if (this.config.batchDOMUpdates && typeof window !== 'undefined') {
        this.renderState.rafId = requestAnimationFrame(sendUpdate);
      } else {
        sendUpdate();
      }
      
    } catch (error) {
      this.handleError(error as Error, options);
    }
  }

  /**
   * Sort nodes by viewport proximity
   */
  private sortNodesByViewport(viewport: Viewport): void {
    const centerX = viewport.x + viewport.width / 2;
    const centerY = viewport.y + viewport.height / 2;
    
    this.renderState.pendingNodes.sort((a, b) => {
      const aInViewport = this.isNodeInViewport(a, viewport);
      const bInViewport = this.isNodeInViewport(b, viewport);
      
      // Viewport nodes first
      if (aInViewport && !bInViewport) return -1;
      if (!aInViewport && bInViewport) return 1;
      
      // Then by distance to center
      const aDist = Math.hypot(a.position.x - centerX, a.position.y - centerY);
      const bDist = Math.hypot(b.position.x - centerX, b.position.y - centerY);
      
      return aDist - bDist;
    });
  }

  /**
   * Sort nodes by priority metadata
   */
  private sortNodesByPriority(): void {
    this.renderState.pendingNodes.sort((a, b) => {
      const aPriority = (a.data?.metadata as any)?.priority ?? 0;
      const bPriority = (b.data?.metadata as any)?.priority ?? 0;
      return bPriority - aPriority; // Higher priority first
    });
  }

  /**
   * Check if node is in viewport
   */
  private isNodeInViewport(node: GraphNode, viewport: Viewport): boolean {
    return node.position.x >= viewport.x &&
           node.position.x <= viewport.x + viewport.width &&
           node.position.y >= viewport.y &&
           node.position.y <= viewport.y + viewport.height;
  }

  /**
   * Handle rendering errors
   */
  private handleError(error: Error, options: RenderOptions): void {
    this.renderState.isRendering = false;
    options.onError?.(error);
    
    // Clean up
    if (this.renderState.timeoutId) {
      clearTimeout(this.renderState.timeoutId);
    }
    if (this.renderState.rafId) {
      cancelAnimationFrame(this.renderState.rafId);
    }
  }
}