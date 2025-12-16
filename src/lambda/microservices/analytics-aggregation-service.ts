/**
 * Analytics Aggregation Service
 * 
 * Processes and aggregates analytics data in real-time within acceptable thresholds.
 * Implements Property 21: Real-time data aggregation
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

// Types for analytics aggregation
interface AnalyticsDataPoint {
    id: string;
    timestamp: string;
    userId: string;
    metric: string;
    value: number;
    dimensions: Record<string, string>;
    source: string;
}

interface AggregationResult {
    metric: string;
    aggregationType: 'sum' | 'avg' | 'count' | 'min' | 'max';
    value: number;
    timeWindow: {
        start: string;
        end: string;
    };
    dataPoints: number;
    processedAt: string;
    processingLatencyMs: number;
}

interface AggregationRequest {
    dataPoints: AnalyticsDataPoint[];
    aggregationType: 'sum' | 'avg' | 'count' | 'min' | 'max';
    timeWindow: {
        start: string;
        end: string;
    };
    groupBy?: string[];
    filters?: Record<string, string>;
}

// Real-time analytics aggregator
class RealTimeAggregator {
    private readonly realTimeThreshold = 1000; // 1 second for real-time processing

    async aggregateData(request: AggregationRequest): Promise<AggregationResult[]> {
        const startTime = Date.now();

        try {
            // Filter data points within time window
            const filteredPoints = this.filterByTimeWindow(request.dataPoints, request.timeWindow);

            // Apply additional filters if specified
            const finalPoints = request.filters
                ? this.applyFilters(filteredPoints, request.filters)
                : filteredPoints;

            // Group data points by metric and optional dimensions
            const groupedData = this.groupDataPoints(finalPoints, request.groupBy);

            // Perform aggregation for each group
            const results: AggregationResult[] = [];
            for (const [groupKey, points] of Object.entries(groupedData)) {
                const aggregatedValue = this.performAggregation(points, request.aggregationType);
                const metric = points.length > 0 ? points[0].metric : 'unknown';

                results.push({
                    metric: request.groupBy ? `${metric}_${groupKey}` : metric,
                    aggregationType: request.aggregationType,
                    value: aggregatedValue,
                    timeWindow: request.timeWindow,
                    dataPoints: points.length,
                    processedAt: new Date().toISOString(),
                    processingLatencyMs: Date.now() - startTime,
                });
            }

            // Ensure processing is within real-time threshold
            const totalLatency = Date.now() - startTime;
            if (totalLatency > this.realTimeThreshold) {
                console.warn(`Aggregation exceeded real-time threshold: ${totalLatency}ms`);
            }

            return results.length > 0 ? results : [{
                metric: 'unknown',
                aggregationType: request.aggregationType,
                value: 0,
                timeWindow: request.timeWindow,
                dataPoints: 0,
                processedAt: new Date().toISOString(),
                processingLatencyMs: totalLatency,
            }];

        } catch (error) {
            const totalLatency = Date.now() - startTime;
            console.error('Aggregation error:', error);

            return [{
                metric: 'error',
                aggregationType: request.aggregationType,
                value: 0,
                timeWindow: request.timeWindow,
                dataPoints: 0,
                processedAt: new Date().toISOString(),
                processingLatencyMs: totalLatency,
            }];
        }
    }

    private filterByTimeWindow(
        dataPoints: AnalyticsDataPoint[],
        timeWindow: { start: string; end: string }
    ): AnalyticsDataPoint[] {
        const windowStart = Date.parse(timeWindow.start);
        const windowEnd = Date.parse(timeWindow.end);

        return dataPoints.filter(point => {
            const pointTime = Date.parse(point.timestamp);
            return pointTime >= windowStart && pointTime <= windowEnd;
        });
    }

    private applyFilters(
        dataPoints: AnalyticsDataPoint[],
        filters: Record<string, string>
    ): AnalyticsDataPoint[] {
        return dataPoints.filter(point => {
            return Object.entries(filters).every(([key, value]) => {
                // Check in dimensions first, then in main properties
                if (point.dimensions[key]) {
                    return point.dimensions[key] === value;
                }
                return (point as any)[key] === value;
            });
        });
    }

    private groupDataPoints(
        dataPoints: AnalyticsDataPoint[],
        groupBy?: string[]
    ): Record<string, AnalyticsDataPoint[]> {
        if (!groupBy || groupBy.length === 0) {
            // Group by metric only
            return dataPoints.reduce((groups, point) => {
                const key = point.metric;
                if (!groups[key]) {
                    groups[key] = [];
                }
                groups[key].push(point);
                return groups;
            }, {} as Record<string, AnalyticsDataPoint[]>);
        }

        // Group by specified dimensions
        return dataPoints.reduce((groups, point) => {
            const keyParts = groupBy.map(dimension => {
                return point.dimensions[dimension] || 'unknown';
            });
            const key = `${point.metric}_${keyParts.join('_')}`;

            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(point);
            return groups;
        }, {} as Record<string, AnalyticsDataPoint[]>);
    }

    private performAggregation(
        dataPoints: AnalyticsDataPoint[],
        aggregationType: 'sum' | 'avg' | 'count' | 'min' | 'max'
    ): number {
        if (dataPoints.length === 0) {
            return 0;
        }

        const values = dataPoints.map(point => point.value).filter(v => !isNaN(v));

        if (values.length === 0) {
            return 0;
        }

        switch (aggregationType) {
            case 'sum':
                return values.reduce((sum, value) => sum + value, 0);

            case 'avg':
                return values.reduce((sum, value) => sum + value, 0) / values.length;

            case 'count':
                return values.length;

            case 'min':
                return Math.min(...values);

            case 'max':
                return Math.max(...values);

            default:
                return 0;
        }
    }

    async processStreamingData(dataStream: AsyncIterable<AnalyticsDataPoint>): Promise<void> {
        // Process streaming data in real-time
        const buffer: AnalyticsDataPoint[] = [];
        const bufferSize = 100;
        const flushInterval = 5000; // 5 seconds

        let lastFlush = Date.now();

        for await (const dataPoint of dataStream) {
            buffer.push(dataPoint);

            // Flush buffer if it's full or enough time has passed
            if (buffer.length >= bufferSize || (Date.now() - lastFlush) >= flushInterval) {
                await this.flushBuffer(buffer);
                buffer.length = 0;
                lastFlush = Date.now();
            }
        }

        // Flush remaining data
        if (buffer.length > 0) {
            await this.flushBuffer(buffer);
        }
    }

    private async flushBuffer(buffer: AnalyticsDataPoint[]): Promise<void> {
        // Group by metric and perform real-time aggregation
        const metricGroups = buffer.reduce((groups, point) => {
            if (!groups[point.metric]) {
                groups[point.metric] = [];
            }
            groups[point.metric].push(point);
            return groups;
        }, {} as Record<string, AnalyticsDataPoint[]>);

        // Process each metric group
        for (const [metric, points] of Object.entries(metricGroups)) {
            const timeWindow = {
                start: new Date(Date.now() - 60000).toISOString(), // Last minute
                end: new Date().toISOString(),
            };

            const request: AggregationRequest = {
                dataPoints: points,
                aggregationType: 'sum',
                timeWindow,
            };

            await this.aggregateData(request);
        }
    }
}

// Global aggregator instance
const aggregator = new RealTimeAggregator();

/**
 * Analytics Aggregation Service Lambda Handler
 * 
 * Processes and aggregates analytics data in real-time
 */
