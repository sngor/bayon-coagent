'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getBillingDashboardMetrics } from '@/features/admin/actions/admin-actions';
import { BillingMetrics } from '@/lib/types/billing-types';

interface UseBillingMetricsReturn {
    metrics: BillingMetrics | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    lastUpdated: Date | null;
    isStale: boolean;
}

const STALE_TIME = 5 * 60 * 1000; // 5 minutes
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 second

export function useBillingMetrics(): UseBillingMetricsReturn {
    const [metrics, setMetrics] = useState<BillingMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [isStale, setIsStale] = useState(false);

    const abortControllerRef = useRef<AbortController | null>(null);
    const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const fetchMetrics = useCallback(async (retryCount = 0): Promise<void> => {
        try {
            // Cancel previous request
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            // Create new abort controller
            abortControllerRef.current = new AbortController();

            setLoading(true);
            setError(null);

            const result = await getBillingDashboardMetrics();

            // Check if request was aborted
            if (abortControllerRef.current?.signal.aborted) {
                return;
            }

            if (result.success && result.data) {
                setMetrics(result.data);
                setLastUpdated(new Date());
                setIsStale(false);
            } else {
                throw new Error(result.error || 'Failed to load billing metrics');
            }
        } catch (err) {
            // Don't handle aborted requests as errors
            if (abortControllerRef.current?.signal.aborted) {
                return;
            }

            console.error('Error loading billing metrics:', err);

            // Retry logic
            if (retryCount < RETRY_ATTEMPTS) {
                retryTimeoutRef.current = setTimeout(() => {
                    fetchMetrics(retryCount + 1);
                }, RETRY_DELAY * Math.pow(2, retryCount)); // Exponential backoff
                return;
            }

            setError(err instanceof Error ? err.message : 'Failed to load billing metrics. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    // Check if data is stale
    useEffect(() => {
        if (!lastUpdated) return;

        const checkStale = () => {
            const now = Date.now();
            const isDataStale = now - lastUpdated.getTime() > STALE_TIME;
            setIsStale(isDataStale);
        };

        checkStale();
        const interval = setInterval(checkStale, 30000); // Check every 30 seconds

        return () => clearInterval(interval);
    }, [lastUpdated]);

    // Initial fetch
    useEffect(() => {
        fetchMetrics();

        // Cleanup on unmount
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }
        };
    }, [fetchMetrics]);

    const refetch = useCallback(() => fetchMetrics(0), [fetchMetrics]);

    return {
        metrics,
        loading,
        error,
        refetch,
        lastUpdated,
        isStale,
    };
}