/**
 * View Initializer
 * 
 * Centralized initialization of all application views.
 * This ensures ViewRegistry is populated before React renders,
 * preventing 404 errors due to timing race conditions.
 * 
 * CRITICAL: This must be called BEFORE React renders to ensure
 * routes are available when AppRouter generates them.
 */

import { viewRegistry } from '@/contexts/ViewContext';
import { registerCommonViews } from '@/components/generated/RouteGenerator';

let isInitialized = false;

/**
 * Initialize all application views synchronously
 * This should be called at the application entry point before React renders
 */
export function initializeAppViews(): void {
  if (isInitialized) {
    return;
  }
  
  // Clear any existing registrations to ensure clean state
  viewRegistry.clear();
  
  // Register all common views (PuzzleFocus, CharacterJourney, etc.)
  registerCommonViews();
  
  // Mark as initialized to prevent duplicate registrations
  isInitialized = true;
  
  console.log('✅ Views initialized:', viewRegistry.getAll().map(v => v.id));
}

/**
 * Reset initialization state (useful for tests)
 */
export function resetViewInitialization(): void {
  isInitialized = false;
  viewRegistry.clear();
}