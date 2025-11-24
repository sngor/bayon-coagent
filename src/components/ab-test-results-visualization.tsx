'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line,
    Area,
    AreaChart,
    ReferenceLine,
} from 'recharts';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    Tooltip as UITooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    Trophy,
    TrendingUp,
    TrendingDown,
    Users,
    Target,
    BarChart3,
    Info,
    ChevronDown,
    ChevronUp,
    Award,
    AlertTriangle,
    CheckCircle,
    Eye,
    MousePointer,
    Heart,
    Share2,
    MessageCircle,
    Calculator,
    Lightbulb,
    Download,
    RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    ABTestResults,
    VariationResults,
    EngagementMetrics,
} from '@/lib/content-workflow-types';

/**
 * Props for the A/B Test Results Visualization component
 */
interface ABTestResultsVisualizationProps {
    testResults: ABTestResults;
    className?: string;
    onRefresh?: () => void;
    onExport?: (format: 'csv' | 'pdf') => void;
}

/**
 * Statistical significance interpretation levels
 */
const SIGNIFICANCE_LEVELS = {
    HIGHLY_SIGNIFICANT: { threshold: 0.99, label: 'Highly Significant', color: 'green' },
    SIGNIFICANT: { threshold: 0.95, label: 'Significant', color: 'blue' },
    MARGINALLY_SIGNIFICANT: { threshold: 0.90, label: 'Marginally Significant', color: 'yellow' },
    NOT_SIGNIFICANT: { threshold: 0, label: 'Not Significant', color: 'gray' },
};

/**
 * Get significance level based on confidence
 */
function getSignificanceLevel(confidence: number) {
    if (confidence >= SIGNIFICANCE_LEVELS.HIGHLY_SIGNIFICANT.threshold) {
        return SIGNIFICANCE_LEVELS.HIGHLY_SIGNIFICANT;
    } else if (confidence >= SIGNIFICANCE_LEVELS.SIGNIFICANT.threshold) {
        return SIGNIFICANCE_LEVELS.SIGNIFICANT;
    } else if (confidence >= SIGNIFICANCE_LEVELS.MARGINALLY_SIGNIFICANT.threshold) {
        return SIGNIFICANCE_LEVELS.MARGINALLY_SIGNIFICANT;
    } else {
        return SIGNIFICANCE_LEVELS.NOT_SIGNIFICANT;
    }
}

/**
 * Variation Performance Card Component
 */
interface VariationCardProps {
    variation: VariationResults;
    isWinner: boolean;
    rank: number;
    totalVariations: number;
    targetMetric: keyof EngagementMetrics;
}

