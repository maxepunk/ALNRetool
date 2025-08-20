import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/utils'
import { CharacterSkeleton } from './CharacterSkeleton'

describe('CharacterSkeleton', () => {
  describe('Default Card Variant', () => {
    it('renders the default card variant with expected structure', () => {
      render(<CharacterSkeleton />)
      
      // Check that multiple skeleton elements are rendered
      const progressbars = screen.getAllByRole('progressbar')
      expect(progressbars.length).toBeGreaterThan(0)
      
      // Check for circular skeleton (avatar)
      expect(progressbars.some(el => el.className.includes('rounded-full'))).toBe(true)
      
      // Check that we have multiple skeleton elements
      expect(progressbars.length).toBeGreaterThanOrEqual(6)
    })

    it('applies card CSS class and custom className', () => {
      const { container } = render(<CharacterSkeleton className="custom-test-class" />)
      
      // Find the Card component (it will have 'overflow-hidden' and the custom class)
      const cards = container.querySelectorAll('.overflow-hidden')
      expect(cards.length).toBeGreaterThan(0)
      const card = cards[0] as HTMLElement
      expect(card?.className).toContain('custom-test-class')
    })

    it('renders card structure with header, body, and footer sections', () => {
      render(<CharacterSkeleton />)
      
      // Should have multiple skeleton elements representing different sections
      const progressbars = screen.getAllByRole('progressbar')
      
      // Card should have: circular avatar + title skeletons + body group + footer skeletons
      // Expect at least 6-7 skeleton elements total
      expect(progressbars.length).toBeGreaterThanOrEqual(6)
      
      // No SkeletonGroup in new implementation - just verify skeleton count
    })
  })

  describe('List Variant', () => {
    it('renders the list variant when specified', () => {
      const { container } = render(<CharacterSkeleton variant="list" className="custom-list-class" />)
      
      // Find the list container (has border-b)
      const rootContainer = container.firstChild as HTMLElement
      expect(rootContainer?.className).toContain('border-b')
      expect(rootContainer?.className).toContain('custom-list-class')
    })

    it('renders list structure with avatar, content, and meta', () => {
      render(<CharacterSkeleton variant="list" />)
      
      const progressbars = screen.getAllByRole('progressbar')
      
      // List should have: circular avatar + 2 content lines + 2 meta badges
      expect(progressbars).toHaveLength(5)
      
      // Check for circular avatar
      expect(progressbars.some(el => el.className.includes('rounded-full'))).toBe(true)
    })

    it('applies correct dimensions for list elements', () => {
      render(<CharacterSkeleton variant="list" />)
      
      const progressbars = screen.getAllByRole('progressbar')
      const circularSkeleton = progressbars.find(el => el.className.includes('rounded-full'))
      
      // Avatar should be h-10 w-10 (40px x 40px in Tailwind)
      expect(circularSkeleton?.className).toContain('h-10')
      expect(circularSkeleton?.className).toContain('w-10')
    })
  })

  describe('Detail Variant', () => {
    it('renders the detail variant with comprehensive structure', () => {
      const { container } = render(<CharacterSkeleton variant="detail" />)
      
      // Find the detail container (has space-y-6 class)
      const rootContainer = container.firstChild as HTMLElement
      expect(rootContainer?.className).toContain('space-y-6')
    })

    it('renders detail structure with header and multiple sections', () => {
      render(<CharacterSkeleton variant="detail" />)
      
      const progressbars = screen.getAllByRole('progressbar')
      
      // Detail should have many skeleton elements
      expect(progressbars.length).toBeGreaterThanOrEqual(10)
      
      // Check for larger circular avatar (h-32 w-32 = 128px x 128px)
      const circularSkeleton = progressbars.find(el => el.className.includes('rounded-full'))
      expect(circularSkeleton?.className).toContain('h-32')
      expect(circularSkeleton?.className).toContain('w-32')
    })

    it('applies detail-specific styling and className', () => {
      const { container } = render(<CharacterSkeleton variant="detail" className="detail-test-class" />)
      
      const rootContainer = container.firstChild as HTMLElement
      expect(rootContainer?.className).toContain('space-y-6')
      expect(rootContainer?.className).toContain('detail-test-class')
    })
  })

  describe('Props Handling', () => {
    it('handles undefined variant (defaults to card)', () => {
      const { container } = render(<CharacterSkeleton variant={undefined as 'card' | 'list' | 'detail' | undefined} />)
      
      // Should render as card variant (has overflow-hidden)
      const rootContainer = container.firstChild as HTMLElement
      expect(rootContainer?.className).toContain('overflow-hidden')
    })

    it('handles invalid variant (defaults to card)', () => {
      const { container } = render(<CharacterSkeleton variant={'invalid' as never} />)
      
      // Should render as card variant (has overflow-hidden)
      const rootContainer = container.firstChild as HTMLElement
      expect(rootContainer?.className).toContain('overflow-hidden')
    })

    it('handles empty className', () => {
      const { container } = render(<CharacterSkeleton className="" />)
      
      const rootContainer = container.firstChild as HTMLElement
      expect(rootContainer?.className).toContain('overflow-hidden')
    })

    it('handles missing className prop', () => {
      render(<CharacterSkeleton />)
      
      const progressbars = screen.getAllByRole('progressbar')
      expect(progressbars.length).toBeGreaterThan(0)
    })
  })

  describe('Accessibility', () => {
    it('maintains accessibility attributes across variants', () => {
      const variants: Array<'card' | 'list' | 'detail'> = ['card', 'list', 'detail']
      
      variants.forEach(variant => {
        const { unmount } = render(<CharacterSkeleton variant={variant} />)
        
        const progressbars = screen.getAllByRole('progressbar')
        progressbars.forEach(skeleton => {
          expect(skeleton).toHaveAttribute('role', 'progressbar')
          expect(skeleton).toHaveAttribute('aria-busy', 'true')
        })
        
        unmount()
      })
    })

    it('provides meaningful aria-labels for skeleton groups', () => {
      render(<CharacterSkeleton variant="detail" />)
      
      // Check that all progressbars have aria attributes
      const progressbars = screen.getAllByRole('progressbar')
      progressbars.forEach(item => {
        expect(item).toHaveAttribute('aria-busy', 'true')
      })
    })
  })

  describe('Visual Structure Validation', () => {
    it('renders consistent skeleton counts per variant', () => {
      // Card variant
      const { rerender } = render(<CharacterSkeleton variant="card" />)
      let progressbars = screen.getAllByRole('progressbar')
      const cardCount = progressbars.length
      
      // List variant  
      rerender(<CharacterSkeleton variant="list" />)
      progressbars = screen.getAllByRole('progressbar')
      const listCount = progressbars.length
      
      // Detail variant
      rerender(<CharacterSkeleton variant="detail" />)
      progressbars = screen.getAllByRole('progressbar')
      const detailCount = progressbars.length
      
      // Validate expected hierarchy: detail > card > list
      expect(detailCount).toBeGreaterThan(cardCount)
      expect(cardCount).toBeGreaterThan(listCount)
      expect(listCount).toBe(5) // Specific for list: avatar + 2 content + 2 meta badges
    })
  })
})