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
      expect(progressbars.some(el => el.className.includes('circular'))).toBe(true)
      
      // Check for SkeletonGroup usage (multiple loading lines)
      const skeletonGroupItems = screen.getAllByLabelText(/Loading line \d+ of \d+/)
      expect(skeletonGroupItems.length).toBeGreaterThan(0)
    })

    it('applies card CSS class and custom className', () => {
      const { container } = render(<CharacterSkeleton className="custom-test-class" />)
      
      // Find the root container - it should have the card class
      const rootContainer = container.firstChild as HTMLElement
      expect(rootContainer?.className).toContain('card')
      expect(rootContainer?.className).toContain('custom-test-class')
    })

    it('renders card structure with header, body, and footer sections', () => {
      render(<CharacterSkeleton />)
      
      // Should have multiple skeleton elements representing different sections
      const progressbars = screen.getAllByRole('progressbar')
      
      // Card should have: circular avatar + title skeletons + body group + footer skeletons
      // Expect at least 6-7 skeleton elements total
      expect(progressbars.length).toBeGreaterThanOrEqual(6)
      
      // Check for SkeletonGroup in body (2 lines by default)
      const bodyLines = screen.getAllByLabelText(/Loading line \d+ of 2/)
      expect(bodyLines).toHaveLength(2)
    })
  })

  describe('List Variant', () => {
    it('renders the list variant when specified', () => {
      const { container } = render(<CharacterSkeleton variant="list" className="custom-list-class" />)
      
      // Find the list container
      const rootContainer = container.firstChild as HTMLElement
      expect(rootContainer?.className).toContain('listItem')
      expect(rootContainer?.className).toContain('custom-list-class')
    })

    it('renders list structure with avatar, content, and meta', () => {
      render(<CharacterSkeleton variant="list" />)
      
      const progressbars = screen.getAllByRole('progressbar')
      
      // List should have: circular avatar + 2 content lines + 1 meta element
      expect(progressbars).toHaveLength(4)
      
      // Check for circular avatar
      expect(progressbars.some(el => el.className.includes('circular'))).toBe(true)
    })

    it('applies correct dimensions for list elements', () => {
      render(<CharacterSkeleton variant="list" />)
      
      const progressbars = screen.getAllByRole('progressbar')
      const circularSkeleton = progressbars.find(el => el.className.includes('circular'))
      
      // Avatar should be 40x40
      expect(circularSkeleton).toHaveStyle({ width: '40px', height: '40px' })
    })
  })

  describe('Detail Variant', () => {
    it('renders the detail variant with comprehensive structure', () => {
      const { container } = render(<CharacterSkeleton variant="detail" />)
      
      // Find the detail container
      const rootContainer = container.firstChild as HTMLElement
      expect(rootContainer?.className).toContain('detail')
    })

    it('renders detail structure with header and multiple sections', () => {
      render(<CharacterSkeleton variant="detail" />)
      
      const progressbars = screen.getAllByRole('progressbar')
      
      // Detail should have many skeleton elements: header (circular + 3 info) + 3 sections with groups
      // Section 1: 3 lines, Section 2: 2 lines, Section 3: 4 lines = 9 + 4 header = 13+ total
      expect(progressbars.length).toBeGreaterThanOrEqual(13)
      
      // Check for larger circular avatar (80x80)
      const circularSkeleton = progressbars.find(el => el.className.includes('circular'))
      expect(circularSkeleton).toHaveStyle({ width: '80px', height: '80px' })
      
      // Check for SkeletonGroups in sections
      expect(screen.getAllByLabelText(/Loading line \d+ of 3/)).toHaveLength(3) // Section 1: 3 lines
      expect(screen.getAllByLabelText(/Loading line \d+ of 2/)).toHaveLength(2) // Section 2: 2 lines  
      expect(screen.getAllByLabelText(/Loading line \d+ of 4/)).toHaveLength(4) // Section 3: 4 lines
    })

    it('applies detail-specific styling and className', () => {
      const { container } = render(<CharacterSkeleton variant="detail" className="detail-test-class" />)
      
      const rootContainer = container.firstChild as HTMLElement
      expect(rootContainer?.className).toContain('detail')
      expect(rootContainer?.className).toContain('detail-test-class')
    })
  })

  describe('Props Handling', () => {
    it('handles undefined variant (defaults to card)', () => {
      const { container } = render(<CharacterSkeleton variant={undefined as 'card' | 'list' | 'detail' | undefined} />)
      
      // Should render as card variant
      const rootContainer = container.firstChild as HTMLElement
      expect(rootContainer?.className).toContain('card')
    })

    it('handles invalid variant (defaults to card)', () => {
      const { container } = render(<CharacterSkeleton variant={'invalid' as never} />)
      
      // Should render as card variant  
      const rootContainer = container.firstChild as HTMLElement
      expect(rootContainer?.className).toContain('card')
    })

    it('handles empty className', () => {
      const { container } = render(<CharacterSkeleton className="" />)
      
      const rootContainer = container.firstChild as HTMLElement
      expect(rootContainer?.className).toContain('card')
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
          expect(skeleton).toHaveAttribute('aria-label')
        })
        
        unmount()
      })
    })

    it('provides meaningful aria-labels for skeleton groups', () => {
      render(<CharacterSkeleton variant="detail" />)
      
      // Check that skeleton group items have descriptive labels
      const groupItems = screen.getAllByLabelText(/Loading line \d+ of \d+/)
      groupItems.forEach(item => {
        expect(item.getAttribute('aria-label')).toMatch(/Loading line \d+ of \d+/)
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
      expect(listCount).toBe(4) // Specific for list: avatar + 2 content + 1 meta
    })
  })
})