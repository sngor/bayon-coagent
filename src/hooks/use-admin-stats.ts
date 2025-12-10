'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminDashboardStats, AdminActivity } from '@/types/admin';
import { getAdminDashboardStats, getRecentActivityAction } from '@/features/admin';
import { useToast } from '@/hooks/use-toast';

export function useAdminStats() {
    const [stats, setStats] = useState<AdminDashboardStats>({
        totalUsers: 0,
        activeUsers: 0,
        newSignups24h: 0,
        pendingInvitations: 0,
        systemStatus: 'Checking...',
        openTickets: 0,
        pendingContent: 0,
        errorRate: 0,
        alerts: []
    });
    const [recentActivity, setRecentActivity] = useState<AdminActivity[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const { toast } = useToast();

    const loadData = useCallback(async (showRefreshing = false) => {
        if (showRefreshing) setIsRefreshing(true);

        try {
            const [statsResult, activityResult] = await Promise.all([
                getAdminDashboardStats({ filterByTeam: true }),
                getRecentActivityAction(10)
            ]);

            if (statsResult.message === 'success' && statsResult.data) {
                setStats(statsResult.data);
            }

            if (activityResult.message === 'success' && activityResult.data) {
                setRecentActivity(activityResult.data);
            }

            setLastUpdated(new Date());
        } catch (error) {
            console.error('Failed to load admin data:', error);
            toast({
                title: 'Error',
                description: 'Failed to load dashboard data',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [toast]);

    const refresh = useCallback(() => {
        loadData(true);
    }, [loadData]);

    return {
        stats,
        recentActivity,
        isLoading,
        isRefreshing,
        lastUpdated,
        refresh,
        loadData,
    };
}