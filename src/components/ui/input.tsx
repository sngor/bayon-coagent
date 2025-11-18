
"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { AlertCircle } from "lucide-react"
import { getInputType } from "@/lib/mobile-optimization"

const inputVariants = cva(
  // Mobile-optimized: min-h-[44px] for touch targets, text-base on mobile to prevent zoom, touch-manipulation
  "flex min-h-[44px] w-full rounded-md border bg-background px-3 py-2 text-base sm:text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 touch-manipulation",
  {
    variants: {
      variant: {
        default:
          "border-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:border-primary",
        error:
          "border-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2",
        success:
          "border-green-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface InputProps
  extends Omit<React.ComponentProps<"input">, "size">,
  VariantProps<typeof inputVariants> {
  error?: string
  helperText?: string
  label?: string
  required?: boolean
  showErrorIcon?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      variant,
      error,
      helperText,
      label,
      required,
      showErrorIcon = true,
      id,
      name,
      ...props
    },
    ref
  ) => {
    const inputId = id || React.useId()
    const errorId = `${inputId}-error`
    const helperId = `${inputId}-helper`
    const hasError = !!error

    // Auto-detect appropriate input type for mobile keyboards if not specified
    // This ensures proper mobile keyboard (email, tel, url, etc.) based on field name
    const inputType = type || (name || id ? getInputType(name || id || '') : 'text');

    // Determine variant based on error state
    const effectiveVariant = hasError ? "error" : variant

    // Build aria-describedby
    const ariaDescribedBy = React.useMemo(() => {
      const ids: string[] = []
      if (helperText) ids.push(helperId)
      if (error) ids.push(errorId)
      return ids.length > 0 ? ids.join(" ") : undefined
    }, [helperText, error, helperId, errorId])

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2 block"
          >
            {label}
            {required && (
              <span className="text-destructive ml-1" aria-label="required">
                *
              </span>
            )}
          </label>
        )}
        <div className="relative">
          <input
            type={inputType}
            id={inputId}
            name={name}
            className={cn(
              inputVariants({ variant: effectiveVariant }),
              hasError && showErrorIcon && "pr-10",
              className
            )}
            ref={ref}
            {...(hasError && { "aria-invalid": true })}
            {...(ariaDescribedBy && { "aria-describedby": ariaDescribedBy })}
            {...(required && { "aria-required": true })}
            {...props}
          />
          {hasError && showErrorIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <AlertCircle
                className="h-4 w-4 text-destructive"
                aria-hidden="true"
              />
            </div>
          )}
        </div>
        {helperText && !error && (
          <p
            id={helperId}
            className="text-sm text-muted-foreground mt-1.5"
            role="note"
          >
            {helperText}
          </p>
        )}
        {error && (
          <p
            id={errorId}
            className="text-sm font-medium text-destructive mt-1.5 flex items-start gap-1"
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input, inputVariants }
