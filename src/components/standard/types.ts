/**
 * Standard Component Types
 * 
 * Centralized type definitions for all standard components.
 * Import from this file for better type safety and consistency.
 * 
 * @example
 * ```tsx
 * import type { StandardCardProps, StandardFormFieldProps } from '@/components/standard/types';
 * ```
 */

// Re-export all standard component prop types
export type { StandardPageLayoutProps } from './page-layout';
export type { StandardCardProps } from './card';
export type { StandardFormFieldProps } from './form-field';
export type { StandardFormActionsProps } from './form-actions';
export type { StandardLoadingSpinnerProps } from './loading-spinner';
export type { StandardSkeletonProps } from './skeleton';
export type { StandardEmptyStateProps } from './empty-state';
export type { StandardErrorDisplayProps } from './error-display';

// Common type aliases for convenience
export type ButtonVariant = 'default' | 'ai' | 'outline' | 'ghost' | 'destructive';
export type CardVariant = 'default' | 'interactive' | 'elevated' | 'flat';
export type PaddingSize = 'default' | 'compact' | 'spacious';
export type SpinnerSize = 'sm' | 'md' | 'lg';
export type SpinnerVariant = 'default' | 'overlay' | 'ai';
export type ErrorVariant = 'error' | 'warning' | 'info';
export type EmptyStateVariant = 'default' | 'compact';
export type SkeletonVariant = 'card' | 'list' | 'form' | 'content' | 'metric';
export type MaxWidth = 'default' | 'wide' | 'full';
export type Spacing = 'default' | 'compact' | 'spacious';
export type Alignment = 'left' | 'right' | 'between';
