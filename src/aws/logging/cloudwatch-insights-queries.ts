/**
 * CloudWatch Insights Queries for Trace Correlation
 * 
 * Pre-defined queries for analyzing logs with trace correlation.
 * These queries can be used in the AWS CloudWatch Insights console
 * or programmatically via the CloudWatch Logs API.
 */

/**
 * Query to find all logs for a specific trace ID
 */
export const QUERY_LOGS_BY_TRACE_ID = `
fields @timestamp, @message, context.traceId, context.spanId, context.service, context.operation, level
| filter context.traceId = "<TRACE_ID>"
| sort @timestamp asc
`;

/**
 * Query to find all logs for a specific correlation ID
 */
export const QUERY_LOGS_BY_CORRELATION_ID = `
fields @timestamp, @message, context.correlationId, context.traceId, context.service, context.operation, level
| filter context.correlationId = "<CORRELATION_ID>"
| sort @timestamp asc
`;

/**
 * Query to find all logs for a specific user across all services
 */
export const QUERY_LOGS_BY_USER_ID = `
fields @timestamp, @message, context.userId, context.traceId, context.service, context.operation, level
| filter context.userId = "<USER_ID>"
| sort @timestamp desc
| limit 100
`;

/**
 * Query to find all error logs with trace correlation
 */
export const QUERY_ERROR_LOGS_WITH_TRACES = `
fields @timestamp, @message, context.traceId, context.spanId, context.service, context.operation, error.name, error.message
| filter level = "ERROR"
| sort @timestamp desc
| limit 100
`;

/**
 * Query to analyze request flow across services
 */
export const QUERY_REQUEST_FLOW = `
fields @timestamp, context.service, context.operation, context.traceId, context.spanId, context.parentSpanId, context.duration
| filter context.traceId = "<TRACE_ID>"
| sort @timestamp asc
`;

/**
 * Query to find slow operations with trace context
 */
export const QUERY_SLOW_OPERATIONS = `
fields @timestamp, context.service, context.operation, context.duration, context.traceId, context.userId
| filter context.duration > 1000
| sort context.duration desc
| limit 50
`;

/**
 * Query to analyze error rate by service
 */
export const QUERY_ERROR_RATE_BY_SERVICE = `
fields context.service, level
| filter level = "ERROR"
| stats count() as errorCount by context.service
| sort errorCount desc
`;

/**
 * Query to find all logs for a specific operation across services
 */
export const QUERY_LOGS_BY_OPERATION = `
fields @timestamp, @message, context.service, context.operation, context.traceId, context.userId, level
| filter context.operation = "<OPERATION_NAME>"
| sort @timestamp desc
| limit 100
`;

/**
 * Query to analyze cross-service call patterns
 */
export const QUERY_CROSS_SERVICE_CALLS = `
fields @timestamp, context.service as fromService, context.operation, context.traceId, context.spanId, context.parentSpanId
| filter context.parentSpanId != ""
| sort @timestamp asc
`;

/**
 * Query to find traces with errors
 */
export const QUERY_TRACES_WITH_ERRORS = `
fields context.traceId, context.service, context.operation, error.message, @timestamp
| filter level = "ERROR" and context.traceId != ""
| stats count() as errorCount by context.traceId, context.service
| sort errorCount desc
| limit 50
`;

/**
 * Query to analyze performance by service and operation
 */
export const QUERY_PERFORMANCE_BY_SERVICE_OPERATION = `
fields context.service, context.operation, context.duration
| filter context.duration > 0
| stats avg(context.duration) as avgDuration, max(context.duration) as maxDuration, min(context.duration) as minDuration, count() as requestCount by context.service, context.operation
| sort avgDuration desc
`;

/**
 * Query to find logs within a time range for a specific trace
 */
export const QUERY_TRACE_TIMELINE = `
fields @timestamp, context.service, context.operation, context.spanId, context.parentSpanId, level, @message
| filter context.traceId = "<TRACE_ID>"
| sort @timestamp asc
`;

/**
 * Query to analyze user journey across services
 */
export const QUERY_USER_JOURNEY = `
fields @timestamp, context.service, context.operation, context.traceId, context.correlationId, @message
| filter context.userId = "<USER_ID>"
| sort @timestamp asc
| limit 200
`;

/**
 * Query to find orphaned spans (spans without parent)
 */
export const QUERY_ORPHANED_SPANS = `
fields @timestamp, context.traceId, context.spanId, context.parentSpanId, context.service, context.operation
| filter context.spanId != "" and (context.parentSpanId = "" or context.parentSpanId is null)
| sort @timestamp desc
| limit 100
`;

