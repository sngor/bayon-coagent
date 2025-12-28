import { useState, useEffect, useReducer } from 'react';
import { useUser } from '@/aws/auth';
import { getDashboardData } from '@/app/(app)/dashboard/actions';
import { getUserWorkflowInstances } from '@/app/workflow-actions';
import { WorkflowStatus } from '@/types/workflows';

interface DashboardState {
    agentProfile: any;
    allReviews: any[];
    recentReviews: any[];
    latestPlan: any;
    brandAudit: any;
    competitors: any[];
    announcements: any[];
    workflowInstances: any[];
}

interface DashboardLoadingState {
    dashboard: boolean;
    workflows: boolean;
}

interface DashboardErrorState {
    dashboard: string | null;
    workflows: string | null;
}

type DashboardAction = 
    | { type: 'SET_LOADING'; payload: { key: keyof DashboardLoadingState; value: boolean } }
    | { type: 'SET_ERROR'; payload: { key: keyof DashboardErrorState; value: string | null } }
    | { type: 'SET_DASHBOARD_DATA'; payload: Partial<DashboardState> }
    | { type: 'SET_WORKFLOW_INSTANCES'; payload: any[] };

const initialState = {
    data: {
        agentProfile: null,
        allReviews: [],
        recentReviews: [],
        latestPlan: null,
        brandAudit: null,
        competitors: [],
        announcements: [],
        workflowInstances: [],
    } as DashboardState,
    loading: {
        dashboard: true,
        workflows: true,
    } as DashboardLoadingState,
    errors: {
        dashboard: null,
        workflows: null,
    } as DashboardErrorState,
};

function dashboardReducer(state: typeof initialState, action: DashboardAction) {
    switch (action.type) {
        case 'SET_LOADING':
            return {
                ...state,
                loading: {
                    ...state.loading,
                    [action.payload.key]: action.payload.value,
                },
            };
        case 'SET_ERROR':
            return {
                ...state,
                errors: {
                    ...state.errors,
                    [action.payload.key]: action.payload.value,
                },
            };
        case 'SET_DASHBOARD_DATA':
            return {
                ...state,
                data: {
                    ...state.data,
                    ...action.payload,
                },
            };
        case 'SET_WORKFLOW_INSTANCES':
            return {
                ...state,
                data: {
                    ...state.data,
                    workflowInstances: action.payload,
                },
            };
        default:
            return state;
    }
}

export function useDashboardData() {
    const { user } = useUser();
    const [state, dispatch] = useReducer(dashboardReducer, initialState);

    // Fetch dashboard data
    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            dispatch({ type: 'SET_LOADING', payload: { key: 'dashboard', value: true } });
            
            try {
                const result = await getDashboardData(user.id);

                if (result.success && result.data) {
                    dispatch({
                        type: 'SET_DASHBOARD_DATA',
                        payload: {
                            agentProfile: result.data.agentProfile,
                            allReviews: result.data.allReviews,
                            recentReviews: result.data.recentReviews,
                            latestPlan: result.data.latestPlan,
                            brandAudit: result.data.brandAudit,
                            competitors: result.data.competitors,
                            announcements: result.data.announcements || [],
                        },
                    });
                    dispatch({ type: 'SET_ERROR', payload: { key: 'dashboard', value: null } });
                } else {
                    dispatch({ 
                        type: 'SET_ERROR', 
                        payload: { key: 'dashboard', value: result.error || 'Failed to load dashboard' } 
                    });
                }
            } catch (error) {
                dispatch({ 
                    type: 'SET_ERROR', 
                    payload: { key: 'dashboard', value: 'Failed to load dashboard' } 
                });
            } finally {
                dispatch({ type: 'SET_LOADING', payload: { key: 'dashboard', value: false } });
            }
        };

        fetchData();
    }, [user]);

    // Fetch workflow instances
    useEffect(() => {
        if (!user) return;

        const fetchWorkflows = async () => {
            dispatch({ type: 'SET_LOADING', payload: { key: 'workflows', value: true } });
            
            try {
                const result = await getUserWorkflowInstances();

                if (result.message === 'success' && result.data) {
                    const filteredInstances = result.data.filter(
                        instance => instance.status !== WorkflowStatus.ARCHIVED
                    );
                    dispatch({ type: 'SET_WORKFLOW_INSTANCES', payload: filteredInstances });
                }
                dispatch({ type: 'SET_ERROR', payload: { key: 'workflows', value: null } });
            } catch (error) {
                console.error('Error fetching workflow instances:', error);
                dispatch({ 
                    type: 'SET_ERROR', 
                    payload: { key: 'workflows', value: 'Failed to load workflows' } 
                });
            } finally {
                dispatch({ type: 'SET_LOADING', payload: { key: 'workflows', value: false } });
            }
        };

        fetchWorkflows();
    }, [user]);

    return {
        data: state.data,
        loading: state.loading,
        errors: state.errors,
        isLoading: state.loading.dashboard || state.loading.workflows,
        hasError: !!state.errors.dashboard || !!state.errors.workflows,
    };
}