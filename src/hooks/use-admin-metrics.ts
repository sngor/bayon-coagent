import { useState, useEffect, useCallback } from 'react';
import { useAdminErrorHandler } from './use-admin-error-handler';

export interface AdminMetrics {
    users: {
        total: number;
        active: number;
        newThisMonth: number;
        churnRate: number;
    };
    content: {
        total: number;
        pending: number;
        approved: number;
        rejected: number;
    };
    teams: {
        total: number;
        averageSize: number;
    };
    system: {
        uptime: number;
        responseTime: number;
        errorRate: number;
    };
}

interface UseAdminMetricsOptions {
    refreshInterval?: number;
    autoRefresh?: boolean;
}

export function useAdminMetrics(options: UseAdminMetricsOptions = {}) {
    const { refreshInterval = 30000, autoRefresh = true } = options;
    const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const { handleError } = useAdminErrorHandler();

    const fetchMetrics = useCallback(async () => {
        try {
            setLoading(true);

            // TODO: Replace with actual API call
            // const response = await fetch('/api/admin/metrics');
            // const data = await response.json();

            // Mock data for now
            const mockMetrics: AdminMetrics = {
                users: {
                    total: 1250,
                    active: 890,
                    newThisMonth: 45,
                    churnRate: 2.5
                },
                content: {
                    total: 3420,
                    pending: 23,
                    approved: 3380,
                    rejected: 17
                },
                teams: {
                    total: 15,
                    averageSize: 8.3
                },
                system: {
                    uptime: 99.9,
                    responseTime: 245,
                    errorRate: 0.1
                }
            };

            setMetrics(mockMetrics);
            setLastUpdated(new Date());
        } catch (error) {
            handleError(error, 'fetchMetrics');
        } finally {
            setLoading(false);
        }
    }, [handleError]);

    // Auto-refresh metrics
    useEffect(() => {
        fetchMetrics();

        if (autoRefresh) {
            const interval = setInterval(fetchMetrics, refreshInterval);
            return () => clearInterval(interval);
        }
    }, [fetchMetrics, autoRefresh, refreshInterval]);

    const refreshMetrics = useCallback(() => {
        fetchMetrics();
    }, [fetchMetrics]);

    return {
        metrics,
        loading,
        lastUpdated,
        refreshMetrics,
        isStale: lastUpdated && Date.now() - lastUpdated.getTime() > refreshInterval * 2
    };
}