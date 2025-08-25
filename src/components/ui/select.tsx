/* eslint-disable react/prop-types */
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

// Wrapper div to maintain consistent API with previous implementation
// This component is now deprecated - use Select directly with className
function SelectTrigger({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { size?: "sm" | "default" }) {
  // If children is a Select component, just return it with the className
  if (React.isValidElement(children) && children.type === Select) {
    return React.cloneElement(children as React.ReactElement<any>, {
      className: cn(children.props.className, className),
    })
  }
  
  // Otherwise, wrap it (for backward compatibility)
  return (
    <div className={cn("relative", className)} {...props}>
      {children}
      <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
    </div>
  )
}

// Simple pass-through component for SelectValue
function SelectValue({ 
  placeholder,
  ...props 
}: React.HTMLAttributes<HTMLSpanElement> & { placeholder?: string }) {
  return null // Native select handles this internally
}

// Native option wrapper
function SelectItem({
  children,
  value,
  ...props
}: React.OptionHTMLAttributes<HTMLOptionElement>) {
  return (
    <option value={value} {...props}>
      {children}
    </option>
  )
}

// Container for options - just passes through children
function SelectContent({ 
  children,
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) {
  return <>{children}</>
}

// Group wrapper for semantic grouping
function SelectGroup({ 
  children,
  ...props 
}: React.HTMLAttributes<HTMLOptGroupElement>) {
  return <optgroup {...props}>{children}</optgroup>
}

// Label for option groups
function SelectLabel({
  children,
  ...props
}: React.HTMLAttributes<HTMLOptGroupElement>) {
  return <optgroup label={children?.toString()} disabled {...props} />
}

// Separator - not supported in native select, return null
function SelectSeparator() {
  return null
}

// Scroll buttons - not needed for native select
function SelectScrollUpButton() {
  return null
}

function SelectScrollDownButton() {
  return null
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}