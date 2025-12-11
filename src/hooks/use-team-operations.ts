import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuthToken } from '@/hooks/use-auth-token';
import type { Team } from '@/types/admin';

interface UseTeamOperationsProps {
    teams: Team[];
    setTeams: React.Dispatch<React.SetStateAction<Team[]>>;
}

/**
 * Custom hook for team CRUD operations
 * Handles create, update, delete operations with proper error handling
 */
export function useTeamOperations({ teams, setTeams }: UseTeamOperationsProps) {
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();
    const { getAuthToken } = useAuthToken();

    const createTeam = async (teamName: string, teamAdminId: string): Promise<boolean> => {
        if (!teamName.trim()) {
            toast({ title: "Error", description: "Team name is required", variant: "destructive" });
            return false;
        }
        if (!teamAdminId) {
            toast({ title: "Error", description: "Team admin is required", variant: "destructive" });
            return false;
        }

        setIsSaving(true);
        try {
            const accessToken = getAuthToken();
            const { createTeamAction } = await import('@/features/admin/actions/admin-actions');
            const result = await createTeamAction(teamName, teamAdminId, accessToken);

            if (result.message === 'success') {
                toast({ title: "Team created", description: `${teamName} has been created` });
                setTeams([...teams, result.data]);
                return true;
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Failed to create team:', error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to create team",
                variant: "destructive"
            });
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    const updateTeam = async (teamId: string, teamName: string, teamAdminId: string): Promise<boolean> => {
        if (!teamName.trim()) {
            toast({ title: "Error", description: "Team name is required", variant: "destructive" });
            return false;
        }
        if (!teamAdminId) {
            toast({ title: "Error", description: "Team admin is required", variant: "destructive" });
            return false;
        }

        setIsSaving(true);
        try {
            const accessToken = getAuthToken();
            const { updateTeamAction } = await import('@/features/admin/actions/admin-actions');
            const result = await updateTeamAction(teamId, teamName, teamAdminId, accessToken);

            if (result.message === 'success') {
                toast({ title: "Team updated", description: `${teamName} has been updated` });
                setTeams(teams.map(t =>
                    t.id === teamId
                        ? { ...t, name: teamName, adminId: teamAdminId }
                        : t
                ));
                return true;
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Failed to update team:', error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to update team",
                variant: "destructive"
            });
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    const deleteTeam = async (team: Team): Promise<boolean> => {
        if (!confirm(`Are you sure you want to delete team "${team.name}"?`)) return false;

        try {
            const accessToken = getAuthToken();
            const { deleteTeamAction } = await import('@/features/admin/actions/admin-actions');
            const result = await deleteTeamAction(team.id, accessToken);

            if (result.message === 'success') {
                toast({ title: "Team deleted", description: `${team.name} has been deleted` });
                setTeams(teams.filter(t => t.id !== team.id));
                return true;
            } else {
                toast({ title: "Error", description: result.message, variant: "destructive" });
                return false;
            }
        } catch (error) {
            console.error('Failed to delete team:', error);
            toast({ title: "Error", description: "Failed to delete team", variant: "destructive" });
            return false;
        }
    };

    return {
        createTeam,
        updateTeam,
        deleteTeam,
        isSaving
    };
}