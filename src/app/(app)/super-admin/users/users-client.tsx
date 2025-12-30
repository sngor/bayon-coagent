'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAdminStickyHeader } from '@/hooks/use-admin-sticky-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { getUsersListAction } from '@/features/admin/actions/admin-actions';
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
    UserPlus,
    Search,
    Filter,
    Download,
    Mail,
    Calendar,
    TrendingUp,
    Activity,
    Crown,
    UserX,
    Settings,
    MoreHorizontal,
    Shield,
    CheckCircle,
    XCircle,
    LogIn
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

export default function UsersClient() {
    const headerRef = useAdminStickyHeader({
        title: 'User Management'
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState<any[]>([]);
    const [teams, setTeams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [isEditRoleOpen, setIsEditRoleOpen] = useState(false);
    const [newRole, setNewRole] = useState<string>('agent');
    const [newTeamId, setNewTeamId] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('all');
    const [isAddUserOpen, setIsAddUserOpen] = useState(false);
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserName, setNewUserName] = useState('');
    const [newUserRole, setNewUserRole] = useState<string>('agent');
    const [newUserTeamId, setNewUserTeamId] = useState("");
    const [isAddingUser, setIsAddingUser] = useState(false);

    const handleImpersonate = async (user: any) => {
        if (!confirm(`Are you sure you want to login as ${user.email}?`)) return;

        try {
            const { impersonateUserAction } = await import('@/features/admin/actions/admin-actions');
            const result = await impersonateUserAction(user.id);

            if (result.message === 'success') {
                toast({
                    title: "Impersonation Started",
                    description: `You are now logged in as ${user.email}`
                });
                // Redirect to dashboard
                window.location.href = '/dashboard';
            } else {
                toast({ title: "Error", description: result.message, variant: "destructive" });
            }
        } catch (error) {
            console.error('Failed to impersonate:', error);
            toast({ title: "Error", description: "Failed to start impersonation", variant: "destructive" });
        }
    };

    const { toast } = useToast();

    useEffect(() => {
        async function loadUsers() {
            try {
                console.log('[AdminUsersPage] Loading users...');

                // First, ensure session cookie is set from localStorage
                const sessionStr = localStorage.getItem('cognito_session');
                console.log('[AdminUsersPage] Session from localStorage:', sessionStr ? 'EXISTS' : 'NULL');
                if (sessionStr) {
                    try {
                        const session = JSON.parse(sessionStr);
                        if (session.accessToken && session.idToken && session.refreshToken && session.expiresAt) {
                            console.log('[AdminUsersPage] Setting session cookie from localStorage...');
                            const { setSessionCookieAction } = await import('@/app/actions');
                            const cookieResult = await setSessionCookieAction(
                                session.accessToken,
                                session.idToken,
                                session.refreshToken,
                                session.expiresAt
                            );
                            console.log('[AdminUsersPage] Session cookie result:', cookieResult);

                            if (!cookieResult.success) {
                                throw new Error(cookieResult.error || 'Failed to set cookie');
                            }

                            // Small delay to ensure cookie is propagated
                            await new Promise(resolve => setTimeout(resolve, 100));

                            // Pass access token directly to bypass cookie issues
                            const result = await getUsersListAction(session.accessToken);
                            console.log('[AdminUsersPage] Result:', result);

                            if (result.message === 'success') {
                                console.log(`[AdminUsersPage] Loaded ${result.data.length} users`);
                                setUsers(result.data || []);

                                // Load teams
                                try {
                                    console.log('[AdminUsersPage] Loading teams...');
                                    const { getTeamsAction } = await import('@/features/admin/actions/admin-actions');
                                    const teamsResult = await getTeamsAction(session.accessToken);
                                    console.log('[AdminUsersPage] Teams result:', teamsResult);
                                    if (teamsResult.message === 'success') {
                                        console.log(`[AdminUsersPage] Loaded ${teamsResult.data.length} teams`);
                                        setTeams(teamsResult.data);
                                    } else {
                                        console.error('[AdminUsersPage] Failed to load teams:', teamsResult.message);
                                    }
                                } catch (teamsError) {
                                    console.error('[AdminUsersPage] Exception loading teams:', teamsError);
                                }
                            } else {
                                console.error('[AdminUsersPage] Failed to load users:', result.message);
                                toast({
                                    title: "Error",
                                    description: result.message || "Failed to load users",
                                    variant: "destructive"
                                });
                            }
                            return; // Exit early since we handled it
                        }
                    } catch (sessionError) {
                        console.error('[AdminUsersPage] Failed to parse/set session:', sessionError);
                    }
                }

                // Fallback: try without access token (will fail with helpful message)
                const result = await getUsersListAction();
                console.log('[AdminUsersPage] Result:', result);

                if (result.message === 'success') {
                    console.log(`[AdminUsersPage] Loaded ${result.data.length} users`);
                    setUsers(result.data || []);

                    // Load teams
                    try {
                        const sessionStr = localStorage.getItem('cognito_session');
                        let accessToken: string | undefined;
                        if (sessionStr) {
                            const session = JSON.parse(sessionStr);
                            accessToken = session.accessToken;
                        }

                        const { getTeamsAction } = await import('@/features/admin/actions/admin-actions');
                        const teamsResult = await getTeamsAction(accessToken);
                        if (teamsResult.message === 'success') {
                            setTeams(teamsResult.data);
                        }
                    } catch (teamsError) {
                        console.error('[AdminUsersPage] Failed to load teams:', teamsError);
                    }
                } else {
                    console.error('[AdminUsersPage] Failed to load users:', result.message);

                    // If authentication error, show helpful message
                    if (result.message.includes('Not authenticated') || result.message.includes('log out')) {
                        toast({
                            title: "Session Refresh Required",
                            description: "Please log out and log back in to refresh your session, then try again.",
                            variant: "destructive",
                            duration: 10000,
                        });
                    } else {
                        toast({
                            title: "Error",
                            description: result.message || "Failed to load users",
                            variant: "destructive"
                        });
                    }
                }
            } catch (error) {
                console.error('[AdminUsersPage] Exception loading users:', error);
                toast({ title: "Error", description: "Failed to load users", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        }
        loadUsers();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleEditRole = (user: any) => {
        setSelectedUser(user);
        setNewRole(user.role || 'agent');
        setNewTeamId(user.teamId || '');
        setIsEditRoleOpen(true);
    };

    const handleDisableUser = async (user: any, disable: boolean) => {
        const action = disable ? 'disable' : 'enable';
        if (!confirm(`Are you sure you want to ${action} ${user.email}?`)) return;

        try {
            const sessionStr = localStorage.getItem('cognito_session');
            let accessToken: string | undefined;
            if (sessionStr) {
                const session = JSON.parse(sessionStr);
                accessToken = session.accessToken;
            }

            const { disableUserAction } = await import('@/features/admin/actions/admin-actions');
            const result = await disableUserAction(user.id, disable, accessToken);

            if (result.message === 'success') {
                toast({
                    title: `User ${action}d`,
                    description: `${user.email} has been ${action}d`
                });
                // Update local state
                setUsers(users.map(u => u.id === user.id ? {
                    ...u,
                    status: disable ? 'disabled' : 'active',
                    cognitoStatus: disable ? 'DISABLED' : 'CONFIRMED'
                } : u));
            } else {
                toast({ title: "Error", description: result.message, variant: "destructive" });
            }
        } catch (error) {
            console.error(`Failed to ${action} user:`, error);
            toast({ title: "Error", description: `Failed to ${action} user`, variant: "destructive" });
        }
    };

    const saveRole = async () => {
        if (!selectedUser) return;
        setIsSaving(true);
        try {
            // Get access token from localStorage
            const sessionStr = localStorage.getItem('cognito_session');
            let accessToken: string | undefined;
            if (sessionStr) {
                try {
                    const session = JSON.parse(sessionStr);
                    accessToken = session.accessToken;
                } catch (e) {
                    console.error('Failed to parse session:', e);
                }
            }

            const { updateUserRoleAction } = await import('@/features/admin/actions/admin-actions');

            // Get team name from team ID
            const team = teams.find(t => t.id === newTeamId);
            const teamName = team ? team.name : undefined;

            console.log('[saveRole] Saving user:', selectedUser.id);
            console.log('[saveRole] New role:', newRole);
            console.log('[saveRole] New team ID:', newTeamId);
            console.log('[saveRole] Team found:', team);
            console.log('[saveRole] Team name to send:', teamName);

            const result = await updateUserRoleAction(
                selectedUser.id,
                newRole as 'agent' | 'admin' | 'super_admin',
                teamName,
                accessToken
            );

            console.log('[saveRole] Result:', result);

            if (result.message === 'success') {
                toast({
                    title: "User updated",
                    description: `${selectedUser.email} updated successfully`
                });
                // Update local state
                const team = teams.find(t => t.id === newTeamId);
                setUsers(users.map(u => u.id === selectedUser.id ? {
                    ...u,
                    role: newRole,
                    teamId: newTeamId,
                    teamName: team ? team.name : undefined
                } : u));
                setIsEditRoleOpen(false);
            } else {
                toast({ title: "Error", description: result.message, variant: "destructive" });
            }
        } catch (error) {
            console.error('Failed to update role:', error);
            toast({ title: "Error", description: "Failed to update role", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddUser = async () => {
        if (!newUserEmail || !newUserName) {
            toast({ title: "Error", description: "Email and Name are required", variant: "destructive" });
            return;
        }

        setIsAddingUser(true);
        try {
            const sessionStr = localStorage.getItem('cognito_session');
            let accessToken: string | undefined;
            if (sessionStr) {
                const session = JSON.parse(sessionStr);
                accessToken = session.accessToken;
            }

            const { createUserAction } = await import('@/features/admin/actions/admin-actions');
            const result = await createUserAction(
                newUserEmail,
                newUserName,
                newUserRole as 'agent' | 'admin' | 'super_admin',
                newUserTeamId || undefined,
                accessToken
            );

            if (result.message === 'success') {
                toast({
                    title: "User created",
                    description: `User ${newUserEmail} created successfully. Temp password: ${result.data.tempPassword}`,
                    duration: 10000,
                });
                // Refresh users
                // Ideally we would just add to the list, but we need the ID and other fields
                // For now, let's just reload the page or re-fetch
                window.location.reload();
            } else {
                toast({ title: "Error", description: result.message, variant: "destructive" });
            }
        } catch (error) {
            console.error('Failed to create user:', error);
            toast({ title: "Error", description: "Failed to create user", variant: "destructive" });
        } finally {
            setIsAddingUser(false);
            setIsAddUserOpen(false);
        }
    };

    const filteredUsers = useMemo(() => {
        let filtered = users;

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(user =>
                user.email?.toLowerCase().includes(query) ||
                user.name?.toLowerCase().includes(query) ||
                user.id?.toLowerCase().includes(query) ||
                user.role?.toLowerCase().includes(query)
            );
        }

        // Tab filter
        switch (activeTab) {
            case 'all':
                // Show all users including admins
                break;
            case 'active':
                // Show regular active agents (non-admin)
                filtered = filtered.filter(user =>
                    user.role === 'agent' &&
                    user.status !== 'suspended' &&
                    user.status !== 'inactive'
                );
                break;
            case 'inactive':
                filtered = filtered.filter(user => user.status === 'suspended' || user.status === 'inactive');
                break;
            case 'premium':
                // Show admin and super_admin accounts
                filtered = filtered.filter(user => user.role === 'admin' || user.role === 'super_admin');
                break;
        }

        return filtered;
    }, [users, searchQuery, activeTab]);

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div ref={headerRef} className="flex items-center justify-between">
                <div>
                    <h1 className="font-headline text-3xl font-bold">User Management</h1>
                    <p className="text-muted-foreground">Manage user accounts, roles, and permissions</p>
                </div>
            </div>

            {/* User Overview Stats */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20" />
                    <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                            <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold">{loading ? '...' : users.length}</div>
                        <div className="flex items-center gap-2 mt-2">
                            <Activity className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                                {users.filter(u => u.role === 'admin' || u.role === 'super_admin').length} admins
                            </span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20" />
                    <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Agents</CardTitle>
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                            <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold">
                            {loading ? '...' : users.filter(u => u.role === 'agent').length}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <Activity className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Agent accounts</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20" />
                    <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Admins</CardTitle>
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                            <Shield className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold">
                            {loading ? '...' : users.filter(u => u.role === 'admin').length}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <Activity className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Admin accounts</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20" />
                    <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Super Admins</CardTitle>
                        <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
                            <Crown className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold">
                            {loading ? '...' : users.filter(u => u.role === 'super_admin').length}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <Activity className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Super admin accounts</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* User Management Interface */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-xl">User Management</CardTitle>
                            <CardDescription>Search, filter, and manage user accounts</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-2" />
                                Export
                            </Button>
                            <Button size="sm" onClick={() => setIsAddUserOpen(true)}>
                                <UserPlus className="h-4 w-4 mr-2" />
                                Add User
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="all" className="space-y-6" onValueChange={setActiveTab}>
                        <div className="flex items-center justify-between">
                            <TabsList>
                                <TabsTrigger value="all">All Users ({users.length})</TabsTrigger>
                                <TabsTrigger value="active">Agents</TabsTrigger>
                                <TabsTrigger value="premium">Admins ({users.filter(u => u.role === 'admin' || u.role === 'super_admin').length})</TabsTrigger>
                                <TabsTrigger value="inactive">Inactive</TabsTrigger>
                            </TabsList>

                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search users..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 w-64"
                                    />
                                </div>
                                <Button variant="outline" size="sm">
                                    <Filter className="h-4 w-4 mr-2" />
                                    Filter
                                </Button>
                            </div>
                        </div>

                        <TabsContent value="all" className="space-y-4">
                            <UserTableComponent
                                users={filteredUsers}
                                loading={loading}
                                onEditRole={handleEditRole}
                                onDisableUser={handleDisableUser}
                                onImpersonate={handleImpersonate}
                            />
                        </TabsContent>
                        <TabsContent value="active" className="space-y-4">
                            <UserTableComponent
                                users={filteredUsers}
                                loading={loading}
                                onEditRole={handleEditRole}
                                onDisableUser={handleDisableUser}
                                onImpersonate={handleImpersonate}
                            />
                        </TabsContent>
                        <TabsContent value="inactive" className="space-y-4">
                            <UserTableComponent
                                users={filteredUsers}
                                loading={loading}
                                onEditRole={handleEditRole}
                                onDisableUser={handleDisableUser}
                                onImpersonate={handleImpersonate}
                            />
                        </TabsContent>
                        <TabsContent value="premium" className="space-y-4">
                            <UserTableComponent
                                users={filteredUsers}
                                loading={loading}
                                onEditRole={handleEditRole}
                                onDisableUser={handleDisableUser}
                                onImpersonate={handleImpersonate}
                            />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* User Analytics */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">User Growth Trends</CardTitle>
                        <CardDescription>Registration and activity patterns over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-8 text-muted-foreground">
                            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p className="font-medium mb-2">Growth Analytics Coming Soon</p>
                            <p className="text-sm">Charts and trends will appear here as user data accumulates</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Feature Usage</CardTitle>
                        <CardDescription>Most popular features among users</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Studio (Content Creation)</span>
                                <span className="text-sm text-muted-foreground">0 uses</span>
                            </div>
                            <Progress value={0} className="h-2" />

                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Market Research</span>
                                <span className="text-sm text-muted-foreground">0 uses</span>
                            </div>
                            <Progress value={0} className="h-2" />

                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Brand Tools</span>
                                <span className="text-sm text-muted-foreground">0 uses</span>
                            </div>
                            <Progress value={0} className="h-2" />

                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Calculators</span>
                                <span className="text-sm text-muted-foreground">0 uses</span>
                            </div>
                            <Progress value={0} className="h-2" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                    <CardDescription>Common user management tasks</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Button variant="outline" className="h-20 flex-col gap-2">
                            <Mail className="h-5 w-5" />
                            <span className="text-sm">Send Newsletter</span>
                        </Button>
                        <Button variant="outline" className="h-20 flex-col gap-2">
                            <UserPlus className="h-5 w-5" />
                            <span className="text-sm">Bulk Import</span>
                        </Button>
                        <Button variant="outline" className="h-20 flex-col gap-2">
                            <Download className="h-5 w-5" />
                            <span className="text-sm">Export Data</span>
                        </Button>
                        <Button variant="outline" className="h-20 flex-col gap-2">
                            <Settings className="h-5 w-5" />
                            <span className="text-sm">User Settings</span>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isEditRoleOpen} onOpenChange={setIsEditRoleOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                        <DialogDescription>
                            Update role and team assignment for {selectedUser?.email}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="role" className="text-right">
                                Role
                            </Label>
                            <Select value={newRole} onValueChange={setNewRole}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="agent">Agent</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="super_admin">Super Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="team" className="text-right">
                                Team
                            </Label>
                            <Select value={newTeamId || "none"} onValueChange={(value) => setNewTeamId(value === "none" ? "" : value)}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select a team (optional)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">No Team</SelectItem>
                                    {teams.map((team) => (
                                        <SelectItem key={team.id} value={team.id}>
                                            {team.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditRoleOpen(false)}>Cancel</Button>
                        <Button onClick={saveRole} disabled={isSaving}>
                            {isSaving ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New User</DialogTitle>
                        <DialogDescription>
                            Create a new user account. They will receive an email with login instructions.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email" className="text-right">
                                Email
                            </Label>
                            <Input
                                id="email"
                                value={newUserEmail}
                                onChange={(e) => setNewUserEmail(e.target.value)}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Name
                            </Label>
                            <Input
                                id="name"
                                value={newUserName}
                                onChange={(e) => setNewUserName(e.target.value)}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="role" className="text-right">
                                Role
                            </Label>
                            <Select value={newUserRole} onValueChange={setNewUserRole}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="agent">Agent</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="super_admin">Super Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="team" className="text-right">
                                Team
                            </Label>
                            <Select value={newUserTeamId || "none"} onValueChange={(value) => setNewUserTeamId(value === "none" ? "" : value)}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select a team (optional)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">No Team</SelectItem>
                                    {teams.map((team) => (
                                        <SelectItem key={team.id} value={team.id}>
                                            {team.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddUser} disabled={isAddingUser}>
                            {isAddingUser ? "Creating..." : "Create User"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function UserTableComponent({ users, loading, onEditRole, onDisableUser, onImpersonate }: {
    users: any[],
    loading: boolean,
    onEditRole: (user: any) => void,
    onDisableUser: (user: any, disable: boolean) => void,
    onImpersonate: (user: any) => void
}) {
    if (loading) {
        return <div className="text-center py-12">Loading users...</div>;
    }

    if (users.length === 0) {
        return (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-full w-fit mx-auto mb-4">
                    <Users className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No users found</h3>
                <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                    No users match your search criteria.
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Team</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map((user) => (
                        <TableRow key={user.id} className={user.role === 'super_admin' || user.role === 'admin' ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''}>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    {(user.role === 'super_admin' || user.role === 'admin') && (
                                        <div className="p-1.5 bg-blue-100 dark:bg-blue-900/50 rounded">
                                            <Shield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                    )}
                                    <div className="flex flex-col">
                                        <span className="font-medium">{user.name || 'Unknown'}</span>
                                        <span className="text-xs text-muted-foreground">{user.email}</span>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant={
                                    user.role === 'super_admin' ? 'destructive' :
                                        user.role === 'admin' ? 'default' : 'secondary'
                                }>
                                    {user.role === 'super_admin' && <Crown className="w-3 h-3 mr-1" />}
                                    {user.role === 'admin' && <Shield className="w-3 h-3 mr-1" />}
                                    {user.role === 'super_admin' ? 'Super Admin' : user.role === 'admin' ? 'Admin' : 'Agent'}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                {user.teamName ? (
                                    <Badge variant="outline" className="font-normal">
                                        {user.teamName}
                                    </Badge>
                                ) : (
                                    <span className="text-xs text-muted-foreground">No team</span>
                                )}
                            </TableCell>
                            <TableCell>
                                {user.status === 'disabled' || user.cognitoStatus === 'DISABLED' ? (
                                    <div className="flex items-center gap-2">
                                        <XCircle className="w-4 h-4 text-red-500" />
                                        <span className="text-sm text-red-600">Disabled</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                        <span className="text-sm">Active</span>
                                    </div>
                                )}
                            </TableCell>
                            <TableCell>
                                {new Date(user.createdAt).toLocaleDateString()}
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
                                        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.id)}>
                                            Copy ID
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => onImpersonate(user)} className="text-amber-600">
                                            <LogIn className="mr-2 h-4 w-4" />
                                            Login as User
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem>View Details</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onEditRole(user)}>Edit User</DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        {user.status === 'disabled' || user.cognitoStatus === 'DISABLED' ? (
                                            <DropdownMenuItem
                                                onClick={() => onDisableUser(user, false)}
                                                className="text-green-600"
                                            >
                                                Enable User
                                            </DropdownMenuItem>
                                        ) : (
                                            <DropdownMenuItem
                                                onClick={() => onDisableUser(user, true)}
                                                className="text-red-600"
                                            >
                                                Disable User
                                            </DropdownMenuItem>
                                        )}
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