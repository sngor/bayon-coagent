/**
 * Super Admin Billing Management Page
 * 
 * Comprehensive billing dashboard with enhanced Stripe power capabilities
 */

'use client';

import { useMemo, useCallback, memo } from 'react';
import {
    AnimatedTabs as Tabs,
    AnimatedTabsContent as TabsContent,
    AnimatedTabsList as TabsList,
    AnimatedTabsTrigger as TabsTrigger,
} from '@/components/ui/animated-tabs';
import { BillingErrorBoundary } from '@/components/admin/billing-error-boundary';
import { EnhancedBillingSearch } from '@/components/admin/enhanced-billing-search';
import { PromotionManager } from '@/components/admin/promotion-manager';
import { BillingAnalytics } from '@/components/admin/billing-analytics';
import { BillingMetricCard } from '@/components/admin/billing-metric-card';
import { useBillingMetrics } from '@/hooks/use-billing-metrics';
import { useToast } from '@/hooks/use-toast';
import {
    Search,
    Tag,
    TrendingUp,
    DollarSign,
    Users,
    Receipt,
    RefreshCw,
    AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Memoized metric card component for better performance
const MemoizedBillingMetricCard = memo(BillingMetricCard);

// Static formatters to avoid recreation
const formatCurrency = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});

const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

