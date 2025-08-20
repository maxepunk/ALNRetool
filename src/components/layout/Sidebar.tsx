/**
 * Sidebar component
 * Central hub for navigation and unified filter controls
 * Connects to Zustand stores for state management
 */

import { NavLink, useLocation } from 'react-router-dom'
import { 
  ChevronLeft, 
  ChevronRight,
  ChevronDown,
  Puzzle,
  Users,
  BarChart3,
  Settings,
  Home,
  Search,
  X,
  SlidersHorizontal,
  CheckCircle2,
  CircleOff,
  Check,
  Filter
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { motion, AnimatePresence } from 'framer-motion'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { useEffect, useMemo } from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

// Import Zustand stores
import { useFilterStore } from '@/stores/filterStore'
import { useUIStore } from '@/stores/uiStore'

// Import data hooks for entity lists
import { usePuzzles } from '@/hooks/usePuzzles'
import { useCharacters } from '@/hooks/useCharacters'

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
  isMobile: boolean
}

const navItems = [
  { path: '/', label: 'Home', icon: Home, testId: 'home-icon' },
  { path: '/puzzles', label: 'Puzzles', icon: Puzzle, testId: 'puzzle-icon' },
  { path: '/character-journey', label: 'Characters', icon: Users, testId: 'character-icon' },
  { path: '/status', label: 'Status', icon: BarChart3, testId: 'status-icon' },
];

