import * as React from "react"
import { CheckIcon } from "lucide-react"
import { cn } from "@/lib/utils"

// Native HTML checkbox implementation to replace Radix UI
// This fixes the React 18/19 compatibility issue

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}

function Checkbox({
  className,
  checked,
  onCheckedChange,
  onChange,
  disabled,
  ...props
}: CheckboxProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e)
    onCheckedChange?.(e.target.checked)
  }

  return (
    <div className="relative inline-flex items-center">
      <input
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        className="sr-only peer"
        {...props}
      />
      <div
        className={cn(
          "size-4 shrink-0 rounded-[4px] border shadow-xs transition-all",
          "border-input bg-transparent",
          "peer-checked:bg-primary peer-checked:text-primary-foreground peer-checked:border-primary",
          "peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2",
          "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
          className
        )}
      >
        {checked && (
          <CheckIcon className="size-3.5 absolute inset-0 m-auto" />
        )}
      </div>
    </div>
  )
}

export { Checkbox }
