/**
 * Performance Monitoring Service
 * 
 * Monitors Lambda performance, circuit breaker status, and cache effectiveness
 */

import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';
import { getConfig } from '@/aws/config';

export interface PerformanceMetrics {
    functionName: string;
    duration: number;
    memoryUsed: number;
    coldStart: boolean;
    cacheHit?: boolean;
    circuitBreakerState?: string;
    errorCount?: number;
}

export interface CacheMetrics {
    cacheType: string;
    hitRate: number;
    totalEntries: number;
    validEntries: number;
    expiredEntries: number;
}

export interface CircuitBreakerMetrics {
    service: string;
    state: string;
    failureCount: number;
    lastFailureTime: number;
}

export class PerformanceMonitor {
    private cloudWatch: CloudWatchClient;
    private namespace: string;

    constructor() {
        const config = getConfig();
        this.cloudWatch = new CloudWatchClient({
            region: config.aws.region
        });
        this.namespace = 'BayonCoAgent/Performance';
    }

    /**
     * Record Lambda function performance metrics
     */
    async recordLambdaMetrics(metrics: PerformanceMetrics): Promise<void> {
        const metricData = [
            {
                MetricName: 'Duration',
                Value: metrics.duration,
                Unit: 'Milliseconds',
                Dimensions: [
                    { Name: 'FunctionName', Value: metrics.functionName }
                ]
            },
            {
                MetricName: 'MemoryUsed',
                Value: metrics.memoryUsed,
                Unit: 'Megabytes',
                Dimensions: [
                    { Name: 'FunctionName', Value: metrics.functionName }
                ]
            },
            {
                MetricName: 'ColdStart',
                Value: metrics.coldStart ? 1 : 0,
                Unit: 'Count',
                Dimensions: [
                    { Name: 'FunctionName', Value: metrics.functionName }
                ]
            }
        ];

        // Add cache hit metric if available
        if (metrics.cacheHit !== undefined) {
            metricData.push({
                MetricName: 'CacheHit',
                Value: metrics.cacheHit ? 1 : 0,
                Unit: 'Count',
                Dimensions: [
                    { Name: 'FunctionName', Value: metrics.functionName }
                ]
            });
        }

        // Add error count if available
        if (metrics.errorCount !== undefined) {
            metricData.push({
                MetricName: 'ErrorCount',
                Value: metrics.errorCount,
                Unit: 'Count',
                Dimensions: [
                    { Name: 'FunctionName', Value: metrics.functionName }
                ]
            });
        }

        await this.putMetrics(metricData);
    }

    /**
     * Record cache performance metrics
     */
    async recordCacheMetrics(metrics: CacheMetrics): Promise<void> {
        const metricData = [
            {
                MetricName: 'CacheHitRate',
                Value: metrics.hitRate * 100, // Convert to percentage
                Unit: 'Percent',
                Dimensions: [
                    { Name: 'CacheType', Value: metrics.cacheType }
                ]
            },
            {
                MetricName: 'CacheTotalEntries',
                Value: metrics.totalEntries,
                Unit: 'Count',
                Dimensions: [
                    { Name: 'CacheType', Value: metrics.cacheType }
                ]
            },
            {
                MetricName: 'CacheValidEntries',
                Value: metrics.validEntries,
                Unit: 'Count',
                Dimensions: [
                    { Name: 'CacheType', Value: metrics.cacheType }
                ]
            },
            {
                MetricName: 'CacheExpiredEntries',
                Value: metrics.expiredEntries,
                Unit: 'Count',
                Dimensions: [
                    { Name: 'CacheType', Value: metrics.cacheType }
                ]
            }
        ];

        await this.putMetrics(metricData);
    }

    /**
     * Record circuit breaker metrics
     */
    async recordCircuitBreakerMetrics(metrics: CircuitBreakerMetrics): Promise<void> {
        const metricData = [
            {
                MetricName: 'CircuitBreakerState',
                Value: this.circuitStateToNumber(metrics.state),
                Unit: 'None',
                Dimensions: [
                    { Name: 'Service', Value: metrics.service }
                ]
            },
            {
                MetricName: 'CircuitBreakerFailures',
                Value: metrics.failureCount,
                Unit: 'Count',
                Dimensions: [
                    { Name: 'Service', Value: metrics.service }
                ]
            }
        ];

        await this.putMetrics(metricData);
    }

    /**
     * Record business metrics for cost analysis
     */
    async recordBusinessMetrics(contentType: string, tokensUsed: number, cost: number): Promise<void> {
        const metricData = [
            {
                MetricName: 'TokensUsed',
                Value: tokensUsed,
                Unit: 'Count',
                Dimensions: [
                    { Name: 'ContentType', Value: contentType }
                ]
            },
            {
                MetricName: 'AIGenerationCost',
                Value: cost,
                Unit: 'None', // Cost in dollars
                Dimensions: [
                    { Name: 'ContentType', Value: contentType }
                ]
            },
            {
                MetricName: 'ContentGenerated',
                Value: 1,
                Unit: 'Count',
                Dimensions: [
                    { Name: 'ContentType', Value: contentType }
                ]
            }
        ];

        await this.putMetrics(metricData);
    }

