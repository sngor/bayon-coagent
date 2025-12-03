/**
 * CloudWatch Metrics for Website Analysis Feature
 * 
 * Tracks key metrics for monitoring website analysis operations:
 * - Analysis start/completion events
 * - Error rates and types
 * - Analysis duration
 * - Success/failure rates
 * 
 * Requirements: All (Task 20)
 */

import { logger, createLogger, type LogContext } from './logger';
import {
    CloudWatchClient,
    PutMetricDataCommand,
    type Dimension,
    type MetricDatum,
} from '@aws-sdk/client-cloudwatch';
import { getConfig, getAWSCredentials } from '@/aws/config';

/**
 * Metric names for website analysis
 */
export enum WebsiteAnalysisMetric {
    ANALYSIS_STARTED = 'AnalysisStarted',
    ANALYSIS_COMPLETED = 'AnalysisCompleted',
    ANALYSIS_FAILED = 'AnalysisFailed',
    ANALYSIS_DURATION = 'AnalysisDuration',
    CRAWL_DURATION = 'CrawlDuration',
    EXTRACTION_DURATION = 'ExtractionDuration',
    AI_ANALYSIS_DURATION = 'AIAnalysisDuration',
    PAGES_CRAWLED = 'PagesCrawled',
    SCHEMA_TYPES_FOUND = 'SchemaTypesFound',
    OVERALL_SCORE = 'OverallScore',
    ERROR_RATE = 'ErrorRate',
}

/**
 * Error types for categorization
 */
export enum WebsiteAnalysisErrorType {
    VALIDATION_ERROR = 'ValidationError',
    NETWORK_ERROR = 'NetworkError',
    TIMEOUT_ERROR = 'TimeoutError',
    SSL_ERROR = 'SSLError',
    PARSING_ERROR = 'ParsingError',
    AI_SERVICE_ERROR = 'AIServiceError',
    DATABASE_ERROR = 'DatabaseError',
    UNKNOWN_ERROR = 'UnknownError',
}

/**
 * CloudWatch Metrics Client for Website Analysis
 */
class WebsiteAnalysisMetricsClient {
    private cloudWatchClient: CloudWatchClient;
    private namespace = 'BayonCoagent/WebsiteAnalysis';
    private logger = createLogger({ service: 'website-analysis-metrics' });
    private enabled: boolean;

    constructor() {
        const config = getConfig();
        const credentials = getAWSCredentials();

        // Only enable CloudWatch metrics in production
        this.enabled = config.environment === 'production';

        this.cloudWatchClient = new CloudWatchClient({
            region: config.region,
            credentials: credentials.accessKeyId && credentials.secretAccessKey
                ? credentials
                : undefined,
        });
    }

    /**
     * Publish metrics to CloudWatch
     */
    private async publishMetrics(metrics: MetricDatum[]): Promise<void> {
        if (!this.enabled || metrics.length === 0) {
            // In local/dev, just log the metrics
            this.logger.debug('Website analysis metrics (not published to CloudWatch)', {
                metrics: metrics.map(m => ({
                    name: m.MetricName,
                    value: m.Value,
                    unit: m.Unit,
                    dimensions: m.Dimensions,
                })),
            });
            return;
        }

        try {
            const command = new PutMetricDataCommand({
                Namespace: this.namespace,
                MetricData: metrics,
            });

            await this.cloudWatchClient.send(command);
        } catch (error) {
            this.logger.error('Failed to publish metrics to CloudWatch', error as Error, {
                metricsCount: metrics.length,
            });
        }
    }

    /**
     * Create dimension for user ID
     */
    private createUserDimension(userId: string): Dimension {
        return {
            Name: 'UserId',
            Value: userId,
        };
    }

    /**
     * Create dimension for error type
     */
    private createErrorTypeDimension(errorType: WebsiteAnalysisErrorType): Dimension {
        return {
            Name: 'ErrorType',
            Value: errorType,
        };
    }

    /**
     * Track analysis start event
     */
    async trackAnalysisStarted(userId: string, websiteUrl: string, context?: LogContext): Promise<void> {
        this.logger.info('Website analysis started', {
            ...context,
            userId,
            websiteUrl,
            operation: 'analyzeWebsite',
        });

        await this.publishMetrics([
            {
                MetricName: WebsiteAnalysisMetric.ANALYSIS_STARTED,
                Value: 1,
                Unit: 'Count',
                Timestamp: new Date(),
                Dimensions: [this.createUserDimension(userId)],
            },
        ]);
    }

    /**
     * Track analysis completion event
     */
    async trackAnalysisCompleted(
        userId: string,
        websiteUrl: string,
        duration: number,
        score: number,
        pagesCrawled: number,
        schemaTypesFound: number,
        context?: LogContext
    ): Promise<void> {
        this.logger.info('Website analysis completed', {
            ...context,
            userId,
            websiteUrl,
            duration,
            score,
            pagesCrawled,
            schemaTypesFound,
            operation: 'analyzeWebsite',
        });

        await this.publishMetrics([
            {
                MetricName: WebsiteAnalysisMetric.ANALYSIS_COMPLETED,
                Value: 1,
                Unit: 'Count',
                Timestamp: new Date(),
                Dimensions: [this.createUserDimension(userId)],
            },
            {
                MetricName: WebsiteAnalysisMetric.ANALYSIS_DURATION,
                Value: duration,
                Unit: 'Milliseconds',
                Timestamp: new Date(),
                Dimensions: [this.createUserDimension(userId)],
            },
            {
                MetricName: WebsiteAnalysisMetric.OVERALL_SCORE,
                Value: score,
                Unit: 'None',
                Timestamp: new Date(),
                Dimensions: [this.createUserDimension(userId)],
            },
            {
                MetricName: WebsiteAnalysisMetric.PAGES_CRAWLED,
                Value: pagesCrawled,
                Unit: 'Count',
                Timestamp: new Date(),
                Dimensions: [this.createUserDimension(userId)],
            },
            {
                MetricName: WebsiteAnalysisMetric.SCHEMA_TYPES_FOUND,
                Value: schemaTypesFound,
                Unit: 'Count',
                Timestamp: new Date(),
                Dimensions: [this.createUserDimension(userId)],
            },
        ]);
    }

