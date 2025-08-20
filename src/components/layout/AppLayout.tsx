/**
 * Main application layout component
 * Provides navigation, header, footer, and content area with collapsible panels
 * for maximum viewport space for visualization
 */

import { useState, useEffect, useRef } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { useLastSyncTime } from '@/hooks/useLastSyncTime'
import Breadcrumbs from '@/components/common/Breadcrumbs'
import ConnectionStatus from '@/components/common/ConnectionStatus'
import ErrorBoundary from '@/components/common/ErrorBoundary'
import { 
  Menu, 
  X, 
  ChevronLeft, 
  ChevronRight,
  PanelLeft,
  Puzzle,
  Users,
  BarChart3,
  Settings,
  Sun,
  Moon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export default function AppLayout() {
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true)
  const [headerMinimized, setHeaderMinimized] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isNavigationPending] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })
  
  const location = useLocation()
  const isOnline = useOnlineStatus()
  const lastSyncTime = useLastSyncTime()
  const headerRef = useRef<HTMLElement>(null)
  const lastScrollY = useRef(0)

  // Handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia('(max-width: 768px)').matches)
      
      // Close sidebar on mobile
      if (window.matchMedia('(max-width: 768px)').matches) {
        setLeftSidebarOpen(false)
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Handle header minimization on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      if (currentScrollY > 60 && currentScrollY > lastScrollY.current) {
        setHeaderMinimized(true)
      } else if (currentScrollY < lastScrollY.current - 20 || currentScrollY < 60) {
        setHeaderMinimized(false)
      }
      
      lastScrollY.current = currentScrollY
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Apply dark mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  // Close mobile menu on navigation
  useEffect(() => {
    if (isMobile) {
      setLeftSidebarOpen(false)
    }
  }, [location, isMobile])

  const navItems = [
    { path: '/puzzles', label: 'Puzzles', icon: Puzzle, testId: 'puzzle-icon' },
    { path: '/character-journey', label: 'Characters', icon: Users, testId: 'character-icon' },
    { path: '/status', label: 'Status', icon: BarChart3, testId: 'status-icon' },
  ]

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Skip Navigation Link for Accessibility */}      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-background p-2 rounded-md">
        Skip to content
      </a>

      {/* Header */}
      <header 
        ref={headerRef}
        role="banner" 
        className={`sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur transition-all duration-300 ${
          headerMinimized ? 'h-12' : 'h-16'
        }`}
      >
        <div className="flex items-center justify-between h-full px-4">
          <div className="flex items-center gap-2">
            {/* Mobile menu toggle */}
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
                aria-label={leftSidebarOpen ? "Close menu" : "Open menu"}
                aria-expanded={leftSidebarOpen}
              >
                {leftSidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </Button>
            )}
            
            <h1 className={`font-bold transition-all duration-300 ${
              headerMinimized ? 'text-lg' : 'text-xl'
            }`}>              ALNRetool
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Connection status */}
            <ConnectionStatus 
              isOnline={isOnline} 
              lastSyncTime={lastSyncTime}
            />
            
            {/* Dark mode toggle */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleDarkMode}
                    aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
                  >
                    {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>          </div>
        </div>
        
        {/* Breadcrumbs - only visible when header is not minimized */}
        <div className={`px-4 transition-all duration-300 overflow-hidden ${
          headerMinimized ? 'h-0 opacity-0' : 'h-8 opacity-100'
        }`}>
          <Breadcrumbs />
        </div>
      </header>

      {/* Loading indicator */}
      {isNavigationPending && (
        <div 
          className="h-1 bg-primary/80 animate-pulse" 
          data-testid="navigation-loading"
        />
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside 
          className={`fixed md:relative inset-y-0 left-0 z-30 border-r border-border bg-background transition-all duration-300 ease-in-out ${
            leftSidebarOpen ? 'w-64 translate-x-0' : 'w-16 md:w-16 -translate-x-full md:translate-x-0'
          } ${isMobile ? 'shadow-lg' : ''}`}
        >
          {/* Navigation */}
          <nav className="h-full flex flex-col">
            <div className="p-4">              <div className="mb-6">
                {leftSidebarOpen && (
                  <h2 className="text-sm font-semibold text-muted-foreground mb-2">NAVIGATION</h2>
                )}
                <ul className="space-y-1">
                  {navItems.map(({ path, label, icon: Icon, testId }) => (
                    <li key={path}>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <NavLink
                              to={path}
                              className={({ isActive }) =>
                                `flex items-center ${leftSidebarOpen ? 'gap-3' : 'justify-center'} px-3 py-2 rounded-md transition-colors ${
                                  isActive 
                                    ? 'bg-primary/10 text-primary font-medium active' 
                                    : 'text-foreground/80 hover:bg-accent hover:text-accent-foreground'
                                }`
                              }
                            >
                              <Icon size={18} data-testid={testId} />
                              {leftSidebarOpen && <span>{label}</span>}
                            </NavLink>
                          </TooltipTrigger>
                          {!leftSidebarOpen && (
                            <TooltipContent side="right">
                              {label}
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </li>
                  ))}
                </ul>
              </div>
              
              <Separator className="my-4" />
              
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground mb-2">FILTERS</h2>
                {/* Filter content would go here */}
                <div className="py-2 text-sm text-muted-foreground">                  Filter controls would be placed here
                </div>
              </div>
            </div>
            
            <div className="mt-auto p-4 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {}}
              >
                <Settings size={16} className="mr-2" />
                Settings
              </Button>
            </div>
          </nav>
          
          {/* Toggle button for desktop - always at the bottom */}
          {!isMobile && (
            <div className="absolute bottom-4 left-0 right-0">
              <div className={`flex ${leftSidebarOpen ? 'justify-end pr-2' : 'justify-center'}`}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:flex"
                  onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
                  aria-label={leftSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                >
                  {leftSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                </Button>
              </div>
            </div>
          )}
        </aside>
        {/* Mobile overlay */}
        {isMobile && leftSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-20"
            onClick={() => setLeftSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Main Content Area */}
        <main 
          id="main-content" 
          role="main" 
          data-testid="main-content"
          className="flex-1 overflow-auto relative"
        >
          {/* Toggle left sidebar button */}          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-4 md:hidden"
            onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
          >
            <PanelLeft size={16} />
          </Button>
          
          <ErrorBoundary>
            <div className="h-full">
              <Outlet />
            </div>
          </ErrorBoundary>
        </main>
      </div>

      {/* Footer */}
      <footer role="contentinfo" className="border-t border-border py-2 px-4 text-sm text-muted-foreground">
        <div className="flex justify-between items-center">
          <p>© 2024 ALNRetool - About Last Night Visualization Tool</p>
          <p>
            Last synced: <time data-testid="last-sync-time">{lastSyncTime}</time>
          </p>
        </div>
      </footer>
    </div>
  )
}