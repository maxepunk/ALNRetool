/**
 * Entity Creation Store
 * 
 * Global state management for entity creation using Zustand.
 * Provides a single source of truth for creation state and eliminates prop drilling.
 * Supports creation from multiple sources (FAB, relation fields, menus, shortcuts).
 * 
 * @module stores/creationStore
 */

import { create } from 'zustand';

/**
 * Context about where the entity creation was triggered from.
 * Used to handle post-creation actions like updating relationships.
 */
export interface ParentContext {
  /** Component that triggered the creation */
  sourceComponent: 'fab' | 'relation-field' | 'menu' | 'keyboard-shortcut';
  /** For relation fields: the field key (e.g., 'prerequisites', 'rewards') */
  relationFieldKey?: string;
  /** For relation fields: the parent entity being edited */
  parentEntityId?: string;
  /** For relation fields: the parent entity type */
  parentEntityType?: 'character' | 'element' | 'puzzle' | 'timeline';
}

/**
 * Entity creation store interface.
 * Manages global state for the CreatePanel and creation flow.
 */
interface CreationStore {
  // State
  /** Whether the create panel is currently open */
  isCreating: boolean;
  /** Type of entity being created */
  entityType: 'character' | 'element' | 'puzzle' | 'timeline' | null;
  /** Context about where creation was triggered */
  parentContext: ParentContext | null;
  
  // Actions
  /** Open the create panel for a specific entity type */
  openCreatePanel: (
    type: 'character' | 'element' | 'puzzle' | 'timeline',
    context?: ParentContext
  ) => void;
  
  /** Close the create panel and reset state */
  closeCreatePanel: () => void;
  
  /** Get data needed to update parent relationship after creation */
  getRelationshipUpdateData: () => {
    shouldUpdateRelation: boolean;
    fieldKey?: string;
    parentId?: string;
    parentType?: 'character' | 'element' | 'puzzle' | 'timeline';
  };
  
  /** Helper to determine if FAB should be hidden */
  shouldHideFAB: () => boolean;
}

/**
 * Global entity creation store.
 * Use this to trigger entity creation from anywhere in the app.
 * 
 * @example
 * ```tsx
 * const { openCreatePanel } = useCreationStore();
 * openCreatePanel('character', { sourceComponent: 'fab' });
 * ```
 */
export const useCreationStore = create<CreationStore>((set, get) => ({
  // Initial state
  isCreating: false,
  entityType: null,
  parentContext: null,

  // Open the create panel
  openCreatePanel: (type, context) => {
    set({
      isCreating: true,
      entityType: type,
      parentContext: context
    });
  },

  // Close the create panel
  closeCreatePanel: () => {
    set({
      isCreating: false,
      entityType: null,
      parentContext: null
    });
  },

  // Get relationship update data
  getRelationshipUpdateData: () => {
    const { parentContext } = get();
    return {
      shouldUpdateRelation: parentContext?.sourceComponent === 'relation-field',
      fieldKey: parentContext?.relationFieldKey,
      parentId: parentContext?.parentEntityId,
      parentType: parentContext?.parentEntityType
    };
  },

  // Check if FAB should be hidden
  shouldHideFAB: () => {
    const { isCreating } = get();
    // Hide FAB when create panel is open
    return isCreating;
  }
}));