/**
 * React Hook for Mobile Analytics
 * 
 * Provides easy access to mobile analytics tracking in React components.
 */

'use client';

import { useEffect, useCallback, useRef } from 'react';
import {
    getMobileAnalytics,
    trackFeatureUsage,
    trackMobileError,
    trackEngagement,
    type MobileFeature,
    type CaptureType,
    type ShareMethod,
    type QuickActionType,
} from './analytics';

/**
 * Hook for tracking mobile analytics
 */
export function useMobileAnalytics(feature?: MobileFeature) {
    const startTimeRef = useRef<number>(Date.now());

    // Track feature mount/unmount
    useEffect(() => {
        if (feature) {
            trackFeatureUsage(feature, 'mount');

            return () => {
                const duration = Date.now() - startTimeRef.current;
                trackFeatureUsage(feature, 'unmount', { duration });
            };
        }
    }, [feature]);

    // Track feature action
    const trackAction = useCallback(
        (action: string, metadata?: Record<string, any>) => {
            if (feature) {
                trackFeatureUsage(feature, action, metadata);
            }
        },
        [feature]
    );

    // Track error
    const trackError = useCallback(
        (error: Error, context?: Record<string, any>) => {
            if (feature) {
                trackMobileError(feature, error, context);
            }
        },
        [feature]
    );

    // Track timed operation
    const trackOperation = useCallback(
        (operationName: string) => {
            const startTime = Date.now();

            return {
                success: (metadata?: Record<string, any>) => {
                    const duration = Date.now() - startTime;
                    if (feature) {
                        trackFeatureUsage(feature, operationName, {
                            success: true,
                            duration,
                            ...metadata,
                        });
                    }
                },
                error: (error: Error, metadata?: Record<string, any>) => {
                    const duration = Date.now() - startTime;
                    if (feature) {
                        trackMobileError(feature, error, {
                            operation: operationName,
                            duration,
                            ...metadata,
                        });
                    }
                },
            };
        },
        [feature]
    );

    return {
        trackAction,
        trackError,
        trackOperation,
    };
}

/**
 * Hook for tracking quick capture analytics
 */
export function useQuickCaptureAnalytics() {
    const analytics = getMobileAnalytics();

    const trackCapture = useCallback(
        (captureType: CaptureType, success: boolean, metadata?: Record<string, any>) => {
            analytics.trackQuickCapture(captureType, success, metadata);
            analytics.trackCaptureEngagement(captureType, success, metadata?.duration);
        },
        [analytics]
    );

    const trackCaptureStart = useCallback((captureType: CaptureType) => {
        const startTime = Date.now();

        return {
            success: (metadata?: Record<string, any>) => {
                const duration = Date.now() - startTime;
                trackCapture(captureType, true, { ...metadata, duration });
            },
            error: (error: Error) => {
                const duration = Date.now() - startTime;
                analytics.trackError('quick-capture', error, { captureType, duration });
                trackCapture(captureType, false, { duration });
            },
        };
    }, [analytics, trackCapture]);

    return {
        trackCapture,
        trackCaptureStart,
    };
}

/**
 * Hook for tracking quick actions analytics
 */
export function useQuickActionsAnalytics() {
    const analytics = getMobileAnalytics();

    const trackAction = useCallback(
        (actionType: string, success: boolean, duration?: number) => {
            analytics.trackQuickAction(actionType, success, duration);
            analytics.trackActionEngagement(actionType, success, duration);
        },
        [analytics]
    );

    const trackActionStart = useCallback((actionType: string) => {
        const startTime = Date.now();

        return {
            success: (metadata?: Record<string, any>) => {
                const duration = Date.now() - startTime;
                trackAction(actionType, true, duration);
            },
            error: (error: Error) => {
                const duration = Date.now() - startTime;
                analytics.trackError('quick-actions', error, { actionType, duration });
                trackAction(actionType, false, duration);
            },
        };
    }, [analytics, trackAction]);

    return {
        trackAction,
        trackActionStart,
    };
}

/**
 * Hook for tracking share analytics
 */
