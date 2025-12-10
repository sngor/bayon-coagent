/**
 * Onboarding Components
 * 
 * Barrel export for all onboarding-related components.
 * Includes both regular and lazy-loaded components for performance optimization.
 */

export { OnboardingContainer } from './onboarding-container';
export type { OnboardingContainerProps } from './onboarding-container';

export { OnboardingProgress } from './onboarding-progress';
export type { OnboardingProgressProps } from './onboarding-progress';

export { OnboardingNavigation } from './onboarding-navigation';
export type { OnboardingNavigationProps } from './onboarding-navigation';

export { WelcomeCard } from './welcome-card';

export { ProfileForm } from './profile-form';

export { FeatureTourStep } from './feature-tour-step';

export { HubSelectionCard } from './hub-selection-card';
export type { HubOption } from './hub-selection-card';

export { CompletionCelebration } from './completion-celebration';
export type { CompletionCelebrationProps } from './completion-celebration';

export { SkipConfirmationDialog } from './skip-confirmation-dialog';
export type { SkipConfirmationDialogProps } from './skip-confirmation-dialog';

export { ValidationErrorDisplay, FieldError } from './validation-error-display';

export { OnboardingErrorBoundary, withErrorBoundary } from './onboarding-error-boundary';

export { FlowChoiceCard } from './flow-choice-card';

export { FlowIndicator, DualFlowProgress } from './flow-indicator';

export { ResumeBanner } from './resume-banner';
export type { ResumeBannerProps } from './resume-banner';

export { ResumeBannerWrapper } from './resume-banner-wrapper';

// Lazy-loaded components for performance optimization
export {
    LazySkipConfirmationDialog,
    // TODO: Uncomment as components are implemented in future tasks
    // LazyProfileForm,
    // LazyFeatureTour,
    // LazyHubSelection,
    // LazyCompletionCelebration,
    // LazyResumeBanner,
    // LazyAdminWelcome,
    // LazyAdminUserManagement,
    // LazyAdminAnalytics,
    // LazyAdminConfiguration,
} from './lazy-components';
