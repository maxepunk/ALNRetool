/**
 * Dropdown Menu Component
 * Built with framer-motion for animations instead of Radix UI
 */

import * as React from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface DropdownMenuProps {
  children: React.ReactNode
}

interface DropdownMenuTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  asChild?: boolean
}

interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
}

interface DropdownMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  disabled?: boolean
}

// Context to manage dropdown state
const DropdownMenuContext = React.createContext<{
  open: boolean
  setOpen: (open: boolean) => void
  triggerRef: React.RefObject<HTMLButtonElement>
}>({
  open: false,
  setOpen: () => {},
  triggerRef: { current: null }
})

export function DropdownMenu({ children }: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLButtonElement>(null)

  // Close on escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  // Close on click outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        const dropdownEl = document.getElementById('dropdown-content')
        if (dropdownEl && !dropdownEl.contains(e.target as Node)) {
          setOpen(false)
        }
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen, triggerRef }}>
      <div className="relative inline-block">
        {children}
      </div>
    </DropdownMenuContext.Provider>
  )
}

export function DropdownMenuTrigger({ 
  children, 
  className, 
  asChild = false,
  ...props 
}: DropdownMenuTriggerProps) {
  const { open, setOpen, triggerRef } = React.useContext(DropdownMenuContext)
  
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
      'aria-haspopup': 'menu',
    })
  }

  return (
    <button
      ref={triggerRef}
      className={className}
      onClick={handleClick}
      aria-expanded={open}
      aria-haspopup="menu"
      {...props}
    >
      {children}
    </button>
  )
}

export function DropdownMenuContent({ 
  children, 
  className,
  align = 'center',
  sideOffset = 4,
}: DropdownMenuContentProps) {
  const { open, triggerRef } = React.useContext(DropdownMenuContext)
  const [position, setPosition] = React.useState({ top: 0, left: 0 })

  React.useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const top = rect.bottom + sideOffset
      
      let left = rect.left
      if (align === 'center') {
        left = rect.left + rect.width / 2
      } else if (align === 'end') {
        left = rect.right
      }
      
      setPosition({ top, left })
    }
  }, [open, align, sideOffset, triggerRef])

  return (
    <AnimatePresence>
      {open && createPortal(
        <motion.div
          id="dropdown-content"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.1 }}
          className={cn(
            "z-[100] min-w-[8rem] rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
            align === 'center' && '-translate-x-1/2',
            align === 'end' && '-translate-x-full',
            className
          )}
          style={{
            position: 'fixed',
            top: `${position.top}px`,
            left: `${position.left}px`,
            pointerEvents: 'auto',
          }}
        >
          {children}
        </motion.div>,
        document.body
      )}
    </AnimatePresence>
  )
}

export function DropdownMenuItem({ 
  children, 
  className,
  disabled = false,
  onClick,
  ...props 
}: DropdownMenuItemProps) {
  const { setOpen } = React.useContext(DropdownMenuContext)
  
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;
    
    onClick?.(e)
    setOpen(false)
  }

  return (
    <div
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
        !disabled && "hover:bg-accent hover:text-accent-foreground",
        !disabled && "focus:bg-accent focus:text-accent-foreground",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onClick={handleClick}
      onMouseDown={(e) => e.preventDefault()}
      role="menuitem"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      {...props}
    >
      {children}
    </div>
  )
}

export function DropdownMenuSeparator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("-mx-1 my-1 h-px bg-muted", className)}
      role="separator"
      {...props}
    />
  )
}

export function DropdownMenuLabel({ 
  children, 
  className,
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("px-2 py-1.5 text-sm font-semibold", className)}
      {...props}
    >
      {children}
    </div>
  )
}

// Additional components for compatibility
export const DropdownMenuPortal = ({ children }: { children: React.ReactNode }) => children
export const DropdownMenuGroup = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div {...props}>{children}</div>
)
export const DropdownMenuSub = DropdownMenu
export const DropdownMenuSubContent = DropdownMenuContent
export const DropdownMenuSubTrigger = DropdownMenuItem
export const DropdownMenuRadioGroup = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div role="radiogroup" {...props}>{children}</div>
)
export const DropdownMenuRadioItem = DropdownMenuItem
export const DropdownMenuCheckboxItem = DropdownMenuItem
export const DropdownMenuShortcut = ({ children, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span className="ml-auto text-xs tracking-widest opacity-60" {...props}>{children}</span>
)