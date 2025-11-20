/**
 * Shared Component Types
 * 
 * Centralized type definitions for all shared components.
 * Import from this file for better type safety and consistency.
 * 
 * @example
 * ```tsx
 * import type { QuizProps, CompetitorFormProps } from '@/components/types';
 * ```
 */

// Re-export all shared component prop types
export type { PageTransitionProps } from './page-transition';
export type { 
    ProfileCompletionBannerProps, 
    ProfileCompletionChecklistProps,
    ProfileField 
} from './profile-completion-banner';
export type { 
    SuggestedNextStepsProps, 
    NextStep 
} from './suggested-next-steps';
export type { FrequentFeaturesProps } from './frequent-features';
export type { 
    ErrorBoundaryProps, 
    ErrorBoundaryState,
    DefaultErrorFallbackProps 
} from './error-boundary';
export type { 
    CompetitorFormProps, 
    CompetitorFormData,
    EnrichState 
} from './competitor-form';
export type { AITrainingPlanProps } from './ai-training-plan';
export type { 
    QuizProps, 
    QuizQuestion 
} from './quiz';
export type { S3FileUploadProps } from './s3-file-upload';
export type { ProfileImageUploadProps } from './profile-image-upload';

// Common type aliases
export type Priority = 'high' | 'medium' | 'low';
export type ImageSize = 'sm' | 'md' | 'lg' | 'xl';
