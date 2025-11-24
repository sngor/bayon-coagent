/**
 * CloudWatch Insights Query Templates
 * 
 * Pre-built queries for analyzing logs with trace correlation.
 * These queries can be used in the AWS CloudWatch Insights console
 * or programmatically via the AWS SDK.
 */

export interface InsightsQuery {
    name: string;
    description: string;
    query: string;
    timeRange?: {
        value: number;
        unit: 'minutes' | 'hours' | 'days';
    };
}

/**
 * Query to find all logs for a specific trace ID
 */
export const findLogsByTraceId: InsightsQuery = {
    name: 'Find Logs by Trace ID',
    description: 'Retrieve all log entries associated with a specific X-Ray trace ID',
    query: `fields @timestamp, level, message, context.traceId, context.spanId, context.service, context.operation
| filter context.traceId = "<TRACE_ID>"
| sort @timestamp asc`,
    timeRange: { value: 1, unit: 'hours' },
};

/**
 * Query to find all logs for a specific correlation ID
 */
export const findLogsByCorrelationId: InsightsQuery = {
    name: 'Find Logs by Correlation ID',
    description: 'Retrieve all log entries associated with a specific correlation ID',
    query: `fields @timestamp, level, message, context.correlationId, context.traceId, context.service, context.operation
| filter context.correlationId = "<CORRELATION_ID>"
| sort @timestamp asc`,
    timeRange: { value: 1, unit: 'hours' },
};

/**
 * Query to trace a request across all services
 */
export const traceRequestAcrossServices: InsightsQuery = {
    name: 'Trace Request Across Services',
    description: 'Follow a request through all services using correlation ID',
    query: `fields @timestamp, context.service, context.operation, level, message, context.duration
| filter context.correlationId = "<CORRELATION_ID>"
| sort @timestamp asc
| display @timestamp, context.service, context.operation, level, message, context.duration`,
    timeRange: { value: 1, unit: 'hours' },
};

/**
 * Query to find errors with trace context
 */
export const findErrorsWithTraceContext: InsightsQuery = {
    name: 'Find Errors with Trace Context',
    description: 'Find all errors with their associated trace and correlation IDs',
    query: `fields @timestamp, level, message, error.name, error.message, context.traceId, context.correlationId, context.service, context.operation
| filter level = "ERROR"
| sort @timestamp desc
| limit 100`,
    timeRange: { value: 24, unit: 'hours' },
};

/**
 * Query to analyze service performance by trace
 */
export const analyzeServicePerformance: InsightsQuery = {
    name: 'Analyze Service Performance',
    description: 'Analyze operation duration across services with trace correlation',
    query: `fields @timestamp, context.service, context.operation, context.duration, context.traceId
| filter context.duration > 0
| stats avg(context.duration) as avg_duration, max(context.duration) as max_duration, min(context.duration) as min_duration, count(*) as request_count by context.service, context.operation
| sort avg_duration desc`,
    timeRange: { value: 1, unit: 'hours' },
};

/**
 * Query to find slow operations with trace IDs
 */
export const findSlowOperations: InsightsQuery = {
    name: 'Find Slow Operations',
    description: 'Find operations that took longer than a threshold with trace context',
    query: `fields @timestamp, context.service, context.operation, context.duration, context.traceId, context.correlationId, message
| filter context.duration > 1000
| sort context.duration desc
| limit 50`,
    timeRange: { value: 1, unit: 'hours' },
};

/**
 * Query to analyze error patterns by service
 */
export const analyzeErrorPatterns: InsightsQuery = {
    name: 'Analyze Error Patterns',
    description: 'Group errors by service and error type with trace correlation',
    query: `fields @timestamp, context.service, error.name, error.message, context.traceId
| filter level = "ERROR"
| stats count(*) as error_count by context.service, error.name
| sort error_count desc`,
    timeRange: { value: 24, unit: 'hours' },
};

/**
 * Query to find logs for a specific user across all services
 */
export const findLogsByUserId: InsightsQuery = {
    name: 'Find Logs by User ID',
    description: 'Retrieve all log entries for a specific user across all services',
    query: `fields @timestamp, context.service, context.operation, level, message, context.traceId, context.correlationId
| filter context.userId = "<USER_ID>"
| sort @timestamp desc
| limit 100`,
    timeRange: { value: 24, unit: 'hours' },
};

/**
 * Query to analyze request flow through services
 */
export const analyzeRequestFlow: InsightsQuery = {
    name: 'Analyze Request Flow',
    description: 'Visualize how requests flow through different services',
    query: `fields @timestamp, context.service, context.operation, context.correlationId, context.traceId
| filter context.correlationId like /./
| stats count(*) as request_count by context.service, context.operation
| sort request_count desc`,
    timeRange: { value: 1, unit: 'hours' },
};

