/**
 * Lazy Alert Detail Component
 * 
 * Provides lazy loading for alert details to improve performance
 * by only loading detailed information when needed.
 */

'use client';

import { useState, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Alert as AlertType } from '@/lib/alerts/types';

interface LazyAlertDetailProps {
    alert: AlertType;
    onLoad?: (alert: AlertType) => void;
    onError?: (error: Error) => void;
    className?: string;
    children: (alert: AlertType, isLoading: boolean) => React.ReactNode;
}

/**
 * Lazy loading wrapper for alert details
 * Only loads detailed information when the component becomes visible
 */
export function LazyAlertDetail({
    alert,
    onLoad,
    onError,
    className,
    children
}: LazyAlertDetailProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [detailedAlert, setDetailedAlert] = useState<AlertType | null>(null);
    const [error, setError] = useState<Error | null>(null);

    // Intersection Observer to detect when component becomes visible
    const observerRef = useCallback((node: HTMLDivElement | null) => {
        if (!node) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !detailedAlert && !isLoading) {
                    setIsVisible(true);
                    loadDetailedAlert();
                }
            },
            {
                threshold: 0.1, // Trigger when 10% visible
                rootMargin: '50px', // Start loading 50px before visible
            }
        );

        observer.observe(node);

        return () => observer.disconnect();
    }, [detailedAlert, isLoading]);

    /**
     * Loads detailed alert information
     * In a real implementation, this might fetch additional data from the server
     */
    const loadDetailedAlert = useCallback(async () => {
        if (isLoading || detailedAlert) return;

        setIsLoading(true);
        setError(null);

        try {
            // Simulate loading delay for demonstration
            await new Promise(resolve => setTimeout(resolve, 100));

            // For now, we just use the existing alert data
            // In a real implementation, you might fetch additional details:
            // const detailed = await fetchAlertDetails(alert.id);

            setDetailedAlert(alert);
            onLoad?.(alert);
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to load alert details');
            setError(error);
            onError?.(error);
        } finally {
            setIsLoading(false);
        }
    }, [alert, isLoading, detailedAlert, onLoad, onError]);

    // If there's an error, show error state
    if (error) {
        return (
            <div ref={observerRef} className={cn('p-4 text-center', className)}>
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-destructive" />
                <p className="text-sm text-destructive">Failed to load alert details</p>
                <button
                    type="button"
                    onClick={loadDetailedAlert}
                    className="text-xs text-primary hover:underline mt-1"
                >
                    Try again
                </button>
            </div>
        );
    }

    // If loading, show skeleton
    if (isLoading) {
        return (
            <div ref={observerRef} className={cn(className)}>
                <AlertDetailSkeleton />
            </div>
        );
    }

    // If not visible yet, show placeholder
    if (!isVisible || !detailedAlert) {
        return (
            <div ref={observerRef} className={cn('min-h-[120px]', className)}>
                <AlertPlaceholder />
            </div>
        );
    }

    // Render the actual content
    return (
        <div className={className}>
            {children(detailedAlert, false)}
        </div>
    );
}

/**
 * Skeleton loader for alert details
 */
function AlertDetailSkeleton() {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-start gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                            <Skeleton className="w-20 h-5 rounded" />
                            <Skeleton className="w-16 h-5 rounded" />
                        </div>
                        <Skeleton className="w-3/4 h-6" />
                        <div className="flex items-center gap-4">
                            <Skeleton className="w-24 h-4" />
                            <Skeleton className="w-20 h-4" />
                        </div>
                    </div>
                    <div className="flex gap-1">
                        <Skeleton className="w-8 h-8 rounded" />
                        <Skeleton className="w-8 h-8 rounded" />
                    </div>
                </div>
            </CardHeader>
        </Card>
    );
}

/**
 * Placeholder for alerts that haven't loaded yet
 */
function AlertPlaceholder() {
    return (
        <Card className="opacity-50">
            <CardHeader>
                <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                        <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-muted animate-pulse" />
                        <p className="text-sm text-muted-foreground">Loading alert details...</p>
                    </div>
                </div>
            </CardHeader>
        </Card>
    );
}

/**
 * Hook for lazy loading multiple alerts
 */
export function useLazyAlerts(alerts: AlertType[]) {
    const [loadedAlerts, setLoadedAlerts] = useState<Set<string>>(new Set());
    const [loadingAlerts, setLoadingAlerts] = useState<Set<string>>(new Set());

    const loadAlert = useCallback((alertId: string) => {
        if (loadedAlerts.has(alertId) || loadingAlerts.has(alertId)) {
            return;
        }

        setLoadingAlerts(prev => new Set(prev).add(alertId));

        // Simulate loading
        setTimeout(() => {
            setLoadingAlerts(prev => {
                const next = new Set(prev);
                next.delete(alertId);
                return next;
            });
            setLoadedAlerts(prev => new Set(prev).add(alertId));
        }, 100);
    }, [loadedAlerts, loadingAlerts]);

    const isLoaded = useCallback((alertId: string) => {
        return loadedAlerts.has(alertId);
    }, [loadedAlerts]);

    const isLoading = useCallback((alertId: string) => {
        return loadingAlerts.has(alertId);
    }, [loadingAlerts]);

    return {
        loadAlert,
        isLoaded,
        isLoading,
        loadedCount: loadedAlerts.size,
        totalCount: alerts.length,
    };
}

/**
 * Lazy loading list component for alerts
 */
interface LazyAlertListProps {
    alerts: AlertType[];
    renderAlert: (alert: AlertType, isLoading: boolean) => React.ReactNode;
    onAlertLoad?: (alert: AlertType) => void;
    className?: string;
    itemClassName?: string;
}

export function LazyAlertList({
    alerts,
    renderAlert,
    onAlertLoad,
    className,
    itemClassName
}: LazyAlertListProps) {
    return (
        <div className={cn('space-y-4', className)}>
            {alerts.map((alert) => (
                <LazyAlertDetail
                    key={alert.id}
                    alert={alert}
                    onLoad={onAlertLoad}
                    className={itemClassName}
                >
                    {renderAlert}
                </LazyAlertDetail>
            ))}
        </div>
    );
}