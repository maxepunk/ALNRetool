 
import * as React from "react"
import { ChevronDownIcon } from "lucide-react"
import { cn } from "@/lib/utils"

// Native HTML Select implementation to replace Radix UI
// This fixes the React 18/19 compatibility issue causing infinite loops

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  onValueChange?: (value: string) => void
}

function Select({
  value,
  onChange,
  onValueChange,
  children,
  className,
  ...props
}: SelectProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange?.(e)
    onValueChange?.(e.target.value)
  }

  return (
    <div className="relative">
      <select
        value={value}
        onChange={handleChange}
        className={cn(
          "h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 pr-8 text-sm",
          "focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "appearance-none cursor-pointer",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
    </div>
  )
}

export { Select }