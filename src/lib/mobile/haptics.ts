/**
 * Haptic Feedback Utilities for Mobile Devices
 * 
 * Provides a comprehensive API for haptic feedback on mobile devices.
 * Falls back gracefully on devices that don't support haptics.
 * 
 * Requirements: 4.1, 5.1, 5.2, 8.3
 */

/**
 * Check if the device supports haptic feedback
 */
export function supportsHaptics(): boolean {
    if (typeof window === "undefined") return false
    return "vibrate" in navigator
}

/**
 * Haptic feedback patterns
 */
export const HapticPatterns = {
    // Light tap (10ms)
    light: 10,

    // Medium tap (20ms)
    medium: 20,

    // Heavy tap (30ms)
    heavy: 30,

    // Success pattern (short-pause-short)
    success: [10, 50, 10] as number[],

    // Error pattern (long-pause-long)
    error: [30, 50, 30] as number[],

    // Warning pattern (short-short-pause-short)
    warning: [10, 30, 10, 30, 10] as number[],

    // Selection pattern (very light)
    selection: 5,

    // Impact pattern (medium-short-light)
    impact: [20, 30, 10] as number[],

    // Notification pattern (light-pause-light-pause-light)
    notification: [10, 100, 10, 100, 10] as number[],

    // Long press pattern (increasing intensity)
    longPress: [10, 50, 20, 50, 30] as number[],
} as const

/**
 * Trigger haptic feedback with a pattern
 */
export function haptic(pattern: number | number[] = HapticPatterns.light): void {
    if (!supportsHaptics()) return

    try {
        navigator.vibrate(pattern)
    } catch (error) {
        // Silently fail if vibration is not supported or blocked
        console.debug("Haptic feedback failed:", error)
    }
}

/**
 * Haptic feedback for common UI interactions
 */
export const HapticFeedback = {
    /**
     * Light tap for button presses
     */
    tap: () => haptic(HapticPatterns.light),

    /**
     * Medium tap for important actions
     */
    press: () => haptic(HapticPatterns.medium),

    /**
     * Heavy tap for critical actions
     */
    heavyPress: () => haptic(HapticPatterns.heavy),

    /**
     * Success feedback
     */
    success: () => haptic(HapticPatterns.success),

    /**
     * Error feedback
     */
    error: () => haptic(HapticPatterns.error),

    /**
     * Warning feedback
     */
    warning: () => haptic(HapticPatterns.warning),

    /**
     * Selection feedback (e.g., selecting an item from a list)
     */
    selection: () => haptic(HapticPatterns.selection),

    /**
     * Impact feedback (e.g., drag and drop)
     */
    impact: () => haptic(HapticPatterns.impact),

    /**
     * Notification feedback
     */
    notification: () => haptic(HapticPatterns.notification),

    /**
     * Long press feedback
     */
    longPress: () => haptic(HapticPatterns.longPress),

    /**
     * Cancel any ongoing vibration
     */
    cancel: () => {
        if (supportsHaptics()) {
            navigator.vibrate(0)
        }
    },
} as const

/**
 * React hook for haptic feedback
 */
export function useHaptics() {
    return {
        supported: supportsHaptics(),
        trigger: haptic,
        patterns: HapticPatterns,
        feedback: HapticFeedback,
    }
}

/**
 * Higher-order function to add haptic feedback to any function
 */
export function withHaptics<T extends (...args: any[]) => any>(
    fn: T,
    pattern: number | number[] = HapticPatterns.light
): T {
    return ((...args: Parameters<T>) => {
        haptic(pattern)
        return fn(...args)
    }) as T
}

/**
 * Debounced haptic feedback to prevent excessive vibration
 */
let lastHapticTime = 0
const HAPTIC_DEBOUNCE_MS = 50

export function debouncedHaptic(pattern: number | number[] = HapticPatterns.light): void {
    const now = Date.now()
    if (now - lastHapticTime < HAPTIC_DEBOUNCE_MS) {
        return
    }
    lastHapticTime = now
    haptic(pattern)
}

/**
 * Haptic feedback for gesture events
 */
export const GestureHaptics = {
    /**
     * Swipe start
     */
    swipeStart: () => haptic(HapticPatterns.light),

    /**
     * Swipe end
     */
    swipeEnd: () => haptic(HapticPatterns.medium),

    /**
     * Pinch start
     */
    pinchStart: () => haptic(HapticPatterns.light),

    /**
     * Pinch end
     */
    pinchEnd: () => haptic(HapticPatterns.medium),

    /**
     * Drag start
     */
    dragStart: () => haptic(HapticPatterns.light),

    /**
     * Drag end
     */
    dragEnd: () => haptic(HapticPatterns.medium),

    /**
     * Snap to position
     */
    snap: () => haptic(HapticPatterns.selection),

    /**
     * Boundary reached
     */
    boundary: () => haptic(HapticPatterns.warning),
} as const

/**
 * Haptic feedback for form interactions
 */
export const FormHaptics = {
    /**
     * Input focus
     */
    focus: () => haptic(HapticPatterns.selection),

    /**
     * Input blur
     */
    blur: () => haptic(HapticPatterns.selection),

    /**
     * Form submission
     */
    submit: () => haptic(HapticPatterns.medium),

    /**
     * Validation error
     */
    validationError: () => haptic(HapticPatterns.error),

    /**
     * Validation success
     */
    validationSuccess: () => haptic(HapticPatterns.success),

    /**
     * Toggle switch
     */
    toggle: () => haptic(HapticPatterns.light),

    /**
     * Checkbox/radio selection
     */
    check: () => haptic(HapticPatterns.selection),

    /**
     * Slider value change
     */
    sliderChange: () => debouncedHaptic(HapticPatterns.selection),
} as const

/**
 * Haptic feedback for navigation
 */
export const NavigationHaptics = {
    /**
     * Page transition
     */
    pageTransition: () => haptic(HapticPatterns.light),

    /**
     * Tab change
     */
    tabChange: () => haptic(HapticPatterns.selection),

    /**
     * Modal open
     */
    modalOpen: () => haptic(HapticPatterns.medium),

    /**
     * Modal close
     */
    modalClose: () => haptic(HapticPatterns.light),

    /**
     * Drawer open
     */
    drawerOpen: () => haptic(HapticPatterns.medium),

    /**
     * Drawer close
     */
    drawerClose: () => haptic(HapticPatterns.light),

    /**
     * Back navigation
     */
    back: () => haptic(HapticPatterns.light),
} as const
