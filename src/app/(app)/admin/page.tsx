'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CardGradientMesh } from '@/components/ui/gradient-mesh';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Users,
    MessageSquare,
    BarChart3,
    Settings,
    Activity,
    Shield,
    FileText,
    Flag,
    Bell,
    Megaphone,
    DollarSign,
    Key,
    Clock,
    UserPlus,
    ArrowRight,
    CheckCircle,
    TrendingUp,
    AlertTriangle,
    Wrench,
    Zap,
    RefreshCw,
    Eye,
    ChevronRight,
    Sparkles,
    Target,
    MoreHorizontal,
    Info,
} from 'lucide-react';
import { useUserRole } from '@/hooks/use-user-role';
import { RoleProtectedFeature } from '@/components/admin/role-protected-feature';
import { RoleBadge } from '@/components/admin/role-badge';

import { getAdminDashboardStats, getRecentActivityAction } from '@/features/admin';
import { useToast } from '@/hooks/use-toast';
import { AdminActivity } from '@/types/admin';
import { AdminDashboardStats } from '@/types/admin';

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<AdminDashboardStats>({
        totalUsers: 0,
        activeUsers: 0,
        newSignups24h: 0,
        pendingInvitations: 0,
        systemStatus: 'Checking...',
        openTickets: 0,
        pendingContent: 0,
        errorRate: 0,
        alerts: []
    });
    const [recentActivity, setRecentActivity] = useState<AdminActivity[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const { toast } = useToast();
    const { role } = useUserRole();
    const loadData = useCallback(async (showRefreshing = false) => {
        if (showRefreshing) setIsRefreshing(true);

        try {
            const [statsResult, activityResult] = await Promise.all([
                getAdminDashboardStats({ filterByTeam: true }),
                getRecentActivityAction(10, { filterByTeam: true })
            ]);

            if (statsResult.message === 'success' && statsResult.data) {
                setStats(statsResult.data);
            }

            if (activityResult.message === 'success' && activityResult.data) {
                setRecentActivity(activityResult.data);
            }

            setLastUpdated(new Date());
        } catch (error) {
            console.error('Failed to load admin data:', error);
            toast({
                title: 'Error',
                description: 'Failed to load dashboard data',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [toast]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Auto-refresh every 5 minutes
    useEffect(() => {
        const interval = setInterval(() => {
            loadData(true);
        }, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, [loadData]);

    const handleRefresh = useCallback(() => {
        loadData(true);
    }, [loadData]);

    // Memoized calculations
    const teamGrowthRate = useMemo(() => {
        if (!stats.totalUsers || !stats.newSignups24h) return 0;
        return ((stats.newSignups24h / stats.totalUsers) * 100);
    }, [stats.totalUsers, stats.newSignups24h]);

    const activeUserPercentage = useMemo(() => {
        if (!stats.totalUsers || !stats.activeUsers) return 0;
        return Math.round((stats.activeUsers / stats.totalUsers) * 100);
    }, [stats.totalUsers, stats.activeUsers]);

    const formatLastUpdated = useMemo(() => {
        if (!lastUpdated) return '';
        return lastUpdated.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }, [lastUpdated]);
    const MetricSkeleton = () => (
        <Card className="overflow-hidden bg-background/50 border-primary/20">
            <CardGradientMesh>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                    <div className="h-8 w-8 bg-muted animate-pulse rounded-lg" />
                </CardHeader>
                <CardContent className="relative z-10">
                    <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
                    <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                </CardContent>
            </CardGradientMesh>
        </Card>
    );

    return (
        <div className="space-y-8 p-6 max-w-7xl mx-auto" role="main" aria-label="Admin Dashboard">
            {/* Enhanced Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Shield className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <RoleBadge role={role} size="sm" />
                                {lastUpdated && (
                                    <div className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-xs">
                                        <Clock className="mr-1 h-3 w-3" />
                                        Updated {formatLastUpdated}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <p className="text-muted-foreground max-w-2xl">
                        {role === 'superadmin'
                            ? 'Platform-wide management and monitoring overview'
                            : 'Team management and monitoring overview'
                        }
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="gap-2"
                    >
                        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button asChild variant="outline">
                        <Link href="/admin/analytics" className="gap-2">
                            <BarChart3 className="h-4 w-4" />
                            Analytics
                        </Link>
                    </Button>
                    <Button asChild className="gap-2">
                        <Link href="/admin/users">
                            <UserPlus className="h-4 w-4" />
                            Invite Member
                        </Link>
                    </Button>
                </div>
            </div>
            {/* Active Alerts */}
            {stats.alerts && stats.alerts.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        <h3 className="font-semibold">Active Alerts</h3>
                        <div className="inline-flex items-center px-2 py-1 rounded-md bg-amber-100 dark:bg-amber-900/20 text-xs font-medium">
                            {stats.alerts.length}
                        </div>
                    </div>
                    {stats.alerts.map((alert: any, index: number) => (
                        <Alert key={index} variant={alert.severity === 'critical' ? 'destructive' : 'default'}>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                <div className="flex items-center justify-between">
                                    <span className="font-medium">{alert.message}</span>
                                    {alert.action && (
                                        <Button variant="link" asChild className="h-auto p-0 text-sm">
                                            <Link href={alert.action.href}>{alert.action.label}</Link>
                                        </Button>
                                    )}
                                </div>
                            </AlertDescription>
                        </Alert>
                    ))}
                </div>
            )}

            {/* Enhanced Key Metrics Grid */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Key Metrics</h3>
                    <div className="inline-flex items-center px-2 py-1 rounded-md bg-green-100 dark:bg-green-900/20 text-xs font-medium gap-1">
                        <Activity className="h-3 w-3" />
                        Live Data
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {/* Team Members */}
                    {isLoading ? <MetricSkeleton /> : (
                        <Card className="overflow-hidden bg-background/50 border-primary/20 hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
                            <CardGradientMesh>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                                    <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                                        <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                </CardHeader>
                                <CardContent className="relative z-10">
                                    <div className="text-3xl font-bold">{stats.totalUsers}</div>
                                    <div className="flex items-center justify-between mt-3">
                                        <div className="flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4 text-green-600" />
                                            <span className="text-sm text-green-600 font-medium">
                                                {stats.activeUsers || 0} active
                                            </span>
                                        </div>
                                        <div className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-xs font-medium">
                                            {activeUserPercentage}%
                                        </div>
                                    </div>
                                    <div className="mt-2 bg-muted rounded-full h-2 overflow-hidden">
                                        <div
                                            className={`bg-blue-600 h-2 rounded-full transition-all duration-500 ${activeUserPercentage >= 100 ? 'w-full' :
                                                activeUserPercentage >= 75 ? 'w-3/4' :
                                                    activeUserPercentage >= 50 ? 'w-1/2' :
                                                        activeUserPercentage >= 25 ? 'w-1/4' :
                                                            activeUserPercentage > 0 ? 'w-1/12' : 'w-0'
                                                }`}
                                        />
                                    </div>
                                </CardContent>
                            </CardGradientMesh>
                        </Card>
                    )}
                    {/* New Members */}
                    {isLoading ? <MetricSkeleton /> : (
                        <Card className="overflow-hidden bg-background/50 border-primary/20 hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
                            <CardGradientMesh>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                                    <CardTitle className="text-sm font-medium">New Members (24h)</CardTitle>
                                    <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                                        <UserPlus className="h-4 w-4 text-green-600 dark:text-green-400" />
                                    </div>
                                </CardHeader>
                                <CardContent className="relative z-10">
                                    <div className="text-3xl font-bold">{stats.newSignups24h || 0}</div>
                                    <div className="flex items-center justify-between mt-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-muted-foreground">Last 24 hours</span>
                                        </div>
                                        {teamGrowthRate > 0 && (
                                            <div className="inline-flex items-center px-2 py-1 rounded-md bg-green-100 dark:bg-green-900/20 text-xs font-medium">
                                                +{teamGrowthRate.toFixed(1)}%
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </CardGradientMesh>
                        </Card>
                    )}

                    {/* Super Admin Only - Open Tickets */}
                    <RoleProtectedFeature requiredRole="superadmin">
                        {isLoading ? <MetricSkeleton /> : (
                            <Card className="overflow-hidden bg-background/50 border-primary/20 hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
                                <CardGradientMesh>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                                        <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
                                        <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
                                            <MessageSquare className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                        </div>
                                    </CardHeader>
                                    <CardContent className="relative z-10">
                                        <div className="text-3xl font-bold">{stats.openTickets || 0}</div>
                                        <div className="flex items-center justify-between mt-3">
                                            <Button variant="link" asChild className="h-auto p-0 text-sm text-orange-600">
                                                <Link href="/admin/support" className="flex items-center gap-1">
                                                    <Eye className="h-3 w-3" />
                                                    View tickets
                                                </Link>
                                            </Button>
                                            {stats.openTickets > 0 && (
                                                <div className="inline-flex items-center px-2 py-1 rounded-md bg-red-100 dark:bg-red-900/20 text-xs font-medium text-red-700 dark:text-red-300">
                                                    Urgent
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </CardGradientMesh>
                            </Card>
                        )}
                    </RoleProtectedFeature>
                    {/* Super Admin Only - System Health */}
                    <RoleProtectedFeature requiredRole="superadmin">
                        {isLoading ? <MetricSkeleton /> : (
                            <Card className="overflow-hidden bg-background/50 border-primary/20 hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
                                <CardGradientMesh>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                                        <CardTitle className="text-sm font-medium">System Health</CardTitle>
                                        <div className={`p-2 rounded-lg ${stats.systemStatus === 'Healthy'
                                            ? 'bg-green-100 dark:bg-green-900/50'
                                            : 'bg-red-100 dark:bg-red-900/50'
                                            }`}>
                                            <Activity className={`h-4 w-4 ${stats.systemStatus === 'Healthy'
                                                ? 'text-green-600 dark:text-green-400'
                                                : 'text-red-600 dark:text-red-400'
                                                }`} />
                                        </div>
                                    </CardHeader>
                                    <CardContent className="relative z-10">
                                        <div className={`text-3xl font-bold ${stats.systemStatus === 'Healthy' ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            {stats.systemStatus === 'Healthy' ? '100%' : 'Degraded'}
                                        </div>
                                        <div className="flex items-center justify-between mt-3">
                                            {stats.systemStatus === 'Healthy' ? (
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                                    <span className="text-sm text-green-600 font-medium">Operational</span>
                                                </div>
                                            ) : (
                                                <Button variant="link" asChild className="h-auto p-0 text-sm text-red-600">
                                                    <Link href="/admin/system/health" className="flex items-center gap-1">
                                                        <AlertTriangle className="h-3 w-3" />
                                                        View details
                                                    </Link>
                                                </Button>
                                            )}
                                            <div className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${stats.systemStatus === 'Healthy'
                                                ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                                                : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                                                }`}>
                                                {stats.systemStatus === 'Healthy' ? 'Stable' : 'Issues'}
                                            </div>
                                        </div>
                                    </CardContent>
                                </CardGradientMesh>
                            </Card>
                        )}
                    </RoleProtectedFeature>
                </div>
            </div>
            {/* Enhanced Quick Actions Grid */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Quick Actions</h3>
                    <div className="inline-flex items-center px-2 py-1 rounded-md bg-purple-100 dark:bg-purple-900/20 text-xs font-medium gap-1">
                        <Sparkles className="h-3 w-3" />
                        {role === 'superadmin' ? '8 Features' : '2 Features'}
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* Team Analytics */}
                    <Card className="overflow-hidden bg-background/50 border-primary/20 hover:shadow-lg transition-all duration-200 hover:scale-[1.02] group">
                        <CardGradientMesh>
                            <CardHeader className="relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl group-hover:scale-110 transition-transform">
                                        <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="flex-1">
                                        <CardTitle className="text-lg">Team Analytics</CardTitle>
                                        <CardDescription>Performance insights & reports</CardDescription>
                                    </div>
                                    <div className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-xs font-medium">
                                        3 Tools
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-2 relative z-10">
                                <Button variant="ghost" asChild className="w-full justify-between h-auto p-3 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                                    <Link href="/admin/analytics" className="flex items-center">
                                        <div className="flex items-center gap-3">
                                            <BarChart3 className="h-4 w-4" />
                                            <div className="text-left">
                                                <div className="font-medium">Team Performance</div>
                                                <div className="text-xs text-muted-foreground">View metrics & KPIs</div>
                                            </div>
                                        </div>
                                        <ChevronRight className="h-4 w-4" />
                                    </Link>
                                </Button>
                                <div className="border-t border-border/50" />
                                <Button variant="ghost" asChild className="w-full justify-between h-auto p-3 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                                    <Link href="/admin/users/activity" className="flex items-center">
                                        <div className="flex items-center gap-3">
                                            <Activity className="h-4 w-4" />
                                            <div className="text-left">
                                                <div className="font-medium">Team Activity</div>
                                                <div className="text-xs text-muted-foreground">Recent actions & logs</div>
                                            </div>
                                        </div>
                                        <ChevronRight className="h-4 w-4" />
                                    </Link>
                                </Button>
                                <div className="border-t border-border/50" />
                                <Button variant="ghost" asChild className="w-full justify-between h-auto p-3 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                                    <Link href="/admin/reports/team" className="flex items-center">
                                        <div className="flex items-center gap-3">
                                            <FileText className="h-4 w-4" />
                                            <div className="text-left">
                                                <div className="font-medium">Team Reports</div>
                                                <div className="text-xs text-muted-foreground">Generate & export</div>
                                            </div>
                                        </div>
                                        <ChevronRight className="h-4 w-4" />
                                    </Link>
                                </Button>
                            </CardContent>
                        </CardGradientMesh>
                    </Card>
                    {/* Team Management */}
                    <Card className="overflow-hidden bg-background/50 border-primary/20 hover:shadow-lg transition-all duration-200 hover:scale-[1.02] group">
                        <CardGradientMesh>
                            <CardHeader className="relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-xl group-hover:scale-110 transition-transform">
                                        <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div className="flex-1">
                                        <CardTitle className="text-lg">Team Management</CardTitle>
                                        <CardDescription>Manage members & content</CardDescription>
                                    </div>
                                    <div className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-xs font-medium">
                                        3 Tools
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-2 relative z-10">
                                <Button variant="ghost" asChild className="w-full justify-between h-auto p-3 hover:bg-purple-50 dark:hover:bg-purple-900/20">
                                    <Link href="/admin/users" className="flex items-center">
                                        <div className="flex items-center gap-3">
                                            <Users className="h-4 w-4" />
                                            <div className="text-left">
                                                <div className="font-medium">Team Members</div>
                                                <div className="text-xs text-muted-foreground">Manage user accounts</div>
                                            </div>
                                        </div>
                                        <ChevronRight className="h-4 w-4" />
                                    </Link>
                                </Button>
                                <div className="border-t border-border/50" />
                                <Button variant="ghost" asChild className="w-full justify-between h-auto p-3 hover:bg-purple-50 dark:hover:bg-purple-900/20">
                                    <Link href="/admin/content/moderation" className="flex items-center">
                                        <div className="flex items-center gap-3">
                                            <Flag className="h-4 w-4" />
                                            <div className="text-left">
                                                <div className="font-medium">Content Review</div>
                                                <div className="text-xs text-muted-foreground">Moderate & approve</div>
                                            </div>
                                        </div>
                                        <ChevronRight className="h-4 w-4" />
                                    </Link>
                                </Button>
                                <div className="border-t border-border/50" />
                                <Button variant="ghost" asChild className="w-full justify-between h-auto p-3 hover:bg-purple-50 dark:hover:bg-purple-900/20">
                                    <Link href="/admin/users/invitations" className="flex items-center">
                                        <div className="flex items-center gap-3">
                                            <UserPlus className="h-4 w-4" />
                                            <div className="text-left">
                                                <div className="font-medium">Invite Members</div>
                                                <div className="text-xs text-muted-foreground">Send invitations</div>
                                            </div>
                                        </div>
                                        <ChevronRight className="h-4 w-4" />
                                    </Link>
                                </Button>
                            </CardContent>
                        </CardGradientMesh>
                    </Card>
                    {/* Super Admin Only Cards */}
                    <RoleProtectedFeature requiredRole="superadmin">
                        {/* Support & Communication */}
                        <Card className="overflow-hidden bg-background/50 border-primary/20 hover:shadow-lg transition-all duration-200 hover:scale-[1.02] group">
                            <CardGradientMesh>
                                <CardHeader className="relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-orange-100 dark:bg-orange-900/50 rounded-xl group-hover:scale-110 transition-transform">
                                            <MessageSquare className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                                        </div>
                                        <div className="flex-1">
                                            <CardTitle className="text-lg">Support Hub</CardTitle>
                                            <CardDescription>Platform-wide support</CardDescription>
                                        </div>
                                        <div className="inline-flex items-center px-2 py-1 rounded-md bg-orange-100 dark:bg-orange-900/20 text-xs font-medium text-orange-700 dark:text-orange-300">
                                            Super Admin
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-2 relative z-10">
                                    <Button variant="ghost" asChild className="w-full justify-between h-auto p-3 hover:bg-orange-50 dark:hover:bg-orange-900/20">
                                        <Link href="/admin/support" className="flex items-center">
                                            <div className="flex items-center gap-3">
                                                <MessageSquare className="h-4 w-4" />
                                                <div className="text-left">
                                                    <div className="font-medium">Support Tickets</div>
                                                    <div className="text-xs text-muted-foreground">Manage user issues</div>
                                                </div>
                                            </div>
                                            <ChevronRight className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                    <div className="border-t border-border/50" />
                                    <Button variant="ghost" asChild className="w-full justify-between h-auto p-3 hover:bg-orange-50 dark:hover:bg-orange-900/20">
                                        <Link href="/admin/feedback" className="flex items-center">
                                            <div className="flex items-center gap-3">
                                                <Bell className="h-4 w-4" />
                                                <div className="text-left">
                                                    <div className="font-medium">User Feedback</div>
                                                    <div className="text-xs text-muted-foreground">Review suggestions</div>
                                                </div>
                                            </div>
                                            <ChevronRight className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                    <div className="border-t border-border/50" />
                                    <Button variant="ghost" asChild className="w-full justify-between h-auto p-3 hover:bg-orange-50 dark:hover:bg-orange-900/20">
                                        <Link href="/admin/announcements" className="flex items-center">
                                            <div className="flex items-center gap-3">
                                                <Megaphone className="h-4 w-4" />
                                                <div className="text-left">
                                                    <div className="font-medium">Announcements</div>
                                                    <div className="text-xs text-muted-foreground">Platform updates</div>
                                                </div>
                                            </div>
                                            <ChevronRight className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                </CardContent>
                            </CardGradientMesh>
                        </Card>
                        {/* Platform Analytics */}
                        <Card className="overflow-hidden bg-background/50 border-primary/20 hover:shadow-lg transition-all duration-200 hover:scale-[1.02] group">
                            <CardGradientMesh>
                                <CardHeader className="relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl group-hover:scale-110 transition-transform">
                                            <Target className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                        <div className="flex-1">
                                            <CardTitle className="text-lg">Platform Analytics</CardTitle>
                                            <CardDescription>Platform-wide insights</CardDescription>
                                        </div>
                                        <div className="inline-flex items-center px-2 py-1 rounded-md bg-indigo-100 dark:bg-indigo-900/20 text-xs font-medium text-indigo-700 dark:text-indigo-300">
                                            Super Admin
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-2 relative z-10">
                                    <Button variant="ghost" asChild className="w-full justify-between h-auto p-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/20">
                                        <Link href="/admin/analytics/platform" className="flex items-center">
                                            <div className="flex items-center gap-3">
                                                <BarChart3 className="h-4 w-4" />
                                                <div className="text-left">
                                                    <div className="font-medium">Platform Metrics</div>
                                                    <div className="text-xs text-muted-foreground">Global performance</div>
                                                </div>
                                            </div>
                                            <ChevronRight className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                    <div className="border-t border-border/50" />
                                    <Button variant="ghost" asChild className="w-full justify-between h-auto p-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/20">
                                        <Link href="/admin/analytics/engagement" className="flex items-center">
                                            <div className="flex items-center gap-3">
                                                <Activity className="h-4 w-4" />
                                                <div className="text-left">
                                                    <div className="font-medium">User Engagement</div>
                                                    <div className="text-xs text-muted-foreground">Usage patterns</div>
                                                </div>
                                            </div>
                                            <ChevronRight className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                    <div className="border-t border-border/50" />
                                    <Button variant="ghost" asChild className="w-full justify-between h-auto p-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/20">
                                        <Link href="/admin/reports/platform" className="flex items-center">
                                            <div className="flex items-center gap-3">
                                                <FileText className="h-4 w-4" />
                                                <div className="text-left">
                                                    <div className="font-medium">Platform Reports</div>
                                                    <div className="text-xs text-muted-foreground">Comprehensive data</div>
                                                </div>
                                            </div>
                                            <ChevronRight className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                </CardContent>
                            </CardGradientMesh>
                        </Card>
                        {/* System Configuration */}
                        <Card className="overflow-hidden bg-background/50 border-primary/20 hover:shadow-lg transition-all duration-200 hover:scale-[1.02] group">
                            <CardGradientMesh>
                                <CardHeader className="relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-xl group-hover:scale-110 transition-transform">
                                            <Settings className="h-6 w-6 text-green-600 dark:text-green-400" />
                                        </div>
                                        <div className="flex-1">
                                            <CardTitle className="text-lg">System Config</CardTitle>
                                            <CardDescription>Platform settings & features</CardDescription>
                                        </div>
                                        <div className="inline-flex items-center px-2 py-1 rounded-md bg-green-100 dark:bg-green-900/20 text-xs font-medium text-green-700 dark:text-green-300">
                                            Super Admin
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-2 relative z-10">
                                    <Button variant="ghost" asChild className="w-full justify-between h-auto p-3 hover:bg-green-50 dark:hover:bg-green-900/20">
                                        <Link href="/admin/config/features" className="flex items-center">
                                            <div className="flex items-center gap-3">
                                                <Zap className="h-4 w-4" />
                                                <div className="text-left">
                                                    <div className="font-medium">Feature Flags</div>
                                                    <div className="text-xs text-muted-foreground">Control rollouts</div>
                                                </div>
                                            </div>
                                            <ChevronRight className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                    <div className="border-t border-border/50" />
                                    <Button variant="ghost" asChild className="w-full justify-between h-auto p-3 hover:bg-green-50 dark:hover:bg-green-900/20">
                                        <Link href="/admin/config/settings" className="flex items-center">
                                            <div className="flex items-center gap-3">
                                                <Settings className="h-4 w-4" />
                                                <div className="text-left">
                                                    <div className="font-medium">Platform Settings</div>
                                                    <div className="text-xs text-muted-foreground">Global configuration</div>
                                                </div>
                                            </div>
                                            <ChevronRight className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                    <div className="border-t border-border/50" />
                                    <Button variant="ghost" asChild className="w-full justify-between h-auto p-3 hover:bg-green-50 dark:hover:bg-green-900/20">
                                        <Link href="/admin/system/maintenance" className="flex items-center">
                                            <div className="flex items-center gap-3">
                                                <Wrench className="h-4 w-4" />
                                                <div className="text-left">
                                                    <div className="font-medium">Maintenance Mode</div>
                                                    <div className="text-xs text-muted-foreground">System maintenance</div>
                                                </div>
                                            </div>
                                            <ChevronRight className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                </CardContent>
                            </CardGradientMesh>
                        </Card>
                        {/* Advanced Management */}
                        <Card className="overflow-hidden bg-background/50 border-primary/20 hover:shadow-lg transition-all duration-200 hover:scale-[1.02] group">
                            <CardGradientMesh>
                                <CardHeader className="relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-yellow-100 dark:bg-yellow-900/50 rounded-xl group-hover:scale-110 transition-transform">
                                            <Shield className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                                        </div>
                                        <div className="flex-1">
                                            <CardTitle className="text-lg">Advanced Management</CardTitle>
                                            <CardDescription>Platform-wide management tools</CardDescription>
                                        </div>
                                        <div className="inline-flex items-center px-2 py-1 rounded-md bg-yellow-100 dark:bg-yellow-900/20 text-xs font-medium text-yellow-700 dark:text-yellow-300">
                                            Super Admin
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-2 relative z-10">
                                    <Button variant="ghost" asChild className="w-full justify-between h-auto p-3 hover:bg-yellow-50 dark:hover:bg-yellow-900/20">
                                        <Link href="/admin/billing" className="flex items-center">
                                            <div className="flex items-center gap-3">
                                                <DollarSign className="h-4 w-4" />
                                                <div className="text-left">
                                                    <div className="font-medium">Billing Management</div>
                                                    <div className="text-xs text-muted-foreground">Revenue & subscriptions</div>
                                                </div>
                                            </div>
                                            <ChevronRight className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                    <div className="border-t border-border/50" />
                                    <Button variant="ghost" asChild className="w-full justify-between h-auto p-3 hover:bg-yellow-50 dark:hover:bg-yellow-900/20">
                                        <Link href="/admin/integrations" className="flex items-center">
                                            <div className="flex items-center gap-3">
                                                <Key className="h-4 w-4" />
                                                <div className="text-left">
                                                    <div className="font-medium">API & Integrations</div>
                                                    <div className="text-xs text-muted-foreground">External services</div>
                                                </div>
                                            </div>
                                            <ChevronRight className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                    <div className="border-t border-border/50" />
                                    <Button variant="ghost" asChild className="w-full justify-between h-auto p-3 hover:bg-yellow-50 dark:hover:bg-yellow-900/20">
                                        <Link href="/admin/audit" className="flex items-center">
                                            <div className="flex items-center gap-3">
                                                <FileText className="h-4 w-4" />
                                                <div className="text-left">
                                                    <div className="font-medium">Audit Logs</div>
                                                    <div className="text-xs text-muted-foreground">Security & compliance</div>
                                                </div>
                                            </div>
                                            <ChevronRight className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                </CardContent>
                            </CardGradientMesh>
                        </Card>
                    </RoleProtectedFeature>
                </div>
            </div>
            {/* Enhanced Recent Activity Feed */}
            <Card className="overflow-hidden bg-background/50 border-primary/20">
                <CardGradientMesh>
                    <CardHeader className="relative z-10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                    <Clock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl">Recent Activity</CardTitle>
                                    <CardDescription>Latest team events and actions</CardDescription>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-xs font-medium">
                                    {recentActivity.length} Events
                                </div>
                                <Button variant="outline" size="sm" asChild>
                                    <Link href="/admin/users/activity" className="gap-2">
                                        View All
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        {isLoading ? (
                            <div className="space-y-3">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3">
                                        <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                                            <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : recentActivity.length > 0 ? (
                            <div className="space-y-1">
                                {recentActivity.slice(0, 8).map((activity, index) => (
                                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors group">
                                        <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full flex-shrink-0 group-hover:scale-110 transition-transform">
                                            <Users className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{activity.description}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(activity.timestamp).toLocaleString()}
                                                </p>
                                                <div className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-muted">
                                                    {activity.type || 'Action'}
                                                </div>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                <div className="mx-auto mb-4 p-3 bg-muted/50 rounded-full w-fit">
                                    <Clock className="h-8 w-8 opacity-50" />
                                </div>
                                <p className="text-sm font-medium">No recent activity to show</p>
                                <p className="text-xs mt-1 max-w-sm mx-auto">
                                    Activity will appear here as team members interact with the platform.
                                    Check back later or refresh to see updates.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </CardGradientMesh>
            </Card>

            {/* Quick Stats Footer */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                        <span>System Online</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        <span>Auto-refresh every 5 minutes</span>
                    </div>
                </div>
                <div className="text-xs text-muted-foreground">
                    Bayon Coagent Admin Dashboard v2.0
                </div>
            </div>
        </div>
    );
}