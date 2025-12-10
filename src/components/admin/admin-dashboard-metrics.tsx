'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CardGradientMesh } from '@/components/ui/gradient-mesh';
import { Users, UserPlus, TrendingUp, Clock, MessageSquare, ArrowRight, Activity, CheckCircle, AlertTriangle } from 'lucide-react';
import { RoleProtectedFeature } from '@/components/admin/role-protected-feature';
import { AdminDashboardStats } from '@/types/admin';

interface AdminDashboardMetricsProps {
    stats: AdminDashboardStats;
    isLoading: boolean;
}

export function AdminDashboardMetrics({ stats, isLoading }: AdminDashboardMetricsProps) {
    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Team Members */}
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
                            <span className="text-sm text-green-600 font-medium">
                                {stats.activeUsers || 0} active
                            </span>
                        </div>
                    </CardContent>
                </CardGradientMesh>
            </Card>

            {/* New Members */}
            <Card className="overflow-hidden bg-background/50 border-primary/20">
                <CardGradientMesh>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                        <CardTitle className="text-sm font-medium">New Members (24h)</CardTitle>
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

            {/* Super Admin Only - Open Tickets */}
            <RoleProtectedFeature requiredRole="superadmin">
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
                                <span className="text-sm text-orange-600">View tickets</span>
                            </div>
                        </CardContent>
                    </CardGradientMesh>
                </Card>
            </RoleProtectedFeature>

            {/* Super Admin Only - System Health */}
            <RoleProtectedFeature requiredRole="superadmin">
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
                                        <span className="text-sm text-red-600">View details</span>
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </CardGradientMesh>
                </Card>
            </RoleProtectedFeature>
        </div>
    );
}