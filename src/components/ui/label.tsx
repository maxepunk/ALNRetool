import * as React from "react"
import { cn } from "@/lib/utils"

// Native HTML label implementation to replace Radix UI
// This fixes the React 18/19 compatibility issue

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

function Label({
  className,
  ...props
}: LabelProps) {
  return (
    <label
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none",
        "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Label }
