/**
 * Web Vitals Tracking
 * 
 * This module tracks Core Web Vitals metrics and sends them to analytics.
 * 
 * Core Web Vitals:
 * - LCP (Largest Contentful Paint): Measures loading performance
 * - FID (First Input Delay): Measures interactivity
 * - CLS (Cumulative Layout Shift): Measures visual stability
 * - FCP (First Contentful Paint): Measures perceived load speed
 * - TTFB (Time to First Byte): Measures server response time
 * - INP (Interaction to Next Paint): Measures responsiveness
 * 
 * @see https://web.dev/vitals/
 */

import { onCLS, onFCP, onFID, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';

// Thresholds for Core Web Vitals (in milliseconds or score)
export const WEB_VITALS_THRESHOLDS = {
    LCP: { good: 2500, needsImprovement: 4000 },
    FID: { good: 100, needsImprovement: 300 },
    CLS: { good: 0.1, needsImprovement: 0.25 },
    FCP: { good: 1800, needsImprovement: 3000 },
    TTFB: { good: 800, needsImprovement: 1800 },
    INP: { good: 200, needsImprovement: 500 },
} as const;

export type WebVitalMetricName = 'CLS' | 'FCP' | 'FID' | 'INP' | 'LCP' | 'TTFB';

export interface WebVitalMetric {
    name: WebVitalMetricName;
    value: number;
    rating: 'good' | 'needs-improvement' | 'poor';
    delta: number;
    id: string;
    navigationType: string;
}

/**
 * Determine the rating for a metric based on thresholds
 */
function getRating(name: WebVitalMetricName, value: number): 'good' | 'needs-improvement' | 'poor' {
    const threshold = WEB_VITALS_THRESHOLDS[name];

    if (value <= threshold.good) {
        return 'good';
    } else if (value <= threshold.needsImprovement) {
        return 'needs-improvement';
    } else {
        return 'poor';
    }
}

/**
 * Send metric to analytics endpoint
 */
async function sendToAnalytics(metric: WebVitalMetric): Promise<void> {
    // In production, send to your analytics service
    // For now, we'll use the browser's sendBeacon API or fetch

    const body = JSON.stringify({
        metric: metric.name,
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
        id: metric.id,
        navigationType: metric.navigationType,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
    });

    // Use sendBeacon for reliability (works even if page is unloading)
    if (navigator.sendBeacon) {
        const blob = new Blob([body], { type: 'application/json' });
        navigator.sendBeacon('/api/analytics/web-vitals', blob);
    } else {
        // Fallback to fetch
        try {
            await fetch('/api/analytics/web-vitals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body,
                keepalive: true,
            });
        } catch (error) {
            console.error('Failed to send web vitals:', error);
        }
    }
}

/**
 * Log metric to console in development
 */
function logMetric(metric: WebVitalMetric): void {
    if (process.env.NODE_ENV === 'development') {
        const emoji = metric.rating === 'good' ? '✅' : metric.rating === 'needs-improvement' ? '⚠️' : '❌';
        console.log(
            `${emoji} ${metric.name}:`,
            `${metric.value.toFixed(2)}${metric.name === 'CLS' ? '' : 'ms'}`,
            `(${metric.rating})`
        );
    }
}

/**
 * Handle metric reporting
 */
function handleMetric(metric: Metric): void {
    const webVitalMetric: WebVitalMetric = {
        name: metric.name as WebVitalMetricName,
        value: metric.value,
        rating: getRating(metric.name as WebVitalMetricName, metric.value),
        delta: metric.delta,
        id: metric.id,
        navigationType: metric.navigationType,
    };

    // Log in development
    logMetric(webVitalMetric);

    // Send to analytics in production
    if (process.env.NODE_ENV === 'production') {
        sendToAnalytics(webVitalMetric);
    }
}

/**
 * Initialize Web Vitals tracking
 * 
 * Call this function once when your app loads (e.g., in _app.tsx or layout.tsx)
 */
export function initWebVitals(): void {
    // Only run in browser
    if (typeof window === 'undefined') {
        return;
    }

    // Track all Core Web Vitals
    onCLS(handleMetric);
    onFCP(handleMetric);
    onFID(handleMetric);
    onINP(handleMetric);
    onLCP(handleMetric);
    onTTFB(handleMetric);
}

/**
 * Get current Web Vitals metrics
 * 
 * This is useful for displaying metrics in a dashboard or debug panel
 */
export async function getCurrentMetrics(): Promise<WebVitalMetric[]> {
    return new Promise((resolve) => {
        const metrics: WebVitalMetric[] = [];
        let collected = 0;
        const total = 6; // Number of metrics we're tracking

        const collectMetric = (metric: Metric) => {
            metrics.push({
                name: metric.name as WebVitalMetricName,
                value: metric.value,
                rating: getRating(metric.name as WebVitalMetricName, metric.value),
                delta: metric.delta,
                id: metric.id,
                navigationType: metric.navigationType,
            });

            collected++;
            if (collected === total) {
                resolve(metrics);
            }
        };

        // Collect all metrics
        onCLS(collectMetric, { reportAllChanges: true });
        onFCP(collectMetric);
        onFID(collectMetric);
        onINP(collectMetric, { reportAllChanges: true });
        onLCP(collectMetric, { reportAllChanges: true });
        onTTFB(collectMetric);

        // Timeout after 5 seconds
        setTimeout(() => {
            if (collected < total) {
                resolve(metrics);
            }
        }, 5000);
    });
}

/**
 * Format metric value for display
 */
export function formatMetricValue(name: WebVitalMetricName, value: number): string {
    if (name === 'CLS') {
        return value.toFixed(3);
    }
    return `${Math.round(value)}ms`;
}

/**
 * Get color for metric rating
 */
export function getMetricColor(rating: 'good' | 'needs-improvement' | 'poor'): string {
    switch (rating) {
        case 'good':
            return 'text-green-600 dark:text-green-400';
        case 'needs-improvement':
            return 'text-yellow-600 dark:text-yellow-400';
        case 'poor':
            return 'text-red-600 dark:text-red-400';
    }
}

/**
 * Get background color for metric rating
 */
export function getMetricBgColor(rating: 'good' | 'needs-improvement' | 'poor'): string {
    switch (rating) {
        case 'good':
            return 'bg-green-100 dark:bg-green-900/20';
        case 'needs-improvement':
            return 'bg-yellow-100 dark:bg-yellow-900/20';
        case 'poor':
            return 'bg-red-100 dark:bg-red-900/20';
    }
}
