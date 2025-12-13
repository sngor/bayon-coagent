'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AdminErrorBoundary } from '@/components/admin/admin-error-boundary';
import { AdminLoading } from '@/components/admin/admin-loading';
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
import { useTeamsData } from '@/hooks/use-teams-data';
import { useTeamOperations } from '@/hooks/use-team-operations';
import type { Team, User } from '@/types/admin';

interface TeamDialogState {
    isOpen: boolean;
    mode: 'create' | 'edit';
    team: Team | null;
    name: string;
    adminId: string;
}

export function TeamsClient() {
    const { teams, users, loading, setTeams } = useTeamsData();
    const { createTeam, updateTeam, deleteTeam, isSaving } = useTeamOperations({ teams, setTeams });
    const [searchTerm, setSearchTerm] = useState('');

    const [dialogState, setDialogState] = useState<TeamDialogState>({
        isOpen: false,
        mode: 'create',
        team: null,
        name: '',
        adminId: ''
    });

    // Memoized filtered teams for performance
    const filteredTeams = useMemo(() => {
        if (!searchTerm) return teams;
        return teams.filter(team =>
            team.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [teams, searchTerm]);

    const handleCreate = () => {
        setDialogState({
            isOpen: true,
            mode: 'create',
            team: null,
            name: '',
            adminId: ''
        });
    };

    const handleEdit = (team: Team) => {
        setDialogState({
            isOpen: true,
            mode: 'edit',
            team,
            name: team.name,
            adminId: team.adminId
        });
    };

    const handleCloseDialog = () => {
        setDialogState(prev => ({ ...prev, isOpen: false }));
    };

    const handleSave = async () => {
        const { mode, team, name, adminId } = dialogState;

        let success = false;
        if (mode === 'create') {
            success = await createTeam(name, adminId);
        } else if (mode === 'edit' && team) {
            success = await updateTeam(team.id, name, adminId);
        }

        if (success) {
            handleCloseDialog();
        }
    };

    const getAdminName = (adminId: string) => {
        const admin = users.find(u => u.id === adminId);
        return admin ? admin.name || admin.email : 'Unknown';
    };

    return (
        <AdminErrorBoundary>
            <div className="space-y-8">
                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="font-headline text-3xl font-bold">Team Management</h1>
                        <p className="text-muted-foreground">Create and manage teams with assigned administrators</p>
                    </div>
                </div>

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
                            <AdminLoading type="table" count={5} />
                        ) : teams.length === 0 ? (
                            <EmptyState onCreateTeam={handleCreate} />
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <Input
                                        placeholder="Search teams..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="max-w-sm"
                                    />
                                </div>
                                <TeamsTable
                                    teams={filteredTeams}
                                    users={users}
                                    onEdit={handleEdit}
                                    onDelete={deleteTeam}
                                    getAdminName={getAdminName}
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>

                <TeamDialog
                    state={dialogState}
                    users={users}
                    isSaving={isSaving}
                    onClose={handleCloseDialog}
                    onNameChange={(name) => setDialogState(prev => ({ ...prev, name }))}
                    onAdminChange={(adminId) => setDialogState(prev => ({ ...prev, adminId }))}
                    onSave={handleSave}
                />
            </div>
        </AdminErrorBoundary>
    );
}

// Extracted Empty State Component
interface EmptyStateProps {
    onCreateTeam: () => void;
}

function EmptyState({ onCreateTeam }: EmptyStateProps) {
    return (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-full w-fit mx-auto mb-4">
                <Users className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No teams yet</h3>
            <p className="text-muted-foreground mb-4">Create your first team to get started</p>
            <Button onClick={onCreateTeam}>
                <Plus className="h-4 w-4 mr-2" />
                Create Team
            </Button>
        </div>
    );
}

// Extracted Teams Table Component
interface TeamsTableProps {
    teams: Team[];
    users: User[];
    onEdit: (team: Team) => void;
    onDelete: (team: Team) => Promise<boolean>;
    getAdminName: (adminId: string) => string;
}

function TeamsTable({ teams, onEdit, onDelete, getAdminName }: TeamsTableProps) {
    return (
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
                                        <DropdownMenuItem onClick={() => onEdit(team)}>
                                            <Pencil className="h-4 w-4 mr-2" />
                                            Edit Team
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={() => onDelete(team)}
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
    );
}

// Extracted Dialog Component with improved state management
interface TeamDialogProps {
    state: TeamDialogState;
    users: User[];
    isSaving: boolean;
    onClose: () => void;
    onNameChange: (name: string) => void;
    onAdminChange: (adminId: string) => void;
    onSave: () => void;
}

function TeamDialog({
    state,
    users,
    isSaving,
    onClose,
    onNameChange,
    onAdminChange,
    onSave
}: TeamDialogProps) {
    const { isOpen, mode, name, adminId } = state;
    const isEditing = mode === 'edit';

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit Team' : 'Create Team'}</DialogTitle>
                    <DialogDescription>
                        {isEditing ? 'Update team details' : 'Create a new team with an assigned admin'}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="teamName" className="text-right">
                            Team Name
                        </Label>
                        <Input
                            id="teamName"
                            value={name}
                            onChange={(e) => onNameChange(e.target.value)}
                            placeholder="e.g., Sales Team"
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="teamAdmin" className="text-right">
                            Team Admin
                        </Label>
                        <Select value={adminId} onValueChange={onAdminChange}>
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
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={onSave} disabled={isSaving}>
                        {isSaving ? "Saving..." : isEditing ? "Update Team" : "Create Team"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}