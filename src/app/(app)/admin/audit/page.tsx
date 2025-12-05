'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CardGradientMesh } from '@/components/ui/gradient-mesh';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Loader2,
    Search,
    Filter,
    RefreshCw,
    ChevronRight,
    Calendar,
    Shield,
    User,
    Clock,
} from 'lucide-react';
import { getRoleAuditLog } from '../role-actions';
import { RoleAuditLog } from '@/aws/dynamodb/admin-types';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from 'use-debounce';
import { AdminPageHeader } from '@/components/admin-page-header';
import { useUserRole } from '@/hooks/use-user-role';
import { PermissionDenied } from '@/components/admin/role-protected-feature';

export default function AuditLogPage() {
    const [logs, setLogs] = useState<RoleAuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastKey, setLastKey] = useState<string | undefined>(undefined);
    const [hasMore, setHasMore] = useState(false);

    // Filters
    const [userId, setUserId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [debouncedUserId] = useDebounce(userId, 500);

    const { toast } = useToast();
    const { isSuperAdmin, isLoading: roleLoading } = useUserRole();

    const fetchLogs = useCallback(
        async (token?: string, append: boolean = false) => {
            setLoading(true);
            try {
                const result = await getRoleAuditLog({
                    userId: debouncedUserId || undefined,
                    startDate: startDate || undefined,
                    endDate: endDate || undefined,
                    limit: 50,
                    lastKey: token,
                });

                if (result.success && result.data) {
                    if (append) {
                        setLogs((prev) => [...prev, ...result.data!.logs]);
                    } else {
                        setLogs(result.data.logs);
                    }
                    setLastKey(result.data.lastKey);
                    setHasMore(!!result.data.lastKey);
                } else {
                    toast({
                        title: 'Error',
                        description: result.error || 'Failed to fetch audit logs',
                        variant: 'destructive',
                    });
                }
            } catch (error) {
                console.error('Error fetching logs:', error);
                toast({
                    title: 'Error',
                    description: 'Failed to fetch audit logs',
                    variant: 'destructive',
                });
            } finally {
                setLoading(false);
            }
        },
        [debouncedUserId, startDate, endDate, toast]
    );

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const handleRefresh = () => {
        setLastKey(undefined);
        setHasMore(false);
        fetchLogs();
    };

    const handleLoadMore = () => {
        if (lastKey && !loading) {
            fetchLogs(lastKey, true);
        }
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'superadmin':
                return 'bg-purple-500/15 text-purple-700 dark:text-purple-400 hover:bg-purple-500/25 border-purple-500/20';
            case 'admin':
                return 'bg-blue-500/15 text-blue-700 dark:text-blue-400 hover:bg-blue-500/25 border-blue-500/20';
            default:
                return 'bg-gray-500/15 text-gray-700 dark:text-gray-400 hover:bg-gray-500/25 border-gray-500/20';
        }
    };

    const getActionBadgeColor = (action: string) => {
        switch (action) {
            case 'assign':
                return 'bg-green-500/15 text-green-700 dark:text-green-400 hover:bg-green-500/25 border-green-500/20';
            case 'revoke':
                return 'bg-red-500/15 text-red-700 dark:text-red-400 hover:bg-red-500/25 border-red-500/20';
            default:
                return 'bg-gray-500/15 text-gray-700 dark:text-gray-400 hover:bg-gray-500/25 border-gray-500/20';
        }
    };

    // Show loading state while checking role
    if (roleLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    // Show permission denied if not SuperAdmin
    if (!isSuperAdmin) {
        return (
            <PermissionDenied
                requiredRole="superadmin"
                message="The Audit Log is only accessible to SuperAdmins. This page tracks all role changes and administrative actions."
            />
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <AdminPageHeader />
                <Button onClick={handleRefresh} variant="outline" size="sm" disabled={loading}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Filters Card */}
            <Card className="overflow-hidden bg-background/50 border-primary/20">
                <CardGradientMesh>
                    <CardHeader className="relative z-10">
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Filters
                        </CardTitle>
                        <CardDescription>Filter audit logs by user or date range</CardDescription>
                    </CardHeader>
                    <CardContent className="relative z-10 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="user-id">User ID or Email</Label>
                                <div className="relative">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="user-id"
                                        placeholder="Search by user..."
                                        className="pl-8"
                                        value={userId}
                                        onChange={(e) => setUserId(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="start-date">Start Date</Label>
                                <div className="relative">
                                    <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="start-date"
                                        type="date"
                                        className="pl-8"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="end-date">End Date</Label>
                                <div className="relative">
                                    <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="end-date"
                                        type="date"
                                        className="pl-8"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </CardGradientMesh>
            </Card>

            {/* Audit Log Table */}
            <Card className="overflow-hidden bg-background/50 border-primary/20">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[180px]">
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4" />
                                            Timestamp
                                        </div>
                                    </TableHead>
                                    <TableHead className="w-[200px]">
                                        <div className="flex items-center gap-2">
                                            <Shield className="h-4 w-4" />
                                            Acting Admin
                                        </div>
                                    </TableHead>
                                    <TableHead className="w-[200px]">
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4" />
                                            Affected User
                                        </div>
                                    </TableHead>
                                    <TableHead className="w-[120px]">Old Role</TableHead>
                                    <TableHead className="w-[120px]">New Role</TableHead>
                                    <TableHead className="w-[100px]">Action</TableHead>
                                    <TableHead className="w-[150px]">IP Address</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading && logs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Loading audit logs...
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : logs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center">
                                            <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                                <Shield className="h-8 w-8 opacity-50" />
                                                <p>No audit logs found</p>
                                                <p className="text-sm">
                                                    {userId || startDate || endDate
                                                        ? 'Try adjusting your filters'
                                                        : 'Role changes will appear here'}
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    logs.map((log) => (
                                        <TableRow key={log.auditId}>
                                            <TableCell className="font-mono text-xs">
                                                {new Date(log.timestamp).toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-sm truncate max-w-[180px]" title={log.actingAdminEmail}>
                                                        {log.actingAdminEmail}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground truncate max-w-[180px]" title={log.actingAdminId}>
                                                        {log.actingAdminId}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-sm truncate max-w-[180px]" title={log.affectedUserEmail}>
                                                        {log.affectedUserEmail}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground truncate max-w-[180px]" title={log.affectedUserId}>
                                                        {log.affectedUserId}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={getRoleBadgeColor(log.oldRole)}>
                                                    {log.oldRole}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={getRoleBadgeColor(log.newRole)}>
                                                    {log.newRole}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={getActionBadgeColor(log.action)}>
                                                    {log.action}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-mono text-xs text-muted-foreground" title={log.userAgent}>
                                                    {log.ipAddress}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
                {logs.length > 0 && hasMore && (
                    <div className="flex items-center justify-center p-4 border-t">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleLoadMore}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Loading...
                                </>
                            ) : (
                                <>
                                    Load More
                                    <ChevronRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </Card>

            {/* Summary Card */}
            {logs.length > 0 && (
                <Card className="overflow-hidden bg-background/50 border-primary/20">
                    <CardGradientMesh>
                        <CardContent className="pt-6 relative z-10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                                        <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Entries</p>
                                        <p className="text-2xl font-bold">{logs.length}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-muted-foreground">Latest Activity</p>
                                    <p className="text-sm font-medium">
                                        {logs.length > 0 ? new Date(logs[0].timestamp).toLocaleString() : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </CardGradientMesh>
                </Card>
            )}
        </div>
    );
}
