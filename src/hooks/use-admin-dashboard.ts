/**
 * Admin Dashboard Hook
 * Centralized state management for admin dashboard
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminDashboardStats, AdminAlert } from '@/types/admin';
import { AdminActivity } from '@/lib/types/admin';
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
        activeUsers: 0,
        newSignups24h: 0,
        pendingInvitations: 0,
        systemStatus: 'Checking...',
        openTickets: 0,
        pendingContent: 0,
        errorRate: 0,
        alerts: [],
        totalFeedback: 0,
        pendingFeedback: 0,
        totalAiRequests: 0,
        totalAiCosts: 0,
        activeFeatures: 0,
        betaFeatures: 0,
    });

    const [recentActivity, setRecentActivity] = useState<AdminActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refreshStats = useCallback(async () => {
        try {
            const result = await getAdminDashboardStats();
            if (result.message === 'success' && result.data) {
                // Ensure all numeric values are properly serialized
                const sanitizedStats = {
                    totalUsers: Number(result.data.totalUsers) || 0,
                    activeUsers: Number(result.data.activeUsers) || 0,
                    newSignups24h: Number(result.data.newSignups24h) || 0,
                    pendingInvitations: Number(result.data.pendingInvitations) || 0,
                    systemStatus: result.data.systemStatus || 'Checking...',
                    openTickets: Number(result.data.openTickets) || 0,
                    pendingContent: Number(result.data.pendingContent) || 0,
                    errorRate: Number(result.data.errorRate) || 0,
                    alerts: Array.isArray(result.data.alerts) ? result.data.alerts : [],
                    totalFeedback: Number(result.data.totalFeedback) || 0,
                    pendingFeedback: Number(result.data.pendingFeedback) || 0,
                    totalAiRequests: Number(result.data.totalAiRequests) || 0,
                    totalAiCosts: Number(result.data.totalAiCosts) || 0,
                    activeFeatures: Number(result.data.activeFeatures) || 0,
                    betaFeatures: Number(result.data.betaFeatures) || 0,
                    totalTeams: Number(result.data.totalTeams) || 0,
                };
                setStats(sanitizedStats);
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
                // Ensure activity data is properly serialized
                const sanitizedActivity = Array.isArray(result.data) ? result.data.map(activity => ({
                    id: String(activity.id || ''),
                    description: String(activity.description || ''),
                    timestamp: String(activity.timestamp || new Date().toISOString()),
                    user: {
                        id: String(activity.user?.id || ''),
                        email: String(activity.user?.email || ''),
                        name: activity.user?.name ? String(activity.user.name) : undefined,
                    },
                    type: activity.type || 'system_event',
                    // Remove metadata to avoid serialization issues
                })) : [];
                setRecentActivity(sanitizedActivity);
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