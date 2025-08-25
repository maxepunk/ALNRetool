import * as React from "react"
import { cn } from "@/lib/utils"

// Native HTML separator implementation to replace Radix UI
// This fixes the React 18/19 compatibility issue

interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical"
  decorative?: boolean
}

function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: SeparatorProps) {
  return (
    <div
      role={decorative ? "none" : "separator"}
      aria-orientation={decorative ? undefined : orientation}
      className={cn(
        "bg-border shrink-0",
        orientation === "horizontal" 
          ? "h-px w-full" 
          : "h-full w-px",
        className
      )}
      {...props}
    />
  )
}

export { Separator }