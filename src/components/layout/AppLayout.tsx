/**
 * Main application layout component
 * Provides navigation, header, footer, and content area with collapsible panels
 * for maximum viewport space for visualization
 */

import { useState, useEffect, useRef } from 'react'
import { Outlet, useLocation, Link } from 'react-router-dom'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { useLastSyncTime } from '@/hooks/useLastSyncTime'
import { useUIStore } from '@/stores/uiStore'
import URLBreadcrumbs from '@/components/navigation/URLBreadcrumbs'
import ConnectionStatus from '@/components/common/ConnectionStatus'
import ErrorBoundary from '@/components/common/ErrorBoundary'
import Sidebar from '@/components/layout/Sidebar'
import { HeaderSearch } from '@/components/layout/HeaderSearch'
import { 
  Menu, 
  X, 
  PanelLeft,
  Search,
  User
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

export default function AppLayout() {
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed)
  const toggleSidebar = useUIStore((state) => state.toggleSidebar)
  const leftSidebarOpen = !sidebarCollapsed
  const [headerMinimized, setHeaderMinimized] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  
  const location = useLocation()
  const isOnline = useOnlineStatus()
  const lastSyncTime = useLastSyncTime()
  const headerRef = useRef<HTMLElement>(null)
  const lastScrollY = useRef(0)
  const isInitialMount = useRef(true)
  const previousIsMobile = useRef<boolean | null>(null)

  // Handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      const isMobileView = window.matchMedia('(max-width: 768px)').matches
      setIsMobile(isMobileView)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  // Consolidated sidebar management to prevent race conditions
  useEffect(() => {
    // Handle initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false
      previousIsMobile.current = isMobile
      
      // Set initial sidebar state based on screen size
      if (isMobile && leftSidebarOpen) {
        toggleSidebar() // Close on mobile
      } else if (!isMobile && !leftSidebarOpen) {
        toggleSidebar() // Open on desktop
      }
      return
    }
    
    // Handle screen size transitions (resize across 768px breakpoint)
    if (previousIsMobile.current !== null && previousIsMobile.current !== isMobile) {
      // Only toggle when actually crossing the breakpoint
      if (isMobile && leftSidebarOpen) {
        toggleSidebar() // Close sidebar when becoming mobile
      } else if (!isMobile && !leftSidebarOpen) {
        toggleSidebar() // Open sidebar when becoming desktop
      }
    }
    
    previousIsMobile.current = isMobile
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile]) // Only depend on isMobile to avoid circular updates

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

  // Close mobile menu on navigation (only on mobile)
  useEffect(() => {
    // Only close on navigation if we're on mobile and sidebar is open
    // Skip on initial mount to avoid race conditions
    if (!isInitialMount.current && isMobile && leftSidebarOpen) {
      toggleSidebar()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]) // Only depend on location to avoid multiple triggers

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Skip Navigation Link for Accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-primary text-primary-foreground px-3 py-2 rounded-md shadow-lg"
      >
        Skip to content
      </a>

      {/* Header with Glass Morphism */}
      <motion.header 
        ref={headerRef}
        role="banner" 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={cn(
          "sticky top-0 z-40 border-b transition-all duration-300",
          "bg-background/80 backdrop-blur-xl backdrop-saturate-150",
          "border-border/40 shadow-sm",
          headerMinimized ? 'h-14' : 'h-auto'
        )}
      >
        <div className="flex items-center justify-between h-14 px-4 md:px-6">
          <div className="flex items-center gap-3">
            {/* Desktop sidebar toggle */}
            {!isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                aria-label={leftSidebarOpen ? "Close sidebar" : "Open sidebar"}
                aria-expanded={leftSidebarOpen}
                className="text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
              >
                <PanelLeft size={20} className={cn(
                  "transition-transform duration-200",
                  leftSidebarOpen && "rotate-180"
                )} />
              </Button>
            )}
            
            {/* Mobile menu toggle */}
            {isMobile && (
              <Button
                variant="ghost"
                size="touch-icon"
                onClick={toggleSidebar}
                aria-label={leftSidebarOpen ? "Close menu" : "Open menu"}
                aria-expanded={leftSidebarOpen}
                className="text-foreground hover:bg-accent/50 transition-colors"
              >
                <AnimatePresence>
                  {leftSidebarOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <X size={20} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="open"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Menu size={20} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            )}
            
            {/* Logo and Title */}
            <Link 
              to="/" 
              className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-md"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-md">
                <span className="text-primary-foreground font-bold text-sm">ALN</span>
              </div>
              <h1 className={cn(
                "font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent transition-all duration-300",
                headerMinimized ? 'text-lg hidden sm:block' : 'text-xl'
              )}>
                ALNRetool
              </h1>
            </Link>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            {/* Search - Desktop only */}
            {!isMobile && (
              <HeaderSearch className="max-w-xs hidden lg:block" />
            )}
            
            {/* Mobile Search Button */}
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileSearchOpen(true)}
                aria-label="Search"
                className="text-muted-foreground hover:text-foreground hover:bg-accent/50"
              >
                <Search size={18} />
              </Button>
            )}
            
            {/* Connection status */}
            <ConnectionStatus 
              isOnline={isOnline} 
              lastSyncTime={lastSyncTime}
            />
            
            
            {/* User profile */}
            <Button
              variant="ghost"
              size="icon"
              aria-label="User profile"
              title="User profile"
              className={cn(
                "relative rounded-full",
                "bg-gradient-to-br from-primary/20 to-primary/10",
                "hover:from-primary/30 hover:to-primary/20",
                "transition-all duration-200"
              )}
            >
              <User size={18} className="text-foreground" />
            </Button>
          </div>
        </div>
        
        {/* Breadcrumbs - animated visibility */}
        <AnimatePresence>
          {!headerMinimized && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="px-4 md:px-6 py-2 overflow-hidden border-t border-border/20"
            >
              <URLBreadcrumbs />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar with Animation Wrapper */}
        <AnimatePresence mode="wait">
          {leftSidebarOpen && (
            <>
              {/* Desktop Sidebar */}
              {!isMobile && (
                <motion.div
                  initial={{ x: -280, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -280, opacity: 0 }}
                  transition={{ 
                    type: "spring",
                    stiffness: 300,
                    damping: 30
                  }}
                  className="relative h-full"
                >
                  <Sidebar />
                </motion.div>
              )}
              
              {/* Mobile Sidebar */}
              {isMobile && (
                <motion.div
                  initial={{ x: -280 }}
                  animate={{ x: 0 }}
                  exit={{ x: -280 }}
                  transition={{ 
                    type: "spring",
                    stiffness: 300,
                    damping: 30
                  }}
                  className="fixed inset-y-0 left-0 z-30 h-full"
                >
                  <Sidebar />
                </motion.div>
              )}
            </>
          )}
        </AnimatePresence>

        {/* Mobile overlay with blur */}
        <AnimatePresence>
          {isMobile && leftSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-20"
              onClick={toggleSidebar}
              aria-hidden="true"
            />
          )}
        </AnimatePresence>

        {/* Mobile Search Overlay */}
        <AnimatePresence>
          {mobileSearchOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20"
              onClick={() => setMobileSearchOpen(false)}
            >
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-background border border-border rounded-lg shadow-xl mx-4 w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Search</h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setMobileSearchOpen(false)}
                      aria-label="Close search"
                    >
                      <X size={18} />
                    </Button>
                  </div>
                  <HeaderSearch isMobile />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <main 
          id="main-content" 
          role="main" 
          data-testid="main-content"
          className={cn(
            "flex-1 overflow-auto relative",
            "transition-all duration-300 ease-in-out"
          )}
        >
          
          <ErrorBoundary>
            <div className="h-full">
              <Outlet />
            </div>
          </ErrorBoundary>
        </main>
      </div>

      {/* Footer with Glass Morphism */}
      <footer 
        role="contentinfo" 
        className={cn(
          "border-t py-3 px-4 md:px-6 text-xs",
          "bg-background/80 backdrop-blur-xl backdrop-saturate-150",
          "border-border/40 text-muted-foreground"
        )}
      >
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0">
          <p className="text-center">
            © 2024 ALNRetool - About Last Night Visualization Tool
          </p>
          {/* React Query DevTools - Development only */}
          {import.meta.env?.DEV && (
            <div className="sm:ml-4">
              <ReactQueryDevtools 
                initialIsOpen={false}
                buttonPosition="bottom-left"
              />
            </div>
          )}
        </div>
      </footer>
    </div>
  )
}