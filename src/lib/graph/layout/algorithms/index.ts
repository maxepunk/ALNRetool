/**
 * Murder Mystery Investigation Layout Algorithms
 * 
 * Comprehensive collection of graph layout algorithms specialized for interactive murder mystery
 * game visualization. Each algorithm provides unique positioning strategies optimized for different
 * investigation workflows and visual storytelling approaches.
 * 
 * **Algorithm Categories:**
 * 
 * **Hierarchical Layouts:**
 * - **DagreLayoutAlgorithm**: Puzzle dependency chains with clear progression paths
 * - **RadialLayoutAlgorithm**: Character-centric investigation radiating from suspects
 * 
 * **Force-Directed Layouts:**
 * - **ForceLayoutAlgorithm**: Organic evidence clustering with natural relationship spacing
 * - **ForceAtlas2Algorithm**: Advanced community detection for suspect group identification
 * 
 * **Structured Layouts:**
 * - **GridLayoutAlgorithm**: Timeline organization with systematic evidence arrangement
 * - **CircularLayoutAlgorithm**: Round-table investigation view for group dynamics
 * 
 * **Investigation Use Cases:**
 * 
 * **Evidence Chain Analysis** (DagreLayoutAlgorithm):
 * - Clear puzzle dependency visualization
 * - Step-by-step investigation progression
 * - Reward-requirement relationship clarity
 * 
 * **Suspect Network Mapping** (RadialLayoutAlgorithm):
 * - Character-centric investigation views
 * - Relationship distance visualization
 * - Social connection analysis
 * 
 * **Clue Clustering** (ForceLayoutAlgorithm):
 * - Natural evidence grouping by relevance
 * - Organic relationship discovery
 * - Interactive exploration patterns
 * 
 * **Community Detection** (ForceAtlas2Algorithm):
 * - Suspect group identification
 * - Social cluster analysis
 * - Hidden connection revelation
 * 
 * **Timeline Organization** (GridLayoutAlgorithm):
 * - Systematic event arrangement
 * - Temporal evidence alignment
 * - Structured case presentation
 * 
 * **Group Dynamics** (CircularLayoutAlgorithm):
 * - Round-table investigation perspective
 * - Equal participant positioning
 * - Collaborative analysis facilitation
 * 
 * **Performance Characteristics:**
 * - **DagreLayoutAlgorithm**: O(V + E) with network-simplex optimization
 * - **ForceLayoutAlgorithm**: O(V²) with quadtree spatial optimization
 * - **ForceAtlas2Algorithm**: O(V log V) with advanced community detection
 * - **RadialLayoutAlgorithm**: O(V) with BFS-based level assignment
 * - **GridLayoutAlgorithm**: O(V) with systematic positioning
 * - **CircularLayoutAlgorithm**: O(V) with angular distribution
 * 
 * **Selection Guidelines:**
 * 
 * **For Puzzle Dependencies**: Use DagreLayoutAlgorithm for clear progression paths
 * **For Character Investigation**: Use RadialLayoutAlgorithm for relationship focus
 * **For Evidence Exploration**: Use ForceLayoutAlgorithm for organic clustering
 * **For Social Analysis**: Use ForceAtlas2Algorithm for community detection
 * **For Timeline Cases**: Use GridLayoutAlgorithm for systematic organization
 * **For Group Sessions**: Use CircularLayoutAlgorithm for collaborative investigation
 * 
 * @example
 * ```typescript
 * import { 
 *   DagreLayoutAlgorithm, 
 *   ForceLayoutAlgorithm, 
 *   RadialLayoutAlgorithm 
 * } from './algorithms';
 * 
 * // Puzzle dependency investigation
 * const puzzleLayout = new DagreLayoutAlgorithm();
 * const puzzleGraph = await puzzleLayout.layout(puzzleNodes, puzzleEdges);
 * 
 * // Character-centric investigation
 * const characterLayout = new RadialLayoutAlgorithm();
 * const characterGraph = await characterLayout.layout(characterNodes, edges, {
 *   centerNode: 'suspect-primary'
 * });
 * 
 * // Evidence clustering analysis
 * const evidenceLayout = new ForceLayoutAlgorithm();
 * const evidenceGraph = await evidenceLayout.layout(evidenceNodes, evidenceEdges, {
 *   iterations: 500,
 *   springLength: 120
 * });
 * ```
 * 
 * @see {@link BaseLayoutAlgorithm} Abstract foundation for all layout implementations
 * @see {@link LayoutAlgorithmRegistry} Dynamic algorithm loading and registration
 * @see {@link LayoutOrchestrator} Coordination and execution of layout operations
 * @author ALNRetool Development Team
 * @since 1.0.0
 * @version 1.2.0
 */

export { DagreLayoutAlgorithm } from './DagreLayoutAlgorithm';
export { ForceLayoutAlgorithm } from './ForceLayoutAlgorithm';
export { ForceAtlas2Algorithm } from './ForceAtlas2Algorithm';
export { RadialLayoutAlgorithm } from './RadialLayoutAlgorithm';
export { GridLayoutAlgorithm } from './GridLayoutAlgorithm';
export { CircularLayoutAlgorithm } from './CircularLayoutAlgorithm';