'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    getAllUserActivity,
    getUserActivityTimeline,
    exportUserActivityData,
} from '@/features/admin/actions/admin-actions';
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
    Download,
    Activity,
    TrendingUp,
    Clock,
    FileText,
    Zap,
    DollarSign,
    Calendar,
    Filter,
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { UserActivity } from '@/services/admin/user-activity-service';

export default function UserActivityPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState<UserActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const [activityFilter, setActivityFilter] = useState<'all' | 'active' | 'inactive' | 'dormant'>('all');
    const [sortBy, setSortBy] = useState<'lastLogin' | 'totalSessions' | 'contentCreated'>('lastLogin');
    const { toast } = useToast();

    // User detail sheet state
    const [selectedUser, setSelectedUser] = useState<UserActivity | null>(null);
    const [userTimeline, setUserTimeline] = useState<any>(null);
    const [timelineLoading, setTimelineLoading] = useState(false);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    useEffect(() => {
        loadUsers();
    }, [activityFilter, sortBy]);

    async function loadUsers() {
        try {
            setLoading(true);
            const result = await getAllUserActivity({
                activityLevel: activityFilter === 'all' ? undefined : activityFilter,
                sortBy,
                limit: 100,
            });

            if (result.success && result.data) {
                setUsers(result.data.users);
            } else {
                toast({
                    title: "Error",
                    description: result.error || "Failed to load user activity",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Failed to load user activity:', error);
            toast({ title: "Error", description: "Failed to load user activity", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }

    const getFilteredUsers = () => {
        if (!searchQuery) return users;

        const query = searchQuery.toLowerCase();
        return users.filter(user =>
            user.email?.toLowerCase().includes(query) ||
            user.name?.toLowerCase().includes(query)
        );
    };

    const handleViewDetails = async (user: UserActivity) => {
        setSelectedUser(user);
        setIsSheetOpen(true);
        setTimelineLoading(true);

        try {
            const result = await getUserActivityTimeline(user.userId);
            if (result.success && result.data) {
                setUserTimeline(result.data);
            } else {
                toast({
                    title: "Error",
                    description: result.error || "Failed to load activity timeline",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Failed to load timeline:', error);
            toast({ title: "Error", description: "Failed to load activity timeline", variant: "destructive" });
        } finally {
            setTimelineLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const result = await exportUserActivityData();
            if (result.success && result.data) {
                // Create a download link
                const blob = new Blob([result.data], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `user-activity-${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);

                toast({
                    title: "Success",
                    description: "User activity exported successfully",
                });
            } else {
                toast({
                    title: "Error",
                    description: result.error || "Failed to export user activity",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Failed to export:', error);
            toast({ title: "Error", description: "Failed to export user activity", variant: "destructive" });
        }
    };

    const getActivityBadgeColor = (level: string) => {
        switch (level) {
            case 'active':
                return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'inactive':
                return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
            case 'dormant':
                return 'bg-red-500/10 text-red-500 border-red-500/20';
            default:
                return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
        }
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const filteredUsers = getFilteredUsers();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">User Activity</h1>
                <p className="text-muted-foreground mt-2">
                    Monitor user engagement, feature usage, and activity patterns
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                        <Activity className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {users.filter(u => u.activityLevel === 'active').length}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Logged in within 7 days
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Inactive Users</CardTitle>
                        <Clock className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {users.filter(u => u.activityLevel === 'inactive').length}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            7-30 days since login
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Dormant Users</CardTitle>
                        <Users className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {users.filter(u => u.activityLevel === 'dormant').length}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Over 30 days since login
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total AI Requests</CardTitle>
                        <Zap className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {users.reduce((sum, u) => sum + u.aiUsage.requests, 0).toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Across all users
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters and Actions */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                        <div className="flex-1 w-full sm:w-auto">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search users by name or email..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2 w-full sm:w-auto">
                            <Select value={activityFilter} onValueChange={(value: any) => setActivityFilter(value)}>
                                <SelectTrigger className="w-[140px]">
                                    <Filter className="h-4 w-4 mr-2" />
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Users</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                    <SelectItem value="dormant">Dormant</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                                <SelectTrigger className="w-[160px]">
                                    <TrendingUp className="h-4 w-4 mr-2" />
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="lastLogin">Last Login</SelectItem>
                                    <SelectItem value="totalSessions">Total Sessions</SelectItem>
                                    <SelectItem value="contentCreated">Content Created</SelectItem>
                                </SelectContent>
                            </Select>

                            <Button onClick={handleExport} variant="outline">
                                <Download className="h-4 w-4 mr-2" />
                                Export CSV
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                <CardContent>
                    {loading ? (
                        <div className="text-center py-8 text-muted-foreground">
                            Loading user activity...
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No users found
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Activity Level</TableHead>
                                        <TableHead>Last Login</TableHead>
                                        <TableHead className="text-right">Sessions</TableHead>
                                        <TableHead className="text-right">Content</TableHead>
                                        <TableHead className="text-right">AI Requests</TableHead>
                                        <TableHead className="text-right">AI Cost</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.map((user) => (
                                        <TableRow key={user.userId}>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">{user.name}</div>
                                                    <div className="text-sm text-muted-foreground">{user.email}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={getActivityBadgeColor(user.activityLevel)}>
                                                    {user.activityLevel}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    {formatDate(user.lastLogin)}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {user.totalSessions.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {user.totalContentCreated.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {user.aiUsage.requests.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                ${user.aiUsage.cost.toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleViewDetails(user)}
                                                >
                                                    View Details
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* User Detail Sheet */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>User Activity Details</SheetTitle>
                        <SheetDescription>
                            Detailed activity timeline for {selectedUser?.name}
                        </SheetDescription>
                    </SheetHeader>

                    {selectedUser && (
                        <div className="mt-6 space-y-6">
                            {/* User Info */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">User Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Email:</span>
                                        <span className="font-medium">{selectedUser.email}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Activity Level:</span>
                                        <Badge variant="outline" className={getActivityBadgeColor(selectedUser.activityLevel)}>
                                            {selectedUser.activityLevel}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Signup Date:</span>
                                        <span className="font-medium">{formatDate(selectedUser.signupDate)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Last Login:</span>
                                        <span className="font-medium">{formatDate(selectedUser.lastLogin)}</span>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Activity Stats */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Activity Statistics</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Total Sessions:</span>
                                        <span className="font-medium">{selectedUser.totalSessions}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Content Created:</span>
                                        <span className="font-medium">{selectedUser.totalContentCreated}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">AI Requests:</span>
                                        <span className="font-medium">{selectedUser.aiUsage.requests}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">AI Tokens:</span>
                                        <span className="font-medium">{selectedUser.aiUsage.tokens.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">AI Cost:</span>
                                        <span className="font-medium">${selectedUser.aiUsage.cost.toFixed(2)}</span>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Feature Usage */}
                            {Object.keys(selectedUser.featureUsage).length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Feature Usage</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            {Object.entries(selectedUser.featureUsage)
                                                .sort(([, a], [, b]) => b - a)
                                                .map(([feature, count]) => (
                                                    <div key={feature} className="flex justify-between">
                                                        <span className="text-muted-foreground capitalize">
                                                            {feature.replace(/_/g, ' ')}:
                                                        </span>
                                                        <span className="font-medium">{count}</span>
                                                    </div>
                                                ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Activity Timeline */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Activity Timeline</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {timelineLoading ? (
                                        <div className="text-center py-4 text-muted-foreground">
                                            Loading timeline...
                                        </div>
                                    ) : userTimeline && userTimeline.events.length > 0 ? (
                                        <div className="space-y-4">
                                            {userTimeline.events.slice(0, 50).map((event: any, index: number) => (
                                                <div key={index} className="flex gap-3 pb-4 border-b last:border-0">
                                                    <div className="flex-shrink-0 mt-1">
                                                        {event.eventType === 'content_create' && <FileText className="h-4 w-4 text-blue-500" />}
                                                        {event.eventType === 'feature_use' && <Activity className="h-4 w-4 text-green-500" />}
                                                        {event.eventType === 'ai_request' && <Zap className="h-4 w-4 text-purple-500" />}
                                                        {event.eventType === 'page_view' && <Calendar className="h-4 w-4 text-gray-500" />}
                                                        {event.eventType === 'error' && <span className="h-4 w-4 text-red-500">⚠</span>}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium">{event.description}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {formatDate(event.timestamp)}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-4 text-muted-foreground">
                                            No activity recorded
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
