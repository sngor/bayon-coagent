/**
 * System Health Service
 * 
 * Monitors system health and performance metrics for the admin platform.
 * Integrates with CloudWatch for AWS metrics and provides real-time health status.
 */

import { DynamoDBRepository } from '@/aws/dynamodb/repository';
import { CloudWatchClient, GetMetricStatisticsCommand, Dimension } from '@aws-sdk/client-cloudwatch';
import { CloudWatchLogsClient, FilterLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { getConfig } from '@/aws/config';
import { v4 as uuidv4 } from 'uuid';
import { getCacheService, CacheKeys, CacheTTL } from './cache-service';

export interface SystemHealthMetrics {
    timestamp: number;
    apiMetrics: {
        averageResponseTime: number;
        errorRate: number;
        requestsPerMinute: number;
        slowestEndpoints: Array<{
            endpoint: string;
            avgResponseTime: number;
        }>;
    };
    awsServices: {
        dynamodb: {
            status: 'healthy' | 'degraded' | 'down';
            readCapacity: number;
            writeCapacity: number;
            throttledRequests: number;
        };
        bedrock: {
            status: 'healthy' | 'degraded' | 'down';
            requestsPerMinute: number;
            tokensPerMinute: number;
            costPerHour: number;
        };
        s3: {
            status: 'healthy' | 'degraded' | 'down';
            storageUsed: number;
            requestsPerMinute: number;
        };
    };
    errors: Array<{
        errorType: string;
        count: number;
        lastOccurrence: number;
        affectedUsers: number;
        stackTrace?: string;
    }>;
    alerts: Array<{
        severity: 'info' | 'warning' | 'critical';
        message: string;
        timestamp: number;
    }>;
}

export interface ErrorLogEntry {
    errorId: string;
    errorType: string;
    message: string;
    stackTrace: string;
    userId?: string;
    timestamp: number;
    metadata: Record<string, any>;
}

export interface AlertThreshold {
    metricName: string;
    threshold: number;
    comparisonOperator: 'GreaterThan' | 'LessThan' | 'GreaterThanOrEqual' | 'LessThanOrEqual';
    severity: 'info' | 'warning' | 'critical';
}

// Default alert thresholds
const DEFAULT_THRESHOLDS: AlertThreshold[] = [
    {
        metricName: 'ErrorRate',
        threshold: 5,
        comparisonOperator: 'GreaterThan',
        severity: 'warning',
    },
    {
        metricName: 'ErrorRate',
        threshold: 10,
        comparisonOperator: 'GreaterThan',
        severity: 'critical',
    },
    {
        metricName: 'AverageResponseTime',
        threshold: 3000,
        comparisonOperator: 'GreaterThan',
        severity: 'warning',
    },
    {
        metricName: 'AverageResponseTime',
        threshold: 5000,
        comparisonOperator: 'GreaterThan',
        severity: 'critical',
    },
    {
        metricName: 'ThrottledRequests',
        threshold: 10,
        comparisonOperator: 'GreaterThan',
        severity: 'warning',
    },
];

export class SystemHealthService {
    private repository: DynamoDBRepository;
    private cloudWatchClient: CloudWatchClient;
    private cloudWatchLogsClient: CloudWatchLogsClient;
    private config: ReturnType<typeof getConfig>;
    private cache = getCacheService();

    // CloudWatch configuration
    private readonly NAMESPACE = 'BayonCoAgent';
    private readonly LOG_GROUP_PREFIX = '/aws/bayon-coagent';

    constructor() {
        this.repository = new DynamoDBRepository();
        this.config = getConfig();

        const clientConfig = {
            region: this.config.region,
            ...(this.config.environment === 'local' && {
                endpoint: 'http://localhost:4566',
                credentials: {
                    accessKeyId: 'test',
                    secretAccessKey: 'test',
                },
            }),
        };

        this.cloudWatchClient = new CloudWatchClient(clientConfig);
        this.cloudWatchLogsClient = new CloudWatchLogsClient(clientConfig);
    }

    /**
     * Gets current system health metrics
     * Uses caching with 1 minute TTL
     */
    async getSystemHealth(): Promise<SystemHealthMetrics> {
        const cacheKey = CacheKeys.systemHealth();

        return this.cache.getOrSet(
            cacheKey,
            async () => {
                const timestamp = Date.now();

                // Get metrics in parallel
                const [apiMetrics, awsServices, errors, alerts] = await Promise.all([
                    this.getAPIMetrics(),
                    this.getAWSServicesStatus(),
                    this.getRecentErrors(),
                    this.detectAlerts(),
                ]);

                return {
                    timestamp,
                    apiMetrics,
                    awsServices,
                    errors,
                    alerts,
                };
            },
            CacheTTL.SYSTEM_HEALTH
        );
    }

    /**
     * Gets API performance metrics
     */
    private async getAPIMetrics(): Promise<SystemHealthMetrics['apiMetrics']> {

        try {
            const now = new Date();
            const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

            // Get average response time
            const responseTimeData = await this.getCloudWatchMetric(
                'AverageResponseTime',
                fiveMinutesAgo,
                now,
                'Average'
            );

            // Get error rate
            const errorRateData = await this.getCloudWatchMetric(
                'ErrorRate',
                fiveMinutesAgo,
                now,
                'Average'
            );

            // Get request count
            const requestCountData = await this.getCloudWatchMetric(
                'RequestCount',
                fiveMinutesAgo,
                now,
                'Sum'
            );

            const metrics = {
                averageResponseTime: this.extractMetricValue(responseTimeData) || 0,
                errorRate: this.extractMetricValue(errorRateData) || 0,
                requestsPerMinute: (this.extractMetricValue(requestCountData) || 0) / 5,
                slowestEndpoints: await this.getSlowestEndpoints(),
            };

            this.setCachedMetric(cacheKey, metrics);
            return metrics;
        } catch (error) {
            console.error('Error fetching API metrics:', error);
            return {
                averageResponseTime: 0,
                errorRate: 0,
                requestsPerMinute: 0,
                slowestEndpoints: [],
            };
        }
    }

    /**
     * Gets AWS services status
     */
    private async getAWSServicesStatus(): Promise<SystemHealthMetrics['awsServices']> {
        const cacheKey = 'aws-services';
        const cached = this.getCachedMetric(cacheKey);
        if (cached) return cached;

        try {
            const [dynamodbStatus, bedrockStatus, s3Status] = await Promise.all([
                this.getDynamoDBStatus(),
                this.getBedrockStatus(),
                this.getS3Status(),
            ]);

            const services = {
                dynamodb: dynamodbStatus,
                bedrock: bedrockStatus,
                s3: s3Status,
            };

            this.setCachedMetric(cacheKey, services);
            return services;
        } catch (error) {
            console.error('Error fetching AWS services status:', error);
            return {
                dynamodb: {
                    status: 'healthy' as const,
                    readCapacity: 0,
                    writeCapacity: 0,
                    throttledRequests: 0,
                },
                bedrock: {
                    status: 'healthy' as const,
                    requestsPerMinute: 0,
                    tokensPerMinute: 0,
                    costPerHour: 0,
                },
                s3: {
                    status: 'healthy' as const,
                    storageUsed: 0,
                    requestsPerMinute: 0,
                },
            };
        }
    }

    /**
     * Gets DynamoDB status and metrics
     */
    private async getDynamoDBStatus(): Promise<SystemHealthMetrics['awsServices']['dynamodb']> {
        try {
            const now = new Date();
            const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

            const tableName = process.env.DYNAMODB_TABLE_NAME || 'BayonCoagent';

            // Get throttled requests
            const throttledData = await this.getCloudWatchMetric(
                'UserErrors',
                fiveMinutesAgo,
                now,
                'Sum',
                [{ Name: 'TableName', Value: tableName }],
                'AWS/DynamoDB'
            );

            const throttledRequests = this.extractMetricValue(throttledData) || 0;

            // Determine status based on throttled requests
            let status: 'healthy' | 'degraded' | 'down' = 'healthy';
            if (throttledRequests > 100) {
                status = 'down';
            } else if (throttledRequests > 10) {
                status = 'degraded';
            }

            return {
                status,
                readCapacity: 0, // Would need to query table description
                writeCapacity: 0, // Would need to query table description
                throttledRequests,
            };
        } catch (error) {
            console.error('Error fetching DynamoDB status:', error);
            return {
                status: 'healthy',
                readCapacity: 0,
                writeCapacity: 0,
                throttledRequests: 0,
            };
        }
    }

    /**
     * Gets Bedrock status and metrics
     */
    private async getBedrockStatus(): Promise<SystemHealthMetrics['awsServices']['bedrock']> {
        try {
            const now = new Date();
            const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

            // Get Bedrock invocations
            const invocationsData = await this.getCloudWatchMetric(
                'Invocations',
                fiveMinutesAgo,
                now,
                'Sum',
                [],
                'AWS/Bedrock'
            );

            const invocations = this.extractMetricValue(invocationsData) || 0;
            const requestsPerMinute = invocations / 5;

            // Estimate tokens and cost (would need actual tracking)
            const tokensPerMinute = requestsPerMinute * 1000; // Rough estimate
            const costPerHour = (tokensPerMinute * 60 * 0.003) / 1000; // $0.003 per 1K tokens

            return {
                status: 'healthy',
                requestsPerMinute,
                tokensPerMinute,
                costPerHour,
            };
        } catch (error) {
            console.error('Error fetching Bedrock status:', error);
            return {
                status: 'healthy',
                requestsPerMinute: 0,
                tokensPerMinute: 0,
                costPerHour: 0,
            };
        }
    }

    /**
     * Gets S3 status and metrics
     */
    private async getS3Status(): Promise<SystemHealthMetrics['awsServices']['s3']> {
        try {
            const now = new Date();
            const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

            const bucketName = process.env.S3_BUCKET_NAME || 'bayon-coagent';

            // Get S3 requests
            const requestsData = await this.getCloudWatchMetric(
                'AllRequests',
                fiveMinutesAgo,
                now,
                'Sum',
                [{ Name: 'BucketName', Value: bucketName }],
                'AWS/S3'
            );

            const requests = this.extractMetricValue(requestsData) || 0;

            return {
                status: 'healthy',
                storageUsed: 0, // Would need to query bucket metrics
                requestsPerMinute: requests / 5,
            };
        } catch (error) {
            console.error('Error fetching S3 status:', error);
            return {
                status: 'healthy',
                storageUsed: 0,
                requestsPerMinute: 0,
            };
        }
    }

    /**
     * Gets recent errors grouped by type
     */
    private async getRecentErrors(): Promise<SystemHealthMetrics['errors']> {
        try {
            const now = Date.now();
            const oneHourAgo = now - 60 * 60 * 1000;

            // Query error logs from CloudWatch
            const errorLogs = await this.getErrorLogs({
                startDate: new Date(oneHourAgo),
                endDate: new Date(now),
                limit: 100,
            });

            // Group errors by type
            const errorGroups = new Map<string, {
                count: number;
                lastOccurrence: number;
                affectedUsers: Set<string>;
                stackTrace?: string;
            }>();

            errorLogs.forEach(log => {
                const existing = errorGroups.get(log.errorType) || {
                    count: 0,
                    lastOccurrence: 0,
                    affectedUsers: new Set<string>(),
                };

                existing.count++;
                existing.lastOccurrence = Math.max(existing.lastOccurrence, log.timestamp);
                if (log.userId) {
                    existing.affectedUsers.add(log.userId);
                }
                if (!existing.stackTrace && log.stackTrace) {
                    existing.stackTrace = log.stackTrace;
                }

                errorGroups.set(log.errorType, existing);
            });

            // Convert to array and sort by count
            return Array.from(errorGroups.entries())
                .map(([errorType, data]) => ({
                    errorType,
                    count: data.count,
                    lastOccurrence: data.lastOccurrence,
                    affectedUsers: data.affectedUsers.size,
                    stackTrace: data.stackTrace,
                }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10); // Top 10 errors
        } catch (error) {
            console.error('Error fetching recent errors:', error);
            return [];
        }
    }

    /**
     * Detects alerts based on thresholds
     */
    private async detectAlerts(): Promise<SystemHealthMetrics['alerts']> {
        const alerts: SystemHealthMetrics['alerts'] = [];

        try {
            const now = new Date();
            const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

            for (const threshold of DEFAULT_THRESHOLDS) {
                const metricData = await this.getCloudWatchMetric(
                    threshold.metricName,
                    fiveMinutesAgo,
                    now,
                    'Average'
                );

                const value = this.extractMetricValue(metricData);
                if (value !== null && this.checkThreshold(value, threshold)) {
                    alerts.push({
                        severity: threshold.severity,
                        message: `${threshold.metricName} is ${value.toFixed(2)}, exceeding threshold of ${threshold.threshold}`,
                        timestamp: Date.now(),
                    });
                }
            }
        } catch (error) {
            console.error('Error detecting alerts:', error);
        }

        return alerts;
    }

    /**
     * Gets error logs with filtering
     */
    async getErrorLogs(options?: {
        errorType?: string;
        startDate?: Date;
        endDate?: Date;
        limit?: number;
    }): Promise<ErrorLogEntry[]> {
        try {
            const startTime = options?.startDate?.getTime() || Date.now() - 24 * 60 * 60 * 1000;
            const endTime = options?.endDate?.getTime() || Date.now();
            const limit = options?.limit || 100;

            // Query CloudWatch Logs
            const logGroupName = `${this.LOG_GROUP_PREFIX}/errors`;

            const command = new FilterLogEventsCommand({
                logGroupName,
                startTime,
                endTime,
                limit,
                filterPattern: options?.errorType ? `{ $.errorType = "${options.errorType}" }` : undefined,
            });

            const response = await this.cloudWatchLogsClient.send(command);

            // Parse log events
            const errorLogs: ErrorLogEntry[] = [];
            if (response.events) {
                for (const event of response.events) {
                    if (event.message) {
                        try {
                            const parsed = JSON.parse(event.message);
                            errorLogs.push({
                                errorId: parsed.errorId || uuidv4(),
                                errorType: parsed.errorType || parsed.error?.category || 'unknown',
                                message: parsed.message || parsed.error?.message || 'Unknown error',
                                stackTrace: parsed.error?.stack || parsed.stackTrace || '',
                                userId: parsed.context?.userId || parsed.userId,
                                timestamp: event.timestamp || Date.now(),
                                metadata: parsed.metadata || parsed.context || {},
                            });
                        } catch (parseError) {
                            // If not JSON, create a basic error log
                            errorLogs.push({
                                errorId: uuidv4(),
                                errorType: 'parse_error',
                                message: event.message,
                                stackTrace: '',
                                timestamp: event.timestamp || Date.now(),
                                metadata: {},
                            });
                        }
                    }
                }
            }

            return errorLogs;
        } catch (error) {
            console.error('Error fetching error logs:', error);
            return [];
        }
    }

    /**
     * Gets AWS service metrics from CloudWatch
     */
    async getAWSMetrics(
        service: 'dynamodb' | 'bedrock' | 's3',
        metricName: string,
        startDate: Date,
        endDate: Date
    ): Promise<Array<{ timestamp: number; value: number }>> {
        try {
            const namespace = this.getNamespaceForService(service);
            const dimensions = this.getDimensionsForService(service);

            const data = await this.getCloudWatchMetric(
                metricName,
                startDate,
                endDate,
                'Average',
                dimensions,
                namespace
            );

            if (!data.Datapoints || data.Datapoints.length === 0) {
                return [];
            }

            return data.Datapoints.map(point => ({
                timestamp: point.Timestamp?.getTime() || Date.now(),
                value: point.Average || point.Sum || point.Maximum || 0,
            })).sort((a, b) => a.timestamp - b.timestamp);
        } catch (error) {
            console.error(`Error fetching ${service} metrics:`, error);
            return [];
        }
    }

    /**
     * Sends email alerts to SuperAdmins
     */
    async sendAlertEmail(alert: SystemHealthMetrics['alerts'][0], superAdminEmails: string[]): Promise<void> {
        // This would integrate with SES to send emails
        // For now, just log the alert
        console.log('Alert email would be sent:', {
            alert,
            recipients: superAdminEmails,
        });

        // TODO: Implement SES integration
        // const ses = new SESClient({ region: this.config.region });
        // await ses.send(new SendEmailCommand({
        //     Source: 'alerts@bayoncoagent.com',
        //     Destination: { ToAddresses: superAdminEmails },
        //     Message: {
        //         Subject: { Data: `[${alert.severity.toUpperCase()}] System Alert` },
        //         Body: { Text: { Data: alert.message } }
        //     }
        // }));
    }

    // ============================================================================
    // Private Helper Methods
    // ============================================================================

    /**
     * Gets a CloudWatch metric
     */
    private async getCloudWatchMetric(
        metricName: string,
        startTime: Date,
        endTime: Date,
        statistic: 'Average' | 'Sum' | 'Maximum' | 'Minimum',
        dimensions: Dimension[] = [],
        namespace: string = this.NAMESPACE
    ): Promise<any> {
        try {
            const command = new GetMetricStatisticsCommand({
                Namespace: namespace,
                MetricName: metricName,
                Dimensions: dimensions,
                StartTime: startTime,
                EndTime: endTime,
                Period: 300, // 5 minutes
                Statistics: [statistic],
            });

            return await this.cloudWatchClient.send(command);
        } catch (error) {
            console.error(`Error fetching CloudWatch metric ${metricName}:`, error);
            return { Datapoints: [] };
        }
    }

    /**
     * Extracts metric value from CloudWatch response
     */
    private extractMetricValue(data: any): number | null {
        if (!data.Datapoints || data.Datapoints.length === 0) {
            return null;
        }

        // Get the most recent datapoint
        const sorted = data.Datapoints.sort((a: any, b: any) =>
            (b.Timestamp?.getTime() || 0) - (a.Timestamp?.getTime() || 0)
        );

        const point = sorted[0];
        return point.Average || point.Sum || point.Maximum || point.Minimum || 0;
    }

    /**
     * Gets slowest endpoints from metrics
     */
    private async getSlowestEndpoints(): Promise<Array<{ endpoint: string; avgResponseTime: number }>> {
        // This would query endpoint-specific metrics
        // For now, return empty array
        return [];
    }

    /**
     * Checks if a value exceeds a threshold
     */
    private checkThreshold(value: number, threshold: AlertThreshold): boolean {
        switch (threshold.comparisonOperator) {
            case 'GreaterThan':
                return value > threshold.threshold;
            case 'LessThan':
                return value < threshold.threshold;
            case 'GreaterThanOrEqual':
                return value >= threshold.threshold;
            case 'LessThanOrEqual':
                return value <= threshold.threshold;
            default:
                return false;
        }
    }

    /**
     * Gets namespace for AWS service
     */
    private getNamespaceForService(service: 'dynamodb' | 'bedrock' | 's3'): string {
        switch (service) {
            case 'dynamodb':
                return 'AWS/DynamoDB';
            case 'bedrock':
                return 'AWS/Bedrock';
            case 's3':
                return 'AWS/S3';
            default:
                return this.NAMESPACE;
        }
    }

    /**
     * Gets dimensions for AWS service
     */
    private getDimensionsForService(service: 'dynamodb' | 'bedrock' | 's3'): Dimension[] {
        switch (service) {
            case 'dynamodb':
                return [{ Name: 'TableName', Value: process.env.DYNAMODB_TABLE_NAME || 'BayonCoagent' }];
            case 's3':
                return [{ Name: 'BucketName', Value: process.env.S3_BUCKET_NAME || 'bayon-coagent' }];
            default:
                return [];
        }
    }

    /**
     * Gets cached metric if still valid
     */
    private getCachedMetric(key: string): any | null {
        const cached = this.metricsCache.get(key);
        if (cached && Date.now() - cached.timestamp < this.METRICS_CACHE_TTL) {
            return cached.data;
        }
        return null;
    }

    /**
     * Sets cached metric
     */
    private setCachedMetric(key: string, data: any): void {
        this.metricsCache.set(key, {
            data,
            timestamp: Date.now(),
        });
    }
}

// Export singleton instance
export const systemHealthService = new SystemHealthService();
