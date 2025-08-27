/**
 * EntityCreationModal - Centralized modal for entity creation
 * 
 * Provides a consistent modal interface for creating any entity type,
 * replacing inline creation and preventing nested state issues.
 */

import { useEffect, useCallback } from 'react';
import { CreatePanel } from './CreatePanel';

interface EntityCreationModalProps {
  entityType: 'character' | 'element' | 'puzzle' | 'timeline' | null;
  onClose: () => void;
  onSuccess?: (entity: any) => void;
}

export function EntityCreationModal({ entityType, onClose, onSuccess }: EntityCreationModalProps) {
  // Early return if no entity type
  if (!entityType) return null;

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Handle backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    // Only close if clicking directly on backdrop
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-in fade-in duration-200"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />
      
      {/* Modal Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto animate-in zoom-in-95 slide-in-from-bottom-2 duration-200">
          <CreatePanel
            entityType={entityType}
            onClose={onClose}
            onSuccess={(entity) => {
              onSuccess?.(entity);
              onClose();
            }}
          />
        </div>
      </div>
    </>
  );
}