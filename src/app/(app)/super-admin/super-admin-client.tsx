'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CardGradientMesh } from '@/components/ui/gradient-mesh';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ManagementAreaCard } from '@/components/admin/management-area-card';
import { useAdminDashboard } from '@/hooks/use-admin-dashboard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAdminStickyHeader } from '@/hooks/use-admin-sticky-header';
import { Component, ReactNode } from 'react';
import { useUser } from '@/aws/auth/use-user';
import { useAdmin } from '@/contexts/admin-context';
import {
    Users,
    MessageSquare,
    BarChart3,
    Settings,
    Activity,
    Shield,
    TrendingUp,
    CheckCircle,
    Clock,
    ArrowRight,
    Zap,
    DollarSign,
    Server,
    Database,
    Globe,
    AlertTriangle
} from 'lucide-react';

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

class SuperAdminErrorBoundary extends Component<
    { children: ReactNode },
    ErrorBoundaryState
> {
    constructor(props: { children: ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: any) {
        console.error('Super Admin Dashboard Error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="space-y-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="font-headline text-3xl font-bold">Super Admin Dashboard</h1>
                            <p className="text-muted-foreground">System administration and management overview</p>
                        </div>
                    </div>
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            <div className="space-y-2">
                                <p>Something went wrong loading the Super Admin dashboard.</p>
                                <p className="text-sm text-muted-foreground">
                                    Error: {this.state.error?.message || 'Unknown error'}
                                </p>
                                <Button 
                                    onClick={() => this.setState({ hasError: false, error: undefined })} 
                                    variant="outline" 
                                    size="sm"
                                >
                                    Try Again
                                </Button>
                            </div>
                        </AlertDescription>
                    </Alert>
                </div>
            );
        }

        return this.props.children;
    }
}