    /**
     * Create CloudWatch dashboard for performance monitoring
     */
    async createPerformanceDashboard(): Promise<string> {
        const dashboardBody = {
            widgets: [
                {
                    type: 'metric',
                    x: 0,
                    y: 0,
                    width: 12,
                    height: 6,
                    properties: {
                        metrics: [
                            ['BayonCoAgent/Performance', 'Duration', 'FunctionName', 'bayon-coagent-ai-content-generation-production'],
                            ['...', 'bayon-coagent-cognito-authorizer-production'],
                            ['AWS/Lambda', 'Duration', 'FunctionName', 'bayon-coagent-ai-content-generation-production']
                        ],
                        view: 'timeSeries',
                        stacked: false,
                        region: 'us-east-1',
                        title: 'Lambda Function Duration',
                        period: 300
                    }
                },
                {
                    type: 'metric',
                    x: 12,
                    y: 0,
                    width: 12,
                    height: 6,
                    properties: {
                        metrics: [
                            ['BayonCoAgent/Performance', 'CacheHitRate', 'CacheType', 'blogPost'],
                            ['...', 'socialMedia'],
                            ['...', 'listingDescription']
                        ],
                        view: 'timeSeries',
                        stacked: false,
                        region: 'us-east-1',
                        title: 'Cache Hit Rates',
                        period: 300
                    }
                },
                {
                    type: 'metric',
                    x: 0,
                    y: 6,
                    width: 12,
                    height: 6,
                    properties: {
                        metrics: [
                            ['BayonCoAgent/Performance', 'ColdStart', 'FunctionName', 'bayon-coagent-ai-content-generation-production'],
                            ['...', 'bayon-coagent-cognito-authorizer-production']
                        ],
                        view: 'timeSeries',
                        stacked: false,
                        region: 'us-east-1',
                        title: 'Cold Starts',
                        period: 300
                    }
                },
                {
                    type: 'metric',
                    x: 12,
                    y: 6,
                    width: 12,
                    height: 6,
                    properties: {
                        metrics: [
                            ['BayonCoAgent/Performance', 'CircuitBreakerState', 'Service', 'bedrock'],
                            ['BayonCoAgent/Performance', 'CircuitBreakerFailures', 'Service', 'bedrock']
                        ],
                        view: 'timeSeries',
                        stacked: false,
                        region: 'us-east-1',
                        title: 'Circuit Breaker Status',
                        period: 300
                    }
                }
            ]
        };

        // Note: You would need to implement CloudWatch Dashboard creation
        // For now, return the dashboard configuration
        return JSON.stringify(dashboardBody, null, 2);
    }

    private async putMetrics(metricData: any[]): Promise<void> {
        try {
            await this.cloudWatch.send(new PutMetricDataCommand({
                Namespace: this.namespace,
                MetricData: metricData
            }));
        } catch (error) {
            console.error('Failed to put CloudWatch metrics:', error);
            // Don't throw - monitoring failures shouldn't break the application
        }
    }

    private circuitStateToNumber(state: string): number {
        switch (state) {
            case 'CLOSED': return 0;
            case 'HALF_OPEN': return 1;
            case 'OPEN': return 2;
            default: return -1;
        }
    }
}

// Singleton instance
let performanceMonitor: PerformanceMonitor | null = null;

export function getPerformanceMonitor(): PerformanceMonitor {
    if (!performanceMonitor) {
        performanceMonitor = new PerformanceMonitor();
    }
    return performanceMonitor;
}

/**
 * Decorator for monitoring Lambda function performance
 */
export function monitorPerformance(functionName: string) {
    return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
        const method = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            const startTime = Date.now();
            const monitor = getPerformanceMonitor();
            let error: any = null;

            try {
                const result = await method.apply(this, args);

                // Record successful execution
                await monitor.recordLambdaMetrics({
                    functionName,
                    duration: Date.now() - startTime,
                    memoryUsed: process.memoryUsage().heapUsed / 1024 / 1024, // MB
                    coldStart: !global.lambdaWarmed,
                    errorCount: 0
                });

                // Mark Lambda as warmed
                global.lambdaWarmed = true;

                return result;
            } catch (err) {
                error = err;

                // Record failed execution
                await monitor.recordLambdaMetrics({
                    functionName,
                    duration: Date.now() - startTime,
                    memoryUsed: process.memoryUsage().heapUsed / 1024 / 1024,
                    coldStart: !global.lambdaWarmed,
                    errorCount: 1
                });

                throw err;
            }
        };
    };
}

// Global variable to track Lambda warm state
declare global {
    var lambdaWarmed: boolean;
}