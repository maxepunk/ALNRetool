/**
 * Centralized z-index configuration
 * 
 * Provides a single source of truth for all z-index values in the application.
 * This prevents layering conflicts and makes it easy to understand the stacking context.
 * 
 * @module config/zIndex
 */

/**
 * Z-index values for different UI layers.
 * Higher values appear on top of lower values.
 * 
 * Layering order (bottom to top):
 * 1. Base content (0-999)
 * 2. Panels and sidebars (1000-1999)
 * 3. Modal overlays (2000-2999)
 * 4. Floating UI elements (3000-3999)
 * 5. Critical notifications (4000-4999)
 * 6. Dev tools (5000+)
 */
export const zIndex = {
  // Base layer
  graphCanvas: 1,
  graphNodes: 10,
  graphEdges: 5,
  
  // Panels
  filterPanel: 1000,
  detailPanel: 1100,
  
  // Modals and overlays
  modalBackdrop: 2000,
  createPanel: 2100,
  confirmDialog: 2200,
  
  // Floating UI
  fab: 3000,
  fabDropdown: 3100,
  tooltip: 3200,
  contextMenu: 3300,
  
  // Notifications
  toast: 4000,
  alert: 4100,
  
  // Dev tools (highest)
  debugPanel: 5000,
} as const;

export type ZIndexKey = keyof typeof zIndex;