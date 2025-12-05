/**
 * DynamicChart - Lazy-loaded chart component wrapper
 * 
 * Dynamically imports recharts components to reduce initial bundle size.
 * Use this wrapper for any component that uses recharts.
 * 
 * Requirements: 2.4, 3.3 - Code splitting and lazy loading
 */

import dynamic from 'next/dynamic';
import { StandardLoadingState } from '@/components/standard';

/**
 * Dynamic import for chart components with loading fallback
 */
export function createDynamicChart<T extends Record<string, any>>(
    importFn: () => Promise<{ default: React.ComponentType<T> }>,
    options?: {
        ssr?: boolean;
        loading?: React.ComponentType;
    }
) {
    return dynamic(importFn, {
        loading: options?.loading || (() => (
            <div className="h-64 w-full">
                <StandardLoadingState variant="skeleton" />
            </div>
        )),
        ssr: options?.ssr ?? false, // Charts typically don't need SSR
    });
}

/**
 * Preset: Analytics Dashboard
 */
export const DynamicAnalyticsDashboard = createDynamicChart(
    () => import('@/components/analytics-dashboard').then(mod => ({ default: mod.AnalyticsDashboard }))
);

/**
 * Preset: AEO Score History Chart
 */
export const DynamicAEOScoreHistoryChart = createDynamicChart(
    () => import('@/components/aeo/aeo-score-history-chart').then(mod => ({ default: mod.AEOScoreHistoryChart }))
);

/**
 * Preset: Market Future Cast Chart
 */
export const DynamicFutureCastChart = createDynamicChart(
    () => import('@/components/market/future-cast-chart').then(mod => ({ default: mod.FutureCastChart }))
);

/**
 * Preset: AI Visibility Trends
 */
export const DynamicAIVisibilityTrends = createDynamicChart(
    () => import('@/components/ai-visibility-trends').then(mod => ({ default: mod.AIVisibilityTrends }))
);

/**
 * Preset: Open House Comparison View
 */
export const DynamicOpenHouseComparison = createDynamicChart(
    () => import('@/components/open-house/comparison-view').then(mod => ({ default: mod.ComparisonView }))
);

/**
 * Preset: Open House Interest Level Chart
 */
export const DynamicInterestLevelChart = createDynamicChart(
    () => import('@/components/open-house/interest-level-chart').then(mod => ({ default: mod.InterestLevelChart }))
);

/**
 * Preset: Open House Timeline Chart
 */
export const DynamicTimelineChart = createDynamicChart(
    () => import('@/components/open-house/timeline-chart').then(mod => ({ default: mod.TimelineChart }))
);
