/**
 * Murder Mystery Investigation Web Worker Types
 * 
 * Comprehensive TypeScript type definitions for web worker communication in murder mystery
 * investigation graph processing. Provides strongly-typed interfaces for asynchronous layout
 * computation, progress monitoring, and error handling in complex investigation visualizations.
 * 
 * **Web Worker Architecture:**
 * 
 * **Message Communication:**
 * - **WorkerMessage**: Base interface for all worker communication protocols
 * - **ForceWorkerMessage**: Specialized messages for force-directed layout computation
 * - **WorkerResult**: Comprehensive results from completed layout calculations
 * - **WorkerProgress**: Real-time progress updates for investigation layout processing
 * 
 * **Investigation-Optimized Configuration:**
 * - **ForceLayoutConfig**: Comprehensive physics simulation parameters for evidence clustering
 * - **SimulationNode**: D3.js-compatible node structure for investigation entities
 * - **SimulationLink**: Edge representation for investigation relationships and dependencies
 * 
 * **Type Safety Features:**
 * - **Runtime Type Guards**: Safe message validation for worker communication
 * - **Error Handling**: Structured error types for robust investigation processing
 * - **Progress Monitoring**: Typed progress updates for investigation workflow feedback
 * 
 * **Investigation Use Cases:**
 * 
 * **Complex Evidence Networks:**
 * - Offload large evidence relationship computations to background workers
 * - Real-time progress feedback for intensive investigation graph processing
 * - Non-blocking UI during complex suspect network analysis
 * 
 * **Performance Benefits:**
 * - **Parallel Processing**: Leverage multiple CPU cores for investigation computation
 * - **UI Responsiveness**: Maintain smooth interaction during layout processing
 * - **Memory Isolation**: Worker memory separation prevents main thread impact
 * - **Error Isolation**: Worker failures don't crash investigation interface
 * 
 * @module graph/workers/types
 * @since 1.0.0
 * @version 2.0.0
 * @author ALNRetool Development Team
 */

import type { GraphNode, GraphEdge, GraphData } from '../types';

/**
 * Base Worker Message Interface for Investigation Processing
 * 
 * Foundation interface for all web worker communication in murder mystery investigation
 * graph processing. Provides standardized message structure for layout computation,
 * progress monitoring, and error handling across investigation workflows.
 * 
 * **Message Types:**
 * - **start**: Initialize investigation layout computation with configuration
 * - **tick**: Intermediate computation update during investigation processing
 * - **progress**: Progress update with completion percentage and status information
 * - **complete**: Final computation results with positioned investigation entities
 * - **error**: Error information with detailed debugging and recovery context
 * 
 * **Investigation Integration:**
 * - All investigation layout workers extend this base interface
 * - Consistent message structure across different layout algorithms
 * - Standardized error handling for investigation processing failures
 * - Progress monitoring support for investigation workflow feedback
 * 
 * @interface WorkerMessage
 * @since 1.0.0
 */
export interface WorkerMessage {
  /** Message type indicating investigation processing stage or communication purpose */
  type: 'start' | 'tick' | 'progress' | 'complete' | 'error';
  /** Optional investigation graph data for processing or results */
  data?: GraphData;
  /** Optional progress percentage (0-100) for investigation layout computation */
  progress?: number;
  /** Optional error message for investigation processing failures */
  error?: string;
}

/**
 * Force Layout Worker Message for Evidence Clustering
 * 
 * Specialized worker message for force-directed layout computation in murder mystery
 * investigations. Extends base worker message with investigation entities and
 * physics-based clustering configuration for evidence relationship visualization.
 * 
 * **Investigation Data:**
 * - **nodes**: Investigation entities (characters, evidence, puzzles, timeline events)
 * - **edges**: Relationships between investigation entities (ownership, dependencies, timeline)
 * - **config**: Physics simulation parameters optimized for investigation clustering
 * 
 * **Force Layout Applications:**
 * - **Evidence Clustering**: Natural grouping of related investigation items
 * - **Character Networks**: Social relationship visualization with force-based positioning
 * - **Timeline Proximity**: Temporal events clustering by relationship strength
 * - **Ownership Visualization**: Items gravitating toward their respective owners
 * 
 * @interface ForceWorkerMessage
 * @extends WorkerMessage
 * @since 1.0.0
 */
