import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/utils'
import { TimelineSkeleton } from './TimelineSkeleton'

describe('TimelineSkeleton', () => {
  describe('Default Timeline Variant', () => {
    it('renders the default timeline variant with expected structure', () => {
      render(<TimelineSkeleton />)
      
      const progressbars = screen.getAllByRole('progressbar')
      expect(progressbars.length).toBeGreaterThan(0)
      
      // Check for circular skeleton (timeline marker)
      expect(progressbars.some(el => el.className.includes('circular'))).toBe(true)
      
      // Timeline should have marker + header elements + content + meta
      expect(progressbars.length).toBeGreaterThanOrEqual(5)
    })

    it('applies timeline CSS class and custom className', () => {
      const { container } = render(<TimelineSkeleton className="custom-timeline-class" />)
      
      const rootContainer = container.firstChild as HTMLElement
      expect(rootContainer?.className).toContain('timeline')
      expect(rootContainer?.className).toContain('custom-timeline-class')
    })

    it('renders timeline structure with marker and content sections', () => {
      render(<TimelineSkeleton />)
      
      const progressbars = screen.getAllByRole('progressbar')
      
      // Timeline should have: circular marker + header (2 skeletons) + content + meta (2 skeletons)
      expect(progressbars.length).toBeGreaterThanOrEqual(5)
      
      // Check for circular marker (12x12)
      const circularSkeleton = progressbars.find(el => el.className.includes('circular'))
      expect(circularSkeleton).toHaveStyle({ width: '12px', height: '12px' })
    })
  })

  describe('Card Variant', () => {
    it('renders the card variant when specified', () => {
      const { container } = render(<TimelineSkeleton variant="card" className="custom-card-class" />)
      
      const rootContainer = container.firstChild as HTMLElement
      expect(rootContainer?.className).toContain('card')
      expect(rootContainer?.className).toContain('custom-card-class')
    })

    it('renders card structure with header, body, and footer', () => {
      render(<TimelineSkeleton variant="card" />)
      
      const progressbars = screen.getAllByRole('progressbar')
      
      // Card should have: rectangular icon + title skeletons + body group (2 lines) + footer
      expect(progressbars.length).toBeGreaterThanOrEqual(6)
      
      // Check for rectangular icon (60x60)
      const rectangularSkeleton = progressbars.find(el => 
        el.className.includes('rectangular') && 
        el.style.width === '60px'
      )
      expect(rectangularSkeleton).toHaveStyle({ width: '60px', height: '60px' })
      
      // Check for SkeletonGroup in body (2 lines)
      const bodyLines = screen.getAllByLabelText(/Loading line \d+ of 2/)
      expect(bodyLines).toHaveLength(2)
    })
  })

  describe('List Variant', () => {
    it('renders the list variant when specified', () => {
      const { container } = render(<TimelineSkeleton variant="list" className="custom-list-class" />)
      
      const rootContainer = container.firstChild as HTMLElement
      expect(rootContainer?.className).toContain('listItem')
      expect(rootContainer?.className).toContain('custom-list-class')
    })

    it('renders list structure with date, content, and meta', () => {
      render(<TimelineSkeleton variant="list" />)
      
      const progressbars = screen.getAllByRole('progressbar')
      
      // List should have: date + 2 content lines + meta = 4 skeletons
      expect(progressbars).toHaveLength(4)
    })

    it('includes date section with specific width', () => {
      render(<TimelineSkeleton variant="list" />)
      
      const progressbars = screen.getAllByRole('progressbar')
      
      // Date skeleton should have specific width (80px)
      const dateSkeleton = progressbars.find(el => el.style.width === '80px')
      expect(dateSkeleton).toHaveStyle({ width: '80px', height: '16px' })
    })
  })

  describe('Detail Variant', () => {
    it('renders the detail variant with comprehensive structure', () => {
      const { container } = render(<TimelineSkeleton variant="detail" />)
      
      const rootContainer = container.firstChild as HTMLElement
      expect(rootContainer?.className).toContain('detail')
    })

    it('renders detail structure with header and multiple sections', () => {
      render(<TimelineSkeleton variant="detail" />)
      
      const progressbars = screen.getAllByRole('progressbar')
      
      // Detail should have many skeleton elements: header (date info + content) + 3 sections
      // Section 1: 4 lines, Section 2: 3 participants, Section 3: 2 evidence
      expect(progressbars.length).toBeGreaterThanOrEqual(12)
      
      // Check for SkeletonGroups in sections
      expect(screen.getAllByLabelText(/Loading line \d+ of 4/)).toHaveLength(4) // Section 1: 4 lines
    })

    it('includes date information section in detail view', () => {
      render(<TimelineSkeleton variant="detail" />)
      
      const progressbars = screen.getAllByRole('progressbar')
      
      // Should have date info skeletons (120px width for main date, 100px for time)
      const dateInfoSkeleton = progressbars.find(el => el.style.width === '120px')
      expect(dateInfoSkeleton).toHaveStyle({ width: '120px', height: '40px' })
    })

    it('shows participants and evidence sections', () => {
      render(<TimelineSkeleton variant="detail" />)
      
      const progressbars = screen.getAllByRole('progressbar')
      
      // Detail view should have substantial content for participants and evidence
      expect(progressbars.length).toBeGreaterThanOrEqual(12)
    })
  })

  describe('Props Handling', () => {
    it('handles undefined variant (defaults to card)', () => {
      const { container } = render(<TimelineSkeleton variant={undefined} />)
      
      const card = container.querySelector('[class*="card"]')
      expect(card).toBeInTheDocument()
    })

    it('handles invalid variant (defaults to card)', () => {
      const { container } = render(<TimelineSkeleton variant={'invalid' as never} />)
      
      const card = container.querySelector('[class*="card"]')
      expect(card).toBeInTheDocument()
    })

    it('handles empty className', () => {
      const { container } = render(<TimelineSkeleton className="" />)
      
      const card = container.querySelector('[class*="card"]')
      expect(card).toBeInTheDocument()
    })

    it('handles missing className prop', () => {
      render(<TimelineSkeleton />)
      
      const progressbars = screen.getAllByRole('progressbar')
      expect(progressbars.length).toBeGreaterThan(0)
    })
  })

  describe('Timeline-Specific Features', () => {
    it('renders list item structure for list variant', () => {
      render(<TimelineSkeleton variant="list" />)
      
      const progressbars = screen.getAllByRole('progressbar')
      
      // List variant should have at least 4 skeletons (icon, title, date, badge)
      expect(progressbars.length).toBeGreaterThanOrEqual(4)
    })

    it('uses rectangular skeletons for card variant icon', () => {
      render(<TimelineSkeleton variant="card" />)
      
      const progressbars = screen.getAllByRole('progressbar')
      const rectangularSkeleton = progressbars.find(el => el.className.includes('rectangular'))
      
      // Card icon should be rectangular (60x60)
      expect(rectangularSkeleton).toHaveStyle({ width: '60px', height: '60px' })
    })

    it('shows appropriate content structure per variant', () => {
      const variants: Array<'card' | 'list' | 'detail'> = ['card', 'list', 'detail']
      const expectedMinCounts = { card: 6, list: 4, detail: 12 }
      
      variants.forEach(variant => {
        const { unmount } = render(<TimelineSkeleton variant={variant} />)
        
        const progressbars = screen.getAllByRole('progressbar')
        expect(progressbars.length).toBeGreaterThanOrEqual(expectedMinCounts[variant])
        
        unmount()
      })
    })

    it('maintains consistent date-related skeleton sizing', () => {
      // List variant date skeleton
      const { rerender } = render(<TimelineSkeleton variant="list" />)
      let progressbars = screen.getAllByRole('progressbar')
      let dateSkeleton = progressbars.find(el => el.style.width === '80px')
      expect(dateSkeleton).toBeDefined()
      
      // Detail variant date skeletons  
      rerender(<TimelineSkeleton variant="detail" />)
      progressbars = screen.getAllByRole('progressbar')
      dateSkeleton = progressbars.find(el => el.style.width === '120px')
      expect(dateSkeleton).toBeDefined()
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
          expect(skeleton).toHaveAttribute('aria-label')
        })
        
        unmount()
      })
    })

    it('provides meaningful aria-labels for skeleton groups', () => {
      render(<TimelineSkeleton variant="detail" />)
      
      const groupItems = screen.getAllByLabelText(/Loading line \d+ of \d+/)
      groupItems.forEach(item => {
        expect(item.getAttribute('aria-label')).toMatch(/Loading line \d+ of \d+/)
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
      expect(listCount).toBe(4) // Specific for list: date + 2 content + meta
    })

    it('uses appropriate skeleton shapes per variant', () => {
      // Card variant should use rectangular icon
      const { rerender } = render(<TimelineSkeleton variant="card" />)
      let progressbars = screen.getAllByRole('progressbar')
      expect(progressbars.some(el => el.className.includes('rectangular'))).toBe(true)
      
      // List and detail should not have specific shape requirements beyond text skeletons
      rerender(<TimelineSkeleton variant="list" />)
      progressbars = screen.getAllByRole('progressbar')
      expect(progressbars.length).toBe(4)
      
      rerender(<TimelineSkeleton variant="detail" />)
      progressbars = screen.getAllByRole('progressbar')
      expect(progressbars.length).toBeGreaterThanOrEqual(12)
    })
  })
})