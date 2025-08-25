import * as React from "react"
import { cn } from "@/lib/utils"

// Native HTML switch implementation to replace Radix UI
// This fixes the React 18/19 compatibility issue

interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onCheckedChange?: (checked: boolean) => void
}

function Switch({
  className,
  checked,
  defaultChecked,
  onCheckedChange,
  onChange,
  disabled,
  ...props
}: SwitchProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e)
    onCheckedChange?.(e.target.checked)
  }

  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        defaultChecked={defaultChecked}
        onChange={handleChange}
        disabled={disabled}
        {...props}
      />
      <div
        className={cn(
          "relative inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full",
          "border border-transparent shadow-xs transition-all outline-none",
          "peer-checked:bg-primary peer-not-checked:bg-input",
          "peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring/50",
          "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
          "dark:peer-not-checked:bg-input/80",
          className
        )}
      >
        <span
          className={cn(
            "pointer-events-none block size-4 rounded-full transition-transform",
            "bg-background dark:peer-not-checked:bg-foreground dark:peer-checked:bg-primary-foreground",
            "peer-checked:translate-x-[calc(100%-2px)] peer-not-checked:translate-x-0"
          )}
        />
      </div>
    </label>
  )
}

export { Switch }