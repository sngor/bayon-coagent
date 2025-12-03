# Analytics Dashboard Components

Comprehensive analytics dashboards for the AgentStrands enhancement system, providing real-time metrics, performance tracking, cost monitoring, ROI analysis, and report generation.

## Components

### AnalyticsOverview

Main analytics dashboard that combines all analytics views with tabbed navigation.

**Features:**

- Unified interface for all analytics
- Time range selection (24h, 7d, 30d, 90d)
- Auto-refresh capability
- Quick stats summary
- Critical issues banner
- Report generation

**Usage:**

```typescript
import { AnalyticsOverview } from "@/components/analytics";

<AnalyticsOverview
  isAdmin={true}
  onFetchPerformance={fetchPerformance}
  onFetchCosts={fetchCosts}
  onFetchROI={fetchROI}
  onFetchAnomalies={fetchAnomalies}
  onFetchAlerts={fetchAlerts}
  onFetchOptimizations={fetchOptimizations}
  onGenerateReport={generateReport}
/>;
```

### PerformanceDashboard

Displays real-time performance metrics for strand executions.

**Metrics:**

- Total tasks executed
- Average execution time
- Success rate
- Quality scores
- User satisfaction
- Performance by strand
- Performance by task type

**Features:**

- Anomaly detection and alerts
- Real-time updates
- Trend indicators
- Color-coded severity levels

**Usage:**

```typescript
import { PerformanceDashboard } from "@/components/analytics";

<PerformanceDashboard
  analytics={performanceData}
  anomalies={anomalies}
  loading={false}
  refreshInterval={30000}
  onRefresh={handleRefresh}
/>;
```

### CostDashboard

Monitors AI operation costs with breakdown and optimization suggestions.

**Features:**

- Total cost tracking
- Budget monitoring
- Cost breakdown by dimension
- Top cost drivers
- Active alerts
- Optimization suggestions

**Usage:**

```typescript
import { CostDashboard } from "@/components/analytics";

<CostDashboard
  breakdown={costBreakdown}
  alerts={costAlerts}
  optimizations={optimizations}
  loading={false}
  budgetLimit={1000}
/>;
```

### ROIDashboard

Tracks business outcomes and calculates ROI for content.

**Features:**

- Overall ROI calculation
- Investment vs. return tracking
- Top/bottom performers
- ROI by content type
- Business insights
- Recommendations

**Usage:**

```typescript
import { ROIDashboard } from "@/components/analytics";

<ROIDashboard report={roiReport} loading={false} />;
```

## Data Types

All components use types from `@/aws/bedrock/analytics/types`:

- `PerformanceAnalytics` - Aggregated performance metrics
- `CostBreakdown` - Cost analysis by dimension
- `ROIReport` - ROI calculations and insights
- `Anomaly` - Performance anomaly details
- `CostAlert` - Cost threshold alerts
- `CostOptimization` - Cost saving suggestions

## Integration

### With Analytics Trackers

```typescript
import { createPerformanceTracker } from "@/aws/bedrock/analytics/performance-tracker";
import { createCostMonitor } from "@/aws/bedrock/analytics/cost-monitor";
import { createROITracker } from "@/aws/bedrock/analytics/roi-tracker";

const performanceTracker = createPerformanceTracker();
const costMonitor = createCostMonitor();
const roiTracker = createROITracker();

// Fetch data
const analytics = await performanceTracker.getAnalytics(filters);
const costs = await costMonitor.calculateCosts("user", "7d");
const roi = await roiTracker.generateReport(filters);
```

### Report Generation

```typescript
const generateReport = async (type: ReportType, timeframe: string) => {
  const report = await performanceTracker.generateReport(type, filters);

  // Download as JSON
  const blob = new Blob([JSON.stringify(report, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${type}-${timeframe}.json`;
  a.click();
};
```

## Styling

All components use:

- Tailwind CSS for styling
- shadcn/ui components (Card, Badge, Progress, etc.)
- Lucide React icons
- Responsive design (mobile-first)
- Dark mode support

## Performance

- Efficient rendering with conditional updates
- Memoized calculations
- Lazy loading of heavy components
- Optimized data structures
- Auto-refresh with configurable intervals

## Accessibility

- Semantic HTML
- ARIA labels
- Keyboard navigation
- Screen reader support
- Color contrast compliance

## Examples

### Admin Dashboard

```typescript
// src/app/(app)/super-admin/analytics/page.tsx
export default function AdminAnalyticsPage() {
  return (
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
  );
}
```

### User Dashboard

```typescript
// src/app/(app)/dashboard/analytics/page.tsx
export default function UserAnalyticsPage() {
  const { user } = useUser();

  return (
    <AnalyticsOverview
      userId={user.id}
      isAdmin={false}
      onFetchPerformance={fetchUserPerformance}
      onFetchCosts={fetchUserCosts}
      onFetchROI={fetchUserROI}
    />
  );
}
```

## Testing

### Unit Tests

```typescript
import { render, screen } from "@testing-library/react";
import { PerformanceDashboard } from "./performance-dashboard";

test("displays performance metrics", () => {
  const analytics = {
    totalTasks: 100,
    avgExecutionTime: 2000,
    successRate: 0.95,
    // ...
  };

  render(<PerformanceDashboard analytics={analytics} />);

  expect(screen.getByText("100")).toBeInTheDocument();
  expect(screen.getByText("2.00s")).toBeInTheDocument();
  expect(screen.getByText("95.0%")).toBeInTheDocument();
});
```

### Integration Tests

```typescript
test("fetches and displays analytics data", async () => {
  const fetchPerformance = jest.fn().mockResolvedValue(mockAnalytics);

  render(<AnalyticsOverview onFetchPerformance={fetchPerformance} />);

  await waitFor(() => {
    expect(fetchPerformance).toHaveBeenCalled();
    expect(screen.getByText("100")).toBeInTheDocument();
  });
});
```

## Future Enhancements

1. **Interactive Charts**

   - Time series visualizations
   - Trend graphs
   - Comparative charts

2. **Advanced Filtering**

   - Multi-dimensional filters
   - Custom date ranges
   - Saved presets

3. **Export Options**

   - PDF reports
   - CSV exports
   - Excel spreadsheets

4. **Real-Time Streaming**

   - WebSocket integration
   - Live updates
   - Push notifications

5. **Predictive Analytics**
   - Cost forecasting
   - Performance predictions
   - Trend projections

## Support

For issues or questions:

1. Check the completion document: `TASK_36_COMPLETION.md`
2. Review the design spec: `.kiro/specs/agentstrands-enhancement/design.md`
3. Consult the analytics types: `src/aws/bedrock/analytics/types.ts`
