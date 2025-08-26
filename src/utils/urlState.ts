/**
 * URL State Management Utilities
 * 
 * Provides serialization and deserialization between FilterStore state and URL parameters.
 * Implements URL-first architecture where URL is the single source of truth for filter state.
 * 
 * Phase 2: URL-First State Management Implementation
 */

import type { 
  FilterState, 
  PuzzleFilters, 
  CharacterFilters, 
  ContentFilters, 
  NodeConnectionsFilters 
} from '@/stores/filterStore';

/**
 * URL Parameter Schema
 * Defines how FilterStore state maps to URL parameters
 */
export interface URLState {
  // Universal filters
  search?: string;
  depth?: number;
  
  // View selection
  view?: string;
  
  // Puzzle filters
  acts?: string;              // Comma-separated: "Act 0,Act 1"
  puzzle?: string;            // Single puzzle ID
  status?: string;            // "completed" | "incomplete" | "all"
  
  // Character filters
  tiers?: string;             // Comma-separated: "Core,Secondary"
  ownership?: string;         // Comma-separated: "Owned,Accessible"
  charType?: string;          // "Player" | "NPC" | "all"
  character?: string;         // Single character ID
  shared?: boolean;           // Boolean flag
  
  // Content filters
  content?: string;           // Comma-separated: "draft,review"
  issues?: boolean | null;    // Boolean or null
  edited?: string;            // "today" | "week" | "month" | "all"
  
  // Node connections
  nodeType?: string;          // "character" | "puzzle" | "element" | "timeline"
  nodeId?: string;            // Single node ID
}

/**
 * Convert FilterStore state to URL search parameters
 */
export function filterStateToUrl(state: FilterState): URLSearchParams {
  const params = new URLSearchParams();
  
  // Universal filters
  if (state.searchTerm) {
    params.set('search', state.searchTerm);
  }
  
  if (state.connectionDepth !== 3) { // Only serialize if not default
    params.set('depth', state.connectionDepth.toString());
  }
  
  // Active view
  if (state.activeView) {
    params.set('view', state.activeView);
  }
  
  // Puzzle filters
  if (state.puzzleFilters.selectedActs.size > 0) {
    params.set('acts', Array.from(state.puzzleFilters.selectedActs).join(','));
  }
  
  if (state.puzzleFilters.selectedPuzzleId) {
    params.set('puzzle', state.puzzleFilters.selectedPuzzleId);
  }
  
  if (state.puzzleFilters.completionStatus !== 'all') {
    params.set('status', state.puzzleFilters.completionStatus);
  }
  
  // Character filters
  if (state.characterFilters.selectedTiers.size > 0) {
    params.set('tiers', Array.from(state.characterFilters.selectedTiers).join(','));
  }
  
  if (state.characterFilters.ownershipStatus.size > 0) {
    params.set('ownership', Array.from(state.characterFilters.ownershipStatus).join(','));
  }
  
  if (state.characterFilters.characterType !== 'all') {
    params.set('charType', state.characterFilters.characterType);
  }
  
  if (state.characterFilters.selectedCharacterId) {
    params.set('character', state.characterFilters.selectedCharacterId);
  }
  
  if (state.characterFilters.highlightShared) {
    params.set('shared', 'true');
  }
  
  // Content filters
  if (state.contentFilters.contentStatus.size > 0) {
    params.set('content', Array.from(state.contentFilters.contentStatus).join(','));
  }
  
  if (state.contentFilters.hasIssues !== null) {
    params.set('issues', state.contentFilters.hasIssues ? 'true' : 'false');
  }
  
  if (state.contentFilters.lastEditedRange !== 'all') {
    params.set('edited', state.contentFilters.lastEditedRange);
  }
  
  // Node connections filters
  if (state.nodeConnectionsFilters) {
    params.set('nodeType', state.nodeConnectionsFilters.nodeType);
  }
  
  // Node selection (separate from nodeConnectionsFilters)
  if (state.selectedNodeId) {
    params.set('selectedNodeId', state.selectedNodeId);
  }
  
  if (state.focusedNodeId) {
    params.set('focusedNodeId', state.focusedNodeId);
  }
  
  return params;
}

/**
 * Convert URL search parameters to FilterStore state
 */
