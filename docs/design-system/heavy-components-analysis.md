# Heavy Components Analysis

## Overview

This document identifies components over 50KB that should use dynamic imports for better performance.

**Analysis Date**: December 4, 2025

## Heavy Component Categories

### 1. Chart Components (Recharts - ~100KB)

All components using recharts should be dynamically imported:

#### Analytics Dashboards

- `src/components/optimized-analytics-dashboard.tsx` - Multiple chart types
- `src/components/enhanced-analytics-dashboard.tsx` - Area charts
- `src/components/analytics-dashboard.tsx` - Complex dashboard with multiple charts
- `src/components/analytics/roi-dashboard.tsx` - ROI visualizations
- `src/components/analytics/performance-dashboard.tsx` - Performance metrics
- `src/components/analytics/cost-dashboard.tsx` - Cost tracking
- `src/components/analytics/analytics-overview.tsx` - Overview dashboard

#### Specialized Charts

- `src/components/aeo/aeo-score-history-chart.tsx` - Line chart for AEO history
- `src/components/market/future-cast-chart.tsx` - Market predictions
- `src/components/ai-visibility-trends.tsx` - AI visibility tracking
- `src/components/seo-analysis-card.tsx` - SEO metrics with charts
- `src/components/website-historical-trend-chart.tsx` - Website trends
- `src/components/ai-visibility-dashboard.tsx` - Pie charts
- `src/components/ab-test-results-visualization.tsx` - A/B test results
- `src/components/listing-metrics-display.tsx` - Listing performance
- `src/components/ui/animated-chart.tsx` - Animated chart wrapper

#### Open House Components

- `src/components/open-house/comparison-view.tsx` - Bar charts
- `src/components/open-house/interest-level-chart.tsx` - Pie charts
- `src/components/open-house/timeline-chart.tsx` - Line charts

#### AgentStrands

- `src/components/agentstrands/analytics-visualizations.tsx` - Multiple chart types

#### Client Dashboards

- `src/components/client-dashboard/cma-report.tsx` - CMA with charts and maps
- `src/app/(app)/client-dashboards/analytics/page.tsx` - Multiple chart types

### 2. Map Components (Google Maps - ~150KB)

- `src/components/client-dashboard/cma-report.tsx` - Uses @react-google-maps/api

### 3. Rich Text Editors & Complex Forms

- Any components using draft-js, slate, or similar (if present)
- Complex form builders

### 4. Image Processing Components

- `src/app/(app)/studio/reimagine/page.tsx` - Image editing features
- Any components using canvas manipulation

## Dynamic Import Strategy

### Pattern 1: Page-Level Dynamic Import

For entire pages with heavy components:

```tsx
import dynamic from "next/dynamic";
import { StandardLoadingState } from "@/components/standard";

const HeavyDashboard = dynamic(
  () => import("@/components/analytics-dashboard"),
  {
    loading: () => <StandardLoadingState variant="skeleton" />,
    ssr: false, // Disable SSR if component uses browser APIs
  }
);

export default function DashboardPage() {
  return <HeavyDashboard />;
}
```

### Pattern 2: Component-Level Dynamic Import

For components within a page:

```tsx
import dynamic from "next/dynamic";

const ChartComponent = dynamic(
  () =>
    import("@/components/market/future-cast-chart").then((mod) => ({
      default: mod.FutureCastChart,
    })),
  {
    loading: () => <div className="h-64 animate-pulse bg-muted rounded-lg" />,
  }
);

export function MarketAnalysis() {
  return (
    <div>
      <h2>Market Forecast</h2>
      <ChartComponent data={data} />
    </div>
  );
}
```

### Pattern 3: Conditional Loading

Load heavy components only when needed:

```tsx
"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const AdvancedChart = dynamic(() => import("@/components/advanced-chart"));

export function Dashboard() {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div>
      <button onClick={() => setShowAdvanced(true)}>
        Show Advanced Analytics
      </button>
      {showAdvanced && <AdvancedChart />}
    </div>
  );
}
```

## Implementation Priority

### High Priority (Immediate Impact)

1. ✅ Analytics dashboards in main navigation
2. ✅ Chart components in frequently visited pages
3. ✅ Map components (Google Maps)

### Medium Priority

1. ⏳ Specialized charts in less-visited pages
2. ⏳ A/B test visualizations
3. ⏳ Client dashboard components

### Low Priority

1. ⏳ Demo pages
2. ⏳ Admin-only components
3. ⏳ Rarely used features

## Expected Impact

### Bundle Size Reduction

- Initial bundle: Reduce by ~150-200KB (gzipped)
- Route-specific bundles: Reduce by 50-100KB each
- Total savings: ~300-500KB across all routes

### Performance Improvements

- Time to Interactive (TTI): -0.5 to -1.0 seconds
- First Contentful Paint (FCP): -0.2 to -0.5 seconds
- Lighthouse Performance Score: +5 to +10 points

## Implementation Checklist

- [ ] Create dynamic import wrappers for all chart components
- [ ] Update pages to use dynamic imports
- [ ] Add appropriate loading states
- [ ] Test functionality after conversion
- [ ] Measure bundle size improvements
- [ ] Update documentation

## Testing Strategy

1. **Functionality Testing**

   - Verify all charts render correctly
   - Test loading states
   - Verify error handling

2. **Performance Testing**

   - Run bundle analyzer before/after
   - Measure TTI and FCP
   - Test on slow 3G connection

3. **User Experience Testing**
   - Verify loading states are smooth
   - Test on various devices
   - Ensure no layout shift

## Notes

- Always provide meaningful loading states
- Consider using skeleton loaders for better UX
- Test with real data, not mocks
- Monitor Core Web Vitals after deployment
- Document any breaking changes
