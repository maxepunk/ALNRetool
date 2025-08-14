/**
 * Test suite for AppLayout component
 * Testing navigation, layout structure, and responsive behavior
 */

import { describe, it, expect, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
import { renderWithRouter, userEvent } from '@/test/utils'
import AppLayout from '../AppLayout'

describe('AppLayout', () => {
  describe('Layout Structure', () => {
    it('should render header with application title', () => {
      renderWithRouter(<AppLayout />)
      
      const header = screen.getByRole('banner')
      expect(header).toBeInTheDocument()
      expect(within(header).getByText(/ALNRetool/i)).toBeInTheDocument()
    })

    it('should render navigation with all three main views', () => {
      renderWithRouter(<AppLayout />)
      
      const nav = screen.getByRole('navigation')
      expect(nav).toBeInTheDocument()
      
      expect(within(nav).getByRole('link', { name: /puzzles/i })).toBeInTheDocument()
      expect(within(nav).getByRole('link', { name: /characters/i })).toBeInTheDocument()
      expect(within(nav).getByRole('link', { name: /status/i })).toBeInTheDocument()
    })

    it('should render main content area with Outlet', () => {
      renderWithRouter(<AppLayout />)
      
      const main = screen.getByRole('main')
      expect(main).toBeInTheDocument()
      expect(main).toHaveAttribute('data-testid', 'main-content')
    })

    it('should render footer with copyright information', () => {
      renderWithRouter(<AppLayout />)
      
      const footer = screen.getByRole('contentinfo')
      expect(footer).toBeInTheDocument()
      expect(within(footer).getByText(/© 2024 ALNRetool/i)).toBeInTheDocument()
    })
  })

  describe('Navigation Links', () => {
    it('should have correct href attributes for navigation links', () => {
      renderWithRouter(<AppLayout />)
      
      const puzzlesLink = screen.getByRole('link', { name: /puzzles/i })
      const charactersLink = screen.getByRole('link', { name: /characters/i })
      const statusLink = screen.getByRole('link', { name: /status/i })
      
      expect(puzzlesLink).toHaveAttribute('href', '/puzzles')
      expect(charactersLink).toHaveAttribute('href', '/characters')
      expect(statusLink).toHaveAttribute('href', '/status')
    })

    it('should highlight active navigation link based on current route', () => {
      renderWithRouter(<AppLayout />, { initialEntries: ['/characters'] })
      
      const charactersLink = screen.getByRole('link', { name: /characters/i })
      expect(charactersLink).toHaveClass('active')
      
      const puzzlesLink = screen.getByRole('link', { name: /puzzles/i })
      expect(puzzlesLink).not.toHaveClass('active')
    })

    it('should navigate when clicking navigation links', async () => {
      const user = userEvent.setup()
      renderWithRouter(<AppLayout />, { initialEntries: ['/puzzles'] })
      
      const charactersLink = screen.getByRole('link', { name: /characters/i })
      await user.click(charactersLink)
      
      // Check that the active class has moved
      expect(charactersLink).toHaveClass('active')
      expect(screen.getByRole('link', { name: /puzzles/i })).not.toHaveClass('active')
    })

    it('should display correct icons for each navigation item', () => {
      renderWithRouter(<AppLayout />)
      
      const nav = screen.getByRole('navigation')
      
      // Check for icon presence (using data-testid or aria-label)
      expect(within(nav).getByTestId('puzzle-icon')).toBeInTheDocument()
      expect(within(nav).getByTestId('character-icon')).toBeInTheDocument()
      expect(within(nav).getByTestId('status-icon')).toBeInTheDocument()
    })
  })

  describe('Responsive Behavior', () => {
    it('should have mobile-friendly navigation on small screens', () => {
      // Mock window.matchMedia for mobile viewport
      vi.stubGlobal('matchMedia', vi.fn().mockImplementation(query => ({
        matches: query === '(max-width: 768px)',
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })))

      renderWithRouter(<AppLayout />)
      
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('mobile-nav')
    })

    it('should toggle mobile menu when hamburger is clicked', async () => {
      const user = userEvent.setup()
      
      // Mock mobile viewport
      vi.stubGlobal('matchMedia', vi.fn().mockImplementation(query => ({
        matches: query === '(max-width: 768px)',
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })))

      renderWithRouter(<AppLayout />)
      
      const menuButton = screen.getByRole('button', { name: /menu/i })
      const nav = screen.getByRole('navigation')
      
      // Initially closed
      expect(nav).toHaveClass('mobile-nav-closed')
      
      // Click to open
      await user.click(menuButton)
      expect(nav).toHaveClass('mobile-nav-open')
      
      // Click to close
      await user.click(menuButton)
      expect(nav).toHaveClass('mobile-nav-closed')
    })
  })

  describe('Loading States', () => {
    it('should show loading indicator when navigation is pending', () => {
      renderWithRouter(<AppLayout />, { 
        routerOptions: { isNavigationPending: true }
      })
      
      expect(screen.getByTestId('navigation-loading')).toBeInTheDocument()
    })

    it('should not show loading indicator when navigation is complete', () => {
      renderWithRouter(<AppLayout />, { 
        routerOptions: { isNavigationPending: false }
      })
      
      expect(screen.queryByTestId('navigation-loading')).not.toBeInTheDocument()
    })
  })

  describe('Breadcrumbs', () => {
    it('should display breadcrumbs for nested routes', () => {
      renderWithRouter(<AppLayout />, { 
        initialEntries: ['/puzzles/puzzle-123'] 
      })
      
      const breadcrumbs = screen.getByRole('navigation', { name: /breadcrumb/i })
      expect(within(breadcrumbs).getByText(/puzzles/i)).toBeInTheDocument()
      expect(within(breadcrumbs).getByText(/puzzle-123/i)).toBeInTheDocument()
    })

    it('should navigate when clicking breadcrumb links', async () => {
      const user = userEvent.setup()
      
      renderWithRouter(<AppLayout />, { 
        initialEntries: ['/puzzles/puzzle-123'] 
      })
      
      const breadcrumbs = screen.getByRole('navigation', { name: /breadcrumb/i })
      const puzzlesLink = within(breadcrumbs).getByRole('link', { name: /puzzles/i })
      
      await user.click(puzzlesLink)
      
      // Should navigate back to puzzles list
      expect(window.location.pathname).toBe('/puzzles')
    })
  })

  describe('User Feedback', () => {
    it('should display connection status indicator', () => {
      renderWithRouter(<AppLayout />)
      
      const statusIndicator = screen.getByTestId('connection-status')
      expect(statusIndicator).toBeInTheDocument()
      expect(statusIndicator).toHaveClass('status-connected')
    })

    it('should show offline indicator when disconnected', () => {
      // Mock offline state
      vi.stubGlobal('navigator', { onLine: false })
      
      renderWithRouter(<AppLayout />)
      
      const statusIndicator = screen.getByTestId('connection-status')
      expect(statusIndicator).toHaveClass('status-disconnected')
      expect(screen.getByText(/offline/i)).toBeInTheDocument()
    })

    it('should display last sync time', () => {
      renderWithRouter(<AppLayout />)
      
      expect(screen.getByText(/last synced:/i)).toBeInTheDocument()
      expect(screen.getByTestId('last-sync-time')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA landmarks', () => {
      renderWithRouter(<AppLayout />)
      
      expect(screen.getByRole('banner')).toBeInTheDocument() // header
      expect(screen.getByRole('navigation')).toBeInTheDocument() // nav
      expect(screen.getByRole('main')).toBeInTheDocument() // main
      expect(screen.getByRole('contentinfo')).toBeInTheDocument() // footer
    })

    it('should have skip navigation link', () => {
      renderWithRouter(<AppLayout />)
      
      const skipLink = screen.getByRole('link', { name: /skip to content/i })
      expect(skipLink).toBeInTheDocument()
      expect(skipLink).toHaveAttribute('href', '#main-content')
    })

    it('should have proper focus management for keyboard navigation', async () => {
      const user = userEvent.setup()
      renderWithRouter(<AppLayout />)
      
      // Tab through navigation
      await user.tab()
      expect(screen.getByRole('link', { name: /skip to content/i })).toHaveFocus()
      
      await user.tab()
      expect(screen.getByRole('link', { name: /puzzles/i })).toHaveFocus()
      
      await user.tab()
      expect(screen.getByRole('link', { name: /characters/i })).toHaveFocus()
      
      await user.tab()
      expect(screen.getByRole('link', { name: /status/i })).toHaveFocus()
    })
  })

  describe('Error Boundary', () => {
    it('should catch and display errors from child components', () => {
      const ThrowError = () => {
        throw new Error('Test error')
      }
      
      // Mock console.error to avoid noise in test output
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      renderWithRouter(
        <AppLayout>
          <ThrowError />
        </AppLayout>
      )
      
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
      
      consoleSpy.mockRestore()
    })

    it('should allow resetting error state', async () => {
      const user = userEvent.setup()
      let shouldThrow = true
      
      const MaybeThrow = () => {
        if (shouldThrow) {
          throw new Error('Test error')
        }
        return <div>Content loaded successfully</div>
      }
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      const { rerender } = renderWithRouter(
        <AppLayout>
          <MaybeThrow />
        </AppLayout>
      )
      
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
      
      // Fix the error condition
      shouldThrow = false
      
      // Click try again
      const retryButton = screen.getByRole('button', { name: /try again/i })
      await user.click(retryButton)
      
      rerender(
        <AppLayout>
          <MaybeThrow />
        </AppLayout>
      )
      
      expect(screen.getByText(/content loaded successfully/i)).toBeInTheDocument()
      
      consoleSpy.mockRestore()
    })
  })
})