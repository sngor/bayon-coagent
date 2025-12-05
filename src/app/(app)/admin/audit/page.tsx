'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CardGradientMesh } from '@/components/ui/gradient-mesh';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Shield,
    Download,
    Filter,
    Search,
    Calendar,
    User,
    FileText,
    Activity,
    Clock,
    MapPin,
    Monitor,
} from 'lucide-react';
import {
    getAuditLogs,
    exportAuditLogs,
    getAuditLogStats,
} from '@/features/admin/actions/admin-actions';
import { useToast } from '@/hooks/use-toast';
import { AuditLogEntry } from '@/services/admin/audit-log-service';

const ACTION_TYPE_COLORS: Record<string, string> = {
    user_create: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    user_update: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    user_delete: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    user_role_change: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
    content_approve: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    content_flag: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    content_hide: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
    content_delete: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    config_update: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    config_create: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    config_delete: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    ticket_create: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    ticket_update: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    ticket_close: 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300',
    billing_trial_extension: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
    billing_refund: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
    billing_subscription_cancel: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
};

const ACTION_TYPE_LABELS: Record<string, string> = {
    user_create: 'User Created',
    user_update: 'User Updated',
    user_delete: 'User Deleted',
    user_role_change: 'Role Changed',
    content_approve: 'Content Approved',
    content_flag: 'Content Flagged',
    content_hide: 'Content Hidden',
    content_delete: 'Content Deleted',
    config_update: 'Config Updated',
    config_create: 'Config Created',
    config_delete: 'Config Deleted',
    ticket_create: 'Ticket Created',
    ticket_update: 'Ticket Updated',
    ticket_close: 'Ticket Closed',
    billing_trial_extension: 'Trial Extended',
    billing_refund: 'Refund Issued',
    billing_subscription_cancel: 'Subscription Canceled',
};

