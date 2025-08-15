import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/utils'
import { PuzzleSkeleton } from './PuzzleSkeleton'

describe('PuzzleSkeleton', () => {
  describe('Default Card Variant', () => {
    it('renders the default card variant with expected structure', () => {
      render(<PuzzleSkeleton />)
      
      const progressbars = screen.getAllByRole('progressbar')
      expect(progressbars.length).toBeGreaterThan(0)
      
      // Check for rectangular skeleton (puzzle icon)
      expect(progressbars.some(el => el.className.includes('rectangular'))).toBe(true)
      
      // Check for SkeletonGroup usage (3 lines for puzzle description)
      const skeletonGroupItems = screen.getAllByLabelText(/Loading line \d+ of 3/)
      expect(skeletonGroupItems).toHaveLength(3)
    })

    it('applies card CSS class and custom className', () => {
      const { container } = render(<PuzzleSkeleton className="custom-puzzle-class" />)
      
      const rootContainer = container.firstChild as HTMLElement
      expect(rootContainer?.className).toContain('card')
      expect(rootContainer?.className).toContain('custom-puzzle-class')
    })

    it('renders card structure with header, body, and footer', () => {
      render(<PuzzleSkeleton />)
      
      const progressbars = screen.getAllByRole('progressbar')
      
      // Card should have: rectangular icon + title skeletons + body group (3 lines) + footer meta + difficulty badge
      expect(progressbars.length).toBeGreaterThanOrEqual(7)
      
      // Check for rectangular elements (icon + difficulty badge)
      const rectangularSkeletons = progressbars.filter(el => el.className.includes('rectangular'))
      expect(rectangularSkeletons.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('List Variant', () => {
    it('renders the list variant when specified', () => {
      const { container } = render(<PuzzleSkeleton variant="list" className="custom-list-class" />)
      
      const rootContainer = container.firstChild as HTMLElement
      expect(rootContainer?.className).toContain('listItem')
      expect(rootContainer?.className).toContain('custom-list-class')
    })

    it('renders list structure with icon, content, and meta section', () => {
      render(<PuzzleSkeleton variant="list" />)
      
      const progressbars = screen.getAllByRole('progressbar')
      
      // List should have: rectangular icon + 2 content lines + 2 meta elements
      expect(progressbars).toHaveLength(5)
      
      // Check for rectangular icon
      expect(progressbars.some(el => el.className.includes('rectangular'))).toBe(true)
    })

    it('applies correct dimensions for list puzzle icon', () => {
      render(<PuzzleSkeleton variant="list" />)
      
      const progressbars = screen.getAllByRole('progressbar')
      const rectangularSkeleton = progressbars.find(el => el.className.includes('rectangular'))
      
      // Puzzle icon should be 32x32
      expect(rectangularSkeleton).toHaveStyle({ width: '32px', height: '32px' })
    })
  })

  describe('Detail Variant', () => {
    it('renders the detail variant with comprehensive structure', () => {
      const { container } = render(<PuzzleSkeleton variant="detail" />)
      
      const rootContainer = container.firstChild as HTMLElement
      expect(rootContainer?.className).toContain('detail')
    })

    it('renders detail structure with header and multiple sections', () => {
      render(<PuzzleSkeleton variant="detail" />)
      
      const progressbars = screen.getAllByRole('progressbar')
      
      // Detail should have many skeleton elements: header (rectangular + info + difficulty) + 3 sections
      // Section 1: 5 lines (solution), Section 2: 3 requirements, Section 3: 2 rewards
      expect(progressbars.length).toBeGreaterThanOrEqual(15)
      
      // Check for larger rectangular icon (100x100)
      const rectangularSkeleton = progressbars.find(el => 
        el.className.includes('rectangular') && 
        el.style.width === '100px'
      )
      expect(rectangularSkeleton).toHaveStyle({ width: '100px', height: '100px' })
      
      // Check for SkeletonGroups in sections
      expect(screen.getAllByLabelText(/Loading line \d+ of 5/)).toHaveLength(5) // Section 1: 5 lines
    })

    it('includes difficulty indicator in detail view', () => {
      render(<PuzzleSkeleton variant="detail" />)
      
      const progressbars = screen.getAllByRole('progressbar')
      const rectangularSkeletons = progressbars.filter(el => el.className.includes('rectangular'))
      
      // Should have main icon + difficulty badge
      expect(rectangularSkeletons.length).toBeGreaterThanOrEqual(2)
      
      // Look for difficulty badge (120px width)
      const difficultyBadge = rectangularSkeletons.find(el => el.style.width === '120px')
      expect(difficultyBadge).toHaveStyle({ width: '120px', height: '32px' })
    })

    it('shows puzzle requirements and rewards sections', () => {
      render(<PuzzleSkeleton variant="detail" />)
      
      const progressbars = screen.getAllByRole('progressbar')
      
      // Detail view should have substantial content representing
      // puzzle solution, requirements, and rewards
      expect(progressbars.length).toBeGreaterThanOrEqual(15)
    })
  })

  describe('Props Handling', () => {
    it('handles undefined variant (defaults to card)', () => {
      const { container } = render(<PuzzleSkeleton variant={undefined as 'card' | 'list' | 'detail' | undefined} />)
      
      const rootContainer = container.firstChild as HTMLElement
      expect(rootContainer?.className).toContain('card')
    })

    it('handles invalid variant (defaults to card)', () => {
      const { container } = render(<PuzzleSkeleton variant={'invalid' as never} />)
      
      const rootContainer = container.firstChild as HTMLElement
      expect(rootContainer?.className).toContain('card')
    })

    it('handles empty className', () => {
      const { container } = render(<PuzzleSkeleton className="" />)
      
      const rootContainer = container.firstChild as HTMLElement
      expect(rootContainer?.className).toContain('card')
    })

    it('handles missing className prop', () => {
      render(<PuzzleSkeleton />)
      
      const progressbars = screen.getAllByRole('progressbar')
      expect(progressbars.length).toBeGreaterThan(0)
    })
  })

  describe('Puzzle-Specific Features', () => {
    it('renders rectangular skeletons for puzzle indicators', () => {
      const variants: Array<'card' | 'list' | 'detail'> = ['card', 'list', 'detail']
      
      variants.forEach(variant => {
        const { unmount } = render(<PuzzleSkeleton variant={variant} />)
        
        const progressbars = screen.getAllByRole('progressbar')
        const rectangularSkeletons = progressbars.filter(el => el.className.includes('rectangular'))
        
        // Each variant should have at least one rectangular skeleton for the puzzle icon
        expect(rectangularSkeletons.length).toBeGreaterThanOrEqual(1)
        
        unmount()
      })
    })

    it('includes difficulty badge skeleton in card and detail variants', () => {
      const { rerender } = render(<PuzzleSkeleton variant="card" />)
      let progressbars = screen.getAllByRole('progressbar')
      let rectangularSkeletons = progressbars.filter(el => el.className.includes('rectangular'))
      
      // Card should have icon + difficulty badge
      expect(rectangularSkeletons.length).toBeGreaterThanOrEqual(2)
      
      rerender(<PuzzleSkeleton variant="detail" />)
      progressbars = screen.getAllByRole('progressbar')
      rectangularSkeletons = progressbars.filter(el => el.className.includes('rectangular'))
      
      // Detail should also have icon + difficulty badge (possibly larger)
      expect(rectangularSkeletons.length).toBeGreaterThanOrEqual(2)
    })

    it('shows more content in detail view for puzzle mechanics', () => {
      const { rerender } = render(<PuzzleSkeleton variant="card" />)
      const cardSkeletons = screen.getAllByRole('progressbar').length
      
      rerender(<PuzzleSkeleton variant="detail" />)
      const detailSkeletons = screen.getAllByRole('progressbar').length
      
      // Detail should have significantly more skeletons for puzzle solution, requirements, rewards
      expect(detailSkeletons).toBeGreaterThan(cardSkeletons * 1.5)
    })

    it('maintains puzzle icon sizing across variants', () => {
      // List: 32x32
      const { rerender } = render(<PuzzleSkeleton variant="list" />)
      let progressbars = screen.getAllByRole('progressbar')
      let iconSkeleton = progressbars.find(el => el.className.includes('rectangular'))
      expect(iconSkeleton).toHaveStyle({ width: '32px', height: '32px' })
      
      // Card: 50x50
      rerender(<PuzzleSkeleton variant="card" />)
      progressbars = screen.getAllByRole('progressbar')
      iconSkeleton = progressbars.find(el => 
        el.className.includes('rectangular') && 
        el.style.width === '50px'
      )
      expect(iconSkeleton).toHaveStyle({ width: '50px', height: '50px' })
      
      // Detail: 100x100
      rerender(<PuzzleSkeleton variant="detail" />)
      progressbars = screen.getAllByRole('progressbar')
      iconSkeleton = progressbars.find(el => 
        el.className.includes('rectangular') && 
        el.style.width === '100px'
      )
      expect(iconSkeleton).toHaveStyle({ width: '100px', height: '100px' })
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
          expect(skeleton).toHaveAttribute('aria-label')
        })
        
        unmount()
      })
    })

    it('provides meaningful aria-labels for skeleton groups', () => {
      render(<PuzzleSkeleton variant="detail" />)
      
      const groupItems = screen.getAllByLabelText(/Loading line \d+ of \d+/)
      groupItems.forEach(item => {
        expect(item.getAttribute('aria-label')).toMatch(/Loading line \d+ of \d+/)
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

    it('maintains consistent rectangular skeleton usage for puzzle elements', () => {
      const variants: Array<'card' | 'list' | 'detail'> = ['card', 'list', 'detail']
      
      variants.forEach(variant => {
        const { unmount } = render(<PuzzleSkeleton variant={variant} />)
        
        const progressbars = screen.getAllByRole('progressbar')
        const rectangularCount = progressbars.filter(el => el.className.includes('rectangular')).length
        
        // Each variant should have rectangular skeletons for puzzle indicators
        expect(rectangularCount).toBeGreaterThanOrEqual(1)
        
        // Card and detail variants should have difficulty badges too
        if (variant === 'card' || variant === 'detail') {
          expect(rectangularCount).toBeGreaterThanOrEqual(2)
        }
        
        unmount()
      })
    })
  })
})