/**
 * Query to find orphaned logs (logs without trace context)
 */
export const findOrphanedLogs: InsightsQuery = {
    name: 'Find Orphaned Logs',
    description: 'Find logs that are missing trace or correlation IDs',
    query: `fields @timestamp, level, message, context.service, context.operation
| filter (isblank(context.traceId) or isblank(context.correlationId))
| sort @timestamp desc
| limit 100`,
    timeRange: { value: 1, unit: 'hours' },
};

/**
 * Query to analyze service dependencies
 */
export const analyzeServiceDependencies: InsightsQuery = {
    name: 'Analyze Service Dependencies',
    description: 'Identify which services call which other services',
    query: `fields context.service as source_service, context.operation, context.traceId
| filter context.service like /./
| stats count(*) as call_count by source_service, context.operation
| sort call_count desc`,
    timeRange: { value: 1, unit: 'hours' },
};

/**
 * Query to find concurrent operations by trace
 */
export const findConcurrentOperations: InsightsQuery = {
    name: 'Find Concurrent Operations',
    description: 'Find operations that ran concurrently within the same trace',
    query: `fields @timestamp, context.traceId, context.service, context.operation, context.spanId, context.parentSpanId
| filter context.traceId like /./
| sort context.traceId, @timestamp asc`,
    timeRange: { value: 1, unit: 'hours' },
};

/**
 * Query to calculate end-to-end latency by trace
 */
export const calculateEndToEndLatency: InsightsQuery = {
    name: 'Calculate End-to-End Latency',
    description: 'Calculate total latency for requests by trace ID',
    query: `fields context.traceId, @timestamp, context.duration
| filter context.traceId like /./
| stats min(@timestamp) as start_time, max(@timestamp) as end_time, sum(context.duration) as total_duration by context.traceId
| fields context.traceId, total_duration
| sort total_duration desc
| limit 50`,
    timeRange: { value: 1, unit: 'hours' },
};

/**
 * Query to find failed traces
 */
export const findFailedTraces: InsightsQuery = {
    name: 'Find Failed Traces',
    description: 'Find traces that contain errors',
    query: `fields context.traceId, context.correlationId, context.service, error.name, error.message
| filter level = "ERROR" and context.traceId like /./
| stats count(*) as error_count by context.traceId, context.correlationId
| sort error_count desc
| limit 50`,
    timeRange: { value: 24, unit: 'hours' },
};

/**
 * Query to analyze service health by error rate
 */
export const analyzeServiceHealth: InsightsQuery = {
    name: 'Analyze Service Health',
    description: 'Calculate error rates and success rates by service',
    query: `fields context.service, level
| stats count(*) as total_requests, 
        sum(level = "ERROR") as error_count,
        sum(level != "ERROR") as success_count
        by context.service
| fields context.service, 
         total_requests, 
         error_count, 
         success_count,
         (error_count / total_requests * 100) as error_rate_percent
| sort error_rate_percent desc`,
    timeRange: { value: 1, unit: 'hours' },
};

/**
 * All available queries
 */
export const allQueries: InsightsQuery[] = [
    findLogsByTraceId,
    findLogsByCorrelationId,
    traceRequestAcrossServices,
    findErrorsWithTraceContext,
    analyzeServicePerformance,
    findSlowOperations,
    analyzeErrorPatterns,
    findLogsByUserId,
    analyzeRequestFlow,
    findOrphanedLogs,
    analyzeServiceDependencies,
    findConcurrentOperations,
    calculateEndToEndLatency,
    findFailedTraces,
    analyzeServiceHealth,
];

/**
 * Helper function to replace placeholders in queries
 */
export function prepareQuery(
    query: InsightsQuery,
    replacements: Record<string, string>
): string {
    let preparedQuery = query.query;

    for (const [placeholder, value] of Object.entries(replacements)) {
        preparedQuery = preparedQuery.replace(
            new RegExp(`<${placeholder}>`, 'g'),
            value
        );
    }

    return preparedQuery;
}

/**
 * Helper function to get query by name
 */
export function getQueryByName(name: string): InsightsQuery | undefined {
    return allQueries.find(q => q.name === name);
}

/**
 * Export query templates as a map for easy access
 */
export const queryTemplates = {
    findLogsByTraceId,
    findLogsByCorrelationId,
    traceRequestAcrossServices,
    findErrorsWithTraceContext,
    analyzeServicePerformance,
    findSlowOperations,
    analyzeErrorPatterns,
    findLogsByUserId,
    analyzeRequestFlow,
    findOrphanedLogs,
    analyzeServiceDependencies,
    findConcurrentOperations,
    calculateEndToEndLatency,
    findFailedTraces,
    analyzeServiceHealth,
};