export function urlToFilterState(params: URLSearchParams): Partial<FilterState> {
  const state: Partial<FilterState> = {};
  
  // Universal filters
  const search = params.get('search');
  if (search) {
    state.searchTerm = search;
  }
  
  const depth = params.get('depth');
  if (depth) {
    const depthNum = parseInt(depth, 10);
    if (!isNaN(depthNum) && depthNum >= 1 && depthNum <= 10) {
      state.connectionDepth = depthNum;
    }
  }
  
  // Active view
  const view = params.get('view');
  if (view && isValidViewType(view)) {
    state.activeView = view as FilterState['activeView'];
  }
  
  // Puzzle filters
  const puzzleFilters: Partial<PuzzleFilters> = {};
  
  const acts = params.get('acts');
  if (acts) {
    puzzleFilters.selectedActs = new Set(acts.split(',').filter(Boolean));
  }
  
  const puzzle = params.get('puzzle');
  if (puzzle) {
    puzzleFilters.selectedPuzzleId = puzzle;
  }
  
  const status = params.get('status');
  if (status && ['completed', 'incomplete', 'all'].includes(status)) {
    puzzleFilters.completionStatus = status as PuzzleFilters['completionStatus'];
  }
  
  if (Object.keys(puzzleFilters).length > 0) {
    state.puzzleFilters = puzzleFilters as PuzzleFilters;
  }
  
  // Character filters
  const characterFilters: Partial<CharacterFilters> = {};
  
  const tiers = params.get('tiers');
  if (tiers) {
    const validTiers = tiers.split(',').filter(tier => 
      ['Core', 'Secondary', 'Tertiary'].includes(tier)
    );
    if (validTiers.length > 0) {
      characterFilters.selectedTiers = new Set(validTiers as Array<'Core' | 'Secondary' | 'Tertiary'>);
    }
  }
  
  const ownership = params.get('ownership');
  if (ownership) {
    const validOwnership = ownership.split(',').filter(status => 
      ['Owned', 'Accessible', 'Shared', 'Locked'].includes(status)
    );
    if (validOwnership.length > 0) {
      characterFilters.ownershipStatus = new Set(validOwnership as Array<'Owned' | 'Accessible' | 'Shared' | 'Locked'>);
    }
  }
  
  const charType = params.get('charType');
  if (charType && ['all', 'Player', 'NPC'].includes(charType)) {
    characterFilters.characterType = charType as CharacterFilters['characterType'];
  }
  
  const character = params.get('character');
  if (character) {
    characterFilters.selectedCharacterId = character;
  }
  
  const shared = params.get('shared');
  if (shared === 'true') {
    characterFilters.highlightShared = true;
  }
  
  if (Object.keys(characterFilters).length > 0) {
    state.characterFilters = characterFilters as CharacterFilters;
  }
  
  // Content filters
  const contentFilters: Partial<ContentFilters> = {};
  
  const content = params.get('content');
  if (content) {
    const validStatus = content.split(',').filter(status => 
      ['draft', 'review', 'approved', 'published'].includes(status)
    );
    if (validStatus.length > 0) {
      contentFilters.contentStatus = new Set(validStatus as Array<'draft' | 'review' | 'approved' | 'published'>);
    }
  }
  
  const issues = params.get('issues');
  if (issues === 'true') {
    contentFilters.hasIssues = true;
  } else if (issues === 'false') {
    contentFilters.hasIssues = false;
  }
  
  const edited = params.get('edited');
  if (edited && ['today', 'week', 'month', 'all'].includes(edited)) {
    contentFilters.lastEditedRange = edited as ContentFilters['lastEditedRange'];
  }
  
  if (Object.keys(contentFilters).length > 0) {
    state.contentFilters = contentFilters as ContentFilters;
  }
  
  // Node connections filters
  const nodeType = params.get('nodeType');
  if (nodeType && ['character', 'puzzle', 'element', 'timeline'].includes(nodeType)) {
    const nodeConnectionsFilters: NodeConnectionsFilters = {
      nodeType: nodeType as NodeConnectionsFilters['nodeType']
    };
    state.nodeConnectionsFilters = nodeConnectionsFilters;
  }
  
  // Node selection (separate from nodeConnectionsFilters)
  const selectedNodeId = params.get('selectedNodeId');
  if (selectedNodeId) {
    state.selectedNodeId = selectedNodeId;
  }
  
  const focusedNodeId = params.get('focusedNodeId');
  if (focusedNodeId) {
    state.focusedNodeId = focusedNodeId;
  }
  
  return state;
}

/**
 * Generate a URL path with filters as search parameters
 */
export function buildUrlWithFilters(basePath: string, state: FilterState): string {
  const params = filterStateToUrl(state);
  const queryString = params.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}

/**
 * Parse current URL and extract filter state
 */
export function parseUrlFilters(url: string = window.location.href): Partial<FilterState> {
  try {
    const urlObj = new URL(url);
    return urlToFilterState(urlObj.searchParams);
  } catch (error) {
    console.warn('Failed to parse URL filters:', error);
    return {};
  }
}

/**
 * Update browser URL with current filter state
 */
export function updateBrowserUrl(state: FilterState, replace: boolean = false): void {
  const params = filterStateToUrl(state);
  const queryString = params.toString();
  const newUrl = queryString 
    ? `${window.location.pathname}?${queryString}`
    : window.location.pathname;
  
  if (replace) {
    window.history.replaceState({}, '', newUrl);
  } else {
    window.history.pushState({}, '', newUrl);
  }
}

/**
 * Create a shareable URL for current filter state
 */
export function createShareableUrl(state: FilterState, basePath?: string): string {
  const path = basePath || window.location.pathname;
  return buildUrlWithFilters(path, state);
}

// Helper functions

/**
 * Validate view type against known view types
 */
function isValidViewType(view: string): boolean {
  return ['puzzle-focus', 'character-journey', 'content-status', 'node-connections', 'timeline', 'full-network'].includes(view);
}


/**
 * URL State Debugging Utilities
 */
export const urlStateDebug = {
  /**
   * Log current URL state parsing
   */
  logCurrentState(): void {
    console.group('URL State Debug');
    console.log('Current URL:', window.location.href);
    console.log('Parsed filters:', parseUrlFilters());
    console.groupEnd();
  },
  
  /**
   * Test URL encoding/decoding round trip
   */
  testRoundTrip(state: FilterState): boolean {
    const params = filterStateToUrl(state);
    const reconstructed = urlToFilterState(params);
    console.log('Original:', state);
    console.log('URL Params:', params.toString());
    console.log('Reconstructed:', reconstructed);
    return JSON.stringify(state) === JSON.stringify(reconstructed);
  }
};