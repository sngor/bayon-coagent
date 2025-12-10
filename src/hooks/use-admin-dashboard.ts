import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getAdminDashboardStats, getRecentActivityAction } from '@/features/admin/actions/admin-actions';
import { AdminDashboardStats, AdminActivity } from '@/types/admin';

interface UseAdminDashboardReturn {
    stats: AdminDashboardStats;
    recentActivity: AdminActivity[];
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
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
        alerts: []
    });
    const [recentActivity, setRecentActivity] = useState<AdminActivity[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchData = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const [statsResult, activityResult] = await Promise.all([
                getAdminDashboardStats({ filterByTeam: true }),
                getRecentActivityAction(10, { filterByTeam: true })
            ]);

            if (statsResult.message === 'success' && statsResult.data) {
                setStats(statsResult.data);
            } else {
                throw new Error('Failed to load dashboard stats');
            }

            if (activityResult.message === 'success' && activityResult.data) {
                setRecentActivity(activityResult.data);
            } else {
                throw new Error('Failed to load recent activity');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data';
            setError(errorMessage);
            console.error('Failed to load admin data:', err);
            toast({
                title: 'Error',
                description: errorMessage,
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return {
        stats,
        recentActivity,
        isLoading,
        error,
        refetch: fetchData
    };
}