/**
 * Research Performance Monitor
 * 
 * Tracks performance metrics for Strands research operations
 * Integrates with AWS CloudWatch for monitoring
 */

interface PerformanceMetrics {
    requestId: string;
    userId: string;
    topic: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    success: boolean;
    source: 'strands' | 'bedrock-fallback' | 'cache';
    error?: string;
    cacheHit?: boolean;
    reportLength?: number;
    citationCount?: number;
}

class ResearchPerformanceMonitor {
    private metrics: Map<string, PerformanceMetrics> = new Map();
    private readonly maxMetrics = 1000; // Keep last 1000 metrics in memory

    /**
     * Start tracking a research request
     */
    startRequest(userId: string, topic: string): string {
        const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const metric: PerformanceMetrics = {
            requestId,
            userId,
            topic: topic.length > 100 ? topic.substring(0, 100) : topic, // Truncate for storage
            startTime: Date.now(),
            success: false,
            source: 'strands',
        };

        this.metrics.set(requestId, metric);

        // Clean up old metrics if we exceed the limit
        if (this.metrics.size > this.maxMetrics) {
            const oldestKey = this.metrics.keys().next().value;
            if (oldestKey) {
                this.metrics.delete(oldestKey);
            }
        }

        console.log(`🔍 Started research tracking: ${requestId}`);
        return requestId;
    }

    /**
     * Mark request as completed
     */
    completeRequest(
        requestId: string,
        success: boolean,
        source: PerformanceMetrics['source'],
        options: {
            error?: string;
            cacheHit?: boolean;
            reportLength?: number;
            citationCount?: number;
        } = {}
    ): void {
        const metric = this.metrics.get(requestId);
        if (!metric) {
            console.warn(`Metric not found for request: ${requestId}`);
            return;
        }

        const endTime = Date.now();
        metric.endTime = endTime;
        metric.duration = endTime - metric.startTime;
        metric.success = success;
        metric.source = source;
        metric.error = options.error;
        metric.cacheHit = options.cacheHit;
        metric.reportLength = options.reportLength;
        metric.citationCount = options.citationCount;

        console.log(`✅ Completed research tracking: ${requestId} (${metric.duration}ms)`);

        // Send to CloudWatch (async, don't block)
        this.sendToCloudWatch(metric).catch(error => {
            console.error('Failed to send metrics to CloudWatch:', error);
        });
    }

    /**
     * Get performance statistics
     */
    getStats(): {
        totalRequests: number;
        successRate: number;
        averageDuration: number;
        cacheHitRate: number;
        sourceBreakdown: Record<string, number>;
        recentErrors: string[];
    } {
        const metrics = Array.from(this.metrics.values()).filter(m => m.endTime);

        if (metrics.length === 0) {
            return {
                totalRequests: 0,
                successRate: 0,
                averageDuration: 0,
                cacheHitRate: 0,
                sourceBreakdown: {},
                recentErrors: [],
            };
        }

        const successful = metrics.filter(m => m.success);
        const withCache = metrics.filter(m => m.cacheHit);
        const durations = metrics.map(m => m.duration!).filter(d => d > 0);

        const sourceBreakdown: Record<string, number> = {};
        metrics.forEach(m => {
            sourceBreakdown[m.source] = (sourceBreakdown[m.source] || 0) + 1;
        });

        const recentErrors = metrics
            .filter(m => !m.success && m.error)
            .slice(-5) // Last 5 errors
            .map(m => m.error!);

        return {
            totalRequests: metrics.length,
            successRate: successful.length / metrics.length,
            averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
            cacheHitRate: withCache.length / metrics.length,
            sourceBreakdown,
            recentErrors,
        };
    }

