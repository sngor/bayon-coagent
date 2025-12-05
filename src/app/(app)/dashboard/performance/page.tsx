/**
 * Performance Monitoring Dashboard
 * 
 * Displays real-time Core Web Vitals, bundle size trends,
 * and Lighthouse scores for performance monitoring.
 */

import { Metadata } from 'next';
import { PerformanceDashboard } from '@/components/performance-dashboard';
import { BundleSizeTrends } from '@/components/bundle-size-trends';
import { LighthouseScores } from '@/components/lighthouse-scores';
import { PageHeader } from '@/components/ui/page-header';
import { Activity } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Performance Monitoring',
    description: 'Monitor Core Web Vitals, bundle sizes, and Lighthouse scores',
};

export default function PerformanceMonitoringPage() {
    return (
        <div className="container mx-auto py-6 space-y-6">
            <PageHeader
                title="Performance Monitoring"
                description="Real-time performance metrics and trends"
                icon={Activity}
                variant="default"
            />

            <div className="space-y-6">
                {/* Core Web Vitals */}
                <PerformanceDashboard />

                {/* Bundle Size Trends */}
                <BundleSizeTrends />

                {/* Lighthouse Scores */}
                <LighthouseScores />
            </div>
        </div>
    );
}
