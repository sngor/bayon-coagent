'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CardGradientMesh } from '@/components/ui/gradient-mesh';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Users, UserPlus, Mail, Shield, Trash2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
    getTeamMembersAction,
    inviteTeamMemberAction,
    removeTeamMemberAction,
    updateTeamMemberRoleAction,
    getPendingInvitationsAction,
    cancelInvitationAction
} from '@/app/admin-actions';
import { Invitation } from '@/lib/organization-types';

interface TeamMember {
    id: string;
    name: string;
    email: string;
    role: 'member' | 'admin';
    status: 'active' | 'pending';
    joinedAt: string;
}

export default function TeamManagementPage() {
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [pendingInvitations, setPendingInvitations] = useState<Invitation[]>([]);
    const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setIsLoading(true);
        try {
            const [membersResult, invitationsResult] = await Promise.all([
                getTeamMembersAction(),
                getPendingInvitationsAction()
            ]);

            if (membersResult.message === 'success' && membersResult.data) {
                setTeamMembers(membersResult.data);
            }
            if (invitationsResult.message === 'success' && invitationsResult.data) {
                setPendingInvitations(invitationsResult.data);
            }
        } catch (error) {
            console.error('Failed to load team data:', error);
            toast({
                title: 'Error',
                description: 'Failed to load team data',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    }

    async function handleInvite(formData: FormData) {
        const email = formData.get('email') as string;
        const role = formData.get('role') as 'member' | 'admin';

        const result = await inviteTeamMemberAction(email, role);

        if (result.message === 'success') {
            toast({
                title: 'Invitation sent',
                description: `Invitation sent to ${email}`,
            });
            setIsInviteDialogOpen(false);
            loadData();
        } else {
            toast({
                title: 'Error',
                description: result.message,
                variant: 'destructive',
            });
        }
    }

    async function handleRemoveMember(memberId: string) {
        if (!confirm('Are you sure you want to remove this team member?')) return;

        const result = await removeTeamMemberAction(memberId);

        if (result.message === 'success') {
            toast({
                title: 'Member removed',
                description: 'Team member has been removed',
            });
            loadData();
        } else {
            toast({
                title: 'Error',
                description: result.message,
                variant: 'destructive',
            });
        }
    }

    async function handleRoleChange(memberId: string, newRole: 'member' | 'admin') {
        const result = await updateTeamMemberRoleAction(memberId, newRole);

        if (result.message === 'success') {
            toast({
                title: 'Role updated',
                description: 'Team member role has been updated',
            });
            loadData();
        } else {
            toast({
                title: 'Error',
                description: result.message,
                variant: 'destructive',
            });
        }
    }

    async function handleCancelInvitation(invitationId: string) {
        if (!confirm('Are you sure you want to cancel this invitation?')) return;

        const result = await cancelInvitationAction(invitationId);

        if (result.message === 'success') {
            toast({
                title: 'Invitation cancelled',
                description: 'Invitation has been cancelled',
            });
            loadData();
        } else {
            toast({
                title: 'Error',
                description: result.message,
                variant: 'destructive',
            });
        }
    }

    const filteredMembers = teamMembers.filter(member =>
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search team members..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Button onClick={() => setIsInviteDialogOpen(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite Member
                </Button>
            </div>

            {/* Pending Invitations */}
            {pendingInvitations.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Pending Invitations</h3>
                    <div className="grid gap-4">
                        {pendingInvitations.map((invitation) => (
                            <Card key={invitation.id} className="overflow-hidden bg-background/50 border-primary/20">
                                <CardGradientMesh>
                                    <CardHeader className="p-4 relative z-10">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="p-2 bg-yellow-500/10 rounded-lg">
                                                    <Mail className="h-5 w-5 text-yellow-600" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-base">{invitation.email}</CardTitle>
                                                    <CardDescription className="flex items-center gap-2 mt-1 text-xs">
                                                        <Badge variant="outline" className="text-xs">{invitation.role}</Badge>
                                                        <span>Expires: {new Date(invitation.expiresAt).toLocaleDateString()}</span>
                                                    </CardDescription>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleCancelInvitation(invitation.id)}
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-2"
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </CardHeader>
                                </CardGradientMesh>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Team Members</h3>
                <div className="grid gap-4">
                    {isLoading ? (
                        <Card className="overflow-hidden bg-background/50 border-primary/20">
                            <CardGradientMesh>
                                <CardContent className="pt-6 relative z-10">
                                    <p className="text-center text-muted-foreground">Loading team members...</p>
                                </CardContent>
                            </CardGradientMesh>
                        </Card>
                    ) : filteredMembers.length === 0 ? (
                        <Card className="overflow-hidden bg-background/50 border-primary/20">
                            <CardGradientMesh>
                                <CardContent className="pt-6 relative z-10">
                                    <p className="text-center text-muted-foreground">No team members found</p>
                                </CardContent>
                            </CardGradientMesh>
                        </Card>
                    ) : (
                        filteredMembers.map((member) => (
                            <Card key={member.id} className="overflow-hidden bg-background/50 border-primary/20">
                                <CardGradientMesh>
                                    <CardHeader className="relative z-10">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="p-2 bg-primary/10 rounded-lg">
                                                    <Users className="h-5 w-5 text-primary" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-lg">{member.name}</CardTitle>
                                                    <CardDescription className="flex items-center gap-2 mt-1">
                                                        <Mail className="h-3 w-3" />
                                                        {member.email}
                                                    </CardDescription>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                                                    {member.status}
                                                </Badge>
                                                <Select
                                                    value={member.role}
                                                    onValueChange={(value) => handleRoleChange(member.id, value as 'member' | 'admin')}
                                                >
                                                    <SelectTrigger className="w-32">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="member">Member</SelectItem>
                                                        <SelectItem value="admin">Admin</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleRemoveMember(member.id)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                </CardGradientMesh>
                            </Card>
                        ))
                    )}
                </div>
            </div>

            {/* Invite Dialog */}
            <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                <DialogContent>
                    <form action={handleInvite}>
                        <DialogHeader>
                            <DialogTitle>Invite Team Member</DialogTitle>
                            <DialogDescription>
                                Send an invitation to join your team
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="colleague@example.com"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <Select name="role" defaultValue="member">
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="member">Member</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">Send Invitation</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
