import { Suspense, type ReactNode } from 'react';
import { PageLoading } from './page-loading';
import type { HubLoadingMessage, FeatureLoadingMessage } from '@/lib/constants/loading-messages';

interface SuspenseWrapperProps {
    children: ReactNode;
    fallback?: ReactNode;
    loadingText?: HubLoadingMessage | FeatureLoadingMessage | string;
    variant?: 'default' | 'hub' | 'feature';
}

/**
 * Reusable Suspense wrapper with consistent loading states
 * Use this for lazy-loaded components to maintain UX consistency
 */
export function SuspenseWrapper({ 
    children, 
    fallback, 
    loadingText = 'Loading...',
    variant = 'default'
}: SuspenseWrapperProps) {
    const defaultFallback = (
        <PageLoading 
            text={loadingText} 
            variant={variant}
        />
    );

    return (
        <Suspense fallback={fallback || defaultFallback}>
            {children}
        </Suspense>
    );
}

/**
 * Hub-specific suspense wrapper for consistent hub loading experience
 */
export function HubSuspenseWrapper({ 
    children, 
    loadingText = 'Loading...'
}: Omit<SuspenseWrapperProps, 'variant'>) {
    return (
        <SuspenseWrapper 
            variant="hub" 
            loadingText={loadingText}
        >
            {children}
        </SuspenseWrapper>
    );
}