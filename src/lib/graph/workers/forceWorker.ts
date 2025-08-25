/**
 * Force Layout Web Worker
 * Runs d3-force simulation in a separate thread to prevent UI blocking
 * Supports progress reporting and cancellation with input validation
 */

import * as d3Force from 'd3-force';
import { validateIncomingMessage, createSafeErrorMessage } from './validateWorkerMessage';
import type { GraphNode, GraphEdge } from '../types';
import type { ForceLayoutConfig } from './types';
import { logger } from '../utils/Logger'


// Message types for communication with main thread
export interface WorkerMessageInit {
  type: 'init';
  nodes: GraphNode[];
  edges: GraphEdge[];
  config?: ForceLayoutConfig;
}

export interface WorkerMessageTick {
  type: 'tick';
  progress: number;
  nodes?: SimulationNodeResult[];
}

export interface WorkerMessageComplete {
  type: 'complete';
  progress: 100;
  nodes: SimulationNodeResult[];
}

export interface WorkerMessageError {
  type: 'error';
  error: string;
}

export interface WorkerMessageCancel {
  type: 'cancel';
}

// Union type for all possible worker messages
export type WorkerMessage = 
  | WorkerMessageInit
  | WorkerMessageTick
  | WorkerMessageComplete
  | WorkerMessageError
  | WorkerMessageCancel;

// Input message from main thread
export interface WorkerInputMessage {
  type: 'init' | 'cancel';
  nodes?: GraphNode[];
  edges?: GraphEdge[];
  config?: ForceLayoutConfig;
}

// Result node with position info
export interface SimulationNodeResult {
  id: string;
  position: { x: number; y: number };
}

interface SimulationNode {
  id: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  type?: string;
  data?: GraphNode['data'];
  position?: { x: number; y: number };
}

interface SimulationEdge {
  source: string | SimulationNode;
  target: string | SimulationNode;
  type?: string;
}

// Store simulation instance for cancellation
let currentSimulation: d3Force.Simulation<SimulationNode, SimulationEdge> | null = null;
let isCancelled = false;

/**
 * Initialize and run force simulation
 */
