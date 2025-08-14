import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LoadingSkeleton, SkeletonGroup } from './LoadingSkeleton'

describe('LoadingSkeleton', () => {
  describe('Default Behavior', () => {
    it('renders with default values', () => {
      render(<LoadingSkeleton />)
      const skeletonEl = screen.getByRole('progressbar')
      
      expect(skeletonEl).toHaveAttribute('aria-label', 'Loading...')
      expect(skeletonEl).toHaveAttribute('aria-busy', 'true')
      expect(skeletonEl).toHaveAttribute('role', 'progressbar')
      expect(skeletonEl).toHaveStyle({ width: '100%', height: '16px' })
    })

    it('applies default text variant CSS class', () => {
      render(<LoadingSkeleton />)
      const skeletonEl = screen.getByRole('progressbar')
      
      expect(skeletonEl.className).toContain('skeleton')
      expect(skeletonEl.className).toContain('text')
    })
  })

  describe('Variant Handling', () => {
    it('applies circular variant CSS class and custom dimensions', () => {
      render(<LoadingSkeleton variant="circular" width={40} height={40} />)
      const skeletonEl = screen.getByRole('progressbar')
      
      expect(skeletonEl.className).toContain('circular')
      expect(skeletonEl).toHaveStyle({ width: '40px', height: '40px' })
    })

    it('applies rectangular variant CSS class', () => {
      render(<LoadingSkeleton variant="rectangular" width="80%" height="2rem" />)
      const skeletonEl = screen.getByRole('progressbar')
      
      expect(skeletonEl.className).toContain('rectangular')
      expect(skeletonEl).toHaveStyle({ width: '80%', height: '32px' })
    })

    it('applies text variant CSS class explicitly', () => {
      render(<LoadingSkeleton variant="text" />)
      const skeletonEl = screen.getByRole('progressbar')
      
      expect(skeletonEl.className).toContain('text')
    })
  })

  describe('Props Handling', () => {
    it('accepts custom aria-label', () => {
      render(<LoadingSkeleton aria-label="Custom loading message" />)
      const skeletonEl = screen.getByRole('progressbar')
      
      expect(skeletonEl).toHaveAttribute('aria-label', 'Custom loading message')
    })

    it('combines custom className with base classes', () => {
      render(<LoadingSkeleton className="custom-test-class" />)
      const skeletonEl = screen.getByRole('progressbar')
      
      expect(skeletonEl.className).toContain('skeleton')
      expect(skeletonEl.className).toContain('text')
      expect(skeletonEl.className).toContain('custom-test-class')
    })

    it('handles numeric width and height values', () => {
      render(<LoadingSkeleton width={120} height={24} />)
      const skeletonEl = screen.getByRole('progressbar')
      
      expect(skeletonEl).toHaveStyle({ width: '120px', height: '24px' })
    })

    it('handles string width and height values', () => {
      render(<LoadingSkeleton width="75%" height="1.5rem" />)
      const skeletonEl = screen.getByRole('progressbar')
      
      expect(skeletonEl).toHaveStyle({ width: '75%', height: '24px' })
    })
  })

  describe('Edge Cases', () => {
    it('handles zero dimensions', () => {
      render(<LoadingSkeleton width={0} height={0} />)
      const skeletonEl = screen.getByRole('progressbar')
      
      expect(skeletonEl).toHaveStyle({ width: '0px', height: '0px' })
    })

    it('handles empty custom className', () => {
      render(<LoadingSkeleton className="" />)
      const skeletonEl = screen.getByRole('progressbar')
      
      expect(skeletonEl.className).toContain('skeleton')
      expect(skeletonEl.className).toContain('text')
    })

    it('handles empty aria-label', () => {
      render(<LoadingSkeleton aria-label="" />)
      const skeletonEl = screen.getByRole('progressbar')
      
      expect(skeletonEl).toHaveAttribute('aria-label', '')
    })
  })
})

