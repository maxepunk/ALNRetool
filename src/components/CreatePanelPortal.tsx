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
import { useEffect } from 'react';
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
    parentContext
  } = useCreationStore();

  // Handle ESC key to close panel
  useEffect(() => {
    if (!isCreating) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeCreatePanel();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isCreating, closeCreatePanel]);

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
              onSuccess={(entity) => {
                // Only select node for standalone creation
                // Skip selection if created from relation field to prevent isolation
                if (parentContext?.sourceComponent !== 'relation-field') {
                  useFilterStore.getState().setSelectedNode(entity.id);
                }
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}