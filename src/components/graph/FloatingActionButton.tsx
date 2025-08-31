import { useState, useEffect, useRef } from 'react';
import { Plus, User, Package, Puzzle, Calendar, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCreationStore } from '@/stores/creationStore';
import { zIndex } from '@/config/zIndex';

interface FloatingActionButtonProps {
  hidden?: boolean;
}

export function FloatingActionButton({ hidden }: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { openCreatePanel } = useCreationStore();
  
  // Close menu when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleMenuItemClick = (type: 'character' | 'element' | 'puzzle' | 'timeline') => {
    openCreatePanel(type, { sourceComponent: 'fab' });
    setIsOpen(false);
  };

  if (hidden) return null;

  return (
    <div 
      ref={menuRef}
      className="fixed top-20 right-6" 
      style={{ zIndex: zIndex.fab }}
    >
      {/* Main FAB button */}
      <Button 
        size="lg" 
        className="rounded-full h-14 w-14 shadow-lg"
        aria-label="Create new entity"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </Button>
      
      {/* Menu items - simple inline rendering */}
      {isOpen && (
        <div 
          className="absolute top-16 right-0 w-48 bg-popover border rounded-md shadow-lg p-1"
          style={{ zIndex: zIndex.fabDropdown }}
        >
          <button
            className="w-full flex items-center px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors"
            onClick={() => handleMenuItemClick('character')}
          >
            <User className="mr-2 h-4 w-4" />
            <span>New Character</span>
          </button>
          
          <button
            className="w-full flex items-center px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors"
            onClick={() => handleMenuItemClick('element')}
          >
            <Package className="mr-2 h-4 w-4" />
            <span>New Element</span>
          </button>
          
          <button
            className="w-full flex items-center px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors"
            onClick={() => handleMenuItemClick('puzzle')}
          >
            <Puzzle className="mr-2 h-4 w-4" />
            <span>New Puzzle</span>
          </button>
          
          <button
            className="w-full flex items-center px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors"
            onClick={() => handleMenuItemClick('timeline')}
          >
            <Calendar className="mr-2 h-4 w-4" />
            <span>New Timeline Event</span>
          </button>
        </div>
      )}
    </div>
  );
}