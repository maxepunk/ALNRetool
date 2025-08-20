/**
 * Sidebar Component (Refactored)
 * Main sidebar container that composes all sidebar sub-components
 * Manages collapse/expand state and routes to appropriate filters
 */

import { useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '@/stores/uiStore';
import { useFilterStore } from '@/stores/filterStore';

// Import all sub-components
import { SidebarNavigation } from '../sidebar/SidebarNavigation';
import { SidebarSearch } from '../sidebar/SidebarSearch';
import { PuzzleFilters } from '../sidebar/PuzzleFilters';
import { CharacterFilters } from '../sidebar/CharacterFilters';
import { ContentFilters } from '../sidebar/ContentFilters';
import { ActiveFiltersSummary } from '../sidebar/ActiveFiltersSummary';
import { ThemeToggle } from '../sidebar/ThemeToggle';

export default function Sidebar() {
  const location = useLocation();
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);  const setActiveView = useFilterStore((state) => state.setActiveView);

  // Local state for expanded sections
  const [expandedSections, setExpandedSections] = useState({
    puzzle: false,
    character: false,
    content: false,
  });

  // Update active view based on route
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('puzzles')) {
      setActiveView('puzzle-focus');
    } else if (path.includes('character-journey')) {
      setActiveView('character-journey');
    } else if (path.includes('status')) {
      setActiveView('content-status');
    } else {
      setActiveView('puzzle-focus'); // Default to puzzle-focus view
    }
  }, [location.pathname, setActiveView]);

  const handleToggleSidebar = useCallback(() => {
    toggleSidebar();
  }, [toggleSidebar]);

  const handleToggleSection = useCallback((section: 'puzzle' | 'character' | 'content') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);  // Determine which filters to show based on current route
  const showPuzzleFilters = location.pathname.includes('puzzles');
  const showCharacterFilters = location.pathname.includes('character-journey');
  const showContentFilters = location.pathname.includes('status');

  const isOpen = !sidebarCollapsed; // Invert the logic for easier use

  return (
    <motion.div
      initial={false}
      animate={{ width: isOpen ? 256 : 64 }}
      transition={{ 
        type: "spring",
        stiffness: 300,
        damping: 30
      }}
      className={cn(
        "relative flex flex-col",
        "bg-background/95 backdrop-blur-sm",
        "border-r border-border/40",
        "shadow-xl shadow-black/5",
        "overflow-hidden"
      )}
      role="complementary"
      aria-label="Application sidebar"
    >
      {/* Toggle Button - Desktop Only */}
      <Button
        size="icon"
        variant="ghost"
        onClick={handleToggleSidebar}
        className={cn(
          "absolute -right-3 top-6 z-50 h-6 w-6 rounded-full",
          "border border-border/50 bg-background shadow-md",
          "hover:bg-accent hover:text-accent-foreground",
          "transition-all duration-200",
          "hidden md:flex" // Hide on mobile
        )}
        aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
        aria-expanded={isOpen}
      >
        <motion.div
          animate={{ rotate: isOpen ? 0 : 180 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronLeft className="h-3 w-3" />
        </motion.div>
      </Button>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="flex flex-col h-full">
          {/* Logo/Brand */}
          <motion.div 
            className={cn(
              "px-3 py-4 border-b border-border/40",
              "bg-gradient-to-b from-background to-transparent"
            )}
            animate={{ 
              justifyContent: isOpen ? "flex-start" : "center",
              textAlign: isOpen ? "left" : "center" 
            }}
            transition={{ duration: 0.2 }}
          >
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.h2
                  key="full"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="font-bold text-xl bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent"
                >
                  ALNRetool
                </motion.h2>
              ) : (
                <motion.h2
                  key="mini"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                  className="font-bold text-sm text-primary"
                >
                  ALN
                </motion.h2>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Universal Search */}
          <motion.div
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <SidebarSearch isOpen={isOpen} />
          </motion.div>
          
          <Separator className="my-2 opacity-50" />

          {/* Main Navigation */}
          <motion.div 
            className="px-3 py-2"
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            <SidebarNavigation isOpen={isOpen} />
          </motion.div>
          
          <Separator className="my-2 opacity-50" />          {/* View-specific Filters */}
          <motion.div 
            className="px-3 py-2 space-y-2"
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <AnimatePresence mode="wait">
              {showPuzzleFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <PuzzleFilters
                    isOpen={isOpen}
                    isExpanded={expandedSections.puzzle}
                    onToggleExpanded={() => handleToggleSection('puzzle')}
                  />
                </motion.div>
              )}
              
              {showCharacterFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <CharacterFilters
                    isOpen={isOpen}
                    isExpanded={expandedSections.character}
                    onToggleExpanded={() => handleToggleSection('character')}
                  />
                </motion.div>
              )}
              
              {showContentFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ContentFilters
                    isOpen={isOpen}
                    isExpanded={expandedSections.content}
                    onToggleExpanded={() => handleToggleSection('content')}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Active Filters Summary */}
          <motion.div
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
          >
            <ActiveFiltersSummary isOpen={isOpen} />
          </motion.div>
        </div>
      </div>

      {/* Theme Toggle - Always at bottom */}
      <motion.div 
        className={cn(
          "border-t border-border/40",
          "bg-gradient-to-t from-background to-transparent"
        )}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <ThemeToggle isOpen={isOpen} />
      </motion.div>
    </motion.div>
  );
}