function runSimulation(nodes: GraphNode[], edges: GraphEdge[], config: ForceLayoutConfig) {
  try {
    isCancelled = false;
    const startTime = performance.now();
    
    // Extract configuration with defaults
    const nodeCount = nodes.length;
    const isDenseGraph = nodeCount > 200;
    const isLargeGraph = nodeCount > 150;
    const isMediumGraph = nodeCount > 100;
    
    const {
      chargeStrength = isDenseGraph ? -5000 : (isLargeGraph ? -3000 : (isMediumGraph ? -2000 : -1500)),
      linkDistance = isDenseGraph ? 400 : (isLargeGraph ? 350 : (isMediumGraph ? 250 : 150)),
      linkStrength = isDenseGraph ? 0.03 : (isLargeGraph ? 0.05 : (isMediumGraph ? 0.1 : 0.2)),
      centerStrength = 0.05,
      collisionRadius = isDenseGraph ? 180 : (isLargeGraph ? 140 : (isMediumGraph ? 100 : 80)),
      iterations = isDenseGraph ? 800 : (isLargeGraph ? 600 : (isMediumGraph ? 500 : 400)),
      alphaMin = 0.001,
      alphaDecay = isDenseGraph ? 0.01 : 0.0228,
      velocityDecay = 0.4,
      width = Math.min(4000, Math.max(2000, 1500 + nodeCount * 10)),
      height = Math.min(3000, Math.max(1500, 1200 + nodeCount * 7)),
      nodeStrengthByType = {},
      nodeSizeByType = {}
    } = config;

    // Create simulation nodes
    const simulationNodes: SimulationNode[] = nodes.map(node => ({
      ...node,
      id: node.id,
      x: node.position?.x || Math.random() * width,
      y: node.position?.y || Math.random() * height,
      type: node.type,
      data: node.data
    }));

    // Create simulation links
    const simulationLinks = edges.map(edge => ({
      source: edge.source,
      target: edge.target,
      type: edge.type
    }));

    // Create force simulation
    currentSimulation = d3Force.forceSimulation<SimulationNode, SimulationEdge>(simulationNodes)
      .force('link', d3Force.forceLink<SimulationNode, SimulationEdge>(simulationLinks)
        .id((d: SimulationNode) => d.id)
        .distance((d: SimulationEdge) => {
          // Semantic link distances by edge type
          if (d.type === 'ownership') return linkDistance * 0.7;
          if (d.type === 'requirement') return linkDistance * 1.0;
          if (d.type === 'reward') return linkDistance * 1.3;
          if (d.type === 'relationship') return linkDistance * 0.8;
          if (d.type === 'timeline') return linkDistance * 0.9;
          return linkDistance;
        })
        .strength((d: SimulationEdge) => {
          // Relationship-based link strengths
          if (d.type === 'ownership') return 0.3;
          if (d.type === 'requirement') return 0.2;
          if (d.type === 'reward') return 0.15;
          if (d.type === 'relationship') return 0.25;
          return linkStrength;
        })
        .iterations(3)
      )
      .force('charge', d3Force.forceManyBody<SimulationNode>()
        .strength((d: SimulationNode) => {
          const nodeType = d.type || 'default';
          const typeMultiplier = nodeStrengthByType[nodeType];
          if (typeMultiplier !== undefined) {
            return chargeStrength * typeMultiplier;
          }
          
          // Default strengths by node type
          if (d.type === 'characterNode' || d.type === 'characterTree') {
            return chargeStrength * 2.0;
          }
          if (d.type === 'puzzleNode') {
            return chargeStrength * 1.6;
          }
          if (d.type === 'elementNode') {
            return chargeStrength * 1.0;
          }
          if (d.type === 'timelineNode') {
            return chargeStrength * 0.8;
          }
          return chargeStrength;
        })
        .theta(0.5)
        .distanceMin(1)
        .distanceMax(isDenseGraph ? 2000 : 1500)
      )
      .force('center', d3Force.forceCenter(width / 2, height / 2)
        .strength(centerStrength)
      )
      .force('collision', d3Force.forceCollide<SimulationNode>()
        .radius((d: SimulationNode) => {
          const nodeType = d.type || 'default';
          const typeMultiplier = nodeSizeByType[nodeType];
          if (typeMultiplier !== undefined) {
            return collisionRadius * typeMultiplier;
          }
          
          const densityMultiplier = isDenseGraph ? 1.3 : (isLargeGraph ? 1.2 : 1.0);
          
          if (d.type === 'characterNode' || d.type === 'characterTree') {
            return collisionRadius * 1.3 * densityMultiplier;
          }
          if (d.type === 'puzzleNode') {
            return collisionRadius * 1.1 * densityMultiplier;
          }
          if (d.type === 'elementNode') {
            return collisionRadius * 1.0 * densityMultiplier;
          }
          if (d.type === 'timelineNode') {
            return collisionRadius * 0.9 * densityMultiplier;
          }
          return collisionRadius * densityMultiplier;
        })
        .strength(1.0)
        .iterations(3)
      );

    // Add weak centering forces
    currentSimulation
      .force('y', d3Force.forceY(height / 2).strength(0.01))
      .force('x', d3Force.forceX(width / 2).strength(0.01));

    // Configure simulation parameters
    currentSimulation
      .alpha(1)
      .alphaMin(alphaMin)
      .alphaDecay(alphaDecay)
      .velocityDecay(velocityDecay);

    // Define bounds for position checking
    const maxX = width * 2;
    const maxY = height * 2;
    const minX = -width * 0.5;
    const minY = -height * 0.5;

    // Run simulation with progress reporting
    const updateInterval = Math.max(1, Math.floor(iterations / 100));
    let lastProgressReport = 0;

    for (let i = 0; i < iterations; i++) {
      // Check for cancellation
      if (isCancelled) {
        const cancelMessage: WorkerMessageCancel = { type: 'cancel' };
        postMessage(cancelMessage);
        return;
      }

      // Tick simulation
      currentSimulation.tick();

      // Apply position bounds
      simulationNodes.forEach(node => {
        // Clamp positions to reasonable bounds
        if ((node.x ?? 0) > maxX) {
          node.x = maxX;
          if (node.vx !== undefined) node.vx = 0;
        } else if ((node.x ?? 0) < minX) {
          node.x = minX;
          if (node.vx !== undefined) node.vx = 0;
        }

        if ((node.y ?? 0) > maxY) {
          node.y = maxY;
          if (node.vy !== undefined) node.vy = 0;
        } else if ((node.y ?? 0) < minY) {
          node.y = minY;
          if (node.vy !== undefined) node.vy = 0;
        }

        // Check for NaN or Infinity
        if (!isFinite(node.x ?? 0) || !isFinite(node.y ?? 0)) {
          node.x = width / 2;
          node.y = height / 2;
          if (node.vx !== undefined) node.vx = 0;
          if (node.vy !== undefined) node.vy = 0;
        }
      });

      // Report progress at intervals
      if (i % updateInterval === 0 || i === iterations - 1) {
        const progress = (i + 1) / iterations;
        const now = performance.now();
        
        // Throttle progress messages to every 50ms minimum
        if (now - lastProgressReport > 50) {
          const tickMessage: WorkerMessageTick = {
            type: 'tick',
            progress: progress * 100,
            nodes: i === iterations - 1 ? simulationNodes.map(node => ({
              id: node.id,
              position: {
                x: Math.round(node.x ?? 0),
                y: Math.round(node.y ?? 0)
              }
            })) : undefined
          };
          postMessage(tickMessage);
          lastProgressReport = now;
        }
      }
    }

    // Stop simulation
    currentSimulation.stop();
    currentSimulation = null;

    const computeTime = performance.now() - startTime;

    // Send final results
    const completeMessage: WorkerMessageComplete = {
      type: 'complete',
      nodes: simulationNodes.map(node => ({
        id: node.id,
        position: {
          x: Math.round(node.x ?? 0),
          y: Math.round(node.y ?? 0)
        }
      })),
      progress: 100
    };
    postMessage(completeMessage);

    logger.debug(`Force layout completed in ${computeTime.toFixed(0)}ms`);

  } catch (error) {
    const errorMessage: WorkerMessageError = {
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
    postMessage(errorMessage);
  }
}

// Handle messages from main thread
self.addEventListener('message', (event: MessageEvent<WorkerInputMessage>) => {
  try {
    // Validate incoming message
    const validation = validateIncomingMessage(event.data);
    
    if (!validation.valid) {
      const errorMessage: WorkerMessageError = {
        type: 'error',
        error: validation.error || 'Invalid message'
      };
      postMessage(errorMessage);
      return;
    }

    const sanitizedData = (validation.sanitized || event.data) as WorkerInputMessage;
    const { type, nodes, edges, config } = sanitizedData;

    switch (type) {
      case 'init':
        if (nodes && edges) {
          runSimulation(nodes, edges, config || {});
        } else {
          const errorMessage: WorkerMessageError = {
            type: 'error',
            error: 'Missing nodes or edges data'
          };
          postMessage(errorMessage);
        }
        break;

      case 'cancel':
        isCancelled = true;
        if (currentSimulation) {
          currentSimulation.stop();
          currentSimulation = null;
        }
        const cancelMessage: WorkerMessageCancel = { type: 'cancel' };
        postMessage(cancelMessage);
        break;

      default:
        const errorMessage: WorkerMessageError = {
          type: 'error',
          error: `Unknown message type: ${type}`
        };
        postMessage(errorMessage);
    }
  } catch (error) {
    const errorMessage: WorkerMessageError = {
      type: 'error',
      error: createSafeErrorMessage(error)
    };
    postMessage(errorMessage);
  }
});

// Export for TypeScript type checking (won't be used in Worker context)
export {};