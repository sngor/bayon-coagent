"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

import { useIsMobile } from "@/hooks/use-mobile"

// Style constants for better maintainability and type safety
const SWITCH_STYLES = {
  root: {
    base: "peer inline-flex h-7 w-12 cursor-pointer items-center rounded-lg border-2 transition-all duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
    mobile: "min-h-[44px] min-w-[48px] touch-manipulation",
    unchecked: [
      "data-[state=unchecked]:bg-transparent dark:data-[state=unchecked]:bg-transparent",
      "data-[state=unchecked]:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3),inset_0_-2px_4px_rgba(0,0,0,0.1)] dark:data-[state=unchecked]:shadow-[inset_0_2px_6px_rgba(0,0,0,0.6),inset_0_-2px_4px_rgba(0,0,0,0.3)]",
      "data-[state=unchecked]:border-transparent dark:data-[state=unchecked]:border-transparent"
    ] as const,
    checked: [
      "data-[state=checked]:bg-gradient-to-b data-[state=checked]:from-green-400 data-[state=checked]:to-green-500 dark:data-[state=checked]:from-green-500 dark:data-[state=checked]:to-green-600",
      "data-[state=checked]:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2),inset_0_-2px_4px_rgba(0,0,0,0.1)] dark:data-[state=checked]:shadow-[inset_0_2px_6px_rgba(0,0,0,0.4),inset_0_-2px_4px_rgba(0,0,0,0.2)]",
      "data-[state=checked]:border-green-500 dark:data-[state=checked]:border-green-400"
    ] as const
  },
  thumb: {
    base: "pointer-events-none block h-5 w-5 transition-all duration-300 ease-in-out",
    appearance: "rounded-sm bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-200 dark:to-gray-300",
    shadow: "shadow-md shadow-gray-600/30 dark:shadow-gray-900/50",
    movement: "data-[state=checked]:translate-x-6 data-[state=unchecked]:translate-x-0.5",
    depth: "relative drop-shadow-sm"
  }
} as const satisfies Record<string, Record<string, string | readonly string[]>>

/**
 * Enhanced switch component with realistic toggle design that provides smooth animations and tactile feedback.
 * 
 * Features:
 * - Horizontal toggle design (12×7) with left-to-right thumb movement
 * - Physical realism with recessed track and enhanced inset shadows
 * - Smooth 300ms transitions with ease-in-out timing
 * - Green gradient when active, transparent when inactive
 * - Dark mode support with automatic color adaptation
 * - Mobile-optimized with proper touch targets (44px minimum)
 * - Full accessibility support with keyboard navigation and screen reader compatibility
 * - Touch optimized for mobile devices with touch-manipulation
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <Switch checked={enabled} onCheckedChange={setEnabled} />
 * 
 * // With form integration (common in Brand/Settings hubs)
 * <div className="flex items-center space-x-2">
 *   <Switch id="notifications" checked={enabled} onCheckedChange={setEnabled} />
 *   <Label htmlFor="notifications">Enable notifications</Label>
 * </div>
 * 
 * // In settings forms (Brand hub pattern)
 * <div className="flex items-center justify-between">
 *   <div className="space-y-0.5">
 *     <Label htmlFor="dark-mode">Dark Mode</Label>
 *     <p className="text-sm text-muted-foreground">
 *       Toggle between light and dark themes
 *     </p>
 *   </div>
 *   <Switch id="dark-mode" checked={darkMode} onCheckedChange={setDarkMode} />
 * </div>
 * ```
 */

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => {
  const isMobile = useIsMobile()
  
  // Memoize computed styles to prevent recalculation on every render
  const rootClassName = React.useMemo(() => cn(
    SWITCH_STYLES.root.base,
    // Mobile touch optimization - ensure minimum 44px touch target
    isMobile && SWITCH_STYLES.root.mobile,
    // Physical switch track styling - horizontal track with enhanced inset shadow
    ...SWITCH_STYLES.root.unchecked,
    ...SWITCH_STYLES.root.checked,
    className
  ), [isMobile, className])

  const thumbClassName = React.useMemo(() => cn(
    SWITCH_STYLES.thumb.base,
    SWITCH_STYLES.thumb.appearance,
    SWITCH_STYLES.thumb.shadow,
    SWITCH_STYLES.thumb.movement,
    SWITCH_STYLES.thumb.depth
  ), [])
  
  return (
    <SwitchPrimitives.Root
      className={rootClassName}
      {...props}
      ref={ref}
    >
      <SwitchPrimitives.Thumb className={thumbClassName} />
    </SwitchPrimitives.Root>
  )
})
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }