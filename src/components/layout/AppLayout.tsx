/**
 * Main application layout component
 * Provides navigation, header, footer, and content area with collapsible panels
 * for maximum viewport space for visualization
 */

import { useState, useEffect, useRef } from 'react'
import { Outlet, useLocation, Link } from 'react-router-dom'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { useLastSyncTime } from '@/hooks/useLastSyncTime'
import Breadcrumbs from '@/components/common/Breadcrumbs'
import ConnectionStatus from '@/components/common/ConnectionStatus'
import ErrorBoundary from '@/components/common/ErrorBoundary'
import Sidebar from '@/components/layout/SidebarRefactored'
import { 
  Menu, 
  X, 
  PanelLeft,
  Search,
  Bell,
  User
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

export default function AppLayout() {
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true)
  const [headerMinimized, setHeaderMinimized] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isNavigationPending] = useState(false)
  
  const location = useLocation()
  const isOnline = useOnlineStatus()
  const lastSyncTime = useLastSyncTime()
  const headerRef = useRef<HTMLElement>(null)
  const lastScrollY = useRef(0)

  // Handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      const isMobileView = window.matchMedia('(max-width: 768px)').matches
      setIsMobile(isMobileView)
      
      // Auto-manage sidebar based on screen size
      if (isMobileView) {
        setLeftSidebarOpen(false)
      } else {
        setLeftSidebarOpen(true)
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

  // Close mobile menu on navigation
  useEffect(() => {
    if (isMobile) {
      setLeftSidebarOpen(false)
    }
  }, [location, isMobile])

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
            {/* Mobile menu toggle */}
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
                aria-label={leftSidebarOpen ? "Close menu" : "Open menu"}
                aria-expanded={leftSidebarOpen}
                className="text-foreground hover:bg-accent/50 transition-colors"
              >
                <AnimatePresence mode="wait">
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
            
            {/* Desktop sidebar toggle */}
            {!isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
                aria-label={leftSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                className="text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
              >
                <PanelLeft size={18} />
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
              <div className="relative max-w-xs hidden lg:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search..."
                  className={cn(
                    "w-full h-9 pl-9 pr-4 rounded-lg text-sm",
                    "bg-muted/30 backdrop-blur-sm",
                    "border border-border/50",
                    "placeholder-muted-foreground",
                    "focus:bg-background focus:border-primary",
                    "focus:ring-1 focus:ring-primary focus:ring-offset-0",
                    "transition-all duration-200"
                  )}
                />
              </div>
            )}
            
            {/* Mobile Search Button */}
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
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
            
            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              aria-label="Notifications"
              className="relative text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
              title="3 new notifications"
            >
              <Bell size={18} />
              {/* Notification dot */}
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full animate-pulse" />
            </Button>
            
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
              <Breadcrumbs />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Loading indicator */}
      <AnimatePresence>
        {isNavigationPending && (
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            exit={{ scaleX: 0 }}
            transition={{ duration: 0.3 }}
            className="h-0.5 bg-gradient-to-r from-primary via-primary/80 to-primary origin-left" 
            data-testid="navigation-loading"
          />
        )}
      </AnimatePresence>

      <div className="flex flex-1 overflow-hidden">
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
                  className="relative"
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
                  className="fixed inset-y-0 left-0 z-30 mt-14"
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
              onClick={() => setLeftSidebarOpen(false)}
              aria-hidden="true"
            />
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
          {/* Floating sidebar toggle when closed */}
          <AnimatePresence>
            {!leftSidebarOpen && !isMobile && (
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Button
                  variant="outline"
                  size="icon"
                  className={cn(
                    "absolute left-4 top-4 z-10",
                    "bg-background/80 backdrop-blur-sm",
                    "border-border/50 shadow-lg",
                    "hover:bg-accent/50"
                  )}
                  onClick={() => setLeftSidebarOpen(true)}
                  aria-label="Open sidebar"
                >
                  <PanelLeft size={16} />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
          
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
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-center sm:text-left">
            © 2024 ALNRetool - About Last Night Visualization Tool
          </p>
          <div className="flex items-center gap-2">
            <motion.span 
              className={cn(
                "inline-block w-2 h-2 rounded-full",
                isOnline ? 'bg-green-500' : 'bg-red-500'
              )}
              animate={isOnline ? {} : { scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <p>
              Last synced: <time data-testid="last-sync-time">{lastSyncTime}</time>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}