function VariationCard({ variation, isWinner, rank, totalVariations, targetMetric }: VariationCardProps) {
    const [showDetails, setShowDetails] = useState(false);

    const performanceScore = variation.conversionRate * 100;
    const confidenceWidth = (variation.confidenceInterval.upper - variation.confidenceInterval.lower) * 100;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: rank * 0.1 }}
            className={cn(
                'relative border rounded-lg p-4 transition-all duration-200',
                isWinner && 'border-green-500 bg-green-50 shadow-lg ring-2 ring-green-200',
                !isWinner && 'border-gray-200 hover:border-gray-300'
            )}
        >
            {/* Winner Badge */}
            {isWinner && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: 'spring' }}
                    className="absolute -top-2 -right-2"
                >
                    <Badge className="bg-green-600 text-white shadow-lg">
                        <Trophy className="h-3 w-3 mr-1" />
                        Winner
                    </Badge>
                </motion.div>
            )}

            {/* Rank Badge */}
            <div className="absolute -top-2 -left-2">
                <div className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white',
                    rank === 1 ? 'bg-yellow-500' : rank === 2 ? 'bg-gray-400' : 'bg-orange-400'
                )}>
                    {rank}
                </div>
            </div>

            {/* Variation Header */}
            <div className="mb-4 pt-2">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg">{variation.name}</h3>
                    <div className="flex items-center gap-2">
                        {isWinner && (
                            <Award className="h-4 w-4 text-green-600" />
                        )}
                        <span className="text-sm text-muted-foreground">
                            Variation {String.fromCharCode(65 + rank - 1)}
                        </span>
                    </div>
                </div>

                {/* Performance Score */}
                <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">Conversion Rate</span>
                        <span className="text-lg font-bold text-blue-600">
                            {performanceScore.toFixed(2)}%
                        </span>
                    </div>
                    <Progress
                        value={Math.min(performanceScore, 100)}
                        className="h-2"
                    />
                </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="text-center p-2 bg-white rounded border">
                    <div className="text-xs text-muted-foreground mb-1">Sample Size</div>
                    <div className="font-semibold">{variation.sampleSize.toLocaleString()}</div>
                </div>
                <div className="text-center p-2 bg-white rounded border">
                    <div className="text-xs text-muted-foreground mb-1">Conversions</div>
                    <div className="font-semibold">
                        {Math.round(variation.sampleSize * variation.conversionRate).toLocaleString()}
                    </div>
                </div>
            </div>

            {/* Confidence Interval Visualization */}
            <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Confidence Interval (95%)</span>
                    <TooltipProvider>
                        <UITooltip>
                            <TooltipTrigger>
                                <Info className="h-3 w-3 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Range where the true conversion rate likely falls</p>
                            </TooltipContent>
                        </UITooltip>
                    </TooltipProvider>
                </div>

                <div className="relative h-8 bg-gray-100 rounded">
                    {/* Confidence interval bar */}
                    <div
                        className="absolute h-full bg-blue-200 rounded"
                        style={{
                            left: `${variation.confidenceInterval.lower * 100}%`,
                            width: `${confidenceWidth}%`,
                        }}
                    />
                    {/* Point estimate */}
                    <div
                        className="absolute w-1 h-full bg-blue-600 rounded"
                        style={{
                            left: `${variation.conversionRate * 100}%`,
                        }}
                    />
                </div>

                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{(variation.confidenceInterval.lower * 100).toFixed(1)}%</span>
                    <span>{(variation.confidenceInterval.upper * 100).toFixed(1)}%</span>
                </div>
            </div>

            {/* Detailed Metrics Toggle */}
            <Collapsible open={showDetails} onOpenChange={setShowDetails}>
                <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full">
                        <span>Detailed Metrics</span>
                        {showDetails ? (
                            <ChevronUp className="h-4 w-4 ml-2" />
                        ) : (
                            <ChevronDown className="h-4 w-4 ml-2" />
                        )}
                    </Button>
                </CollapsibleTrigger>

                <CollapsibleContent className="mt-3">
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                Views
                            </span>
                            <span>{variation.metrics.views.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="flex items-center gap-1">
                                <MousePointer className="h-3 w-3" />
                                Clicks
                            </span>
                            <span>{variation.metrics.clicks.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="flex items-center gap-1">
                                <Heart className="h-3 w-3" />
                                Likes
                            </span>
                            <span>{variation.metrics.likes.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="flex items-center gap-1">
                                <Share2 className="h-3 w-3" />
                                Shares
                            </span>
                            <span>{variation.metrics.shares.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="flex items-center gap-1">
                                <MessageCircle className="h-3 w-3" />
                                Comments
                            </span>
                            <span>{variation.metrics.comments.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-medium border-t pt-2">
                            <span>Engagement Rate</span>
                            <span>{(variation.metrics.engagementRate * 100).toFixed(2)}%</span>
                        </div>
                    </div>
                </CollapsibleContent>
            </Collapsible>
        </motion.div>
    );
}

/**
 * Statistical Analysis Panel Component
 */
interface StatisticalAnalysisPanelProps {
    testResults: ABTestResults;
}

function StatisticalAnalysisPanel({ testResults }: StatisticalAnalysisPanelProps) {
    const [showAdvanced, setShowAdvanced] = useState(false);

    const significanceLevel = getSignificanceLevel(testResults.confidence);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Statistical Analysis
                </CardTitle>
                <CardDescription>
                    Detailed statistical interpretation and confidence metrics
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Statistical Significance Status */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                        {testResults.statisticalSignificance ? (
                            <CheckCircle className="h-6 w-6 text-green-600" />
                        ) : (
                            <AlertTriangle className="h-6 w-6 text-yellow-600" />
                        )}
                        <div>
                            <div className="font-semibold">
                                {testResults.statisticalSignificance ? 'Statistically Significant' : 'Not Statistically Significant'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {significanceLevel.label} ({(testResults.confidence * 100).toFixed(1)}% confidence)
                            </div>
                        </div>
                    </div>
                    <Badge
                        variant={testResults.statisticalSignificance ? 'default' : 'secondary'}
                        className={cn(
                            testResults.statisticalSignificance && 'bg-green-100 text-green-800'
                        )}
                    >
                        {significanceLevel.label}
                    </Badge>
                </div>

                {/* Confidence Level Interpretation */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                        <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                        <div className="text-sm">
                            <div className="font-medium text-blue-900 mb-1">
                                What does {(testResults.confidence * 100).toFixed(0)}% confidence mean?
                            </div>
                            <p className="text-blue-800">
                                {testResults.confidence >= 0.95
                                    ? "We can be highly confident that the observed difference is real and not due to random chance. This result is reliable for making business decisions."
                                    : testResults.confidence >= 0.90
                                        ? "There's moderate confidence in the result, but consider collecting more data for stronger evidence."
                                        : "The result is not statistically reliable. More data is needed before making decisions based on this test."
                                }
                            </p>
                        </div>
                    </div>
                </div>

                {/* P-Value and Effect Size */}
                {testResults.pValue !== undefined && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 border rounded-lg">
                            <div className="text-sm text-muted-foreground mb-1">P-Value</div>
                            <div className="text-lg font-semibold">
                                {testResults.pValue < 0.001 ? '< 0.001' : testResults.pValue.toFixed(3)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                Probability of observing this difference by chance
                            </div>
                        </div>

                        {testResults.effectSize !== undefined && (
                            <div className="p-3 border rounded-lg">
                                <div className="text-sm text-muted-foreground mb-1">Effect Size (Cohen's d)</div>
                                <div className="text-lg font-semibold">
                                    {testResults.effectSize.toFixed(3)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {testResults.effectSize < 0.2 ? 'Small effect' :
                                        testResults.effectSize < 0.5 ? 'Medium effect' : 'Large effect'}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Advanced Statistical Details */}
                <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                    <CollapsibleTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full">
                            <span>Advanced Statistical Details</span>
                            {showAdvanced ? (
                                <ChevronUp className="h-4 w-4 ml-2" />
                            ) : (
                                <ChevronDown className="h-4 w-4 ml-2" />
                            )}
                        </Button>
                    </CollapsibleTrigger>

                    <CollapsibleContent className="mt-4">
                        <div className="space-y-3 text-sm">
                            <div className="p-3 bg-gray-50 rounded border">
                                <div className="font-medium mb-2">Statistical Test Used</div>
                                <p>Welch's t-test for unequal variances, appropriate for comparing conversion rates between variations with potentially different sample sizes and variances.</p>
                            </div>

                            <div className="p-3 bg-gray-50 rounded border">
                                <div className="font-medium mb-2">Confidence Interval Calculation</div>
                                <p>95% confidence intervals calculated using normal approximation to the binomial distribution, providing the range where the true conversion rate likely falls.</p>
                            </div>

                            <div className="p-3 bg-gray-50 rounded border">
                                <div className="font-medium mb-2">Multiple Comparisons</div>
                                <p>When comparing multiple variations, consider applying Bonferroni correction to control for family-wise error rate in multiple hypothesis testing.</p>
                            </div>
                        </div>
                    </CollapsibleContent>
                </Collapsible>
            </CardContent>
        </Card>
    );
}

/**
 * Performance Comparison Chart Component
 */
interface PerformanceComparisonChartProps {
    variations: VariationResults[];
    targetMetric: keyof EngagementMetrics;
}

function PerformanceComparisonChart({ variations, targetMetric }: PerformanceComparisonChartProps) {
    const chartData = variations.map((variation, index) => ({
        name: variation.name,
        conversionRate: variation.conversionRate * 100,
        lowerBound: variation.confidenceInterval.lower * 100,
        upperBound: variation.confidenceInterval.upper * 100,
        sampleSize: variation.sampleSize,
        isWinner: variation.isWinner,
        color: variation.isWinner ? '#10b981' : '#3b82f6',
    }));

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Performance Comparison
                </CardTitle>
                <CardDescription>
                    Side-by-side comparison of conversion rates with confidence intervals
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="name"
                                tick={{ fontSize: 12 }}
                                interval={0}
                            />
                            <YAxis
                                label={{ value: 'Conversion Rate (%)', angle: -90, position: 'insideLeft' }}
                                tick={{ fontSize: 12 }}
                            />
                            <Tooltip
                                content={({ active, payload, label }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                            <div className="bg-white p-3 border rounded-lg shadow-lg">
                                                <div className="font-semibold mb-2">{label}</div>
                                                <div className="space-y-1 text-sm">
                                                    <div>Conversion Rate: {data.conversionRate.toFixed(2)}%</div>
                                                    <div>95% CI: {data.lowerBound.toFixed(2)}% - {data.upperBound.toFixed(2)}%</div>
                                                    <div>Sample Size: {data.sampleSize.toLocaleString()}</div>
                                                    {data.isWinner && (
                                                        <div className="text-green-600 font-medium">🏆 Winner</div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Bar
                                dataKey="conversionRate"
                                fill="#3b82f6"
                                radius={[4, 4, 0, 0]}
                            />
                            {/* Error bars for confidence intervals */}
                            {chartData.map((entry, index) => (
                                <ReferenceLine
                                    key={`error-${index}`}
                                    segment={[
                                        { x: index, y: entry.lowerBound },
                                        { x: index, y: entry.upperBound }
                                    ]}
                                    stroke="#666"
                                    strokeWidth={2}
                                />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * Main A/B Test Results Visualization Component
 */
export function ABTestResultsVisualization({
    testResults,
    className,
    onRefresh,
    onExport,
}: ABTestResultsVisualizationProps) {
    // Sort variations by performance (conversion rate)
    const sortedVariations = [...testResults.variations].sort(
        (a, b) => b.conversionRate - a.conversionRate
    );

    // Determine target metric (assume clicks for now, could be passed as prop)
    const targetMetric: keyof EngagementMetrics = 'clicks';

    return (
        <div className={cn('space-y-6', className)}>
            {/* Header with Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div>
                    <h2 className="text-2xl font-bold">A/B Test Results</h2>
                    <p className="text-muted-foreground">
                        Test ID: {testResults.testId} • {testResults.variations.length} variations
                    </p>
                </div>
                <div className="flex gap-2">
                    {onRefresh && (
                        <Button variant="outline" size="sm" onClick={onRefresh}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                        </Button>
                    )}
                    {onExport && (
                        <>
                            <Button variant="outline" size="sm" onClick={() => onExport('csv')}>
                                <Download className="h-4 w-4 mr-2" />
                                Export CSV
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => onExport('pdf')}>
                                <Download className="h-4 w-4 mr-2" />
                                Export PDF
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Recommendation Alert */}
            {testResults.recommendedAction && (
                <Alert>
                    <Lightbulb className="h-4 w-4" />
                    <AlertDescription>
                        <strong>Recommendation:</strong> {testResults.recommendedAction}
                    </AlertDescription>
                </Alert>
            )}

            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="comparison">Comparison</TabsTrigger>
                    <TabsTrigger value="statistics">Statistics</TabsTrigger>
                </TabsList>

                {/* Overview Tab - Side-by-side variation cards */}
                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sortedVariations.map((variation, index) => (
                            <VariationCard
                                key={variation.variationId}
                                variation={variation}
                                isWinner={variation.isWinner}
                                rank={index + 1}
                                totalVariations={testResults.variations.length}
                                targetMetric={targetMetric}
                            />
                        ))}
                    </div>
                </TabsContent>

                {/* Comparison Tab - Charts and visual comparisons */}
                <TabsContent value="comparison" className="space-y-6">
                    <PerformanceComparisonChart
                        variations={sortedVariations}
                        targetMetric={targetMetric}
                    />
                </TabsContent>

                {/* Statistics Tab - Detailed statistical analysis */}
                <TabsContent value="statistics" className="space-y-6">
                    <StatisticalAnalysisPanel testResults={testResults} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default ABTestResultsVisualization;