"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils/common"
import { triggerHapticFeedback } from "@/lib/mobile-optimization"

const touchButtonVariants = cva(
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 touch-manipulation disabled:opacity-50 disabled:pointer-events-none active:scale-95",
    {
        variants: {
            variant: {
                primary: "bg-primary text-primary-foreground hover:bg-primary-hover shadow-md active:shadow-sm",
                secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm",
                outline: "border-2 border-input bg-background hover:bg-accent hover:text-accent-foreground",
                ghost: "hover:bg-accent hover:text-accent-foreground",
                destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md",
                success: "bg-success text-success-foreground hover:bg-success-hover shadow-md",
            },
            size: {
                sm: "min-h-[40px] min-w-[40px] px-3 text-sm",
                default: "min-h-[44px] min-w-[44px] px-4 text-base",
                lg: "min-h-[52px] min-w-[52px] px-6 text-lg",
                xl: "min-h-[60px] min-w-[60px] px-8 text-xl",
                icon: "h-[44px] w-[44px]",
            },
            fullWidth: {
                true: "w-full",
                false: "",
            },
        },
        defaultVariants: {
            variant: "primary",
            size: "default",
            fullWidth: false,
        },
    }
)

export interface TouchButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof touchButtonVariants> {
    loading?: boolean
    hapticFeedback?: boolean | number | number[]
    icon?: React.ReactNode
    iconPosition?: "left" | "right"
}

/**
 * Touch-optimized button component for mobile interfaces
 * 
 * Features:
 * - Minimum 44x44px touch target (WCAG compliant)
 * - Haptic feedback on tap
 * - Loading state with spinner
 * - Active state animation
 * - Icon support
 * 
 * Requirements: 8.3 (touch-optimized editing controls)
 */
export const TouchButton = React.forwardRef<HTMLButtonElement, TouchButtonProps>(
    (
        {
            className,
            variant,
            size,
            fullWidth,
            loading = false,
            hapticFeedback = true,
            icon,
            iconPosition = "left",
            onClick,
            children,
            ...props
        },
        ref
    ) => {
        const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
            if (loading || props.disabled) return

            // Trigger haptic feedback
            if (hapticFeedback) {
                if (typeof hapticFeedback === "boolean") {
                    triggerHapticFeedback(10)
                } else {
                    triggerHapticFeedback(hapticFeedback)
                }
            }

            onClick?.(e)
        }

        return (
            <button
                ref={ref}
                className={cn(touchButtonVariants({ variant, size, fullWidth, className }))}
                onClick={handleClick}
                disabled={props.disabled || loading}
                {...props}
            >
                {loading && <Loader2 className="h-5 w-5 animate-spin" />}
                {!loading && icon && iconPosition === "left" && icon}
                {children}
                {!loading && icon && iconPosition === "right" && icon}
            </button>
        )
    }
)
TouchButton.displayName = "TouchButton"

interface TouchButtonGroupProps {
    children: React.ReactNode
    orientation?: "horizontal" | "vertical"
    className?: string
}

/**
 * Group of touch buttons with proper spacing
 * 
 * Requirements: 8.3 (touch-optimized editing controls)
 */
export function TouchButtonGroup({
    children,
    orientation = "horizontal",
    className,
}: TouchButtonGroupProps) {
    return (
        <div
            className={cn(
                "flex gap-3",
                orientation === "vertical" ? "flex-col" : "flex-row flex-wrap",
                className
            )}
        >
            {children}
        </div>
    )
}

interface FloatingActionButtonProps extends TouchButtonProps {
    position?: "bottom-right" | "bottom-left" | "bottom-center"
}

/**
 * Floating action button for primary mobile actions
 * 
 * Requirements: 4.1, 8.3
 */
export function FloatingActionButton({
    position = "bottom-right",
    className,
    ...props
}: FloatingActionButtonProps) {
    const positionClasses = {
        "bottom-right": "bottom-6 right-6",
        "bottom-left": "bottom-6 left-6",
        "bottom-center": "bottom-6 left-1/2 -translate-x-1/2",
    }

    return (
        <TouchButton
            size="lg"
            className={cn(
                "fixed z-40 shadow-2xl rounded-full",
                positionClasses[position],
                className
            )}
            {...props}
        />
    )
}

interface SegmentedControlProps {
    options: Array<{ value: string; label: string; icon?: React.ReactNode }>
    value: string
    onChange: (value: string) => void
    className?: string
}

/**
 * Segmented control for mobile option selection
 * 
 * Requirements: 8.3 (touch-optimized editing controls)
 */
export function SegmentedControl({
    options,
    value,
    onChange,
    className,
}: SegmentedControlProps) {
    return (
        <div
            className={cn(
                "inline-flex bg-muted rounded-lg p-1 gap-1",
                className
            )}
            role="tablist"
        >
            {options.map((option) => (
                <button
                    key={option.value}
                    role="tab"
                    aria-selected={value === option.value ? "true" : "false"}
                    onClick={() => {
                        triggerHapticFeedback(10)
                        onChange(option.value)
                    }}
                    className={cn(
                        "flex items-center justify-center gap-2 px-4 min-h-[44px] rounded-md font-medium transition-all touch-manipulation",
                        value === option.value
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    {option.icon}
                    {option.label}
                </button>
            ))}
        </div>
    )
}