export interface ForceWorkerMessage extends WorkerMessage {
  /** Investigation entities for force-directed positioning (characters, evidence, puzzles, timeline) */
  nodes: GraphNode[];
  /** Investigation relationships for force-based clustering (ownership, dependencies, timeline connections) */
  edges: GraphEdge[];
  /** Optional physics simulation configuration optimized for investigation clustering */
  config?: ForceLayoutConfig;
}

/**
 * Force Layout Configuration for Investigation Clustering
 * 
 * Comprehensive physics simulation parameters for force-directed layout of murder mystery
 * investigation entities. Provides fine-tuned control over clustering behavior, entity
 * interactions, and visual organization optimized for detective workflows.
 * 
 * **Physics Simulation Parameters:**
 * 
 * **Basic Forces:**
 * - **iterations**: Simulation steps for investigation clustering quality
 * - **linkDistance**: Target spacing between connected investigation entities
 * - **linkStrength**: Connection strength for investigation relationships
 * - **chargeStrength**: Repulsion force preventing investigation entity overlap
 * 
 * **Centering and Bounds:**
 * - **centerX/centerY**: Investigation viewport center coordinates
 * - **centerStrength**: Force pulling entities toward investigation focus
 * - **width/height**: Investigation display area boundaries
 * 
 * **Collision and Movement:**
 * - **collisionRadius**: Investigation entity collision detection radius
 * - **alpha/alphaMin/alphaTarget**: Simulation energy and cooling parameters
 * - **alphaDecay/velocityDecay**: Investigation clustering convergence control
 * 
 * **Investigation-Specific Features:**
 * - **nodeStrengthByType**: Entity-specific force strengths (characters stronger than evidence)
 * - **nodeSizeByType**: Entity-specific collision radii for realistic investigation spacing
 * 
 * @interface ForceLayoutConfig
 * @since 1.0.0
 */
export interface ForceLayoutConfig {
  /** Number of simulation iterations for investigation clustering quality (default: 300) */
  iterations?: number;
  /** Target distance between connected investigation entities in pixels (default: 150) */
  linkDistance?: number;
  /** Connection strength between investigation relationships (0-1, default: 0.7) */
  linkStrength?: number;
  /** Repulsion force preventing investigation entity overlap (negative, default: -300) */
  chargeStrength?: number;
  /** X-coordinate for investigation viewport center (default: width/2) */
  centerX?: number;
  /** Y-coordinate for investigation viewport center (default: height/2) */
  centerY?: number;
  /** Force strength pulling entities toward investigation center (0-1, default: 0.1) */
  centerStrength?: number;
  /** Investigation entity collision detection radius in pixels (default: 5) */
  collisionRadius?: number;
  /** Initial simulation energy for investigation clustering (0-1, default: 1.0) */
  alpha?: number;
  /** Minimum simulation energy before stopping (0-1, default: 0.001) */
  alphaMin?: number;
  /** Target simulation energy for controlled convergence (0-1, default: 0) */
  alphaTarget?: number;
  /** Rate of simulation cooling for investigation stability (0-1, default: 0.0228) */
  alphaDecay?: number;
  /** Velocity dampening to reduce investigation entity oscillation (0-1, default: 0.4) */
  velocityDecay?: number;
  /** Investigation display area width in pixels for boundary constraints */
  width?: number;
  /** Investigation display area height in pixels for boundary constraints */
  height?: number;
  /** Entity-specific force strengths by investigation type (characters, evidence, puzzles, timeline) */
  nodeStrengthByType?: Record<string, number>;
  /** Entity-specific collision radii by investigation type for realistic spacing */
  nodeSizeByType?: Record<string, number>;
}