export default function Sidebar({ isOpen, onToggle, isMobile }: SidebarProps) {
  const location = useLocation()
  const currentPath = location.pathname
  
  // Get data for selectors
  const { data: puzzles = [] } = usePuzzles()
  const { data: characters = [] } = useCharacters()
  
  // Filter store hooks
  const searchTerm = useFilterStore(state => state.searchTerm)
  const setSearchTerm = useFilterStore(state => state.setSearchTerm)
  const clearSearch = useFilterStore(state => state.clearSearch)
  
  const puzzleFilters = useFilterStore(state => state.puzzleFilters)
  const toggleAct = useFilterStore(state => state.toggleAct)
  const selectPuzzle = useFilterStore(state => state.selectPuzzle)
  const setCompletionStatus = useFilterStore(state => state.setCompletionStatus)
  
  const characterFilters = useFilterStore(state => state.characterFilters)
  const toggleTier = useFilterStore(state => state.toggleTier)
  const toggleOwnership = useFilterStore(state => state.toggleOwnership)
  const setCharacterType = useFilterStore(state => state.setCharacterType)
  const selectCharacter = useFilterStore(state => state.selectCharacter)
  
  const contentFilters = useFilterStore(state => state.contentFilters)
  const toggleContentStatus = useFilterStore(state => state.toggleContentStatus)
  const setHasIssues = useFilterStore(state => state.setHasIssues)
  const setLastEditedRange = useFilterStore(state => state.setLastEditedRange)
  
  const clearAllFilters = useFilterStore(state => state.clearAllFilters)
  const hasActiveFilters = useFilterStore(state => state.hasActiveFilters())
  const activeFilterCount = useFilterStore(state => state.activeFilterCount())
  
  // UI store hooks for filter sections
  const filterSectionsExpanded = useUIStore(state => state.filterSectionsExpanded)
  const toggleFilterSection = useUIStore(state => state.toggleFilterSection)
  
  // Determine which view we're in
  const currentView = useMemo(() => {
    if (currentPath.startsWith('/puzzles')) return 'puzzle-focus'
    if (currentPath.startsWith('/character-journey')) return 'character-journey'
    if (currentPath.startsWith('/status')) return 'content-status'
    return null
  }, [currentPath])
  
  // Update active view in filter store
  useEffect(() => {
    useFilterStore.getState().setActiveView(currentView);
  }, [currentView]);
  
  return (
    <TooltipProvider>
      <motion.aside
        initial={{ width: isOpen ? (isMobile ? '100%' : '320px') : '64px' }}
        animate={{ width: isOpen ? (isMobile ? '100%' : '320px') : '64px' }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={cn(
          "relative h-full flex flex-col",
          "bg-background/80 dark:bg-background/90",
          "backdrop-blur-md",
          "border-r border-border/40 dark:border-border/30",
          "shadow-[0_0.5rem_2rem_rgba(0,0,0,0.08)] dark:shadow-[0_0.5rem_2rem_rgba(0,0,0,0.2)]"
        )}
      >
        {/* Toggle Button */}
        <Button
          onClick={onToggle}
          variant="ghost"
          size="icon"
          className={cn(
            "absolute -right-3 top-6 z-50",
            "h-6 w-6 rounded-full",
            "bg-background/95 dark:bg-background/85",
            "border border-border/50 dark:border-border/40",
            "shadow-sm hover:shadow-md",
            "transition-all duration-200"
          )}
        >
          {isOpen ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </Button>
        
        {/* Logo/Header */}
        <div className="p-4 flex items-center justify-between">
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.h2
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-lg font-semibold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent"
              >
                ALN Retool
              </motion.h2>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"
              >
                <span className="text-primary font-bold">A</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <Separator className="opacity-50" />
        
        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = item.path === '/' 
              ? currentPath === '/'
              : currentPath.startsWith(item.path)
            
            return (
              <Tooltip key={item.path} delayDuration={isOpen ? 1000 : 300}>
                <TooltipTrigger asChild>
                  <NavLink
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg",
                      "transition-all duration-200",
                      "hover:bg-accent/50",
                      isActive && "bg-primary/10 text-primary"
                    )}
                  >
                    <Icon 
                      className={cn(
                        "h-5 w-5 flex-shrink-0",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )} 
                      data-testid={item.testId}
                    />
                    {isOpen && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-sm font-medium"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </NavLink>
                </TooltipTrigger>
                <TooltipContent side="right" className={isOpen ? 'hidden' : ''}>
                  {item.label}
                </TooltipContent>
              </Tooltip>
            )
          })}
        </nav>
        
        <Separator className="opacity-50" />
        
        {/* Filters Section */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex-1 px-3 py-4 space-y-3 overflow-y-auto"
          >
            {/* Filter Header with Clear All */}
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Filters
              </h3>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="h-6 text-xs px-2"
                >
                  Clear All ({activeFilterCount})
                </Button>
              )}
            </div>
            
            {/* Universal Search */}
            <Collapsible
              open={filterSectionsExpanded.search}
              onOpenChange={() => toggleFilterSection('search')}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-accent/30 transition-colors">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Search className="h-3.5 w-3.5" />
                  Search
                  {searchTerm && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                      1
                    </Badge>
                  )}
                </span>
                <ChevronDown className={cn(
                  "h-4 w-4 transition-transform",
                  filterSectionsExpanded.search && "rotate-180"
                )} />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-8 h-9 text-sm"
                  />
                  {searchTerm && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={clearSearch}
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
            
            {/* Puzzle View Filters */}
            {currentView === 'puzzle-focus' && (
              <>
                {/* Act Filter */}
                <Collapsible
                  open={filterSectionsExpanded.acts}
                  onOpenChange={() => toggleFilterSection('acts')}
                >
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-accent/30 transition-colors">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <Filter className="h-3.5 w-3.5" />
                      Acts
                      {puzzleFilters.selectedActs.size > 0 && (
                        <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                          {puzzleFilters.selectedActs.size}
                        </Badge>
                      )}
                    </span>
                    <ChevronDown className={cn(
                      "h-4 w-4 transition-transform",
                      filterSectionsExpanded.acts && "rotate-180"
                    )} />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-2 space-y-1">
                      {['Act 0', 'Act 1', 'Act 2'].map(act => (
                        <Button
                          key={act}
                          variant={puzzleFilters.selectedActs.has(act) ? "secondary" : "ghost"}
                          size="sm"
                          onClick={() => toggleAct(act)}
                          className="w-full justify-between h-8 text-xs"
                        >
                          {act}
                          {puzzleFilters.selectedActs.has(act) && (
                            <Check className="h-3 w-3" />
                          )}
                        </Button>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
                
                {/* Puzzle Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Select Puzzle
                  </label>
                  <Select
                    value={puzzleFilters.selectedPuzzleId || 'all'}
                    onValueChange={(value) => selectPuzzle(value === 'all' ? null : value)}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="All Puzzles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Puzzles</SelectItem>
                      {puzzles.map((puzzle) => (
                        <SelectItem key={puzzle.id} value={puzzle.id}>
                          {puzzle.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Completion Status */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Completion Status
                  </label>
                  <div className="flex gap-1">
                    <Button
                      variant={puzzleFilters.completionStatus === 'all' ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setCompletionStatus('all')}
                      className="flex-1 h-8 text-xs"
                    >
                      All
                    </Button>
                    <Button
                      variant={puzzleFilters.completionStatus === 'completed' ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setCompletionStatus('completed')}
                      className="flex-1 h-8 text-xs"
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Done
                    </Button>
                    <Button
                      variant={puzzleFilters.completionStatus === 'incomplete' ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setCompletionStatus('incomplete')}
                      className="flex-1 h-8 text-xs"
                    >
                      <CircleOff className="h-3 w-3 mr-1" />
                      Todo
                    </Button>
                  </div>
                </div>
              </>
            )}
            
            {/* Character Journey Filters */}
            {currentView === 'character-journey' && (
              <>
                {/* Tier Filter */}
                <Collapsible
                  open={filterSectionsExpanded.characterJourney}
                  onOpenChange={() => toggleFilterSection('characterJourney')}
                >
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-accent/30 transition-colors">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <Users className="h-3.5 w-3.5" />
                      Character Filters
                      {(characterFilters.selectedTiers.size > 0 || 
                        characterFilters.ownershipStatus.size > 0 || 
                        characterFilters.characterType) && (
                        <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                          {characterFilters.selectedTiers.size + 
                           characterFilters.ownershipStatus.size + 
                           (characterFilters.characterType ? 1 : 0)}
                        </Badge>
                      )}
                    </span>
                    <ChevronDown className={cn(
                      "h-4 w-4 transition-transform",
                      filterSectionsExpanded.characterJourney && "rotate-180"
                    )} />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-2 space-y-3">
                      {/* Tier Selection */}
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Tiers</label>
                        <div className="grid grid-cols-2 gap-1">
                          {(['Core', 'Secondary', 'Tertiary'] as const).map(tier => (
                            <Button
                              key={tier}
                              variant={characterFilters.selectedTiers.has(tier) ? "secondary" : "ghost"}
                              size="sm"
                              onClick={() => toggleTier(tier)}
                              className="h-7 text-xs"
                            >
                              {tier}
                            </Button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Ownership Status */}
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Ownership</label>
                        <div className="space-y-1">
                          {(['Owned', 'Accessible', 'Shared', 'Locked'] as const).map(status => (
                            <Button
                              key={status}
                              variant={characterFilters.ownershipStatus.has(status) ? "secondary" : "ghost"}
                              size="sm"
                              onClick={() => toggleOwnership(status)}
                              className="w-full justify-start h-7 text-xs"
                            >
                              {status}
                            </Button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Character Type */}
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Type</label>
                        <Select
                          value={characterFilters.characterType || 'all'}
                          onValueChange={(value) => setCharacterType(value as 'all' | 'Player' | 'NPC')}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="All Types" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="Player">Player</SelectItem>
                            <SelectItem value="NPC">NPC</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
                
                {/* Character Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Select Character
                  </label>
                  <Select
                    value={characterFilters.selectedCharacterId || 'all'}
                    onValueChange={(value) => selectCharacter(value === 'all' ? null : value)}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="All Characters" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Characters</SelectItem>
                      {characters.map((char) => (
                        <SelectItem key={char.id} value={char.id}>
                          {char.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            
            {/* Content Status Filters */}
            {currentView === 'content-status' && (
              <>
                <Collapsible
                  open={filterSectionsExpanded.contentStatus}
                  onOpenChange={() => toggleFilterSection('contentStatus')}
                >
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-accent/30 transition-colors">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <BarChart3 className="h-3.5 w-3.5" />
                      Content Filters
                      {contentFilters.contentStatus.size > 0 && (
                        <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                          {contentFilters.contentStatus.size}
                        </Badge>
                      )}
                    </span>
                    <ChevronDown className={cn(
                      "h-4 w-4 transition-transform",
                      filterSectionsExpanded.contentStatus && "rotate-180"
                    )} />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-2 space-y-3">
                      {/* Status Types */}
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Status</label>
                        <div className="space-y-1">
                          {['draft', 'review', 'approved', 'published'].map(status => (
                            <Button
                              key={status}
                              variant={contentFilters.contentStatus.has(status as 'draft' | 'review' | 'approved' | 'published') ? "secondary" : "ghost"}
                              size="sm"
                              onClick={() => toggleContentStatus(status as 'draft' | 'review' | 'approved' | 'published')}
                              className="w-full justify-start h-7 text-xs"
                            >
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </Button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Has Issues Toggle */}
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-muted-foreground">Has Issues</label>
                        <Switch
                          checked={contentFilters.hasIssues || false}
                          onCheckedChange={setHasIssues}
                          className="scale-75"
                        />
                      </div>
                      
                      {/* Last Edited Range */}
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Last Edited</label>
                        <Select
                          value={contentFilters.lastEditedRange || 'all'}
                          onValueChange={(value) => setLastEditedRange(value as 'today' | 'week' | 'month' | 'all')}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Any time" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Any time</SelectItem>
                            <SelectItem value="today">Today</SelectItem>
                            <SelectItem value="week">This week</SelectItem>
                            <SelectItem value="month">This month</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </>
            )}
            
            {/* Active Filters Summary */}
            {hasActiveFilters && (
              <div className="mt-4 p-2 bg-accent/20 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium">Active Filters</span>
                  <Badge variant="secondary" className="h-4 px-1 text-xs">
                    {activeFilterCount}
                  </Badge>
                </div>
                <div className="space-y-1">
                  {searchTerm && (
                    <div className="text-xs text-muted-foreground truncate">
                      Search: &quot;{searchTerm}&quot;
                    </div>
                  )}
                  {puzzleFilters.selectedActs.size > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Acts: {Array.from(puzzleFilters.selectedActs).join(', ')}
                    </div>
                  )}
                  {characterFilters.selectedTiers.size > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Tiers: {Array.from(characterFilters.selectedTiers).join(', ')}
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
        
        {/* Settings/Footer */}
        <div className="p-3 border-t border-border/40">
          <Tooltip delayDuration={isOpen ? 1000 : 300}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "w-full",
                  isOpen ? "justify-start" : "justify-center"
                )}
              >
                <Settings className="h-4 w-4" />
                {isOpen && <span className="ml-2 text-sm">Settings</span>}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className={isOpen ? 'hidden' : ''}>
              Settings
            </TooltipContent>
          </Tooltip>
        </div>
      </motion.aside>
    </TooltipProvider>
  )
}