export const handler = async (
    event: APIGatewayProxyEvent,
    context: Context
): Promise<APIGatewayProxyResult> => {
    const traceId = context.awsRequestId;

    try {
        // Parse request body
        const requestBody: AggregationRequest = JSON.parse(event.body || '{}');

        // Validate request
        if (!requestBody.dataPoints || !Array.isArray(requestBody.dataPoints)) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Trace-ID': traceId,
                },
                body: JSON.stringify({
                    error: {
                        errorId: traceId,
                        errorCode: 'VALIDATION_ERROR',
                        message: 'dataPoints array is required',
                        timestamp: new Date().toISOString(),
                        traceId,
                        service: 'analytics-aggregation-service',
                        retryable: false,
                    },
                }),
            };
        }

        if (!requestBody.aggregationType) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Trace-ID': traceId,
                },
                body: JSON.stringify({
                    error: {
                        errorId: traceId,
                        errorCode: 'VALIDATION_ERROR',
                        message: 'aggregationType is required (sum, avg, count, min, max)',
                        timestamp: new Date().toISOString(),
                        traceId,
                        service: 'analytics-aggregation-service',
                        retryable: false,
                    },
                }),
            };
        }

        if (!requestBody.timeWindow) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Trace-ID': traceId,
                },
                body: JSON.stringify({
                    error: {
                        errorId: traceId,
                        errorCode: 'VALIDATION_ERROR',
                        message: 'timeWindow with start and end is required',
                        timestamp: new Date().toISOString(),
                        traceId,
                        service: 'analytics-aggregation-service',
                        retryable: false,
                    },
                }),
            };
        }

        // Perform real-time aggregation
        const results = await aggregator.aggregateData(requestBody);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'X-Trace-ID': traceId,
            },
            body: JSON.stringify({
                message: 'Analytics data aggregated successfully',
                data: {
                    results,
                    totalResults: results.length,
                    processedDataPoints: requestBody.dataPoints.length,
                },
            }),
        };

    } catch (error) {
        console.error('Analytics aggregation service error:', error);

        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'X-Trace-ID': traceId,
            },
            body: JSON.stringify({
                error: {
                    errorId: traceId,
                    errorCode: 'INTERNAL_ERROR',
                    message: 'Failed to aggregate analytics data',
                    timestamp: new Date().toISOString(),
                    traceId,
                    service: 'analytics-aggregation-service',
                    retryable: true,
                },
            }),
        };
    }
};

// Export for testing
export { RealTimeAggregator, AnalyticsDataPoint, AggregationResult, AggregationRequest };