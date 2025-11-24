/**
 * CloudWatch Insights Client
 * 
 * Programmatic interface for executing CloudWatch Insights queries
 * to analyze logs with trace correlation.
 */

import {
    CloudWatchLogsClient,
    StartQueryCommand,
    GetQueryResultsCommand,
    DescribeQueriesCommand,
    StopQueryCommand,
    type StartQueryCommandInput,
    type GetQueryResultsCommandOutput,
    type QueryStatus,
} from '@aws-sdk/client-cloudwatch-logs';
import { getConfig } from '../config';
import { InsightsQuery, prepareQuery } from './cloudwatch-insights-queries';

export interface QueryExecutionOptions {
    logGroupNames: string[];
    startTime?: Date;
    endTime?: Date;
    limit?: number;
}

export interface QueryResult {
    queryId: string;
    status: QueryStatus;
    results?: Array<Record<string, string>>;
    statistics?: {
        recordsMatched: number;
        recordsScanned: number;
        bytesScanned: number;
    };
}

/**
 * CloudWatch Insights Client for executing log queries
 */
export class InsightsClient {
    private client: CloudWatchLogsClient;
    private region: string;

    constructor() {
        const config = getConfig();
        this.region = config.region;

        this.client = new CloudWatchLogsClient({
            region: this.region,
            endpoint: config.useLocalAWS ? config.localstackEndpoint : undefined,
        });
    }

    /**
     * Execute a CloudWatch Insights query
     */
    async executeQuery(
        query: InsightsQuery,
        options: QueryExecutionOptions,
        replacements?: Record<string, string>
    ): Promise<QueryResult> {
        // Prepare query with replacements
        const queryString = replacements
            ? prepareQuery(query, replacements)
            : query.query;

        // Calculate time range
        const endTime = options.endTime || new Date();
        const startTime = options.startTime || this.calculateStartTime(endTime, query.timeRange);

        // Start the query
        const startQueryInput: StartQueryCommandInput = {
            logGroupNames: options.logGroupNames,
            queryString,
            startTime: Math.floor(startTime.getTime() / 1000),
            endTime: Math.floor(endTime.getTime() / 1000),
            limit: options.limit || 1000,
        };

        const startCommand = new StartQueryCommand(startQueryInput);
        const startResponse = await this.client.send(startCommand);

        if (!startResponse.queryId) {
            throw new Error('Failed to start query: no query ID returned');
        }

        // Wait for query to complete
        return this.waitForQueryCompletion(startResponse.queryId);
    }

    /**
     * Wait for a query to complete and return results
     */
    private async waitForQueryCompletion(
        queryId: string,
        maxWaitTime: number = 60000, // 60 seconds
        pollInterval: number = 1000 // 1 second
    ): Promise<QueryResult> {
        const startTime = Date.now();

        while (Date.now() - startTime < maxWaitTime) {
            const getResultsCommand = new GetQueryResultsCommand({ queryId });
            const response: GetQueryResultsCommandOutput = await this.client.send(getResultsCommand);

            if (response.status === 'Complete') {
                return {
                    queryId,
                    status: response.status,
                    results: this.formatResults(response.results || []),
                    statistics: response.statistics
                        ? {
                            recordsMatched: response.statistics.recordsMatched || 0,
                            recordsScanned: response.statistics.recordsScanned || 0,
                            bytesScanned: response.statistics.bytesScanned || 0,
                        }
                        : undefined,
                };
            }

            if (response.status === 'Failed' || response.status === 'Cancelled') {
                throw new Error(`Query ${response.status.toLowerCase()}: ${queryId}`);
            }

            // Wait before polling again
            await new Promise(resolve => setTimeout(resolve, pollInterval));
        }

        // Timeout - stop the query
        await this.stopQuery(queryId);
        throw new Error(`Query timed out after ${maxWaitTime}ms: ${queryId}`);
    }

    /**
     * Stop a running query
     */
    async stopQuery(queryId: string): Promise<void> {
        const stopCommand = new StopQueryCommand({ queryId });
        await this.client.send(stopCommand);
    }

