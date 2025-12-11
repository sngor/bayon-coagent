'use client';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

import { AnalyticsOverview } from '@/components/analytics/analytics-overview';
import { createPerformanceTracker } from '@/aws/bedrock/analytics/performance-tracker';
import { createCostMonitor } from '@/aws/bedrock/analytics/cost-monitor';
import { createROITracker } from '@/aws/bedrock/analytics/roi-tracker';
import type {
    PerformanceAnalytics,
    CostBreakdown,
    ROIReport,
    Anomaly,
    CostAlert,
    CostOptimization,
    ReportType,
    AnalyticsFilters,
    ROIFilters,
} from '@/aws/bedrock/analytics/types';

export default function AdminAnalyticsPage() {
    // Initialize trackers
    const performanceTracker = createPerformanceTracker();
    const costMonitor = createCostMonitor();
    const roiTracker = createROITracker();

    // Fetch performance analytics
    const fetchPerformance = async (timeframe: string): Promise<PerformanceAnalytics> => {
        const endDate = new Date();
        const startDate = calculateStartDate(endDate, timeframe);

        const filters: AnalyticsFilters = {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
        };

        try {
            return await performanceTracker.getAnalytics(filters);
        } catch (error) {
            console.error('Error fetching performance analytics:', error);
            return createEmptyPerformanceAnalytics();
        }
    };

    // Fetch cost breakdown
    const fetchCosts = async (timeframe: string): Promise<CostBreakdown> => {
        try {
            return await costMonitor.calculateCosts('user', timeframe);
        } catch (error) {
            console.error('Error fetching cost breakdown:', error);
            return createEmptyCostBreakdown(timeframe);
        }
    };

    // Fetch ROI report
    const fetchROI = async (timeframe: string): Promise<ROIReport> => {
        const endDate = new Date();
        const startDate = calculateStartDate(endDate, timeframe);

        const filters: ROIFilters = {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
        };

        try {
            return await roiTracker.generateReport(filters);
        } catch (error) {
            console.error('Error fetching ROI report:', error);
            return createEmptyROIReport(timeframe);
        }
    };

    // Fetch anomalies
    const fetchAnomalies = async (timeframe: string): Promise<Anomaly[]> => {
        try {
            // In a real implementation, this would query all strands
            // For now, return empty array
            return [];
        } catch (error) {
            console.error('Error fetching anomalies:', error);
            return [];
        }
    };

    // Fetch cost alerts
    const fetchAlerts = async (timeframe: string): Promise<CostAlert[]> => {
        try {
            // In a real implementation, this would query active alerts
            // For now, return empty array
            return [];
        } catch (error) {
            console.error('Error fetching alerts:', error);
            return [];
        }
    };

    // Fetch optimization suggestions
    const fetchOptimizations = async (): Promise<CostOptimization[]> => {
        try {
            return await costMonitor.suggestOptimizations();
        } catch (error) {
            console.error('Error fetching optimizations:', error);
            return [];
        }
    };

    // Generate report
    const generateReport = async (type: ReportType, timeframe: string): Promise<void> => {
        const endDate = new Date();
        const startDate = calculateStartDate(endDate, timeframe);

        const filters: AnalyticsFilters = {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
        };

        try {
            const report = await performanceTracker.generateReport(type, filters);

            // In a real implementation, this would download or display the report
            console.log('Generated report:', report);

            // Create a downloadable JSON file
            const blob = new Blob([JSON.stringify(report, null, 2)], {
                type: 'application/json',
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${type}-${timeframe}-${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error generating report:', error);
        }
    };

    return (
        <div className="space-y-6">
            <AnalyticsOverview
                isAdmin={true}
                onFetchPerformance={fetchPerformance}
                onFetchCosts={fetchCosts}
                onFetchROI={fetchROI}
                onFetchAnomalies={fetchAnomalies}
                onFetchAlerts={fetchAlerts}
                onFetchOptimizations={fetchOptimizations}
                onGenerateReport={generateReport}
            />
        </div>
    );
}

// Helper functions

function calculateStartDate(endDate: Date, timeframe: string): Date {
    const match = timeframe.match(/^(\d+)([hdwmy])$/);
    if (!match) {
        throw new Error(`Invalid timeframe format: ${timeframe}`);
    }

    const [, amount, unit] = match;
    const value = parseInt(amount, 10);
    const startDate = new Date(endDate);

    switch (unit) {
        case 'h':
            startDate.setHours(startDate.getHours() - value);
            break;
        case 'd':
            startDate.setDate(startDate.getDate() - value);
            break;
        case 'w':
            startDate.setDate(startDate.getDate() - value * 7);
            break;
        case 'm':
            startDate.setMonth(startDate.getMonth() - value);
            break;
        case 'y':
            startDate.setFullYear(startDate.getFullYear() - value);
            break;
    }

    return startDate;
}

function createEmptyPerformanceAnalytics(): PerformanceAnalytics {
    return {
        totalTasks: 0,
        avgExecutionTime: 0,
        totalTokens: 0,
        totalCost: 0,
        successRate: 0,
        avgSatisfaction: 0,
        avgQualityScore: 0,
        byStrand: {},
        byTaskType: {},
        timeSeries: [],
    };
}

function createEmptyCostBreakdown(timeframe: string): CostBreakdown {
    const endDate = new Date();
    const startDate = calculateStartDate(endDate, timeframe);

    return {
        total: 0,
        breakdown: {},
        period: {
            start: startDate.toISOString(),
            end: endDate.toISOString(),
        },
        topDrivers: [],
    };
}

function createEmptyROIReport(timeframe: string): ROIReport {
    const endDate = new Date();
    const startDate = calculateStartDate(endDate, timeframe);

    return {
        id: `roi-report-${Date.now()}`,
        title: 'ROI Performance Report',
        period: {
            start: startDate.toISOString(),
            end: endDate.toISOString(),
        },
        totalInvestment: 0,
        totalReturn: 0,
        overallROI: 0,
        byContentType: {},
        byStrand: {},
        topPerformers: [],
        bottomPerformers: [],
        insights: [],
        recommendations: [],
        generatedAt: new Date().toISOString(),
    };
}
