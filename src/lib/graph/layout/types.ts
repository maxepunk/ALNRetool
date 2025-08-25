/**
 * Murder Mystery Investigation Layout Type Definitions
 * 
 * Comprehensive TypeScript type definitions for graph layout algorithms specialized
 * for interactive murder mystery game visualization. Provides strongly-typed configuration
 * interfaces for hierarchical, force-directed, and structured layout algorithms optimized
 * for detective workflows, evidence analysis, and collaborative investigation scenarios.
 * 
 * **Core Configuration Strategy:**
 * - **BaseLayoutConfig**: Foundation interface with common layout properties
 * - **Algorithm-Specific Configs**: Specialized interfaces for each layout algorithm
 * - **LayoutConfiguration Union**: Type-safe configuration management
 * - **Investigation Context**: Murder mystery game-specific parameter optimization
 * 
 * **Layout Algorithm Categories:**
 * 
 * **Hierarchical Layouts:**
 * - **DagreLayoutConfig**: Puzzle dependency chains with directed progression
 * - **RadialLayoutConfig**: Character-centric investigation radiating from suspects
 * 
 * **Force-Directed Layouts:**
 * - **ForceLayoutConfig**: Evidence clustering with physics-based relationships
 * 
 * **Structured Layouts:**
 * - **GridLayoutConfig**: Timeline organization with systematic arrangement
 * - **CircularLayoutConfig**: Round-table investigation with equal positioning
 * 
 * **Type Safety Benefits:**
 * - **Compile-Time Validation**: Ensures correct configuration parameter usage
 * - **IDE Autocomplete**: Provides intelligent code assistance for layout setup
 * - **Runtime Safety**: Prevents invalid configuration combinations
 * - **Documentation Integration**: Self-documenting interfaces with investigation context
 * 
 * @module graph/layout/types
 * @since 1.0.0
 * @version 2.1.0
 * @author ALNRetool Development Team
 */

import type { ViewType } from '../types';

/**
 * Base Layout Configuration for Murder Mystery Investigation
 * 
 * Foundation interface providing common layout properties shared across all
 * graph layout algorithms. Optimized for murder mystery investigation workflows
 * with flexible viewport sizing, node spacing, and view-specific optimizations.
 * 
 * **Common Properties:**
 * - **Viewport Control**: Configurable width/height for different display scenarios
 * - **Node Spacing**: Adjustable spacing for optimal readability in detective workflows
 * - **View Type Integration**: Context-aware optimizations for specific investigation views
 * 
 * **Investigation Use Cases:**
 * - **Evidence Boards**: Large viewport layouts for comprehensive case overview
 * - **Mobile Investigation**: Compact layouts for field investigation tools
 * - **Collaborative Sessions**: Adjustable spacing for group analysis scenarios
 * - **Presentation Mode**: Fixed dimensions for case presentation and briefings
 * 
 * @interface BaseLayoutConfig
 * @since 1.0.0
 */
export interface BaseLayoutConfig {
  /** Viewport width in pixels for investigation display area (default: responsive) */
  width?: number;
  /** Viewport height in pixels for investigation display area (default: responsive) */
  height?: number;
  /** Node spacing in pixels for optimal readability in detective workflows (default: 100px) */
  nodeSpacing?: number;
  /** Investigation view type for context-aware layout optimizations */
  viewType?: ViewType;
}

/**
 * Dagre Hierarchical Layout Configuration for Puzzle Dependencies
 * 
 * Specialized configuration for directed acyclic graph layouts optimized for
 * murder mystery puzzle dependency visualization. Provides clear progression
 * paths through investigation challenges with hierarchical organization.
 * 
 * **Puzzle Investigation Features:**
 * - **Direction Control**: Top-down or left-right puzzle progression flows
 * - **Rank Separation**: Vertical spacing between puzzle difficulty levels
 * - **Node Separation**: Horizontal spacing between parallel puzzle paths
 * - **Edge Separation**: Spacing for clear dependency relationship visualization
 * 
 * **Algorithm Options:**
 * - **network-simplex**: Optimal for complex puzzle dependency networks (default)
 * - **tight-tree**: Faster layout for simple linear puzzle chains
 * - **longest-path**: Emphasizes critical path through investigation
 * 
 * **Alignment Strategies:**
 * - **UL/UR**: Left/right aligned for systematic investigation flows
 * - **DL/DR**: Down-left/right for evidence collection patterns
 * 
 * @interface DagreLayoutConfig
 * @extends BaseLayoutConfig
 * @since 1.0.0
 */
