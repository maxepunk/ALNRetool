import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ElementSkeleton } from './ElementSkeleton'

describe('ElementSkeleton', () => {
  describe('Default Card Variant', () => {
    it('renders the default card variant with expected structure', () => {
      render(<ElementSkeleton />)
      
      const progressbars = screen.getAllByRole('progressbar')
      expect(progressbars.length).toBeGreaterThan(0)
      
      // Check for rectangular skeleton (element icon)
      expect(progressbars.some(el => el.className.includes('rectangular'))).toBe(true)
      
      // Check for SkeletonGroup usage (3 lines for element description)
      const skeletonGroupItems = screen.getAllByLabelText(/Loading line \d+ of 3/)
      expect(skeletonGroupItems).toHaveLength(3)
    })

    it('applies card CSS class and custom className', () => {
      const { container } = render(<ElementSkeleton className="custom-element-class" />)
      
      const rootContainer = container.firstChild as HTMLElement
      expect(rootContainer?.className).toContain('card')
      expect(rootContainer?.className).toContain('custom-element-class')
    })

    it('renders card structure with header, body, and footer with badges', () => {
      render(<ElementSkeleton />)
      
      const progressbars = screen.getAllByRole('progressbar')
      
      // Card should have: rectangular icon + title skeletons + body group (3 lines) + footer badges + meta
      // Expect around 8-9 skeleton elements total
      expect(progressbars.length).toBeGreaterThanOrEqual(8)
      
      // Check for multiple rectangular elements (badges in footer)
      const rectangularSkeletons = progressbars.filter(el => el.className.includes('rectangular'))
      expect(rectangularSkeletons.length).toBeGreaterThanOrEqual(3) // Icon + 2 badges
    })
  })

  describe('List Variant', () => {
    it('renders the list variant when specified', () => {
      const { container } = render(<ElementSkeleton variant="list" className="custom-list-class" />)
      
      const rootContainer = container.firstChild as HTMLElement
      expect(rootContainer?.className).toContain('listItem')
      expect(rootContainer?.className).toContain('custom-list-class')
    })

    it('renders list structure with icon, content, and meta section', () => {
      render(<ElementSkeleton variant="list" />)
      
      const progressbars = screen.getAllByRole('progressbar')
      
      // List should have: rectangular icon + 2 content lines + 2 meta elements
      expect(progressbars).toHaveLength(5)
      
      // Check for rectangular icon
      expect(progressbars.some(el => el.className.includes('rectangular'))).toBe(true)
    })

    it('applies correct dimensions for list elements', () => {
      render(<ElementSkeleton variant="list" />)
      
      const progressbars = screen.getAllByRole('progressbar')
      const rectangularSkeleton = progressbars.find(el => el.className.includes('rectangular'))
      
      // Icon should be 32x32
      expect(rectangularSkeleton).toHaveStyle({ width: '32px', height: '32px' })
    })
  })

  describe('Detail Variant', () => {
    it('renders the detail variant with comprehensive structure', () => {
      const { container } = render(<ElementSkeleton variant="detail" />)
      
      const rootContainer = container.firstChild as HTMLElement
      expect(rootContainer?.className).toContain('detail')
    })

    it('renders detail structure with header and multiple sections', () => {
      render(<ElementSkeleton variant="detail" />)
      
      const progressbars = screen.getAllByRole('progressbar')
      
      // Detail should have many skeleton elements: header (rectangular + 3 info + 2 badges) + 3 sections
      // Section 1: 4 lines, Section 2: 3 patterns, Section 3: 2 lines
      expect(progressbars.length).toBeGreaterThanOrEqual(15)
      
      // Check for larger rectangular icon (120x80)
      const rectangularSkeleton = progressbars.find(el => 
        el.className.includes('rectangular') && 
        el.style.width === '120px'
      )
      expect(rectangularSkeleton).toHaveStyle({ width: '120px', height: '80px' })
      
      // Check for SkeletonGroups in sections
      expect(screen.getAllByLabelText(/Loading line \d+ of 4/)).toHaveLength(4) // Section 1: 4 lines
      expect(screen.getAllByLabelText(/Loading line \d+ of 2/)).toHaveLength(2) // Section 3: 2 lines
    })

    it('includes SF patterns section in detail view', () => {
      render(<ElementSkeleton variant="detail" />)
      
      const progressbars = screen.getAllByRole('progressbar')
      
      // Should have multiple skeleton elements representing SF pattern fields
      // The patterns section should have 3 separate skeleton lines
      const allSkeletons = progressbars.length
      expect(allSkeletons).toBeGreaterThanOrEqual(15) // Comprehensive detail view
    })
  })

  describe('Props Handling', () => {
    it('handles undefined variant (defaults to card)', () => {
      const { container } = render(<ElementSkeleton variant={undefined as 'card' | 'list' | 'detail' | undefined} />)
      
      const rootContainer = container.firstChild as HTMLElement
      expect(rootContainer?.className).toContain('card')
    })

    it('handles invalid variant (defaults to card)', () => {
      const { container } = render(<ElementSkeleton variant={'invalid' as never} />)
      
      const rootContainer = container.firstChild as HTMLElement
      expect(rootContainer?.className).toContain('card')
    })

    it('handles empty className', () => {
      const { container } = render(<ElementSkeleton className="" />)
      
      const rootContainer = container.firstChild as HTMLElement
      expect(rootContainer?.className).toContain('card')
    })

    it('handles missing className prop', () => {
      render(<ElementSkeleton />)
      
      const progressbars = screen.getAllByRole('progressbar')
      expect(progressbars.length).toBeGreaterThan(0)
    })
  })

  describe('Element-Specific Features', () => {
    it('renders rectangular skeletons for element type indicators', () => {
      const variants: Array<'card' | 'list' | 'detail'> = ['card', 'list', 'detail']
      
      variants.forEach(variant => {
        const { unmount } = render(<ElementSkeleton variant={variant} />)
        
        const progressbars = screen.getAllByRole('progressbar')
        const rectangularSkeletons = progressbars.filter(el => el.className.includes('rectangular'))
        
        // Each variant should have at least one rectangular skeleton for the element type icon
        expect(rectangularSkeletons.length).toBeGreaterThanOrEqual(1)
        
        unmount()
      })
    })

    it('includes badge-like skeletons for element status and type', () => {
      render(<ElementSkeleton variant="card" />)
      
      const progressbars = screen.getAllByRole('progressbar')
      const rectangularSkeletons = progressbars.filter(el => el.className.includes('rectangular'))
      
      // Card variant should have multiple rectangular elements: icon + status badge + type badge
      expect(rectangularSkeletons.length).toBeGreaterThanOrEqual(3)
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
          expect(skeleton).toHaveAttribute('aria-label')
        })
        
        unmount()
      })
    })

    it('provides meaningful aria-labels for skeleton groups', () => {
      render(<ElementSkeleton variant="detail" />)
      
      const groupItems = screen.getAllByLabelText(/Loading line \d+ of \d+/)
      groupItems.forEach(item => {
        expect(item.getAttribute('aria-label')).toMatch(/Loading line \d+ of \d+/)
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

    it('maintains consistent rectangular skeleton usage', () => {
      const variants: Array<'card' | 'list' | 'detail'> = ['card', 'list', 'detail']
      
      variants.forEach(variant => {
        const { unmount } = render(<ElementSkeleton variant={variant} />)
        
        const progressbars = screen.getAllByRole('progressbar')
        const rectangularCount = progressbars.filter(el => el.className.includes('rectangular')).length
        
        // Each variant should have rectangular skeletons for element type indicators
        expect(rectangularCount).toBeGreaterThanOrEqual(1)
        
        // Detail variant should have the most rectangular elements
        if (variant === 'detail') {
          expect(rectangularCount).toBeGreaterThanOrEqual(3)
        }
        
        unmount()
      })
    })
  })
})