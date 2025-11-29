'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CardGradientMesh } from '@/components/ui/gradient-mesh';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { getAdminDashboardStats, getRecentActivityAction } from '@/features/admin/actions/admin-actions';
import {
    Users,
    MessageSquare,
    BarChart3,
    Settings,
    Activity,
    Shield,
    TrendingUp,
    AlertCircle,
    CheckCircle,
    Clock,
    ArrowRight,
    Zap,
    DollarSign,
    Server,
    Cpu,
    Database,
    Globe,
    AlertTriangle
} from 'lucide-react';

export default function AdminPage() {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalFeedback: 0,
        pendingFeedback: 0,
        totalAiRequests: 0,
        totalAiCosts: 0,
        activeFeatures: 0,
        betaFeatures: 0,
        systemStatus: 'Checking...'
    });
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const [statsResult, activityResult] = await Promise.all([
                    getAdminDashboardStats(),
                    getRecentActivityAction()
                ]);

                if (statsResult.message === 'success' && statsResult.data) {
                    setStats(statsResult.data);
                }

                if (activityResult.message === 'success' && activityResult.data) {
                    setRecentActivity(activityResult.data);
                }
            } catch (error) {
                console.error('Failed to load admin data', error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    return (
        <div className="space-y-8">
            {/* System Status Banner */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 rounded-xl border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-green-900 dark:text-green-100">
                            {stats.systemStatus === 'Checking...' ? 'Checking System Status...' :
                                stats.systemStatus === 'Healthy' ? 'All Systems Operational' : stats.systemStatus}
                        </h3>
                        <p className="text-sm text-green-700 dark:text-green-300">Last checked: Just now</p>
                    </div>
                </div>
                <Button variant="outline" size="sm" asChild className="border-green-300 hover:bg-green-100 dark:border-green-700 dark:hover:bg-green-900/50">
                    <Link href="/super-admin/health">
                        View Details
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="overflow-hidden bg-background/50 border-primary/20">
                    <CardGradientMesh>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-3xl font-bold">{stats.totalUsers}</div>
                            <div className="flex items-center gap-2 mt-2">
                                <TrendingUp className="h-4 w-4 text-green-600" />
                                <span className="text-sm text-green-600 font-medium">Active users</span>
                            </div>
                        </CardContent>
                    </CardGradientMesh>
                </Card>

                <Card className="overflow-hidden bg-background/50 border-primary/20">
                    <CardGradientMesh>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                            <CardTitle className="text-sm font-medium">AI Requests Today</CardTitle>
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                                <Zap className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-3xl font-bold">{stats.totalAiRequests}</div>
                            <div className="flex items-center gap-2 mt-2">
                                <DollarSign className="h-4 w-4 text-purple-600" />
                                <span className="text-sm text-purple-600 font-medium">
                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(stats.totalAiCosts || 0)} est. cost
                                </span>
                            </div>
                        </CardContent>
                    </CardGradientMesh>
                </Card>

                <Card className="overflow-hidden bg-background/50 border-primary/20">
                    <CardGradientMesh>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                            <CardTitle className="text-sm font-medium">Pending Feedback</CardTitle>
                            <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
                                <MessageSquare className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-3xl font-bold">{stats.pendingFeedback}</div>
                            <div className="flex items-center gap-2 mt-2">
                                <Clock className="h-4 w-4 text-orange-600" />
                                <span className="text-sm text-orange-600 font-medium">
                                    {stats.pendingFeedback > 0 ? 'Items pending review' : 'All caught up'}
                                </span>
                            </div>
                        </CardContent>
                    </CardGradientMesh>
                </Card>

                <Card className="overflow-hidden bg-background/50 border-primary/20">
                    <CardGradientMesh>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                            <CardTitle className="text-sm font-medium">System Health</CardTitle>
                            <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                                <Activity className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-3xl font-bold text-green-600">
                                {stats.systemStatus === 'Healthy' ? '100%' : stats.systemStatus === 'Checking...' ? '-' : 'Degraded'}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span className="text-sm text-green-600 font-medium">
                                    {stats.systemStatus === 'Healthy' ? 'All services online' : stats.systemStatus}
                                </span>
                            </div>
                        </CardContent>
                    </CardGradientMesh>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="overflow-hidden bg-background/50 border-primary/20">
                    <CardGradientMesh>
                        <CardHeader className="relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-orange-100 dark:bg-orange-900/50 rounded-xl">
                                    <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl">Priority Actions</CardTitle>
                                    <CardDescription className="text-base">Items requiring immediate attention</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4 relative z-10">
                            <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-gray-900/50 rounded-lg border">
                                <div className="flex items-center gap-3">
                                    <MessageSquare className="h-5 w-5 text-orange-600" />
                                    <span className="font-medium">Review Feedback</span>
                                </div>
                                <Badge variant="secondary">{stats.pendingFeedback} pending</Badge>
                            </div>
                            <Button asChild className="w-full bg-orange-600 hover:bg-orange-700">
                                <Link href="/super-admin/feedback">
                                    Review All Feedback
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </CardContent>
                    </CardGradientMesh>
                </Card>

                <Card className="overflow-hidden bg-background/50 border-primary/20">
                    <CardGradientMesh>
                        <CardHeader className="relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
                                    <Server className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl">System Monitoring</CardTitle>
                                    <CardDescription className="text-base">Real-time system status and performance</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4 relative z-10">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-2">
                                    <Database className="h-4 w-4 text-green-600" />
                                    <span className="text-sm">Database</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Globe className="h-4 w-4 text-green-600" />
                                    <span className="text-sm">APIs</span>
                                </div>
                            </div>
                            <Button variant="outline" asChild className="w-full border-blue-300 hover:bg-blue-50 dark:border-blue-700 dark:hover:bg-blue-950/50">
                                <Link href="/super-admin/health">
                                    View System Health
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </CardContent>
                    </CardGradientMesh>
                </Card>
            </div>

            {/* Management Areas */}
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Settings className="h-5 w-5 text-primary" />
                    </div>
                    <h2 className="font-headline text-2xl font-bold">Management Areas</h2>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* User Management */}
                    <Card className="group hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer overflow-hidden bg-background/50 border-primary/20">
                        <CardGradientMesh>
                            <CardHeader className="relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-colors">
                                        <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">User Management</CardTitle>
                                        <CardDescription>Accounts & analytics</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4 relative z-10">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/50 rounded-lg">
                                        <div className="font-bold text-lg">{stats.totalUsers}</div>
                                        <div className="text-muted-foreground">Total</div>
                                    </div>
                                    <div className="text-center p-3 bg-green-50 dark:bg-green-950/50 rounded-lg">
                                        <div className="font-bold text-lg">{stats.totalUsers}</div>
                                        <div className="text-muted-foreground">Active</div>
                                    </div>
                                </div>
                                <Button variant="outline" asChild className="w-full group-hover:bg-blue-50 dark:group-hover:bg-blue-950/50">
                                    <Link href="/super-admin/users">
                                        Manage Users
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </CardContent>
                        </CardGradientMesh>
                    </Card>

                    {/* Team Management */}
                    <Card className="group hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer overflow-hidden bg-background/50 border-primary/20">
                        <CardGradientMesh>
                            <CardHeader className="relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-orange-100 dark:bg-orange-900/50 rounded-xl group-hover:bg-orange-200 dark:group-hover:bg-orange-800/50 transition-colors">
                                        <Users className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">Team Management</CardTitle>
                                        <CardDescription>Groups & assignments</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4 relative z-10">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/50 rounded-lg">
                                        <div className="font-bold text-lg">{(stats as any).totalTeams || 0}</div>
                                        <div className="text-muted-foreground">Total</div>
                                    </div>
                                    <div className="text-center p-3 bg-amber-50 dark:bg-amber-950/50 rounded-lg">
                                        <div className="font-bold text-lg">{stats.totalUsers}</div>
                                        <div className="text-muted-foreground">Members</div>
                                    </div>
                                </div>
                                <Button variant="outline" asChild className="w-full group-hover:bg-orange-50 dark:group-hover:bg-orange-950/50">
                                    <Link href="/super-admin/teams">
                                        Manage Teams
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </CardContent>
                        </CardGradientMesh>
                    </Card>

                    {/* Analytics */}
                    <Card className="group hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer overflow-hidden bg-background/50 border-primary/20">
                        <CardGradientMesh>
                            <CardHeader className="relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-xl group-hover:bg-purple-200 dark:group-hover:bg-purple-800/50 transition-colors">
                                        <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">Analytics & Insights</CardTitle>
                                        <CardDescription>Metrics & costs</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4 relative z-10">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="text-center p-3 bg-purple-50 dark:bg-purple-950/50 rounded-lg">
                                        <div className="font-bold text-lg">
                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(stats.totalAiCosts || 0)}
                                        </div>
                                        <div className="text-muted-foreground">AI Costs</div>
                                    </div>
                                    <div className="text-center p-3 bg-indigo-50 dark:bg-indigo-950/50 rounded-lg">
                                        <div className="font-bold text-lg">{stats.totalAiRequests}</div>
                                        <div className="text-muted-foreground">Requests</div>
                                    </div>
                                </div>
                                <Button variant="outline" asChild className="w-full group-hover:bg-purple-50 dark:group-hover:bg-purple-950/50">
                                    <Link href="/super-admin/analytics">
                                        View Analytics
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </CardContent>
                        </CardGradientMesh>
                    </Card>

                    {/* Feature Management */}
                    <Card className="group hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer overflow-hidden bg-background/50 border-primary/20">
                        <CardGradientMesh>
                            <CardHeader className="relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-xl group-hover:bg-green-200 dark:group-hover:bg-green-800/50 transition-colors">
                                        <Settings className="h-6 w-6 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">Feature Control</CardTitle>
                                        <CardDescription>Flags & rollouts</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4 relative z-10">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="text-center p-3 bg-green-50 dark:bg-green-950/50 rounded-lg">
                                        <div className="font-bold text-lg">{stats.activeFeatures}</div>
                                        <div className="text-muted-foreground">Active</div>
                                    </div>
                                    <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-950/50 rounded-lg">
                                        <div className="font-bold text-lg">{stats.betaFeatures}</div>
                                        <div className="text-muted-foreground">Beta</div>
                                    </div>
                                </div>
                                <Button variant="outline" asChild className="w-full group-hover:bg-green-50 dark:group-hover:bg-green-950/50">
                                    <Link href="/super-admin/features">
                                        Manage Features
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </CardContent>
                        </CardGradientMesh>
                    </Card>
                </div>
            </div>

            {/* Secondary Actions */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="hover:shadow-md transition-shadow overflow-hidden bg-background/50 border-primary/20">
                    <CardGradientMesh>
                        <CardHeader className="relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-orange-100 dark:bg-orange-900/50 rounded-xl">
                                    <Shield className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">Admin Management</CardTitle>
                                    <CardDescription>Create and manage admin accounts</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <Button variant="outline" asChild className="w-full">
                                <Link href="/super-admin/setup">
                                    Manage Admins
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </CardContent>
                    </CardGradientMesh>
                </Card>

                <Card className="hover:shadow-md transition-shadow overflow-hidden bg-background/50 border-primary/20">
                    <CardGradientMesh>
                        <CardHeader className="relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
                                    <MessageSquare className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">User Feedback</CardTitle>
                                    <CardDescription>Review and respond to user feedback</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <Button variant="outline" asChild className="w-full">
                                <Link href="/super-admin/feedback">
                                    View Feedback
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </CardContent>
                    </CardGradientMesh>
                </Card>
            </div>

            {/* Recent Activity */}
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
                                    <CardDescription>Latest system events and user actions</CardDescription>
                                </div>
                            </div>
                            <Button variant="outline" size="sm">
                                View All
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        {recentActivity.length > 0 ? (
                            <div className="space-y-4">
                                {recentActivity.map((activity, index) => (
                                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                                                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <p className="font-medium">{activity.description}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {new Date(activity.timestamp).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link href={`/super-admin/users?search=${activity.user.email}`}>
                                                View User
                                            </Link>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-full w-fit mx-auto mb-4">
                                    <Clock className="h-8 w-8 opacity-50" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">No recent activity</h3>
                                <p className="text-sm max-w-md mx-auto">
                                    Activity logs will appear here as users interact with the platform.
                                    This includes logins, feature usage, and system events.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </CardGradientMesh>
            </Card>
        </div>
    );
}