/**
 * Worker Computation Result for Investigation Layouts
 * 
 * Comprehensive result structure returned from web worker layout computation in murder
 * mystery investigations. Contains positioned investigation entities, performance metrics,
 * and computation details for investigation workflow integration.
 * 
 * **Result Components:**
 * - **nodes**: Investigation entities with computed positions for visualization
 * - **edges**: Investigation relationships with any computed layout properties
 * - **duration**: Computation time for performance monitoring and optimization
 * - **iterations**: Actual simulation iterations completed for quality assessment
 * - **error**: Optional error information for debugging and recovery
 * 
 * **Investigation Integration:**
 * - Positioned entities ready for immediate investigation visualization
 * - Performance metrics for investigation workflow optimization
 * - Error context for investigation processing troubleshooting
 * - Quality indicators through iteration count and duration
 * 
 * @interface WorkerResult
 * @since 1.0.0
 */
export interface WorkerResult {
  /** Investigation entities with computed positions ready for visualization */
  nodes: GraphNode[];
  /** Investigation relationships with any computed layout properties */
  edges: GraphEdge[];
  /** Computation duration in milliseconds for performance monitoring */
  duration: number;
  /** Actual simulation iterations completed for layout quality assessment */
  iterations?: number;
  /** Optional error message if computation failed or encountered issues */
  error?: string;
}

/**
 * Worker Error Message for Investigation Processing Failures
 * 
 * Structured error information for web worker failures during murder mystery
 * investigation graph processing. Provides comprehensive debugging context
 * and error recovery information for investigation workflow resilience.
 * 
 * **Error Information:**
 * - **type**: Always 'error' for message type identification
 * - **message**: Human-readable error description for investigation debugging
 * - **stack**: Optional stack trace for detailed investigation error analysis
 * - **code**: Optional error code for programmatic investigation error handling
 * 
 * **Investigation Error Handling:**
 * - Detailed context for investigation processing troubleshooting
 * - Stack traces for investigation layout computation debugging
 * - Error codes for automated investigation error recovery
 * - User-friendly messages for investigation interface error display
 * 
 * @interface WorkerError
 * @since 1.0.0
 */
export interface WorkerError {
  /** Error message type identifier for investigation worker communication */
  type: 'error';
  /** Human-readable error description for investigation debugging and user display */
  message: string;
  /** Optional stack trace for detailed investigation error analysis and debugging */
  stack?: string;
  /** Optional error code for programmatic investigation error handling and recovery */
  code?: string;
}

/**
 * Worker Progress Update for Investigation Layout Processing
 * 
 * Real-time progress information for ongoing web worker layout computation in murder
 * mystery investigations. Provides completion percentage, status messages, and
 * intermediate results for investigation workflow feedback and monitoring.
 * 
 * **Progress Information:**
 * - **type**: Always 'progress' for message type identification
 * - **progress**: Completion percentage (0-100) for investigation progress indicators
 * - **message**: Optional status description for investigation workflow context
 * - **nodes**: Optional intermediate investigation entity positions for preview
 * 
 * **Investigation Workflow Integration:**
 * - Real-time progress bars for investigation layout computation
 * - Status messages for investigation processing context and feedback
 * - Intermediate entity positions for investigation preview during computation
 * - User experience optimization for complex investigation visualizations
 * 
 * @interface WorkerProgress
 * @since 1.0.0
 */
export interface WorkerProgress {
  /** Progress message type identifier for investigation worker communication */
  type: 'progress';
  /** Completion percentage (0-100) for investigation progress indicators */
  progress: number;
  /** Optional status description providing investigation processing context */
  message?: string;
  /** Optional intermediate investigation entity positions for preview visualization */
  nodes?: GraphNode[];
}

/**
 * D3.js Simulation Node for Investigation Entity Physics
 * 
 * D3.js-compatible node structure for force-directed simulation of murder mystery
 * investigation entities. Provides position, velocity, and clustering information
 * for physics-based investigation visualization with entity-specific properties.
 * 
 * **Physics Properties:**
 * - **x/y**: Current investigation entity position coordinates
 * - **vx/vy**: Velocity vectors for investigation entity movement simulation
 * - **fx/fy**: Fixed position constraints for anchored investigation entities
 * - **index**: D3.js internal simulation index for performance optimization
 * 
 * **Investigation Context:**
 * - **type**: Investigation entity type (character, evidence, puzzle, timeline)
 * - **cluster**: Investigation cluster identifier for group-based analysis
 * - **[key: string]**: Extensible properties for investigation-specific metadata
 * 
 * **Entity Movement Control:**
 * - Fixed positions for investigation anchor points (primary suspects, crime scenes)
 * - Velocity constraints for realistic investigation entity interactions
 * - Cluster assignments for investigation group dynamics
 * 
 * @interface SimulationNode
 * @since 1.0.0
 */
