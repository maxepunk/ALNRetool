/**
 * Test suite for AppRouter component
 * Following TDD approach - these tests are written before implementation
 */

import { describe, it, expect, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders, userEvent } from '@/test/utils'
import AppRouter from '../AppRouter'

// Mock the lazy-loaded views
vi.mock('@/views/PuzzleFocusView', () => ({
  default: () => <div data-testid="puzzle-focus-view">Puzzle Focus View</div>,
}))

vi.mock('@/views/CharacterJourneyView', () => ({
  default: () => <div data-testid="character-journey-view">Character Journey View</div>,
}))

vi.mock('@/views/ContentStatusView', () => ({
  default: () => <div data-testid="content-status-view">Content Status View</div>,
}))

describe('AppRouter', () => {
  describe('Route Rendering', () => {
    it('should render PuzzleFocusView at /puzzles route', async () => {
      renderWithProviders(<AppRouter />, {
        initialEntries: ['/puzzles'],
      })

      await waitFor(() => {
        expect(screen.getByTestId('puzzle-focus-view')).toBeInTheDocument()
      })
    })

    it('should render CharacterJourneyView at /characters route', async () => {
      renderWithProviders(<AppRouter />, {
        initialEntries: ['/characters'],
      })

      await waitFor(() => {
        expect(screen.getByTestId('character-journey-view')).toBeInTheDocument()
      })
    })

    it('should render ContentStatusView at /status route', async () => {
      renderWithProviders(<AppRouter />, {
        initialEntries: ['/status'],
      })

      await waitFor(() => {
        expect(screen.getByTestId('content-status-view')).toBeInTheDocument()
      })
    })

    it('should redirect from root path to /puzzles', async () => {
      renderWithProviders(<AppRouter />, {
        initialEntries: ['/'],
      })

      await waitFor(() => {
        expect(screen.getByTestId('puzzle-focus-view')).toBeInTheDocument()
      })
    })
  })

  describe('Navigation', () => {
    it('should navigate between views when clicking navigation links', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(<AppRouter />, {
        initialEntries: ['/puzzles'],
      })

      // Start at puzzles view
      await waitFor(() => {
        expect(screen.getByTestId('puzzle-focus-view')).toBeInTheDocument()
      })

      // Navigate to characters
      const charactersLink = screen.getByRole('link', { name: /characters/i })
      await user.click(charactersLink)

      await waitFor(() => {
        expect(screen.getByTestId('character-journey-view')).toBeInTheDocument()
      })

      // Navigate to status
      const statusLink = screen.getByRole('link', { name: /status/i })
      await user.click(statusLink)

      await waitFor(() => {
        expect(screen.getByTestId('content-status-view')).toBeInTheDocument()
      })
    })

    it('should highlight active navigation link', async () => {
      renderWithProviders(<AppRouter />, {
        initialEntries: ['/characters'],
      })

      await waitFor(() => {
        const charactersLink = screen.getByRole('link', { name: /characters/i })
        // CSS modules will include _active_ in the class name
        expect(charactersLink.className).toContain('_active_')
      })
    })
  })

  describe('Lazy Loading', () => {
    it('should show loading state while lazy loading views', async () => {
      renderWithProviders(<AppRouter />, {
        initialEntries: ['/puzzles'],
      })

      // Check for loading state (Suspense fallback)
      expect(screen.getByText(/loading/i)).toBeInTheDocument()

      // Wait for lazy loaded component
      await waitFor(() => {
        expect(screen.getByTestId('puzzle-focus-view')).toBeInTheDocument()
      })
    })

    it('should cache lazy loaded components after first load', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(<AppRouter />, {
        initialEntries: ['/puzzles'],
      })

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('puzzle-focus-view')).toBeInTheDocument()
      })

      // Navigate away and back
      const charactersLink = screen.getByRole('link', { name: /characters/i })
      await user.click(charactersLink)

      const puzzlesLink = screen.getByRole('link', { name: /puzzles/i })
      await user.click(puzzlesLink)

      // Should not show loading state on second visit
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
      expect(screen.getByTestId('puzzle-focus-view')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should show 404 page for unknown routes', async () => {
      renderWithProviders(<AppRouter />, {
        initialEntries: ['/unknown-route'],
      })

      await waitFor(() => {
        expect(screen.getByText(/404/i)).toBeInTheDocument()
        expect(screen.getByText(/page not found/i)).toBeInTheDocument()
      })
    })

    it('should handle route errors gracefully', async () => {
      // Mock a view to throw an error
      vi.mock('@/views/PuzzleFocusView', () => ({
        default: () => {
          throw new Error('Test error')
        },
      }))

      renderWithProviders(<AppRouter />, {
        initialEntries: ['/puzzles'],
      })

      await waitFor(() => {
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
      })
    })

    it('should provide navigation back to home from 404 page', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(<AppRouter />, {
        initialEntries: ['/unknown'],
      })

      await waitFor(() => {
        expect(screen.getByText(/404/i)).toBeInTheDocument()
      })

      const homeLink = screen.getByRole('link', { name: /go to home/i })
      await user.click(homeLink)

      await waitFor(() => {
        expect(screen.getByTestId('puzzle-focus-view')).toBeInTheDocument()
      })
    })
  })

  describe('URL Management', () => {
    it('should update URL when navigating', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(<AppRouter />, {
        initialEntries: ['/puzzles'],
      })

      const charactersLink = screen.getByRole('link', { name: /characters/i })
      await user.click(charactersLink)

      await waitFor(() => {
        expect(window.location.pathname).toBe('/characters')
      })
    })

    it('should support browser back/forward navigation', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(<AppRouter />, {
        initialEntries: ['/puzzles'],
      })

      // Navigate to characters
      const charactersLink = screen.getByRole('link', { name: /characters/i })
      await user.click(charactersLink)

      await waitFor(() => {
        expect(screen.getByTestId('character-journey-view')).toBeInTheDocument()
      })

      // Navigate to status
      const statusLink = screen.getByRole('link', { name: /status/i })
      await user.click(statusLink)

      await waitFor(() => {
        expect(screen.getByTestId('content-status-view')).toBeInTheDocument()
      })

      // Use browser back
      window.history.back()

      await waitFor(() => {
        expect(screen.getByTestId('character-journey-view')).toBeInTheDocument()
      })

      // Use browser forward
      window.history.forward()

      await waitFor(() => {
        expect(screen.getByTestId('content-status-view')).toBeInTheDocument()
      })
    })
  })

  describe('Route Parameters', () => {
    it('should pass route parameters to views', async () => {
      // Mock a view that displays route params
      vi.mock('@/views/PuzzleFocusView', () => ({
        default: ({ puzzleId }: { puzzleId?: string }) => (
          <div data-testid="puzzle-focus-view">
            {puzzleId && <span data-testid="puzzle-id">{puzzleId}</span>}
          </div>
        ),
      }))

      renderWithProviders(<AppRouter />, {
        initialEntries: ['/puzzles/puzzle-123'],
      })

      await waitFor(() => {
        expect(screen.getByTestId('puzzle-id')).toHaveTextContent('puzzle-123')
      })
    })

    it('should pass query parameters to views', async () => {
      renderWithProviders(<AppRouter />, {
        initialEntries: ['/puzzles?filter=unsolved'],
      })

      await waitFor(() => {
        const urlParams = new URLSearchParams(window.location.search)
        expect(urlParams.get('filter')).toBe('unsolved')
      })
    })
  })

  describe('Protected Routes', () => {
    it('should handle authentication state for protected routes', async () => {
      // This test is a placeholder for future auth implementation
      // Currently all routes are public
      renderWithProviders(<AppRouter />, {
        initialEntries: ['/puzzles'],
      })

      await waitFor(() => {
        expect(screen.getByTestId('puzzle-focus-view')).toBeInTheDocument()
      })
    })
  })
})