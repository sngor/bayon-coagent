import { useState, useEffect } from 'react';
import { getDashboardData } from '@/app/(app)/dashboard/actions';
import { getUserWorkflowInstances } from '@/app/workflow-actions';
import { WorkflowStatus } from '@/types/workflows';

interface DashboardData {
    agentProfile: any;
    allReviews: any[];
    recentReviews: any[];
    latestPlan: any;
    brandAudit: any;
    competitors: any[];
    announcements: any[];
}

export function useDashboardData(userId: string | undefined) {
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [workflowInstances, setWorkflowInstances] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) return;

        const fetchData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                // Fetch dashboard data and workflows in parallel
                const [dashboardResult, workflowResult] = await Promise.all([
                    getDashboardData(userId),
                    getUserWorkflowInstances().catch(() => ({ message: 'error', data: [] }))
                ]);

                if (dashboardResult.success && dashboardResult.data) {
                    setDashboardData({
                        agentProfile: dashboardResult.data.agentProfile,
                        allReviews: dashboardResult.data.allReviews,
                        recentReviews: dashboardResult.data.recentReviews,
                        latestPlan: dashboardResult.data.latestPlan,
                        brandAudit: dashboardResult.data.brandAudit,
                        competitors: dashboardResult.data.competitors,
                        announcements: dashboardResult.data.announcements || [],
                    });
                } else {
                    setError(dashboardResult.error || 'Failed to load dashboard');
                }

                if (workflowResult.message === 'success' && workflowResult.data) {
                    const filteredInstances = workflowResult.data.filter(
                        instance => instance.status !== WorkflowStatus.ARCHIVED
                    );
                    setWorkflowInstances(filteredInstances);
                }
            } catch (err) {
                setError('Failed to load dashboard data');
                console.error('Dashboard data fetch error:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [userId]);

    return {
        dashboardData,
        workflowInstances,
        isLoading,
        error,
        refetch: () => {
            if (userId) {
                setIsLoading(true);
                // Re-trigger the effect by updating a dependency
            }
        }
    };
}