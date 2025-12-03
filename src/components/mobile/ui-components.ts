/**
 * Mobile UI Components
 * 
 * Export all mobile-specific UI components for easy importing.
 * 
 * Requirements: 4.1, 5.1, 5.2, 8.3
 */

export {
    BottomSheet,
    BottomSheetTrigger,
} from "./bottom-sheet"

export {
    SwipeableCard,
    SwipeableCardStack,
    SwipeableGallery,
} from "./swipeable-card"

export {
    TouchButton,
    TouchButtonGroup,
    FloatingActionButton,
    SegmentedControl,
} from "./touch-button"

export {
    MobileNav,
    MobileNavDrawer,
    MobileNavItem,
    MobileTabBar,
} from "./mobile-nav"

export {
    haptic,
    HapticFeedback,
    HapticPatterns,
    GestureHaptics,
    FormHaptics,
    NavigationHaptics,
    useHaptics,
    withHaptics,
    debouncedHaptic,
    supportsHaptics,
} from "@/lib/mobile/haptics"
