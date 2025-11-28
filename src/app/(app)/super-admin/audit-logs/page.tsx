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
import { getAuditLogsAction } from '@/app/admin-actions';
import { useDebounce } from 'use-debounce';
import { toast } from '@/components/ui/use-toast';

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [nextToken, setNextToken] = useState<string | undefined>(undefined);
    const [prevTokens, setPrevTokens] = useState<string[]>([]);

    // Filters
    const [adminUserId, setAdminUserId] = useState('');
    const [action, setAction] = useState('');
    const [resourceType, setResourceType] = useState('');
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
                default:
                    startTime = undefined;
            }

            const result = await getAuditLogsAction({
                adminUserId: debouncedAdminUserId || undefined,
                action: action === 'all' ? undefined : action || undefined,
                resourceType: resourceType === 'all' ? undefined : resourceType || undefined,
                resourceId: debouncedResourceId || undefined,
                startTime,
                limit: 20,
                nextToken: token
            });

            if (result.message === 'success' && result.data) {
                setLogs(result.data.logs);
                setNextToken(result.data.nextToken);
            } else {
                toast({
                    title: 'Error fetching logs',
                    description: result.message,
                    variant: 'destructive'
                });
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch audit logs',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    }, [debouncedAdminUserId, action, resourceType, debouncedResourceId, timeRange]);

    useEffect(() => {
        fetchLogs();
        setPrevTokens([]);
    }, [fetchLogs]);

    const handleNextPage = () => {
        if (nextToken) {
            setPrevTokens([...prevTokens, nextToken]); // This logic is slightly flawed for prev tokens with CloudWatch pagination usually, but let's try
            // Actually CloudWatch pagination is forward-only usually with nextToken. 
            // To go back, we'd need to cache pages or restart.
            // For simplicity, let's just support Next for now or simple pagination if we keep history.
            // If we want "Prev", we need to store the token that got us here.
            // But let's just fetch next.
            fetchLogs(nextToken);
        }
    };

    const handleRefresh = () => {
        fetchLogs();
        setPrevTokens([]);
    };

    const formatMessage = (message: any) => {
        if (typeof message === 'string') return message;
        if (!message) return '-';

        // Try to format common fields
        const details = message.details ? JSON.stringify(message.details, null, 2) : '';
        return (
            <div className="space-y-1">
                {message.details && (
                    <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-[100px] max-w-[300px]">
                        {details}
                    </pre>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
                    <p className="text-muted-foreground">
                        Track and monitor all administrative actions and system events.
                    </p>
                </div>
                <Button onClick={handleRefresh} variant="outline" size="sm">
                    <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            <Card className="overflow-hidden bg-background/50 border-primary/20">
                <CardGradientMesh>
                    <CardHeader className="relative z-10">
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Filters
                        </CardTitle>
                        <CardDescription>Refine your search results</CardDescription>
                    </CardHeader>
                    <CardContent className="relative z-10 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="admin-id">Admin User ID</Label>
                                <div className="relative">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="admin-id"
                                        placeholder="Search by User ID..."
                                        className="pl-8"
                                        value={adminUserId}
                                        onChange={(e) => setAdminUserId(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="action">Action</Label>
                                <Select value={action} onValueChange={setAction}>
                                    <SelectTrigger id="action">
                                        <SelectValue placeholder="All Actions" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Actions</SelectItem>
                                        <SelectItem value="CREATE_USER">Create User</SelectItem>
                                        <SelectItem value="UPDATE_USER">Update User</SelectItem>
                                        <SelectItem value="DELETE_USER">Delete User</SelectItem>
                                        <SelectItem value="CREATE_TEAM">Create Team</SelectItem>
                                        <SelectItem value="UPDATE_TEAM">Update Team</SelectItem>
                                        <SelectItem value="DELETE_TEAM">Delete Team</SelectItem>
                                        <SelectItem value="UPDATE_SETTINGS">Update Settings</SelectItem>
                                        <SelectItem value="QUERY_AUDIT_LOGS">Query Audit Logs</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="resource-type">Resource Type</Label>
                                <Select value={resourceType} onValueChange={setResourceType}>
                                    <SelectTrigger id="resource-type">
                                        <SelectValue placeholder="All Resources" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Resources</SelectItem>
                                        <SelectItem value="USER">User</SelectItem>
                                        <SelectItem value="TEAM">Team</SelectItem>
                                        <SelectItem value="ORGANIZATION">Organization</SelectItem>
                                        <SelectItem value="AUDIT_LOG">Audit Log</SelectItem>
                                        <SelectItem value="FEATURE">Feature</SelectItem>
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