export default function SuperAdminBillingPage() {
    const { metrics, loading, error, refetch, isStale } = useBillingMetrics();
    const { toast } = useToast();

    const handleRefresh = useCallback(async () => {
        await refetch();
        toast({
            title: 'Success',
            description: 'Billing metrics updated successfully',
        });
    }, [refetch, toast]);

    // Calculate conversion rate (simplified - active / (active + canceled))
    const conversionRate = useMemo(() => {
        if (!metrics) return 0;
        const total = metrics.activeSubscriptions + metrics.canceledSubscriptions;
        return total > 0 ? (metrics.activeSubscriptions / total) * 100 : 0;
    }, [metrics]);

    // Calculate trends for metrics (mock data - in real app, compare with previous period)
    const metricTrends = useMemo(() => {
        if (!metrics) return {};

        return {
            totalRevenue: { value: 12.5, isPositive: true },
            activeSubscriptions: { value: 8.3, isPositive: true },
            paymentFailures: { value: -15.2, isPositive: true }, // Negative is good for failures
            monthlyRecurringRevenue: { value: 9.7, isPositive: true },
            churnRate: { value: -2.1, isPositive: true }, // Negative churn is good
            averageRevenuePerUser: { value: 5.4, isPositive: true },
            lifetimeValue: { value: 18.9, isPositive: true },
            conversionRate: { value: 3.2, isPositive: true },
        };
    }, [metrics]);

    // Memoize metric configurations with trends
    const primaryMetrics = useMemo(() => [
        {
            title: "Total Revenue",
            value: formatCurrency.format(metrics?.totalRevenue || 0),
            subtitle: "All-time revenue",
            icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
            trend: metricTrends.totalRevenue,
            variant: 'success' as const
        },
        {
            title: "Active Subscriptions",
            value: metrics?.activeSubscriptions || 0,
            subtitle: `${metrics?.trialSubscriptions || 0} on trial`,
            icon: <Users className="h-4 w-4 text-muted-foreground" />,
            trend: metricTrends.activeSubscriptions,
            variant: 'default' as const
        },
        {
            title: "Payment Failures",
            value: metrics?.paymentFailures || 0,
            subtitle: "Requires attention",
            icon: <Receipt className="h-4 w-4 text-muted-foreground" />,
            trend: metricTrends.paymentFailures,
            variant: (metrics?.paymentFailures || 0) > 10 ? 'danger' as const : 'default' as const
        },
        {
            title: "MRR",
            value: formatCurrency.format(metrics?.monthlyRecurringRevenue || 0),
            subtitle: "Monthly recurring revenue",
            icon: <TrendingUp className="h-4 w-4 text-muted-foreground" />,
            trend: metricTrends.monthlyRecurringRevenue,
            variant: 'success' as const
        }
    ], [metrics, formatCurrency, metricTrends]);

    const secondaryMetrics = useMemo(() => [
        {
            title: "Churn Rate",
            value: formatPercentage(metrics?.churnRate || 0),
            subtitle: "Customer churn rate",
            icon: <TrendingUp className="h-4 w-4 text-muted-foreground" />,
            trend: metricTrends.churnRate,
            variant: (metrics?.churnRate || 0) > 5 ? 'warning' as const : 'default' as const
        },
        {
            title: "ARPU",
            value: formatCurrency.format(metrics?.averageRevenuePerUser || 0),
            subtitle: "Average revenue per user",
            icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
            trend: metricTrends.averageRevenuePerUser,
            variant: 'default' as const
        },
        {
            title: "LTV",
            value: formatCurrency.format(metrics?.lifetimeValue || 0),
            subtitle: "Customer lifetime value",
            icon: <Users className="h-4 w-4 text-muted-foreground" />,
            trend: metricTrends.lifetimeValue,
            variant: 'success' as const
        },
        {
            title: "Conversion Rate",
            value: formatPercentage(conversionRate),
            subtitle: "Trial to paid conversion",
            icon: <TrendingUp className="h-4 w-4 text-muted-foreground" />,
            trend: metricTrends.conversionRate,
            variant: 'default' as const
        }
    ], [metrics, formatCurrency, formatPercentage, conversionRate, metricTrends]);

    return (
        <BillingErrorBoundary>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Billing Management</h1>
                        <p className="text-muted-foreground">
                            Comprehensive billing operations powered by Stripe integration
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={handleRefresh}
                        disabled={loading}
                        className="flex items-center gap-2"
                        aria-label={loading ? "Refreshing billing metrics..." : "Refresh billing metrics"}
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        {loading ? 'Refreshing...' : 'Refresh'}
                    </Button>
                </div>

                {/* Error State */}
                {error && (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            {error}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Data Freshness Indicator */}
                {isStale && (
                    <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            Data may be outdated. Consider refreshing for the latest metrics.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Primary Metrics */}
                <div className="grid gap-4 md:grid-cols-4">
                    {primaryMetrics.map((metric, index) => (
                        <MemoizedBillingMetricCard
                            key={`primary-${metric.title}`}
                            title={metric.title}
                            value={metric.value}
                            subtitle={metric.subtitle}
                            icon={metric.icon}
                            trend={metric.trend}
                            variant={metric.variant}
                            loading={loading}
                        />
                    ))}
                </div>

                {/* Secondary Metrics */}
                <div className="grid gap-4 md:grid-cols-4">
                    {secondaryMetrics.map((metric, index) => (
                        <MemoizedBillingMetricCard
                            key={`secondary-${metric.title}`}
                            title={metric.title}
                            value={metric.value}
                            subtitle={metric.subtitle}
                            icon={metric.icon}
                            trend={metric.trend}
                            variant={metric.variant}
                            loading={loading}
                        />
                    ))}
                </div>

                {/* Main Content Tabs */}
                <Tabs defaultValue="search" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="search" className="flex items-center gap-2">
                            <Search className="h-4 w-4" />
                            Advanced Search
                        </TabsTrigger>
                        <TabsTrigger value="promotions" className="flex items-center gap-2">
                            <Tag className="h-4 w-4" />
                            Promotions
                        </TabsTrigger>
                        <TabsTrigger value="analytics" className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Analytics
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="search">
                        <EnhancedBillingSearch />
                    </TabsContent>

                    <TabsContent value="promotions">
                        <PromotionManager />
                    </TabsContent>

                    <TabsContent value="analytics">
                        <BillingAnalytics />
                    </TabsContent>
                </Tabs>
            </div>
        </BillingErrorBoundary>
    );
}