export interface DagreLayoutConfig extends BaseLayoutConfig {
  /** Investigation flow direction: TB=top-down, BT=bottom-up, LR=left-right, RL=right-left (default: 'LR') */
  direction?: 'TB' | 'BT' | 'LR' | 'RL';
  /** Vertical spacing between puzzle difficulty levels in pixels (default: 300px) */
  rankSeparation?: number;
  /** Horizontal spacing between parallel puzzle paths in pixels (default: 100px) */
  nodeSeparation?: number;
  /** Spacing around dependency edges for clear relationship visualization (default: 20px) */
  edgeSeparation?: number;
  /** Algorithm for puzzle dependency optimization (default: 'network-simplex') */
  ranker?: 'network-simplex' | 'tight-tree' | 'longest-path';
  /** Node alignment strategy for systematic investigation flows (default: undefined) */
  align?: 'UL' | 'UR' | 'DL' | 'DR';
  /** Cycle breaking strategy for complex puzzle networks (default: 'greedy') */
  acyclicer?: 'greedy' | undefined;
}

/**
 * Force-Directed Layout Configuration for Evidence Clustering
 * 
 * Physics-based simulation configuration for organic evidence and character
 * relationship visualization. Creates natural clustering patterns based on
 * connection strength and relationship types in murder mystery investigations.
 * 
 * **Evidence Clustering Features:**
 * - **Spring Physics**: Simulates evidence relationships with configurable forces
 * - **Charge Simulation**: Repulsion forces prevent evidence overlap
 * - **Collision Detection**: Maintains readable spacing between investigation items
 * - **Centering Forces**: Keeps evidence clusters within viewport boundaries
 * 
 * **Investigation Patterns:**
 * - **Evidence Affinity**: Related clues cluster together naturally
 * - **Character Networks**: Social relationships form visible communities
 * - **Timeline Proximity**: Temporal events group by time periods
 * - **Ownership Clusters**: Items group around their respective owners
 * 
 * **Performance Tuning:**
 * - **Iterations**: Balance between layout quality and computation time
 * - **Alpha Parameters**: Control simulation cooling and convergence
 * - **Force Strengths**: Adjust clustering tightness and separation
 * 
 * @interface ForceLayoutConfig
 * @extends BaseLayoutConfig
 * @since 1.0.0
 */
export interface ForceLayoutConfig extends BaseLayoutConfig {
  /** Simulation iterations for evidence clustering quality (default: 300) */
  iterations?: number;
  /** Target distance between connected evidence items in pixels (default: 150px) */
  linkDistance?: number;
  /** Connection strength between related investigation items (0-1, default: 0.7) */
  linkStrength?: number;
  /** Repulsion force to prevent evidence overlap (negative value, default: -300) */
  chargeStrength?: number;
  /** Maximum distance for charge force application in pixels (default: Infinity) */
  chargeDistance?: number;
  /** X-coordinate for investigation viewport center (default: width/2) */
  centerX?: number;
  /** Y-coordinate for investigation viewport center (default: height/2) */
  centerY?: number;
  /** Initial simulation energy for evidence movement (0-1, default: 1.0) */
  alpha?: number;
  /** Minimum simulation energy before stopping (0-1, default: 0.001) */
  alphaMin?: number;
  /** Target simulation energy for controlled convergence (0-1, default: 0) */
  alphaTarget?: number;
  /** Rate of simulation cooling for stable convergence (0-1, default: 0.0228) */
  alphaDecay?: number;
  /** Velocity dampening to reduce evidence oscillation (0-1, default: 0.4) */
  velocityDecay?: number;
  /** Node collision radius for readable spacing in pixels (default: 5px) */
  collisionRadius?: number;
  /** Collision force strength to prevent overlap (0-1, default: 0.7) */
  collisionStrength?: number;
  /** Horizontal centering force strength (0-1, default: 0.1) */
  forceX?: number;
  /** Vertical centering force strength (0-1, default: 0.1) */
  forceY?: number;
}

