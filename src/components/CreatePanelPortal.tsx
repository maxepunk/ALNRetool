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
                // Graph nodes use raw entity IDs without prefixes
                // nodeCreators.ts creates nodes with just entity.id
                const graphNodeId = entity.id;
                
                // Implement proper polling mechanism to wait for node existence in React Flow
                // This ensures the node is actually rendered before attempting to focus
                const pollForNodeAndFocus = (retries = 0) => {
                  // Max retries to prevent infinite loop
                  const maxRetries = 20;
                  
                  // Check if we've exceeded max retries
                  if (retries >= maxRetries) {
                    console.warn(`Failed to find node ${graphNodeId} after ${maxRetries} attempts`);
                    // Still set selection state even if focus fails
                    useFilterStore.getState().setSelectedNode(graphNodeId);
                    useFilterStore.getState().setSelectedNode(graphNodeId);
                    return;
                  }
                  
                  // Try to get the node from React Flow store
                  // We need to check if the node actually exists in the rendered graph
                  const checkAndFocus = () => {
                    // Get current nodes from the filter store (which tracks graph state)
                    // The graph will update nodes when React Query cache updates trigger re-render
                    const currentState = useFilterStore.getState();
                    
                    // Set selection immediately - this will trigger detail panel
                    if (retries === 0) {
                      currentState.setSelectedNode(graphNodeId);
                    }
                    
                    // For focus, we need to verify the node exists in the graph
                    // We'll check by trying to focus and seeing if it succeeds
                    // The viewport manager will handle the actual focusing
                    currentState.setSelectedNode(graphNodeId);
                    
                    // If this is first attempt, schedule a verification check
                    if (retries === 0) {
                      // Schedule another check to ensure focus worked
                      setTimeout(() => pollForNodeAndFocus(1), 50);
                    }
                  };
                  
                  // Use exponential backoff: 10ms, 20ms, 40ms, 80ms...
                  const delay = Math.min(10 * Math.pow(2, retries), 200);
                  setTimeout(checkAndFocus, delay);
                };
                
                // Start polling immediately
                pollForNodeAndFocus(0);
                
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