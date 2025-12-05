'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { getUsersListAction, getAgentStatsAction, disableUserAction } from '@/features/admin/actions/admin-actions';
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
    Search,
    Shield,
    CheckCircle,
    Eye,
    UserCog,
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { useUserRole } from '@/hooks/use-user-role';
import { RoleProtectedFeature } from '@/components/admin/role-protected-feature';
import { RoleBadge } from '@/components/admin/role-badge';

export default function AdminUsersPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const { isSuperAdmin } = useUserRole();

    // Agent Details State
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [agentStats, setAgentStats] = useState<any>(null);
    const [statsLoading, setStatsLoading] = useState(false);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    useEffect(() => {
        async function loadUsers() {
            try {
                const sessionStr = localStorage.getItem('cognito_session');
                let accessToken: string | undefined;
                if (sessionStr) {
                    const session = JSON.parse(sessionStr);
                    accessToken = session.accessToken;
                }

                const result = await getUsersListAction(accessToken, undefined, undefined, { filterByTeam: true });

                if (result.message === 'success') {
                    setUsers(result.data || []);
                } else {
                    toast({
                        title: "Error",
                        description: result.message || "Failed to load users",
                        variant: "destructive"
                    });
                }
            } catch (error) {
                console.error('Failed to load users:', error);
                toast({ title: "Error", description: "Failed to load users", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        }
        loadUsers();
    }, [toast]);

    const getFilteredUsers = () => {
        if (!searchQuery) return users;

        const query = searchQuery.toLowerCase();
        return users.filter(user =>
            user.email?.toLowerCase().includes(query) ||
            user.name?.toLowerCase().includes(query) ||
            user.teamName?.toLowerCase().includes(query)
        );
    };



    const handleToggleStatus = async (user: any, enabled: boolean) => {
        try {
            const sessionStr = localStorage.getItem('cognito_session');
            let accessToken: string | undefined;
            if (sessionStr) {
                const session = JSON.parse(sessionStr);
                accessToken = session.accessToken;
            }

            // Optimistic update
            setUsers(users.map(u => u.id === user.id ? { ...u, enabled } : u));

            const result = await disableUserAction(user.id, !enabled, accessToken);

            if (result.message === 'success') {
                toast({
                    title: "Success",
                    description: `User ${enabled ? 'enabled' : 'disabled'} successfully`,
                });
            } else {
                // Revert on failure
                setUsers(users.map(u => u.id === user.id ? { ...u, enabled: !enabled } : u));
                toast({
                    title: "Error",
                    description: result.message || "Failed to update user status",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Failed to update status:', error);
            // Revert on failure
            setUsers(users.map(u => u.id === user.id ? { ...u, enabled: !enabled } : u));
            toast({
                title: "Error",
                description: "Failed to update user status",
                variant: "destructive"
            });
        }
    };

    const handleViewDetails = async (user: any) => {
        setSelectedUser(user);
        setIsSheetOpen(true);
        setStatsLoading(true);
        setAgentStats(null);

        try {
            const sessionStr = localStorage.getItem('cognito_session');
            let accessToken: string | undefined;
            if (sessionStr) {
                const session = JSON.parse(sessionStr);
                accessToken = session.accessToken;
            }

            const result = await getAgentStatsAction(user.id, accessToken);
            if (result.message === 'success') {
                setAgentStats(result.data);
            } else {
                toast({
                    title: "Error",
                    description: "Failed to load agent stats",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Failed to load stats:', error);
        } finally {
            setStatsLoading(false);
        }
    };

    const filteredUsers = getFilteredUsers();

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-xl">Team Members</CardTitle>
                            <CardDescription>View users in your teams</CardDescription>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search users..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 w-64"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-12">Loading users...</div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
                            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-full w-fit mx-auto mb-4">
                                <Users className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">No users found</h3>
                            <p className="text-muted-foreground">
                                {users.length === 0
                                    ? 'No users assigned to your teams yet'
                                    : 'No users match your search criteria'}
                            </p>
                        </div>
                    ) : (
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
                                    {filteredUsers.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{user.name || 'Unknown'}</span>
                                                    <span className="text-xs text-muted-foreground">{user.email}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                                                    {user.role === 'admin' && <Shield className="w-3 h-3 mr-1" />}
                                                    {user.role === 'admin' ? 'Admin' : 'Agent'}
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
                                                <div className="flex items-center gap-2">
                                                    {user.enabled ? (
                                                        <>
                                                            <CheckCircle className="w-4 h-4 text-green-500" />
                                                            <span className="text-sm">Active</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                                                            <span className="text-sm text-muted-foreground">Disabled</span>
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <div className="flex items-center gap-2 mr-2">
                                                        <span className="text-xs text-muted-foreground">
                                                            {user.enabled ? 'Enabled' : 'Disabled'}
                                                        </span>
                                                        <Switch
                                                            checked={user.enabled}
                                                            onCheckedChange={(checked) => handleToggleStatus(user, checked)}
                                                            disabled={user.role === 'admin' || user.role === 'super_admin'} // Prevent disabling admins for now, or add logic to check if self
                                                        />
                                                    </div>
                                                    <RoleProtectedFeature
                                                        requiredRole="superadmin"
                                                        renderDisabled
                                                        showTooltip
                                                        tooltipMessage="Only SuperAdmins can manage user roles"
                                                    >
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => {
                                                                // TODO: Open role management dialog
                                                                toast({
                                                                    title: "Coming Soon",
                                                                    description: "Role management dialog will be implemented in a future task",
                                                                });
                                                            }}
                                                        >
                                                            <UserCog className="w-4 h-4 mr-2" />
                                                            Manage Role
                                                        </Button>
                                                    </RoleProtectedFeature>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleViewDetails(user)}
                                                    >
                                                        <Eye className="w-4 h-4 mr-2" />
                                                        Details
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="sm:max-w-xl overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>Agent Details</SheetTitle>
                        <SheetDescription>
                            View detailed information and statistics for {selectedUser?.name}
                        </SheetDescription>
                    </SheetHeader>

                    {selectedUser && (
                        <div className="mt-6 space-y-6">
                            {/* User Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Name</h4>
                                    <p className="text-sm font-medium">{selectedUser.name}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Email</h4>
                                    <p className="text-sm font-medium">{selectedUser.email}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Role</h4>
                                    <RoleBadge role={selectedUser.role || 'user'} size="sm" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Team</h4>
                                    <p className="text-sm font-medium">{selectedUser.teamName || 'No Team'}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Joined</h4>
                                    <p className="text-sm font-medium">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Status</h4>
                                    <div className="flex items-center gap-2">
                                        {selectedUser.enabled ? (
                                            <>
                                                <CheckCircle className="w-4 h-4 text-green-500" />
                                                <span className="text-sm">Active</span>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                                                <span className="text-sm text-muted-foreground">Disabled</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="border-t pt-6">
                                <h3 className="text-lg font-semibold mb-4">Performance Statistics</h3>
                                {statsLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                    </div>
                                ) : agentStats ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        <Card>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                                    Client Dashboards
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold">{agentStats.dashboardCount}</div>
                                                <p className="text-xs text-muted-foreground">Created to date</p>
                                            </CardContent>
                                        </Card>

                                        <Card>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                                    Last Active
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-lg font-bold">
                                                    {agentStats.lastActive
                                                        ? new Date(agentStats.lastActive).toLocaleDateString()
                                                        : 'Never'}
                                                </div>
                                                <p className="text-xs text-muted-foreground">Last profile update</p>
                                            </CardContent>
                                        </Card>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        Failed to load statistics
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
