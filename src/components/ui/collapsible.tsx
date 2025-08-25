import * as React from "react"
import { cn } from "@/lib/utils"

// Native HTML collapsible implementation to replace Radix UI
// This fixes the React 18/19 compatibility issue with Slot component

interface CollapsibleProps extends React.HTMLAttributes<HTMLDivElement> {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  defaultOpen?: boolean
}

const CollapsibleContext = React.createContext<{
  open: boolean
  toggle: () => void
}>({
  open: false,
  toggle: () => {},
})

function Collapsible({
  className,
  open: controlledOpen,
  onOpenChange,
  defaultOpen = false,
  children,
  ...props
}: CollapsibleProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen
  
  const toggle = React.useCallback(() => {
    const newOpen = !open
    if (controlledOpen === undefined) {
      setUncontrolledOpen(newOpen)
    }
    onOpenChange?.(newOpen)
  }, [open, controlledOpen, onOpenChange])
  
  return (
    <CollapsibleContext.Provider value={{ open, toggle }}>
      <div className={cn("", className)} {...props}>
        {children}
      </div>
    </CollapsibleContext.Provider>
  )
}

interface CollapsibleTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

function CollapsibleTrigger({
  className,
  onClick,
  children,
  ...props
}: CollapsibleTriggerProps) {
  const { toggle } = React.useContext(CollapsibleContext)
  
  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center text-sm font-medium transition-all",
        className
      )}
      onClick={(e) => {
        toggle()
        onClick?.(e)
      }}
      {...props}
    >
      {children}
    </button>
  )
}

interface CollapsibleContentProps extends React.HTMLAttributes<HTMLDivElement> {}

function CollapsibleContent({
  className,
  children,
  ...props
}: CollapsibleContentProps) {
  const { open } = React.useContext(CollapsibleContext)
  
  if (!open) return null
  
  return (
    <div
      className={cn(
        "overflow-hidden transition-all",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }