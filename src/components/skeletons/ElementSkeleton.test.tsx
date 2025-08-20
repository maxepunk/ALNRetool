import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/utils'
import { ElementSkeleton } from './ElementSkeleton'

describe('ElementSkeleton', () => {
  describe('Default Card Variant', () => {
    it('renders the default card variant with expected structure', () => {
      render(<ElementSkeleton />)
      
      const progressbars = screen.getAllByRole('progressbar')
      expect(progressbars.length).toBeGreaterThan(0)
      
      // Check for rounded skeleton (element icon)
      expect(progressbars.some(el => el.className.includes('rounded'))).toBe(true)
      
      // Check that we have multiple skeleton elements
      expect(progressbars.length).toBeGreaterThanOrEqual(6)
    })

    it('applies card CSS class and custom className', () => {
      const { container } = render(<ElementSkeleton className="custom-element-class" />)
      
      // Find the Card component (it will have 'overflow-hidden' and the custom class)
      const cards = container.querySelectorAll('.overflow-hidden')
      expect(cards.length).toBeGreaterThan(0)
      const card = cards[0] as HTMLElement
      expect(card?.className).toContain('custom-element-class')
    })

    it('renders card structure with header, body, and footer with badges', () => {
      render(<ElementSkeleton />)
      
      const progressbars = screen.getAllByRole('progressbar')
      
      // Card should have: icon + title + subtitle + 2 content lines + status icon + status text + badge
      // Expect around 8 skeleton elements total
      expect(progressbars.length).toBe(8)
      
      // Check for rounded elements
      const roundedSkeletons = progressbars.filter(el => el.className.includes('rounded'))
      expect(roundedSkeletons.length).toBeGreaterThanOrEqual(2) // Icon + badge
    })
  })

  describe('List Variant', () => {
    it('renders the list variant when specified', () => {
      const { container } = render(<ElementSkeleton variant="list" className="custom-list-class" />)
      
      const rootContainer = container.firstChild as HTMLElement
      expect(rootContainer?.className).toContain('border-b')
      expect(rootContainer?.className).toContain('custom-list-class')
    })

    it('renders list structure with icon, content, and meta section', () => {
      render(<ElementSkeleton variant="list" />)
      
      const progressbars = screen.getAllByRole('progressbar')
      
      // List should have: icon + 2 content lines + circular status + meta badge
      expect(progressbars).toHaveLength(5)
      
      // Check for rounded icon
      expect(progressbars.some(el => el.className.includes('rounded') && !el.className.includes('rounded-full'))).toBe(true)
      // Check for circular element
      expect(progressbars.some(el => el.className.includes('rounded-full'))).toBe(true)
    })

    it('applies correct dimensions for list elements', () => {
      render(<ElementSkeleton variant="list" />)
      
      const progressbars = screen.getAllByRole('progressbar')
      const iconSkeleton = progressbars[0] // First element is the icon
      
      // Icon should be h-8 w-8 (32px x 32px in Tailwind)
      expect(iconSkeleton?.className).toContain('h-8')
      expect(iconSkeleton?.className).toContain('w-8')
    })
  })

  describe('Detail Variant', () => {
    it('renders the detail variant with comprehensive structure', () => {
      const { container } = render(<ElementSkeleton variant="detail" />)
      
      const rootContainer = container.firstChild as HTMLElement
      expect(rootContainer?.className).toContain('space-y-6')
    })

    it('renders detail structure with header and multiple sections', () => {
      render(<ElementSkeleton variant="detail" />)
      
      const progressbars = screen.getAllByRole('progressbar')
      
      // Detail variant has: 
      // Header: icon + title + subtitle + 3 badges = 6
      // Section 1: title + 3 content lines = 4
      // Section 2: title + 3 pattern cards = 4
      // Section 3: title + 1 content area = 2
      // Total = 16 skeleton elements
      expect(progressbars.length).toBe(16)
      
      // Check for larger icon (h-20 w-20 = 80px x 80px)
      const iconSkeleton = progressbars[0]
      expect(iconSkeleton?.className).toContain('h-20')
      expect(iconSkeleton?.className).toContain('w-20')
    })

    it('includes SF patterns section in detail view', () => {
      render(<ElementSkeleton variant="detail" />)
      
      const progressbars = screen.getAllByRole('progressbar')
      
      // Should have multiple skeleton elements representing SF pattern fields
      // Total should be 16 elements as detailed above
      expect(progressbars.length).toBe(16)
    })
  })

  describe('Props Handling', () => {
    it('handles undefined variant (defaults to card)', () => {
      const { container } = render(<ElementSkeleton variant={undefined as 'card' | 'list' | 'detail' | undefined} />)
      
      // Should render as card variant (has overflow-hidden)
      const rootContainer = container.firstChild as HTMLElement
      expect(rootContainer?.className).toContain('overflow-hidden')
    })

    it('handles invalid variant (defaults to card)', () => {
      const { container } = render(<ElementSkeleton variant={'invalid' as never} />)
      
      // Should render as card variant (has overflow-hidden)
      const rootContainer = container.firstChild as HTMLElement
      expect(rootContainer?.className).toContain('overflow-hidden')
    })

    it('handles empty className', () => {
      const { container } = render(<ElementSkeleton className="" />)
      
      const rootContainer = container.firstChild as HTMLElement
      expect(rootContainer?.className).toContain('overflow-hidden')
    })

    it('handles missing className prop', () => {
      render(<ElementSkeleton />)
      
      const progressbars = screen.getAllByRole('progressbar')
      expect(progressbars.length).toBeGreaterThan(0)
    })
  })

  describe('Element-Specific Features', () => {
    it('renders rounded skeletons for element type indicators', () => {
      const variants: Array<'card' | 'list' | 'detail'> = ['card', 'list', 'detail']
      
      variants.forEach(variant => {
        const { unmount } = render(<ElementSkeleton variant={variant} />)
        
        const progressbars = screen.getAllByRole('progressbar')
        const roundedSkeletons = progressbars.filter(el => el.className.includes('rounded'))
        
        // Each variant should have at least one rounded skeleton for the element type icon
        expect(roundedSkeletons.length).toBeGreaterThanOrEqual(1)
        
        unmount()
      })
    })

    it('includes badge-like skeletons for element status and type', () => {
      render(<ElementSkeleton variant="card" />)
      
      const progressbars = screen.getAllByRole('progressbar')
      
      // Card variant should have multiple rounded elements for badges
      const roundedSkeletons = progressbars.filter(el => el.className.includes('rounded'))
      expect(roundedSkeletons.length).toBeGreaterThanOrEqual(2)
    })

    it('shows more skeleton content in detail view for element metadata', () => {
      const { rerender } = render(<ElementSkeleton variant="card" />)
      const cardSkeletons = screen.getAllByRole('progressbar').length
      
      rerender(<ElementSkeleton variant="detail" />)
      const detailSkeletons = screen.getAllByRole('progressbar').length
      
      // Detail should have significantly more skeletons for comprehensive element info
      expect(detailSkeletons).toBeGreaterThan(cardSkeletons * 1.5)
    })
  })

  describe('Accessibility', () => {
    it('maintains accessibility attributes across variants', () => {
      const variants: Array<'card' | 'list' | 'detail'> = ['card', 'list', 'detail']
      
      variants.forEach(variant => {
        const { unmount } = render(<ElementSkeleton variant={variant} />)
        
        const progressbars = screen.getAllByRole('progressbar')
        progressbars.forEach(skeleton => {
          expect(skeleton).toHaveAttribute('role', 'progressbar')
          expect(skeleton).toHaveAttribute('aria-busy', 'true')
        })
        
        unmount()
      })
    })

    it('provides meaningful aria attributes for all skeletons', () => {
      render(<ElementSkeleton variant="detail" />)
      
      const progressbars = screen.getAllByRole('progressbar')
      progressbars.forEach(item => {
        expect(item).toHaveAttribute('aria-busy', 'true')
      })
    })
  })

  describe('Visual Structure Validation', () => {
    it('renders consistent skeleton counts per variant', () => {
      // List variant
      const { rerender } = render(<ElementSkeleton variant="list" />)
      let progressbars = screen.getAllByRole('progressbar')
      const listCount = progressbars.length
      
      // Card variant
      rerender(<ElementSkeleton variant="card" />)
      progressbars = screen.getAllByRole('progressbar')
      const cardCount = progressbars.length
      
      // Detail variant
      rerender(<ElementSkeleton variant="detail" />)
      progressbars = screen.getAllByRole('progressbar')
      const detailCount = progressbars.length
      
      // Validate expected hierarchy: detail > card > list
      expect(detailCount).toBeGreaterThan(cardCount)
      expect(cardCount).toBeGreaterThan(listCount)
      expect(listCount).toBe(5) // Specific for list: icon + 2 content + 2 meta
    })

    it('maintains consistent rounded skeleton usage', () => {
      const variants: Array<'card' | 'list' | 'detail'> = ['card', 'list', 'detail']
      
      variants.forEach(variant => {
        const { unmount } = render(<ElementSkeleton variant={variant} />)
        
        const progressbars = screen.getAllByRole('progressbar')
        const roundedCount = progressbars.filter(el => el.className.includes('rounded')).length
        
        // Each variant should have rounded skeletons for element type indicators
        expect(roundedCount).toBeGreaterThanOrEqual(1)
        
        unmount()
      })
    })
  })
})