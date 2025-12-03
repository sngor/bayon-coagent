/**
 * Mobile Components Export
 * 
 * Centralized exports for all mobile-specific components
 */

// Performance Components
export { ProgressiveImage } from './progressive-image';
export type { ProgressiveImageProps } from './progressive-image';

export { CancellableOperation, useCancellableOperationUI } from './cancellable-operation';
export type { CancellableOperationProps, UseCancellableOperationUIOptions } from './cancellable-operation';

export { ImageCompressor } from './image-compressor';
export type { ImageCompressorProps } from './image-compressor';

export { NavigationPrefetchProvider } from './navigation-prefetch-provider';
export type { NavigationPrefetchProviderProps } from './navigation-prefetch-provider';

// Mobile UI Components (Task 19)
export { BottomSheet, BottomSheetTrigger } from './bottom-sheet';

export {
    SwipeableCard,
    SwipeableCardStack,
    SwipeableGallery
} from './swipeable-card';

export {
    TouchButton,
    TouchButtonGroup,
    FloatingActionButton,
    SegmentedControl
} from './touch-button';
export type { TouchButtonProps } from './touch-button';

export {
    MobileNav,
    MobileNavDrawer,
    MobileNavItem,
    MobileTabBar
} from './mobile-nav';

// Re-export existing mobile components (when implemented)
// export { QuickCapture } from './quick-capture';
// export { QuickActionsMenu } from './quick-actions-menu';
// export { QuickShare } from './quick-share';
// export { VoiceNoteRecorder } from './voice-note-recorder';

// Onboarding and Documentation
export { MobileFeatureTour } from "./mobile-feature-tour";
export type { MobileFeatureTourProps, TourStep } from "./mobile-feature-tour";

export { PermissionEducationDialog, usePermissionEducation } from "./permission-education-dialog";
export type { PermissionEducationDialogProps, PermissionType, PermissionInfo } from "./permission-education-dialog";

export { MobileHelpDocumentation } from "./mobile-help-documentation";
export type { MobileHelpDocumentationProps, HelpArticle } from "./mobile-help-documentation";

export { MobileOnboardingProvider, useMobileOnboarding } from "./mobile-onboarding-provider";
export type { MobileOnboardingProviderProps, MobileOnboardingContextValue, MobileOnboardingState } from "./mobile-onboarding-provider";

export * from "./mobile-feature-tooltips";

// Demo Components
export { MobileOnboardingDemo } from "./mobile-onboarding-demo";
