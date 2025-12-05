'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CardGradientMesh } from '@/components/ui/gradient-mesh';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Users,
    Settings,
    Mail,
    Clock,
    UserPlus,
    Shield,
    ArrowRight,
    CheckCircle,
    Activity,
    TrendingUp,
    Megaphone,
    BarChart3,
    MessageSquare,
    FileText,
    AlertTriangle,
    DollarSign,
    Flag,
    Bell,
    Wrench,
    Key,
    Zap
} from 'lucide-react';
import { getAdminDashboardStats, getRecentActivityAction } from '@/features/admin/actions/admin-actions';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/use-user-role';
import { RoleProtectedFeature } from '@/components/admin/role-protected-feature';
import { RoleBadge } from '@/components/admin/role-badge';

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<any>({
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
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const { role, isSuperAdmin, isAdmin } = useUserRole();

    useEffect(() => {
        async function loadData() {
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
            } catch (error) {
                console.error('Failed to load admin data:', error);
                toast({
                    title: 'Error',
                    description: 'Failed to load dashboard data',
                    variant: 'destructive',
                });
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, [toast]);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
                        <RoleBadge role={role} size="md" />
                    </div>
                    <p className="text-muted-foreground">
                        Platform management and monitoring overview
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button asChild variant="outline">
                        <Link href="/admin/analytics">
                            <BarChart3 className="mr-2 h-4 w-4" />
                            View Analytics
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href="/admin/users">
                            <UserPlus className="mr-2 h-4 w-4" />
                            Invite Member
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Active Alerts */}
            {stats.alerts && stats.alerts.length > 0 && (
                <div className="space-y-3">
                    {stats.alerts.map((alert: any, index: number) => (
                        <Alert key={index} variant={alert.severity === 'critical' ? 'destructive' : 'default'}>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                <span className="font-medium">{alert.message}</span>
                                {alert.action && (
                                    <Button variant="link" asChild className="ml-2 h-auto p-0">
                                        <Link href={alert.action.href}>{alert.action.label}</Link>
                                    </Button>
                                )}
                            </AlertDescription>
                        </Alert>
                    ))}
                </div>
            )}

            {/* Key Metrics Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {/* Total Users */}
                <Card className="overflow-hidden bg-background/50 border-primary/20">
                    <CardGradientMesh>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-3xl font-bold">{isLoading ? '-' : stats.totalUsers}</div>
                            <div className="flex items-center gap-2 mt-2">
                                <TrendingUp className="h-4 w-4 text-green-600" />
                                <span className="text-sm text-green-600 font-medium">
                                    {stats.activeUsers || 0} active
                                </span>
                            </div>
                        </CardContent>
                    </CardGradientMesh>
                </Card>

                {/* New Signups */}
                <Card className="overflow-hidden bg-background/50 border-primary/20">
                    <CardGradientMesh>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                            <CardTitle className="text-sm font-medium">New Signups (24h)</CardTitle>
                            <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                                <UserPlus className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-3xl font-bold">{isLoading ? '-' : stats.newSignups24h || 0}</div>
                            <div className="flex items-center gap-2 mt-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Last 24 hours</span>
                            </div>
                        </CardContent>
                    </CardGradientMesh>
                </Card>

                {/* Open Tickets */}
                <Card className="overflow-hidden bg-background/50 border-primary/20">
                    <CardGradientMesh>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
                            <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
                                <MessageSquare className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-3xl font-bold">{isLoading ? '-' : stats.openTickets || 0}</div>
                            <div className="flex items-center gap-2 mt-2">
                                <ArrowRight className="h-4 w-4 text-orange-600" />
                                <Button variant="link" asChild className="h-auto p-0 text-sm text-orange-600">
                                    <Link href="/admin/support">View tickets</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </CardGradientMesh>
                </Card>

                {/* System Health */}
                <Card className="overflow-hidden bg-background/50 border-primary/20">
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
                                {isLoading ? '-' : stats.systemStatus === 'Healthy' ? '100%' : 'Degraded'}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                {stats.systemStatus === 'Healthy' ? (
                                    <>
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                        <span className="text-sm text-green-600 font-medium">All systems operational</span>
                                    </>
                                ) : (
                                    <>
                                        <AlertTriangle className="h-4 w-4 text-red-600" />
                                        <Button variant="link" asChild className="h-auto p-0 text-sm text-red-600">
                                            <Link href="/admin/system/health">View details</Link>
                                        </Button>
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </CardGradientMesh>
                </Card>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Analytics & Monitoring */}
                <Card className="overflow-hidden bg-background/50 border-primary/20">
                    <CardGradientMesh>
                        <CardHeader className="relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
                                    <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">Analytics & Monitoring</CardTitle>
                                    <CardDescription>Platform insights and metrics</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-2 relative z-10">
                            <Button variant="ghost" asChild className="w-full justify-start">
                                <Link href="/admin/analytics">
                                    <BarChart3 className="mr-2 h-4 w-4" />
                                    Platform Analytics
                                </Link>
                            </Button>
                            <Button variant="ghost" asChild className="w-full justify-start">
                                <Link href="/admin/users/activity">
                                    <Activity className="mr-2 h-4 w-4" />
                                    User Activity
                                </Link>
                            </Button>
                            <Button variant="ghost" asChild className="w-full justify-start">
                                <Link href="/admin/reports/engagement">
                                    <FileText className="mr-2 h-4 w-4" />
                                    Engagement Reports
                                </Link>
                            </Button>
                        </CardContent>
                    </CardGradientMesh>
                </Card>

                {/* User & Content Management */}
                <Card className="overflow-hidden bg-background/50 border-primary/20">
                    <CardGradientMesh>
                        <CardHeader className="relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-xl">
                                    <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">User & Content</CardTitle>
                                    <CardDescription>Manage users and content</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-2 relative z-10">
                            <Button variant="ghost" asChild className="w-full justify-start">
                                <Link href="/admin/users">
                                    <Users className="mr-2 h-4 w-4" />
                                    User Management
                                </Link>
                            </Button>
                            <Button variant="ghost" asChild className="w-full justify-start">
                                <Link href="/admin/content/moderation">
                                    <Flag className="mr-2 h-4 w-4" />
                                    Content Moderation
                                </Link>
                            </Button>
                            <Button variant="ghost" asChild className="w-full justify-start">
                                <Link href="/admin/feedback">
                                    <MessageSquare className="mr-2 h-4 w-4" />
                                    User Feedback
                                </Link>
                            </Button>
                        </CardContent>
                    </CardGradientMesh>
                </Card>

                {/* Support & Communication */}
                <Card className="overflow-hidden bg-background/50 border-primary/20">
                    <CardGradientMesh>
                        <CardHeader className="relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-orange-100 dark:bg-orange-900/50 rounded-xl">
                                    <MessageSquare className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">Support & Communication</CardTitle>
                                    <CardDescription>Help users and send updates</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-2 relative z-10">
                            <Button variant="ghost" asChild className="w-full justify-start">
                                <Link href="/admin/support">
                                    <MessageSquare className="mr-2 h-4 w-4" />
                                    Support Tickets
                                </Link>
                            </Button>
                            <Button variant="ghost" asChild className="w-full justify-start">
                                <Link href="/admin/announcements">
                                    <Megaphone className="mr-2 h-4 w-4" />
                                    Announcements
                                </Link>
                            </Button>
                            <Button variant="ghost" asChild className="w-full justify-start">
                                <Link href="/admin/feedback">
                                    <Bell className="mr-2 h-4 w-4" />
                                    Feedback Management
                                </Link>
                            </Button>
                        </CardContent>
                    </CardGradientMesh>
                </Card>

                {/* System Configuration */}
                <Card className="overflow-hidden bg-background/50 border-primary/20">
                    <CardGradientMesh>
                        <CardHeader className="relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-xl">
                                    <Settings className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">System Configuration</CardTitle>
                                    <CardDescription>Platform settings and features</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-2 relative z-10">
                            <Button variant="ghost" asChild className="w-full justify-start">
                                <Link href="/admin/config/features">
                                    <Zap className="mr-2 h-4 w-4" />
                                    Feature Flags
                                </Link>
                            </Button>
                            <Button variant="ghost" asChild className="w-full justify-start">
                                <Link href="/admin/config/settings">
                                    <Settings className="mr-2 h-4 w-4" />
                                    Platform Settings
                                </Link>
                            </Button>
                            <Button variant="ghost" asChild className="w-full justify-start">
                                <Link href="/admin/system/maintenance">
                                    <Wrench className="mr-2 h-4 w-4" />
                                    Maintenance Mode
                                </Link>
                            </Button>
                        </CardContent>
                    </CardGradientMesh>
                </Card>

                {/* System Health & Monitoring */}
                <Card className="overflow-hidden bg-background/50 border-primary/20">
                    <CardGradientMesh>
                        <CardHeader className="relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-xl">
                                    <Activity className="h-6 w-6 text-red-600 dark:text-red-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">System Health</CardTitle>
                                    <CardDescription>Monitor system performance</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-2 relative z-10">
                            <Button variant="ghost" asChild className="w-full justify-start">
                                <Link href="/admin/system/health">
                                    <Activity className="mr-2 h-4 w-4" />
                                    Health Dashboard
                                </Link>
                            </Button>
                            <RoleProtectedFeature requiredRole="superadmin" renderDisabled>
                                <Button variant="ghost" asChild className="w-full justify-start">
                                    <Link href="/admin/audit">
                                        <Shield className="mr-2 h-4 w-4" />
                                        Audit Logs
                                    </Link>
                                </Button>
                            </RoleProtectedFeature>
                        </CardContent>
                    </CardGradientMesh>
                </Card>

                {/* SuperAdmin Only */}
                <RoleProtectedFeature requiredRole="superadmin" renderDisabled>
                    <Card className="overflow-hidden bg-background/50 border-primary/20">
                        <CardGradientMesh>
                            <CardHeader className="relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-yellow-100 dark:bg-yellow-900/50 rounded-xl">
                                        <Shield className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">SuperAdmin</CardTitle>
                                        <CardDescription>Advanced management tools</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-2 relative z-10">
                                <Button variant="ghost" asChild className="w-full justify-start">
                                    <Link href="/admin/billing">
                                        <DollarSign className="mr-2 h-4 w-4" />
                                        Billing Management
                                    </Link>
                                </Button>
                                <Button variant="ghost" asChild className="w-full justify-start">
                                    <Link href="/admin/integrations">
                                        <Key className="mr-2 h-4 w-4" />
                                        API & Integrations
                                    </Link>
                                </Button>
                                <Button variant="ghost" asChild className="w-full justify-start">
                                    <Link href="/admin/audit">
                                        <FileText className="mr-2 h-4 w-4" />
                                        Audit Logs
                                    </Link>
                                </Button>
                            </CardContent>
                        </CardGradientMesh>
                    </Card>
                </RoleProtectedFeature>
            </div>

            {/* Recent Activity Feed */}
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
                                    <CardDescription>Latest platform events and actions</CardDescription>
                                </div>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/admin/users/activity">
                                    View All
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        {recentActivity.length > 0 ? (
                            <div className="space-y-3">
                                {recentActivity.slice(0, 8).map((activity, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full flex-shrink-0">
                                                <Users className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{activity.description}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(activity.timestamp).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p className="text-sm">No recent activity to show</p>
                                <p className="text-xs mt-1">Activity will appear here as users interact with the platform</p>
                            </div>
                        )}
                    </CardContent>
                </CardGradientMesh>
            </Card>
        </div>
    );
}