    /**
     * Track analysis failure event
     */
    async trackAnalysisFailed(
        userId: string,
        websiteUrl: string,
        errorType: WebsiteAnalysisErrorType,
        error: Error,
        duration: number,
        context?: LogContext
    ): Promise<void> {
        this.logger.error('Website analysis failed', error, {
            ...context,
            userId,
            websiteUrl,
            errorType,
            duration,
            operation: 'analyzeWebsite',
        });

        await this.publishMetrics([
            {
                MetricName: WebsiteAnalysisMetric.ANALYSIS_FAILED,
                Value: 1,
                Unit: 'Count',
                Timestamp: new Date(),
                Dimensions: [
                    this.createUserDimension(userId),
                    this.createErrorTypeDimension(errorType),
                ],
            },
            {
                MetricName: WebsiteAnalysisMetric.ERROR_RATE,
                Value: 1,
                Unit: 'Count',
                Timestamp: new Date(),
                Dimensions: [this.createErrorTypeDimension(errorType)],
            },
            {
                MetricName: WebsiteAnalysisMetric.ANALYSIS_DURATION,
                Value: duration,
                Unit: 'Milliseconds',
                Timestamp: new Date(),
                Dimensions: [this.createUserDimension(userId)],
            },
        ]);
    }

    /**
     * Track crawl duration
     */
    async trackCrawlDuration(
        userId: string,
        duration: number,
        pagesCrawled: number,
        context?: LogContext
    ): Promise<void> {
        this.logger.debug('Website crawl completed', {
            ...context,
            userId,
            duration,
            pagesCrawled,
            operation: 'crawlWebsite',
        });

        await this.publishMetrics([
            {
                MetricName: WebsiteAnalysisMetric.CRAWL_DURATION,
                Value: duration,
                Unit: 'Milliseconds',
                Timestamp: new Date(),
                Dimensions: [this.createUserDimension(userId)],
            },
            {
                MetricName: WebsiteAnalysisMetric.PAGES_CRAWLED,
                Value: pagesCrawled,
                Unit: 'Count',
                Timestamp: new Date(),
                Dimensions: [this.createUserDimension(userId)],
            },
        ]);
    }

    /**
     * Track data extraction duration
     */
    async trackExtractionDuration(
        userId: string,
        duration: number,
        schemaTypesFound: number,
        context?: LogContext
    ): Promise<void> {
        this.logger.debug('Data extraction completed', {
            ...context,
            userId,
            duration,
            schemaTypesFound,
            operation: 'extractData',
        });

        await this.publishMetrics([
            {
                MetricName: WebsiteAnalysisMetric.EXTRACTION_DURATION,
                Value: duration,
                Unit: 'Milliseconds',
                Timestamp: new Date(),
                Dimensions: [this.createUserDimension(userId)],
            },
            {
                MetricName: WebsiteAnalysisMetric.SCHEMA_TYPES_FOUND,
                Value: schemaTypesFound,
                Unit: 'Count',
                Timestamp: new Date(),
                Dimensions: [this.createUserDimension(userId)],
            },
        ]);
    }

    /**
     * Track AI analysis duration
     */
    async trackAIAnalysisDuration(
        userId: string,
        duration: number,
        context?: LogContext
    ): Promise<void> {
        this.logger.debug('AI analysis completed', {
            ...context,
            userId,
            duration,
            operation: 'aiAnalysis',
        });

        await this.publishMetrics([
            {
                MetricName: WebsiteAnalysisMetric.AI_ANALYSIS_DURATION,
                Value: duration,
                Unit: 'Milliseconds',
                Timestamp: new Date(),
                Dimensions: [this.createUserDimension(userId)],
            },
        ]);
    }
}

// Export singleton instance
export const websiteAnalysisMetrics = new WebsiteAnalysisMetricsClient();

/**
 * Helper function to categorize errors
 */
export function categorizeError(error: Error): WebsiteAnalysisErrorType {
    const message = error.message.toLowerCase();

    if (message.includes('validation') || message.includes('invalid')) {
        return WebsiteAnalysisErrorType.VALIDATION_ERROR;
    }
    if (message.includes('timeout')) {
        return WebsiteAnalysisErrorType.TIMEOUT_ERROR;
    }
    if (message.includes('certificate') || message.includes('ssl')) {
        return WebsiteAnalysisErrorType.SSL_ERROR;
    }
    if (
        message.includes('fetch') ||
        message.includes('network') ||
        message.includes('not found') ||
        message.includes('refused') ||
        message.includes('404') ||
        message.includes('403')
    ) {
        return WebsiteAnalysisErrorType.NETWORK_ERROR;
    }
    if (message.includes('parse') || message.includes('json')) {
        return WebsiteAnalysisErrorType.PARSING_ERROR;
    }
    if (message.includes('ai') || message.includes('bedrock') || message.includes('claude')) {
        return WebsiteAnalysisErrorType.AI_SERVICE_ERROR;
    }
    if (message.includes('database') || message.includes('dynamodb')) {
        return WebsiteAnalysisErrorType.DATABASE_ERROR;
    }

    return WebsiteAnalysisErrorType.UNKNOWN_ERROR;
}
