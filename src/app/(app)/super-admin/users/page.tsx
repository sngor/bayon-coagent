'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AnimatedTabs as Tabs, AnimatedTabsContent as TabsContent, AnimatedTabsList as TabsList, AnimatedTabsTrigger as TabsTrigger } from '@/components/ui/animated-tabs';
import { Progress } from '@/components/ui/progress';
import { getUsersListAction } from '@/app/admin-actions';
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
    XCircle
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
import { createAdminUserAction } from '@/app/actions';
import { useToast } from "@/hooks/use-toast"

export default function AdminUsersPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [isEditRoleOpen, setIsEditRoleOpen] = useState(false);
    const [newRole, setNewRole] = useState<string>('user');
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('all');
    const { toast } = useToast();

    useEffect(() => {
        async function loadUsers() {
            try {
                const result = await getUsersListAction();
                if (result.message === 'success') {
                    setUsers(result.data);
                }
            } catch (error) {
                console.error('Failed to load users', error);
                toast({ title: "Error", description: "Failed to load users", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        }
        loadUsers();
    }, []);

    const handleEditRole = (user: any) => {
        setSelectedUser(user);
        setNewRole(user.role || 'user');
        setIsEditRoleOpen(true);
    };

    const saveRole = async () => {
        if (!selectedUser) return;
        setIsSaving(true);
        try {
            const formData = new FormData();
            formData.append('email', selectedUser.email);
            formData.append('role', newRole);

            const result = await createAdminUserAction(null, formData);
            if (result.message === 'success') {
                toast({ title: "Role updated", description: `User ${selectedUser.email} is now ${newRole}` });
                // Update local state
                setUsers(users.map(u => u.id === selectedUser.id ? { ...u, role: newRole } : u));
                setIsEditRoleOpen(false);
            } else {
                toast({ title: "Error", description: result.message, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to update role", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const getFilteredUsers = () => {
        let filtered = users;

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(user =>
                user.email?.toLowerCase().includes(query) ||
                user.name?.toLowerCase().includes(query) ||
                user.id?.toLowerCase().includes(query)
            );
        }

        // Tab filter
        switch (activeTab) {
            case 'active':
                // Assuming all users in the list are "active" for now unless they have a specific status field
                // If we had a 'status' field, we'd filter by it. 
                // For now, let's just show all as active to avoid empty state if status is missing
                // or filter if status exists
                filtered = filtered.filter(user => user.status !== 'suspended' && user.status !== 'inactive');
                break;
            case 'inactive':
                filtered = filtered.filter(user => user.status === 'suspended' || user.status === 'inactive');
                break;
            case 'premium':
                filtered = filtered.filter(user => user.role === 'admin' || user.role === 'super_admin'); // Proxy for premium for now
                break;
        }

        return filtered;
    };

    const filteredUsers = getFilteredUsers();

    return (
        <div className="space-y-8">
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
                        <div className="text-3xl font-bold">{users.length}</div>
                        <div className="flex items-center gap-2 mt-2">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-green-600 font-medium">Updated just now</span>
                        </div>
                    </CardContent>
                </Card>
                {/* Other stats cards kept static for now as they require more complex queries */}
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
                            <Button size="sm">
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
                                <TabsTrigger value="all">All Users</TabsTrigger>
                                <TabsTrigger value="active">Active</TabsTrigger>
                                <TabsTrigger value="inactive">Inactive</TabsTrigger>
                                <TabsTrigger value="premium">Premium</TabsTrigger>
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
                            <UserTable users={filteredUsers} loading={loading} onEditRole={handleEditRole} />
                        </TabsContent>
                        <TabsContent value="active" className="space-y-4">
                            <UserTable users={filteredUsers} loading={loading} onEditRole={handleEditRole} />
                        </TabsContent>
                        <TabsContent value="inactive" className="space-y-4">
                            <UserTable users={filteredUsers} loading={loading} onEditRole={handleEditRole} />
                        </TabsContent>
                        <TabsContent value="premium" className="space-y-4">
                            <UserTable users={filteredUsers} loading={loading} onEditRole={handleEditRole} />
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
                        <DialogTitle>Edit User Role</DialogTitle>
                        <DialogDescription>
                            Change the role for {selectedUser?.email}. This will affect their permissions.
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
                                    <SelectItem value="user">User</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="super_admin">Super Admin</SelectItem>
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
        </div>
    );
}

function UserTable({ users, loading, onEditRole }: { users: any[], loading: boolean, onEditRole: (user: any) => void }) {
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
                        <TableHead>Status</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map((user) => (
                        <TableRow key={user.id}>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="font-medium">{user.name || 'Unknown'}</span>
                                    <span className="text-xs text-muted-foreground">{user.email}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant={
                                    user.role === 'super_admin' ? 'destructive' :
                                        user.role === 'admin' ? 'default' : 'secondary'
                                }>
                                    {user.role === 'super_admin' && <Shield className="w-3 h-3 mr-1" />}
                                    {user.role || 'user'}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    <span className="text-sm">Active</span>
                                </div>
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
                                        <DropdownMenuItem>View Details</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onEditRole(user)}>Edit Role</DropdownMenuItem>
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