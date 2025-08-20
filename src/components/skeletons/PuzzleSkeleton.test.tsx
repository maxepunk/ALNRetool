import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/utils'
import { PuzzleSkeleton } from './PuzzleSkeleton'

describe('PuzzleSkeleton', () => {
  describe('Default Card Variant', () => {
    it('renders the default card variant with expected structure', () => {
      render(<PuzzleSkeleton />)
      
      const progressbars = screen.getAllByRole('progressbar')
      expect(progressbars.length).toBeGreaterThan(0)
      
      // Check for rounded skeleton (puzzle icon)
      expect(progressbars.some(el => el.className.includes('rounded'))).toBe(true)
      
      // Check that we have multiple skeleton elements
      expect(progressbars.length).toBeGreaterThanOrEqual(7)
    })

    it('applies card CSS class and custom className', () => {
      const { container } = render(<PuzzleSkeleton className="custom-puzzle-class" />)
      
      // Find the Card component (it will have 'overflow-hidden' and the custom class)
      const cards = container.querySelectorAll('.overflow-hidden')
      expect(cards.length).toBeGreaterThan(0)
      const card = cards[0] as HTMLElement
      expect(card?.className).toContain('custom-puzzle-class')
    })

    it('renders card structure with header, body, and footer', () => {
      render(<PuzzleSkeleton />)
      
      const progressbars = screen.getAllByRole('progressbar')
      
      // Card should have: icon + title + subtitle + 3 content lines + 2 footer labels + 1 footer badge
      // Total = 9 skeleton elements
      expect(progressbars.length).toBe(9)
      
      // Check for rounded elements (icon + difficulty badge)
      const roundedSkeletons = progressbars.filter(el => el.className.includes('rounded'))
      expect(roundedSkeletons.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('List Variant', () => {
    it('renders the list variant when specified', () => {
      const { container } = render(<PuzzleSkeleton variant="list" className="custom-list-class" />)
      
      const rootContainer = container.firstChild as HTMLElement
      expect(rootContainer?.className).toContain('border-b')
      expect(rootContainer?.className).toContain('custom-list-class')
    })

    it('renders list structure with icon, content, and meta section', () => {
      render(<PuzzleSkeleton variant="list" />)
      
      const progressbars = screen.getAllByRole('progressbar')
      
      // List should have: icon + 2 content lines + 2 meta elements
      expect(progressbars).toHaveLength(5)
      
      // Check for rounded icon
      expect(progressbars.some(el => el.className.includes('rounded') && !el.className.includes('rounded-full'))).toBe(true)
    })

    it('applies correct dimensions for list puzzle icon', () => {
      render(<PuzzleSkeleton variant="list" />)
      
      const progressbars = screen.getAllByRole('progressbar')
      const iconSkeleton = progressbars[0] // First element is the icon
      
      // Puzzle icon should be h-8 w-8 (32px x 32px in Tailwind)
      expect(iconSkeleton?.className).toContain('h-8')
      expect(iconSkeleton?.className).toContain('w-8')
    })
  })

  describe('Detail Variant', () => {
    it('renders the detail variant with comprehensive structure', () => {
      const { container } = render(<PuzzleSkeleton variant="detail" />)
      
      const rootContainer = container.firstChild as HTMLElement
      expect(rootContainer?.className).toContain('space-y-6')
    })

    it('renders detail structure with header and multiple sections', () => {
      render(<PuzzleSkeleton variant="detail" />)
      
      const progressbars = screen.getAllByRole('progressbar')
      
      // Detail variant has:
      // Header: icon + title + subtitle + difficulty badge = 4
      // Section 1: title + 5 content lines = 6  
      // Section 2: title + 3 content lines = 4
      // Section 3: title + 2 content lines = 3
      // Total = 17 skeleton elements
      expect(progressbars.length).toBe(17)
      
      // Check for larger icon (h-24 w-24 = 96px x 96px)
      const iconSkeleton = progressbars[0]
      expect(iconSkeleton?.className).toContain('h-24')
      expect(iconSkeleton?.className).toContain('w-24')
    })

    it('includes multiple content sections with varying line counts', () => {
      render(<PuzzleSkeleton variant="detail" />)
      
      const progressbars = screen.getAllByRole('progressbar')
      
      // Verify we have the expected total count for comprehensive detail view
      expect(progressbars.length).toBe(17)
    })
  })

  describe('Props Handling', () => {
    it('handles undefined variant (defaults to card)', () => {
      const { container } = render(<PuzzleSkeleton variant={undefined as 'card' | 'list' | 'detail' | undefined} />)
      
      // Should render as card variant (has overflow-hidden)
      const rootContainer = container.firstChild as HTMLElement
      expect(rootContainer?.className).toContain('overflow-hidden')
    })

    it('handles invalid variant (defaults to card)', () => {
      const { container } = render(<PuzzleSkeleton variant={'invalid' as never} />)
      
      // Should render as card variant (has overflow-hidden)
      const rootContainer = container.firstChild as HTMLElement
      expect(rootContainer?.className).toContain('overflow-hidden')
    })

    it('handles empty className', () => {
      const { container } = render(<PuzzleSkeleton className="" />)
      
      const rootContainer = container.firstChild as HTMLElement
      expect(rootContainer?.className).toContain('overflow-hidden')
    })

    it('handles missing className prop', () => {
      render(<PuzzleSkeleton />)
      
      const progressbars = screen.getAllByRole('progressbar')
      expect(progressbars.length).toBeGreaterThan(0)
    })
  })

  describe('Puzzle-Specific Features', () => {
    it('renders rounded skeletons for puzzle type indicators', () => {
      const variants: Array<'card' | 'list' | 'detail'> = ['card', 'list', 'detail']
      
      variants.forEach(variant => {
        const { unmount } = render(<PuzzleSkeleton variant={variant} />)
        
        const progressbars = screen.getAllByRole('progressbar')
        const roundedSkeletons = progressbars.filter(el => el.className.includes('rounded'))
        
        // Each variant should have at least one rounded skeleton for the puzzle icon
        expect(roundedSkeletons.length).toBeGreaterThanOrEqual(1)
        
        unmount()
      })
    })

    it('includes difficulty badge skeleton in appropriate variants', () => {
      const { rerender } = render(<PuzzleSkeleton variant="card" />)
      
      let progressbars = screen.getAllByRole('progressbar')
      // Card has a rounded difficulty badge in footer
      const cardRoundedCount = progressbars.filter(el => el.className.includes('rounded')).length
      expect(cardRoundedCount).toBeGreaterThanOrEqual(2)
      
      rerender(<PuzzleSkeleton variant="detail" />)
      progressbars = screen.getAllByRole('progressbar')
      // Detail has a rounded difficulty badge in header
      const detailRoundedCount = progressbars.filter(el => el.className.includes('rounded')).length
      expect(detailRoundedCount).toBeGreaterThanOrEqual(2)
    })

    it('shows more skeleton content in detail view for puzzle structure', () => {
      const { rerender } = render(<PuzzleSkeleton variant="card" />)
      const cardSkeletons = screen.getAllByRole('progressbar').length
      
      rerender(<PuzzleSkeleton variant="detail" />)
      const detailSkeletons = screen.getAllByRole('progressbar').length
      
      // Detail should have almost double the skeletons
      expect(detailSkeletons).toBeGreaterThan(cardSkeletons * 1.5)
    })
  })

  describe('Accessibility', () => {
    it('maintains accessibility attributes across variants', () => {
      const variants: Array<'card' | 'list' | 'detail'> = ['card', 'list', 'detail']
      
      variants.forEach(variant => {
        const { unmount } = render(<PuzzleSkeleton variant={variant} />)
        
        const progressbars = screen.getAllByRole('progressbar')
        progressbars.forEach(skeleton => {
          expect(skeleton).toHaveAttribute('role', 'progressbar')
          expect(skeleton).toHaveAttribute('aria-busy', 'true')
        })
        
        unmount()
      })
    })

    it('provides proper aria attributes for all skeletons', () => {
      render(<PuzzleSkeleton variant="detail" />)
      
      const progressbars = screen.getAllByRole('progressbar')
      progressbars.forEach(item => {
        expect(item).toHaveAttribute('aria-busy', 'true')
      })
    })
  })

  describe('Visual Structure Validation', () => {
    it('renders consistent skeleton counts per variant', () => {
      // List variant
      const { rerender } = render(<PuzzleSkeleton variant="list" />)
      let progressbars = screen.getAllByRole('progressbar')
      const listCount = progressbars.length
      
      // Card variant
      rerender(<PuzzleSkeleton variant="card" />)
      progressbars = screen.getAllByRole('progressbar')
      const cardCount = progressbars.length
      
      // Detail variant
      rerender(<PuzzleSkeleton variant="detail" />)
      progressbars = screen.getAllByRole('progressbar')
      const detailCount = progressbars.length
      
      // Validate expected hierarchy: detail > card > list
      expect(detailCount).toBeGreaterThan(cardCount)
      expect(cardCount).toBeGreaterThan(listCount)
      expect(listCount).toBe(5) // Specific for list: icon + 2 content + 2 meta
    })

    it('uses appropriate skeleton shapes per variant', () => {
      const variants: Array<'card' | 'list' | 'detail'> = ['card', 'list', 'detail']
      
      variants.forEach(variant => {
        const { unmount } = render(<PuzzleSkeleton variant={variant} />)
        
        const progressbars = screen.getAllByRole('progressbar')
        
        // All variants should use rounded shape for puzzle icon
        const roundedCount = progressbars.filter(el => el.className.includes('rounded')).length
        expect(roundedCount).toBeGreaterThanOrEqual(1)
        
        unmount()
      })
    })
  })
})