"use client";

import { useState, useEffect } from "react";
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Activity, DollarSign, Clock, TrendingUp, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface PerformanceMetrics {
    executionTime: number;
    tokenUsage: number;
    cost: number;
    successRate: number;
    userSatisfaction: number;
    qualityScore: number;
}

interface PerformanceData {
    strandId?: string;
    metrics: PerformanceMetrics;
    aggregatedMetrics: {
        avgExecutionTime: number;
        avgTokenUsage: number;
        avgCost: number;
        avgSuccessRate: number;
        avgUserSatisfaction: number;
        avgQualityScore: number;
        totalTasks: number;
    };
    history: Array<{
        timestamp: string;
        metrics: PerformanceMetrics;
    }>;
}

interface CostData {
    dimension: "strand" | "user" | "task-type";
    breakdown: Array<{
        key: string;
        totalCost: number;
        totalTokens: number;
        operationCount: number;
    }>;
    totals: {
        totalCost: number;
        totalTokens: number;
        totalOperations: number;
    };
}

type Timeframe = "1h" | "24h" | "7d" | "30d" | "90d";

interface AnalyticsVisualizationsProps {
    strandId?: string;
    className?: string;
}

export function AnalyticsVisualizations({
    strandId,
    className,
}: AnalyticsVisualizationsProps) {
    const [timeframe, setTimeframe] = useState<Timeframe>("7d");
    const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
    const [costData, setCostData] = useState<CostData | null>(null);
    const [costDimension, setCostDimension] = useState<CostData["dimension"]>("strand");
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        fetchAnalytics();
    }, [timeframe, strandId, costDimension]);

    const fetchAnalytics = async () => {
        setIsLoading(true);
        try {
            // Fetch performance data
            const perfParams = new URLSearchParams({ timeframe });
            if (strandId) perfParams.append("strandId", strandId);

            const perfResponse = await fetch(
                `/api/agentstrands/analytics/performance?${perfParams}`
            );
            if (perfResponse.ok) {
                const perfData = await perfResponse.json();
                setPerformanceData(perfData);
            }

            // Fetch cost data
            const costParams = new URLSearchParams({ timeframe, dimension: costDimension });
            const costResponse = await fetch(
                `/api/agentstrands/analytics/cost?${costParams}`
            );
            if (costResponse.ok) {
                const costDataResult = await costResponse.json();
                setCostData(costDataResult);
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load analytics data",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
            maximumFractionDigits: 4,
        }).format(value);
    };

    const formatNumber = (value: number) => {
        return new Intl.NumberFormat("en-US").format(value);
    };

    const formatPercentage = (value: number) => {
        return `${(value * 100).toFixed(1)}%`;
    };

    const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4"];

    if (isLoading) {
        return (
            <div className={cn("space-y-4", className)}>
                <Skeleton className="h-12 w-full" />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                </div>
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    return (
        <div className={cn("space-y-6", className)}>
            {/* Header with Timeframe Selector */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Analytics</h2>
                    <p className="text-muted-foreground">
                        Performance metrics and cost analysis for AgentStrands
                    </p>
                </div>
                <Select value={timeframe} onValueChange={(v) => setTimeframe(v as Timeframe)}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="1h">Last Hour</SelectItem>
                        <SelectItem value="24h">Last 24 Hours</SelectItem>
                        <SelectItem value="7d">Last 7 Days</SelectItem>
                        <SelectItem value="30d">Last 30 Days</SelectItem>
                        <SelectItem value="90d">Last 90 Days</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Key Metrics Cards */}
            {performanceData && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Avg Execution Time</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {(performanceData.aggregatedMetrics.avgExecutionTime / 1000).toFixed(2)}s
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {performanceData.aggregatedMetrics.totalTasks} tasks
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatPercentage(performanceData.aggregatedMetrics.avgSuccessRate)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Across all strands
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">User Satisfaction</CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {performanceData.aggregatedMetrics.avgUserSatisfaction.toFixed(1)}/5
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Average rating
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatCurrency(costData?.totals.totalCost || 0)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {formatNumber(costData?.totals.totalTokens || 0)} tokens
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Charts */}
            <Tabs defaultValue="performance" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="performance">Performance</TabsTrigger>
                    <TabsTrigger value="cost">Cost Analysis</TabsTrigger>
                    <TabsTrigger value="quality">Quality Metrics</TabsTrigger>
                </TabsList>

                {/* Performance Tab */}
                <TabsContent value="performance" className="space-y-4">
                    {performanceData && performanceData.history.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Execution Time Trend</CardTitle>
                                <CardDescription>
                                    Average execution time over the selected period
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={performanceData.history}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey="timestamp"
                                            tickFormatter={(value) =>
                                                new Date(value).toLocaleDateString(undefined, {
                                                    month: "short",
                                                    day: "numeric",
                                                })
                                            }
                                        />
                                        <YAxis
                                            label={{ value: "Time (ms)", angle: -90, position: "insideLeft" }}
                                        />
                                        <Tooltip
                                            labelFormatter={(value) =>
                                                new Date(value).toLocaleString()
                                            }
                                            formatter={(value: number) => [`${value}ms`, "Execution Time"]}
                                        />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="metrics.executionTime"
                                            stroke="#3b82f6"
                                            name="Execution Time"
                                            strokeWidth={2}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    )}

                    {performanceData && performanceData.history.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Token Usage Trend</CardTitle>
                                <CardDescription>
                                    Token consumption over time
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={performanceData.history}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey="timestamp"
                                            tickFormatter={(value) =>
                                                new Date(value).toLocaleDateString(undefined, {
                                                    month: "short",
                                                    day: "numeric",
                                                })
                                            }
                                        />
                                        <YAxis
                                            label={{ value: "Tokens", angle: -90, position: "insideLeft" }}
                                        />
                                        <Tooltip
                                            labelFormatter={(value) =>
                                                new Date(value).toLocaleString()
                                            }
                                            formatter={(value: number) => [formatNumber(value), "Tokens"]}
                                        />
                                        <Legend />
                                        <Bar
                                            dataKey="metrics.tokenUsage"
                                            fill="#8b5cf6"
                                            name="Token Usage"
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* Cost Analysis Tab */}
                <TabsContent value="cost" className="space-y-4">
                    <div className="flex items-center gap-4">
                        <Select
                            value={costDimension}
                            onValueChange={(v) => setCostDimension(v as CostData["dimension"])}
                        >
                            <SelectTrigger className="w-[200px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="strand">By Strand</SelectItem>
                                <SelectItem value="user">By User</SelectItem>
                                <SelectItem value="task-type">By Task Type</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {costData && costData.breakdown.length > 0 && (
                        <div className="grid gap-4 md:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Cost Distribution</CardTitle>
                                    <CardDescription>
                                        Cost breakdown by {costDimension}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={costData.breakdown}
                                                dataKey="totalCost"
                                                nameKey="key"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={100}
                                                label={(entry) => `${entry.key}: ${formatCurrency(entry.totalCost)}`}
                                            >
                                                {costData.breakdown.map((entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={COLORS[index % COLORS.length]}
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Cost Breakdown</CardTitle>
                                    <CardDescription>
                                        Detailed cost analysis
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {costData.breakdown.map((item, index) => (
                                            <div key={item.key} className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="h-3 w-3 rounded-full"
                                                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                                        />
                                                        <span className="font-medium">{item.key}</span>
                                                    </div>
                                                    <span className="font-bold">{formatCurrency(item.totalCost)}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                                    <span>{formatNumber(item.totalTokens)} tokens</span>
                                                    <span>{item.operationCount} operations</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </TabsContent>

                {/* Quality Metrics Tab */}
                <TabsContent value="quality" className="space-y-4">
                    {performanceData && (
                        <div className="grid gap-4 md:grid-cols-3">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Quality Score</CardTitle>
                                    <CardDescription>Average quality rating</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-4xl font-bold">
                                        {formatPercentage(performanceData.aggregatedMetrics.avgQualityScore)}
                                    </div>
                                    <div className="mt-2 h-2 w-full bg-secondary rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary transition-all"
                                            style={{
                                                width: `${performanceData.aggregatedMetrics.avgQualityScore * 100}%`,
                                            }}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>User Satisfaction</CardTitle>
                                    <CardDescription>Average user rating</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-4xl font-bold">
                                        {performanceData.aggregatedMetrics.avgUserSatisfaction.toFixed(2)}
                                        <span className="text-2xl text-muted-foreground">/5.00</span>
                                    </div>
                                    <div className="mt-2 h-2 w-full bg-secondary rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-yellow-500 transition-all"
                                            style={{
                                                width: `${(performanceData.aggregatedMetrics.avgUserSatisfaction / 5) * 100}%`,
                                            }}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Success Rate</CardTitle>
                                    <CardDescription>Task completion rate</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-4xl font-bold">
                                        {formatPercentage(performanceData.aggregatedMetrics.avgSuccessRate)}
                                    </div>
                                    <div className="mt-2 h-2 w-full bg-secondary rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-green-500 transition-all"
                                            style={{
                                                width: `${performanceData.aggregatedMetrics.avgSuccessRate * 100}%`,
                                            }}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
