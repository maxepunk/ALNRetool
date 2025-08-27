/**
 * CreatePanelPortal Component
 * 
 * Renders the CreatePanel as a modal overlay using React Portal.
 * Single instance at app root level, controlled by global creationStore.
 * Provides smooth animations and backdrop click handling.
 * 
 * @module components/CreatePanelPortal
 */

import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useCreationStore } from '@/stores/creationStore';
import { CreatePanel } from '@/components/CreatePanel';
import { zIndex } from '@/config/zIndex';
import { useFilterStore } from '@/stores/filterStore';

/**
 * Portal wrapper for CreatePanel.
 * Renders at document.body level to ensure it appears above all content.
 * 
 * Features:
 * - Animated entrance/exit
 * - Backdrop click to close
 * - Relationship update handling for relation-field triggers
 * - Single instance ensures consistent UX
 */
export function CreatePanelPortal() {
  const { 
    isCreating, 
    entityType, 
    closeCreatePanel, 
    parentContext,
    getRelationshipUpdateData 
  } = useCreationStore();

  // Don't render if not creating
  if (!isCreating || !entityType) return null;

  return createPortal(
    <AnimatePresence mode="wait">
      {isCreating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 flex items-center justify-center"
          style={{ zIndex: zIndex.modalBackdrop }}
        >
          {/* Semi-transparent backdrop - clicking closes panel */}
          <motion.div 
            className="absolute inset-0 bg-black cursor-pointer"
            onClick={closeCreatePanel}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            aria-label="Close create panel"
          />
          
          {/* CreatePanel with spring animation */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ 
              type: 'spring', 
              damping: 25, 
              stiffness: 300,
              duration: 0.2 
            }}
            className="relative" // Ensure panel is above backdrop
          >
            <CreatePanel
              entityType={entityType}
              parentContext={parentContext}
              onClose={closeCreatePanel}
              onSuccess={async (entity) => {
                // Determine the correct node ID format for the graph
                // Graph nodes use composite IDs like 'character-${id}', 'element-${id}', etc.
                const nodeIdPrefix = entityType === 'timeline' ? 'timelineEvent' : entityType.slice(0, -1); // Remove 's' from plural
                const graphNodeId = `${nodeIdPrefix}-${entity.id}`;
                
                // Add a small delay to ensure the graph has updated with the new node
                // This avoids race conditions where selection happens before node exists
                setTimeout(() => {
                  // Auto-select the newly created entity in the graph
                  // This will highlight it and open the detail panel
                  useFilterStore.getState().setSelectedNode(graphNodeId);
                  
                  // Also set as focused node to show connections
                  useFilterStore.getState().setFocusedNode(graphNodeId);
                }, 100);
                
                // Check if we need to update a parent relationship
                const { shouldUpdateRelation, fieldKey, parentId, parentType } = getRelationshipUpdateData();
                
                if (shouldUpdateRelation && fieldKey && parentId && parentType) {
                  
                  // Note: The actual relationship update will be handled by CreatePanel
                  // which will call the appropriate mutation based on parent context
                }
                
                // Close panel after successful creation
                // CreatePanel's onSuccess will handle the relationship update
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}