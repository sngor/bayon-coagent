import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuthToken } from '@/hooks/use-auth-token';
import type { Team, User } from '@/types/admin';

interface UseTeamsDataReturn {
    teams: Team[];
    users: User[];
    loading: boolean;
    loadData: () => Promise<void>;
    setTeams: React.Dispatch<React.SetStateAction<Team[]>>;
}

/**
 * Custom hook for managing teams and users data
 * Handles loading, error handling, and state management
 */
export function useTeamsData(): UseTeamsDataReturn {
    const [teams, setTeams] = useState<Team[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const { getAuthToken } = useAuthToken();

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const accessToken = getAuthToken();

            const { getTeamsAction, getUsersListAction } = await import('@/features/admin/actions/admin-actions');

            // Load data in parallel
            const [teamsResult, usersResult] = await Promise.all([
                getTeamsAction(accessToken),
                getUsersListAction(accessToken)
            ]);

            if (teamsResult.message === 'success') {
                setTeams(teamsResult.data);
            } else {
                throw new Error(teamsResult.message);
            }

            if (usersResult.message === 'success') {
                setUsers(usersResult.data.filter((u: User) => u.role === 'admin' || u.role === 'super_admin'));
            } else {
                throw new Error(usersResult.message);
            }
        } catch (error) {
            console.error('Failed to load data:', error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to load teams",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    }, [getAuthToken, toast]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    return {
        teams,
        users,
        loading,
        loadData,
        setTeams
    };
}