    /**
     * Send metrics to AWS CloudWatch with enhanced error handling
     */
    private async sendToCloudWatch(metric: PerformanceMetrics): Promise<void> {
        try {
            // Only send in production or when explicitly enabled
            if (process.env.NODE_ENV !== 'production' && !process.env.ENABLE_CLOUDWATCH_METRICS) {
                console.log('📊 CloudWatch metrics disabled in development');
                return;
            }

            const { CloudWatchClient, PutMetricDataCommand, StandardUnit } = await import('@aws-sdk/client-cloudwatch');

            const cloudwatch = new CloudWatchClient({
                region: process.env.AWS_REGION || 'us-east-2',
            });

            const metricData = [
                {
                    MetricName: 'ResearchRequestDuration',
                    Value: metric.duration!,
                    Unit: StandardUnit.Milliseconds,
                    Timestamp: new Date(metric.startTime),
                    Dimensions: [
                        { Name: 'Source', Value: metric.source },
                        { Name: 'Success', Value: metric.success.toString() },
                        { Name: 'Environment', Value: process.env.NODE_ENV || 'unknown' },
                    ],
                },
                {
                    MetricName: 'ResearchRequestCount',
                    Value: 1,
                    Unit: StandardUnit.Count,
                    Timestamp: new Date(metric.startTime),
                    Dimensions: [
                        { Name: 'Source', Value: metric.source },
                        { Name: 'Success', Value: metric.success.toString() },
                        { Name: 'Environment', Value: process.env.NODE_ENV || 'unknown' },
                    ],
                },
                // Add error rate metric
                {
                    MetricName: 'ResearchErrorRate',
                    Value: metric.success ? 0 : 1,
                    Unit: StandardUnit.Count,
                    Timestamp: new Date(metric.startTime),
                    Dimensions: [
                        { Name: 'Source', Value: metric.source },
                        { Name: 'Environment', Value: process.env.NODE_ENV || 'unknown' },
                    ],
                },
            ];

            // Add cache hit metric if applicable
            if (metric.cacheHit !== undefined) {
                metricData.push({
                    MetricName: 'CacheHitRate',
                    Value: metric.cacheHit ? 1 : 0,
                    Unit: StandardUnit.Count,
                    Timestamp: new Date(metric.startTime),
                    Dimensions: [{ Name: 'Source', Value: metric.source }],
                });
            }

            // Add report quality metrics
            if (metric.reportLength) {
                metricData.push({
                    MetricName: 'ReportLength',
                    Value: metric.reportLength,
                    Unit: StandardUnit.Count,
                    Timestamp: new Date(metric.startTime),
                    Dimensions: [{ Name: 'Source', Value: metric.source }],
                });
            }

            if (metric.citationCount) {
                metricData.push({
                    MetricName: 'CitationCount',
                    Value: metric.citationCount,
                    Unit: StandardUnit.Count,
                    Timestamp: new Date(metric.startTime),
                    Dimensions: [{ Name: 'Source', Value: metric.source }],
                });
            }

            await cloudwatch.send(new PutMetricDataCommand({
                Namespace: 'BayonCoagent/Research',
                MetricData: metricData,
            }));

        } catch (error) {
            console.error('CloudWatch metrics error:', error);
            // Don't throw - metrics shouldn't break the main flow
        }
    }

    /**
     * Get metrics for a specific user
     */
    getUserMetrics(userId: string): PerformanceMetrics[] {
        return Array.from(this.metrics.values())
            .filter(m => m.userId === userId)
            .sort((a, b) => b.startTime - a.startTime);
    }
}

// Export singleton instance
export const researchPerformanceMonitor = new ResearchPerformanceMonitor();

/**
 * Decorator function to automatically track performance
 */
export function trackPerformance<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    getName: (...args: T) => { userId: string; topic: string }
) {
    return async (...args: T): Promise<R> => {
        const { userId, topic } = getName(...args);
        const requestId = researchPerformanceMonitor.startRequest(userId, topic);

        try {
            const result = await fn(...args);

            // Try to extract metrics from result
            let reportLength: number | undefined;
            let citationCount: number | undefined;
            let source: PerformanceMetrics['source'] = 'strands';

            if (typeof result === 'object' && result !== null) {
                const r = result as any;
                reportLength = r.report?.length;
                citationCount = r.citations?.length;
                source = r.source || 'strands';
            }

            researchPerformanceMonitor.completeRequest(requestId, true, source, {
                reportLength,
                citationCount,
            });

            return result;
        } catch (error) {
            researchPerformanceMonitor.completeRequest(requestId, false, 'strands', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    };
}