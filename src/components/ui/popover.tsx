/**
 * Popover Component
 * Built with framer-motion for animations instead of Radix UI
 */

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface PopoverProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

interface PopoverTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  asChild?: boolean
}

interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
  side?: 'top' | 'right' | 'bottom' | 'left'
}

// Context to manage popover state
const PopoverContext = React.createContext<{
  open: boolean
  setOpen: (open: boolean) => void
  triggerRef: React.RefObject<HTMLElement>
}>({
  open: false,
  setOpen: () => {},
  triggerRef: { current: null }
})

export function Popover({ children, open: controlledOpen, onOpenChange }: PopoverProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLElement>(null)
  
  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen
  const setOpen = React.useCallback((newOpen: boolean) => {
    if (controlledOpen === undefined) {
      setUncontrolledOpen(newOpen)
    }
    onOpenChange?.(newOpen)
  }, [controlledOpen, onOpenChange])

  // Close on escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [open, setOpen])

  // Close on click outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        const popoverEl = document.getElementById('popover-content')
        if (popoverEl && !popoverEl.contains(e.target as Node)) {
          setOpen(false)
        }
      }
    }
    if (open) {
      // Delay to prevent immediate close on open
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside)
      }, 0)
      return () => {
        clearTimeout(timer)
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [open, setOpen])

  return (
    <PopoverContext.Provider value={{ open, setOpen, triggerRef }}>
      <div className="relative inline-block">
        {children}
      </div>
    </PopoverContext.Provider>
  )
}

export function PopoverTrigger({ 
  children, 
  className, 
  asChild = false,
  ...props 
}: PopoverTriggerProps) {
  const { open, setOpen, triggerRef } = React.useContext(PopoverContext)
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setOpen(!open)
    props.onClick?.(e)
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      ref: triggerRef,
      onClick: handleClick,
      'aria-expanded': open,
      'aria-haspopup': 'dialog',
    })
  }

  return (
    <button
      ref={triggerRef as React.RefObject<HTMLButtonElement>}
      className={className}
      onClick={handleClick}
      aria-expanded={open}
      aria-haspopup="dialog"
      {...props}
    >
      {children}
    </button>
  )
}

export function PopoverContent({ 
  children, 
  className,
  align = 'center',
  sideOffset = 4,
  side = 'bottom'
}: PopoverContentProps) {
  const { open, triggerRef } = React.useContext(PopoverContext)
  const [position, setPosition] = React.useState({ top: 0, left: 0 })

  React.useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      let top = 0
      let left = 0
      
      // Calculate position based on side
      switch (side) {
        case 'bottom':
          top = rect.bottom + sideOffset
          break
        case 'top':
          top = rect.top - sideOffset
          break
        case 'left':
          left = rect.left - sideOffset
          top = rect.top
          break
        case 'right':
          left = rect.right + sideOffset
          top = rect.top
          break
      }
      
      // Adjust horizontal position based on align
      if (side === 'bottom' || side === 'top') {
        if (align === 'start') {
          left = rect.left
        } else if (align === 'center') {
          left = rect.left + rect.width / 2
        } else if (align === 'end') {
          left = rect.right
        }
      }
      
      // Adjust vertical position based on align for left/right sides
      if (side === 'left' || side === 'right') {
        if (align === 'start') {
          top = rect.top
        } else if (align === 'center') {
          top = rect.top + rect.height / 2
        } else if (align === 'end') {
          top = rect.bottom
        }
      }
      
      setPosition({ top, left })
    }
  }, [open, align, sideOffset, side, triggerRef])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          id="popover-content"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.1 }}
          className={cn(
            "absolute z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none",
            align === 'center' && (side === 'bottom' || side === 'top') && '-translate-x-1/2',
            align === 'end' && (side === 'bottom' || side === 'top') && '-translate-x-full',
            align === 'center' && (side === 'left' || side === 'right') && '-translate-y-1/2',
            align === 'end' && (side === 'left' || side === 'right') && '-translate-y-full',
            side === 'top' && '-translate-y-full',
            side === 'left' && '-translate-x-full',
            className
          )}
          style={{
            position: 'fixed',
            top: `${position.top}px`,
            left: `${position.left}px`,
          }}
          data-state={open ? 'open' : 'closed'}
          data-side={side}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Additional exports for compatibility
export const PopoverAnchor = ({ children }: { children: React.ReactNode }) => children
export const PopoverArrow = () => null // Arrow not implemented in this version