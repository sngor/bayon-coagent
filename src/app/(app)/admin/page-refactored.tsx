'use client';

import { useUserRole } from '@/hooks/use-user-role';
import { useAdminStats } from '@/hooks/use-admin-stats';
import { useAdminMetrics } from '@/hooks/use-admin-metrics';
import { useAutoRefresh } from '@/hooks/use-auto-refresh';
import { RoleProtectedFeature } from '@/components/admin/role-protected-feature';
import { AdminHeader } from '@/components/admin/admin-header';
import { AdminAlerts } from '@/components/admin/admin-alerts';
import { MetricCard, MetricCardSkeleton } from '@/components/admin/metric-card';
import { ActionCard } from '@/components/admin/action-card';
import { RecentActivity } from '@/components/admin/recent-activity';
import { ADMIN_CONFIG, METRIC_CARDS, ACTION_CARDS } from '@/lib/admin-config';
import {
    Users,
    UserPlus,
    TrendingUp,
    Calendar,
    CheckCircle,
    AlertTriangle,
    Eye,
    Activity,
    Sparkles,
    Info,
} from 'lucide-react';

export default function AdminDashboardPage() {
    const { role } = useUserRole();
    const {
        stats,
        recentActivity,
        isLoading,
        isRefreshing,
        lastUpdated,
        refresh,
        loadData,
    } = useAdminStats();

    const {
        teamGrowthRate,
        activeUserPercentage,
        formatLastUpdated,
        systemHealthStatus,
    } = useAdminMetrics(stats, lastUpdated);

    // Auto-refresh every 5 minutes
    useAutoRefresh(() => loadData(true), ADMIN_CONFIG.REFRESH_INTERVAL);

    return (
        <div className="space-y-8 p-6 max-w-7xl mx-auto" role="main" aria-label="Admin Dashboard">
            {/* Header */}
            <AdminHeader
                role={role}
                lastUpdated={formatLastUpdated}
                isRefreshing={isRefreshing}
                onRefresh={refresh}
            />

            {/* Active Alerts */}
            <AdminAlerts alerts={stats.alerts || []} />

            {/* Key Metrics */}
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
                    {isLoading ? (
                        <MetricCardSkeleton />
                    ) : (
                        <MetricCard
                            title={METRIC_CARDS.teamMembers.title}
                            value={stats.totalUsers}
                            icon={METRIC_CARDS.teamMembers.icon}
                            iconColor={METRIC_CARDS.teamMembers.iconColor}
                            iconBgColor={METRIC_CARDS.teamMembers.iconBgColor}
                            subtitle={
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-green-600" />
                                    <span className="text-sm text-green-600 font-medium">
                                        {stats.activeUsers || 0} active
                                    </span>
                                </div>
                            }
                            badge={
                                <div className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-xs font-medium">
                                    {activeUserPercentage}%
                                </div>
                            }
                            progressBar={{
                                percentage: activeUserPercentage,
                                color: METRIC_CARDS.teamMembers.progressColor,
                            }}
                        />
                    )}

                    {/* New Members */}
                    {isLoading ? (
                        <MetricCardSkeleton />
                    ) : (
                        <MetricCard
                            title={METRIC_CARDS.newMembers.title}
                            value={stats.newSignups24h || 0}
                            icon={METRIC_CARDS.newMembers.icon}
                            iconColor={METRIC_CARDS.newMembers.iconColor}
                            iconBgColor={METRIC_CARDS.newMembers.iconBgColor}
                            subtitle={
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">Last 24 hours</span>
                                </div>
                            }
                            badge={
                                teamGrowthRate > 0 ? (
                                    <div className="inline-flex items-center px-2 py-1 rounded-md bg-green-100 dark:bg-green-900/20 text-xs font-medium">
                                        +{teamGrowthRate.toFixed(1)}%
                                    </div>
                                ) : undefined
                            }
                        />
                    )}

                    {/* Super Admin Only - Open Tickets */}
                    <RoleProtectedFeature requiredRole="superadmin">
                        {isLoading ? (
                            <MetricCardSkeleton />
                        ) : (
                            <MetricCard
                                title={METRIC_CARDS.openTickets.title}
                                value={stats.openTickets || 0}
                                icon={METRIC_CARDS.openTickets.icon}
                                iconColor={METRIC_CARDS.openTickets.iconColor}
                                iconBgColor={METRIC_CARDS.openTickets.iconBgColor}
                                action={{
                                    href: '/admin/support',
                                    label: 'View tickets',
                                    color: 'text-orange-600',
                                }}
                                badge={
                                    stats.openTickets > 0 ? (
                                        <div className="inline-flex items-center px-2 py-1 rounded-md bg-red-100 dark:bg-red-900/20 text-xs font-medium text-red-700 dark:text-red-300">
                                            Urgent
                                        </div>
                                    ) : undefined
                                }
                            />
                        )}
                    </RoleProtectedFeature>

                    {/* Super Admin Only - System Health */}
                    <RoleProtectedFeature requiredRole="superadmin">
                        {isLoading ? (
                            <MetricCardSkeleton />
                        ) : (
                            <MetricCard
                                title={METRIC_CARDS.systemHealth.title}
                                value={systemHealthStatus.displayValue}
                                icon={METRIC_CARDS.systemHealth.icon}
                                iconColor={systemHealthStatus.iconColor}
                                iconBgColor={systemHealthStatus.iconBgColor}
                                subtitle={
                                    systemHealthStatus.isHealthy ? (
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                            <span className="text-sm text-green-600 font-medium">Operational</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle className="h-4 w-4 text-red-600" />
                                            <span className="text-sm text-red-600 font-medium">Issues Detected</span>
                                        </div>
                                    )
                                }
                                badge={
                                    <div className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${systemHealthStatus.badgeColor}`}>
                                        {systemHealthStatus.badgeText}
                                    </div>
                                }
                                action={
                                    !systemHealthStatus.isHealthy
                                        ? {
                                            href: '/admin/system/health',
                                            label: 'View details',
                                            color: 'text-red-600',
                                        }
                                        : undefined
                                }
                            />
                        )}
                    </RoleProtectedFeature>
                </div>
            </div>

            {/* Quick Actions */}
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
                    <ActionCard {...ACTION_CARDS.teamAnalytics} />

                    {/* Team Management */}
                    <ActionCard {...ACTION_CARDS.teamManagement} />

                    {/* Super Admin Only Cards */}
                    <RoleProtectedFeature requiredRole="superadmin">
                        <ActionCard {...ACTION_CARDS.supportHub} />
                        <ActionCard {...ACTION_CARDS.platformAnalytics} />
                        <ActionCard {...ACTION_CARDS.systemConfig} />
                        <ActionCard {...ACTION_CARDS.advancedManagement} />
                    </RoleProtectedFeature>
                </div>
            </div>

            {/* Recent Activity */}
            <RecentActivity activities={recentActivity} isLoading={isLoading} />

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