/**
 * Grid Layout Configuration for Timeline and Systematic Organization
 * 
 * Structured grid arrangement for systematic evidence presentation and
 * timeline visualization in murder mystery investigations. Provides orderly
 * organization with configurable sorting and grouping for methodical analysis.
 * 
 * **Timeline Investigation Features:**
 * - **Temporal Organization**: Systematic arrangement by time periods
 * - **Evidence Cataloging**: Structured presentation of investigation items
 * - **Category Grouping**: Visual separation of different evidence types
 * - **Sorting Options**: Multiple organization criteria for case analysis
 * 
 * **Investigation Use Cases:**
 * - **Evidence Board**: Systematic display of all case materials
 * - **Timeline Analysis**: Chronological event organization
 * - **Categorized Review**: Grouped analysis by evidence types
 * - **Inventory Management**: Structured item tracking and cataloging
 * 
 * @interface GridLayoutConfig
 * @extends BaseLayoutConfig
 * @since 1.0.0
 */
export interface GridLayoutConfig extends BaseLayoutConfig {
  /** Number of evidence columns in grid arrangement (default: auto-calculated) */
  columns?: number;
  /** Number of evidence rows in grid arrangement (default: auto-calculated) */
  rows?: number;
  /** Width of each evidence cell in pixels (default: 200px) */
  cellWidth?: number;
  /** Height of each evidence cell in pixels (default: 150px) */
  cellHeight?: number;
  /** Padding between evidence items for visual separation (default: 10px) */
  padding?: number;
  /** Evidence sorting criteria for systematic organization (default: 'none') */
  sortBy?: 'none' | 'name' | 'type' | 'degree';
  /** Evidence grouping strategy for categorical analysis (default: 'none') */
  groupBy?: 'none' | 'type' | 'cluster';
}

/**
 * Circular Layout Configuration for Collaborative Investigation
 * 
 * Round-table arrangement for group investigation sessions and character
 * relationship analysis. Provides equal positioning and collaborative
 * visibility for team-based murder mystery solving workflows.
 * 
 * **Collaborative Investigation Features:**
 * - **Equal Access**: All participants have equivalent view angles
 * - **Round-table Discussion**: Facilitates group analysis and debate
 * - **Character Focus**: Centers investigation around key suspects
 * - **Relationship Visualization**: Shows connections between all parties
 * 
 * **Investigation Scenarios:**
 * - **Group Sessions**: Team investigation and collaborative analysis
 * - **Character Networks**: Social relationship mapping around suspects
 * - **Witness Interviews**: Circular arrangement of testimonial sources
 * - **Jury Presentation**: Equal access layout for case presentation
 * 
 * @interface CircularLayoutConfig
 * @extends BaseLayoutConfig
 * @since 1.0.0
 */
export interface CircularLayoutConfig extends BaseLayoutConfig {
  /** Circle radius for investigation layout in pixels (default: auto-calculated) */
  radius?: number;
  /** Starting angle for participant positioning in degrees (default: 0) */
  startAngle?: number;
  /** Ending angle for participant arrangement in degrees (default: 360) */
  endAngle?: number;
  /** Clockwise arrangement for systematic investigation flow (default: true) */
  clockwise?: boolean;
  /** Participant sorting criteria for organized seating (default: 'none') */
  sortBy?: 'none' | 'name' | 'type' | 'degree';
  /** Grouping strategy for role-based investigation clusters (default: 'none') */
  groupBy?: 'none' | 'type' | 'cluster';
  /** Gap between investigation groups in degrees (default: 30) */
  groupGap?: number;
}

