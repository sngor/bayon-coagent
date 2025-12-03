# Analytics Dashboards - Quick Start Guide

Get started with the AgentStrands analytics dashboards in 5 minutes.

## Installation

The analytics components are already integrated into the project. No additional installation needed.

## Basic Usage

### 1. Import the Components

```typescript
import { AnalyticsOverview } from "@/components/analytics";
```

### 2. Set Up Data Fetching

```typescript
import { createPerformanceTracker } from "@/aws/bedrock/analytics/performance-tracker";
import { createCostMonitor } from "@/aws/bedrock/analytics/cost-monitor";
import { createROITracker } from "@/aws/bedrock/analytics/roi-tracker";

const performanceTracker = createPerformanceTracker();
const costMonitor = createCostMonitor();
const roiTracker = createROITracker();
```

### 3. Create Fetch Functions

```typescript
const fetchPerformance = async (timeframe: string) => {
  const endDate = new Date();
  const startDate = calculateStartDate(endDate, timeframe);

  return await performanceTracker.getAnalytics({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  });
};

const fetchCosts = async (timeframe: string) => {
  return await costMonitor.calculateCosts("user", timeframe);
};

const fetchROI = async (timeframe: string) => {
  const endDate = new Date();
  const startDate = calculateStartDate(endDate, timeframe);

  return await roiTracker.generateReport({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  });
};
```

### 4. Render the Dashboard

```typescript
export default function AnalyticsPage() {
  return (
    <AnalyticsOverview
      isAdmin={true}
      onFetchPerformance={fetchPerformance}
      onFetchCosts={fetchCosts}
      onFetchROI={fetchROI}
    />
  );
}
```

## Helper Function

```typescript
function calculateStartDate(endDate: Date, timeframe: string): Date {
  const match = timeframe.match(/^(\d+)([hdwmy])$/);
  if (!match) throw new Error(`Invalid timeframe: ${timeframe}`);

  const [, amount, unit] = match;
  const value = parseInt(amount, 10);
  const startDate = new Date(endDate);

  switch (unit) {
    case "h":
      startDate.setHours(startDate.getHours() - value);
      break;
    case "d":
      startDate.setDate(startDate.getDate() - value);
      break;
    case "w":
      startDate.setDate(startDate.getDate() - value * 7);
      break;
    case "m":
      startDate.setMonth(startDate.getMonth() - value);
      break;
    case "y":
      startDate.setFullYear(startDate.getFullYear() - value);
      break;
  }

  return startDate;
}
```

## Complete Example

```typescript
"use client";

import { AnalyticsOverview } from "@/components/analytics";
import { createPerformanceTracker } from "@/aws/bedrock/analytics/performance-tracker";
import { createCostMonitor } from "@/aws/bedrock/analytics/cost-monitor";
import { createROITracker } from "@/aws/bedrock/analytics/roi-tracker";

export default function AnalyticsPage() {
  const performanceTracker = createPerformanceTracker();
  const costMonitor = createCostMonitor();
  const roiTracker = createROITracker();

  const fetchPerformance = async (timeframe: string) => {
    const endDate = new Date();
    const startDate = calculateStartDate(endDate, timeframe);

    try {
      return await performanceTracker.getAnalytics({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
    } catch (error) {
      console.error("Error fetching performance:", error);
      return createEmptyPerformanceAnalytics();
    }
  };

  const fetchCosts = async (timeframe: string) => {
    try {
      return await costMonitor.calculateCosts("user", timeframe);
    } catch (error) {
      console.error("Error fetching costs:", error);
      return createEmptyCostBreakdown(timeframe);
    }
  };

  const fetchROI = async (timeframe: string) => {
    const endDate = new Date();
    const startDate = calculateStartDate(endDate, timeframe);

    try {
      return await roiTracker.generateReport({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
    } catch (error) {
      console.error("Error fetching ROI:", error);
      return createEmptyROIReport(timeframe);
    }
  };

  const generateReport = async (type, timeframe) => {
    const endDate = new Date();
    const startDate = calculateStartDate(endDate, timeframe);

    const report = await performanceTracker.generateReport(type, {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    // Download as JSON
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type}-${timeframe}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto py-8">
      <AnalyticsOverview
        isAdmin={true}
        onFetchPerformance={fetchPerformance}
        onFetchCosts={fetchCosts}
        onFetchROI={fetchROI}
        onGenerateReport={generateReport}
      />
    </div>
  );
}

// Helper functions
function calculateStartDate(endDate: Date, timeframe: string): Date {
  // ... (implementation from above)
}

function createEmptyPerformanceAnalytics() {
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

function createEmptyCostBreakdown(timeframe: string) {
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

function createEmptyROIReport(timeframe: string) {
  const endDate = new Date();
  const startDate = calculateStartDate(endDate, timeframe);

  return {
    id: `roi-report-${Date.now()}`,
    title: "ROI Performance Report",
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
```

## Features Overview

### Time Range Selection

- 24 hours
- 7 days
- 30 days
- 90 days

### Auto-Refresh

- Toggle on/off
- 30-second intervals
- Real-time data updates

### Tabs

1. **Performance** - Execution metrics, anomalies
2. **Costs** - Cost breakdown, alerts, optimizations
3. **ROI** - Return on investment, content performance
4. **Reports** - Generate downloadable reports

### Report Types

- Daily Summary
- Weekly Summary
- Monthly Summary
- Cost Analysis
- Quality Trends
- User Satisfaction
- Bottleneck Analysis
- Strand Performance

## Next Steps

1. **Customize the UI** - Modify components to match your brand
2. **Add Charts** - Integrate charting library for visualizations
3. **Set Up Alerts** - Configure cost and performance thresholds
4. **Enable Real-Time** - Add WebSocket for live updates
5. **Export Options** - Add PDF and CSV export capabilities

## Troubleshooting

### No Data Showing

- Check that trackers are properly initialized
- Verify DynamoDB table exists and has data
- Check console for error messages
- Ensure proper AWS credentials

### Slow Loading

- Reduce time range
- Disable auto-refresh
- Check network connection
- Optimize database queries

### TypeScript Errors

- Ensure all types are imported from `@/aws/bedrock/analytics/types`
- Check that tracker functions return correct types
- Verify callback function signatures

## Support

- See `README.md` for detailed documentation
- Check `TASK_36_COMPLETION.md` for implementation details
- Review design spec: `.kiro/specs/agentstrands-enhancement/design.md`
