/**
 * Admin Dashboard Hook
 * Centralized state management for admin dashboard
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminDashboardStats, AdminActivity } from '@/lib/types/admin';
import { getAdminDashboardStats, getRecentActivityAction } from '@/features/admin/actions/admin-actions';

interface UseAdminDashboardReturn {
    stats: AdminDashboardStats;
    recentActivity: AdminActivity[];
    loading: boolean;
    error: string | null;
    refreshStats: () => Promise<void>;
    refreshActivity: () => Promise<void>;
    refreshAll: () => Promise<void>;
}

export function useAdminDashboard(): UseAdminDashboardReturn {
    const [stats, setStats] = useState<AdminDashboardStats>({
        totalUsers: 0,
        totalFeedback: 0,
        pendingFeedback: 0,
        totalAiRequests: 0,
        totalAiCosts: 0,
        activeFeatures: 0,
        betaFeatures: 0,
        systemStatus: 'Checking...'
    });

    const [recentActivity, setRecentActivity] = useState<AdminActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refreshStats = useCallback(async () => {
        try {
            const result = await getAdminDashboardStats();
            if (result.message === 'success' && result.data) {
                setStats(result.data);
                setError(null);
            } else {
                setError('Failed to load dashboard stats');
            }
        } catch (err) {
            console.error('Failed to load admin stats:', err);
            setError('Failed to load dashboard stats');
        }
    }, []);

    const refreshActivity = useCallback(async () => {
        try {
            const result = await getRecentActivityAction();
            if (result.message === 'success' && result.data) {
                setRecentActivity(result.data);
                setError(null);
            } else {
                setError('Failed to load recent activity');
            }
        } catch (err) {
            console.error('Failed to load recent activity:', err);
            setError('Failed to load recent activity');
        }
    }, []);

    const refreshAll = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            await Promise.all([refreshStats(), refreshActivity()]);
        } catch (err) {
            console.error('Failed to refresh dashboard data:', err);
            setError('Failed to refresh dashboard data');
        } finally {
            setLoading(false);
        }
    }, [refreshStats, refreshActivity]);

    useEffect(() => {
        refreshAll();
    }, [refreshAll]);

    return {
        stats,
        recentActivity,
        loading,
        error,
        refreshStats,
        refreshActivity,
        refreshAll
    };
}