/**
 * Query to analyze cold start impact
 */
export const QUERY_COLD_START_ANALYSIS = `
fields @timestamp, context.service, context.operation, context.duration, context.coldStart
| filter context.coldStart = true
| stats avg(context.duration) as avgColdStartDuration, count() as coldStartCount by context.service, context.operation
| sort avgColdStartDuration desc
`;

/**
 * Helper function to replace placeholders in queries
 */
export function buildQuery(queryTemplate: string, params: Record<string, string>): string {
    let query = queryTemplate;

    for (const [key, value] of Object.entries(params)) {
        query = query.replace(new RegExp(`<${key}>`, 'g'), value);
    }

    return query;
}

/**
 * Example usage:
 * 
 * const query = buildQuery(QUERY_LOGS_BY_TRACE_ID, {
 *   TRACE_ID: '1-5f8a1234-abcd1234efgh5678ijkl9012'
 * });
 * 
 * // Use the query with CloudWatch Logs Insights API
 * const result = await cloudWatchLogs.startQuery({
 *   logGroupName: '/aws/lambda/my-function',
 *   startTime: Date.now() - 3600000, // 1 hour ago
 *   endTime: Date.now(),
 *   queryString: query
 * });
 */

/**
 * Common query patterns for different use cases
 */
export const QUERY_PATTERNS = {
    // Debugging
    DEBUG_TRACE: QUERY_LOGS_BY_TRACE_ID,
    DEBUG_CORRELATION: QUERY_LOGS_BY_CORRELATION_ID,
    DEBUG_USER: QUERY_LOGS_BY_USER_ID,
    DEBUG_ERRORS: QUERY_ERROR_LOGS_WITH_TRACES,

    // Performance Analysis
    PERF_SLOW_OPS: QUERY_SLOW_OPERATIONS,
    PERF_BY_SERVICE: QUERY_PERFORMANCE_BY_SERVICE_OPERATION,
    PERF_COLD_START: QUERY_COLD_START_ANALYSIS,

    // Service Analysis
    SERVICE_ERRORS: QUERY_ERROR_RATE_BY_SERVICE,
    SERVICE_CALLS: QUERY_CROSS_SERVICE_CALLS,
    SERVICE_FLOW: QUERY_REQUEST_FLOW,

    // User Analysis
    USER_JOURNEY: QUERY_USER_JOURNEY,
    USER_ERRORS: QUERY_LOGS_BY_USER_ID,

    // Trace Analysis
    TRACE_TIMELINE: QUERY_TRACE_TIMELINE,
    TRACE_ERRORS: QUERY_TRACES_WITH_ERRORS,
    TRACE_ORPHANS: QUERY_ORPHANED_SPANS,
} as const;

/**
 * Query descriptions for documentation
 */
export const QUERY_DESCRIPTIONS = {
    [QUERY_LOGS_BY_TRACE_ID]: 'Find all logs for a specific trace ID across all services',
    [QUERY_LOGS_BY_CORRELATION_ID]: 'Find all logs for a specific correlation ID',
    [QUERY_LOGS_BY_USER_ID]: 'Find all logs for a specific user across all services',
    [QUERY_ERROR_LOGS_WITH_TRACES]: 'Find all error logs with trace correlation information',
    [QUERY_REQUEST_FLOW]: 'Analyze the flow of a request across services',
    [QUERY_SLOW_OPERATIONS]: 'Find operations that took longer than 1 second',
    [QUERY_ERROR_RATE_BY_SERVICE]: 'Analyze error rate by service',
    [QUERY_LOGS_BY_OPERATION]: 'Find all logs for a specific operation across services',
    [QUERY_CROSS_SERVICE_CALLS]: 'Analyze cross-service call patterns',
    [QUERY_TRACES_WITH_ERRORS]: 'Find traces that contain errors',
    [QUERY_PERFORMANCE_BY_SERVICE_OPERATION]: 'Analyze performance metrics by service and operation',
    [QUERY_TRACE_TIMELINE]: 'View the timeline of events for a specific trace',
    [QUERY_USER_JOURNEY]: 'Analyze a user\'s journey across services',
    [QUERY_ORPHANED_SPANS]: 'Find spans without parent spans (potential issues)',
    [QUERY_COLD_START_ANALYSIS]: 'Analyze the impact of Lambda cold starts on performance',
} as const;
