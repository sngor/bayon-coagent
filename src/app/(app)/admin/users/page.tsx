'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
    Search,
    Shield,
    CheckCircle,
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

export default function AdminUsersPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        async function loadUsers() {
            try {
                const sessionStr = localStorage.getItem('cognito_session');
                let accessToken: string | undefined;
                if (sessionStr) {
                    const session = JSON.parse(sessionStr);
                    accessToken = session.accessToken;
                }

                const result = await getUsersListAction(accessToken);

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
                                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                                    <span className="text-sm">Active</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