describe('SkeletonGroup', () => {
  describe('Default Behavior', () => {
    it('renders default number of lines (3) with proper aria-labels', () => {
      render(<SkeletonGroup />)
      const skeletons = screen.getAllByRole('progressbar')
      
      expect(skeletons).toHaveLength(3)
      skeletons.forEach((el, index) => {
        expect(el).toHaveAttribute('aria-label', `Loading line ${index + 1} of 3`)
      })
    })

    it('applies default spacing style', () => {
      render(<SkeletonGroup />)
      const container = screen.getAllByRole('progressbar')[0]!.parentElement!
      
      expect(container).toHaveStyle({
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      })
    })

    it('sets last line to 60% width and others to 100%', () => {
      render(<SkeletonGroup />)
      const skeletons = screen.getAllByRole('progressbar')
      
      // First two lines should be 100% width
      expect(skeletons[0]).toHaveStyle({ width: '100%' })
      expect(skeletons[1]).toHaveStyle({ width: '100%' })
      // Last line should be 60% width
      expect(skeletons[2]).toHaveStyle({ width: '60%' })
    })
  })

  describe('Custom Props', () => {
    it('renders custom number of lines with correct aria-labels', () => {
      const customLines = 5
      render(<SkeletonGroup lines={customLines} />)
      const skeletons = screen.getAllByRole('progressbar')
      
      expect(skeletons).toHaveLength(customLines)
      skeletons.forEach((el, index) => {
        expect(el).toHaveAttribute('aria-label', `Loading line ${index + 1} of ${customLines}`)
      })
    })

    it('applies custom spacing', () => {
      render(<SkeletonGroup spacing="1rem" />)
      const container = screen.getAllByRole('progressbar')[0]!.parentElement!
      
      expect(container).toHaveStyle({ gap: '1rem' })
    })

    it('applies custom className to container', () => {
      render(<SkeletonGroup className="custom-group-class" />)
      const container = screen.getAllByRole('progressbar')[0]!.parentElement!
      
      expect(container.className).toContain('custom-group-class')
    })

    it('sets last line width correctly with custom line count', () => {
      const customLines = 7
      render(<SkeletonGroup lines={customLines} />)
      const skeletons = screen.getAllByRole('progressbar')
      
      // All but last should be 100% width
      for (let i = 0; i < customLines - 1; i++) {
        expect(skeletons[i]).toHaveStyle({ width: '100%' })
      }
      // Last line should be 60% width
      expect(skeletons[customLines - 1]).toHaveStyle({ width: '60%' })
    })
  })

  describe('Edge Cases', () => {
    it('handles single line (lines=1)', () => {
      render(<SkeletonGroup lines={1} />)
      const skeletons = screen.getAllByRole('progressbar')
      
      expect(skeletons).toHaveLength(1)
      expect(skeletons[0]).toHaveAttribute('aria-label', 'Loading line 1 of 1')
      // Single line should still get 60% width (it's the "last" line)
      expect(skeletons[0]).toHaveStyle({ width: '60%' })
    })

    it('handles zero lines', () => {
      render(<SkeletonGroup lines={0} />)
      const container = document.querySelector('[style*="flex"]')
      
      expect(container?.children).toHaveLength(0)
      expect(screen.queryAllByRole('progressbar')).toHaveLength(0)
    })

    it('handles large line count', () => {
      const largeLines = 20
      render(<SkeletonGroup lines={largeLines} />)
      const skeletons = screen.getAllByRole('progressbar')
      
      expect(skeletons).toHaveLength(largeLines)
      // Verify first, middle, and last lines
      expect(skeletons[0]).toHaveStyle({ width: '100%' })
      expect(skeletons[10]).toHaveStyle({ width: '100%' })
      expect(skeletons[largeLines - 1]).toHaveStyle({ width: '60%' })
    })

    it('handles empty spacing string', () => {
      render(<SkeletonGroup spacing="" />)
      const container = screen.getAllByRole('progressbar')[0]!.parentElement!
      
      expect(container).toHaveStyle({ gap: '' })
    })
  })
})