export interface SimulationNode {
  /** Unique investigation entity identifier for simulation tracking and reference */
  id: string;
  /** Current X-coordinate position of investigation entity in simulation space */
  x?: number;
  /** Current Y-coordinate position of investigation entity in simulation space */
  y?: number;
  /** X-axis velocity vector for investigation entity movement in simulation */
  vx?: number;
  /** Y-axis velocity vector for investigation entity movement in simulation */
  vy?: number;
  /** Fixed X-coordinate for anchored investigation entities (null for free movement) */
  fx?: number | null;
  /** Fixed Y-coordinate for anchored investigation entities (null for free movement) */
  fy?: number | null;
  /** D3.js internal simulation index for performance optimization (assigned automatically) */
  index?: number;
  /** Investigation entity type for behavior customization (character, evidence, puzzle, timeline) */
  type?: string;
  /** Investigation cluster identifier for group-based analysis and visualization */
  cluster?: string;
  /** Extensible properties for investigation-specific metadata and custom attributes */
  [key: string]: unknown;
}

/**
 * D3.js Simulation Link for Investigation Relationship Physics
 * 
 * D3.js-compatible edge structure for force-directed simulation of murder mystery
 * investigation relationships. Provides connection properties, force parameters,
 * and relationship metadata for physics-based investigation network visualization.
 * 
 * **Connection Properties:**
 * - **source/target**: Investigation entities connected by this relationship
 * - **index**: D3.js internal simulation index for performance optimization
 * - **type**: Investigation relationship type (ownership, dependency, timeline)
 * 
 * **Force Parameters:**
 * - **strength**: Connection strength affecting investigation clustering behavior
 * - **distance**: Target distance between connected investigation entities
 * - **[key: string]**: Extensible properties for investigation-specific metadata
 * 
 * **Investigation Relationships:**
 * - Ownership connections between characters and evidence
 * - Dependency relationships between puzzles and requirements
 * - Timeline connections between temporal investigation events
 * - Collaboration links between investigation team members
 * 
 * @interface SimulationLink
 * @since 1.0.0
 */
export interface SimulationLink {
  /** Source investigation entity (ID string or SimulationNode object) */
  source: string | SimulationNode;
  /** Target investigation entity (ID string or SimulationNode object) */
  target: string | SimulationNode;
  /** D3.js internal simulation index for performance optimization (assigned automatically) */
  index?: number;
  /** Investigation relationship type for behavior customization (ownership, dependency, timeline) */
  type?: string;
  /** Connection strength affecting investigation clustering (0-1, higher values create tighter bonds) */
  strength?: number;
  /** Target distance between connected investigation entities in pixels */
  distance?: number;
  /** Extensible properties for investigation-specific relationship metadata */
  [key: string]: unknown;
}

/**
 * Type Guard for Worker Message Validation
 * 
 * Runtime type validation function for web worker messages in murder mystery investigation
 * processing. Provides safe type narrowing and validation for worker communication to
 * prevent runtime errors and ensure investigation processing reliability.
 * 
 * **Validation Strategy:**
 * - **Object Structure**: Validates data is a non-null object with required properties
 * - **Type Property**: Ensures 'type' property exists and is a valid string
 * - **Runtime Safety**: Prevents TypeError exceptions in investigation worker communication
 * - **Type Narrowing**: Enables TypeScript type narrowing for safe property access
 * 
 * **Investigation Worker Integration:**
 * - Validates all incoming investigation layout computation messages
 * - Ensures safe handling of investigation progress updates and results
 * - Prevents invalid message processing in investigation workflows
 * - Enables robust error handling for investigation worker communication
 * 
 * @param data - Unknown data received from investigation web worker
 * @returns Type predicate indicating if data is a valid WorkerMessage
 * @since 1.0.0
 * @complexity O(1) - Constant time validation
 * 
 * @example
 * ```typescript
 * // Safe worker message handling
 * worker.onmessage = (event) => {
 *   if (isWorkerMessage(event.data)) {
 *     // TypeScript knows event.data is WorkerMessage
 *     handleInvestigationMessage(event.data);
 *   } else {
 *     console.error('Invalid worker message received');
 *   }
 * };
 * ```
 */
