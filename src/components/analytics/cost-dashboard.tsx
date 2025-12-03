'use client';

/**
 * Cost Dashboard Component
 * 
 * Displays cost analytics including breakdowns by dimension, trends,
 * alerts, and optimization suggestions.
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    AlertCircle,
    Lightbulb,
    ChevronRight,
    Zap,
    Users,
    Activity,
} from 'lucide-react';
import type {
    CostBreakdown,
    CostAlert,
    CostOptimization,
} from '@/aws/bedrock/analytics/types';

interface CostDashboardProps {
    /** Cost breakdown data */
    breakdown: CostBreakdown;
    /** Active cost alerts */
    alerts?: CostAlert[];
    /** Optimization suggestions */
    optimizations?: CostOptimization[];
    /** Whether data is loading */
    loading?: boolean;
    /** Budget limit (optional) */
    budgetLimit?: number;
}

export function CostDashboard({
    breakdown,
    alerts = [],
    optimizations = [],
    loading = false,
    budgetLimit,
}: CostDashboardProps) {
    const [showAllOptimizations, setShowAllOptimizations] = useState(false);

    const budgetUsage = budgetLimit ? (breakdown.total / budgetLimit) * 100 : 0;
    const totalPotentialSavings = optimizations.reduce(
        (sum, opt) => sum + opt.potentialSavings,
        0
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Cost Dashboard</h2>
                    <p className="text-sm text-muted-foreground">
                        {new Date(breakdown.period.start).toLocaleDateString()} -{' '}
                        {new Date(breakdown.period.end).toLocaleDateString()}
                    </p>
                </div>
                {alerts.length > 0 && (
                    <Badge variant="destructive" className="gap-2">
                        <AlertCircle className="h-4 w-4" />
                        {alerts.length} Cost Alerts
                    </Badge>
                )}
            </div>

            {/* Total Cost Card */}
            <Card className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20" />
                <CardHeader className="relative">
                    <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Total Cost
                    </CardTitle>
                    <CardDescription>
                        {budgetLimit && (
                            <span>
                                {budgetUsage.toFixed(0)}% of ${budgetLimit.toFixed(2)} budget
                            </span>
                        )}
                    </CardDescription>
                </CardHeader>
                <CardContent className="relative">
                    <div className="text-4xl font-bold">
                        {loading ? '...' : `$${breakdown.total.toFixed(2)}`}
                    </div>
                    {budgetLimit && (
                        <Progress
                            value={budgetUsage}
                            className="mt-4 h-3"
                        />
                    )}
                    {totalPotentialSavings > 0 && (
                        <div className="mt-4 flex items-center gap-2 text-sm text-green-600">
                            <Lightbulb className="h-4 w-4" />
                            <span>
                                Potential savings: ${totalPotentialSavings.toFixed(2)}
                            </span>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Cost Alerts */}
            {alerts.length > 0 && (
                <Card className="border-orange-200 dark:border-orange-900">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-orange-600">
                            <AlertCircle className="h-5 w-5" />
                            Cost Alerts
                        </CardTitle>
                        <CardDescription>
                            Thresholds exceeded or unusual spending detected
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {alerts.map((alert) => (
                                <div
                                    key={alert.id}
                                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                                >
                                    <AlertCircle
                                        className={`h-5 w-5 mt-0.5 ${alert.severity === 'high'
                                                ? 'text-red-600'
                                                : 'text-orange-600'
                                            }`}
                                    />
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                variant={
                                                    alert.severity === 'high'
                                                        ? 'destructive'
                                                        : 'secondary'
                                                }
                                            >
                                                {alert.type}
                                            </Badge>
                                            <span className="text-sm font-medium">
                                                {alert.dimension}: {alert.dimensionValue}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {alert.message}
                                        </p>
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                            <span>Current: ${alert.currentCost.toFixed(2)}</span>
                                            <span>Threshold: ${alert.threshold.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Top Cost Drivers */}
            <Card>
                <CardHeader>
                    <CardTitle>Top Cost Drivers</CardTitle>
                    <CardDescription>
                        Highest spending categories in this period
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {breakdown.topDrivers.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                No cost data available
                            </p>
                        ) : (
                            breakdown.topDrivers.map((driver, index) => (
                                <div key={driver.name} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className={`w-2 h-2 rounded-full ${index === 0
                                                        ? 'bg-blue-600'
                                                        : index === 1
                                                            ? 'bg-purple-600'
                                                            : index === 2
                                                                ? 'bg-green-600'
                                                                : 'bg-gray-600'
                                                    }`}
                                            />
                                            <span className="font-medium">{driver.name}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm text-muted-foreground">
                                                {driver.percentage.toFixed(1)}%
                                            </span>
                                            <span className="font-bold">
                                                ${driver.cost.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                    <Progress value={driver.percentage} className="h-2" />
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Cost Breakdown by Category */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">By Strand</CardTitle>
                        <Zap className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {Object.keys(breakdown.breakdown).filter(k =>
                                k.startsWith('strand')
                            ).length}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Active strands with costs
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">By User</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {Object.keys(breakdown.breakdown).filter(k =>
                                k.startsWith('user')
                            ).length}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Users with activity
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">By Task Type</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {Object.keys(breakdown.breakdown).filter(k =>
                                k.startsWith('task')
                            ).length}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Task types executed
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Optimization Suggestions */}
            {optimizations.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Lightbulb className="h-5 w-5 text-yellow-600" />
                            Cost Optimization Suggestions
                        </CardTitle>
                        <CardDescription>
                            Potential savings: ${totalPotentialSavings.toFixed(2)}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {(showAllOptimizations
                                ? optimizations
                                : optimizations.slice(0, 3)
                            ).map((opt) => (
                                <div
                                    key={opt.id}
                                    className="flex items-start gap-3 p-4 rounded-lg border"
                                >
                                    <div
                                        className={`p-2 rounded-lg ${opt.priority === 'high'
                                                ? 'bg-red-100 dark:bg-red-900/20'
                                                : opt.priority === 'medium'
                                                    ? 'bg-orange-100 dark:bg-orange-900/20'
                                                    : 'bg-blue-100 dark:bg-blue-900/20'
                                            }`}
                                    >
                                        <Lightbulb
                                            className={`h-5 w-5 ${opt.priority === 'high'
                                                    ? 'text-red-600'
                                                    : opt.priority === 'medium'
                                                        ? 'text-orange-600'
                                                        : 'text-blue-600'
                                                }`}
                                        />
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <h4 className="font-medium">{opt.title}</h4>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {opt.description}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-bold text-green-600">
                                                    ${opt.potentialSavings.toFixed(2)}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    potential savings
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline">{opt.priority} priority</Badge>
                                            <Badge variant="outline">{opt.effort} effort</Badge>
                                        </div>
                                        <div className="text-sm">
                                            <div className="font-medium mb-1">Actions:</div>
                                            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                                {opt.actions.map((action, i) => (
                                                    <li key={i}>{action}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {optimizations.length > 3 && !showAllOptimizations && (
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => setShowAllOptimizations(true)}
                                >
                                    Show {optimizations.length - 3} More Suggestions
                                    <ChevronRight className="h-4 w-4 ml-2" />
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
