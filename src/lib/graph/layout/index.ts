/**
 * Murder Mystery Investigation Graph Layout System
 * 
 * Comprehensive graph layout engine for interactive murder mystery game visualization.
 * Provides hierarchical, force-directed, and specialized layout algorithms optimized
 * for detective workflows, evidence analysis, and collaborative investigation.
 * 
 * **System Architecture:**
 * 
 * **Core Layout Functions:**
 * - **applyPureDagreLayout**: Puzzle dependency chains with directed graph optimization
 * - **applyForceLayout**: Organic evidence clustering with spring-damping physics
 * - **applyClusteredForceLayout**: Multi-community suspect group visualization
 * - **ForceLayoutComputation**: Async force simulation with web worker support
 * 
 * **Base Framework:**
 * - **BaseLayoutAlgorithm**: Abstract foundation for all layout implementations
 * - **LayoutAlgorithmRegistry**: Dynamic algorithm loading with lazy initialization
 * - **LayoutConfig/Progress/Capabilities**: Standardized interfaces for consistency
 * 
 * **Algorithm Collection:**
 * - **DagreLayoutAlgorithm**: Hierarchical puzzle progression visualization
 * - **ForceLayoutAlgorithm**: Evidence relationship clustering
 * - **RadialLayoutAlgorithm**: Character-centric investigation views
 * - **CircularLayoutAlgorithm**: Round-table collaborative investigation
 * - **GridLayoutAlgorithm**: Timeline and systematic evidence arrangement
 * - **ForceAtlas2Algorithm**: Advanced community detection for suspect analysis
 * 
 * **Investigation Workflow Integration:**
 * 
 * **Evidence Chain Analysis:**
 * ```typescript
 * const puzzleChain = await applyPureDagreLayout(puzzleNodes, puzzleEdges, {
 *   direction: 'LR',
 *   rankSeparation: 300,
 *   edgeSeparation: 100
 * });
 * ```
 * 
 * **Character Network Investigation:**
 * ```typescript
 * const suspectNetwork = await applyForceLayout(characterNodes, relationEdges, {
 *   iterations: 500,
 *   springLength: 150,
 *   springStrength: 0.8
 * });
 * ```
 * 
 * **Asynchronous Evidence Processing:**
 * ```typescript
 * if (isWebWorkerSupported()) {
 *   const computation = new ForceLayoutComputation();
 *   const result = await computation.compute(evidenceNodes, evidenceEdges, {
 *     onProgress: (progress) => updateProgressBar(progress.completion)
 *   });
 * }
 * ```
 * 
 * **Dynamic Algorithm Selection:**
 * ```typescript
 * const registry = new LayoutAlgorithmRegistry();
 * const algorithm = await registry.getAlgorithm('force-atlas2');
 * const communityLayout = await algorithm.layout(socialNodes, socialEdges);
 * ```
 * 
 * **Performance Features:**
 * - **Web Worker Support**: Offloads heavy computations for responsive UI
 * - **Progress Monitoring**: Real-time feedback for long-running layouts  
 * - **Lazy Loading**: Algorithms loaded on-demand to reduce bundle size
 * - **Clustered Processing**: Optimized handling of large investigative datasets
 * - **Memory Efficiency**: Streaming layouts for massive murder mystery databases
 * 
 * **Layout Selection Guidelines:**
 * 
 * **For Puzzle Dependencies**: Use applyPureDagreLayout for clear progression paths
 * **For Evidence Clustering**: Use applyForceLayout for relationship-based grouping
 * **For Suspect Communities**: Use applyClusteredForceLayout for group detection
 * **For Timeline Cases**: Use structured algorithms via registry system
 * **For Large Datasets**: Use ForceLayoutComputation with web worker support
 * **For Interactive Sessions**: Use registry for dynamic algorithm switching
 * 
 * **Architecture Benefits:**
 * - **Modular Design**: Each algorithm can be used independently or in combination
 * - **Extensibility**: Easy addition of new layout algorithms via registry pattern
 * - **Type Safety**: Full TypeScript coverage for all interfaces and implementations
 * - **Performance**: Optimized algorithms with async processing capabilities
 * - **Consistency**: Standardized interfaces across all layout implementations
 * 
 * @example
 * ```typescript
 * import { 
 *   applyPureDagreLayout, 
 *   applyForceLayout, 
 *   LayoutAlgorithmRegistry,
 *   ForceLayoutComputation 
 * } from '@/lib/graph/layout';
 * 
 * // Investigation workflow orchestration
 * class InvestigationLayoutOrchestrator {
 *   async createCaseVisualization(caseData) {
 *     // 1. Puzzle dependency analysis
 *     const puzzleLayout = await applyPureDagreLayout(
 *       caseData.puzzles, caseData.puzzleEdges
 *     );
 *     
 *     // 2. Evidence relationship mapping
 *     const evidenceLayout = await applyForceLayout(
 *       caseData.evidence, caseData.evidenceConnections
 *     );
 *     
 *     // 3. Dynamic suspect analysis
 *     const registry = new LayoutAlgorithmRegistry();
 *     const socialAlgorithm = await registry.getAlgorithm('radial');
 *     const suspectLayout = await socialAlgorithm.layout(
 *       caseData.characters, caseData.relationships
 *     );
 *     
 *     return { puzzleLayout, evidenceLayout, suspectLayout };
 *   }
 * }
 * ```
 * 
 * @see {@link BaseLayoutAlgorithm} Foundation class for custom layout algorithms
 * @see {@link LayoutAlgorithmRegistry} Dynamic algorithm management system
 * @see {@link ForceLayoutComputation} High-performance async layout processing
 * @author ALNRetool Development Team
 * @since 1.0.0
 * @version 2.0.0
 */

// Core layout exports
export { applyPureDagreLayout } from './dagre';
export { applyForceLayout, applyClusteredForceLayout } from './force';
export { ForceLayoutComputation, isWebWorkerSupported } from './forceAsync';
export type { ForceLayoutConfig, ForceLayoutProgress, ForceLayoutResult } from './forceAsync';

// Base architecture
export { BaseLayoutAlgorithm } from './BaseLayoutAlgorithm';
export type { 
  LayoutConfig, 
  LayoutProgress, 
  LayoutCapabilities, 
  LayoutMetadata 
} from './BaseLayoutAlgorithm';

// Registry
export { LayoutAlgorithmRegistry } from './LayoutAlgorithmRegistry';

// Algorithm implementations
export * from './algorithms';