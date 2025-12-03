'use client';

/**
 * ROI Dashboard Component
 * 
 * Displays ROI analytics including content performance, revenue tracking,
 * and business outcome correlation.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Target,
    Eye,
    MousePointer,
    Share2,
    Users,
    Award,
    AlertCircle,
} from 'lucide-react';
import type {
    ROIReport,
    ContentPerformance,
    ROICalculation,
} from '@/aws/bedrock/analytics/types';

interface ROIDashboardProps {
    /** ROI report data */
    report: ROIReport;
    /** Whether data is loading */
    loading?: boolean;
}

export function ROIDashboard({ report, loading = false }: ROIDashboardProps) {
    const roiColor =
        report.overallROI > 100
            ? 'text-green-600'
            : report.overallROI > 50
                ? 'text-blue-600'
                : report.overallROI > 0
                    ? 'text-orange-600'
                    : 'text-red-600';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold">ROI Dashboard</h2>
                <p className="text-sm text-muted-foreground">
                    {new Date(report.period.start).toLocaleDateString()} -{' '}
                    {new Date(report.period.end).toLocaleDateString()}
                </p>
            </div>

            {/* Overall ROI Card */}
            <Card className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20" />
                <CardHeader className="relative">
                    <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Overall ROI
                    </CardTitle>
                    <CardDescription>Return on investment across all content</CardDescription>
                </CardHeader>
                <CardContent className="relative">
                    <div className={`text-5xl font-bold ${roiColor}`}>
                        {loading ? '...' : `${report.overallROI.toFixed(0)}%`}
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-6">
                        <div>
                            <div className="text-sm text-muted-foreground">Total Investment</div>
                            <div className="text-2xl font-bold">
                                ${report.totalInvestment.toFixed(2)}
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground">Total Return</div>
                            <div className="text-2xl font-bold text-green-600">
                                ${report.totalReturn.toFixed(2)}
                            </div>
                        </div>
                    </div>
                    <div className="mt-4">
                        <div className="text-sm text-muted-foreground mb-2">
                            Net Profit: $
                            {(report.totalReturn - report.totalInvestment).toFixed(2)}
                        </div>
                        <Progress
                            value={Math.min(100, (report.totalReturn / report.totalInvestment) * 100)}
                            className="h-3"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Key Insights */}
            {report.insights.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Award className="h-5 w-5 text-blue-600" />
                            Key Insights
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {report.insights.map((insight, i) => (
                                <li key={i} className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2" />
                                    <span className="text-sm">{insight}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}

            {/* Top Performers */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                        Top Performing Content
                    </CardTitle>
                    <CardDescription>
                        Highest ROI content in this period
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {report.topPerformers.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                No performance data available
                            </p>
                        ) : (
                            report.topPerformers.slice(0, 5).map((content) => (
                                <ContentPerformanceCard
                                    key={content.contentId}
                                    content={content}
                                    variant="success"
                                />
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Bottom Performers */}
            {report.bottomPerformers.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingDown className="h-5 w-5 text-orange-600" />
                            Underperforming Content
                        </CardTitle>
                        <CardDescription>
                            Content that needs optimization
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {report.bottomPerformers.slice(0, 5).map((content) => (
                                <ContentPerformanceCard
                                    key={content.contentId}
                                    content={content}
                                    variant="warning"
                                />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ROI by Content Type */}
            <Card>
                <CardHeader>
                    <CardTitle>ROI by Content Type</CardTitle>
                    <CardDescription>
                        Performance breakdown by content category
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {Object.entries(report.byContentType).length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                No content type data available
                            </p>
                        ) : (
                            Object.entries(report.byContentType).map(([type, calc]) => (
                                <ROICalculationRow key={type} type={type} calculation={calc} />
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Recommendations */}
            {report.recommendations.length > 0 && (
                <Card className="border-blue-200 dark:border-blue-900">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-blue-600">
                            <AlertCircle className="h-5 w-5" />
                            Recommendations
                        </CardTitle>
                        <CardDescription>
                            Actions to improve ROI performance
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3">
                            {report.recommendations.map((rec, i) => (
                                <li key={i} className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                                        {i + 1}
                                    </div>
                                    <span className="text-sm">{rec}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

/**
 * Content performance card component
 */
function ContentPerformanceCard({
    content,
    variant,
}: {
    content: ContentPerformance;
    variant: 'success' | 'warning';
}) {
    const roiColor =
        content.roi > 100
            ? 'text-green-600'
            : content.roi > 50
                ? 'text-blue-600'
                : content.roi > 0
                    ? 'text-orange-600'
                    : 'text-red-600';

    return (
        <div className="p-4 rounded-lg border space-y-3">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <Badge variant="outline">{content.contentType}</Badge>
                        <span className="text-xs text-muted-foreground">
                            {content.contentId.slice(0, 8)}
                        </span>
                    </div>
                </div>
                <div className="text-right">
                    <div className={`text-2xl font-bold ${roiColor}`}>
                        {content.roi.toFixed(0)}%
                    </div>
                    <div className="text-xs text-muted-foreground">ROI</div>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-3 text-sm">
                <div>
                    <div className="flex items-center gap-1 text-muted-foreground mb-1">
                        <Eye className="h-3 w-3" />
                        <span>Views</span>
                    </div>
                    <div className="font-medium">{content.views.toLocaleString()}</div>
                </div>
                <div>
                    <div className="flex items-center gap-1 text-muted-foreground mb-1">
                        <MousePointer className="h-3 w-3" />
                        <span>Clicks</span>
                    </div>
                    <div className="font-medium">{content.clicks.toLocaleString()}</div>
                </div>
                <div>
                    <div className="flex items-center gap-1 text-muted-foreground mb-1">
                        <Users className="h-3 w-3" />
                        <span>Leads</span>
                    </div>
                    <div className="font-medium">{content.leads.toLocaleString()}</div>
                </div>
                <div>
                    <div className="flex items-center gap-1 text-muted-foreground mb-1">
                        <DollarSign className="h-3 w-3" />
                        <span>Revenue</span>
                    </div>
                    <div className="font-medium text-green-600">
                        ${content.revenue.toFixed(0)}
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Cost: ${content.totalCost.toFixed(2)}</span>
                <span>
                    Conversion: {content.views > 0 ? ((content.conversions / content.views) * 100).toFixed(1) : 0}%
                </span>
            </div>
        </div>
    );
}

/**
 * ROI calculation row component
 */
function ROICalculationRow({
    type,
    calculation,
}: {
    type: string;
    calculation: ROICalculation;
}) {
    const roiColor =
        calculation.roiPercentage > 100
            ? 'text-green-600'
            : calculation.roiPercentage > 50
                ? 'text-blue-600'
                : calculation.roiPercentage > 0
                    ? 'text-orange-600'
                    : 'text-red-600';

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-purple-600" />
                    <span className="font-medium">{type}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                    <div className="text-right">
                        <div className="text-muted-foreground">Investment</div>
                        <div className="font-medium">${calculation.investment.toFixed(2)}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-muted-foreground">Return</div>
                        <div className="font-medium text-green-600">
                            ${calculation.return.toFixed(2)}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-muted-foreground">ROI</div>
                        <div className={`font-bold ${roiColor}`}>
                            {calculation.roiPercentage.toFixed(0)}%
                        </div>
                    </div>
                </div>
            </div>
            <Progress
                value={Math.min(100, (calculation.return / calculation.investment) * 100)}
                className="h-2"
            />
        </div>
    );
}