export function useShareAnalytics() {
    const analytics = getMobileAnalytics();

    const trackShare = useCallback(
        (method: ShareMethod, success: boolean, propertyId?: string, metadata?: Record<string, any>) => {
            analytics.trackShareEngagement(method, success, propertyId, metadata);
        },
        [analytics]
    );

    const trackShareStart = useCallback((method: ShareMethod, propertyId?: string) => {
        const startTime = Date.now();

        return {
            success: (metadata?: Record<string, any>) => {
                const duration = Date.now() - startTime;
                trackShare(method, true, propertyId, { ...metadata, duration });
            },
            error: (error: Error) => {
                const duration = Date.now() - startTime;
                analytics.trackError('quick-share', error, { method, propertyId, duration });
                trackShare(method, false, propertyId, { duration });
            },
        };
    }, [analytics, trackShare]);

    return {
        trackShare,
        trackShareStart,
    };
}

/**
 * Hook for tracking voice notes analytics
 */
export function useVoiceNotesAnalytics() {
    const analytics = getMobileAnalytics();

    const trackVoiceNote = useCallback(
        (duration: number, transcribed: boolean, propertyId?: string) => {
            analytics.trackVoiceNote(duration, transcribed, propertyId);
        },
        [analytics]
    );

    const trackVoiceNoteStart = useCallback(() => {
        const startTime = Date.now();

        return {
            success: (transcribed: boolean, propertyId?: string) => {
                const duration = Date.now() - startTime;
                trackVoiceNote(duration, transcribed, propertyId);
            },
            error: (error: Error, propertyId?: string) => {
                const duration = Date.now() - startTime;
                analytics.trackError('voice-notes', error, { duration, propertyId });
            },
        };
    }, [analytics, trackVoiceNote]);

    return {
        trackVoiceNote,
        trackVoiceNoteStart,
    };
}

/**
 * Hook for tracking location services analytics
 */
export function useLocationAnalytics() {
    const analytics = getMobileAnalytics();

    const trackLocationAction = useCallback(
        (action: 'check-in' | 'navigation' | 'reminder', metadata?: Record<string, any>) => {
            analytics.trackLocationService(action, metadata);
        },
        [analytics]
    );

    const trackLocationError = useCallback(
        (error: Error, action: string) => {
            analytics.trackError('location-services', error, { action });
        },
        [analytics]
    );

    return {
        trackLocationAction,
        trackLocationError,
    };
}

/**
 * Hook for tracking performance metrics
 */
export function usePerformanceTracking(pageName?: string) {
    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Track page load performance
        const analytics = getMobileAnalytics();

        // Wait for page to be fully loaded
        if (document.readyState === 'complete') {
            trackPagePerformance();
        } else {
            window.addEventListener('load', trackPagePerformance);
            return () => window.removeEventListener('load', trackPagePerformance);
        }

        function trackPagePerformance() {
            if (!window.performance || !window.performance.timing) return;

            const timing = window.performance.timing;
            const navigation = window.performance.navigation;

            // Calculate various timings
            const pageLoadTime = timing.loadEventEnd - timing.navigationStart;
            const domReadyTime = timing.domContentLoadedEventEnd - timing.navigationStart;
            const ttfb = timing.responseStart - timing.requestStart;

            analytics.trackCustomTiming('page-load', pageLoadTime, {
                page: pageName || window.location.pathname,
                domReady: domReadyTime,
                ttfb,
                navigationType: navigation.type,
            });
        }
    }, [pageName]);
}

/**
 * Hook for tracking component render performance
 */
export function useRenderTracking(componentName: string) {
    const renderCountRef = useRef(0);
    const mountTimeRef = useRef(Date.now());

    useEffect(() => {
        renderCountRef.current++;

        // Track excessive re-renders
        if (renderCountRef.current > 10) {
            const analytics = getMobileAnalytics();
            analytics.trackCustomTiming('excessive-renders', Date.now() - mountTimeRef.current, {
                component: componentName,
                renderCount: renderCountRef.current,
            });
        }
    });
}