    /**
     * Get status of running queries
     */
    async getRunningQueries(logGroupName?: string): Promise<Array<{
        queryId: string;
        status: QueryStatus;
        logGroupName?: string;
        createTime?: number;
    }>> {
        const describeCommand = new DescribeQueriesCommand({
            logGroupName,
            status: 'Running',
        });

        const response = await this.client.send(describeCommand);

        return (response.queries || []).map(query => ({
            queryId: query.queryId!,
            status: query.status!,
            logGroupName: query.logGroupName,
            createTime: query.createTime,
        }));
    }

    /**
     * Format query results into a more usable structure
     */
    private formatResults(
        results: Array<Array<{ field?: string; value?: string }>>
    ): Array<Record<string, string>> {
        return results.map(result => {
            const formatted: Record<string, string> = {};
            for (const field of result) {
                if (field.field && field.value !== undefined) {
                    formatted[field.field] = field.value;
                }
            }
            return formatted;
        });
    }

    /**
     * Calculate start time based on time range
     */
    private calculateStartTime(
        endTime: Date,
        timeRange?: { value: number; unit: 'minutes' | 'hours' | 'days' }
    ): Date {
        if (!timeRange) {
            // Default to 1 hour
            return new Date(endTime.getTime() - 60 * 60 * 1000);
        }

        const multipliers = {
            minutes: 60 * 1000,
            hours: 60 * 60 * 1000,
            days: 24 * 60 * 60 * 1000,
        };

        const offset = timeRange.value * multipliers[timeRange.unit];
        return new Date(endTime.getTime() - offset);
    }

    /**
     * Helper method to find logs by trace ID
     */
    async findLogsByTraceId(
        traceId: string,
        logGroupNames: string[],
        options?: Partial<QueryExecutionOptions>
    ): Promise<QueryResult> {
        const { findLogsByTraceId } = await import('./cloudwatch-insights-queries');
        return this.executeQuery(
            findLogsByTraceId,
            { logGroupNames, ...options },
            { TRACE_ID: traceId }
        );
    }

    /**
     * Helper method to find logs by correlation ID
     */
    async findLogsByCorrelationId(
        correlationId: string,
        logGroupNames: string[],
        options?: Partial<QueryExecutionOptions>
    ): Promise<QueryResult> {
        const { findLogsByCorrelationId } = await import('./cloudwatch-insights-queries');
        return this.executeQuery(
            findLogsByCorrelationId,
            { logGroupNames, ...options },
            { CORRELATION_ID: correlationId }
        );
    }

    /**
     * Helper method to find logs by user ID
     */
    async findLogsByUserId(
        userId: string,
        logGroupNames: string[],
        options?: Partial<QueryExecutionOptions>
    ): Promise<QueryResult> {
        const { findLogsByUserId } = await import('./cloudwatch-insights-queries');
        return this.executeQuery(
            findLogsByUserId,
            { logGroupNames, ...options },
            { USER_ID: userId }
        );
    }

    /**
     * Helper method to trace a request across services
     */
    async traceRequestAcrossServices(
        correlationId: string,
        logGroupNames: string[],
        options?: Partial<QueryExecutionOptions>
    ): Promise<QueryResult> {
        const { traceRequestAcrossServices } = await import('./cloudwatch-insights-queries');
        return this.executeQuery(
            traceRequestAcrossServices,
            { logGroupNames, ...options },
            { CORRELATION_ID: correlationId }
        );
    }

    /**
     * Helper method to find errors with trace context
     */
    async findErrorsWithTraceContext(
        logGroupNames: string[],
        options?: Partial<QueryExecutionOptions>
    ): Promise<QueryResult> {
        const { findErrorsWithTraceContext } = await import('./cloudwatch-insights-queries');
        return this.executeQuery(findErrorsWithTraceContext, { logGroupNames, ...options });
    }

    /**
     * Helper method to analyze service performance
     */
    async analyzeServicePerformance(
        logGroupNames: string[],
        options?: Partial<QueryExecutionOptions>
    ): Promise<QueryResult> {
        const { analyzeServicePerformance } = await import('./cloudwatch-insights-queries');
        return this.executeQuery(analyzeServicePerformance, { logGroupNames, ...options });
    }
}

/**
 * Create a singleton instance
 */
let insightsClient: InsightsClient | null = null;

export function getInsightsClient(): InsightsClient {
    if (!insightsClient) {
        insightsClient = new InsightsClient();
    }
    return insightsClient;
}

/**
 * Reset the singleton instance (useful for testing)
 */
export function resetInsightsClient(): void {
    insightsClient = null;
}
