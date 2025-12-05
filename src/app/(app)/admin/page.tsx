'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CardGradientMesh } from '@/components/ui/gradient-mesh';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
    Megaphone
} from 'lucide-react';
import { getAdminDashboardStats, getRecentActivityAction } from '@/features/admin/actions/admin-actions';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/use-user-role';
import { RoleProtectedFeature } from '@/components/admin/role-protected-feature';
import { RoleBadge } from '@/components/admin/role-badge';

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<any>({
        totalUsers: 0,
        pendingInvitations: 0,
        systemStatus: 'Checking...'
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
                    getRecentActivityAction(5, { filterByTeam: true })
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
    }, []);

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
                        <RoleBadge role={role} size="md" />
                    </div>
                    <p className="text-muted-foreground">Manage your team and organization settings</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button asChild>
                        <Link href="/admin/users">
                            <UserPlus className="mr-2 h-4 w-4" />
                            Invite Member
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="overflow-hidden bg-background/50 border-primary/20">
                    <CardGradientMesh>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-3xl font-bold">{isLoading ? '-' : stats.totalUsers}</div>
                            <div className="flex items-center gap-2 mt-2">
                                <TrendingUp className="h-4 w-4 text-green-600" />
                                <span className="text-sm text-green-600 font-medium">Active members</span>
                            </div>
                        </CardContent>
                    </CardGradientMesh>
                </Card>

                <Card className="overflow-hidden bg-background/50 border-primary/20">
                    <CardGradientMesh>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                            <CardTitle className="text-sm font-medium">Pending Invitations</CardTitle>
                            <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
                                <Mail className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-3xl font-bold">{isLoading ? '-' : stats.pendingInvitations}</div>
                            <div className="flex items-center gap-2 mt-2">
                                <Clock className="h-4 w-4 text-orange-600" />
                                <span className="text-sm text-orange-600 font-medium">
                                    {stats.pendingInvitations > 0 ? 'Awaiting acceptance' : 'All clear'}
                                </span>
                            </div>
                        </CardContent>
                    </CardGradientMesh>
                </Card>

                <Card className="overflow-hidden bg-background/50 border-primary/20">
                    <CardGradientMesh>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                            <CardTitle className="text-sm font-medium">System Status</CardTitle>
                            <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                                <Activity className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-3xl font-bold text-green-600">
                                {isLoading ? '-' : stats.systemStatus === 'Healthy' ? '100%' : 'Degraded'}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span className="text-sm text-green-600 font-medium">All systems operational</span>
                            </div>
                        </CardContent>
                    </CardGradientMesh>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Quick Actions */}
                <Card className="overflow-hidden bg-background/50 border-primary/20">
                    <CardGradientMesh>
                        <CardHeader className="relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-xl">
                                    <Settings className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl">Team Management</CardTitle>
                                    <CardDescription>Quick access to common tasks</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4 relative z-10">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <Button variant="outline" asChild className="h-auto py-4 flex flex-col gap-2 hover:bg-purple-50 dark:hover:bg-purple-950/50">
                                    <Link href="/admin/users">
                                        <Users className="h-6 w-6 text-purple-600" />
                                        <span>Manage Users</span>
                                    </Link>
                                </Button>
                                <Button variant="outline" asChild className="h-auto py-4 flex flex-col gap-2 hover:bg-blue-50 dark:hover:bg-blue-950/50">
                                    <Link href="/admin/resources">
                                        <Shield className="h-6 w-6 text-blue-600" />
                                        <span>Resources</span>
                                    </Link>
                                </Button>
                                <Button variant="outline" asChild className="h-auto py-4 flex flex-col gap-2 hover:bg-orange-50 dark:hover:bg-orange-950/50">
                                    <Link href="/admin/announcements">
                                        <Megaphone className="h-6 w-6 text-orange-600" />
                                        <span>Announcements</span>
                                    </Link>
                                </Button>
                                <RoleProtectedFeature
                                    requiredRole="superadmin"
                                    renderDisabled
                                    showTooltip
                                    tooltipMessage="Audit Log is only accessible to SuperAdmins"
                                >
                                    <Button variant="outline" asChild className="h-auto py-4 flex flex-col gap-2 hover:bg-green-50 dark:hover:bg-green-950/50">
                                        <Link href="/admin/audit">
                                            <Shield className="h-6 w-6 text-green-600" />
                                            <span>Audit Log</span>
                                        </Link>
                                    </Button>
                                </RoleProtectedFeature>
                            </div>
                        </CardContent>
                    </CardGradientMesh>
                </Card>

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
                                        <CardDescription>Latest team events</CardDescription>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            {recentActivity.length > 0 ? (
                                <div className="space-y-4">
                                    {recentActivity.map((activity, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                                                    <Users className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">{activity.description}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(activity.timestamp).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <p className="text-sm">No recent activity to show</p>
                                </div>
                            )}
                        </CardContent>
                    </CardGradientMesh>
                </Card>
            </div>
        </div>
    );
}
