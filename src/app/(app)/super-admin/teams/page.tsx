'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from "@/hooks/use-toast";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Users,
    Plus,
    MoreHorizontal,
    Pencil,
    Trash2,
    Shield,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function TeamsPage() {
    const [teams, setTeams] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState<any>(null);
    const [teamName, setTeamName] = useState('');
    const [teamAdminId, setTeamAdminId] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            setLoading(true);
            const sessionStr = localStorage.getItem('cognito_session');
            let accessToken: string | undefined;
            if (sessionStr) {
                const session = JSON.parse(sessionStr);
                accessToken = session.accessToken;
            }

            // Load teams
            const { getTeamsAction } = await import('@/features/admin/actions/admin-actions');
            const teamsResult = await getTeamsAction(accessToken);
            if (teamsResult.message === 'success') {
                setTeams(teamsResult.data);
            }

            // Load users for admin selection
            const { getUsersListAction } = await import('@/features/admin/actions/admin-actions');
            const usersResult = await getUsersListAction(accessToken);
            if (usersResult.message === 'success') {
                setUsers(usersResult.data.filter(u => u.role === 'admin' || u.role === 'super_admin'));
            }
        } catch (error) {
            console.error('Failed to load data:', error);
            toast({ title: "Error", description: "Failed to load teams", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }

    const handleCreate = () => {
        setTeamName('');
        setTeamAdminId('');
        setIsCreateOpen(true);
    };

    const handleEdit = (team: any) => {
        setSelectedTeam(team);
        setTeamName(team.name);
        setTeamAdminId(team.adminId);
        setIsEditOpen(true);
    };

    const handleDelete = async (team: any) => {
        if (!confirm(`Are you sure you want to delete team "${team.name}"?`)) return;

        try {
            const sessionStr = localStorage.getItem('cognito_session');
            let accessToken: string | undefined;
            if (sessionStr) {
                const session = JSON.parse(sessionStr);
                accessToken = session.accessToken;
            }

            const { deleteTeamAction } = await import('@/features/admin/actions/admin-actions');
            const result = await deleteTeamAction(team.id, accessToken);

            if (result.message === 'success') {
                toast({ title: "Team deleted", description: `${team.name} has been deleted` });
                setTeams(teams.filter(t => t.id !== team.id));
            } else {
                toast({ title: "Error", description: result.message, variant: "destructive" });
            }
        } catch (error) {
            console.error('Failed to delete team:', error);
            toast({ title: "Error", description: "Failed to delete team", variant: "destructive" });
        }
    };

    const saveTeam = async () => {
        if (!teamName.trim()) {
            toast({ title: "Error", description: "Team name is required", variant: "destructive" });
            return;
        }
        if (!teamAdminId) {
            toast({ title: "Error", description: "Team admin is required", variant: "destructive" });
            return;
        }

        setIsSaving(true);
        try {
            const sessionStr = localStorage.getItem('cognito_session');
            let accessToken: string | undefined;
            if (sessionStr) {
                const session = JSON.parse(sessionStr);
                accessToken = session.accessToken;
            }

            if (isEditOpen && selectedTeam) {
                const { updateTeamAction } = await import('@/features/admin/actions/admin-actions');
                const result = await updateTeamAction(selectedTeam.id, teamName, teamAdminId, accessToken);

                if (result.message === 'success') {
                    toast({ title: "Team updated", description: `${teamName} has been updated` });
                    setTeams(teams.map(t => t.id === selectedTeam.id ? { ...t, name: teamName, adminId: teamAdminId } : t));
                    setIsEditOpen(false);
                } else {
                    toast({ title: "Error", description: result.message, variant: "destructive" });
                }
            } else {
                const { createTeamAction } = await import('@/features/admin/actions/admin-actions');
                const result = await createTeamAction(teamName, teamAdminId, accessToken);

                if (result.message === 'success') {
                    toast({ title: "Team created", description: `${teamName} has been created` });
                    setTeams([...teams, result.data]);
                    setIsCreateOpen(false);
                } else {
                    toast({ title: "Error", description: result.message, variant: "destructive" });
                }
            }
        } catch (error) {
            console.error('Failed to save team:', error);
            toast({ title: "Error", description: "Failed to save team", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const getAdminName = (adminId: string) => {
        const admin = users.find(u => u.id === adminId);
        return admin ? admin.name || admin.email : 'Unknown';
    };

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-xl">Team Management</CardTitle>
                            <CardDescription>Create and manage teams with assigned admins</CardDescription>
                        </div>
                        <Button onClick={handleCreate}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Team
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-12">Loading teams...</div>
                    ) : teams.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
                            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-full w-fit mx-auto mb-4">
                                <Users className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">No teams yet</h3>
                            <p className="text-muted-foreground mb-4">Create your first team to get started</p>
                            <Button onClick={handleCreate}>
                                <Plus className="h-4 w-4 mr-2" />
                                Create Team
                            </Button>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Team Name</TableHead>
                                        <TableHead>Members</TableHead>
                                        <TableHead>Team Admin</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {teams.map((team) => (
                                        <TableRow key={team.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1.5 bg-blue-100 dark:bg-blue-900/50 rounded">
                                                        <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                                    </div>
                                                    <span className="font-medium">{team.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Users className="w-4 h-4 text-muted-foreground" />
                                                    <span>{team.memberCount || 0} Agents</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Shield className="w-4 h-4 text-muted-foreground" />
                                                    <span>{getAdminName(team.adminId)}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {new Date(team.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Open menu</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuItem onClick={() => handleEdit(team)}>
                                                            <Pencil className="h-4 w-4 mr-2" />
                                                            Edit Team
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => handleDelete(team)}
                                                            className="text-red-600"
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Delete Team
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create/Edit Dialog */}
            <Dialog open={isCreateOpen || isEditOpen} onOpenChange={(open) => {
                setIsCreateOpen(false);
                setIsEditOpen(false);
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{isEditOpen ? 'Edit Team' : 'Create Team'}</DialogTitle>
                        <DialogDescription>
                            {isEditOpen ? 'Update team details' : 'Create a new team with an assigned admin'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="teamName" className="text-right">
                                Team Name
                            </Label>
                            <Input
                                id="teamName"
                                value={teamName}
                                onChange={(e) => setTeamName(e.target.value)}
                                placeholder="e.g., Sales Team"
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="teamAdmin" className="text-right">
                                Team Admin
                            </Label>
                            <Select value={teamAdminId} onValueChange={setTeamAdminId}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select an admin" />
                                </SelectTrigger>
                                <SelectContent>
                                    {users.map((user) => (
                                        <SelectItem key={user.id} value={user.id}>
                                            {user.name || user.email} ({user.role})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setIsCreateOpen(false);
                            setIsEditOpen(false);
                        }}>
                            Cancel
                        </Button>
                        <Button onClick={saveTeam} disabled={isSaving}>
                            {isSaving ? "Saving..." : isEditOpen ? "Update Team" : "Create Team"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