export default function AuditLogPage() {
    const [entries, setEntries] = useState<AuditLogEntry[]>([]);
    const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [actionTypeFilter, setActionTypeFilter] = useState<string>('all');
    const [resourceTypeFilter, setResourceTypeFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [stats, setStats] = useState<any>(null);
    const { toast } = useToast();

    // Set default date range (last 30 days)
    useEffect(() => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 30);
        setStartDate(start.toISOString().split('T')[0]);
        setEndDate(end.toISOString().split('T')[0]);
    }, []);

    useEffect(() => {
        if (startDate && endDate) {
            loadAuditLogs();
            loadStats();
        }
    }, [actionTypeFilter, resourceTypeFilter, startDate, endDate]);

    async function loadAuditLogs() {
        setIsLoading(true);
        try {
            const options: any = {
                startDate,
                endDate,
                limit: 100,
            };

            if (actionTypeFilter !== 'all') {
                options.actionType = actionTypeFilter;
            }
            if (resourceTypeFilter !== 'all') {
                options.resourceType = resourceTypeFilter;
            }

            const result = await getAuditLogs(options);

            if (result.success && result.data) {
                setEntries(result.data.entries);
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to load audit logs',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Error loading audit logs:', error);
            toast({
                title: 'Error',
                description: 'Failed to load audit logs',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    }

    async function loadStats() {
        try {
            const result = await getAuditLogStats(startDate, endDate);

            if (result.success && result.data) {
                setStats(result.data);
            }
        } catch (error) {
            console.error('Error loading audit log stats:', error);
        }
    }

    async function handleExport(format: 'json' | 'csv') {
        setIsExporting(true);
        try {
            const options: any = {
                startDate,
                endDate,
            };

            if (actionTypeFilter !== 'all') {
                options.actionType = actionTypeFilter;
            }
            if (resourceTypeFilter !== 'all') {
                options.resourceType = resourceTypeFilter;
            }

            const result = await exportAuditLogs(options, format);

            if (result.success && result.data) {
                // Create download link
                const blob = new Blob([result.data], {
                    type: format === 'json' ? 'application/json' : 'text/csv',
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `audit-log-${startDate}-to-${endDate}.${format}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                toast({
                    title: 'Success',
                    description: `Audit log exported as ${format.toUpperCase()}`,
                });
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to export audit logs',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Error exporting audit logs:', error);
            toast({
                title: 'Error',
                description: 'Failed to export audit logs',
                variant: 'destructive',
            });
        } finally {
            setIsExporting(false);
        }
    }

    function handleViewDetails(entry: AuditLogEntry) {
        setSelectedEntry(entry);
        setIsDialogOpen(true);
    }

    // Filter entries by search query
    const filteredEntries = entries.filter(entry => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            entry.description.toLowerCase().includes(query) ||
            entry.adminEmail.toLowerCase().includes(query) ||
            entry.resourceId.toLowerCase().includes(query) ||
            entry.actionType.toLowerCase().includes(query)
        );
    });

    // Get unique action types and resource types for filters
    const uniqueActionTypes = Array.from(new Set(entries.map(e => e.actionType)));
    const uniqueResourceTypes = Array.from(new Set(entries.map(e => e.resourceType)));

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Shield className="h-8 w-8 text-primary" />
                        Audit Log
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Comprehensive log of all administrative actions (SuperAdmin only)
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => handleExport('csv')}
                        disabled={isExporting || entries.length === 0}
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => handleExport('json')}
                        disabled={isExporting || entries.length === 0}
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Export JSON
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Actions
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalActions}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Action Types
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {Object.keys(stats.actionsByType).length}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Active Admins
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {Object.keys(stats.actionsByAdmin).length}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Resource Types
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {Object.keys(stats.actionsByResource).length}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filters
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="space-y-2">
                            <Label>Start Date</Label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>End Date</Label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Action Type</Label>
                            <Select value={actionTypeFilter} onValueChange={setActionTypeFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All actions" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Actions</SelectItem>
                                    {uniqueActionTypes.map(type => (
                                        <SelectItem key={type} value={type}>
                                            {ACTION_TYPE_LABELS[type] || type}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Resource Type</Label>
                            <Select value={resourceTypeFilter} onValueChange={setResourceTypeFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All resources" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Resources</SelectItem>
                                    {uniqueResourceTypes.map(type => (
                                        <SelectItem key={type} value={type}>
                                            {type.charAt(0).toUpperCase() + type.slice(1)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Search</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search logs..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Audit Log Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Audit Entries</CardTitle>
                    <CardDescription>
                        Showing {filteredEntries.length} of {entries.length} entries
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8 text-muted-foreground">
                            Loading audit logs...
                        </div>
                    ) : filteredEntries.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No audit entries found for the selected filters
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredEntries.map((entry) => (
                                <div
                                    key={entry.auditId}
                                    className="border rounded-lg p-4 hover:bg-accent/50 cursor-pointer transition-colors"
                                    onClick={() => handleViewDetails(entry)}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <Badge
                                                    className={
                                                        ACTION_TYPE_COLORS[entry.actionType] ||
                                                        'bg-gray-100 text-gray-800'
                                                    }
                                                >
                                                    {ACTION_TYPE_LABELS[entry.actionType] || entry.actionType}
                                                </Badge>
                                                <Badge variant="outline">
                                                    {entry.resourceType}
                                                </Badge>
                                                <Badge variant="outline" className="font-mono text-xs">
                                                    {entry.resourceId.substring(0, 8)}...
                                                </Badge>
                                            </div>
                                            <p className="text-sm">{entry.description}</p>
                                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <User className="h-3 w-3" />
                                                    {entry.adminEmail} ({entry.adminRole})
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {new Date(entry.timestamp).toLocaleString()}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="h-3 w-3" />
                                                    {entry.ipAddress}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Details Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Audit Entry Details</DialogTitle>
                        <DialogDescription>
                            Complete information about this administrative action
                        </DialogDescription>
                    </DialogHeader>
                    {selectedEntry && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs text-muted-foreground">Audit ID</Label>
                                    <p className="font-mono text-sm">{selectedEntry.auditId}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Timestamp</Label>
                                    <p className="text-sm">
                                        {new Date(selectedEntry.timestamp).toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Admin</Label>
                                    <p className="text-sm">{selectedEntry.adminEmail}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Admin Role</Label>
                                    <p className="text-sm capitalize">{selectedEntry.adminRole}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Action Type</Label>
                                    <p className="text-sm">
                                        {ACTION_TYPE_LABELS[selectedEntry.actionType] || selectedEntry.actionType}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Resource Type</Label>
                                    <p className="text-sm capitalize">{selectedEntry.resourceType}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Resource ID</Label>
                                    <p className="font-mono text-sm">{selectedEntry.resourceId}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">IP Address</Label>
                                    <p className="font-mono text-sm">{selectedEntry.ipAddress}</p>
                                </div>
                            </div>

                            <div>
                                <Label className="text-xs text-muted-foreground">Description</Label>
                                <p className="text-sm mt-1">{selectedEntry.description}</p>
                            </div>

                            {selectedEntry.userAgent && (
                                <div>
                                    <Label className="text-xs text-muted-foreground">User Agent</Label>
                                    <p className="font-mono text-xs mt-1 break-all">
                                        {selectedEntry.userAgent}
                                    </p>
                                </div>
                            )}

                            {selectedEntry.beforeValue && (
                                <div>
                                    <Label className="text-xs text-muted-foreground">Before Value</Label>
                                    <pre className="bg-muted p-3 rounded-md text-xs mt-1 overflow-x-auto">
                                        {JSON.stringify(selectedEntry.beforeValue, null, 2)}
                                    </pre>
                                </div>
                            )}

                            {selectedEntry.afterValue && (
                                <div>
                                    <Label className="text-xs text-muted-foreground">After Value</Label>
                                    <pre className="bg-muted p-3 rounded-md text-xs mt-1 overflow-x-auto">
                                        {JSON.stringify(selectedEntry.afterValue, null, 2)}
                                    </pre>
                                </div>
                            )}

                            {selectedEntry.metadata && Object.keys(selectedEntry.metadata).length > 0 && (
                                <div>
                                    <Label className="text-xs text-muted-foreground">Metadata</Label>
                                    <pre className="bg-muted p-3 rounded-md text-xs mt-1 overflow-x-auto">
                                        {JSON.stringify(selectedEntry.metadata, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
