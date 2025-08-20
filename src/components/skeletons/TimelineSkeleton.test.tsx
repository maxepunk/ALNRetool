import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/utils'
import { TimelineSkeleton } from './TimelineSkeleton'

describe('TimelineSkeleton', () => {
  describe('Default Card Variant', () => {
    it('renders the default card variant with expected structure', () => {
      render(<TimelineSkeleton />)
      
      const progressbars = screen.getAllByRole('progressbar')
      expect(progressbars.length).toBeGreaterThan(0)
      
      // Check for rounded skeleton (timeline icon)
      expect(progressbars.some(el => el.className.includes('rounded'))).toBe(true)
      
      // Check that we have multiple skeleton elements
      expect(progressbars.length).toBeGreaterThanOrEqual(6)
    })

    it('applies card CSS class and custom className', () => {
      const { container } = render(<TimelineSkeleton className="custom-timeline-class" />)
      
      // Find the Card component (it will have 'overflow-hidden' and the custom class)
      const cards = container.querySelectorAll('.overflow-hidden')
      expect(cards.length).toBeGreaterThan(0)
      const card = cards[0] as HTMLElement
      expect(card?.className).toContain('custom-timeline-class')
    })

    it('renders card structure with header and content sections', () => {
      render(<TimelineSkeleton />)
      
      const progressbars = screen.getAllByRole('progressbar')
      
      // Card should have: icon + title + date + 2 content lines + date label + time badge
      // Total = 7 skeleton elements
      expect(progressbars.length).toBe(7)
      
      // Check for rounded elements
      const roundedSkeletons = progressbars.filter(el => el.className.includes('rounded'))
      expect(roundedSkeletons.length).toBeGreaterThanOrEqual(2) // Icon + time badge
    })
  })

  describe('List Variant', () => {
    it('renders the list variant when specified', () => {
      const { container } = render(<TimelineSkeleton variant="list" className="custom-list-class" />)
      
      const rootContainer = container.firstChild as HTMLElement
      expect(rootContainer?.className).toContain('border-b')
      expect(rootContainer?.className).toContain('custom-list-class')
    })

    it('renders list structure with icon, content, and time badge', () => {
      render(<TimelineSkeleton variant="list" />)
      
      const progressbars = screen.getAllByRole('progressbar')
      
      // List should have: icon + title + date + time badge
      expect(progressbars).toHaveLength(4)
      
      // Check for rounded elements
      expect(progressbars.some(el => el.className.includes('rounded'))).toBe(true)
    })

    it('applies correct dimensions for list timeline icon', () => {
      render(<TimelineSkeleton variant="list" />)
      
      const progressbars = screen.getAllByRole('progressbar')
      const iconSkeleton = progressbars[0] // First element is the icon
      
      // Timeline icon should be h-10 w-10 (40px x 40px in Tailwind)
      expect(iconSkeleton?.className).toContain('h-10')
      expect(iconSkeleton?.className).toContain('w-10')
    })
  })

  describe('Detail Variant', () => {
    it('renders the detail variant with comprehensive structure', () => {
      const { container } = render(<TimelineSkeleton variant="detail" />)
      
      const rootContainer = container.firstChild as HTMLElement
      expect(rootContainer?.className).toContain('space-y-6')
    })

    it('renders detail structure with header and multiple sections', () => {
      render(<TimelineSkeleton variant="detail" />)
      
      const progressbars = screen.getAllByRole('progressbar')
      
      // Detail variant has:
      // Header: icon + title + date + time badge = 4
      // Section 1: title + 6 content lines = 7
      // Section 2: title + 4 cards = 5
      // Section 3: title + 3 content lines = 4
      // Total = 20 skeleton elements
      expect(progressbars.length).toBe(20)
      
      // Check for larger icon (h-16 w-16 = 64px x 64px)
      const iconSkeleton = progressbars[0]
      expect(iconSkeleton?.className).toContain('h-16')
      expect(iconSkeleton?.className).toContain('w-16')
    })

    it('includes impact section with multiple cards in detail view', () => {
      render(<TimelineSkeleton variant="detail" />)
      
      const progressbars = screen.getAllByRole('progressbar')
      
      // Verify we have the expected total count for comprehensive detail view
      expect(progressbars.length).toBe(20)
      
      // Verify there are grid items (the 4 cards in Section 2)
      const gridCards = progressbars.filter(el => el.className.includes('h-12'))
      expect(gridCards.length).toBe(4)
    })
  })

  describe('Props Handling', () => {
    it('handles undefined variant (defaults to card)', () => {
      const { container } = render(<TimelineSkeleton variant={undefined as 'card' | 'list' | 'detail' | undefined} />)
      
      // Should render as card variant (has overflow-hidden)
      const rootContainer = container.firstChild as HTMLElement
      expect(rootContainer?.className).toContain('overflow-hidden')
    })

    it('handles invalid variant (defaults to card)', () => {
      const { container } = render(<TimelineSkeleton variant={'invalid' as never} />)
      
      // Should render as card variant (has overflow-hidden)
      const rootContainer = container.firstChild as HTMLElement
      expect(rootContainer?.className).toContain('overflow-hidden')
    })

    it('handles empty className', () => {
      const { container } = render(<TimelineSkeleton className="" />)
      
      const rootContainer = container.firstChild as HTMLElement
      expect(rootContainer?.className).toContain('overflow-hidden')
    })

    it('handles missing className prop', () => {
      render(<TimelineSkeleton />)
      
      const progressbars = screen.getAllByRole('progressbar')
      expect(progressbars.length).toBeGreaterThan(0)
    })
  })

  describe('Timeline-Specific Features', () => {
    it('renders time/date-specific skeletons across variants', () => {
      const variants: Array<'card' | 'list' | 'detail'> = ['card', 'list', 'detail']
      
      variants.forEach(variant => {
        const { unmount } = render(<TimelineSkeleton variant={variant} />)
        
        const progressbars = screen.getAllByRole('progressbar')
        
        // Each variant should have at least one date/time skeleton
        expect(progressbars.length).toBeGreaterThanOrEqual(4)
        
        unmount()
      })
    })

    it('includes time badge skeleton in all variants', () => {
      const variants: Array<'card' | 'list' | 'detail'> = ['card', 'list', 'detail']
      
      variants.forEach(variant => {
        const { unmount } = render(<TimelineSkeleton variant={variant} />)
        
        const progressbars = screen.getAllByRole('progressbar')
        const roundedBadges = progressbars.filter(el => el.className.includes('rounded'))
        
        // Each variant should have at least one rounded time badge
        expect(roundedBadges.length).toBeGreaterThanOrEqual(1)
        
        unmount()
      })
    })

    it('shows more skeleton content in detail view for timeline metadata', () => {
      const { rerender } = render(<TimelineSkeleton variant="card" />)
      const cardSkeletons = screen.getAllByRole('progressbar').length
      
      rerender(<TimelineSkeleton variant="detail" />)
      const detailSkeletons = screen.getAllByRole('progressbar').length
      
      // Detail should have significantly more skeletons
      expect(detailSkeletons).toBeGreaterThan(cardSkeletons * 2)
    })
  })

  describe('Accessibility', () => {
    it('maintains accessibility attributes across variants', () => {
      const variants: Array<'card' | 'list' | 'detail'> = ['card', 'list', 'detail']
      
      variants.forEach(variant => {
        const { unmount } = render(<TimelineSkeleton variant={variant} />)
        
        const progressbars = screen.getAllByRole('progressbar')
        progressbars.forEach(skeleton => {
          expect(skeleton).toHaveAttribute('role', 'progressbar')
          expect(skeleton).toHaveAttribute('aria-busy', 'true')
        })
        
        unmount()
      })
    })

    it('provides proper aria attributes for all skeletons', () => {
      render(<TimelineSkeleton variant="detail" />)
      
      const progressbars = screen.getAllByRole('progressbar')
      progressbars.forEach(item => {
        expect(item).toHaveAttribute('aria-busy', 'true')
      })
    })
  })

  describe('Visual Structure Validation', () => {
    it('renders consistent skeleton counts per variant', () => {
      // List variant
      const { rerender } = render(<TimelineSkeleton variant="list" />)
      let progressbars = screen.getAllByRole('progressbar')
      const listCount = progressbars.length
      
      // Card variant  
      rerender(<TimelineSkeleton variant="card" />)
      progressbars = screen.getAllByRole('progressbar')
      const cardCount = progressbars.length
      
      // Detail variant
      rerender(<TimelineSkeleton variant="detail" />)
      progressbars = screen.getAllByRole('progressbar')
      const detailCount = progressbars.length
      
      // Validate expected hierarchy: detail > card > list
      expect(detailCount).toBeGreaterThan(cardCount)
      expect(cardCount).toBeGreaterThan(listCount)
      expect(listCount).toBe(4) // Specific for list: icon + title + date + time badge
    })

    it('uses appropriate skeleton shapes per variant', () => {
      const variants: Array<'card' | 'list' | 'detail'> = ['card', 'list', 'detail']
      
      variants.forEach(variant => {
        const { unmount } = render(<TimelineSkeleton variant={variant} />)
        
        const progressbars = screen.getAllByRole('progressbar')
        
        // All variants should use rounded shape for timeline icon
        const roundedCount = progressbars.filter(el => el.className.includes('rounded')).length
        expect(roundedCount).toBeGreaterThanOrEqual(1)
        
        unmount()
      })
    })
  })
})