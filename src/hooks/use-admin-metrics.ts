'use client';

import { useMemo } from 'react';
import { AdminDashboardStats } from '@/types/admin';

export function useAdminMetrics(stats: AdminDashboardStats, lastUpdated: Date | null) {
    const teamGrowthRate = useMemo(() => {
        if (!stats.totalUsers || !stats.newSignups24h) return 0;
        return ((stats.newSignups24h / stats.totalUsers) * 100);
    }, [stats.totalUsers, stats.newSignups24h]);

    const activeUserPercentage = useMemo(() => {
        if (!stats.totalUsers || !stats.activeUsers) return 0;
        return Math.round((stats.activeUsers / stats.totalUsers) * 100);
    }, [stats.totalUsers, stats.activeUsers]);

    const formatLastUpdated = useMemo(() => {
        if (!lastUpdated) return '';
        return lastUpdated.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }, [lastUpdated]);

    const systemHealthStatus = useMemo(() => ({
        isHealthy: stats.systemStatus === 'Healthy',
        displayValue: stats.systemStatus === 'Healthy' ? '100%' : 'Degraded',
        statusColor: stats.systemStatus === 'Healthy' ? 'text-green-600' : 'text-red-600',
        iconColor: stats.systemStatus === 'Healthy'
            ? 'text-green-600 dark:text-green-400'
            : 'text-red-600 dark:text-red-400',
        iconBgColor: stats.systemStatus === 'Healthy'
            ? 'bg-green-100 dark:bg-green-900/50'
            : 'bg-red-100 dark:bg-red-900/50',
        badgeColor: stats.systemStatus === 'Healthy'
            ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
            : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300',
        badgeText: stats.systemStatus === 'Healthy' ? 'Stable' : 'Issues'
    }), [stats.systemStatus]);

    return {
        teamGrowthRate,
        activeUserPercentage,
        formatLastUpdated,
        systemHealthStatus,
    };
}