/**
 * Radial Layout Configuration for Character-Centric Investigation
 * 
 * Radial arrangement centered around key suspects or central investigation
 * elements. Provides hierarchical distance visualization showing relationship
 * proximity and influence levels in murder mystery character networks.
 * 
 * **Character Investigation Features:**
 * - **Central Focus**: Investigation radiates from primary suspect or victim
 * - **Relationship Distance**: Visual representation of connection strength
 * - **Hierarchical Levels**: Multiple rings showing degrees of separation
 * - **Influence Mapping**: Shows sphere of influence around key characters
 * 
 * **Investigation Applications:**
 * - **Suspect Analysis**: Focus investigation around primary suspect
 * - **Victim Networks**: Map relationships radiating from victim
 * - **Evidence Tracing**: Follow clue paths from central evidence
 * - **Influence Mapping**: Visualize power structures and relationships
 * 
 * @interface RadialLayoutConfig
 * @extends BaseLayoutConfig
 * @since 1.0.0
 */
export interface RadialLayoutConfig extends BaseLayoutConfig {
  /** Central character or evidence ID for investigation focus (default: auto-detected) */
  centerNode?: string;
  /** Distance between relationship levels in pixels (default: 150px) */
  levelSeparation?: number;
  /** Size of character nodes for visibility in pixels (default: 20px) */
  nodeSize?: number;
  /** Prevent character overlap for clear identification (default: true) */
  preventOverlap?: boolean;
  /** Character sorting criteria within each level (default: 'degree') */
  sortBy?: 'none' | 'name' | 'type' | 'degree';
}

/**
 * Unified Layout Configuration Union for Type Safety
 * 
 * Discriminated union type providing compile-time type safety for all
 * murder mystery investigation layout configurations. Ensures correct
 * parameter usage and enables intelligent IDE support for layout setup.
 * 
 * **Type Safety Benefits:**
 * - **Parameter Validation**: Compile-time checking of configuration properties
 * - **IDE Autocomplete**: Intelligent code assistance for investigation layouts
 * - **Runtime Safety**: Prevents invalid configuration combinations
 * - **Maintainability**: Self-documenting interface contracts
 * 
 * **Supported Layout Types:**
 * - **DagreLayoutConfig**: Hierarchical puzzle dependency layouts
 * - **ForceLayoutConfig**: Physics-based evidence clustering layouts
 * - **GridLayoutConfig**: Systematic timeline and cataloging layouts
 * - **CircularLayoutConfig**: Collaborative round-table investigation layouts
 * - **RadialLayoutConfig**: Character-centric relationship mapping layouts
 * 
 * @example
 * ```typescript
 * // Type-safe configuration for puzzle dependencies
 * const puzzleConfig: DagreLayoutConfig = {
 *   direction: 'LR',
 *   rankSeparation: 300,
 *   nodeSpacing: 100,
 *   viewType: 'puzzle-dependency'
 * };
 * 
 * // Type-safe configuration for evidence clustering  
 * const evidenceConfig: ForceLayoutConfig = {
 *   iterations: 500,
 *   linkDistance: 150,
 *   chargeStrength: -300,
 *   viewType: 'evidence-network'
 * };
 * 
 * // Union type usage with type guards
 * function applyInvestigationLayout(config: LayoutConfiguration) {
 *   if ('direction' in config) {
 *     // TypeScript knows this is DagreLayoutConfig
 *     return applyDagreLayout(config);
 *   } else if ('iterations' in config) {
 *     // TypeScript knows this is ForceLayoutConfig
 *     return applyForceLayout(config);
 *   }
 *   // Handle other layout types...
 * }
 * ```
 * 
 * @since 1.0.0
 */
export type LayoutConfiguration = 
  | DagreLayoutConfig
  | ForceLayoutConfig
  | GridLayoutConfig
  | CircularLayoutConfig
  | RadialLayoutConfig;