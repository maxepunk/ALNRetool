/**
 * Main application layout component
 * Provides navigation, header, footer, and content area
 */

import { useState, useEffect } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { useLastSyncTime } from '@/hooks/useLastSyncTime'
import Breadcrumbs from '@/components/common/Breadcrumbs'
import ConnectionStatus from '@/components/common/ConnectionStatus'
import ErrorBoundary from '@/components/common/ErrorBoundary'
import styles from './AppLayout.module.css'

export default function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isNavigationPending, setIsNavigationPending] = useState(false)
  const location = useLocation()
  const isOnline = useOnlineStatus()
  const lastSyncTime = useLastSyncTime()

  // Handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia('(max-width: 768px)').matches)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location])

  const navItems = [
    { path: '/puzzles', label: 'Puzzles', icon: 'puzzle-icon' },
    { path: '/characters', label: 'Characters', icon: 'character-icon' },
    { path: '/status', label: 'Status', icon: 'status-icon' },
  ]

  return (
    <div className={styles.layout}>
      {/* Skip Navigation Link for Accessibility */}
      <a href="#main-content" className={styles.skipLink}>
        Skip to content
      </a>

      {/* Header */}
      <header role="banner" className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>ALNRetool</h1>
          
          {/* Mobile menu toggle */}
          {isMobile && (
            <button
              className={styles.menuToggle}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
              aria-expanded={mobileMenuOpen}
            >
              <span className={styles.menuIcon} />
            </button>
          )}

          {/* Connection status */}
          <ConnectionStatus 
            isOnline={isOnline} 
            lastSyncTime={lastSyncTime}
          />
        </div>
      </header>

      {/* Navigation */}
      <nav 
        role="navigation" 
        className={`
          ${styles.nav} 
          ${isMobile ? styles.mobileNav : ''} 
          ${isMobile && !mobileMenuOpen ? styles.mobileNavClosed : ''}
          ${isMobile && mobileMenuOpen ? styles.mobileNavOpen : ''}
        `}
      >
        <ul className={styles.navList}>
          {navItems.map(({ path, label, icon }) => (
            <li key={path} className={styles.navItem}>
              <NavLink
                to={path}
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.active : ''}`
                }
              >
                <span data-testid={icon} className={styles.navIcon} />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Loading indicator */}
      {isNavigationPending && (
        <div 
          className={styles.loadingBar} 
          data-testid="navigation-loading"
        />
      )}

      {/* Breadcrumbs */}
      <Breadcrumbs />

      {/* Main Content Area */}
      <ErrorBoundary>
        <main 
          id="main-content" 
          role="main" 
          data-testid="main-content"
          className={styles.main}
        >
          <Outlet />
        </main>
      </ErrorBoundary>

      {/* Footer */}
      <footer role="contentinfo" className={styles.footer}>
        <div className={styles.footerContent}>
          <p>© 2024 ALNRetool - About Last Night Visualization Tool</p>
          <p className={styles.syncInfo}>
            Last synced: <time data-testid="last-sync-time">{lastSyncTime}</time>
          </p>
        </div>
      </footer>
    </div>
  )
}