function SuperAdminDashboard() {
    const {
        stats,
        recentActivity,
        loading,
        error,
        refreshAll
    } = useAdminDashboard();

    // Ensure stats is properly serialized to prevent React error #130
    const safeStats = {
        totalUsers: Number(stats?.totalUsers) || 0,
        activeUsers: Number(stats?.activeUsers) || 0,
        newSignups24h: Number(stats?.newSignups24h) || 0,
        pendingInvitations: Number(stats?.pendingInvitations) || 0,
        systemStatus: String(stats?.systemStatus) || 'Checking...',
        openTickets: Number(stats?.openTickets) || 0,
        pendingContent: Number(stats?.pendingContent) || 0,
        errorRate: Number(stats?.errorRate) || 0,
        totalFeedback: Number(stats?.totalFeedback) || 0,
        pendingFeedback: Number(stats?.pendingFeedback) || 0,
        totalAiRequests: Number(stats?.totalAiRequests) || 0,
        totalAiCosts: Number(stats?.totalAiCosts) || 0,
        activeFeatures: Number(stats?.activeFeatures) || 0,
        betaFeatures: Number(stats?.betaFeatures) || 0,
        totalTeams: Number(stats?.totalTeams) || 0,
    };

    const headerRef = useAdminStickyHeader({
        title: 'Super Admin Dashboard',
        icon: Shield
    });

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div ref={headerRef} className="flex items-center justify-between">
                <div>
                    <h1 className="font-headline text-3xl font-bold">Super Admin Dashboard</h1>
                    <p className="text-muted-foreground">System administration and management overview</p>
                </div>
            </div>

            {/* Error State */}
            {error && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* System Status Banner */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 rounded-xl border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-green-900 dark:text-green-100">
                            {safeStats.systemStatus === 'Checking...' ? 'Checking System Status...' :
                                safeStats.systemStatus === 'Healthy' ? 'All Systems Operational' : safeStats.systemStatus}
                        </h3>
                        <p className="text-sm text-green-700 dark:text-green-300">Last checked: Just now</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={refreshAll}
                        disabled={loading}
                        className="border-green-300 hover:bg-green-100 dark:border-green-700 dark:hover:bg-green-900/50"
                    >
                        {loading ? 'Refreshing...' : 'Refresh'}
                    </Button>
                    <Button variant="outline" size="sm" asChild className="border-green-300 hover:bg-green-100 dark:border-green-700 dark:hover:bg-green-900/50">
                        <Link href="/super-admin/health">
                            View Details
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="overflow-hidden bg-white dark:bg-gray-900 border-primary/20">
                    <CardGradientMesh>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-3xl font-bold">{safeStats.totalUsers}</div>
                            <div className="flex items-center gap-2 mt-2">
                                <TrendingUp className="h-4 w-4 text-green-600" />
                                <span className="text-sm text-green-600 font-medium">Active users</span>
                            </div>
                        </CardContent>
                    </CardGradientMesh>
                </Card>

                <Card className="overflow-hidden bg-white dark:bg-gray-900 border-primary/20">
                    <CardGradientMesh>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                            <CardTitle className="text-sm font-medium">AI Requests Today</CardTitle>
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                                <Zap className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-3xl font-bold">{safeStats.totalAiRequests}</div>
                            <div className="flex items-center gap-2 mt-2">
                                <DollarSign className="h-4 w-4 text-purple-600" />
                                <span className="text-sm text-purple-600 font-medium">
                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(safeStats.totalAiCosts || 0)} est. cost
                                </span>
                            </div>
                        </CardContent>
                    </CardGradientMesh>
                </Card>

                <Card className="overflow-hidden bg-white dark:bg-gray-900 border-primary/20">
                    <CardGradientMesh>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                            <CardTitle className="text-sm font-medium">Pending Feedback</CardTitle>
                            <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
                                <MessageSquare className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-3xl font-bold">{safeStats.pendingFeedback}</div>
                            <div className="flex items-center gap-2 mt-2">
                                <Clock className="h-4 w-4 text-orange-600" />
                                <span className="text-sm text-orange-600 font-medium">
                                    {safeStats.pendingFeedback > 0 ? 'Items pending review' : 'All caught up'}
                                </span>
                            </div>
                        </CardContent>
                    </CardGradientMesh>
                </Card>

                <Card className="overflow-hidden bg-white dark:bg-gray-900 border-primary/20">
                    <CardGradientMesh>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                            <CardTitle className="text-sm font-medium">System Health</CardTitle>
                            <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                                <Activity className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-3xl font-bold text-green-600">
                                {safeStats.systemStatus === 'Healthy' ? '100%' : safeStats.systemStatus === 'Checking...' ? '-' : 'Degraded'}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span className="text-sm text-green-600 font-medium">
                                    {safeStats.systemStatus === 'Healthy' ? 'All services online' : safeStats.systemStatus}
                                </span>
                            </div>
                        </CardContent>
                    </CardGradientMesh>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="overflow-hidden bg-white dark:bg-gray-900 border-primary/20">
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
                                <Badge variant="secondary">{safeStats.pendingFeedback} pending</Badge>
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

                <Card className="overflow-hidden bg-white dark:bg-gray-900 border-primary/20">
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
                    <Card className="group hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer overflow-hidden bg-white dark:bg-gray-900 border-primary/20">
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
                                        <div className="font-bold text-lg">{safeStats.totalUsers}</div>
                                        <div className="text-muted-foreground">Total</div>
                                    </div>
                                    <div className="text-center p-3 bg-green-50 dark:bg-green-950/50 rounded-lg">
                                        <div className="font-bold text-lg">{safeStats.totalUsers}</div>
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
                    <Card className="group hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer overflow-hidden bg-white dark:bg-gray-900 border-primary/20">
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
                                        <div className="font-bold text-lg">{safeStats.totalTeams || 0}</div>
                                        <div className="text-muted-foreground">Total</div>
                                    </div>
                                    <div className="text-center p-3 bg-amber-50 dark:bg-amber-950/50 rounded-lg">
                                        <div className="font-bold text-lg">{safeStats.totalUsers}</div>
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
                    <Card className="group hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer overflow-hidden bg-white dark:bg-gray-900 border-primary/20">
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
                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(safeStats.totalAiCosts || 0)}
                                        </div>
                                        <div className="text-muted-foreground">AI Costs</div>
                                    </div>
                                    <div className="text-center p-3 bg-indigo-50 dark:bg-indigo-950/50 rounded-lg">
                                        <div className="font-bold text-lg">{safeStats.totalAiRequests}</div>
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
                    <Card className="group hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer overflow-hidden bg-white dark:bg-gray-900 border-primary/20">
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
                                        <div className="font-bold text-lg">{safeStats.activeFeatures}</div>
                                        <div className="text-muted-foreground">Active</div>
                                    </div>
                                    <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-950/50 rounded-lg">
                                        <div className="font-bold text-lg">{safeStats.betaFeatures}</div>
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

                    {/* Support & Communication */}
                    <Card className="group hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer overflow-hidden bg-white dark:bg-gray-900 border-primary/20">
                        <CardGradientMesh>
                            <CardHeader className="relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-xl group-hover:bg-red-200 dark:group-hover:bg-red-800/50 transition-colors">
                                        <MessageSquare className="h-6 w-6 text-red-600 dark:text-red-400" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">Support & Communication</CardTitle>
                                        <CardDescription>Tickets & announcements</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4 relative z-10">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="text-center p-3 bg-red-50 dark:bg-red-950/50 rounded-lg">
                                        <div className="font-bold text-lg">{safeStats.pendingFeedback}</div>
                                        <div className="text-muted-foreground">Tickets</div>
                                    </div>
                                    <div className="text-center p-3 bg-pink-50 dark:bg-pink-950/50 rounded-lg">
                                        <div className="font-bold text-lg">3</div>
                                        <div className="text-muted-foreground">Announcements</div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Button variant="outline" asChild className="w-full group-hover:bg-red-50 dark:group-hover:bg-red-950/50">
                                        <Link href="/super-admin/support">
                                            Support Tickets
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                    <Button variant="outline" asChild className="w-full group-hover:bg-red-50 dark:group-hover:bg-red-950/50">
                                        <Link href="/super-admin/announcements">
                                            Announcements
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </CardGradientMesh>
                    </Card>

                    {/* System & Integrations */}
                    <Card className="group hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer overflow-hidden bg-white dark:bg-gray-900 border-primary/20">
                        <CardGradientMesh>
                            <CardHeader className="relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800/50 transition-colors">
                                        <Zap className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">System & Integrations</CardTitle>
                                        <CardDescription>APIs & system health</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4 relative z-10">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="text-center p-3 bg-indigo-50 dark:bg-indigo-950/50 rounded-lg">
                                        <div className="font-bold text-lg">6</div>
                                        <div className="text-muted-foreground">APIs</div>
                                    </div>
                                    <div className="text-center p-3 bg-cyan-50 dark:bg-cyan-950/50 rounded-lg">
                                        <div className="font-bold text-lg">100%</div>
                                        <div className="text-muted-foreground">Uptime</div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Button variant="outline" asChild className="w-full group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/50">
                                        <Link href="/super-admin/integrations">
                                            API Integrations
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                    <Button variant="outline" asChild className="w-full group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/50">
                                        <Link href="/super-admin/health">
                                            System Health
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </CardGradientMesh>
                    </Card>
                </div>
            </div>

            {/* Secondary Actions */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="hover:shadow-md transition-shadow overflow-hidden bg-white dark:bg-gray-900 border-primary/20">
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

                <Card className="hover:shadow-md transition-shadow overflow-hidden bg-white dark:bg-gray-900 border-primary/20">
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
            <Card className="overflow-hidden bg-white dark:bg-gray-900 border-primary/20">
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
function DebugInfo() {
    const { user } = useUser();
    const { isSuperAdmin, isAdmin, role } = useAdmin();
    
    return (
        <Card className="mb-6 border-blue-200 bg-blue-50 dark:bg-blue-950/20">
            <CardHeader>
                <CardTitle className="text-sm text-blue-800 dark:text-blue-200">Debug Information</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
                <div>User ID: {user?.id || 'Not loaded'}</div>
                <div>Email: {user?.email || 'Not loaded'}</div>
                <div>Is Admin: {isAdmin ? 'Yes' : 'No'}</div>
                <div>Is Super Admin: {isSuperAdmin ? 'Yes' : 'No'}</div>
                <div>Role: {role || 'Not loaded'}</div>
            </CardContent>
        </Card>
    );
}

export default function SuperAdminClient() {
    return (
        <SuperAdminErrorBoundary>
            <DebugInfo />
            <SuperAdminDashboard />
        </SuperAdminErrorBoundary>
    );
}