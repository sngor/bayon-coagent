'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CardGradientMesh } from '@/components/ui/gradient-mesh';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Filter, RefreshCw, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { getAuditLogsAction } from '@/features/admin/actions/admin-actions';
import { useDebounce } from 'use-debounce';
import { useToast } from "@/hooks/use-toast";

export default function AuditLogsClient() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [nextToken, setNextToken] = useState<string | undefined>(undefined);
    const [prevTokens, setPrevTokens] = useState<string[]>([]);

    // Filters
    const [adminUserId, setAdminUserId] = useState('');
    const [action, setAction] = useState('all');
    const [resourceType, setResourceType] = useState('all');
    const [resourceId, setResourceId] = useState('');
    const [timeRange, setTimeRange] = useState('24h');

    const [debouncedAdminUserId] = useDebounce(adminUserId, 500);
    const [debouncedResourceId] = useDebounce(resourceId, 500);

    const fetchLogs = useCallback(async (token?: string) => {
        setLoading(true);
        try {
            let startTime: string | undefined;
            const now = Date.now();

            switch (timeRange) {
                case '1h':
                    startTime = new Date(now - 60 * 60 * 1000).toISOString();
                    break;
                case '24h':
                    startTime = new Date(now - 24 * 60 * 60 * 1000).toISOString();
                    break;
                case '7d':
                    startTime = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
                    break;
                case '30d':
                    startTime = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
                    break;
            }

            const result = await getAuditLogsAction({
                adminUserId: debouncedAdminUserId || undefined,
                action: action === 'all' ? undefined : action || undefined,
                resourceType: resourceType === 'all' ? undefined : resourceType || undefined,
                resourceId: debouncedResourceId || undefined,
                startTime,
                nextToken: token,
                limit: 50
            });

            if (result.success && result.data) {
                setLogs(result.data.logs || []);
                setNextToken(result.data.nextToken);
            } else {
                setLogs([]);
                setNextToken(undefined);
            }
        } catch (error) {
            console.error('Failed to fetch audit logs:', error);
            setLogs([]);
            setNextToken(undefined);
        } finally {
            setLoading(false);
        }
    }, [debouncedAdminUserId, action, resourceType, debouncedResourceId, timeRange]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const handleRefresh = useCallback(() => {
        setNextToken(undefined);
        setPrevTokens([]);
        fetchLogs();
    }, [fetchLogs]);

    const handleNextPage = useCallback(() => {
        if (nextToken) {
            setPrevTokens(prev => [...prev, nextToken]);
            fetchLogs(nextToken);
        }
    }, [nextToken, fetchLogs]);

    const formatMessage = (msg: any) => {
        if (!msg) return 'No details available';

        const parts = [];
        if (msg.action) parts.push(`Action: ${msg.action}`);
        if (msg.resourceType) parts.push(`Type: ${msg.resourceType}`);
        if (msg.changes) parts.push(`Changes: ${JSON.stringify(msg.changes).substring(0, 100)}...`);
        if (msg.error) parts.push(`Error: ${msg.error}`);

        return parts.join(' | ') || 'No details available';
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-headline text-3xl font-bold">Audit Logs</h1>
                    <p className="text-muted-foreground">
                        Track all administrative actions and system changes
                    </p>
                </div>
                <Button
                    variant="outline"
                    onClick={handleRefresh}
                    disabled={loading}
                    className="flex items-center gap-2"
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            <Card className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 border-primary/20">
                <CardGradientMesh>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Filters
                        </CardTitle>
                        <CardDescription>
                            Filter audit logs by admin user, action, resource, or time range
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="admin-user">Admin User</Label>
                                <Input
                                    id="admin-user"
                                    placeholder="Email or ID..."
                                    value={adminUserId}
                                    onChange={(e) => setAdminUserId(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="action">Action</Label>
                                <Select value={action} onValueChange={setAction}>
                                    <SelectTrigger id="action">
                                        <SelectValue placeholder="All actions" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Actions</SelectItem>
                                        <SelectItem value="CREATE">Create</SelectItem>
                                        <SelectItem value="UPDATE">Update</SelectItem>
                                        <SelectItem value="DELETE">Delete</SelectItem>
                                        <SelectItem value="LOGIN">Login</SelectItem>
                                        <SelectItem value="LOGOUT">Logout</SelectItem>
                                        <SelectItem value="ROLE_CHANGE">Role Change</SelectItem>
                                        <SelectItem value="PERMISSION_CHANGE">Permission Change</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="resource-type">Resource Type</Label>
                                <Select value={resourceType} onValueChange={setResourceType}>
                                    <SelectTrigger id="resource-type">
                                        <SelectValue placeholder="All types" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        <SelectItem value="USER">User</SelectItem>
                                        <SelectItem value="ROLE">Role</SelectItem>
                                        <SelectItem value="PERMISSION">Permission</SelectItem>
                                        <SelectItem value="CONTENT">Content</SelectItem>
                                        <SelectItem value="BILLING">Billing</SelectItem>
                                        <SelectItem value="SYSTEM">System</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="resource-id">Resource ID</Label>
                                <Input
                                    id="resource-id"
                                    placeholder="ID..."
                                    value={resourceId}
                                    onChange={(e) => setResourceId(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="time-range">Time Range</Label>
                                <Select value={timeRange} onValueChange={setTimeRange}>
                                    <SelectTrigger id="time-range">
                                        <SelectValue placeholder="Select range" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1h">Last Hour</SelectItem>
                                        <SelectItem value="24h">Last 24 Hours</SelectItem>
                                        <SelectItem value="7d">Last 7 Days</SelectItem>
                                        <SelectItem value="30d">Last 30 Days</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </CardGradientMesh>
            </Card>

            <Card className="overflow-hidden bg-background/50 border-primary/20">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[180px]">Timestamp</TableHead>
                                <TableHead className="w-[150px]">Admin User</TableHead>
                                <TableHead className="w-[150px]">Action</TableHead>
                                <TableHead className="w-[150px]">Resource Type</TableHead>
                                <TableHead className="w-[200px]">Resource ID</TableHead>
                                <TableHead>Details</TableHead>
                                <TableHead className="w-[100px]">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Loading logs...
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                        No audit logs found matching your criteria.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                logs.map((log, index) => {
                                    const msg = log.message || {};
                                    return (
                                        <TableRow key={index}>
                                            <TableCell className="font-mono text-xs">
                                                {log.timestamp ? new Date(log.timestamp).toLocaleString() : '-'}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-sm truncate max-w-[140px]" title={msg.adminEmail}>
                                                        {msg.adminEmail || msg.adminUserId || 'Unknown'}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground truncate max-w-[140px]" title={msg.sourceIp}>
                                                        {msg.sourceIp}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="font-mono text-xs">
                                                    {msg.action || 'UNKNOWN'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-muted-foreground">
                                                    {msg.resourceType || '-'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-mono text-xs text-muted-foreground truncate block max-w-[180px]" title={msg.resourceId}>
                                                    {msg.resourceId || '-'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-xs">
                                                {formatMessage(msg)}
                                            </TableCell>
                                            <TableCell>
                                                {msg.success ? (
                                                    <Badge variant="default" className="bg-green-500/15 text-green-700 dark:text-green-400 hover:bg-green-500/25 border-green-500/20">
                                                        Success
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="destructive">
                                                        Failed
                                                    </Badge>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
                {logs.length > 0 && (
                    <div className="flex items-center justify-end p-4 border-t">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleNextPage}
                            disabled={!nextToken || loading}
                        >
                            Next Page
                            <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                )}
            </Card>
        </div>
    );
}