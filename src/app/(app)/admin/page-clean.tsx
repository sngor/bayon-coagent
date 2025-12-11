'use client';

import { useMemo } from 'react';
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
    Zap
} from 'lucide-react';
import { useUserRole } from '@/hooks/use-user-role';
import { useAdminDashboard } from '@/hooks/use-admin-dashboard';
import { RoleProtectedFeature } from '@/components/admin/role-protected-feature';
import { RoleBadge } from '@/components/admin/role-badge';
import { AdminDashboardMetrics } from '@/components/admin/admin-dashboard-metrics';

export default function AdminDashboardPage() {
    const { role } = useUserRole();
    const { stats, recentActivity, loading: isLoading, refreshAll: refetch } = useAdminDashboard();

    // Memoized calculations
    const teamGrowthRate = useMemo(() => {
        if (!stats.totalUsers || !stats.newSignups24h) return 0;
        return ((stats.newSignups24h / stats.totalUsers) * 100);
    }, [stats.totalUsers, stats.newSignups24h]);

    const activeUserPercentage = useMemo(() => {
        if (!stats.totalUsers || !stats.activeUsers) return 0;
        return Math.round((stats.activeUsers / stats.totalUsers) * 100);
    }, [stats.totalUsers, stats.activeUsers]);

    return (
        <div className="space-y-8" role="main" aria-label="Admin Dashboard">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
                        <RoleBadge role={role} size="md" />
                    </div>
                    <p className="text-muted-foreground">
                        Team management and monitoring overview
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

            {/* Key Metrics Grid - Use extracted component */}
            <AdminDashboardMetrics stats={stats} isLoading={isLoading} />

            {/* Quick Actions Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Team Analytics */}
                <Card className="overflow-hidden bg-background/50 border-primary/20">
                    <CardGradientMesh>
                        <CardHeader className="relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
                                    <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">Team Analytics</CardTitle>
                                    <CardDescription>Team performance and insights</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-2 relative z-10">
                            <Button variant="ghost" asChild className="w-full justify-start">
                                <Link href="/admin/analytics">
                                    <BarChart3 className="mr-2 h-4 w-4" />
                                    Team Performance
                                </Link>
                            </Button>
                            <Button variant="ghost" asChild className="w-full justify-start">
                                <Link href="/admin/users/activity">
                                    <Activity className="mr-2 h-4 w-4" />
                                    Team Activity
                                </Link>
                            </Button>
                            <Button variant="ghost" asChild className="w-full justify-start">
                                <Link href="/admin/reports/team">
                                    <FileText className="mr-2 h-4 w-4" />
                                    Team Reports
                                </Link>
                            </Button>
                        </CardContent>
                    </CardGradientMesh>
                </Card>

                {/* Team Management */}
                <Card className="overflow-hidden bg-background/50 border-primary/20">
                    <CardGradientMesh>
                        <CardHeader className="relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-xl">
                                    <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">Team Management</CardTitle>
                                    <CardDescription>Manage team members and content</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-2 relative z-10">
                            <Button variant="ghost" asChild className="w-full justify-start">
                                <Link href="/admin/users">
                                    <Users className="mr-2 h-4 w-4" />
                                    Team Members
                                </Link>
                            </Button>
                            <Button variant="ghost" asChild className="w-full justify-start">
                                <Link href="/admin/content/moderation">
                                    <Flag className="mr-2 h-4 w-4" />
                                    Content Review
                                </Link>
                            </Button>
                            <Button variant="ghost" asChild className="w-full justify-start">
                                <Link href="/admin/users/invitations">
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Invite Members
                                </Link>
                            </Button>
                        </CardContent>
                    </CardGradientMesh>
                </Card>

                {/* Super Admin Only - Support & Communication */}
                <RoleProtectedFeature requiredRole="superadmin">
                    <Card className="overflow-hidden bg-background/50 border-primary/20">
                        <CardGradientMesh>
                            <CardHeader className="relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-orange-100 dark:bg-orange-900/50 rounded-xl">
                                        <MessageSquare className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">Support & Communication</CardTitle>
                                        <CardDescription>Platform-wide support management</CardDescription>
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
                                    <Link href="/admin/feedback">
                                        <Bell className="mr-2 h-4 w-4" />
                                        User Feedback
                                    </Link>
                                </Button>
                                <Button variant="ghost" asChild className="w-full justify-start">
                                    <Link href="/admin/announcements">
                                        <Megaphone className="mr-2 h-4 w-4" />
                                        Platform Announcements
                                    </Link>
                                </Button>
                            </CardContent>
                        </CardGradientMesh>
                    </Card>
                </RoleProtectedFeature>

                {/* Super Admin Only - Platform Analytics */}
                <RoleProtectedFeature requiredRole="superadmin">
                    <Card className="overflow-hidden bg-background/50 border-primary/20">
                        <CardGradientMesh>
                            <CardHeader className="relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl">
                                        <BarChart3 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">Platform Analytics</CardTitle>
                                        <CardDescription>Platform-wide insights and metrics</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-2 relative z-10">
                                <Button variant="ghost" asChild className="w-full justify-start">
                                    <Link href="/admin/analytics/platform">
                                        <BarChart3 className="mr-2 h-4 w-4" />
                                        Platform Metrics
                                    </Link>
                                </Button>
                                <Button variant="ghost" asChild className="w-full justify-start">
                                    <Link href="/admin/analytics/engagement">
                                        <Activity className="mr-2 h-4 w-4" />
                                        User Engagement
                                    </Link>
                                </Button>
                                <Button variant="ghost" asChild className="w-full justify-start">
                                    <Link href="/admin/reports/platform">
                                        <FileText className="mr-2 h-4 w-4" />
                                        Platform Reports
                                    </Link>
                                </Button>
                            </CardContent>
                        </CardGradientMesh>
                    </Card>
                </RoleProtectedFeature>

                {/* Super Admin Only - System Configuration */}
                <RoleProtectedFeature requiredRole="superadmin">
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
                </RoleProtectedFeature>

                {/* Super Admin Only - System Health & Monitoring */}
                <RoleProtectedFeature requiredRole="superadmin">
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
                                <Button variant="ghost" asChild className="w-full justify-start">
                                    <Link href="/admin/audit">
                                        <Shield className="mr-2 h-4 w-4" />
                                        Audit Logs
                                    </Link>
                                </Button>
                            </CardContent>
                        </CardGradientMesh>
                    </Card>
                </RoleProtectedFeature>

                {/* Super Admin Only - Advanced Management */}
                <RoleProtectedFeature requiredRole="superadmin">
                    <Card className="overflow-hidden bg-background/50 border-primary/20">
                        <CardGradientMesh>
                            <CardHeader className="relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-yellow-100 dark:bg-yellow-900/50 rounded-xl">
                                        <Shield className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">Advanced Management</CardTitle>
                                        <CardDescription>Platform-wide management tools</CardDescription>
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
                                    <CardDescription>Latest team events and actions</CardDescription>
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
                                <p className="text-xs mt-1">Activity will appear here as team members interact with the platform</p>
                            </div>
                        )}
                    </CardContent>
                </CardGradientMesh>
            </Card>
        </div>
    );
}