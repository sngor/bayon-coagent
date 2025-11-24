/**
 * CloudWatch Logs Client for Programmatic Query Execution
 * 
 * Provides utilities to execute CloudWatch Insights queries programmatically
 * and retrieve correlated logs.
 */

import {
    CloudWatchLogsClient,
    StartQueryCommand,
    GetQueryResultsCommand,
    DescribeLogGroupsCommand,
    type StartQueryCommandInput,
    type GetQueryResultsCommandInput,
} from '@aws-sdk/client-cloudwatch-logs';
import { getConfig } from '@/aws/config';
import { buildQuery, QUERY_PATTERNS } from './cloudwatch-insights-queries';

/**
 * CloudWatch Logs client configuration
 */
const config = getConfig();
const cloudWatchClient = new CloudWatchLogsClient({
    region: config.region,
});

export interface QueryResult {
    queryId: string;
    status: 'Scheduled' | 'Running' | 'Complete' | 'Failed' | 'Cancelled';
    results?: Array<Record<string, string>>;
    statistics?: {
        recordsMatched: number;
        recordsScanned: number;
        bytesScanned: number;
    };
}

/**
 * Execute a CloudWatch Insights query
 */
export async function executeQuery(
    logGroupName: string,
    queryString: string,
    startTime: Date,
    endTime: Date = new Date()
): Promise<QueryResult> {
    const input: StartQueryCommandInput = {
        logGroupName,
        queryString,
        startTime: Math.floor(startTime.getTime() / 1000),
        endTime: Math.floor(endTime.getTime() / 1000),
    };

    const command = new StartQueryCommand(input);
    const response = await cloudWatchClient.send(command);

    if (!response.queryId) {
        throw new Error('Failed to start CloudWatch query');
    }

    return {
        queryId: response.queryId,
        status: 'Scheduled',
    };
}

/**
 * Get query results (poll until complete)
 */
export async function getQueryResults(
    queryId: string,
    maxWaitTime: number = 30000 // 30 seconds
): Promise<QueryResult> {
    const startTime = Date.now();
    const pollInterval = 1000; // 1 second

    while (Date.now() - startTime < maxWaitTime) {
        const input: GetQueryResultsCommandInput = {
            queryId,
        };

        const command = new GetQueryResultsCommand(input);
        const response = await cloudWatchClient.send(command);

        if (response.status === 'Complete') {
            return {
                queryId,
                status: 'Complete',
                results: response.results?.map(result =>
                    result.reduce((acc, field) => {
                        if (field.field && field.value) {
                            acc[field.field] = field.value;
                        }
                        return acc;
                    }, {} as Record<string, string>)
                ),
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
            return {
                queryId,
                status: response.status,
            };
        }

        // Wait before polling again
        await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error(`Query ${queryId} did not complete within ${maxWaitTime}ms`);
}

/**
 * Execute a query and wait for results
 */
export async function executeQueryAndWait(
    logGroupName: string,
    queryString: string,
    startTime: Date,
    endTime: Date = new Date(),
    maxWaitTime: number = 30000
): Promise<QueryResult> {
    const query = await executeQuery(logGroupName, queryString, startTime, endTime);
    return getQueryResults(query.queryId, maxWaitTime);
}

/**
 * Find logs by trace ID
 */
export async function findLogsByTraceId(
    logGroupName: string,
    traceId: string,
    startTime: Date,
    endTime: Date = new Date()
): Promise<QueryResult> {
    const query = buildQuery(QUERY_PATTERNS.DEBUG_TRACE, { TRACE_ID: traceId });
    return executeQueryAndWait(logGroupName, query, startTime, endTime);
}

/**
 * Find logs by correlation ID
 */
export async function findLogsByCorrelationId(
    logGroupName: string,
    correlationId: string,
    startTime: Date,
    endTime: Date = new Date()
): Promise<QueryResult> {
    const query = buildQuery(QUERY_PATTERNS.DEBUG_CORRELATION, {
        CORRELATION_ID: correlationId,
    });
    return executeQueryAndWait(logGroupName, query, startTime, endTime);
}

/**
 * Find logs by user ID
 */
export async function findLogsByUserId(
    logGroupName: string,
    userId: string,
    startTime: Date,
    endTime: Date = new Date()
): Promise<QueryResult> {
    const query = buildQuery(QUERY_PATTERNS.USER_JOURNEY, { USER_ID: userId });
    return executeQueryAndWait(logGroupName, query, startTime, endTime);
}

/**
 * Find error logs with trace correlation
 */
export async function findErrorLogsWithTraces(
    logGroupName: string,
    startTime: Date,
    endTime: Date = new Date()
): Promise<QueryResult> {
    return executeQueryAndWait(
        logGroupName,
        QUERY_PATTERNS.DEBUG_ERRORS,
        startTime,
        endTime
    );
}

/**
 * Analyze request flow for a trace
 */
export async function analyzeRequestFlow(
    logGroupName: string,
    traceId: string,
    startTime: Date,
    endTime: Date = new Date()
): Promise<QueryResult> {
    const query = buildQuery(QUERY_PATTERNS.SERVICE_FLOW, { TRACE_ID: traceId });
    return executeQueryAndWait(logGroupName, query, startTime, endTime);
}

/**
 * Find slow operations
 */
export async function findSlowOperations(
    logGroupName: string,
    startTime: Date,
    endTime: Date = new Date()
): Promise<QueryResult> {
    return executeQueryAndWait(
        logGroupName,
        QUERY_PATTERNS.PERF_SLOW_OPS,
        startTime,
        endTime
    );
}

/**
 * Get all log groups
 */
export async function getLogGroups(prefix?: string): Promise<string[]> {
    const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: prefix,
    });

    const response = await cloudWatchClient.send(command);
    return response.logGroups?.map(lg => lg.logGroupName || '') || [];
}

/**
 * Query multiple log groups
 */
export async function queryMultipleLogGroups(
    logGroupNames: string[],
    queryString: string,
    startTime: Date,
    endTime: Date = new Date()
): Promise<QueryResult[]> {
    const queries = logGroupNames.map(logGroupName =>
        executeQueryAndWait(logGroupName, queryString, startTime, endTime)
    );

    return Promise.all(queries);
}

/**
 * Find logs across all Lambda functions for a trace
 */
export async function findLogsAcrossLambdas(
    traceId: string,
    startTime: Date,
    endTime: Date = new Date()
): Promise<Record<string, QueryResult>> {
    // Get all Lambda log groups
    const logGroups = await getLogGroups('/aws/lambda/');

    // Query each log group
    const query = buildQuery(QUERY_PATTERNS.DEBUG_TRACE, { TRACE_ID: traceId });
    const results = await queryMultipleLogGroups(logGroups, query, startTime, endTime);

    // Map results to log group names
    return logGroups.reduce((acc, logGroup, index) => {
        acc[logGroup] = results[index];
        return acc;
    }, {} as Record<string, QueryResult>);
}

/**
 * Example usage:
 * 
 * // Find logs by trace ID
 * const logs = await findLogsByTraceId(
 *   '/aws/lambda/my-function',
 *   '1-5f8a1234-abcd1234efgh5678ijkl9012',
 *   new Date(Date.now() - 3600000) // 1 hour ago
 * );
 * 
 * // Find logs across all Lambda functions
 * const allLogs = await findLogsAcrossLambdas(
 *   '1-5f8a1234-abcd1234efgh5678ijkl9012',
 *   new Date(Date.now() - 3600000)
 * );
 */