export function isWorkerMessage(data: unknown): data is WorkerMessage {
  return (
    typeof data === 'object' &&
    data !== null &&
    'type' in data &&
    typeof (data as WorkerMessage).type === 'string'
  );
}

/**
 * Type Guard for Worker Error Validation
 * 
 * Runtime type validation function for web worker error messages in murder mystery
 * investigation processing. Provides safe identification and handling of error conditions
 * during investigation layout computation and processing workflows.
 * 
 * **Error Validation Strategy:**
 * - **Object Structure**: Validates data is a non-null object with error properties
 * - **Error Type**: Ensures 'type' property is specifically 'error' for error identification
 * - **Message Property**: Validates required 'message' property exists for error context
 * - **Type Safety**: Enables safe access to error properties for investigation debugging
 * 
 * **Investigation Error Handling:**
 * - Identifies investigation layout computation errors safely
 * - Enables proper error logging and user notification for investigation failures
 * - Prevents runtime errors when handling investigation worker error responses
 * - Supports investigation error recovery and fallback mechanisms
 * 
 * @param data - Unknown data received from investigation web worker
 * @returns Type predicate indicating if data is a valid WorkerError
 * @since 1.0.0
 * @complexity O(1) - Constant time validation
 * 
 * @example
 * ```typescript
 * // Safe error handling in investigation workflows
 * worker.onmessage = (event) => {
 *   if (isWorkerError(event.data)) {
 *     // TypeScript knows event.data is WorkerError
 *     logInvestigationError(event.data.message);
 *     showErrorToInvestigator(event.data.message);
 *   }
 * };
 * ```
 */
export function isWorkerError(data: unknown): data is WorkerError {
  return (
    typeof data === 'object' &&
    data !== null &&
    'type' in data &&
    (data as WorkerError).type === 'error' &&
    'message' in data
  );
}

/**
 * Type Guard for Worker Progress Validation
 * 
 * Runtime type validation function for web worker progress updates in murder mystery
 * investigation processing. Provides safe identification and handling of progress messages
 * during investigation layout computation for user feedback and workflow monitoring.
 * 
 * **Progress Validation Strategy:**
 * - **Object Structure**: Validates data is a non-null object with progress properties
 * - **Progress Type**: Ensures 'type' property is specifically 'progress' for identification
 * - **Progress Value**: Validates 'progress' property exists and is a numeric value
 * - **Type Safety**: Enables safe access to progress data for investigation UI updates
 * 
 * **Investigation Progress Monitoring:**
 * - Safely identifies investigation layout computation progress updates
 * - Enables real-time progress bars and status displays for investigation workflows
 * - Prevents runtime errors when handling investigation progress notifications
 * - Supports investigation user experience optimization during heavy computations
 * 
 * @param data - Unknown data received from investigation web worker
 * @returns Type predicate indicating if data is a valid WorkerProgress
 * @since 1.0.0
 * @complexity O(1) - Constant time validation
 * 
 * @example
 * ```typescript
 * // Safe progress monitoring in investigation workflows
 * worker.onmessage = (event) => {
 *   if (isWorkerProgress(event.data)) {
 *     // TypeScript knows event.data is WorkerProgress
 *     updateInvestigationProgressBar(event.data.progress);
 *     if (event.data.message) {
 *       showInvestigationStatus(event.data.message);
 *     }
 *   }
 * };
 * ```
 */
export function isWorkerProgress(data: unknown): data is WorkerProgress {
  return (
    typeof data === 'object' &&
    data !== null &&
    'type' in data &&
    (data as WorkerProgress).type === 'progress' &&
    'progress' in data &&
    typeof (data as WorkerProgress).progress === 'number'
  );
}